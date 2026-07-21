"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

type PageData = {
  name: string;
  username: string;
  views: number;
  clicks: number;
  specialty?: string;
  bio?: string;
};

export default function MyPageHub() {
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState<PageData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetch("/api/auth/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null));
      if (!me?.user) {
        window.location.assign("/login?next=/my-page");
        return;
      }
      if (cancelled) return;
      setUserName(me.user.name);
      const data = await fetch("/api/creator-pages/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null));
      if (!cancelled) {
        setPage(data?.page ?? null);
        setReady(true);
      }
    })().catch(() => {
      if (!cancelled) window.location.assign("/login?next=/my-page");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a12", color: "#94a3b8" }}>
        جاري تحميل صفحتي...
      </div>
    );
  }

  return (
    <div className="mp-page">
      <div className="mp-wrap">
        <div className="mp-head">
          <BrandLogo size={52} showText variant="light" subtitle="صفحتي القانونية" />
          <div className="mp-actions">
            <Link href="/create-page" className="mp-btn primary">
              {page ? "تعديل الصفحة" : "أنشئ صفحتك"}
            </Link>
            <Link href="/my-page-analytics" className="mp-btn">
              الإحصائيات
            </Link>
            <Link href="/app/dashboard" className="mp-btn">
              لوحة التحكم
            </Link>
          </div>
        </div>

        <div className="mp-hero">
          <p className="mp-eyebrow">مرحبًا {userName}</p>
          <h1>صفحتي</h1>
          <p className="mp-sub">
            لوحتك الشخصية داخل منظومة نايوش القانونية — مشاركة ملفك المهني مع الموكلين واستقبال طلبات الاستشارة.
          </p>
        </div>

        <div className="mp-grid">
          <div className="mp-card">
            <h2>{page ? page.name : "لم تُنشأ صفحتك بعد"}</h2>
            <p>
              {page
                ? page.bio || `${page.specialty || "صفحة قانونية"} — جاهزة للمشاركة`
                : "أنشئ صفحتك العامة الآن بنفس تجربة ERP مع بيانات مكتبك القانوني."}
            </p>
            {page ? (
              <Link href={`/u/${encodeURIComponent(page.username)}`} className="mp-btn primary" style={{ marginTop: 14 }}>
                فتح صفحتي العامة
              </Link>
            ) : (
              <Link href="/create-page" className="mp-btn primary" style={{ marginTop: 14 }}>
                ابدأ الإنشاء
              </Link>
            )}
          </div>
          <div className="mp-card">
            <h3>المؤشرات</h3>
            <div className="mp-kpis">
              <div>
                <strong>{page?.views ?? 0}</strong>
                <span>مشاهدة</span>
              </div>
              <div>
                <strong>{page?.clicks ?? 0}</strong>
                <span>نقرة روابط</span>
              </div>
              <div>
                <strong>{page ? "نشطة" : "—"}</strong>
                <span>الحالة</span>
              </div>
            </div>
          </div>
          <div className="mp-card">
            <h3>اختصارات قانونية</h3>
            <div className="mp-links">
              <Link href="/app/modules/case-management">قضاياي</Link>
              <Link href="/app/modules/clients-management">موكلي</Link>
              <Link href="/app/legal-finance">ماليتي</Link>
              <Link href="/app/specialty/profile">تخصص صفحتي</Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .mp-page{min-height:100vh;background:radial-gradient(circle at 80% 0%,#3f0a12,#0a0a12 45%);color:#fff;font-family:var(--font);padding:24px 16px 48px}
        .mp-wrap{width:min(1100px,100%);margin:0 auto}
        .mp-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:1.5rem}
        .mp-actions{display:flex;gap:8px;flex-wrap:wrap}
        .mp-btn{display:inline-flex;align-items:center;padding:.7rem 1rem;border-radius:12px;background:#1b1f29;border:1px solid #2f3544;color:#fff;text-decoration:none;font-weight:800;font-size:.85rem}
        .mp-btn.primary{background:linear-gradient(135deg,#d70000,#6a0009);border-color:transparent}
        .mp-hero{margin-bottom:1.25rem}
        .mp-eyebrow{color:#fda4af;font-weight:700;margin:0 0 .35rem}
        .mp-hero h1{margin:0 0 .5rem;font-size:2rem;font-weight:900}
        .mp-sub{margin:0;color:#cbd5e1;max-width:640px;line-height:1.7}
        .mp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
        .mp-card{background:rgba(255,255,255,.04);border:1px solid #2b2f3a;border-radius:18px;padding:1.2rem}
        .mp-card h2,.mp-card h3{margin:0 0 .65rem;font-weight:900}
        .mp-card p{margin:0;color:#94a3b8;line-height:1.7;font-size:.9rem}
        .mp-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .mp-kpis div{background:#11141c;border-radius:12px;padding:.85rem;text-align:center}
        .mp-kpis strong{display:block;font-size:1.25rem;font-weight:900}
        .mp-kpis span{font-size:.72rem;color:#94a3b8}
        .mp-links{display:grid;gap:8px}
        .mp-links a{color:#fecaca;font-weight:700;text-decoration:none}
      `}</style>
    </div>
  );
}
