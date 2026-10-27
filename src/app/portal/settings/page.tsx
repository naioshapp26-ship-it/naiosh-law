"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import { useSession } from "@/lib/session";

type Prefs = {
  cases: boolean;
  sessions: boolean;
  documents: boolean;
  invoices: boolean;
  messages: boolean;
};

export default function PortalSettingsPage() {
  const { logout } = useSession();
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({
    cases: true,
    sessions: true,
    documents: true,
    invoices: true,
    messages: true,
  });
  const [prefsMsg, setPrefsMsg] = useState("");
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = await portalJson<{ profile?: { isDemo?: boolean; notificationPrefs?: Prefs } }>("/api/portal/profile");
    if (!p.ok) {
      setError(p.error);
      setLoading(false);
      return;
    }
    setDemo(Boolean(p.data.profile?.isDemo));
    if (p.data.profile?.notificationPrefs) {
      setPrefs((prev) => ({ ...prev, ...p.data.profile!.notificationPrefs }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePrefs = async () => {
    setPrefsMsg("");
    setError("");
    setPrefsSaving(true);
    const res = await portalJson("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPrefs: prefs }),
    });
    setPrefsSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPrefsMsg("تم حفظ تفضيلات الإشعارات");
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    setPwLoading(true);
    const res = await portalJson<{ message?: string }>("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    setPwLoading(false);
    if (!res.ok) {
      setPwErr(res.error || "تعذر تغيير كلمة المرور");
      return;
    }
    setPwMsg(res.data.message || "تم تغيير كلمة المرور بنجاح");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
  };

  return (
    <PortalShell title="الإعدادات" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      {loading ? <PortalLoadingCard /> : null}

      {!loading ? (
        <>
          <section className="portal-card">
            <h2>تفضيلات الإشعارات</h2>
            <div className="portal-form">
              {Object.entries(prefs).map(([key, value]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <input
                    type="checkbox"
                    checked={value}
                    disabled={demo}
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
            <div className="portal-actions" style={{ marginTop: "0.85rem" }}>
              <button type="button" className="portal-btn primary" disabled={demo || prefsSaving} onClick={() => void savePrefs()}>
                {demo ? "غير متاح للتجريبي" : prefsSaving ? "جاري الحفظ…" : "حفظ التفضيلات"}
              </button>
            </div>
            {prefsMsg ? <p style={{ color: "#166534", fontWeight: 700 }}>{prefsMsg}</p> : null}
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
                    await portalJson("/api/auth/invalidate-sessions", { method: "POST" });
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
        </>
      ) : null}
    </PortalShell>
  );
}
