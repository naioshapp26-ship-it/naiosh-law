"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { demoUsers } from "@/data/auth";
import { BrandLogo } from "@/components/brand-logo";
import { DarkModeToggle } from "@/components/color-mode";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@naioshlaw.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "فشل تسجيل الدخول");
        setLoading(false);
        return;
      }

      window.location.assign("/app/dashboard");
    } catch {
      setError("تعذر الاتصال بالخادم — حاول مرة أخرى");
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "client") => {
    const user = demoUsers.find((u) => u.role === role)!;
    setEmail(user.email);
    setPassword(user.password);
    setError("");
  };

  return (
    <div className="erp-login-page">
      <div className="erp-login-bg" aria-hidden>
        <div className="erp-login-orb erp-login-orb-a" />
        <div className="erp-login-orb erp-login-orb-b" />
      </div>

      <div style={{ position: "fixed", top: "0.85rem", left: "1rem", zIndex: 50 }}>
        <DarkModeToggle />
      </div>

      <div className="erp-login-card">
        <Link href="/" className="erp-login-back">
          <span aria-hidden>→</span>
          <span>رجوع للواجهة</span>
        </Link>

        <div className="erp-login-header">
          <div className="erp-login-header-pattern" aria-hidden />
          <div className="erp-login-header-inner">
            <BrandLogo size={112} showText={false} variant="light" />
            <div className="erp-login-brand">{BRAND.name}</div>
            <p className="erp-login-tagline">تسجيل الدخول إلى حسابك القانوني</p>
          </div>
        </div>

        <div className="erp-login-body">
          {error ? (
            <div className="erp-login-alert" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="erp-login-form">
            <div>
              <label htmlFor="email" className="erp-login-label">
                البريد الإلكتروني
              </label>
              <div className="erp-login-field">
                <span className="erp-login-field-icon" aria-hidden>
                  ✉
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="admin@naioshlaw.com"
                  className="erp-login-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="erp-login-label">
                كلمة المرور
              </label>
              <div className="erp-login-field">
                <span className="erp-login-field-icon" aria-hidden>
                  🔒
                </span>
                <button
                  type="button"
                  className="erp-login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  aria-pressed={showPass}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="erp-login-input erp-login-input-pass"
                />
              </div>
            </div>

            <div className="erp-login-row">
              <label className="erp-login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>تذكرني</span>
              </label>
              <span className="erp-login-forgot">نسيت كلمة المرور؟</span>
            </div>

            <button type="submit" disabled={loading} className="erp-login-submit">
              {loading ? (
                <>
                  <span className="erp-login-spinner" aria-hidden />
                  جاري الدخول...
                </>
              ) : (
                <>
                  دخول النظام
                  <span aria-hidden>←</span>
                </>
              )}
            </button>
          </form>

          <div className="erp-login-divider">
            <span>دخول تجريبي سريع</span>
          </div>

          <div className="erp-login-demos">
            <button type="button" onClick={() => fillDemo("admin")} className="erp-login-demo">
              <span className="erp-login-demo-icon">🛡</span>
              <span>
                <strong>مدير النظام</strong>
                <small>admin@naioshlaw.com</small>
              </span>
            </button>
            <button type="button" onClick={() => fillDemo("client")} className="erp-login-demo">
              <span className="erp-login-demo-icon erp-login-demo-icon-alt">👤</span>
              <span>
                <strong>عميل تجريبي</strong>
                <small>client@naioshlaw.com</small>
              </span>
            </button>
          </div>

          <p className="erp-login-hint">
            هذا نظام تجريبي للعرض — استخدم الحسابات أعلاه للدخول الفوري
          </p>

          <div className="erp-login-footer">
            <BrandLogo size={40} showText={false} variant="dark" />
            <span>{BRAND.name}</span>
          </div>
        </div>
      </div>

      <style>{`
        .erp-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: #f8fafc;
          position: relative;
          font-family: var(--font);
        }
        .erp-login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .erp-login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
        }
        .erp-login-orb-a {
          top: -20%;
          right: -10%;
          width: 50%;
          height: 50%;
          background: rgba(195, 21, 42, 0.08);
        }
        .erp-login-orb-b {
          top: 40%;
          left: -10%;
          width: 40%;
          height: 40%;
          background: rgba(195, 21, 42, 0.12);
        }
        .erp-login-card {
          width: 100%;
          max-width: 28rem;
          background: #fff;
          border-radius: 1rem;
          box-shadow: 0 20px 50px -20px rgba(15, 23, 42, 0.25);
          overflow: hidden;
          z-index: 10;
          position: relative;
          border: 1px solid #f1f5f9;
        }
        .erp-login-back {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: rgba(255,255,255,0.95);
          padding: 0.4rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #4b5563;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .erp-login-back:hover {
          border-color: rgba(195,21,42,0.35);
          color: var(--primary);
        }
        .erp-login-header {
          background: var(--primary, #c3152a);
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .erp-login-header-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.3;
          background-image: radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 1.5px);
          background-size: 18px 18px;
        }
        .erp-login-header-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }
        .erp-login-brand {
          color: #fff;
          font-size: 1.65rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          margin-top: 0.35rem;
        }
        .erp-login-tagline {
          color: rgba(255,255,255,0.82);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .erp-login-body { padding: 2rem; }
        .erp-login-alert {
          margin-bottom: 1.25rem;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          background: rgba(195,21,42,0.06);
          border: 1px solid rgba(195,21,42,0.2);
          color: #c3152a;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .erp-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }
        .erp-login-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .erp-login-field { position: relative; }
        .erp-login-field-icon {
          position: absolute;
          inset-inline-end: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 0.9rem;
          pointer-events: none;
        }
        .erp-login-eye {
          position: absolute;
          inset-inline-start: 0.65rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: 0.95rem;
          padding: 0.25rem;
          line-height: 1;
        }
        .erp-login-eye:hover { color: var(--primary); }
        .erp-login-input {
          width: 100%;
          padding: 0.85rem 2.5rem 0.85rem 0.85rem;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          background: #f9fafb;
          color: #111827;
          font-family: var(--font);
          font-size: 0.9rem;
          outline: none;
          transition: box-shadow 0.15s, border-color 0.15s, background 0.15s;
        }
        .erp-login-input-pass { padding-inline-start: 2.5rem; }
        .erp-login-input:focus {
          background: #fff;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(195,21,42,0.15);
        }
        .erp-login-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .erp-login-remember {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.875rem;
          color: #4b5563;
          cursor: pointer;
        }
        .erp-login-forgot {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
          opacity: 0.85;
        }
        .erp-login-submit {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 1rem;
          border: none;
          border-radius: 0.75rem;
          background: var(--primary, #c3152a);
          color: #fff;
          font-family: var(--font);
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 20px -8px rgba(195,21,42,0.55);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .erp-login-submit:hover:not(:disabled) {
          background: var(--primary-dark, #a00f20);
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -8px rgba(195,21,42,0.6);
        }
        .erp-login-submit:disabled { opacity: 0.72; cursor: wait; }
        .erp-login-spinner {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          animation: erp-login-spin 0.8s linear infinite;
        }
        @keyframes erp-login-spin { to { transform: rotate(360deg); } }
        .erp-login-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0 1rem;
          color: #9ca3af;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .erp-login-divider::before,
        .erp-login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .erp-login-demos {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.65rem;
        }
        .erp-login-demo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          text-align: right;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          background: #fff;
          cursor: pointer;
          font-family: var(--font);
          transition: border-color 0.2s, background 0.2s;
        }
        .erp-login-demo:hover {
          border-color: var(--primary);
          background: rgba(195,21,42,0.04);
        }
        .erp-login-demo-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(195,21,42,0.1);
          color: var(--primary);
          flex-shrink: 0;
          font-size: 1rem;
        }
        .erp-login-demo-icon-alt {
          background: rgba(14,165,233,0.12);
          color: #0284c7;
        }
        .erp-login-demo strong {
          display: block;
          font-size: 0.85rem;
          color: #1f2937;
        }
        .erp-login-demo small {
          display: block;
          font-size: 0.72rem;
          color: #6b7280;
          margin-top: 0.15rem;
        }
        .erp-login-hint {
          text-align: center;
          color: #9ca3af;
          font-size: 0.75rem;
          margin-top: 1.25rem;
          line-height: 1.6;
        }
        .erp-login-footer {
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          font-size: 1rem;
          font-weight: 900;
          color: #374151;
        }
        body.dark-mode .erp-login-page { background: #0f0f0f; }
        body.dark-mode .erp-login-card { background: #1a1a1a; border-color: #2a2a2a; }
        body.dark-mode .erp-login-body { background: #1a1a1a; }
        body.dark-mode .erp-login-label,
        body.dark-mode .erp-login-demo strong,
        body.dark-mode .erp-login-footer { color: #f3f4f6; }
        body.dark-mode .erp-login-input {
          background: #111;
          border-color: #333;
          color: #f3f4f6;
        }
        body.dark-mode .erp-login-demo {
          background: #141414;
          border-color: #2a2a2a;
        }
      `}</style>
    </div>
  );
}
