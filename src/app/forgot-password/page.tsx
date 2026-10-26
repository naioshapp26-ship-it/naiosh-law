"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND } from "@/lib/brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devPath, setDevPath] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setDevPath("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      setMessage(json.message || "إذا كان البريد مسجلاً لدينا، ستصلك التعليمات.");
      if (json.devResetPath) setDevPath(String(json.devResetPath));
    } catch {
      setMessage("إذا كان البريد مسجلاً لدينا، ستصلك التعليمات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-card">
        <Link href="/login" className="reg-back">
          → رجوع لتسجيل الدخول
        </Link>
        <div className="reg-header">
          <BrandLogo size={72} showText={false} variant="light" />
          <div className="reg-brand">{BRAND.name}</div>
          <p>استعادة كلمة المرور</p>
        </div>
        <form className="reg-body" onSubmit={onSubmit}>
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              autoComplete="email"
            />
          </label>
          {message ? <p className="reg-msg">{message}</p> : null}
          {devPath ? (
            <p className="reg-msg">
              معاينة تطوير فقط:{" "}
              <Link href={devPath} style={{ fontWeight: 800 }}>
                فتح رابط إعادة التعيين
              </Link>
            </p>
          ) : null}
          <button type="submit" disabled={loading}>
            {loading ? "جاري الإرسال…" : "إرسال تعليمات الاستعادة"}
          </button>
        </form>
      </div>
      <style>{`
        .reg-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;background:#F5F1E8;font-family:var(--font)}
        .reg-card{width:100%;max-width:28rem;background:#fff;border-radius:1rem;box-shadow:0 20px 50px -20px rgba(15,23,42,.25);overflow:hidden;border:1px solid #f1f5f9;position:relative}
        .reg-back{position:absolute;top:.75rem;left:.75rem;z-index:2;background:rgba(255,255,255,.95);border:1px solid #e5e7eb;border-radius:.5rem;padding:.4rem .65rem;font-size:.75rem;font-weight:700;color:#4b5563;text-decoration:none}
        .reg-header{background:#101D32;padding:2rem;text-align:center;color:#fff}
        .reg-brand{font-size:1.5rem;font-weight:900;margin-top:.4rem}
        .reg-header p{margin:.35rem 0 0;opacity:.85;font-size:.875rem}
        .reg-body{padding:1.5rem;display:grid;gap:0.9rem}
        .reg-body label{display:grid;gap:.4rem;font-size:.875rem;font-weight:700;color:#374151}
        .reg-body input{border:1px solid #d1d5db;border-radius:.75rem;padding:.85rem;background:#f9fafb;font-family:inherit}
        .reg-body button{width:100%;border:0;border-radius:.75rem;padding:.85rem;background:#101D32;color:#fff;font-weight:800;font-family:inherit;cursor:pointer}
        .reg-msg{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);color:#166534;border-radius:.75rem;padding:.75rem;font-size:.85rem;font-weight:600}
      `}</style>
    </div>
  );
}
