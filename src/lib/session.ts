"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";
import { normalizeSessionUser, parseSessionUser, type SessionUser } from "@/lib/session-types";

const sessionChangeEvent = "naiosh-law-session-change";
const initialSnapshot: SessionSnapshot = { user: null, ready: false, verified: false };
const listeners = new Set<() => void>();

type SessionSnapshot = {
  user: SessionUser | null;
  ready: boolean;
  verified: boolean;
};

let sessionSnapshot = initialSnapshot;
let verificationRequest: Promise<SessionFetchResult> | null = null;

export type { SessionUser };

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
  if (
    sessionSnapshot.user === next.user &&
    sessionSnapshot.ready === next.ready &&
    sessionSnapshot.verified === next.verified
  ) {
    return;
  }
  sessionSnapshot = next;
  emitSessionChange();
}

export function writeStoredSession(user: SessionUser, notify = true): boolean {
  try {
    window.localStorage.setItem(sessionKey, JSON.stringify(user));
    if (!notify) return true;

    sessionSnapshot = { user, ready: true, verified: true };
    window.dispatchEvent(new Event(sessionChangeEvent));
    emitSessionChange();
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
    if (!notify) return;

    sessionSnapshot = { user: null, ready: true, verified: false };
    window.dispatchEvent(new Event(sessionChangeEvent));
    emitSessionChange();
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
    const storedUser = readStoredSession();
    updateSessionSnapshot({
      user: storedUser,
      ready: !storedUser,
      verified: false,
    });
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
  return sessionSnapshot;
}

type SessionFetchResult =
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated" }
  | { status: "failed" };

async function fetchCurrentSession(): Promise<SessionFetchResult> {
  try {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (response.status === 401) return { status: "unauthenticated" };
    if (!response.ok) return { status: "failed" };

    const body = (await response.json()) as { user?: unknown };
    const user = normalizeSessionUser(body.user);
    return user ? { status: "authenticated", user } : { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}

function verifyCurrentSession() {
  verificationRequest ??= fetchCurrentSession().finally(() => {
    verificationRequest = null;
  });
  return verificationRequest;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const { user, ready, verified } = useSyncExternalStore(
    subscribeToSession,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );

  useEffect(() => {
    let cancelled = false;
    const optimisticUser = readStoredSession();

    if (!ready && optimisticUser && !user) {
      updateSessionSnapshot({ user: optimisticUser, ready: false, verified: false });
    }

    if (ready && verified) {
      return () => {
        cancelled = true;
      };
    }

    if (ready && !user && !optimisticUser) {
      return () => {
        cancelled = true;
      };
    }

    verifyCurrentSession()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "authenticated") {
          writeStoredSession(result.user, false);
          updateSessionSnapshot({ user: result.user, ready: true, verified: true });
          return;
        }

        if (result.status === "unauthenticated") {
          clearStoredSession(false);
          updateSessionSnapshot({ user: null, ready: true, verified: false });
          return;
        }

        clearStoredSession(false);
        updateSessionSnapshot({ user: null, ready: true, verified: false });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user, verified]);

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
      sessionVerified: verified,
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
    [user, ready, verified, router]
  );

  return api;
}
