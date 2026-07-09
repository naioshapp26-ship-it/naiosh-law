"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sessionStorageKey, type SessionUser } from "@/data/auth";

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    (user.role === "admin" || user.role === "client") &&
    typeof user.name === "string" &&
    typeof user.email === "string"
  );
}

export function clearSessionMirror() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(sessionStorageKey);
  } catch {
    // Browser storage can be unavailable in private or locked-down contexts.
  }
}

function readSessionMirror() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    clearSessionMirror();
    return null;
  }
}

function writeSessionMirror(user: SessionUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(user));
    } else {
      clearSessionMirror();
    }
  } catch {
    // Browser storage can be unavailable in private or locked-down contexts.
  }
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readSessionMirror();

    async function validateSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
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
          setUser(null);
          writeSessionMirror(null);
          setReady(true);
          if (redirectIfMissing) {
            const nextPath =
              typeof window === "undefined" || !window.location.search
                ? pathname
                : `${pathname}${window.location.search}`;
            router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          }
        }
      }
    }

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, redirectIfMissing, router]);

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        clearSessionMirror();
        void fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
