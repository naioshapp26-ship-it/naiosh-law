"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalCase } from "@/lib/client-portal";

export default function PortalCasesPage() {
  const [cases, setCases] = useState<PortalCase[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/cases", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([c, p]) => {
        if (c.error) throw new Error(c.error);
        setCases(c.cases || []);
        setDemo(Boolean(p.profile?.isDemo));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطأ"));
  }, []);

  return (
    <PortalShell title="قضاياي" demoBanner={demo}>
      {error ? <div className="portal-card">{error}</div> : null}
      <section className="portal-card">
        <h2>القضايا المرتبطة بحسابك فقط</h2>
        {cases.length === 0 ? (
          <div className="portal-empty">
            لا قضايا مرتبطة حالياً. يمكنك <Link href="/portal/requests">طلب فتح ملف قضية</Link>.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {cases.map((c) => (
              <article key={c.id} className="portal-card" style={{ boxShadow: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{c.title}</h3>
                    <p style={{ margin: "0.35rem 0 0", color: "#526071", fontWeight: 600 }}>
                      {c.caseNo} · {c.type} · {c.court}
                    </p>
                  </div>
                  <span className={`portal-badge ${c.status === "نشطة" ? "gold" : "ok"}`}>{c.status}</span>
                </div>
                <p style={{ margin: "0.75rem 0 0", fontWeight: 600 }}>
                  المحامي: {c.lawyerName || "—"} · الجلسة القادمة: {c.nextDate || "—"} · مستندات: {c.documentCount}
                </p>
                <p style={{ margin: "0.35rem 0 0", color: "#526071" }}>آخر تحديث: {c.lastUpdate}</p>
                {c.timeline?.length ? (
                  <ul style={{ margin: "0.75rem 0 0", paddingInlineStart: "1.1rem", color: "#526071", fontWeight: 600 }}>
                    {c.timeline.map((t, i) => (
                      <li key={`${c.id}-${i}`}>
                        {t.date}: {t.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
}
