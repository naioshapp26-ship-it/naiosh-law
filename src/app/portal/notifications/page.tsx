"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalNotification } from "@/lib/client-portal";

export default function PortalNotificationsPage() {
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [n, p] = await Promise.all([
      portalJson<{ notifications?: PortalNotification[] }>("/api/portal/notifications"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
    ]);
    if (!n.ok) {
      setError(n.error);
      setItems([]);
      setLoading(false);
      return;
    }
    setItems(n.data.notifications || []);
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((n) => {
      if (onlyUnread && n.read) return false;
      if (!needle) return true;
      return [n.title, n.body, n.category].join(" ").toLowerCase().includes(needle);
    });
  }, [items, q, onlyUnread]);

  const markRead = async (id: string) => {
    const res = await portalJson("/api/portal/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
  };

  const markAll = async () => {
    const unread = items.filter((n) => !n.read);
    for (const n of unread) {
      await portalJson("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
    }
    await load();
  };

  return (
    <PortalShell title="الإشعارات" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      <section className="portal-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
          <h2 style={{ margin: 0 }}>تحديثات قضاياك ومواعيدك ومستنداتك وفواتيرك</h2>
          <button type="button" className="portal-btn ghost" onClick={() => void markAll()} disabled={demo || !items.some((n) => !n.read)}>
            تعليم الكل كمقروء
          </button>
        </div>
        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr auto", marginTop: "0.85rem", alignItems: "end" }}>
          <label>
            بحث
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="عنوان أو محتوى…" />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
            غير المقروء فقط
          </label>
        </div>

        {loading ? <PortalLoadingCard /> : null}
        {!loading && filtered.length === 0 ? (
          <PortalEmptyState
            title={items.length ? "لا نتائج" : "لا إشعارات"}
            description="ستظهر هنا إشعارات الطلبات والمستندات والرسائل المرتبطة بحسابك."
            actionHref="/portal"
            actionLabel="العودة للرئيسية"
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {filtered.map((n) => (
              <article key={n.id} className="portal-card" style={{ boxShadow: "none", opacity: n.read ? 0.75 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <span className="portal-badge gold">{n.category}</span>
                    <h3 style={{ margin: "0.4rem 0 0" }}>{n.title}</h3>
                    <p style={{ margin: "0.35rem 0 0", color: "#526071", fontWeight: 600 }}>{n.body}</p>
                    <small style={{ color: "#526071" }}>{n.createdAt}</small>
                  </div>
                  <div className="portal-actions">
                    {n.href ? (
                      <Link className="portal-btn ghost" href={n.href}>
                        فتح
                      </Link>
                    ) : null}
                    {!n.read ? (
                      <button type="button" className="portal-btn primary" onClick={() => void markRead(n.id)}>
                        تعليم كمقروء
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </PortalShell>
  );
}
