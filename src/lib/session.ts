"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isSessionUser, sessionStorageKey, type SessionUser } from "@/lib/session-shared";

const sessionChangedEvent = "naiosh-law:session-changed";

type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

function notifySessionChanged() {
  window.dispatchEvent(new Event(sessionChangedEvent));
}

function persistSessionUser(user: SessionUser) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(user));
}

function removeSessionUser() {
  window.localStorage.removeItem(sessionStorageKey);
}

export function readStoredUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (isSessionUser(parsed)) {
      return parsed;
    }

    removeSessionUser();
  } catch {
    try {
      removeSessionUser();
    } catch {
      // Storage can be unavailable in private browsing or hardened environments.
    }
  }

  return null;
}

export function saveSessionUser(user: SessionUser) {
  try {
    persistSessionUser(user);
  } catch {
    // The cookie remains the source of truth if localStorage is not writable.
  }
  notifySessionChanged();
}

export function clearSessionUser() {
  try {
    removeSessionUser();
  } catch {
    // Ignore storage failures during logout; the server cookie is cleared separately.
  }
  notifySessionChanged();
}

async function fetchSessionUser(): Promise<{ ok: true; user: SessionUser | null } | { ok: false }> {
  try {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) {
      return { ok: false };
    }

    const payload = (await response.json()) as { user?: unknown };
    return { ok: true, user: isSessionUser(payload.user) ? payload.user : null };
  } catch {
    return { ok: false };
  }
}

export async function loginSession(payload: {
  email?: string;
  password?: string;
  role?: "admin" | "client";
  demo?: boolean;
}): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { user?: unknown; error?: unknown };

    if (!response.ok || !isSessionUser(result.user)) {
      return {
        ok: false,
        error:
          typeof result.error === "string"
            ? result.error
            : "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
      };
    }

    saveSessionUser(result.user);
    return { ok: true, user: result.user };
  } catch {
    return { ok: false, error: "تعذر الاتصال بخدمة تسجيل الدخول." };
  }
}

export async function logoutSessionUser() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Local logout still proceeds when the network request fails.
  } finally {
    clearSessionUser();
  }
}

export function useSession(redirectIfMissing = false) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let syncVersion = 0;

    const syncSession = () => {
      const currentSync = ++syncVersion;
      const storedUser = readStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setReady(true);
      } else {
        setReady(false);
      }

      void fetchSessionUser().then((result) => {
        if (!active || currentSync !== syncVersion) {
          return;
        }

        if (!result.ok) {
          setReady(true);
          return;
        }

        if (result.user) {
          try {
            persistSessionUser(result.user);
          } catch {
            // The in-memory session still updates when storage is unavailable.
          }
        } else {
          try {
            removeSessionUser();
          } catch {
            // Ignore storage failures; the server session has already been checked.
          }
        }

        setUser(result.user);
        setReady(true);
      });
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(sessionChangedEvent, syncSession);

    return () => {
      active = false;
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
      logout: async () => {
        await logoutSessionUser();
        setUser(null);
        router.replace("/login");
      },
    }),
    [user, ready, router]
  );

  return api;
}
