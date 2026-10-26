"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalSession } from "@/lib/client-portal";

export default function PortalSessionsPage() {
  const [sessions, setSessions] = useState<PortalSession[]>([]);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/sessions", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ]).then(([s, p]) => {
      setSessions(s.sessions || []);
      setDemo(Boolean(p.profile?.isDemo));
    });
  }, []);

  const upcoming = sessions.filter((s) => s.status === "مجدولة");
  const past = sessions.filter((s) => s.status !== "مجدولة");

  return (
    <PortalShell title="جلساتي ومواعيدي" demoBanner={demo}>
      <div className="portal-actions">
        <Link className="portal-btn primary" href="/portal/requests">
          طلب حجز استشارة / موعد
        </Link>
      </div>
      <section className="portal-card">
        <h2>القادمة</h2>
        {upcoming.length === 0 ? (
          <div className="portal-empty">لا جلسات قادمة.</div>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>القضية</th>
                <th>المكان</th>
                <th>النوع</th>
                <th>تعليمات</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.date} {s.time || ""}
                  </td>
                  <td>{s.caseNo || "—"}</td>
                  <td>
                    {s.court}
                    {s.room ? ` — ${s.room}` : ""}
                  </td>
                  <td>{s.type}</td>
                  <td>{s.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="portal-card">
        <h2>السابقة</h2>
        {past.length === 0 ? (
          <div className="portal-empty">لا جلسات سابقة.</div>
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
              {past.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.date} {s.time || ""}
                  </td>
                  <td>{s.caseNo || "—"}</td>
                  <td>{s.court}</td>
                  <td>
                    <span className="portal-badge">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalShell>
  );
}
