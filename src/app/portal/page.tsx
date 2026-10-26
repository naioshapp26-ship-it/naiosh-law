"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalDashboard } from "@/lib/client-portal";

export default function PortalHomePage() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/portal/dashboard", { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "تعذر التحميل");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطأ"));
  }, []);

  return (
    <PortalShell title="لوحة العميل" demoBanner={Boolean(data?.profile.isDemo)}>
      {error ? <div className="portal-card">{error}</div> : null}
      {!data && !error ? <div className="portal-card">جاري تحميل بياناتك…</div> : null}
      {data ? (
        <>
          <section className="portal-card" aria-label="ترحيب">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#101D32,#B79A61)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: "1.3rem",
                }}
              >
                {data.profile.name.slice(0, 1)}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: 0 }}>أهلاً {data.profile.name}</h2>
                <p style={{ margin: "0.35rem 0 0", color: "#526071", fontWeight: 600 }}>
                  رقم العميل: {data.profile.internalNo || "—"} · اكتمال الملف:{" "}
                  {data.profile.profileComplete ? "مكتمل" : "يحتاج استكمالاً"}
                </p>
              </div>
              <div className="portal-actions">
                {!data.profile.profileComplete ? (
                  <Link className="portal-btn primary" href="/portal/profile?onboarding=1">
                    استكمال الملف
                  </Link>
                ) : null}
                <Link className="portal-btn ghost" href="/portal/requests">
                  طلب استشارة
                </Link>
                <Link className="portal-btn ghost" href="/portal/documents">
                  رفع مستند
                </Link>
              </div>
            </div>
          </section>

          <section className="portal-grid" aria-label="مؤشرات">
            {[
              { label: "القضايا", value: data.stats.casesTotal },
              { label: "نشطة", value: data.stats.casesActive },
              { label: "مغلقة", value: data.stats.casesClosed },
              { label: "جلسات قادمة", value: data.stats.upcomingSessions },
              { label: "مستندات", value: data.stats.documents },
              { label: "طلبات مفتوحة", value: data.stats.openRequests },
              { label: "مستحق", value: `${data.stats.dueAmount.toLocaleString("ar-EG")} ر.س` },
              { label: "إشعارات", value: data.stats.unreadNotifications },
            ].map((kpi) => (
              <article key={kpi.label} className="portal-card portal-kpi">
                <strong>{kpi.value}</strong>
                <span>{kpi.label}</span>
              </article>
            ))}
          </section>

          <section className="portal-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
            <article className="portal-card">
              <h3>الجلسات القادمة</h3>
              {data.upcomingSessions.length === 0 ? (
                <div className="portal-empty">
                  لا جلسات قادمة. يمكنك <Link href="/portal/requests">طلب موعد</Link>.
                </div>
              ) : (
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>القضية</th>
                      <th>المحكمة</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.upcomingSessions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {s.date} {s.time || ""}
                        </td>
                        <td>{s.caseNo || "—"}</td>
                        <td>{s.court}</td>
                        <td>
                          <span className="portal-badge gold">{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>

            <article className="portal-card">
              <h3>آخر الإشعارات</h3>
              {data.recentNotifications.length === 0 ? (
                <div className="portal-empty">لا إشعارات حالياً.</div>
              ) : (
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {data.recentNotifications.map((n) => (
                    <div key={n.id} style={{ borderBottom: "1px solid rgba(16,29,50,.08)", paddingBottom: "0.55rem" }}>
                      <strong style={{ display: "block" }}>{n.title}</strong>
                      <span style={{ color: "#526071", fontSize: "0.85rem", fontWeight: 600 }}>{n.body}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </PortalShell>
  );
}
