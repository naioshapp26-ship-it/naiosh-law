"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ModuleCard } from "@/components/module-card";
import { getVisibleOperationalModules } from "@/lib/module-routing";
import { useSession } from "@/lib/session";

const kpis = [
  { label: "القضايا النشطة", value: "128", delta: "+7 هذا الأسبوع", icon: "⚖️", color: "#c3152a" },
  { label: "جلسات الأسبوع", value: "26", delta: "3 غدًا", icon: "🏛️", color: "#0ea5e9" },
  { label: "مهام اليوم", value: "14", delta: "5 معلقة", icon: "📋", color: "#f59e0b" },
  { label: "تنبيهات عاجلة", value: "5", delta: "2 جديدة", icon: "🔔", color: "#ef4444" },
  { label: "الإيرادات الشهرية", value: "47k", delta: "+12% عن الشهر", icon: "💰", color: "#22c55e" },
  { label: "الموكلون النشطون", value: "83", delta: "+4 هذا الشهر", icon: "👥", color: "#8b5cf6" },
];

const upcomingSessions = [
  { case: "قضية استئناف تجارية", court: "محكمة الاستئناف القاهرة", date: "الأربعاء 15 يوليو", room: "الغرفة 7", status: "قريبة" },
  { case: "قضية نزاع عقاري", court: "المحكمة الابتدائية الجيزة", date: "الخميس 16 يوليو", room: "القاعة 3", status: "مجدولة" },
  { case: "دعوى تعويض تجاري", court: "محكمة التحكيم", date: "الأحد 19 يوليو", room: "قاعة A", status: "مجدولة" },
];

const recentTasks = [
  { task: "إعداد مذكرة دفاعية — قضية #2024-0547", priority: "عاجل", due: "اليوم 9 ص" },
  { task: "مراجعة عقد الوكالة للموكل أحمد الصاوي", priority: "عادي", due: "غدًا" },
  { task: "تقديم مستندات الاستئناف التجاري", priority: "عاجل", due: "15 يوليو" },
  { task: "إصدار فاتورة الرسوم — ملف #2024-0312", priority: "عادي", due: "16 يوليو" },
];

export default function DashboardPage() {
  const { user, ready } = useSession(true);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );
  const visibleModules = useMemo(
    () => (user ? getVisibleOperationalModules(user.role) : []),
    [user]
  );

  if (!ready || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6f9",
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #e2e8f0",
              borderTopColor: "#c3152a",
              animation: "spin-slow 0.9s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1200 }}>
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
            لوحة التحكم
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            {todayLabel} — مرحبًا {user.name}
          </p>
        </div>

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.1rem",
            marginBottom: "1.75rem",
          }}
          className="kpi-grid"
        >
          {kpis.map((k) => (
            <div
              key={k.label}
              className="card-white"
              style={{ padding: "1.35rem 1.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.85rem",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                  {k.label}
                </span>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "10px",
                    background: `${k.color}12`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                  }}
                >
                  {k.icon}
                </div>
              </div>
              <div
                style={{ fontSize: "2rem", fontWeight: 900, color: "#0a0a12", lineHeight: 1 }}
              >
                {k.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#22c55e", marginTop: "0.4rem", fontWeight: 600 }}>
                ↑ {k.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.75rem" }}
          className="two-col"
        >
          {/* Upcoming sessions */}
          <div className="card-white" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0a0a12" }}>
                الجلسات القادمة
              </h2>
              <Link
                href="/app/modules/court-sessions"
                style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 600 }}
              >
                عرض الكل ←
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {upcomingSessions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.9rem",
                    background: "#f8f9fb",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0a0a12" }}>
                      {s.case}
                    </p>
                    <span
                      style={{
                        background:
                          s.status === "قريبة"
                            ? "rgba(195,21,42,0.1)"
                            : "rgba(100,116,139,0.1)",
                        color: s.status === "قريبة" ? "#c3152a" : "#64748b",
                        borderRadius: "6px",
                        padding: "0.15rem 0.55rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                      }}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {s.court} — {s.room}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#c3152a", marginTop: "0.25rem", fontWeight: 600 }}>
                    🗓 {s.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="card-white" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0a0a12" }}>
                المهام اليومية
              </h2>
              <span
                style={{
                  background: "rgba(195,21,42,0.08)",
                  color: "#c3152a",
                  borderRadius: "8px",
                  padding: "0.2rem 0.65rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {recentTasks.length} مهمة
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentTasks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: "#f8f9fb",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "#c3152a",
                      marginTop: "0.2rem",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#0a0a12",
                        marginBottom: "0.25rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {t.task}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          background:
                            t.priority === "عاجل"
                              ? "rgba(239,68,68,0.1)"
                              : "rgba(100,116,139,0.1)",
                          color: t.priority === "عاجل" ? "#ef4444" : "#64748b",
                          borderRadius: "5px",
                          padding: "0.1rem 0.45rem",
                          fontSize: "0.62rem",
                          fontWeight: 700,
                        }}
                      >
                        {t.priority}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                        {t.due}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modules quick access */}
        <div className="card-white" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0a0a12" }}>
              الوحدات التشغيلية
            </h2>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {visibleModules.length} وحدة متاحة
            </span>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}
            className="mod-grid"
          >
            {visibleModules.map((item) => (
              <ModuleCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .mod-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
