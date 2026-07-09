"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole =
  | "admin"
  | "lawyer"
  | "consultant"
  | "judge"
  | "client"
  | "industrial_agent"
  | "employee";

export type SessionUser = {
  role: UserRole;
  name: string;
  email: string;
};

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data.user as SessionUser;
      })
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setReady(true);
        if (!u && redirectIfMissing) router.replace("/login");
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
          if (redirectIfMissing) router.replace("/login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}

export function canWriteRole(role: UserRole) {
  return ["admin", "lawyer", "consultant", "industrial_agent", "employee"].includes(role);
}
