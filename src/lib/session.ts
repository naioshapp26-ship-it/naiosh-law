"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sessionStorageKey, type SessionUser } from "@/data/auth";

function readSessionMirror() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
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
      window.localStorage.removeItem(sessionStorageKey);
    }
  } catch {
    // Browser storage can be unavailable in private or locked-down contexts.
  }
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(() => readSessionMirror());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
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

  const api = useMemo(
    () => ({
      user,
      ready,
      logout: () => {
        writeSessionMirror(null);
        void fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
