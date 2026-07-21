"use client";

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

function gradientClass(gradient: string) {
  // Tailwind needs full class names present in source for detection; use inline style fallback map.
  const map: Record<string, string> = {
    "from-red-800 to-red-600": "linear-gradient(90deg,#991b1b,#dc2626)",
    "from-red-900 to-red-700": "linear-gradient(90deg,#7f1d1d,#b91c1c)",
    "from-red-700 to-rose-600": "linear-gradient(90deg,#b91c1c,#e11d48)",
    "from-rose-800 to-rose-600": "linear-gradient(90deg,#9f1239,#e11d48)",
    "from-rose-700 to-red-600": "linear-gradient(90deg,#be123c,#dc2626)",
    "from-indigo-800 to-indigo-600": "linear-gradient(90deg,#3730a3,#4f46e5)",
    "from-indigo-700 to-blue-600": "linear-gradient(90deg,#4338ca,#2563eb)",
    "from-indigo-700 to-violet-600": "linear-gradient(90deg,#4338ca,#7c3aed)",
    "from-emerald-800 to-emerald-600": "linear-gradient(90deg,#065f46,#059669)",
    "from-emerald-700 to-teal-600": "linear-gradient(90deg,#047857,#0d9488)",
    "from-emerald-700 to-green-600": "linear-gradient(90deg,#047857,#16a34a)",
    "from-teal-800 to-teal-600": "linear-gradient(90deg,#115e59,#0d9488)",
    "from-teal-700 to-emerald-600": "linear-gradient(90deg,#0f766e,#059669)",
    "from-teal-700 to-cyan-600": "linear-gradient(90deg,#0f766e,#0891b2)",
    "from-violet-800 to-violet-600": "linear-gradient(90deg,#5b21b6,#7c3aed)",
    "from-violet-700 to-indigo-600": "linear-gradient(90deg,#6d28d9,#4f46e5)",
    "from-violet-700 to-fuchsia-600": "linear-gradient(90deg,#6d28d9,#c026d3)",
    "from-violet-700 to-purple-600": "linear-gradient(90deg,#6d28d9,#9333ea)",
    "from-slate-800 to-slate-600": "linear-gradient(90deg,#1e293b,#475569)",
    "from-slate-700 to-slate-500": "linear-gradient(90deg,#334155,#64748b)",
    "from-slate-700 to-blue-700": "linear-gradient(90deg,#334155,#1d4ed8)",
    "from-slate-700 to-cyan-700": "linear-gradient(90deg,#334155,#0e7490)",
    "from-slate-800 to-indigo-700": "linear-gradient(90deg,#1e293b,#4338ca)",
    "from-slate-800 to-red-800": "linear-gradient(90deg,#1e293b,#991b1b)",
    "from-slate-900 to-indigo-900": "linear-gradient(135deg,#0f172a,#312e81)",
    "from-purple-800 to-indigo-600": "linear-gradient(90deg,#6b21a8,#4f46e5)",
    "from-purple-700 to-indigo-600": "linear-gradient(90deg,#7e22ce,#4f46e5)",
    "from-purple-600 to-indigo-600": "linear-gradient(90deg,#9333ea,#4f46e5)",
    "from-fuchsia-900 to-purple-700": "linear-gradient(90deg,#701a75,#7e22ce)",
    "from-fuchsia-700 to-purple-600": "linear-gradient(90deg,#a21caf,#9333ea)",
    "from-fuchsia-700 to-pink-600": "linear-gradient(90deg,#a21caf,#db2777)",
    "from-blue-800 to-blue-600": "linear-gradient(90deg,#1e40af,#2563eb)",
    "from-blue-700 to-indigo-600": "linear-gradient(90deg,#1d4ed8,#4f46e5)",
    "from-blue-700 to-sky-600": "linear-gradient(90deg,#1d4ed8,#0284c7)",
    "from-blue-600 to-indigo-600": "linear-gradient(90deg,#2563eb,#4f46e5)",
    "from-sky-800 to-sky-600": "linear-gradient(90deg,#075985,#0284c7)",
    "from-sky-700 to-blue-600": "linear-gradient(90deg,#0369a1,#2563eb)",
    "from-cyan-700 to-teal-600": "linear-gradient(90deg,#0e7490,#0d9488)",
    "from-cyan-700 to-blue-600": "linear-gradient(90deg,#0e7490,#2563eb)",
    "from-cyan-700 to-indigo-700": "linear-gradient(90deg,#0e7490,#4338ca)",
    "from-amber-700 to-orange-600": "linear-gradient(90deg,#b45309,#ea580c)",
    "from-amber-700 to-yellow-600": "linear-gradient(90deg,#b45309,#ca8a04)",
    "from-amber-600 to-orange-500": "linear-gradient(90deg,#d97706,#f97316)",
    "from-amber-600 to-yellow-500": "linear-gradient(90deg,#d97706,#eab308)",
    "from-orange-700 to-amber-600": "linear-gradient(90deg,#c2410c,#d97706)",
    "from-yellow-600 to-amber-500": "linear-gradient(90deg,#ca8a04,#f59e0b)",
    "from-pink-700 to-rose-600": "linear-gradient(90deg,#be185d,#e11d48)",
    "from-rose-700 to-pink-600": "linear-gradient(90deg,#be123c,#db2777)",
    "from-red-900 to-rose-700": "linear-gradient(90deg,#7f1d1d,#be123c)",
    "from-red-900 to-slate-800": "linear-gradient(90deg,#7f1d1d,#1e293b)",
    "from-red-800 to-orange-600": "linear-gradient(90deg,#991b1b,#ea580c)",
    "from-red-800 to-rose-600": "linear-gradient(90deg,#991b1b,#e11d48)",
    "from-green-700 to-emerald-600": "linear-gradient(90deg,#15803d,#059669)",
    "from-stone-700 to-stone-500": "linear-gradient(90deg,#44403c,#78716c)",
    "from-indigo-700 to-slate-700": "linear-gradient(90deg,#4338ca,#334155)",
  };
  return map[gradient] || "linear-gradient(90deg,#7f1d1d,#b91c1c)";
}

function PageHero({
  config,
  crumb,
}: {
  config: ErpPageConfig;
  crumb?: { label: string; href: string } | null;
}) {
  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
      style={{ background: gradientClass(config.gradient), color: "#fff" }}
    >
      {crumb && (
        <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
          <Link href={crumb.href} className="underline underline-offset-2" style={{ color: "#fff" }}>
            {crumb.label}
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span>{config.title}</span>
        </p>
      )}
      <h2
        className="text-2xl md:text-3xl font-black flex items-center gap-3"
        style={{ color: "#fff", margin: 0 }}
      >
        <i className={`fas ${config.icon}`} aria-hidden />
        {config.title}
      </h2>
      <p className="mt-2 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.92)" }}>
        {config.subtitle}
      </p>
    </div>
  );
}

function EntityOpsBody({ config }: { config: ErpPageConfig }) {
  const seed = config.seed ?? [];
  const stats = config.stats ?? [];
  const columns = config.columns ?? [];
  const values = computeEntityStats(seed, stats);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div key={item.key} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">{item.label}</span>
              <i className={`fas ${item.icon} ${item.tone}`} aria-hidden />
            </div>
            <p className="text-3xl font-black text-slate-800">{values[item.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800">سجل {config.title}</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
              <i className="fas fa-rotate" /> تحديث
            </button>
            <button type="button" className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold">
              <i className="fas fa-plus" /> إضافة
            </button>
            <button type="button" className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold">
              <i className="fas fa-download" /> تصدير
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-bold">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {seed.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400 text-sm">
                    لا توجد بيانات — استخدم زر الإضافة لإنشاء سجل جديد
                  </td>
                </tr>
              ) : (
                seed.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-red-50/40 transition">
                    {row.map((cell, i) => (
                      <td key={i} className="px-4 py-3 text-sm text-slate-700">
                        {cell}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="text-xs font-bold text-blue-700 hover:underline">
                          عرض
                        </button>
                        <button type="button" className="text-xs font-bold text-amber-700 hover:underline">
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
    </>
  );
}

function KpiPanelsBody({ kpis = [], panels = [] }: { kpis?: ErpKpiDef[]; panels?: ErpPanelDef[] }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-bold">{kpi.label}</p>
              {kpi.icon && <i className={`fas ${kpi.icon} text-slate-400`} aria-hidden />}
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {panels.map((panel) => (
          <div key={panel.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">{panel.title}</h3>
            <ul className="space-y-2">
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">إجراءات سريعة</h3>
        <div className="flex flex-wrap gap-3">
          {["تحديث البيانات", "إضافة عنصر", "تصدير تقرير", "إعدادات الوحدة"].map((label) => (
            <button
              key={label}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CardGridBody({ cards = [] }: { cards?: ErpCardDef[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-black text-slate-800">{card.title}</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700">{card.meta}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
          <button type="button" className="mt-4 text-sm font-bold text-red-700 hover:underline">
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
        <div key={method.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-red-50 text-red-700 grid place-items-center">
              <i className={`fas ${method.icon}`} aria-hidden />
            </span>
            <div>
              <h3 className="font-bold text-slate-800">{method.title}</h3>
              <p className="text-xs text-slate-500">{method.desc}</p>
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
  return (
    <>
      <div className="flex justify-end items-center flex-wrap gap-3">
        <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          فاتورة جديدة
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(config.kpis ?? []).map((kpi) => (
          <div
            key={kpi.label}
            className="text-white p-6 rounded-lg shadow-lg"
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
            <p className="text-sm opacity-90 mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>{kpi.label}</p>
            <p className="text-3xl font-black" style={{ color: "#fff" }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <EntityOpsBody
        config={{
          ...config,
          kind: "entity-ops",
          stats: [
            { key: "total", label: "الفواتير", icon: "fa-file-invoice", tone: "text-red-700" },
            { key: "done", label: "مدفوعة", icon: "fa-check", tone: "text-emerald-600" },
            { key: "active", label: "معلقة", icon: "fa-clock", tone: "text-amber-600" },
            { key: "urgent", label: "متأخرة", icon: "fa-bolt", tone: "text-rose-600" },
          ],
        }}
      />
    </>
  );
}

function StudioBody({ config }: { config: ErpPageConfig }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(config.tabs ?? []).map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
              i === 0
                ? "bg-red-700 text-white border-red-700"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(config.kpis ?? []).map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-bold mb-2">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>
      <EntityOpsBody
        config={{
          ...config,
          kind: "entity-ops",
          stats: [
            { key: "total", label: "العناصر", icon: "fa-layer-group", tone: "text-slate-700" },
            { key: "active", label: "نشطة", icon: "fa-play", tone: "text-amber-600" },
            { key: "done", label: "منشورة", icon: "fa-check", tone: "text-emerald-600" },
            { key: "urgent", label: "مسودات", icon: "fa-file", tone: "text-rose-600" },
          ],
        }}
      />
    </>
  );
}

function PoliciesBody({ kpis = [], policies = [] }: { kpis?: ErpKpiDef[]; policies?: ErpPolicyDef[] }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white/90 backdrop-blur rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-bold mb-1">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {policies.map((policy) => (
          <article key={policy.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-slate-800">{policy.title}</h3>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-700">{policy.status}</span>
            </div>
            <p className="text-xs text-slate-500">آخر تحديث: {policy.updated}</p>
            <button type="button" className="mt-4 text-sm font-bold text-red-700 hover:underline">
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
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">{kpi.label}</span>
              <i className={`fas ${kpi.icon} text-red-700`} aria-hidden />
            </div>
            <p className="text-3xl font-black text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {subs.map((sub) => (
          <Link
            key={sub.id}
            href={erpModuleHref(sub.id)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-red-200 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-xl bg-red-50 text-red-700 grid place-items-center">
                <i className={`fas ${sub.icon}`} aria-hidden />
              </span>
              <div>
                <h3 className="font-bold text-slate-800">{sub.label}</h3>
                <p className="text-xs text-slate-500">صفحة تشغيلية</p>
              </div>
            </div>
            <span className="text-sm font-bold text-red-700">فتح الصفحة ←</span>
          </Link>
        ))}
      </div>
    </>
  );
}

type Props = {
  pageId: string;
  config: ErpPageConfig;
  module?: ErpNavModule | null;
  parent?: ErpNavModule | null;
};

export function ErpWorkspacePage({ pageId, config, module, parent }: Props) {
  const crumb = parent
    ? { label: parent.label, href: erpModuleHref(parent.id) }
    : null;

  return (
    <div className="erp-page space-y-6 animate-fade-in" data-erp-page={pageId} style={{ width: "100%" }}>
      <PageHero config={config} crumb={crumb} />

      {config.kind === "hub" && module ? <HubBody module={module} /> : null}
      {config.kind === "entity-ops" ? <EntityOpsBody config={config} /> : null}
      {config.kind === "kpi-panels" ? <KpiPanelsBody kpis={config.kpis} panels={config.panels} /> : null}
      {config.kind === "card-grid" ? <CardGridBody cards={config.cards} /> : null}
      {config.kind === "payment-methods" ? <PaymentMethodsBody methods={config.methods} /> : null}
      {config.kind === "payment-invoices" ? <PaymentInvoicesBody config={config} /> : null}
      {config.kind === "studio" ? <StudioBody config={config} /> : null}
      {config.kind === "policies" ? <PoliciesBody kpis={config.kpis} policies={config.policies} /> : null}

      {!["hub", "entity-ops", "kpi-panels", "card-grid", "payment-methods", "payment-invoices", "studio", "policies"].includes(
        config.kind
      ) && <EntityOpsBody config={config} />}
    </div>
  );
}
