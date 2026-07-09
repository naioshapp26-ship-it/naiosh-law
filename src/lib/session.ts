"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

function readStoredSession(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(sessionKey);
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
    // Fall through and clear the corrupt value below.
  }

  window.localStorage.removeItem(sessionKey);
  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStoredSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !user && redirectIfMissing) {
      router.replace("/login");
    }
  }, [ready, user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        window.localStorage.removeItem(sessionKey);
        setUser(null);
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
