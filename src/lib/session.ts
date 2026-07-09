"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

function getLoginRedirectHref() {
  if (typeof window === "undefined") {
    return "/login";
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  const loginUrl = new URL("/login", window.location.origin);

  if (nextPath.startsWith("/app")) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return `${loginUrl.pathname}${loginUrl.search}`;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [serverUser, setServerUser] = useState<SessionUser | null>(null);
  const [serverValidated, setServerValidated] = useState(!redirectIfMissing);
  const lastValidatedSession = useRef<SessionSnapshot>(undefined);
  const rawSession = useSyncExternalStore(
    subscribeToSessionChange,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );
  const localReady = rawSession !== undefined;
  const storedUser = useMemo(() => parseStoredSession(rawSession ?? null), [rawSession]);
  const ready = localReady && (!redirectIfMissing || serverValidated);
  const user = serverUser ?? storedUser;

  useEffect(() => {
    if (localReady && rawSession && !storedUser) {
      clearStoredSession();
    }
  }, [localReady, rawSession, storedUser]);

  useEffect(() => {
    if (!redirectIfMissing) {
      setServerValidated(true);
      return;
    }

    if (!localReady) {
      return;
    }

    if (lastValidatedSession.current === rawSession) {
      setServerValidated(true);
      return;
    }

    const controller = new AbortController();
    lastValidatedSession.current = rawSession;
    setServerValidated(false);

    fetch("/api/auth/session", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setServerUser(null);
          clearStoredSession();
          router.replace(getLoginRedirectHref());
          return;
        }

        const payload = (await response.json()) as { user?: SessionUser };
        if (payload.user) {
          const serializedUser = JSON.stringify(payload.user);

          setServerUser(payload.user);
          lastValidatedSession.current = serializedUser;

          if (rawSession !== serializedUser) {
            saveSession(payload.user);
          }
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setServerValidated(true);
        }
      });

    return () => controller.abort();
  }, [localReady, rawSession, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: async () => {
        clearStoredSession();
        setServerUser(null);

        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          clearStoredSession();
          router.replace("/login");
        }
      },
    }),
    [user, ready, router]
  );

  return api;
}
