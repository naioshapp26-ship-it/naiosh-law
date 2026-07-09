"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

const sessionMaxAge = 60 * 60 * 24 * 7;

function readSessionCookie(): string | null {
  const encoded = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${sessionKey}=`))
    ?.split("=")[1];

  return encoded ? decodeURIComponent(encoded) : null;
}

export function writeStoredUser(user: SessionUser) {
  const value = JSON.stringify(user);
  window.localStorage.setItem(sessionKey, value);
  document.cookie = `${sessionKey}=${encodeURIComponent(value)}; path=/; max-age=${sessionMaxAge}; samesite=lax`;
}

export function clearStoredUser() {
  window.localStorage.removeItem(sessionKey);
  document.cookie = `${sessionKey}=; path=/; max-age=0; samesite=lax`;
}

function readStoredUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(sessionKey) ?? readSessionCookie();
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
      return {
        role: parsed.role,
        name: parsed.name,
        email: parsed.email,
      };
    }
  } catch {
    // Clear invalid demo sessions so a corrupt localStorage value cannot break the app.
  }

  clearStoredUser();
  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setUser(readStoredUser());
      setReady(true);
    };

    syncSession();
    window.addEventListener("storage", syncSession);

    return () => window.removeEventListener("storage", syncSession);
  }, []);

  useEffect(() => {
    if (ready && !user && redirectIfMissing) {
      router.replace("/login");
    }
  }, [ready, user, redirectIfMissing, router]);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
    setReady(true);
    router.replace("/login");
  }, [router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout,
    }),
    [user, ready, logout]
  );

  return api;
}
