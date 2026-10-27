"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { ModuleCard } from "@/components/module-card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActions, standardRowActions } from "@/components/ui/row-actions";
import { modules } from "@/data/modules";
import { formatDate } from "@/lib/format";
import {
  dashboardTypes,
  empireIntro,
  imperialAxes,
  totalEmpireItems,
  countAxisItems,
  type ImperialAxis,
} from "@/data/empire-structure";
import { resolveItemHref } from "@/lib/empire-routes";
import { useSession, canWriteRole } from "@/lib/session";
import { usePageSettings } from "@/lib/page-settings/use-page-settings";
import { SettingsDrivenSections } from "@/components/page-settings/settings-driven-sections";
import {
  SettingsAppliedChrome,
  SettingsLinkButton,
  specBool,
  specString,
} from "@/components/page-settings/settings-applied-chrome";
import {
  ADD_AXIS_FORM_FIELDS,
  appendCustomLegalAxis,
  createCustomLegalAxis,
  hideAxis,
  loadAxisOverrides,
  loadCustomLegalAxes,
  loadHiddenAxisSlugs,
  removeCustomLegalAxis,
  updateCustomLegalAxis,
  upsertAxisOverride,
  type AxisPresentationOverride,
  type CustomLegalAxis,
} from "@/lib/custom-legal-axes";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function DashboardPage() {
  const { user, ready } = useSession(true);
  const pageSettings = usePageSettings("dashboard");
  const defaultDash = specString(pageSettings, "defaultDashboardType", "system360");
  const [dashType, setDashType] = useState("system360");
  const [customAxes, setCustomAxes] = useState<CustomLegalAxis[]>([]);
  const [liveStats, setLiveStats] = useState({
    cases: 0,
    clients: 0,
    sessions: 0,
    finance: 0,
    loading: true,
  });
  const [liveSessions, setLiveSessions] = useState<
    Array<{ case: string; court: string; date: string; status: string }>
  >([]);

  useEffect(() => {
    if (!pageSettings.loading && defaultDash) {
      setDashType(defaultDash);
    }
  }, [pageSettings.loading, defaultDash]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cases, clients, sessions, finance] = await Promise.all([
          fetch("/api/cases", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
          fetch("/api/clients", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
          fetch("/api/court-sessions", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : []
          ),
          fetch("/api/financial-records", { credentials: "include" }).then((r) =>
            r.ok ? r.json() : []
          ),
        ]);
        if (cancelled) return;
        const caseRows = Array.isArray(cases) ? cases : [];
        const clientRows = Array.isArray(clients) ? clients : [];
        const sessionRows = Array.isArray(sessions) ? sessions : [];
        const financeRows = Array.isArray(finance) ? finance : [];
        setLiveStats({
          cases: caseRows.length,
          clients: clientRows.length,
          sessions: sessionRows.length,
          finance: financeRows.length,
          loading: false,
        });
        setLiveSessions(
          sessionRows.slice(0, 5).map((s: Record<string, unknown>) => ({
            case: String(s.caseNo ?? s.case ?? s.title ?? "جلسة"),
            court: String(s.court ?? "—"),
            date: String(s.date ?? s.sessionDate ?? ""),
            status: String(s.status ?? ""),
          }))
        );
      } catch {
        if (!cancelled) setLiveStats((prev) => ({ ...prev, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [hiddenSlugs, setHiddenSlugs] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AxisPresentationOverride>>({});
  const [addAxisOpen, setAddAxisOpen] = useState(false);
  const [editAxis, setEditAxis] = useState<{
    slug: string;
    isCustom: boolean;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    description: string;
  } | null>(null);
  const [deleteAxis, setDeleteAxis] = useState<{
    slug: string;
    isCustom: boolean;
    title: string;
  } | null>(null);
  const [deletingAxis, setDeletingAxis] = useState(false);

  useEffect(() => {
    setCustomAxes(loadCustomLegalAxes());
    setHiddenSlugs(loadHiddenAxisSlugs());
    setOverrides(loadAxisOverrides());
  }, []);

  const withOverride = <T extends { slug: string; title: string; subtitle: string; icon: string; color: string; description?: string }>(
    axis: T
  ): T => {
    const o = overrides[axis.slug];
    if (!o) return axis;
    return {
      ...axis,
      title: o.title?.trim() || axis.title,
      subtitle: o.subtitle?.trim() || axis.subtitle,
      icon: o.icon?.trim() || axis.icon,
      color: o.color?.trim() || axis.color,
      description: o.description?.trim() || axis.description || "",
    };
  };

  const builtInAxes = imperialAxes
    .filter((a) => a.id <= 8 && !hiddenSlugs.includes(a.slug))
    .map((a) => withOverride(a));
  const dashboardCustom = customAxes
    .filter((a) => (a.source === "dashboard" || a.source === "both") && !hiddenSlugs.includes(a.slug))
    .map((a) => withOverride(a));
  const allAxes: Array<(ImperialAxis | CustomLegalAxis) & { isCustom?: boolean }> = [
    ...builtInAxes.map((a) => ({ ...a, isCustom: false as const })),
    ...dashboardCustom.map((a) => ({ ...a, isCustom: true as const })),
  ];

  const handleAddAxis = (data: Record<string, unknown>) => {
    const axis = createCustomLegalAxis(data, "both");
    setCustomAxes(appendCustomLegalAxis(axis));
    setAddAxisOpen(false);
  };

  const handleEditAxis = (data: Record<string, unknown>) => {
    if (!editAxis) return;
    if (editAxis.isCustom) {
      setCustomAxes(updateCustomLegalAxis(editAxis.slug, data));
    } else {
      upsertAxisOverride(editAxis.slug, data);
      setOverrides(loadAxisOverrides());
    }
    setEditAxis(null);
  };

  const confirmDeleteAxis = () => {
    if (!deleteAxis) return;
    setDeletingAxis(true);
    try {
      if (deleteAxis.isCustom) {
        setCustomAxes(removeCustomLegalAxis(deleteAxis.slug));
      } else {
        setHiddenSlugs(hideAxis(deleteAxis.slug));
      }
      setDeleteAxis(null);
    } finally {
      setDeletingAxis(false);
    }
  };

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F1E8" }}>
        <div style={{ textAlign: "center", color: "#526071" }}>
          <div className="spin-slow" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #D9DEE5", borderTopColor: "#B79A61", margin: "0 auto 1rem" }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const canWrite = canWriteRole(user.role);
  const allowAxisEdit =
    canWrite &&
    specBool(pageSettings, "allowAxisEdit", true) &&
    pageSettings.actions?.allowEdit !== false;
  const allowAxisCreate =
    canWrite &&
    specBool(pageSettings, "allowAxisEdit", true) &&
    pageSettings.actions?.allowCreate !== false;
  const showKpis =
    pageSettings.display?.showKpis !== false && specBool(pageSettings, "showKpiSection", true);
  const showAxes = specBool(pageSettings, "showAxes", true);
  const showSessions = specBool(pageSettings, "showSessions", true);
  const showQuickLinks = specBool(pageSettings, "showQuickLinks", true);
  const showModules = specBool(pageSettings, "showModules", true);
  const dashTitle = pageSettings.display?.title?.trim() || empireIntro.title;
  const dashSubtitle = pageSettings.display?.subtitle?.trim() || empireIntro.subtitle;
  // مؤشرات حية من PostgreSQL عبر واجهات النظام — ليست أرقامًا تجميلية
  const kpis = [
    {
      label: "القضايا",
      value: liveStats.loading ? "…" : String(liveStats.cases),
      delta: "حية من قاعدة البيانات",
      icon: "⚖️",
      color: "#101D32",
    },
    {
      label: "الموكلون",
      value: liveStats.loading ? "…" : String(liveStats.clients),
      delta: "حية من قاعدة البيانات",
      icon: "👥",
      color: "#B79A61",
    },
    {
      label: "الجلسات",
      value: liveStats.loading ? "…" : String(liveStats.sessions),
      delta: "حية من قاعدة البيانات",
      icon: "🏛️",
      color: "#1A304D",
    },
    {
      label: "السجلات المالية",
      value: liveStats.loading ? "…" : String(liveStats.finance),
      delta: "حية من قاعدة البيانات",
      icon: "💰",
      color: "#16A34A",
    },
    {
      label: "المحاور القانونية",
      value: String(allAxes.length),
      delta: "هيكل النظام + مخصص",
      icon: "🌐",
      color: "#101D32",
    },
    {
      label: "الوحدات التشغيلية",
      value: String(modules.length),
      delta: "تعريف المنظومة",
      icon: "⚙️",
      color: "#B79A61",
    },
  ];
  const activeDash = dashboardTypes.find((d) => d.id === dashType)!;

  return (
    <AppShell>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="erp-page hq-dashboard"
        style={{ width: "100%" }}
      >
        <SettingsAppliedChrome pageKey="dashboard" settings={pageSettings} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
          <SettingsLinkButton pageKey="dashboard" />
        </div>
        <SettingsDrivenSections pageKey="dashboard" />
        {/* Imperial hero + animated logo */}
        <motion.div
          variants={fadeUp}
          custom={0}
          style={{
            background: "linear-gradient(135deg, #0B1424, #101D32, #1A304D)",
            borderRadius: "1.75rem",
            padding: "1.75rem 2rem",
            marginBottom: "1.5rem",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08), 0 25px 60px -12px rgba(11,20,36,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
            border: "1px solid rgba(183,154,97,0.28)",
          }}
          className="hq-hero"
        >
          <div className="glow-pulse" style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(183,154,97,0.22) 0%, transparent 70%)" }} />
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
              <BrandLogo size={96} showText={false} animated />
            </motion.div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: "0.75rem", opacity: 0.85, marginBottom: "0.35rem" }}
              >
                👑 {dashSubtitle}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: "1.65rem", fontWeight: 900, marginBottom: "0.5rem", lineHeight: 1.35 }}
              >
                {dashTitle}
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
                مرحبًا {user.name} — {formatDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
                  border: dashType === d.id ? "2px solid #B79A61" : "1px solid #D9DEE5",
                  background: dashType === d.id ? "rgba(183,154,97,0.16)" : "#fff",
                  color: dashType === d.id ? "#0B1424" : "#526071",
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

        {showKpis ? (
        <>
        <p style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, marginBottom: "0.65rem" }}>
          مؤشرات حية من PostgreSQL (عبر واجهات النظام) — ليست أرقامًا تجريبية
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${dashType}-${liveStats.cases}-${liveStats.clients}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}
            className="kpi-grid"
          >
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                className="card-white hq-kpi-card"
                style={{ padding: "1.25rem 1.4rem", transition: "box-shadow 0.25s", opacity: 1, animation: "none" }}
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
        </>
        ) : null}

        {showAxes ? (
        <motion.div variants={fadeUp} custom={2} style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0a0a12", margin: 0 }}>المحاور القانونية</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                {allAxes.length} محور · {totalEmpireItems()} عنصر في الهيكل السيادي
              </span>
              {allowAxisCreate && (
                <button
                  type="button"
                  onClick={() => setAddAxisOpen(true)}
                  className="btn-primary"
                  style={{ padding: "0.55rem 1rem", fontSize: "0.82rem" }}
                >
                  ＋ إضافة محور
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.85rem" }} className="axis-grid">
            {allAxes.map((axis, i) => (
              <motion.div
                key={axis.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <div
                  className="card-white"
                  style={{
                    padding: "1.25rem",
                    borderTop: `3px solid ${axis.color}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                  }}
                >
                  <Link href={axis.href} style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>{axis.icon}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: axis.color }}>المحور {axis.id}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.88rem", marginBottom: "0.35rem", lineHeight: 1.4 }}>
                      {axis.title}
                    </h3>
                    <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.5rem" }}>{axis.subtitle}</p>
                    <span style={{ fontSize: "0.7rem", color: "#B79A61", fontWeight: 700 }}>
                      {"items" in axis || "dropdowns" in axis
                        ? `${countAxisItems(axis as ImperialAxis)} عنصر ←`
                        : "محور مخصص ←"}
                    </span>
                  </Link>
                  {allowAxisEdit ? (
                    <RowActions
                      actions={standardRowActions({
                        onEdit: () =>
                          setEditAxis({
                            slug: axis.slug,
                            isCustom: !!axis.isCustom,
                            title: axis.title,
                            subtitle: axis.subtitle,
                            icon: axis.icon,
                            color: axis.color,
                            description:
                              "description" in axis && typeof axis.description === "string"
                                ? axis.description
                                : axis.subtitle,
                          }),
                        onDelete:
                          pageSettings.actions?.allowDelete === false
                            ? undefined
                            : () =>
                                setDeleteAxis({
                                  slug: axis.slug,
                                  isCustom: !!axis.isCustom,
                                  title: axis.title,
                                }),
                      })}
                    />
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        ) : null}

        {(showSessions || showQuickLinks) ? (
        <motion.div variants={fadeUp} custom={3} style={{ display: "grid", gridTemplateColumns: showSessions && showQuickLinks ? "1fr 1fr" : "1fr", gap: "1.25rem", marginBottom: "1.75rem" }} className="two-col">
          {showSessions ? (
          <div className="card-white" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "1rem" }}>الجلسات (من قاعدة البيانات)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {liveSessions.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                  لا توجد جلسات مسجّلة حاليًا في PostgreSQL.
                </p>
              ) : (
                liveSessions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{ padding: "0.85rem", background: "#f8f9fb", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                >
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0a0a12" }}>{s.case}</p>
                  <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.court}</p>
                  <p style={{ fontSize: "0.72rem", color: "#B79A61", marginTop: "0.2rem", fontWeight: 600 }}>
                    🗓 {s.date || "—"}{s.status ? ` · ${s.status}` : ""}
                  </p>
                </motion.div>
              ))
              )}
            </div>
          </div>
          ) : null}

          {showQuickLinks ? (
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
          ) : null}
        </motion.div>
        ) : null}

        {showModules ? (
        <motion.div variants={fadeUp} custom={4} id="modules" className="card-white" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 800 }}>الوحدات التشغيلية</h2>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{modules.length} وحدة</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }} className="mod-grid">
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
        ) : null}
      </motion.div>

      <style>{`
        @media (max-width: 900px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .kpi-grid, .axis-grid, .mod-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Modal
        open={addAxisOpen}
        title="إضافة محور قانوني"
        fields={ADD_AXIS_FORM_FIELDS}
        onSave={handleAddAxis}
        onClose={() => setAddAxisOpen(false)}
        saveLabel="إضافة المحور"
        enableParties={false}
        filesLabel="شواهد وملفات المحور (مستند · صورة · فيديو)"
      />

      <Modal
        key={editAxis?.slug ?? "edit-axis-closed"}
        open={!!editAxis}
        title="تعديل محور قانوني"
        fields={ADD_AXIS_FORM_FIELDS}
        initial={
          editAxis
            ? {
                title: editAxis.title,
                subtitle: editAxis.subtitle,
                icon: editAxis.icon,
                color: editAxis.color,
                description: editAxis.description,
              }
            : undefined
        }
        onSave={handleEditAxis}
        onClose={() => setEditAxis(null)}
        saveLabel="حفظ التعديل"
        enableParties={false}
        filesLabel="شواهد وملفات المحور (مستند · صورة · فيديو)"
      />

      <ConfirmDialog
        open={!!deleteAxis}
        title="تأكيد حذف المحور"
        message={
          deleteAxis
            ? `هل تريد حذف المحور «${deleteAxis.title}»؟ لن يظهر بعد ذلك في قائمة المحاور.`
            : ""
        }
        confirmLabel="حذف المحور"
        loading={deletingAxis}
        onConfirm={confirmDeleteAxis}
        onCancel={() => setDeleteAxis(null)}
      />
    </AppShell>
  );
}
