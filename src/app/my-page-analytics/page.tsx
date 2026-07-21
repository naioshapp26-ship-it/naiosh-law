"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { BrandLogo } from "@/components/brand-logo";

type PageData = {
  name: string;
  username: string;
  views: number;
  clicks: number;
  specialty?: string;
  city?: string;
};

export default function MyPageAnalytics() {
  const [page, setPage] = useState<PageData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          window.location.assign("/login?next=/my-page-analytics");
          return null;
        }
        return fetch("/api/creator-pages/me", { credentials: "include" });
      })
      .then(async (r) => (r && r.ok ? r.json() : null))
      .then((data) => {
        setPage(data?.page ?? null);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a12", color: "#94a3b8" }}>
        جاري التحميل...
      </div>
    );
  }

  const ctr = page && page.views > 0 ? Math.round((page.clicks / page.views) * 100) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 10% 0%, #3f0a12, #0a0a12 50%)",
        color: "#fff",
        fontFamily: "var(--font)",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "min(900px, 100%)", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          <BrandLogo size={48} showText variant="light" subtitle="إحصائيات صفحتي" />
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/my-page" style={btn}>
              صفحتي
            </Link>
            <Link href="/create-page" style={{ ...btn, background: "linear-gradient(135deg,#d70000,#6a0009)", border: "none" }}>
              تعديل الصفحة
            </Link>
          </div>
        </div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: 8 }}>إحصائيات صفحتي</h1>
        <p style={{ color: "#94a3b8", marginBottom: 20 }}>
          {page ? `أداء صفحة ${page.name} (@${page.username})` : "لا توجد صفحة بعد — أنشئ صفحتك لبدء التتبع."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {[
            { label: "المشاهدات", value: page?.views ?? 0 },
            { label: "نقرات الروابط", value: page?.clicks ?? 0 },
            { label: "نسبة التفاعل", value: `${ctr}%` },
            { label: "التخصص", value: page?.specialty || "—" },
          ].map((k) => (
            <div key={k.label} style={{ background: "rgba(255,255,255,.04)", border: "1px solid #2b2f3a", borderRadius: 16, padding: "1.1rem" }}>
              <div style={{ color: "#94a3b8", fontSize: ".78rem", marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const btn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.65rem 1rem",
  borderRadius: 12,
  background: "#1b1f29",
  border: "1px solid #2f3544",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "0.85rem",
};
