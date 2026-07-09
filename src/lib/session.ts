"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sessionStorageKey, type SessionUser } from "@/data/auth";

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
    return raw ? (JSON.parse(raw) as SessionUser) : null;
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
  const [user, setUser] = useState<SessionUser | null>(() => readSessionMirror());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mirroredUser = readSessionMirror();

    async function validateSession() {
      let receivedResponse = false;
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        receivedResponse = true;
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
          const canPreserveMirror = !!mirroredUser && !receivedResponse;
          if (!canPreserveMirror) {
            setUser(null);
            writeSessionMirror(null);
          }
          setReady(true);
          if (redirectIfMissing && !canPreserveMirror) {
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
