"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { readStorageItem, removeStorageItem, writeStorageItem } from "@/lib/browser-storage";
import {
  isSessionUser,
  sessionStorageKey,
  type SessionUser,
} from "@/lib/session-shared";

export type { SessionUser } from "@/lib/session-shared";

const sessionChangedEvent = "naiosh-law:session-changed";

type SessionResponse = {
  ok: boolean;
  user?: SessionUser;
};

export function readStoredUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = readStorageItem(sessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isSessionUser(parsed)) {
      return {
        role: parsed.role,
        name: parsed.name,
        email: parsed.email,
      };
    }
  } catch {
    // Clear invalid demo sessions so a corrupt localStorage value cannot break the app.
  }

  removeStorageItem(sessionStorageKey);
  return null;
}

export function saveSessionUser(user: SessionUser) {
  writeStorageItem(sessionStorageKey, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sessionChangedEvent));
  }
}

export async function clearSessionUser() {
  removeStorageItem(sessionStorageKey);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sessionChangedEvent));
  }

  try {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
  } catch {
    // Local UI state is already cleared; navigation should still continue if the network drops.
  }
}

export function useSession(redirectIfMissing = false, initialUser: SessionUser | null = null) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [ready, setReady] = useState(Boolean(initialUser));

  useEffect(() => {
    let active = true;

    const syncSession = () => {
      if (!active) {
        return;
      }
      const storedUser = readStoredUser();
      setUser(storedUser ?? initialUser);
      if (storedUser ?? initialUser) {
        setReady(true);
      }
    };

    const validateCookieSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = (await response.json()) as SessionResponse;

        if (!active) {
          return;
        }

        if (response.ok && result.ok && result.user) {
          writeStorageItem(sessionStorageKey, JSON.stringify(result.user));
          setUser(result.user);
        } else {
          removeStorageItem(sessionStorageKey);
          setUser(null);
        }
      } catch {
        if (active) {
          removeStorageItem(sessionStorageKey);
          setUser(null);
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    syncSession();
    void validateCookieSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(sessionChangedEvent, syncSession);

    return () => {
      active = false;
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(sessionChangedEvent, syncSession);
    };
  }, [initialUser]);

  useEffect(() => {
    if (ready && !user && redirectIfMissing) {
      router.replace("/login");
    }
  }, [ready, user, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: async () => {
        await clearSessionUser();
        setUser(null);
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
