"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import type { CreatorPage } from "@/data/erp-nav-pages";

export default function PublicCreatorPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username || "");
  const [page, setPage] = useState<CreatorPage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/creator-pages/public/${encodeURIComponent(username)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "غير موجودة");
        setPage(data.page);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "تعذر التحميل"))
      .finally(() => setLoading(false));
  }, [username]);

  const trackClick = (url: string) => {
    fetch(`/api/creator-pages/public/${encodeURIComponent(username)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "click" }),
    }).catch(() => undefined);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0e13", color: "#94a3b8" }}>جاري فتح الصفحة...</div>;
  }

  if (error || !page) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0e13", color: "#fff", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontWeight: 900, marginBottom: 8 }}>الصفحة غير موجودة</h1>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>{error || "تحقق من اسم المستخدم"}</p>
          <Link href="/create-page" style={{ color: "#fecaca", fontWeight: 800 }}>أنشئ صفحتك</Link>
        </div>
      </div>
    );
  }

  const links = [
    page.whatsapp && { label: "WhatsApp", url: page.whatsapp },
    page.facebook && { label: "Facebook", url: page.facebook },
    page.instagram && { label: "Instagram", url: page.instagram },
    page.youtube && { label: "YouTube", url: page.youtube },
    page.snapchat && { label: "Snapchat", url: page.snapchat },
    page.tiktok && { label: "TikTok", url: page.tiktok },
    ...(page.customLinks || []),
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 20% 0%, #2b0b12, #06070a 55%)", color: "#fff", fontFamily: "var(--font)", padding: "24px 16px 48px" }}>
      <div style={{ width: "min(480px, 100%)", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <BrandLogo size={40} showText={false} variant="light" />
          <Link href="/" style={{ color: "#94a3b8", fontWeight: 700, textDecoration: "none", fontSize: ".85rem" }}>NAIOSH Law</Link>
        </div>
        <div style={{ overflow: "hidden", borderRadius: 20, border: "1px solid #343a4a", background: "#0b0e13" }}>
          <div style={{ height: 150, background: "linear-gradient(135deg,#7f1d1d,#1a0505)" }} />
          <div style={{ width: 96, height: 96, borderRadius: "50%", border: "3px solid #fff", margin: "-48px auto 12px", background: "linear-gradient(135deg,#c3152a,#450a0a)" }} />
          <div style={{ padding: "0 18px 22px", textAlign: "center" }}>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 900 }}>{page.name}</h1>
            <p style={{ margin: 0, color: "#fda4af", fontWeight: 700, fontSize: ".85rem" }}>
              {page.specialty}{page.city ? ` — ${page.city}` : ""}
            </p>
            <p style={{ margin: "12px 0 0", color: "#a6afc3", lineHeight: 1.7, fontSize: ".9rem" }}>{page.bio || "صفحة قانونية مهنية عبر منظومة نايوش."}</p>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              {links.map((l) => (
                <button
                  key={`${l.label}-${l.url}`}
                  type="button"
                  onClick={() => trackClick(l.url)}
                  style={{ border: "1px solid #2d3443", borderRadius: 10, padding: 12, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#1c2230,#151924)", cursor: "pointer", fontFamily: "var(--font)" }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 18, color: "#64748b", fontSize: ".75rem" }}>مشاركة الصفحة: /u/{page.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
