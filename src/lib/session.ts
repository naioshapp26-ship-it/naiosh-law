"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = window.localStorage.getItem(sessionKey);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  });
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
