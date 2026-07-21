export type LawPlatformCard = {
  id: string;
  href: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
};

export const LAW_PLATFORMS_TITLE = "منصتي";

export const LAW_PLATFORMS_INTRO =
  "كل قسم من أقسام المنصة له صفحة مستقلة داخل لوحة التحكم — اختر القسم للدخول مباشرة.";

export const LAW_PLATFORMS_STATS = [
  { value: "8", label: "أقسام" },
  { value: "200+", label: "منصة" },
  { value: "ERP", label: "موحد" },
] as const;

/** Same 8 platform sections as ERP /newhome/platforms.html — linked into Law app routes. */
export const LAW_PLATFORM_CARDS: LawPlatformCard[] = [
  {
    id: "pl-daily-operations",
    href: "/app/dashboard",
    icon: "fa-calendar-day",
    title: "العمليات اليومية",
    desc: "متابعة وتنفيذ العمليات اليومية للمنصة.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-sales",
    href: "/app/legal-finance",
    icon: "fa-chart-line",
    title: "المبيعات",
    desc: "إدارة مبيعات المنصة والعروض والصفقات.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-subscriptions",
    href: "/rent-system",
    icon: "fa-credit-card",
    title: "الاشتراكات",
    desc: "إدارة خطط الاشتراك وتجديد العملاء.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-training",
    href: "/services",
    icon: "fa-graduation-cap",
    title: "التدريب",
    desc: "الدورات والبرامج التدريبية عبر المنصة.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-customer-service",
    href: "/app/communications",
    icon: "fa-headset",
    title: "خدمة العملاء",
    desc: "تذاكر واستفسارات مستخدمي المنصة.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-operational-reports",
    href: "/app/dashboard",
    icon: "fa-file-lines",
    title: "التقارير التشغيلية",
    desc: "مؤشرات أداء المنصة والتقارير الدورية.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-local-hr",
    href: "/app/modules/administration",
    icon: "fa-users",
    title: "الموارد البشرية المحلية",
    desc: "شؤون موظفي المنصة والحضور والطلبات.",
    cta: "فتح الصفحة",
  },
  {
    id: "pl-operational-finance",
    href: "/app/legal-finance",
    icon: "fa-coins",
    title: "المالية التشغيلية",
    desc: "المصروفات والتحصيل والميزانية التشغيلية.",
    cta: "فتح الصفحة",
  },
];
