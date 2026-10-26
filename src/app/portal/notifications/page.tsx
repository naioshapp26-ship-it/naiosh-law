"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalNotification } from "@/lib/client-portal";

export default function PortalNotificationsPage() {
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [demo, setDemo] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/portal/notifications", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ]).then(([n, p]) => {
      setItems(n.notifications || []);
      setDemo(Boolean(p.profile?.isDemo));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/portal/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <PortalShell title="الإشعارات" demoBanner={demo}>
      <section className="portal-card">
        <h2>تحديثات قضاياك ومواعيدك ومستنداتك وفواتيرك</h2>
        {items.length === 0 ? (
          <div className="portal-empty">لا إشعارات.</div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {items.map((n) => (
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
                      <button type="button" className="portal-btn primary" onClick={() => markRead(n.id)}>
                        تعليم كمقروء
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
}
