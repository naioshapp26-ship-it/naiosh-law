"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ModuleShell } from "@/components/module-shell";
import { PageHeader, PageStats, PageLoader } from "@/components/domain-page";
import { useSession } from "@/lib/session";
import { moduleMap } from "@/data/modules";
import {
  LANDING_SPECIALTIES,
  landingSpecialtyMap,
  specialtyHref,
  type LandingSpecialty,
} from "@/data/landing-specialties";

type Props = {
  slug: string;
};

function SpecialtyRail({ activeSlug }: { activeSlug: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.45rem",
        marginBottom: "1.25rem",
      }}
    >
      {LANDING_SPECIALTIES.map((s) => {
        const active = s.slug === activeSlug;
        return (
          <Link
            key={s.slug}
            href={specialtyHref(s.slug)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.55rem 0.9rem",
              borderRadius: 12,
              fontSize: "0.82rem",
              fontWeight: 800,
              textDecoration: "none",
              background: active ? "#c3152a" : "#fff",
              color: active ? "#fff" : "#475569",
              border: active ? "1px solid #c3152a" : "1px solid #e2e8f0",
              boxShadow: active ? "0 8px 20px rgba(195,21,42,0.25)" : "none",
            }}
          >
            <span aria-hidden>{s.icon}</span>
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}

function asRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["items", "data", "rows", "results"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function DataTables({ specialty }: { specialty: LandingSpecialty }) {
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<{ label: string; rows: Record<string, unknown>[] }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const endpoints = specialty.apiEndpoints ?? [];
    if (!endpoints.length) {
      setLoading(false);
      setBundles([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await fetch(ep.url, { credentials: "include", cache: "no-store" });
              const json = await res.json().catch(() => []);
              return { label: ep.label, rows: res.ok ? asRows(json) : [] };
            } catch {
              return { label: ep.label, rows: [] };
            }
          })
        );
        if (!cancelled) setBundles(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [specialty]);

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <PageStats
        stats={bundles.map((b) => ({
          label: b.label,
          value: b.rows.length,
          icon: "📊",
          color: "#c3152a",
        }))}
      />

      {bundles.map((bundle) => {
        const cols = bundle.rows[0]
          ? Object.keys(bundle.rows[0]).filter((k) => k !== "id").slice(0, 6)
          : [];
        return (
          <div key={bundle.label} className="card-white" style={{ padding: "1.15rem", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontWeight: 800, fontSize: "1rem", margin: 0 }}>{bundle.label}</h3>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>{bundle.rows.length} سجل</span>
            </div>
            {bundle.rows.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>لا توجد بيانات بعد في هذا القسم</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th
                        key={c}
                        style={{
                          textAlign: "right",
                          padding: "0.55rem 0.65rem",
                          fontSize: "0.75rem",
                          color: "#64748b",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bundle.rows.slice(0, 25).map((row, idx) => (
                    <tr key={String(row.id ?? idx)}>
                      {cols.map((c) => (
                        <td
                          key={c}
                          style={{
                            padding: "0.55rem 0.65rem",
                            fontSize: "0.82rem",
                            color: "#0f172a",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          {String(row[c] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProfileHub() {
  const { user } = useSession();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const endpoints = [
      { key: "cases", url: "/api/cases" },
      { key: "clients", url: "/api/clients" },
      { key: "sessions", url: "/api/court-sessions" },
      { key: "archive", url: "/api/archive" },
    ];
    void Promise.all(
      endpoints.map(async (ep) => {
        try {
          const res = await fetch(ep.url, { credentials: "include", cache: "no-store" });
          const json = await res.json().catch(() => []);
          return [ep.key, res.ok ? asRows(json).length : 0] as const;
        } catch {
          return [ep.key, 0] as const;
        }
      })
    ).then((pairs) => setCounts(Object.fromEntries(pairs)));
  }, []);

  return (
    <div>
      <PageStats
        stats={[
          { label: "قضاياي", value: counts.cases ?? "—", icon: "⚖️" },
          { label: "موكلي", value: counts.clients ?? "—", icon: "👥" },
          { label: "جلساتي", value: counts.sessions ?? "—", icon: "🏛️" },
          { label: "أرشيفي", value: counts.archive ?? "—", icon: "📦" },
        ]}
      />
      <div className="card-white" style={{ padding: "1.35rem", marginBottom: "1.25rem" }}>
        <h3 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>مرحبًا {user?.name ?? "بك"}</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
          هذه صفحتك الشخصية داخل المنظومة — اختر تخصصًا من الشريط أعلاه لفتح مساحته الكاملة وبياناته.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {LANDING_SPECIALTIES.filter((s) => s.slug !== "profile").map((s) => (
          <Link
            key={s.slug}
            href={specialtyHref(s.slug)}
            className="card-white"
            style={{ padding: "1.1rem", textDecoration: "none", borderRight: "3px solid rgba(195,21,42,0.35)" }}
          >
            <div style={{ fontSize: "1.35rem", marginBottom: "0.35rem" }}>{s.icon}</div>
            <p style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.25rem" }}>{s.label}</p>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, lineHeight: 1.6 }}>{s.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SpecialtyWorkspace({ slug }: Props) {
  const specialty = landingSpecialtyMap[slug];
  const moduleMeta = specialty?.moduleSlug ? moduleMap[specialty.moduleSlug] : null;

  const highlights = useMemo(() => specialty?.highlights ?? [], [specialty]);

  if (!specialty) {
    return (
      <AppShell>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h2 style={{ fontWeight: 900 }}>التخصص غير موجود</h2>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>عد إلى الصفحة الرئيسية واختر تخصصًا من الشريط الجانبي</p>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/" className="btn-primary">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1240 }}>
        <SpecialtyRail activeSlug={specialty.slug} />

        <PageHeader
          icon={specialty.icon}
          title={specialty.title}
          subtitle={specialty.subtitle}
          actions={
            <>
              {specialty.domainHref && (
                <Link href={specialty.domainHref} className="btn-ghost-dark" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}>
                  الواجهة الكاملة ←
                </Link>
              )}
              {specialty.moduleSlug && (
                <Link href={`/app/modules/${specialty.moduleSlug}`} className="btn-primary" style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}>
                  فتح الوحدة التشغيلية
                </Link>
              )}
            </>
          }
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.45rem",
            marginBottom: "1.35rem",
          }}
        >
          {highlights.map((h) => (
            <span
              key={h}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: 999,
                background: "rgba(195,21,42,0.07)",
                color: "#9f1239",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "1px solid rgba(195,21,42,0.12)",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {moduleMeta && (
          <div className="card-white" style={{ padding: "1.15rem 1.25rem", marginBottom: "1.25rem" }}>
            <p style={{ fontWeight: 800, marginBottom: "0.45rem" }}>{moduleMeta.title}</p>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "0.75rem", lineHeight: 1.7 }}>
              {moduleMeta.subtitle}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {moduleMeta.screens.slice(0, 8).map((screen) => (
                <span
                  key={screen}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#475569",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "0.28rem 0.55rem",
                  }}
                >
                  {screen}
                </span>
              ))}
            </div>
          </div>
        )}

        {specialty.slug === "profile" ? (
          <ProfileHub />
        ) : specialty.moduleSlug ? (
          <div style={{ marginTop: "0.25rem" }}>
            <ModuleShell slug={specialty.moduleSlug} embedded />
          </div>
        ) : (
          <DataTables specialty={specialty} />
        )}

        {!specialty.moduleSlug && specialty.domainHref && specialty.slug !== "profile" && (
          <div style={{ marginTop: "1.25rem" }}>
            <Link href={specialty.domainHref} className="btn-primary" style={{ display: "inline-flex" }}>
              فتح كل أدوات {specialty.label}
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
