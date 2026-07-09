"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

function readStoredUser(): SessionUser | null {
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
      return {
        role: parsed.role,
        name: parsed.name,
        email: parsed.email,
      };
    }
  } catch {
    // Clear invalid demo sessions so a corrupt localStorage value cannot break the app.
  }

  window.localStorage.removeItem(sessionKey);
  return null;
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(readStoredUser);
  const ready = true;

  useEffect(() => {
    if (!user && redirectIfMissing) {
      router.replace("/login");
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
