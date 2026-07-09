"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sessionStorageKey, type SessionUser } from "@/data/auth";

const SESSION_RETRY_DELAYS_MS = [200, 500];

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

    removeSessionMirror();
    return null;
  } catch {
    removeSessionMirror();
    return null;
  }
}

function removeSessionMirror() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(sessionStorageKey);
  } catch {
    // Browser storage can be unavailable in private or locked-down contexts.
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
      removeSessionMirror();
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

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchSessionWithRetry() {
  let lastError: unknown;

  for (let attempt = 0; attempt <= SESSION_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (response.status < 500) {
        return response;
      }
      lastError = new Error("Session service returned a transient error.");
    } catch (error) {
      lastError = error;
    }

    const retryDelay = SESSION_RETRY_DELAYS_MS[attempt];
    if (retryDelay !== undefined) {
      await delay(retryDelay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Session validation failed.");
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        const response = await fetchSessionWithRetry();
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
          throw new Error("Session validation failed.");
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
