"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetch("/api/portal/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((p) => {
        setDemo(Boolean(p.profile?.isDemo));
        if (p.profile?.notificationPrefs) setPrefs({ ...prefs, ...p.profile.notificationPrefs });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <button type="button" className="portal-btn ghost" disabled={demo} title={demo ? "غير متاح للتجريبي" : undefined}>
            تغيير كلمة المرور
          </button>
          <button type="button" className="portal-btn primary" onClick={() => logout()}>
            تسجيل الخروج من كل الأجهزة
          </button>
        </div>
        <p style={{ marginTop: "0.85rem", color: "#526071", fontWeight: 600 }}>
          الخصوصية: بياناتك القانونية لا تُعرض علناً. لا يصل العميل إلى لوحات الإدارة أو بيانات موكلين آخرين.
        </p>
      </section>
    </PortalShell>
  );
}
