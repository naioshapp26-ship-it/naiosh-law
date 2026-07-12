"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { ModuleCard } from "@/components/module-card";
import { modules } from "@/data/modules";
import {
  dashboardTypes,
  empireIntro,
  imperialAxes,
  totalEmpireItems,
  countAxisItems,
} from "@/data/empire-structure";
import { resolveItemHref } from "@/lib/empire-routes";
import { useSession } from "@/lib/session";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const kpisByDashboard: Record<string, { label: string; value: string; delta: string; icon: string; color: string }[]> = {
  system360: [
    { label: "المحاور القانونية", value: "8", delta: "هيكل سيادي موحّد", icon: "🌐", color: "#c3152a" },
    { label: "عناصر النظام", value: String(totalEmpireItems()), delta: "من ملف المواصفات", icon: "📋", color: "#0ea5e9" },
    { label: "الوحدات التشغيلية", value: String(modules.length), delta: "وحدة نشطة", icon: "⚙️", color: "#22c55e" },
    { label: "التكاملات", value: "12", delta: "3 نشطة", icon: "🔗", color: "#8b5cf6" },
    { label: "التنبيهات", value: "5", delta: "2 عاجلة", icon: "🔔", color: "#ef4444" },
    { label: "القضايا النشطة", value: "128", delta: "+7 هذا الأسبوع", icon: "⚖️", color: "#f59e0b" },
  ],
  empire: [
    { label: "فروع نايوش", value: "6", delta: "3 دول", icon: "🌍", color: "#c3152a" },
    { label: "الشراكات الدولية", value: "24", delta: "+3 جديدة", icon: "🤝", color: "#0ea5e9" },
    { label: "العمليات العالمية", value: "18", delta: "5 نشطة", icon: "🚢", color: "#22c55e" },
    { label: "الحوكمة", value: "9", delta: "2 معلقة", icon: "⚙️", color: "#8b5cf6" },
    { label: "الإيرادات", value: "2.4M", delta: "+14%", icon: "💰", color: "#f59e0b" },
    { label: "الموكلون", value: "340", delta: "+12", icon: "👥", color: "#06b6d4" },
  ],
  superadmin: [
    { label: "المستخدمون", value: "48", delta: "6 أدوار", icon: "👥", color: "#0ea5e9" },
    { label: "الصلاحيات", value: "124", delta: "محدّثة", icon: "🛡️", color: "#c3152a" },
    { label: "سجل التدقيق", value: "1.2k", delta: "اليوم 34", icon: "📜", color: "#64748b" },
    { label: "السياسات", value: "18", delta: "سارية", icon: "📋", color: "#22c55e" },
    { label: "التكاملات", value: "12", delta: "متصلة", icon: "🔗", color: "#8b5cf6" },
    { label: "النسخ الاحتياطي", value: "✓", delta: "آخر: اليوم", icon: "💾", color: "#22c55e" },
  ],
  admin: [
    { label: "القضايا النشطة", value: "128", delta: "+7", icon: "⚖️", color: "#c3152a" },
    { label: "جلسات الأسبوع", value: "26", delta: "3 غدًا", icon: "🏛️", color: "#0ea5e9" },
    { label: "الموكلون", value: "83", delta: "+4", icon: "👥", color: "#8b5cf6" },
    { label: "الإيرادات", value: "47k", delta: "+12%", icon: "💰", color: "#22c55e" },
    { label: "مهام اليوم", value: "14", delta: "5 معلقة", icon: "📋", color: "#f59e0b" },
    { label: "تنبيهات", value: "5", delta: "2 عاجلة", icon: "🔔", color: "#ef4444" },
  ],
  user: [
    { label: "مهامي", value: "8", delta: "3 متأخرة", icon: "📋", color: "#f59e0b" },
    { label: "جلساتي", value: "4", delta: "غدًا 2", icon: "🏛️", color: "#0ea5e9" },
    { label: "مستنداتي", value: "23", delta: "5 جديدة", icon: "📄", color: "#8b5cf6" },
    { label: "إشعاراتي", value: "7", delta: "2 غير مقروءة", icon: "🔔", color: "#ef4444" },
    { label: "قضاياي", value: "12", delta: "نشطة", icon: "⚖️", color: "#c3152a" },
    { label: "استشاراتي", value: "3", delta: "قادمة", icon: "💬", color: "#22c55e" },
  ],
};

const upcomingSessions = [
  { case: "قضية استئناف تجارية", court: "محكمة الاستئناف القاهرة", date: "الأربعاء 15 يوليو", status: "قريبة" },
  { case: "قضية نزاع عقاري", court: "المحكمة الابتدائية الجيزة", date: "الخميس 16 يوليو", status: "مجدولة" },
  { case: "دعوى تعويض تجاري", court: "محكمة التحكيم", date: "الأحد 19 يوليو", status: "مجدولة" },
];

export default function DashboardPage() {
  const { user, ready } = useSession(true);
  const [dashType, setDashType] = useState("system360");

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div className="spin-slow" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#c3152a", margin: "0 auto 1rem" }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const kpis = kpisByDashboard[dashType] ?? kpisByDashboard.system360;
  const activeDash = dashboardTypes.find((d) => d.id === dashType)!;

  return (
    <AppShell>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        style={{ maxWidth: 1240 }}
      >
        {/* Imperial hero + animated logo */}
        <motion.div
          variants={fadeUp}
          custom={0}
          style={{
            background: "linear-gradient(135deg, #c3152a 0%, #7f0d1a 50%, #0a0a12 100%)",
            borderRadius: "22px",
            padding: "1.75rem 2rem",
            marginBottom: "1.75rem",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="glow-pulse" style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)" }} />
          <div className="glow-pulse" style={{ position: "absolute", bottom: -80, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap", position: "relative" }}>
            {/* Logo متحرك */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <div
                className="logo-glow-ring"
                style={{
                  position: "absolute",
                  inset: "-12px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <BrandLogo size={110} showText={false} animated />
            </motion.div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: "0.75rem", opacity: 0.85, marginBottom: "0.35rem" }}
              >
                👑 {empireIntro.subtitle}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: "1.65rem", fontWeight: 900, marginBottom: "0.5rem", lineHeight: 1.35 }}
              >
                {empireIntro.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: "0.88rem", opacity: 0.88, maxWidth: 560, lineHeight: 1.75 }}
              >
                {empireIntro.description}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ fontSize: "0.8rem", marginTop: "0.75rem", opacity: 0.75 }}
              >
                مرحبًا {user.name} — {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0a0a12", marginBottom: "0.85rem" }}>
            أنواع لوحات التحكم
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
            {dashboardTypes.map((d) => (
              <motion.button
                key={d.id}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDashType(d.id)}
                style={{
                  padding: "0.6rem 1.1rem",
                  borderRadius: "12px",
                  border: dashType === d.id ? `2px solid ${d.color}` : "1px solid #e2e8f0",
                  background: dashType === d.id ? `${d.color}10` : "#fff",
                  color: dashType === d.id ? d.color : "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-cairo)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s",
                }}
              >
                <span>{d.icon}</span>
                {d.label}
              </motion.button>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.65rem" }}>{activeDash.description}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={dashType}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}
            className="kpi-grid"
          >
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                className="card-white"
                style={{ padding: "1.25rem 1.4rem", transition: "box-shadow 0.25s" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>{k.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: "9px", background: `${k.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                    {k.icon}
                  </div>
                </div>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0a0a12" }}>{k.value}</div>
                <div style={{ fontSize: "0.72rem", color: "#22c55e", marginTop: "0.35rem", fontWeight: 600 }}>↑ {k.delta}</div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.div variants={fadeUp} custom={2} style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0a0a12" }}>المحاور القانونية الثمانية</h2>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{totalEmpireItems()} عنصر في الهيكل السيادي</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }} className="axis-grid">
            {imperialAxes.filter((a) => a.id <= 8).map((axis, i) => (
              <motion.div
                key={axis.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  href={axis.href}
                  className="card-white"
                  style={{
                    display: "block",
                    padding: "1.25rem",
                    textDecoration: "none",
                    borderTop: `3px solid ${axis.color}`,
                    height: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>{axis.icon}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: axis.color }}>المحور {axis.id}</span>
                  </div>
                  <h3 style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.88rem", marginBottom: "0.35rem", lineHeight: 1.4 }}>
                    {axis.title}
                  </h3>
                  <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.5rem" }}>{axis.subtitle}</p>
                  <span style={{ fontSize: "0.7rem", color: "#c3152a", fontWeight: 700 }}>
                    {countAxisItems(axis)} عنصر ←
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={3} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.75rem" }} className="two-col">
          <div className="card-white" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "1rem" }}>الجلسات القادمة</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {upcomingSessions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{ padding: "0.85rem", background: "#f8f9fb", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                >
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0a0a12" }}>{s.case}</p>
                  <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.court}</p>
                  <p style={{ fontSize: "0.72rem", color: "#c3152a", marginTop: "0.2rem", fontWeight: 600 }}>🗓 {s.date}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card-white" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "1rem" }}>لوحة التحكم السيادية — وصول سريع</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {imperialAxes
                .find((a) => a.slug === "sovereign")
                ?.items?.map((item) => (
                  <Link
                    key={item.id}
                    href={resolveItemHref(item)}
                    style={{
                      padding: "0.65rem 0.75rem",
                      background: "#f8f9fb",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#475569",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={4} id="modules" className="card-white" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800 }}>الوحدات التشغيلية</h2>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{modules.length} وحدة</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }} className="mod-grid">
            {modules.map((item, i) => (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -4 }}
              >
                <ModuleCard item={item} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        @media (max-width: 1000px) {
          .axis-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .mod-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
          .axis-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
