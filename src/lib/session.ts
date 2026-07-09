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
  const user = parseSessionUser(window.localStorage.getItem(sessionKey));
  if (!user) {
    window.localStorage.removeItem(sessionKey);
  }
  return user;
}

export function writeStoredSession(user: SessionUser): boolean {
  try {
    window.localStorage.setItem(sessionKey, JSON.stringify(user));
    window.dispatchEvent(new Event(sessionChangeEvent));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(sessionKey);
    window.dispatchEvent(new Event(sessionChangeEvent));
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
  window.addEventListener("storage", callback);
  window.addEventListener(sessionChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(sessionChangeEvent, callback);
  };
}

function getServerSessionSnapshot() {
  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeToSession, readStoredSession, getServerSessionSnapshot);
  const ready = true;

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
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
