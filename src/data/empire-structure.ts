/** هيكل لوحة التحكم الإمبراطورية — منظومة نايوش 360 (من ملف المواصفات) */

export type DashboardType = {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  kpis: string[];
};

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  moduleSlug?: string;
  description?: string;
};

export type NavDropdown = {
  id: string;
  title: string;
  items: NavItem[];
};

export type ImperialAxis = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  href: string;
  /** عناصر مسطحة (بدون قوائم منسدلة) */
  items?: NavItem[];
  /** قوائم منسدلة (للتصنيف القانوني) */
  dropdowns?: NavDropdown[];
};

export const empireIntro = {
  title: "لوحة التحكم الإمبراطورية لمنظومة نايوش 360",
  subtitle: "القانونية والاستشارات والمحاماة",
  description:
    "لوحة التحكم التشغيلية مع المحاور القانونية الثمانية في منظومة واحدة، تم تشكيلها في هيكل سيادي موحّد.",
};

export const dashboardTypes: DashboardType[] = [
  {
    id: "system360",
    label: "لوحة تحكم النظام 360",
    description: "رؤية شاملة 360° لكل المحاور والوحدات",
    icon: "🌐",
    color: "#c3152a",
    kpis: ["المحاور الثمانية", "الوحدات التشغيلية", "التكاملات", "التنبيهات"],
  },
  {
    id: "empire",
    label: "لوحة تحكم إمبراطورية نايوش",
    description: "القيادة المركزية لمنظومة نايوش القانونية",
    icon: "👑",
    color: "#7f0d1a",
    kpis: ["الفروع العالمية", "الشراكات", "العمليات", "الحوكمة"],
  },
  {
    id: "superadmin",
    label: "لوحة تحكم السوبر أدمن",
    description: "صلاحيات عليا — إعدادات النظام والسياسات",
    icon: "🛡️",
    color: "#0ea5e9",
    kpis: ["المستخدمون", "الصلاحيات", "التدقيق", "السياسات"],
  },
  {
    id: "admin",
    label: "لوحة تحكم مدير النظام",
    description: "إدارة تشغيلية يومية للمكتب القانوني",
    icon: "⚙️",
    color: "#22c55e",
    kpis: ["القضايا", "الجلسات", "الموكلين", "المالية"],
  },
  {
    id: "user",
    label: "لوحة تحكم المستخدم",
    description: "واجهة مبسطة للمحامي والموكل",
    icon: "👤",
    color: "#8b5cf6",
    kpis: ["مهامي", "جلساتي", "مستنداتي", "إشعاراتي"],
  },
];

function item(id: string, label: string, moduleSlug?: string, href?: string): NavItem {
  return { id, label, moduleSlug, href };
}

export const imperialAxes: ImperialAxis[] = [
  {
    id: 1,
    slug: "sovereign",
    title: "لوحة التحكم السيادية",
    subtitle: "الموضوع الرئيسي الأول",
    icon: "👑",
    color: "#c3152a",
    href: "/app/axis/sovereign",
    items: [
      item("dashboard", "لوحة التحكم", undefined, "/app/dashboard"),
      item("follow-up", "مركز المتابعات", "follow-up-center"),
      item("notifications", "الإشعارات والتنبيهات", "notifications-center"),
      item("integrations-notif", "الإشعارات والتكاملات", "integrations"),
      item("reports", "مركز التقارير", "reports-center"),
      item("tools", "الأدوات العامة", "general-tools"),
      item("ai", "الذكاء الاصطناعي القانوني", "ai-center"),
      item("admin", "الإدارة والصلاحيات", "administration"),
      item("operations", "الوحدات التشغيلية", undefined, "/app/dashboard#modules"),
      item("global-ops", "العمليات العالمية", undefined, "/app/axis/global-operations"),
    ],
  },
  {
    id: 2,
    slug: "legal-classification",
    title: "التصنيف القانوني",
    subtitle: "يرتبط بالمحاور الثمانية",
    icon: "📚",
    color: "#0ea5e9",
    href: "/app/axis/legal-classification",
    dropdowns: [
      {
        id: "intl",
        title: "القانون الدولي والأنظمة العابرة للحدود",
        items: [
          item("intl-law", "القانون الدولي"),
          item("intl-orgs", "المنظمات الدولية"),
          item("intl-partners", "الشراكات الدولية"),
          item("intl-protocols", "البروتوكولات الدولية"),
          item("intl-disputes", "النزاعات الدولية"),
          item("intl-mediation", "فضّ النزاعات الدولية"),
          item("intl-incidents", "الحوادث الدولية"),
          item("intl-penal", "قانون العقوبات الدولية"),
          item("intl-cyber", "قانون الجرائم الإلكترونية الدولي"),
          item("intl-contraband", "قانون الاتجار بالممنوعات"),
          item("intl-transport", "قانون النقل الدولي"),
          item("intl-customs", "القوانين الجمركية الدولية"),
          item("intl-insurance", "التأمين الدولي"),
          item("intl-marine-ins", "التأمين البحري"),
          item("intl-supply", "سلاسل الإمداد الدولية"),
          item("intl-fraud", "الاحتيالات الدولية"),
          item("intl-conferences", "المؤتمرات الدولية"),
          item("intl-events", "الفعاليات الدولية"),
        ],
      },
      {
        id: "national",
        title: "القوانين الوطنية والتشريعات المحلية",
        items: [
          item("local-disputes", "النزاعات المحلية"),
          item("local-penal", "قانون العقوبات حسب الدولة"),
          item("local-cyber", "قانون الجرائم الإلكترونية حسب الدولة"),
          item("local-drugs", "قانون تعاطي المخدرات"),
          item("local-transport", "قانون النقل المحلي"),
          item("local-traffic", "قانون السير للدولة"),
          item("local-customs", "القوانين الجمركية المحلية"),
          item("local-tax", "قانون الضرائب"),
          item("constitution", "دستور الدولة"),
          item("local-events", "الفعاليات المحلية"),
          item("tribal-laws", "القوانين العشائرية المساندة"),
          item("reconciliation", "العطوات وفضّ النزاعات"),
          item("financial-disputes", "النزاعات المالية"),
          item("mortgage", "الرهن وفك الرهن"),
        ],
      },
      {
        id: "commercial",
        title: "القانون التجاري والبحري والامتيازات",
        items: [
          item("commercial-law", "القانون التجاري"),
          item("maritime-law", "القانون البحري"),
          item("franchise", "عقود الفرنشايز"),
          item("commercial-lease", "عقود الإيجار التجارية"),
          item("residential-lease", "عقود الإيجار السكنية"),
          item("logistics", "اللوجستيات وعقود المشتريات"),
          item("banking", "التعاملات البنكية"),
          item("loans", "القروض البنكية"),
          item("investment-laws", "قوانين الاستثمار"),
          item("customs-clearance", "قوانين التخليص الجمركي"),
        ],
      },
      {
        id: "labor",
        title: "العمل والعمال والسلامة المهنية",
        items: [
          item("labor-law", "قانون العمل والعمال"),
          item("labor-orgs", "منظمات العمل الدولية"),
          item("worker-rights", "حقوق العاملين"),
          item("occupational-safety", "السلامة المهنية"),
          item("work-compensation", "تعويضات مخاطر العمل"),
          item("sector-safety", "قوانين السلامة في القطاعات والمصانع"),
          item("violations", "المخالفات الدستورية والقانونية والسير"),
        ],
      },
      {
        id: "institutional",
        title: "الأنظمة القانونية المؤسسية",
        items: [
          item("legal-governance", "حوكمة الإدارات القانونية"),
          item("quality-systems", "أنظمة الجودة القانونية"),
          item("operational-policies", "السياسات التشغيلية"),
          item("iso", "أنظمة الأيزو"),
          item("performance", "نظام قياس الأداء"),
          item("social-systems", "النظم الاجتماعية"),
          item("archiving", "الأرشفة"),
        ],
      },
      {
        id: "automation",
        title: "الأتمتة والتحول الرقمي القانوني",
        items: [
          item("ops-automation", "أتمتة العمليات التشغيلية"),
          item("digital-transform", "التحول الرقمي للمنظومات القانونية"),
          item("data-mgmt", "إدارة البيانات القانونية"),
          item("court-link", "الربط بين الأنظمة القضائية والإدارية"),
        ],
      },
      {
        id: "contracts",
        title: "التوكيلات والعقود الدولية والمحلية",
        items: [
          item("legal-poa", "التوكيلات القانونية"),
          item("commercial-poa", "التوكيلات التجارية"),
          item("intl-partnership", "عقود الشراكات الدولية"),
          item("franchise-contracts", "عقود الامتياز"),
          item("transport-contracts", "عقود النقل"),
          item("insurance-contracts", "عقود التأمين"),
          item("supply-contracts", "عقود الإمداد واللوجستيات"),
        ],
      },
      {
        id: "compliance",
        title: "الجرائم والامتثال والرقابة",
        items: [
          item("cyber-crimes", "قانون الجرائم الإلكترونية"),
          item("contraband-law", "قانون الاتجار بالممنوعات"),
          item("drugs-law", "قانون تعاطي المخدرات"),
          item("intl-fraud-2", "الاحتيالات الدولية"),
          item("violations-2", "المخالفات"),
          item("quality-control", "أنظمة ضبط الجودة"),
          item("legal-compliance", "أنظمة الامتثال القانوني"),
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "professional-network",
    title: "الشبكة المهنية",
    subtitle: "الموضوع الرئيسي الثالث",
    icon: "🤝",
    color: "#22c55e",
    href: "/app/axis/professional-network",
    items: [
      item("official-entities", "الجهات الرسمية"),
      item("foreign-labor", "تصريح العمالة الوافدة"),
      item("labor-orgs-net", "منظمات العمل الدولية"),
      item("intl-partners-net", "الشراكات الدولية"),
      item("intl-events-net", "الفعاليات الدولية"),
      item("local-events-net", "الفعاليات المحلية"),
    ],
  },
  {
    id: 4,
    slug: "advanced-finance",
    title: "المالية المتقدمة",
    subtitle: "الموضوع الرئيسي الرابع",
    icon: "💰",
    color: "#f59e0b",
    href: "/app/axis/advanced-finance",
    items: [
      item("legal-accounting", "المحاسبة القانونية", "legal-accounting"),
      item("bank-loans", "القروض البنكية"),
      item("banking-tx", "التعاملات البنكية"),
      item("investment", "الاستثمار"),
      item("customs-finance", "التخليص الجمركي"),
      item("taxes", "الضرائب"),
      item("financial-disputes-fin", "النزاعات المالية"),
      item("mortgage-fin", "الرهن وفك الرهن"),
    ],
  },
  {
    id: 5,
    slug: "legal-library",
    title: "المكتبة القانونية",
    subtitle: "الموضوع الرئيسي الخامس",
    icon: "📖",
    color: "#8b5cf6",
    href: "/app/axis/legal-library",
    items: [
      item("library", "المكتبة القانونية"),
      item("smart-templates", "النماذج الذكية", "smart-templates"),
      item("archiving-lib", "الأرشفة"),
      item("quality-lib", "أنظمة الجودة القانونية"),
      item("iso-lib", "أنظمة الأيزو"),
      item("policies-lib", "السياسات التشغيلية"),
    ],
  },
  {
    id: 6,
    slug: "governance",
    title: "الحوكمة والتوقيع",
    subtitle: "الموضوع الرئيسي السادس",
    icon: "⚙️",
    color: "#ef4444",
    href: "/app/axis/governance",
    items: [
      item("gov-legal", "حوكمة الإدارات القانونية"),
      item("perf-system", "نظام قياس الأداء"),
      item("gov-policies", "السياسات التشغيلية"),
      item("e-sign", "التوقيع الرقمي"),
      item("compliance-gov", "الامتثال القانوني"),
      item("quality-gov", "ضبط الجودة"),
    ],
  },
  {
    id: 7,
    slug: "legal-services",
    title: "الخدمات القانونية",
    subtitle: "الموضوع الرئيسي السابع",
    icon: "⚖️",
    color: "#06b6d4",
    href: "/app/axis/legal-services",
    items: [
      item("cases", "إدارة القضايا", "case-management"),
      item("clients", "إدارة الموكلين", "clients-management"),
      item("sessions", "إدارة الجلسات", "court-sessions"),
      item("services", "الخدمات القانونية", "legal-services"),
      item("consultations", "الاستشارات القانونية", "legal-consultations"),
      item("internal-req", "الطلبات الداخلية", "internal-requests"),
      item("complaints", "إدارة الشكاوى", "complaints-management"),
    ],
  },
  {
    id: 8,
    slug: "integrations",
    title: "التكاملات",
    subtitle: "الموضوع الرئيسي الثامن",
    icon: "🔗",
    color: "#64748b",
    href: "/app/axis/integrations",
    items: [
      item("ext-integrations", "التكاملات الخارجية", "integrations"),
      item("notif-integrations", "الإشعارات والتكاملات", "notifications-center"),
      item("judicial-link", "الربط القضائي"),
      item("admin-link", "الربط الإداري"),
      item("digital-transform-int", "التحول الرقمي"),
    ],
  },
  {
    id: 9,
    slug: "global-operations",
    title: "العمليات العالمية",
    subtitle: "من لوحة التحكم السيادية",
    icon: "🌍",
    color: "#0891b2",
    href: "/app/axis/global-operations",
    items: [
      item("supply-partners", "شركاء التوريد"),
      item("shipments", "الشحنات الدولية"),
      item("intl-law-ops", "القانون الدولي"),
      item("naioch-branches", "فروع نايوش العالمية"),
      item("circular-alerts", "تنبيهات التعليمات الدائرية"),
    ],
  },
];

export const axisBySlug = Object.fromEntries(imperialAxes.map((a) => [a.slug, a]));

export function countAxisItems(axis: ImperialAxis): number {
  if (axis.items) return axis.items.length;
  if (axis.dropdowns) return axis.dropdowns.reduce((n, d) => n + d.items.length, 0);
  return 0;
}

export function totalEmpireItems(): number {
  return imperialAxes.reduce((n, a) => n + countAxisItems(a), 0);
}
