/** تخصصات شريط الهيرو الجانبي — كل زر له صفحة مخصصة */

export type LandingSpecialty = {
  slug: string;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
  /** وحدة تشغيلية كاملة داخل الصفحة */
  moduleSlug?: string;
  /** صفحة نطاق حالية غنية بالبيانات */
  domainHref?: string;
  /** واجهات API لجلب ملخص/جداول */
  apiEndpoints?: { key: string; label: string; url: string }[];
  highlights: string[];
};

export const LANDING_SPECIALTIES: LandingSpecialty[] = [
  {
    slug: "cases",
    label: "قضاياي",
    icon: "⚖️",
    title: "قضاياي",
    subtitle: "كل قضاياك وإجراءاتها وجلساتها وبياناتها في مساحة واحدة",
    moduleSlug: "case-management",
    apiEndpoints: [{ key: "cases", label: "القضايا", url: "/api/cases" }],
    highlights: ["فتح ومتابعة القضايا", "المراحل والأحكام", "المرفقات وسير العمل", "الرسوم والمدفوعات"],
  },
  {
    slug: "clients",
    label: "موكلي",
    icon: "👥",
    title: "موكلي",
    subtitle: "ملفات الموكلين والعقود والوكالات والوثائق",
    moduleSlug: "clients-management",
    apiEndpoints: [{ key: "clients", label: "الموكلون", url: "/api/clients" }],
    highlights: ["بيانات الموكلين", "الوكالات والعقود", "الوثائق المرجعية", "تقارير العميل"],
  },
  {
    slug: "sessions",
    label: "جلساتي",
    icon: "🏛️",
    title: "جلساتي",
    subtitle: "الجلسات والتقويم والتذكيرات ورول الأسبوع",
    moduleSlug: "court-sessions",
    apiEndpoints: [{ key: "sessions", label: "الجلسات", url: "/api/court-sessions" }],
    highlights: ["جلسات المحكمة", "جلسات الخبراء", "التذكيرات الآلية", "رول الأسبوع"],
  },
  {
    slug: "library",
    label: "مكتبتي",
    icon: "📚",
    title: "مكتبتي القانونية",
    subtitle: "المستندات والمقالات والتعاميم والمراجع القانونية",
    domainHref: "/app/legal-library",
    apiEndpoints: [
      { key: "documents", label: "المستندات", url: "/api/legal-documents" },
      { key: "articles", label: "المقالات", url: "/api/legal-articles" },
      { key: "circulars", label: "التعاميم", url: "/api/circular-instructions" },
    ],
    highlights: ["مستندات قانونية", "مقالات تخصصية", "تعاميم رسمية", "بحث وتصنيف"],
  },
  {
    slug: "systems",
    label: "أنظمتي",
    icon: "🗂️",
    title: "أنظمتي وتصنيفاتي",
    subtitle: "الفروع والتخصصات والمواد والأنظمة المعرفية",
    domainHref: "/app/legal-knowledge",
    apiEndpoints: [
      { key: "branches", label: "الفروع", url: "/api/legal-branches" },
      { key: "specializations", label: "التخصصات", url: "/api/legal-specializations" },
      { key: "subjects", label: "المواد", url: "/api/legal-subjects" },
    ],
    highlights: ["فروع قانونية", "تخصصات تشغيلية", "مواد وتصنيفات", "هيكل المعرفة"],
  },
  {
    slug: "finance",
    label: "ماليتي",
    icon: "💰",
    title: "ماليتي القانونية",
    subtitle: "الفواتير والأتعاب والكفالات والمدفوعات والإشعارات الرسمية",
    domainHref: "/app/legal-finance",
    moduleSlug: "legal-accounting",
    apiEndpoints: [
      { key: "invoices", label: "الفواتير", url: "/api/financial-records" },
      { key: "payments", label: "المدفوعات", url: "/api/payments" },
      { key: "fee-rules", label: "قواعد الأتعاب", url: "/api/fee-rules" },
      { key: "bail", label: "الكفالات", url: "/api/bail-guarantees" },
    ],
    highlights: ["الفواتير", "قواعد الأتعاب", "الكفالات", "المدفوعات"],
  },
  {
    slug: "archive",
    label: "أرشيفي",
    icon: "📦",
    title: "أرشيفي",
    subtitle: "الأرشفة الكاملة للمستندات والملفات والسجلات",
    domainHref: "/app/archive",
    apiEndpoints: [{ key: "archive", label: "الأرشيف", url: "/api/archive" }],
    highlights: ["أرشفة المستندات", "البحث في الأرشيف", "التصنيف والوسوم", "الاسترجاع"],
  },
  {
    slug: "profile",
    label: "صفحتي",
    icon: "🏠",
    title: "صفحتي",
    subtitle: "لوحتك الشخصية ومؤشراتك واختصارات تخصصاتك",
    domainHref: "/my-page",
    highlights: ["ملخص يومي", "مؤشرات الأداء", "اختصارات الوحدات", "تنبيهات سريعة"],
  },
  {
    slug: "team",
    label: "الفريق",
    icon: "🧑‍🤝‍🧑",
    title: "الفريق والصلاحيات",
    subtitle: "المستخدمون والأدوار وسجلات الدخول وإدارة الفريق",
    moduleSlug: "administration",
    highlights: ["المستخدمون", "الأدوار والصلاحيات", "سجلات الدخول", "إدارة الفريق"],
  },
];

export const landingSpecialtyMap = Object.fromEntries(
  LANDING_SPECIALTIES.map((s) => [s.slug, s])
) as Record<string, LandingSpecialty>;

export function specialtyHref(slug: string) {
  return `/app/specialty/${slug}`;
}
