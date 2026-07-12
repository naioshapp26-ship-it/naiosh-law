/** يحلّ روابط عناصر الهيكل الإمبراطوري إلى صفحات حقيقية */

import { imperialAxes, type ImperialAxis, type NavItem } from "@/data/empire-structure";
import { moduleMap } from "@/data/modules";

export type ResolvedItem = NavItem & {
  axisSlug: string;
  axisTitle: string;
  domainPage?: string;
};

const DOMAIN_PAGES: Record<string, string> = {
  "official-entities": "/app/official-entities",
  library: "/app/legal-library",
  "archiving-lib": "/app/legal-library",
  "quality-lib": "/app/legal-library",
  "iso-lib": "/app/legal-library",
  "policies-lib": "/app/legal-library",
  "gov-legal": "/app/governance",
  "perf-system": "/app/governance",
  "gov-policies": "/app/governance",
  "e-sign": "/app/governance",
  "compliance-gov": "/app/governance",
  "quality-gov": "/app/governance",
  "foreign-labor": "/app/professional-network",
  "labor-orgs-net": "/app/professional-network",
  "intl-partners-net": "/app/professional-network",
  "intl-events-net": "/app/professional-network",
  "local-events-net": "/app/professional-network",
  "bank-loans": "/app/legal-finance",
  "banking-tx": "/app/legal-finance",
  investment: "/app/legal-finance",
  "customs-finance": "/app/legal-finance",
  taxes: "/app/legal-finance",
  "financial-disputes-fin": "/app/legal-finance",
  "mortgage-fin": "/app/legal-finance",
  "judicial-link": "/app/communications",
  "admin-link": "/app/communications",
  "digital-transform-int": "/app/communications",
  "supply-partners": "/app/global-operations",
  shipments: "/app/global-operations",
  "intl-law-ops": "/app/global-operations",
  "naioch-branches": "/app/global-operations",
  "circular-alerts": "/app/global-operations",
};

const LEGAL_KNOWLEDGE_PREFIXES = [
  "intl-",
  "local-",
  "commercial-",
  "maritime-",
  "franchise",
  "logistics",
  "banking",
  "loan",
  "investment",
  "customs",
  "labor-",
  "worker-",
  "occupational",
  "work-",
  "sector-",
  "violation",
  "legal-governance",
  "quality-",
  "operational-",
  "iso",
  "performance",
  "social-",
  "archiving",
  "ops-automation",
  "digital-transform",
  "data-mgmt",
  "court-link",
  "legal-poa",
  "commercial-poa",
  "intl-partnership",
  "transport-",
  "insurance-",
  "supply-",
  "cyber-",
  "contraband",
  "drugs-",
  "constitution",
  "tribal-",
  "reconciliation",
  "financial-disputes",
  "mortgage",
  "residential-",
  "banking",
  "tax",
  "penal",
  "mediation",
  "incident",
  "conference",
  "event",
  "fraud",
  "protocol",
  "dispute",
  "org",
];

function matchesLegalKnowledge(id: string) {
  return LEGAL_KNOWLEDGE_PREFIXES.some((p) => id.startsWith(p) || id.includes(p));
}

export function resolveItemHref(item: Pick<NavItem, "id" | "href" | "moduleSlug">): string {
  if (item.href) return item.href;
  if (item.moduleSlug) {
    if (moduleMap[item.moduleSlug]) return `/app/modules/${item.moduleSlug}`;
    return `/app/modules/${item.moduleSlug}`;
  }
  if (DOMAIN_PAGES[item.id]) return DOMAIN_PAGES[item.id];
  if (matchesLegalKnowledge(item.id)) return "/app/legal-knowledge";
  return `/app/axis/item/${item.id}`;
}

export function findItemById(id: string): ResolvedItem | null {
  for (const axis of imperialAxes) {
    const flat = [
      ...(axis.items ?? []),
      ...(axis.dropdowns?.flatMap((d) => d.items) ?? []),
    ];
    const found = flat.find((i) => i.id === id);
    if (found) {
      return {
        ...found,
        href: resolveItemHref(found),
        axisSlug: axis.slug,
        axisTitle: axis.title,
        domainPage: DOMAIN_PAGES[found.id] ?? (matchesLegalKnowledge(found.id) ? "/app/legal-knowledge" : axis.href),
      };
    }
  }
  return null;
}

export function getAxisForPath(pathname: string): ImperialAxis | undefined {
  return imperialAxes.find(
    (a) => pathname === a.href || pathname.startsWith(a.href + "/")
  );
}

/** روابط القائمة الجانبية الرئيسية — كلها صفحات موجودة */
export const PRIMARY_NAV = [
  { href: "/app/dashboard", label: "لوحة التحكم الإمبراطورية", icon: "👑" },
  { href: "/app/modules/case-management", label: "القضايا", icon: "⚖️" },
  { href: "/app/modules/clients-management", label: "العملاء", icon: "👥" },
  { href: "/app/modules/court-sessions", label: "التقويم والجلسات", icon: "📅" },
  { href: "/app/legal-finance", label: "المالية", icon: "💰" },
  { href: "/app/legal-library", label: "المكتبة القانونية", icon: "📖" },
  { href: "/app/modules/reports-center", label: "التقارير", icon: "📊" },
  { href: "/app/modules/administration", label: "الإعدادات", icon: "⚙️" },
] as const;

export const AXIS_QUICK_NAV = imperialAxes
  .filter((a) => a.id <= 9)
  .map((a) => ({
    slug: a.slug,
    title: a.title,
    icon: a.icon,
    href: a.href,
    color: a.color,
  }));
