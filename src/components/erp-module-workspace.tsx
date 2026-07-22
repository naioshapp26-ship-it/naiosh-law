"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  computeEntityStats,
  type ErpCardDef,
  type ErpKpiDef,
  type ErpMethodDef,
  type ErpPageConfig,
  type ErpPanelDef,
  type ErpPolicyDef,
} from "@/data/erp-page-catalog";
import { erpModuleHref, type ErpNavModule } from "@/data/erp-sidebar-modules";
import { Modal } from "@/components/ui/modal";
import type { FormField } from "@/data/module-configs";
import { defaultLabeledCreateFields, fieldsFromColumnLabels } from "@/lib/form-field-labels";

function useErpStudioCss() {
  useEffect(() => {
    if (document.querySelector('link[data-erp-studio]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/erp-app/studio.css";
    link.setAttribute("data-erp-studio", "1");
    document.head.appendChild(link);
  }, []);
}

function gradientCss(gradient: string) {
  const map: Record<string, string> = {
    "from-red-800 to-red-600": "linear-gradient(135deg,#7f1d1d,#dc2626)",
    "from-red-900 to-red-700": "linear-gradient(135deg,#7f1d1d,#b91c1c)",
    "from-red-700 to-rose-600": "linear-gradient(135deg,#b91c1c,#e11d48)",
    "from-rose-800 to-rose-600": "linear-gradient(135deg,#9f1239,#e11d48)",
    "from-rose-700 to-red-600": "linear-gradient(135deg,#be123c,#dc2626)",
    "from-indigo-800 to-indigo-600": "linear-gradient(135deg,#3730a3,#4f46e5)",
    "from-indigo-700 to-blue-600": "linear-gradient(135deg,#4338ca,#2563eb)",
    "from-indigo-700 to-violet-600": "linear-gradient(135deg,#4338ca,#7c3aed)",
    "from-emerald-800 to-emerald-600": "linear-gradient(135deg,#065f46,#059669)",
    "from-emerald-700 to-teal-600": "linear-gradient(135deg,#047857,#0d9488)",
    "from-emerald-700 to-green-600": "linear-gradient(135deg,#047857,#16a34a)",
    "from-teal-800 to-teal-600": "linear-gradient(135deg,#115e59,#0d9488)",
    "from-teal-700 to-emerald-600": "linear-gradient(135deg,#0f766e,#059669)",
    "from-teal-700 to-cyan-600": "linear-gradient(135deg,#0f766e,#0891b2)",
    "from-violet-800 to-violet-600": "linear-gradient(135deg,#5b21b6,#7c3aed)",
    "from-violet-700 to-indigo-600": "linear-gradient(135deg,#6d28d9,#4f46e5)",
    "from-violet-700 to-fuchsia-600": "linear-gradient(135deg,#6d28d9,#c026d3)",
    "from-violet-700 to-purple-600": "linear-gradient(135deg,#6d28d9,#9333ea)",
    "from-slate-800 to-slate-600": "linear-gradient(135deg,#1e293b,#475569)",
    "from-slate-700 to-slate-500": "linear-gradient(135deg,#334155,#64748b)",
    "from-slate-700 to-blue-700": "linear-gradient(135deg,#334155,#1d4ed8)",
    "from-slate-700 to-cyan-700": "linear-gradient(135deg,#334155,#0e7490)",
    "from-slate-800 to-indigo-700": "linear-gradient(135deg,#1e293b,#4338ca)",
    "from-slate-800 to-red-800": "linear-gradient(135deg,#1e293b,#991b1b)",
    "from-slate-900 to-indigo-900": "linear-gradient(135deg,#0f172a,#312e81)",
    "from-purple-800 to-indigo-600": "linear-gradient(135deg,#6b21a8,#4f46e5)",
    "from-purple-700 to-indigo-600": "linear-gradient(135deg,#7e22ce,#4f46e5)",
    "from-purple-600 to-indigo-600": "linear-gradient(135deg,#9333ea,#4f46e5)",
    "from-fuchsia-900 to-purple-700": "linear-gradient(135deg,#701a75,#7e22ce)",
    "from-fuchsia-700 to-purple-600": "linear-gradient(135deg,#a21caf,#9333ea)",
    "from-fuchsia-700 to-pink-600": "linear-gradient(135deg,#a21caf,#db2777)",
    "from-blue-800 to-blue-600": "linear-gradient(135deg,#1e40af,#2563eb)",
    "from-blue-700 to-indigo-600": "linear-gradient(135deg,#1d4ed8,#4f46e5)",
    "from-blue-700 to-sky-600": "linear-gradient(135deg,#1d4ed8,#0284c7)",
    "from-blue-600 to-indigo-600": "linear-gradient(135deg,#2563eb,#4f46e5)",
    "from-sky-800 to-sky-600": "linear-gradient(135deg,#075985,#0284c7)",
    "from-sky-700 to-blue-600": "linear-gradient(135deg,#0369a1,#2563eb)",
    "from-cyan-700 to-teal-600": "linear-gradient(135deg,#0e7490,#0d9488)",
    "from-cyan-700 to-blue-600": "linear-gradient(135deg,#0e7490,#2563eb)",
    "from-cyan-700 to-indigo-700": "linear-gradient(135deg,#0e7490,#4338ca)",
    "from-amber-700 to-orange-600": "linear-gradient(135deg,#b45309,#ea580c)",
    "from-amber-700 to-yellow-600": "linear-gradient(135deg,#b45309,#ca8a04)",
    "from-amber-600 to-orange-500": "linear-gradient(135deg,#d97706,#f97316)",
    "from-amber-600 to-yellow-500": "linear-gradient(135deg,#d97706,#eab308)",
    "from-orange-700 to-amber-600": "linear-gradient(135deg,#c2410c,#d97706)",
    "from-yellow-600 to-amber-500": "linear-gradient(135deg,#ca8a04,#f59e0b)",
    "from-pink-700 to-rose-600": "linear-gradient(135deg,#be185d,#e11d48)",
    "from-rose-700 to-pink-600": "linear-gradient(135deg,#be123c,#db2777)",
    "from-red-900 to-rose-700": "linear-gradient(135deg,#7f1d1d,#be123c)",
    "from-red-900 to-slate-800": "linear-gradient(135deg,#7f1d1d,#1e293b)",
    "from-red-800 to-orange-600": "linear-gradient(135deg,#991b1b,#ea580c)",
    "from-red-800 to-rose-600": "linear-gradient(135deg,#991b1b,#e11d48)",
    "from-green-700 to-emerald-600": "linear-gradient(135deg,#15803d,#059669)",
    "from-stone-700 to-stone-500": "linear-gradient(135deg,#44403c,#78716c)",
    "from-indigo-700 to-slate-700": "linear-gradient(135deg,#4338ca,#334155)",
  };
  return map[gradient] || "linear-gradient(135deg,#7f1d1d,#b91c1c)";
}

function DataTable({
  title,
  columns,
  seed,
  actionLabel = "إضافة",
  onAdd,
}: {
  title: string;
  columns: string[];
  seed: string[][];
  actionLabel?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-800 m-0">{title}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-soft">
            <i className="fas fa-rotate" /> تحديث
          </button>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            <i className="fas fa-plus" /> {actionLabel}
          </button>
          <button type="button" className="btn btn-soft">
            <i className="fas fa-download" /> تصدير
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="table-cell text-right">
                  {col}
                </th>
              ))}
              <th className="table-cell text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {seed.length === 0 ? (
              <tr>
                <td className="table-cell text-center text-slate-400" colSpan={columns.length + 1}>
                  لا توجد بيانات — استخدم زر الإضافة لإنشاء سجل جديد
                </td>
              </tr>
            ) : (
              seed.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} className="table-cell text-right">
                      {cell}
                    </td>
                  ))}
                  <td className="table-cell text-right">
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="btn btn-soft btn-xs">
                        عرض
                      </button>
                      <button type="button" className="btn btn-soft btn-xs">
                        تعديل
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useLabeledAddModal(title: string, fields: FormField[]) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  const modal = (
    <Modal
      open={open}
      title={`إضافة ${title}`}
      fields={fields}
      onSave={(data) => {
        setRows((prev) => [data, ...prev]);
        setOpen(false);
      }}
      onClose={() => setOpen(false)}
      saveLabel="إضافة"
      filesLabel="شواهد وملفات القضية (مستند · صورة · فيديو)"
    />
  );

  return { openAdd: () => setOpen(true), modal, rows };
}

function EntityOpsBody({ config }: { config: ErpPageConfig }) {
  const stats = config.stats ?? [];
  const seed = useMemo(() => config.seed ?? [], [config.seed]);
  const columns = useMemo(() => config.columns ?? [], [config.columns]);
  const values = computeEntityStats(seed, stats);
  const fields = useMemo(
    () => (columns.length ? fieldsFromColumnLabels(columns) : defaultLabeledCreateFields(config.title)),
    [columns, config.title]
  );
  const { openAdd, modal, rows } = useLabeledAddModal(config.title, fields);
  const localSeed = useMemo(() => {
    if (!rows.length) return seed;
    const extras = rows.map((r) =>
      columns.map((col, i) => {
        const key = fields[i]?.key;
        return String((key ? r[key] : "") ?? r[col] ?? "—");
      })
    );
    return [...extras, ...seed];
  }, [rows, seed, columns, fields]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div key={item.key} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-bold">{item.label}</span>
              <i className={`fas ${item.icon} ${item.tone}`} aria-hidden />
            </div>
            <p className="text-3xl font-black text-slate-800 m-0">{(values[item.key] ?? 0) + rows.length}</p>
          </div>
        ))}
      </div>
      <DataTable title={`سجل ${config.title}`} columns={columns} seed={localSeed} onAdd={openAdd} />
      {modal}
    </>
  );
}

function KpiPanelsBody({
  title,
  kpis = [],
  panels = [],
}: {
  title: string;
  kpis?: ErpKpiDef[];
  panels?: ErpPanelDef[];
}) {
  const fields = useMemo(() => defaultLabeledCreateFields(title), [title]);
  const { openAdd, modal } = useLabeledAddModal(title, fields);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-bold">{kpi.label}</span>
              {kpi.icon ? <i className={`fas ${kpi.icon} text-slate-400`} aria-hidden /> : null}
            </div>
            <p className="text-3xl font-black text-slate-800 m-0">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {panels.map((panel) => (
          <div key={panel.title} className="panel p-5">
            <h3 className="font-bold text-slate-800 mb-4 mt-0">{panel.title}</h3>
            <ul className="space-y-2 m-0 p-0 list-none">
              {panel.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="panel p-5">
        <h3 className="font-bold text-slate-800 mb-4 mt-0">إجراءات سريعة</h3>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            إضافة عنصر
          </button>
          {["تحديث البيانات", "تصدير تقرير", "إعدادات الوحدة"].map((label) => (
            <button key={label} type="button" className="btn btn-primary">
              {label}
            </button>
          ))}
        </div>
      </div>
      {modal}
    </>
  );
}

function CardGridBody({ cards = [] }: { cards?: ErpCardDef[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="stat-card">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-black text-slate-800 m-0">{card.title}</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700">{card.meta}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed m-0">{card.desc}</p>
          <button type="button" className="btn btn-soft mt-4">
            فتح التفاصيل ←
          </button>
        </div>
      ))}
    </div>
  );
}

function PaymentMethodsBody({ methods = [] }: { methods?: ErpMethodDef[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {methods.map((method) => (
        <div key={method.id} className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-red-50 text-red-700 grid place-items-center">
              <i className={`fas ${method.icon}`} aria-hidden />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 m-0">{method.title}</h3>
              <p className="text-xs text-slate-500 m-0">{method.desc}</p>
            </div>
          </div>
          <span
            className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${
              method.status === "مفعّل" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {method.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function PaymentInvoicesBody({ config }: { config: ErpPageConfig }) {
  const columns = useMemo(() => config.columns ?? [], [config.columns]);
  const baseSeed = useMemo(() => config.seed ?? [], [config.seed]);
  const fields = useMemo(
    () => (columns.length ? fieldsFromColumnLabels(columns) : defaultLabeledCreateFields(config.title)),
    [columns, config.title]
  );
  const { openAdd, modal, rows } = useLabeledAddModal(config.title, fields);
  const seed = useMemo(() => {
    if (!rows.length) return baseSeed;
    const extras = rows.map((r) =>
      columns.map((col, i) => {
        const key = fields[i]?.key;
        return String((key ? r[key] : "") ?? r[col] ?? "—");
      })
    );
    return [...extras, ...baseSeed];
  }, [baseSeed, rows, columns, fields]);

  return (
    <>
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <i className="fas fa-plus" /> فاتورة جديدة
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(config.kpis ?? []).map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-5 text-white shadow-lg"
            style={{
              background:
                kpi.tone === "from-green-500 to-green-600"
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : kpi.tone === "from-emerald-500 to-teal-600"
                    ? "linear-gradient(135deg,#10b981,#0d9488)"
                    : kpi.tone === "from-amber-500 to-orange-600"
                      ? "linear-gradient(135deg,#f59e0b,#ea580c)"
                      : "linear-gradient(135deg,#f43f5e,#dc2626)",
              color: "#fff",
            }}
          >
            <p className="text-sm mb-1 opacity-90 m-0">{kpi.label}</p>
            <p className="text-3xl font-black m-0">{kpi.value}</p>
          </div>
        ))}
      </div>
      <DataTable
        title={`سجل ${config.title}`}
        columns={columns}
        seed={seed}
        actionLabel="فاتورة"
        onAdd={openAdd}
      />
      {modal}
    </>
  );
}

function PoliciesBody({ kpis = [], policies = [] }: { kpis?: ErpKpiDef[]; policies?: ErpPolicyDef[] }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <p className="text-xs text-slate-500 font-bold mb-1 m-0">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-800 m-0">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {policies.map((policy) => (
          <article key={policy.title} className="panel p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-slate-800 m-0">{policy.title}</h3>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-700">{policy.status}</span>
            </div>
            <p className="text-xs text-slate-500 m-0">آخر تحديث: {policy.updated}</p>
            <button type="button" className="btn btn-soft mt-4">
              عرض السياسة ←
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function HubBody({ module }: { module: ErpNavModule }) {
  const subs = module.subItems ?? [];
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "الصفحات الفرعية", value: String(subs.length), icon: "fa-layer-group" },
          { label: "وحدات نشطة", value: String(Math.max(subs.length - 1, 0)), icon: "fa-circle-check" },
          { label: "بانتظار إعداد", value: "1", icon: "fa-clock" },
          { label: "اختصارات سريعة", value: String(Math.min(subs.length, 4)), icon: "fa-bolt" },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-bold">{kpi.label}</span>
              <i className={`fas ${kpi.icon} text-red-700`} aria-hidden />
            </div>
            <p className="text-3xl font-black text-slate-800 m-0">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subs.map((sub) => (
          <Link key={sub.id} href={erpModuleHref(sub.id)} className="stat-card no-underline hover:border-red-200 transition block">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-xl bg-red-50 text-red-700 grid place-items-center">
                <i className={`fas ${sub.icon}`} aria-hidden />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 m-0">{sub.label}</h3>
                <p className="text-xs text-slate-500 m-0">صفحة تشغيلية</p>
              </div>
            </div>
            <span className="text-sm font-bold text-red-700">فتح الصفحة ←</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function OpsHero({
  config,
  crumb,
}: {
  config: ErpPageConfig;
  crumb?: { label: string; href: string } | null;
}) {
  return (
    <header
      className="rounded-2xl p-6 relative overflow-hidden text-white shadow-lg"
      style={{ background: gradientCss(config.gradient), color: "#fff" }}
    >
      <div className="absolute -left-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      {crumb ? (
        <p className="text-sm mb-2 relative z-10" style={{ color: "rgba(255,255,255,0.85)" }}>
          <Link href={crumb.href} className="underline underline-offset-2" style={{ color: "#fff" }}>
            {crumb.label}
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span>{config.title}</span>
        </p>
      ) : null}
      <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 relative z-10 m-0" style={{ color: "#fff" }}>
        <i className={`fas ${config.icon}`} aria-hidden />
        {config.title}
      </h2>
      <p className="mt-2 text-sm md:text-base relative z-10 m-0" style={{ color: "rgba(255,255,255,0.92)" }}>
        {config.subtitle}
      </p>
    </header>
  );
}

type Props = {
  pageId: string;
  config: ErpPageConfig;
  module?: ErpNavModule | null;
  parent?: ErpNavModule | null;
};

export function ErpWorkspacePage({ pageId, config, module, parent }: Props) {
  useErpStudioCss();
  const crumb = parent ? { label: parent.label, href: erpModuleHref(parent.id) } : null;

  return (
    <div
      className="erp-page erp-workspace space-y-5"
      data-erp-page={pageId}
      style={{ width: "100%", maxWidth: "80rem", marginLeft: "auto", marginRight: "auto" }}
    >
      <OpsHero config={config} crumb={crumb} />
      {config.kind === "hub" && module ? <HubBody module={module} /> : null}
      {config.kind === "entity-ops" ? <EntityOpsBody config={config} /> : null}
      {config.kind === "kpi-panels" ? (
        <KpiPanelsBody title={config.title} kpis={config.kpis} panels={config.panels} />
      ) : null}
      {config.kind === "card-grid" ? <CardGridBody cards={config.cards} /> : null}
      {config.kind === "payment-methods" ? <PaymentMethodsBody methods={config.methods} /> : null}
      {config.kind === "payment-invoices" ? <PaymentInvoicesBody config={config} /> : null}
      {config.kind === "policies" ? <PoliciesBody kpis={config.kpis} policies={config.policies} /> : null}
    </div>
  );
}
