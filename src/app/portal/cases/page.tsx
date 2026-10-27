"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalCase } from "@/lib/client-portal";

export default function PortalCasesPage() {
  const [cases, setCases] = useState<PortalCase[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [c, p] = await Promise.all([
      portalJson<{ cases?: PortalCase[]; error?: string }>("/api/portal/cases"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
    ]);
    if (!c.ok) {
      setError(c.error);
      setCases([]);
      setLoading(false);
      return;
    }
    setCases(c.data.cases || []);
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (status !== "الكل" && c.status !== status) return false;
      if (!needle) return true;
      return [c.title, c.caseNo, c.type, c.court, c.lawyerName || ""].join(" ").toLowerCase().includes(needle);
    });
  }, [cases, q, status]);

  return (
    <PortalShell title="قضاياي" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      <section className="portal-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
          <h2 style={{ margin: 0 }}>القضايا المرتبطة بحسابك فقط</h2>
          <div className="portal-actions">
            <Link className="portal-btn primary" href="/portal/requests">
              طلب فتح ملف
            </Link>
            <Link className="portal-btn ghost" href="/portal/documents">
              مستنداتي
            </Link>
          </div>
        </div>

        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr 0.8fr", marginTop: "1rem" }}>
          <label>
            بحث
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="رقم القضية، العنوان، المحكمة…" />
          </label>
          <label>
            الحالة
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>الكل</option>
              <option>نشطة</option>
              <option>مغلقة</option>
              <option>موقوفة</option>
            </select>
          </label>
        </div>

        {loading && !error ? <PortalLoadingCard /> : null}
        {!loading && filtered.length === 0 ? (
          <PortalEmptyState
            title={cases.length ? "لا نتائج مطابقة" : "لا قضايا مرتبطة حالياً"}
            description={
              cases.length
                ? "جرّب تغيير البحث أو الفلتر."
                : "عند ربط الإدارة قضية بحسابك ستظهر هنا. يمكنك طلب فتح ملف جديد."
            }
            actionHref="/portal/requests"
            actionLabel="طلب فتح ملف قضية"
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div style={{ display: "grid", gap: "0.85rem", marginTop: "1rem" }}>
            {filtered.map((c) => {
              const open = openId === c.id;
              return (
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
                  <div className="portal-actions" style={{ marginTop: "0.75rem" }}>
                    <button type="button" className="portal-btn ghost" onClick={() => setOpenId(open ? null : c.id)}>
                      {open ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                    </button>
                    <Link className="portal-btn ghost" href="/portal/sessions">
                      الجلسات
                    </Link>
                    <Link className="portal-btn ghost" href="/portal/documents">
                      المستندات
                    </Link>
                    <Link className="portal-btn primary" href="/portal/messages">
                      مراسلة المكتب
                    </Link>
                  </div>
                  {open ? (
                    <div style={{ marginTop: "0.85rem" }}>
                      <p style={{ margin: 0, color: "#526071", fontWeight: 600 }}>آخر تحديث: {c.lastUpdate}</p>
                      {c.timeline?.length ? (
                        <ul style={{ margin: "0.75rem 0 0", paddingInlineStart: "1.1rem", color: "#526071", fontWeight: 600 }}>
                          {c.timeline.map((t, i) => (
                            <li key={`${c.id}-${i}`}>
                              {t.date}: {t.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: "0.75rem 0 0", color: "#526071" }}>لا مسار زمني إضافي بعد.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </PortalShell>
  );
}
