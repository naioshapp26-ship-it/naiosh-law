"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

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
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(sessionChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(sessionChangeEvent, onStoreChange);
  };
}

function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sessionChangeEvent));
  }
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

export function persistSession(user: SessionUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  notifySessionChange();
}

export function clearSession() {
  window.localStorage.removeItem(sessionKey);
  notifySessionChange();
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
      clearSession();
      return;
    }

    if (ready && !user && redirectIfMissing) {
      router.replace("/login");
    }
  }, [ready, rawSession, user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        clearSession();
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
