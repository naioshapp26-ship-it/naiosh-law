"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";
import type { SessionUser } from "@/lib/auth-session";

const sessionChangeEvent = "naiosh-law-session-change";

type SessionSnapshot = string | null | undefined;

function getClientSessionSnapshot(): SessionSnapshot {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(sessionKey);
}

function getServerSessionSnapshot(): SessionSnapshot {
  return undefined;
}

function subscribeToSessionChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(sessionChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(sessionChangeEvent, onStoreChange);
  };
}

function notifySessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(sessionChangeEvent));
}

export function saveSession(user: SessionUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  notifySessionChange();
}

export function clearStoredSession() {
  window.localStorage.removeItem(sessionKey);
  notifySessionChange();
}

function parseStoredSession(raw: string | null): SessionUser | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (
      (parsed.role === "admin" || parsed.role === "client") &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string"
    ) {
      return parsed as SessionUser;
    }
  } catch {
    return null;
  }

  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const rawSession = useSyncExternalStore(
    subscribeToSessionChange,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );
  const ready = rawSession !== undefined;
  const user = useMemo(() => parseStoredSession(rawSession ?? null), [rawSession]);

  useEffect(() => {
    if (ready && rawSession && !user) {
      clearStoredSession();
      return;
    }

    if (ready && !user && redirectIfMissing) {
      router.replace("/login");
    }
  }, [ready, rawSession, user, redirectIfMissing, router]);

  useEffect(() => {
    if (!ready || !user || !redirectIfMissing) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/auth/session", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          clearStoredSession();
          router.replace("/login");
          return;
        }

        const payload = (await response.json()) as { user?: SessionUser };
        if (payload.user) {
          saveSession(payload.user);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      });

    return () => controller.abort();
  }, [ready, user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        clearStoredSession();
        void fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
