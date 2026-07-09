"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionKey } from "@/data/auth";

export type SessionUser = {
  role: "admin" | "client";
  name: string;
  email: string;
};

const sessionChangedEvent = "naiosh-law:session-changed";

export function readStoredUser(): SessionUser | null {
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

export function saveSessionUser(user: SessionUser) {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  window.dispatchEvent(new Event(sessionChangedEvent));
}

export function clearSessionUser() {
  window.localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event(sessionChangedEvent));
  void fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => undefined);
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
    window.addEventListener(sessionChangedEvent, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(sessionChangedEvent, syncSession);
    };
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
        clearSessionUser();
        setUser(null);
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
