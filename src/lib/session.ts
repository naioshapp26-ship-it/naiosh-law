"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sessionStorageKey, type SessionUser } from "@/data/auth";

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SessionUser>;
  return (
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}

export function readSessionMirror() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (isSessionUser(parsed)) {
      return parsed;
    }

    window.localStorage.removeItem(sessionStorageKey);
    return null;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

export function writeSessionMirror(user: SessionUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(sessionStorageKey);
    }
  } catch {
    // Browser storage can be unavailable in private or locked-down contexts.
  }
}

export async function clearServerSession() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Logout request failed.");
  }
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const mirroredUser = readSessionMirror();
      if (mirroredUser && !cancelled) {
        setUser(mirroredUser);
        setReady(true);
      }

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
            writeSessionMirror(null);
            setReady(true);
            if (redirectIfMissing) {
              router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            }
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Session is missing or expired.");
        }

        const data = (await response.json()) as { user?: SessionUser };
        if (!data.user) {
          throw new Error("Session response did not include a user.");
        }

        if (!cancelled) {
          setUser(data.user);
          writeSessionMirror(data.user);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          const latestMirror = readSessionMirror();
          setUser(latestMirror);
          setReady(true);
          if (!latestMirror && redirectIfMissing) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          }
        }
      }
    }

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, redirectIfMissing, router]);

  const logout = useCallback(async () => {
    writeSessionMirror(null);
    try {
      await clearServerSession();
    } finally {
      router.replace("/login");
      router.refresh();
    }
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
