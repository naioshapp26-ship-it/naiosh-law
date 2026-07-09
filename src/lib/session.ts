"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";
import { readStorageValue, removeStorageValue, writeStorageValue } from "@/lib/browser-storage";
import type { SessionUser } from "@/lib/auth-session";

const sessionChangeEvent = "naiosh-law-session-change";

type SessionSnapshot = string | null | undefined;

function getClientSessionSnapshot(): SessionSnapshot {
  if (typeof window === "undefined") {
    return undefined;
  }

  return readStorageValue(sessionKey);
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
  writeStorageValue(sessionKey, JSON.stringify(user));
  notifySessionChange();
}

export function clearStoredSession() {
  removeStorageValue(sessionKey);
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

export function useSession(redirectIfMissing = false, initialUser: SessionUser | null = null) {
  const router = useRouter();
  const [verifiedUser, setVerifiedUser] = useState<SessionUser | null>(initialUser);
  const [verified, setVerified] = useState(!redirectIfMissing || !!initialUser);
  const [verifiedRawSession, setVerifiedRawSession] = useState<string | null | undefined>(undefined);
  const trustedUserRef = useRef<SessionUser | null>(initialUser);
  const rawSession = useSyncExternalStore(
    subscribeToSessionChange,
    getClientSessionSnapshot,
    getServerSessionSnapshot
  );
  const hydrated = rawSession !== undefined;
  const cachedUser = useMemo(() => parseStoredSession(rawSession ?? null), [rawSession]);
  const ready =
    redirectIfMissing
      ? (!!initialUser && verified) || (hydrated && verified && verifiedRawSession === rawSession)
      : hydrated;
  const user = redirectIfMissing ? verifiedUser : cachedUser ?? initialUser;

  useEffect(() => {
    trustedUserRef.current = verifiedUser ?? cachedUser ?? initialUser;
  }, [cachedUser, initialUser, verifiedUser]);

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

    const controller = new AbortController();

    fetch("/api/auth/session", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setVerifiedRawSession(rawSession);
          setVerifiedUser(null);
          setVerified(true);
          clearStoredSession();
          router.replace(loginPathWithNext());
          return;
        }

        if (!response.ok) {
          const fallbackUser = trustedUserRef.current;
          if (fallbackUser) {
            setVerifiedUser(fallbackUser);
            setVerifiedRawSession(rawSession);
            setVerified(true);
          }
          return;
        }

        const payload = (await response.json()) as { user?: SessionUser };
        if (payload.user) {
          setVerifiedUser(payload.user);
          setVerifiedRawSession(rawSession);
          setVerified(true);

          if (JSON.stringify(payload.user) !== rawSession) {
            saveSession(payload.user);
          }
        } else {
          setVerifiedUser(null);
          setVerifiedRawSession(rawSession);
          clearStoredSession();
          router.replace(loginPathWithNext());
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const fallbackUser = trustedUserRef.current;
        if (fallbackUser) {
          setVerifiedUser(fallbackUser);
          setVerifiedRawSession(rawSession);
          setVerified(true);
          return;
        }

        setVerifiedUser(null);
        setVerifiedRawSession(rawSession);
        setVerified(true);
        router.replace(loginPathWithNext());
      });

    return () => controller.abort();
  }, [rawSession, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: async () => {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) {
          throw new Error("Logout failed.");
        }
        clearStoredSession();
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
