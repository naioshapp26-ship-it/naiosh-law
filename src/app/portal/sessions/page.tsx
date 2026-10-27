"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalSession } from "@/lib/client-portal";

export default function PortalSessionsPage() {
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [s, p] = await Promise.all([
      portalJson<{ sessions?: PortalSession[] }>("/api/portal/sessions"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
    ]);
    if (!s.ok) {
      setError(s.error);
      setSessions([]);
      setLoading(false);
      return;
    }
    setSessions(s.data.sessions || []);
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sessions;
    return sessions.filter((s) =>
      [s.caseNo || "", s.court, s.type, s.status, s.lawyer || "", s.notes || ""].join(" ").toLowerCase().includes(needle)
    );
  }, [sessions, q]);

  const upcoming = filtered.filter((s) => s.status === "مجدولة");
  const past = filtered.filter((s) => s.status !== "مجدولة");

  const renderTable = (rows: PortalSession[], emptyTitle: string) =>
    rows.length === 0 ? (
      <PortalEmptyState title={emptyTitle} description="تظهر هنا الجلسات المرتبطة بقضاياك فقط." />
    ) : (
      <table className="portal-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>القضية</th>
            <th>المكان</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td>
                  {s.date} {s.time || ""}
                </td>
                <td>{s.caseNo || "—"}</td>
                <td>
                  {s.court}
                  {s.room ? ` — ${s.room}` : ""}
                </td>
                <td>{s.type}</td>
                <td>
                  <span className="portal-badge">{s.status}</span>
                </td>
                <td>
                  <button type="button" className="portal-btn ghost" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
                    تفاصيل
                  </button>
                </td>
              </tr>
              {openId === s.id ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: "0.5rem 0", color: "#526071", fontWeight: 600 }}>
                      المحامي: {s.lawyer || "—"}
                      <br />
                      تعليمات: {s.notes || "لا تعليمات إضافية"}
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    );

  return (
    <PortalShell title="جلساتي ومواعيدي" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      <div className="portal-actions">
        <Link className="portal-btn primary" href="/portal/requests">
          طلب حجز استشارة / موعد
        </Link>
        <Link className="portal-btn ghost" href="/portal/cases">
          قضاياي
        </Link>
      </div>

      <section className="portal-card">
        <label>
          بحث في الجلسات
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="رقم القضية، المحكمة، النوع…" />
        </label>
      </section>

      {loading && !error ? <PortalLoadingCard /> : null}

      {!loading ? (
        <>
          <section className="portal-card">
            <h2>القادمة</h2>
            {sessions.length === 0 ? (
              <PortalEmptyState
                title="لا جلسات مرتبطة"
                description="عند جدولة جلسة على إحدى قضاياك ستظهر هنا."
                actionHref="/portal/requests"
                actionLabel="طلب موعد"
              />
            ) : (
              renderTable(upcoming, "لا جلسات قادمة")
            )}
          </section>
          <section className="portal-card">
            <h2>السابقة</h2>
            {renderTable(past, "لا جلسات سابقة")}
          </section>
        </>
      ) : null}
    </PortalShell>
  );
}
