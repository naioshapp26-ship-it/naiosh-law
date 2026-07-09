"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SessionUser>;
  return (
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

function readSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(sessionKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isSessionUser(parsed)) return parsed;
  } catch {
    // Corrupted browser storage should not break route rendering.
  }

  window.localStorage.removeItem(sessionKey);
  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(() => readSessionUser());
  const ready = true;

  useEffect(() => {
    if (!user && redirectIfMissing) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        window.localStorage.removeItem(sessionKey);
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
