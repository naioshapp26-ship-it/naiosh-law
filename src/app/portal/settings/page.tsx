"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { useSession } from "@/lib/session";

export default function PortalSettingsPage() {
  const { logout } = useSession();
  const [demo, setDemo] = useState(false);
  const [prefs, setPrefs] = useState({
    cases: true,
    sessions: true,
    documents: true,
    invoices: true,
    messages: true,
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch("/api/portal/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((p) => {
        setDemo(Boolean(p.profile?.isDemo));
        if (p.profile?.notificationPrefs) setPrefs({ ...prefs, ...p.profile.notificationPrefs });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPwErr(json.error || "تعذر تغيير كلمة المرور");
        return;
      }
      setPwMsg(json.message || "تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch {
      setPwErr("تعذر الاتصال بالخادم");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <PortalShell title="الإعدادات" demoBanner={demo}>
      <section className="portal-card">
        <h2>تفضيلات الإشعارات</h2>
        <div className="portal-form">
          {Object.entries(prefs).map(([key, value]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
              <span>
                {key === "cases"
                  ? "تحديثات القضايا"
                  : key === "sessions"
                    ? "تذكير المواعيد"
                    : key === "documents"
                      ? "المستندات المطلوبة"
                      : key === "invoices"
                        ? "الفواتير"
                        : "الرسائل"}
              </span>
            </label>
          ))}
        </div>
        <p style={{ color: "#526071", fontWeight: 600 }}>
          الحفظ الدائم لتفضيلات الحسابات الحقيقية عبر صفحة الملف الشخصي. الحساب التجريبي للقراءة فقط.
        </p>
      </section>

      <section className="portal-card">
        <h2>إدارة الحساب والأمان</h2>
        <div className="portal-actions">
          <Link className="portal-btn ghost" href="/portal/profile">
            تعديل البيانات
          </Link>
          <button
            type="button"
            className="portal-btn ghost"
            disabled={demo}
            title={demo ? "غير متاح للتجريبي" : undefined}
            onClick={() => {
              setShowPasswordForm((v) => !v);
              setPwErr("");
              setPwMsg("");
            }}
          >
            تغيير كلمة المرور
          </button>
          <button
            type="button"
            className="portal-btn primary"
            onClick={async () => {
              if (!demo) {
                await fetch("/api/auth/invalidate-sessions", { method: "POST", credentials: "include" }).catch(
                  () => null
                );
              }
              await logout();
            }}
          >
            تسجيل الخروج من كل الأجهزة
          </button>
        </div>

        {pwMsg ? <p style={{ marginTop: "0.85rem", color: "#166534", fontWeight: 700 }}>{pwMsg}</p> : null}
        {pwErr ? <p style={{ marginTop: "0.85rem", color: "#b91c1c", fontWeight: 700 }}>{pwErr}</p> : null}

        {showPasswordForm && !demo ? (
          <form className="portal-form" style={{ marginTop: "1rem" }} onSubmit={onChangePassword}>
            <h2>تغيير كلمة المرور</h2>
            <label>
              كلمة المرور الحالية
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </label>
            <label>
              كلمة المرور الجديدة
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <label>
              تأكيد كلمة المرور الجديدة
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <p style={{ color: "#526071", fontSize: "0.85rem", fontWeight: 600 }}>
              يجب ألا تقل عن 8 أحرف وتتضمن أحرفًا وأرقامًا. بعد الحفظ تُنهى الجلسات الأخرى تلقائيًا.
            </p>
            <button className="portal-btn primary" type="submit" disabled={pwLoading}>
              {pwLoading ? "جاري الحفظ…" : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        ) : null}

        <p style={{ marginTop: "0.85rem", color: "#526071", fontWeight: 600 }}>
          الخصوصية: بياناتك القانونية لا تُعرض علناً. لا يصل العميل إلى لوحات الإدارة أو بيانات موكلين آخرين.
        </p>
      </section>
    </PortalShell>
  );
}
