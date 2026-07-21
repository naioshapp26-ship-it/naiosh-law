"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { DarkModeToggle } from "@/components/color-mode";
import { BRAND } from "@/lib/brand";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [office, setOffice] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage("تم استلام طلب إنشاء الحساب. يمكنك الدخول الآن بالحساب التجريبي أو التواصل لتفعيل مكتبك.");
  };

  return (
    <div className="reg-page">
      <div style={{ position: "fixed", top: "0.85rem", left: "1rem", zIndex: 50 }}>
        <DarkModeToggle />
      </div>
      <div className="reg-card">
        <Link href="/" className="reg-back">
          → رجوع للواجهة
        </Link>
        <div className="reg-header">
          <BrandLogo size={88} showText={false} variant="light" />
          <div className="reg-brand">{BRAND.name}</div>
          <p>إنشاء حساب جديد في المنظومة القانونية</p>
        </div>
        <form className="reg-body" onSubmit={onSubmit}>
          <label>
            الاسم الكامل
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="أ. محمد" />
          </label>
          <label>
            اسم المكتب (اختياري)
            <input value={office} onChange={(e) => setOffice(e.target.value)} placeholder="مكتب ..." />
          </label>
          <label>
            البريد الإلكتروني
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@naioshlaw.com" />
          </label>
          <label>
            كلمة المرور
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </label>
          {message ? <p className="reg-msg">{message}</p> : null}
          <button type="submit">إنشاء الحساب</button>
          <p className="reg-foot">
            لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
            {" · "}
            <Link href="/rent-system">استأجر النظام الآن</Link>
          </p>
        </form>
      </div>
      <style>{`
        .reg-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;background:#f8fafc;font-family:var(--font);position:relative}
        .reg-card{width:100%;max-width:28rem;background:#fff;border-radius:1rem;box-shadow:0 20px 50px -20px rgba(15,23,42,.25);overflow:hidden;border:1px solid #f1f5f9;position:relative}
        .reg-back{position:absolute;top:.75rem;left:.75rem;z-index:2;background:rgba(255,255,255,.95);border:1px solid #e5e7eb;border-radius:.5rem;padding:.4rem .65rem;font-size:.75rem;font-weight:700;color:#4b5563;text-decoration:none}
        .reg-header{background:var(--primary,#c3152a);padding:2rem;text-align:center;color:#fff}
        .reg-brand{font-size:1.5rem;font-weight:900;margin-top:.4rem}
        .reg-header p{margin:.35rem 0 0;opacity:.85;font-size:.875rem}
        .reg-body{padding:1.5rem;display:grid;gap:0.9rem}
        .reg-body label{display:grid;gap:.4rem;font-size:.875rem;font-weight:700;color:#374151}
        .reg-body input{border:1px solid #d1d5db;border-radius:.75rem;padding:.85rem;background:#f9fafb;font-family:inherit}
        .reg-body button{width:100%;border:0;border-radius:.75rem;padding:.85rem;background:var(--primary,#c3152a);color:#fff;font-weight:800;font-family:inherit;cursor:pointer}
        .reg-msg{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);color:#166534;border-radius:.75rem;padding:.75rem;font-size:.85rem;font-weight:600}
        .reg-foot{text-align:center;color:#6b7280;font-size:.8rem}
        .reg-foot a{color:var(--primary,#c3152a);font-weight:800;text-decoration:none}
      `}</style>
    </div>
  );
}
