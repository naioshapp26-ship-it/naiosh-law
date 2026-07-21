import catalogJson from "@/data/erp-page-catalog.json";

export type ErpStatDef = {
  key: string;
  label: string;
  icon: string;
  tone: string;
};

export type ErpKpiDef = {
  label: string;
  value: string;
  icon?: string;
  tone?: string;
};

export type ErpPanelDef = {
  title: string;
  items: string[];
};

export type ErpCardDef = {
  title: string;
  desc: string;
  meta: string;
};

export type ErpMethodDef = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  status: string;
};

export type ErpPolicyDef = {
  title: string;
  status: string;
  updated: string;
};

export type ErpPageConfig = {
  kind:
    | "hub"
    | "entity-ops"
    | "payment-invoices"
    | "payment-methods"
    | "card-grid"
    | "kpi-panels"
    | "studio"
    | "policies";
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  stats?: ErpStatDef[];
  columns?: string[];
  seed?: string[][];
  kpis?: ErpKpiDef[];
  panels?: ErpPanelDef[];
  cards?: ErpCardDef[];
  methods?: ErpMethodDef[];
  tabs?: string[];
  policies?: ErpPolicyDef[];
  childrenPrefix?: string;
};

export const ERP_PAGE_CATALOG = catalogJson as Record<string, ErpPageConfig>;

export function getErpPageConfig(id: string): ErpPageConfig | null {
  return ERP_PAGE_CATALOG[id] ?? null;
}

export function computeEntityStats(seed: string[][] = [], stats: ErpStatDef[] = []) {
  const total = seed.length;
  const joined = seed.map((row) => row.join(" ")).join(" ");
  const active = seed.filter((row) => /قيد|جارية|نشطة|مفتوحة|معلق|مجدول|تحت/.test(row.join(" "))).length;
  const done = seed.filter((row) => /مكتمل|منجزة|مغلقة|مدفوع|سارية|مرسل|نجاح/.test(row.join(" "))).length;
  const urgent = seed.filter((row) => /عاجل|حرج|متأخر|فشل|خطأ|متجاوز/.test(row.join(" "))).length;
  const map: Record<string, number> = { total, active, done, urgent };
  // ensure every declared key exists
  for (const s of stats) {
    if (map[s.key] == null) map[s.key] = total;
  }
  void joined;
  return map;
}
