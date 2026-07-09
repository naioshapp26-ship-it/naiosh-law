"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

const roles = new Set<SessionUser["role"]>(["admin", "client"]);
const sessionChangeEvent = "naiosh-law-session-change";
const initialSnapshot: SessionSnapshot = { user: null, ready: false };
const listeners = new Set<() => void>();

type SessionSnapshot = {
  user: SessionUser | null;
  ready: boolean;
};

let sessionSnapshot = initialSnapshot;
let hydratedFromStorage = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSessionUser(raw: string | null): SessionUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      isRecord(parsed) &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      roles.has(parsed.role as SessionUser["role"])
    ) {
      return {
        role: parsed.role as SessionUser["role"],
        name: parsed.name,
        email: parsed.email,
      };
    }
  } catch {
    // Invalid demo-session data should fail closed instead of crashing render.
  }

  return null;
}

export function readStoredSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const user = parseSessionUser(window.localStorage.getItem(sessionKey));
    if (!user) {
      window.localStorage.removeItem(sessionKey);
    }
    return user;
  } catch {
    return null;
  }
}

function emitSessionChange() {
  listeners.forEach((listener) => listener());
}

function updateSessionSnapshot(next: SessionSnapshot) {
  if (sessionSnapshot.user === next.user && sessionSnapshot.ready === next.ready) return;
  sessionSnapshot = next;
  emitSessionChange();
}

export function writeStoredSession(user: SessionUser, notify = true): boolean {
  try {
    window.localStorage.setItem(sessionKey, JSON.stringify(user));
    sessionSnapshot = { user, ready: true };
    if (notify) {
      window.dispatchEvent(new Event(sessionChangeEvent));
      emitSessionChange();
    }
    return true;
  } catch {
    return false;
  }
}

export function clearStoredSession(notify = true) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(sessionKey);
    } catch {
      // Private browsing or storage policy failures should not block logout.
    }
    sessionSnapshot = { user: null, ready: true };
    if (notify) {
      window.dispatchEvent(new Event(sessionChangeEvent));
      emitSessionChange();
    }
  }
}

export function getSafeAppPath(value: string | null | undefined) {
  if (!value) return "/app/dashboard";
  if (!value.startsWith("/app") || value.startsWith("//") || value.includes("://")) {
    return "/app/dashboard";
  }
  return value;
}

function subscribeToSession(callback: () => void) {
  listeners.add(callback);
  const handleExternalChange = () => {
    updateSessionSnapshot({ user: readStoredSession(), ready: true });
  };
  window.addEventListener("storage", handleExternalChange);
  window.addEventListener(sessionChangeEvent, handleExternalChange);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleExternalChange);
    window.removeEventListener(sessionChangeEvent, handleExternalChange);
  };
}

function getServerSessionSnapshot() {
  return initialSnapshot;
}

function getClientSessionSnapshot() {
  if (!hydratedFromStorage && typeof window !== "undefined") {
    hydratedFromStorage = true;
    sessionSnapshot = { user: readStoredSession(), ready: false };
  }
  return sessionSnapshot;
}

async function fetchCurrentSession(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) return null;

  const body = (await response.json()) as { user?: unknown };
  if (!isRecord(body.user)) return null;
  return parseSessionUser(JSON.stringify(body.user));
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const { user, ready } = useSyncExternalStore(
    subscribeToSession,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );

  useEffect(() => {
    let cancelled = false;
    const optimisticUser = readStoredSession();
    updateSessionSnapshot({ user: optimisticUser, ready: false });

    fetchCurrentSession()
      .then((verifiedUser) => {
        if (cancelled) return;
        if (verifiedUser) {
          writeStoredSession(verifiedUser, false);
          updateSessionSnapshot({ user: verifiedUser, ready: true });
          return;
        }
        clearStoredSession(false);
        updateSessionSnapshot({ user: null, ready: true });
      })
      .catch(() => {
        if (cancelled) return;
        updateSessionSnapshot({ user: optimisticUser, ready: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && !user && redirectIfMissing) {
      const next = getSafeAppPath(`${window.location.pathname}${window.location.search}`);
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [ready, user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        clearStoredSession();
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        }).finally(() => {
          router.replace("/login");
        });
      },
    }),
    [user, ready, router]
  );

  return api;
}
