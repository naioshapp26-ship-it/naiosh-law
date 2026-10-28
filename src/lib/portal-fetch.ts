"use client";

/**
 * Shared portal client fetch: credentials included, 401 → clear session + redirect to login.
 * Never leave pages stuck on "جاري التحميل" after session expiry.
 */

export class PortalAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "PortalAuthError";
    this.status = status;
  }
}

let redirectingToLogin = false;

export function forcePortalLogin(message?: string) {
  if (typeof window === "undefined") return;
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  const q = message ? `?reason=${encodeURIComponent(message)}` : "";
  // Fire-and-forget logout to clear httpOnly cookie, then hard navigate
  void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
    window.location.assign(`/login${q || "?reason=session"}`);
  });
}

export async function portalFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const external = init?.signal;
  const onAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: {
        ...(init?.headers || {}),
      },
    });
  } catch (e) {
    clearTimeout(timer);
    if (external) external.removeEventListener("abort", onAbort);
    throw e;
  }
  clearTimeout(timer);
  if (external) external.removeEventListener("abort", onAbort);

  if (res.status === 401) {
    let message = "انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجددًا";
    try {
      const body = await res.clone().json();
      if (body?.error) message = String(body.error);
    } catch {
      /* ignore */
    }
    forcePortalLogin(message);
    throw new PortalAuthError(message, 401);
  }
  return res;
}

export async function portalJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; error: string; data?: T }> {
  try {
    const res = await portalFetch(input, init);
    let data: T | undefined;
    try {
      data = (await res.json()) as T;
    } catch {
      data = undefined;
    }
    if (!res.ok) {
      const err =
        data && typeof data === "object" && data !== null && "error" in data
          ? String((data as { error?: unknown }).error || "خطأ")
          : `خطأ ${res.status}`;
      return { ok: false, status: res.status, error: err, data };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (e) {
    if (e instanceof PortalAuthError) {
      return { ok: false, status: 401, error: e.message };
    }
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "تعذر الاتصال بالخادم",
    };
  }
}
