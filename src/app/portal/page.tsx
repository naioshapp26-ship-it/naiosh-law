"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalDashboard } from "@/lib/client-portal";

export default function PortalHomePage() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await portalJson<PortalDashboard>("/api/portal/dashboard");
    if (!res.ok) {
      setError(res.error);
      setData(null);
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalShell title="لوحة العميل" demoBanner={Boolean(data?.profile.isDemo)}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      {loading && !error ? <PortalLoadingCard label="جاري تحميل بياناتك…" /> : null}
      {data && !loading ? (
        <>
          <section className="portal-card" aria-label="ترحيب">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "linear-gradient(135deg,#101D32,#B79A61)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: "1.3rem",
                }}
              >
                {data.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  data.profile.name.slice(0, 1)
                )}
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
              { label: "القضايا", value: data.stats.casesTotal, href: "/portal/cases" },
              { label: "نشطة", value: data.stats.casesActive, href: "/portal/cases" },
              { label: "مغلقة", value: data.stats.casesClosed, href: "/portal/cases" },
              { label: "جلسات قادمة", value: data.stats.upcomingSessions, href: "/portal/sessions" },
              { label: "مستندات", value: data.stats.documents, href: "/portal/documents" },
              { label: "طلبات مفتوحة", value: data.stats.openRequests, href: "/portal/requests" },
              {
                label: "مستحق",
                value: `${data.stats.dueAmount.toLocaleString("ar-EG")} ر.س`,
                href: "/portal/finance",
              },
              { label: "إشعارات", value: data.stats.unreadNotifications, href: "/portal/notifications" },
            ].map((kpi) => (
              <Link key={kpi.label} href={kpi.href} className="portal-card portal-kpi" style={{ textDecoration: "none" }}>
                <strong>{kpi.value}</strong>
                <span>{kpi.label}</span>
              </Link>
            ))}
          </section>

          <section className="portal-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
            <article className="portal-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>الجلسات القادمة</h3>
                <Link className="portal-btn ghost" href="/portal/sessions">
                  الكل
                </Link>
              </div>
              {data.upcomingSessions.length === 0 ? (
                <PortalEmptyState
                  title="لا جلسات قادمة"
                  description="يمكنك طلب موعد أو استشارة من صفحة الطلبات."
                  actionHref="/portal/requests"
                  actionLabel="طلب موعد"
                />
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>آخر الإشعارات</h3>
                <Link className="portal-btn ghost" href="/portal/notifications">
                  الكل
                </Link>
              </div>
              {data.recentNotifications.length === 0 ? (
                <PortalEmptyState title="لا إشعارات حالياً" description="ستظهر هنا تحديثات قضاياك وطلباتك." />
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

          <section className="portal-card">
            <h3>آخر الطلبات</h3>
            {data.recentRequests.length === 0 ? (
              <PortalEmptyState
                title="لا طلبات بعد"
                description="أنشئ طلب استشارة أو خدمة قانونية."
                actionHref="/portal/requests"
                actionLabel="طلب جديد"
              />
            ) : (
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>المرجع</th>
                    <th>النوع</th>
                    <th>العنوان</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.refNo}</td>
                      <td>{r.type}</td>
                      <td>{r.title}</td>
                      <td>
                        <span className="portal-badge gold">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </PortalShell>
  );
}
