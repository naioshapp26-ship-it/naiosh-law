"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";
import type { SessionUser } from "@/lib/auth-session";

const sessionChangeEvent = "naiosh-law-session-change";
const sessionVerificationRetries = [250, 750];
const sessionVerificationMaxAgeMs = 60 * 1000;

type SessionSnapshot = string | null | undefined;
type VerifiedSessionCache = {
  rawSession: string;
  user: SessionUser;
  verifiedAt: number;
};

let verifiedSessionCache: VerifiedSessionCache | null = null;

function getClientSessionSnapshot(): SessionSnapshot {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage.getItem(sessionKey);
  } catch {
    return null;
  }
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

function serializeSession(user: SessionUser) {
  return JSON.stringify(user);
}

function getFreshVerifiedSession(rawSession: SessionSnapshot) {
  if (
    rawSession &&
    verifiedSessionCache?.rawSession === rawSession &&
    Date.now() - verifiedSessionCache.verifiedAt < sessionVerificationMaxAgeMs
  ) {
    return verifiedSessionCache.user;
  }

  return null;
}

function cacheVerifiedSession(rawSession: SessionSnapshot, user: SessionUser) {
  if (!rawSession) {
    return;
  }

  verifiedSessionCache = {
    rawSession,
    user,
    verifiedAt: Date.now(),
  };
}

export function saveSession(user: SessionUser) {
  const serializedUser = serializeSession(user);

  try {
    window.localStorage.setItem(sessionKey, serializedUser);
  } catch {
    // The signed cookie remains the source of truth when browser storage is unavailable.
  }
  cacheVerifiedSession(serializedUser, user);
  notifySessionChange();
}

export function clearStoredSession() {
  try {
    window.localStorage.removeItem(sessionKey);
  } catch {
    // Ignore storage errors so logout/session validation can still complete.
  }
  verifiedSessionCache = null;
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

function loginPathWithNext() {
  if (typeof window === "undefined") {
    return "/login";
  }

  const next = `${window.location.pathname}${window.location.search}`;
  return next.startsWith("/app") ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

function waitForRetry(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(resolve, delayMs);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

async function fetchSessionWithRetry(signal: AbortSignal) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= sessionVerificationRetries.length; attempt += 1) {
    try {
      return await fetch("/api/auth/session", {
        cache: "no-store",
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      lastError = error;
      const delay = sessionVerificationRetries[attempt];
      if (delay === undefined) {
        break;
      }

      await waitForRetry(delay, signal);
    }
  }

  throw lastError;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [verifiedUser, setVerifiedUser] = useState<SessionUser | null>(null);
  const [verified, setVerified] = useState(!redirectIfMissing);
  const [verifiedRawSession, setVerifiedRawSession] = useState<string | null | undefined>(undefined);
  const rawSession = useSyncExternalStore(
    subscribeToSessionChange,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );
  const hydrated = rawSession !== undefined;
  const cachedUser = useMemo(() => parseStoredSession(rawSession ?? null), [rawSession]);
  const reusableVerifiedUser = useMemo(() => getFreshVerifiedSession(rawSession), [rawSession]);
  const user = redirectIfMissing ? verifiedUser ?? reusableVerifiedUser ?? cachedUser : cachedUser;
  const sessionVerified =
    !!rawSession &&
    !!user &&
    verifiedSessionCache?.rawSession === rawSession &&
    verifiedSessionCache.user.email === user.email &&
    verifiedSessionCache.user.role === user.role;
  const ready =
    hydrated &&
    (!redirectIfMissing ||
      !!user ||
      (verified && verifiedRawSession === rawSession));

  useEffect(() => {
    if (rawSession !== undefined && rawSession && !cachedUser) {
      clearStoredSession();
      return;
    }

  }, [rawSession, cachedUser]);

  useEffect(() => {
    if (rawSession === undefined || !redirectIfMissing) {
      return;
    }

    const reusableSession = getFreshVerifiedSession(rawSession);
    if (reusableSession) {
      return;
    }

    const controller = new AbortController();

    fetchSessionWithRetry(controller.signal)
      .then(async (response) => {
        if (!response.ok) {
          setVerifiedUser(null);
          setVerified(false);
          setVerifiedRawSession(rawSession);
          clearStoredSession();
          router.replace(loginPathWithNext());
          return;
        }

        const payload = (await response.json()) as { user?: SessionUser };
        if (payload.user) {
          setVerifiedUser(payload.user);
          setVerifiedRawSession(rawSession);
          setVerified(true);
          cacheVerifiedSession(rawSession, payload.user);

          if (serializeSession(payload.user) !== rawSession) {
            saveSession(payload.user);
          }
        } else {
          setVerifiedUser(null);
          setVerified(false);
          setVerifiedRawSession(rawSession);
          clearStoredSession();
          router.replace(loginPathWithNext());
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setVerifiedUser(null);
        setVerified(false);
        setVerifiedRawSession(rawSession);
        clearStoredSession();
        router.replace(loginPathWithNext());
      });

    return () => controller.abort();
  }, [cachedUser, rawSession, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      sessionVerified,
      logout: async () => {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) {
          throw new Error("Logout failed.");
        }
        clearStoredSession();
        router.replace("/login");
      },
    }),
    [user, ready, sessionVerified, router]
  );

  return api;
}
