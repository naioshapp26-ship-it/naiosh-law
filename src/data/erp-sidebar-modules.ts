/** وحدات القائمة الجانبية من ERP HQ — منسوخة بنفس الهيكل والخصائص */

export type ErpNavLeaf = {
  id: string;
  icon: string;
  label: string;
};

export type ErpNavModule = ErpNavLeaf & {
  subItems?: ErpNavLeaf[];
};

export const ERP_SIDEBAR_MODULES: ErpNavModule[] = [
  {
    "id": "events-studio-main",
    "icon": "fa-video",
    "label": "استوديو الفعاليات"
  },
  {
    "id": "marketing-campaigns-studio",
    "icon": "fa-bullhorn",
    "label": "استوديو الحملات التسويقية"
  },
  {
    "id": "payment-menu",
    "icon": "fa-credit-card",
    "label": "نظام الدفع",
    "subItems": [
      {
        "id": "invoices-enhanced",
        "icon": "fa-file-invoice-dollar",
        "label": "الفواتير الذكية"
      },
      {
        "id": "payment-methods",
        "icon": "fa-wallet",
        "label": "طرق الدفع"
      },
      {
        "id": "installment-plans",
        "icon": "fa-calendar-days",
        "label": "خطط الأقساط"
      },
      {
        "id": "payment-tracking",
        "icon": "fa-chart-line",
        "label": "تتبع الدفعات"
      },
      {
        "id": "tax-settings",
        "icon": "fa-percent",
        "label": "إعدادات الضرائب"
      },
      {
        "id": "collection-rules",
        "icon": "fa-cog",
        "label": "قواعد التحصيل"
      },
      {
        "id": "payment-reminders",
        "icon": "fa-bell",
        "label": "التذكيرات الآلية"
      },
      {
        "id": "overdue-management",
        "icon": "fa-exclamation-circle",
        "label": "إدارة المتأخرات"
      },
      {
        "id": "payment-analytics",
        "icon": "fa-chart-bar",
        "label": "تحليلات الدفع"
      },
      {
        "id": "gateway-payments",
        "icon": "fa-plug",
        "label": "بوابات الدفع (Stripe/PayPal/Paymob)"
      },
      {
        "id": "credit-topup",
        "icon": "fa-coins",
        "label": "شحن الرصيد"
      },
      {
        "id": "online-store",
        "icon": "fa-store",
        "label": "المتجر والسلة"
      }
    ]
  },
  {
    "id": "internet-automation",
    "icon": "fa-robot",
    "label": "الإنترنت والأتمتة",
    "subItems": [
      {
        "id": "ai-integration",
        "icon": "fa-brain",
        "label": "الذكاء الإصطناعي"
      },
      {
        "id": "governance",
        "icon": "fa-gavel",
        "label": "الحوكمة"
      },
      {
        "id": "compliance",
        "icon": "fa-balance-scale",
        "label": "الموائمة"
      },
      {
        "id": "iot",
        "icon": "fa-network-wired",
        "label": "انترنت الأشياء"
      },
      {
        "id": "dispute-settlements",
        "icon": "fa-handshake",
        "label": "فض النزاعات والتسويات"
      },
      {
        "id": "records-archiving",
        "icon": "fa-archive",
        "label": "السجلات والأرشيف"
      },
      {
        "id": "elearning",
        "icon": "fa-graduation-cap",
        "label": "التعلم الإلكتروني"
      },
      {
        "id": "forum",
        "icon": "fa-comments",
        "label": "المنتدى"
      },
      {
        "id": "etiquette",
        "icon": "fa-user-tie",
        "label": "الإتيكيت وبروتوكولات التواصل"
      },
      {
        "id": "knowledge",
        "icon": "fa-lightbulb",
        "label": "المعرفة والتحليل"
      },
      {
        "id": "intellectual-property",
        "icon": "fa-copyright",
        "label": "ملكية نايوش"
      },
      {
        "id": "visitor-chat",
        "icon": "fa-comment-dots",
        "label": "الدردشة مع الزوار"
      }
    ]
  },
  {
    "id": "services",
    "icon": "fa-concierge-bell",
    "label": "الخدمات",
    "subItems": [
      {
        "id": "project-management-office",
        "icon": "fa-project-diagram",
        "label": "مكتب إدارة المشاريع"
      },
      {
        "id": "institutional-performance",
        "icon": "fa-chart-line",
        "label": "إدارة الأداء المؤسسي"
      },
      {
        "id": "operations-monitoring",
        "icon": "fa-eye",
        "label": "متابعة العمليات"
      },
      {
        "id": "ai-market-research",
        "icon": "fa-brain",
        "label": "دراسة السوق عبر الذكاء الاصطناعي"
      },
      {
        "id": "customer-service",
        "icon": "fa-headset",
        "label": "خدمة العملاء"
      },
      {
        "id": "client-admin-services",
        "icon": "fa-user-cog",
        "label": "الخدمات الإدارية للعميل"
      },
      {
        "id": "virtual-halls",
        "icon": "fa-video",
        "label": "القاعات الافتراضية"
      },
      {
        "id": "feasibility-studies",
        "icon": "fa-calculator",
        "label": "دراسات الجدوى"
      },
      {
        "id": "research",
        "icon": "fa-search",
        "label": "البحوث"
      },
      {
        "id": "consulting-training",
        "icon": "fa-chalkboard-teacher",
        "label": "الاستشارات والتدريب"
      }
    ]
  },
  {
    "id": "ads",
    "icon": "fa-bullhorn",
    "label": "مركز المعلنين"
  },
  {
    "id": "tasks-management",
    "icon": "fa-tasks",
    "label": "المهام",
    "subItems": [
      {
        "id": "main-menu",
        "icon": "fa-home",
        "label": "القائمة الرئيسية"
      },
      {
        "id": "control-panel",
        "icon": "fa-sliders-h",
        "label": "لوحة التحكم"
      },
      {
        "id": "my-tasks",
        "icon": "fa-check-square",
        "label": "مهامي"
      },
      {
        "id": "procedures",
        "icon": "fa-file-alt",
        "label": "الإجراءات"
      },
      {
        "id": "all-procedures",
        "icon": "fa-list-check",
        "label": "جميع الإجراءات"
      },
      {
        "id": "general-tasks",
        "icon": "fa-clipboard-list",
        "label": "المهام العامة"
      },
      {
        "id": "customers",
        "icon": "fa-users",
        "label": "العملاء"
      },
      {
        "id": "delegations",
        "icon": "fa-user-friends",
        "label": "التفويضات"
      },
      {
        "id": "task-reports",
        "icon": "fa-chart-bar",
        "label": "التقارير"
      },
      {
        "id": "task-settings",
        "icon": "fa-cog",
        "label": "الإعدادات"
      }
    ]
  },
  {
    "id": "audit-logs",
    "icon": "fa-history",
    "label": "سجل النظام"
  },
  {
    "id": "e-offices",
    "icon": "fa-building",
    "label": "المكاتب الإلكترونية",
    "subItems": [
      {
        "id": "eo-daily-operations",
        "icon": "fa-calendar-day",
        "label": "العمليات اليومية"
      },
      {
        "id": "eo-sales",
        "icon": "fa-chart-line",
        "label": "المبيعات"
      },
      {
        "id": "eo-subscriptions",
        "icon": "fa-cubes",
        "label": "الاشتراكات"
      },
      {
        "id": "eo-training",
        "icon": "fa-chalkboard-teacher",
        "label": "التدريب"
      },
      {
        "id": "eo-customer-service",
        "icon": "fa-headset",
        "label": "خدمة العملاء"
      },
      {
        "id": "eo-operational-reports",
        "icon": "fa-chart-pie",
        "label": "التقارير التشغيلية"
      },
      {
        "id": "eo-local-hr",
        "icon": "fa-users",
        "label": "الموارد البشرية المحلية"
      },
      {
        "id": "eo-operational-finance",
        "icon": "fa-coins",
        "label": "الماليه التشغيلية"
      },
      {
        "id": "eo-files",
        "icon": "fa-folder-open",
        "label": "الملفات"
      },
      {
        "id": "eo-archive",
        "icon": "fa-box-archive",
        "label": "الارشيف"
      },
      {
        "id": "eo-tasks",
        "icon": "fa-list-check",
        "label": "المهام"
      },
      {
        "id": "eo-meetings",
        "icon": "fa-video",
        "label": "الاجتماعات"
      },
      {
        "id": "eo-consultations",
        "icon": "fa-user-tie",
        "label": "الاستشارات"
      },
      {
        "id": "eo-latest-news",
        "icon": "fa-newspaper",
        "label": "اخر الاخبار"
      },
      {
        "id": "eo-users",
        "icon": "fa-user-gear",
        "label": "المستخدمين"
      }
    ]
  },
  {
    "id": "platforms",
    "icon": "fa-layer-group",
    "label": "المنصات",
    "subItems": [
      {
        "id": "pl-daily-operations",
        "icon": "fa-calendar-day",
        "label": "العمليات اليومية"
      },
      {
        "id": "pl-sales",
        "icon": "fa-chart-line",
        "label": "المبيعات"
      },
      {
        "id": "pl-subscriptions",
        "icon": "fa-cubes",
        "label": "الاشتراكات"
      },
      {
        "id": "pl-training",
        "icon": "fa-chalkboard-teacher",
        "label": "التدريب"
      },
      {
        "id": "pl-customer-service",
        "icon": "fa-headset",
        "label": "خدمة العملاء"
      },
      {
        "id": "pl-operational-reports",
        "icon": "fa-chart-pie",
        "label": "التقارير التشغيلية"
      },
      {
        "id": "pl-local-hr",
        "icon": "fa-users",
        "label": "الموارد البشرية المحلية"
      },
      {
        "id": "pl-operational-finance",
        "icon": "fa-coins",
        "label": "الماليه التشغيلية"
      }
    ]
  },
  {
    "id": "branches-hub",
    "icon": "fa-code-branch",
    "label": "الفروع",
    "subItems": [
      {
        "id": "br-daily-operations",
        "icon": "fa-calendar-day",
        "label": "العمليات اليومية"
      },
      {
        "id": "br-sales",
        "icon": "fa-chart-line",
        "label": "المبيعات"
      },
      {
        "id": "br-subscriptions",
        "icon": "fa-cubes",
        "label": "الاشتراكات"
      },
      {
        "id": "br-training",
        "icon": "fa-chalkboard-teacher",
        "label": "التدريب"
      },
      {
        "id": "br-customer-service",
        "icon": "fa-headset",
        "label": "خدمة العملاء"
      },
      {
        "id": "br-operational-reports",
        "icon": "fa-chart-pie",
        "label": "التقارير التشغيلية"
      },
      {
        "id": "br-local-hr",
        "icon": "fa-users",
        "label": "الموارد البشرية المحلية"
      },
      {
        "id": "br-operational-finance",
        "icon": "fa-coins",
        "label": "المالية التشغيلية"
      }
    ]
  },
  {
    "id": "incubators-hub",
    "icon": "fa-seedling",
    "label": "الحاضنات",
    "subItems": [
      {
        "id": "ic-daily-operations",
        "icon": "fa-calendar-day",
        "label": "العمليات اليومية"
      },
      {
        "id": "ic-sales",
        "icon": "fa-chart-line",
        "label": "المبيعات"
      },
      {
        "id": "ic-subscriptions",
        "icon": "fa-cubes",
        "label": "الاشتراكات"
      },
      {
        "id": "ic-training",
        "icon": "fa-chalkboard-teacher",
        "label": "التدريب"
      },
      {
        "id": "ic-customer-service",
        "icon": "fa-headset",
        "label": "خدمة العملاء"
      },
      {
        "id": "ic-operational-reports",
        "icon": "fa-chart-pie",
        "label": "التقارير التشغيلية"
      },
      {
        "id": "ic-local-hr",
        "icon": "fa-users",
        "label": "الموارد البشرية المحلية"
      },
      {
        "id": "ic-operational-finance",
        "icon": "fa-coins",
        "label": "المالية التشغيلية"
      }
    ]
  },
  {
    "id": "education-training-incubators",
    "icon": "fa-graduation-cap",
    "label": "حاضنات التعليم والتدريب",
    "subItems": [
      {
        "id": "eti-ohs",
        "icon": "fa-hard-hat",
        "label": "حاضنة السلامة والصحة المهنية"
      },
      {
        "id": "eti-supply-chain",
        "icon": "fa-truck-loading",
        "label": "حاضنة سلاسل الإمداد"
      },
      {
        "id": "eti-facilities",
        "icon": "fa-building",
        "label": "حضانة إدارة المرافق"
      },
      {
        "id": "eti-logistics",
        "icon": "fa-shipping-fast",
        "label": "حاضنة اللوجستيات والنقل والتوصيل"
      },
      {
        "id": "eti-project-management",
        "icon": "fa-project-diagram",
        "label": "حاضنة إدارة المشاريع"
      },
      {
        "id": "eti-hr",
        "icon": "fa-users-gear",
        "label": "حاضنة HR الموارد البشرية"
      }
    ]
  },
  {
    "id": "naiosh-sectors",
    "icon": "fa-building-columns",
    "label": "قطاعات نايوش",
    "subItems": [
      {
        "id": "sc-member-management",
        "icon": "fa-users-gear",
        "label": "إدارة الأعضاء"
      },
      {
        "id": "sc-governance",
        "icon": "fa-scale-balanced",
        "label": "الحوكمة"
      },
      {
        "id": "sc-automation",
        "icon": "fa-robot",
        "label": "الأتمتة"
      },
      {
        "id": "sc-sustainability",
        "icon": "fa-leaf",
        "label": "الاستدامة"
      },
      {
        "id": "sc-legal",
        "icon": "fa-gavel",
        "label": "القانونية والمحاماة"
      },
      {
        "id": "sc-skills-innovation",
        "icon": "fa-lightbulb",
        "label": "المهارات والابتكارات"
      },
      {
        "id": "sc-initiatives",
        "icon": "fa-flag",
        "label": "المبادرات"
      },
      {
        "id": "sc-beta-club",
        "icon": "fa-flask",
        "label": "نادي بيتا الرقمي"
      }
    ]
  },
  {
    "id": "operational-policies",
    "icon": "fa-scale-balanced",
    "label": "السياسات التشغيلية المعتمدة"
  },
  {
    "id": "strategic-management",
    "icon": "fa-chess",
    "label": "الإدارة الاستراتيجية",
    "subItems": [
      {
        "id": "executive-management",
        "icon": "fa-user-tie",
        "label": "الإدارة التنفيذية"
      },
      {
        "id": "employee-management",
        "icon": "fa-users-cog",
        "label": "إدارة الموظفين"
      },
      {
        "id": "smart-systems",
        "icon": "fa-microchip",
        "label": "الأنظمة الذكية"
      },
      {
        "id": "subscription-management",
        "icon": "fa-tags",
        "label": "إدارة الاشتراكات"
      },
      {
        "id": "operations-management",
        "icon": "fa-cogs",
        "label": "إدارة العمليات"
      },
      {
        "id": "financial-approvals",
        "icon": "fa-file-signature",
        "label": "الموافقات المالية"
      },
      {
        "id": "tenants",
        "icon": "fa-building",
        "label": "المستأجرين"
      },
      {
        "id": "advertisers-center",
        "icon": "fa-ad",
        "label": "مركز المعلنين"
      },
      {
        "id": "training-development",
        "icon": "fa-chalkboard-teacher",
        "label": "التدريب والتطوير"
      },
      {
        "id": "quality-audit",
        "icon": "fa-clipboard-check",
        "label": "الجودة والتدقيق"
      },
      {
        "id": "evaluation",
        "icon": "fa-star",
        "label": "التقييم"
      },
      {
        "id": "tasks-strategic",
        "icon": "fa-tasks",
        "label": "المهام"
      },
      {
        "id": "information-center",
        "icon": "fa-info-circle",
        "label": "مركز المعلومات"
      },
      {
        "id": "identity-settings",
        "icon": "fa-palette",
        "label": "إعدادات الهوية"
      },
      {
        "id": "system-log",
        "icon": "fa-file-alt",
        "label": "سجل النظام"
      },
      {
        "id": "reports",
        "icon": "fa-chart-line",
        "label": "التقارير"
      }
    ]
  },
  {
    "id": "saas",
    "icon": "fa-cubes",
    "label": "إدارة الاشتراكات"
  }
];

const flatIndex = new Map<string, { module: ErpNavModule; parent?: ErpNavModule }>();
for (const mod of ERP_SIDEBAR_MODULES) {
  flatIndex.set(mod.id, { module: mod });
  for (const sub of mod.subItems ?? []) {
    flatIndex.set(sub.id, { module: { ...sub }, parent: mod });
  }
}

export function findErpNavEntry(id: string) {
  return flatIndex.get(id) ?? null;
}

export function erpModuleHref(id: string) {
  const entry = findErpNavEntry(id);
  if (!entry) return `/app/erp/${id}`;
  if (entry.parent) return `/app/erp/${entry.parent.id}/${id}`;
  return `/app/erp/${id}`;
}

export function getErpModuleById(id: string): ErpNavModule | null {
  return ERP_SIDEBAR_MODULES.find((m) => m.id === id) ?? null;
}
