"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

const EXCLUDED_PATHS = new Set(["/", "/login", "/register", "/unauthorized"]);

function normalizePath(pathname: string) {
  const path = String(pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";
  return path;
}

function resolveFallbackUrl(pathname: string) {
  const path = normalizePath(pathname);
  if (path === "/app/dashboard" || path === "/app") return "/";
  if (path.startsWith("/app/")) return "/app/dashboard";
  if (path.includes("system-settings")) return "/app/dashboard";
  if (path.startsWith("/specialty") || path.startsWith("/app/specialty")) return "/";
  return "/app/dashboard";
}

function shouldShow(pathname: string) {
  const path = normalizePath(pathname);
  if (EXCLUDED_PATHS.has(path)) return false;
  if (typeof document !== "undefined" && document.body?.dataset?.hideGlobalBack === "true") {
    return false;
  }
  return true;
}

export function GlobalBackButton() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const find = () => setSlot(document.getElementById("naiosh-back-slot"));
    find();
    const timer = window.setTimeout(find, 50);
    return () => window.clearTimeout(timer);
  }, [mounted, pathname]);

  const goBack = useCallback(() => {
    const referrer = String(document.referrer || "");
    const sameOrigin = referrer.startsWith(window.location.origin);
    if (window.history.length > 1 && sameOrigin) {
      router.back();
      return;
    }
    router.push(resolveFallbackUrl(pathname));
  }, [pathname, router]);

  if (!mounted || !shouldShow(pathname)) return null;

  const inline = Boolean(slot);
  const button = (
    <button
      id="global-back-button"
      type="button"
      className={`global-back-button global-back-button--${inline ? "inline" : "floating"}`}
      aria-label="رجوع للصفحة السابقة"
      title="رجوع"
      onClick={goBack}
    >
      <span className="global-back-icon" aria-hidden="true">
        →
      </span>
      <span className="global-back-label">رجوع</span>
    </button>
  );

  return (
    <>
      <style>{GLOBAL_BACK_CSS}</style>
      {inline && slot ? createPortal(button, slot) : button}
    </>
  );
}

const GLOBAL_BACK_CSS = `
.global-back-button {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.55rem;
  background: #f8fafc;
  color: #64748b;
  font-family: var(--font-cairo), 'Cairo', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: none;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.global-back-button:hover {
  background: #fff;
  color: #991b1b;
  border-color: #fecaca;
}

.global-back-button:active {
  transform: scale(0.98);
}

.global-back-icon {
  font-size: 0.85rem;
  line-height: 1;
  font-weight: 800;
}

.global-back-button--inline {
  position: static;
  flex-shrink: 0;
  margin-inline-end: 0.5rem;
  z-index: 20;
}

.global-back-button--inline .global-back-label {
  display: none;
}

.global-back-button--floating {
  position: fixed;
  top: 0.85rem;
  left: 1rem;
  right: auto;
  z-index: 9990;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(185, 28, 28, 0.14);
  color: #991b1b;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
}

html[dir="rtl"] .global-back-button--floating {
  left: auto;
  right: 1rem;
}

/* داخل لوحة التطبيق: جنب المحتوى (بعيداً عن الشريط الجانبي يمين) */
html[dir="rtl"] body.has-app-shell .global-back-button--floating {
  right: auto;
  left: 1rem;
}

.global-back-button--floating .global-back-label {
  display: inline;
}

body.has-sticky-top-header .global-back-button--floating {
  top: 4.35rem;
}

#naiosh-back-slot {
  display: flex;
  align-items: center;
}

@media (min-width: 640px) {
  .global-back-button--inline {
    padding: 0.4rem 0.7rem;
    font-size: 0.75rem;
  }
  .global-back-button--inline .global-back-label {
    display: inline;
  }
}

@media (max-width: 640px) {
  .global-back-button--floating {
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.45rem 0.7rem;
  }
  html[dir="rtl"] .global-back-button--floating {
    left: auto;
    right: 0.75rem;
  }
  html[dir="rtl"] body.has-app-shell .global-back-button--floating {
    right: auto;
    left: 0.75rem;
  }
  body.has-sticky-top-header .global-back-button--floating {
    top: 4.15rem;
  }
}

body.global-back-hidden .global-back-button {
  display: none !important;
}
`;
