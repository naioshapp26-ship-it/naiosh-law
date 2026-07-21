"use client";

import Link from "next/link";
import {
  erpModuleHref,
  type ErpNavLeaf,
  type ErpNavModule,
} from "@/data/erp-sidebar-modules";

type HubProps = {
  module: ErpNavModule;
};

type LeafProps = {
  item: ErpNavLeaf;
  parent?: ErpNavModule | null;
};

export function ErpModuleHub({ module }: HubProps) {
  const subs = module.subItems ?? [];

  return (
    <div className="erp-page" style={{ width: "100%" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #7f0d1a 0%, #0a0a12 100%)",
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          marginBottom: "1.75rem",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              display: "grid",
              placeItems: "center",
              fontSize: "1.25rem",
            }}
          >
            <i className={`fas ${module.icon}`} aria-hidden />
          </span>
          <div>
            <p style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 2 }}>وحدات المنظومة · ERP</p>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 900, margin: 0 }}>{module.label}</h1>
          </div>
        </div>
        <p style={{ fontSize: "0.9rem", opacity: 0.9, maxWidth: 640, lineHeight: 1.7 }}>
          وحدة تشغيلية من منظومة نايوش — تحتوي على {subs.length} صفحة فرعية بنفس هيكل القائمة الجانبية في نظام ERP.
        </p>
      </div>

      {subs.length === 0 ? (
        <ErpLeafPanel item={module} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {subs.map((sub) => (
            <Link
              key={sub.id}
              href={erpModuleHref(sub.id)}
              className="card-white"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.85rem",
                padding: "1.1rem 1.15rem",
                textDecoration: "none",
                borderRight: "3px solid rgba(195,21,42,0.4)",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(195,21,42,0.08)",
                  color: "#c3152a",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <i className={`fas ${sub.icon}`} aria-hidden />
              </span>
              <div>
                <p style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.9rem", marginBottom: 4 }}>
                  {sub.label}
                </p>
                <span style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}>
                  فتح الصفحة ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ErpModuleLeaf({ item, parent }: LeafProps) {
  return (
    <div className="erp-page" style={{ width: "100%" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #7f0d1a 0%, #0a0a12 100%)",
          borderRadius: "20px",
          padding: "1.75rem 2rem",
          marginBottom: "1.5rem",
          color: "#fff",
        }}
      >
        {parent && (
          <p style={{ fontSize: "0.78rem", opacity: 0.8, marginBottom: 6 }}>
            <Link href={erpModuleHref(parent.id)} style={{ color: "#fff", textDecoration: "underline" }}>
              {parent.label}
            </Link>
            {" · "}
            صفحة فرعية
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <i className={`fas ${item.icon}`} style={{ fontSize: "1.35rem" }} aria-hidden />
          <h1 style={{ fontSize: "1.45rem", fontWeight: 900, margin: 0 }}>{item.label}</h1>
        </div>
      </div>

      <ErpLeafPanel item={item} parent={parent} />
    </div>
  );
}

function ErpLeafPanel({ item, parent }: { item: ErpNavLeaf; parent?: ErpNavModule | null }) {
  return (
    <div className="card-white" style={{ padding: "1.5rem 1.6rem" }}>
      <p style={{ color: "#475569", fontSize: "0.92rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
        هذه الصفحة مضافة من قائمة ERP الجانبية بنفس المعرّف والخصائص
        {parent ? ` ضمن وحدة «${parent.label}»` : ""}. يمكن ربطها لاحقًا بواجهات التشغيل والبيانات الفعلية
        مع الإبقاء على نفس المسار والقائمة.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        {[
          { label: "المعرّف", value: item.id },
          { label: "الأيقونة", value: item.icon },
          { label: "النوع", value: parent ? "صفحة فرعية" : "وحدة رئيسية" },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "0.85rem 1rem",
            }}
          >
            <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 4 }}>{row.label}</p>
            <p style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem", wordBreak: "break-all" }}>
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
        {parent && (
          <Link
            href={erpModuleHref(parent.id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-700 font-semibold text-sm hover:bg-red-50"
          >
            العودة إلى {parent.label}
          </Link>
        )}
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 font-medium text-sm hover:text-red-600"
        >
          لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
