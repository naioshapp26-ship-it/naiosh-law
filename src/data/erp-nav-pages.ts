export type CreatorPage = {
  id: string;
  userId: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  phone: string;
  pageEmail: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  youtube: string;
  snapchat: string;
  tiktok: string;
  profileImageUrl: string;
  coverImageUrl: string;
  customLinks: { label: string; url: string }[];
  specialty: string;
  city: string;
  status: "active" | "hidden";
  views: number;
  clicks: number;
  updatedAt: string;
  createdAt: string;
};

export type RentPlanId = "trial" | "office" | "enterprise";

export type RentPlan = {
  id: RentPlanId;
  name: string;
  priceLabel: string;
  blurb: string;
  features: string[];
};

/** Law SaaS plans (ERP signup structure, Law content) */
export const LAW_RENT_PLANS: RentPlan[] = [
  {
    id: "trial",
    name: "تجريبي",
    priceLabel: "مجانًا",
    blurb: "للمكاتب الناشئة وتجربة المنظومة القانونية",
    features: ["حتى 25 قضية", "3 مستخدمين", "جلسات وتذكيرات", "دعم أساسي"],
  },
  {
    id: "office",
    name: "مكتب محاماة",
    priceLabel: "١٬٤٩٩ ر.س / شهر",
    blurb: "الأنسب لمكاتب المحاماة والاستشارات",
    features: ["قضايا غير محدودة", "١٥ مستخدمًا", "مالية قانونية", "ذكاء اصطناعي قانوني", "تقارير تنفيذية"],
  },
  {
    id: "enterprise",
    name: "مؤسسي",
    priceLabel: "٤٬٩٩٩ ر.س / شهر",
    blurb: "للفروع والشبكات القانونية الكبيرة",
    features: ["فروع متعددة", "حوكمة وتوقيع", "تكاملات خارجية", "مدير نجاح مخصص", "SLA مؤسسي"],
  },
];

export const LAW_RENT_SYSTEMS = [
  {
    id: "cases",
    title: "إدارة القضايا والموكلين",
    sub: "ملفات القضايا والوكالات والمستندات",
    pages: ["القضايا", "الموكلون", "الجلسات", "الأحكام", "التنفيذ"],
  },
  {
    id: "finance",
    title: "المالية القانونية",
    sub: "فواتير وأتعاب وكفالات ومدفوعات",
    pages: ["الفواتير", "قواعد الأتعاب", "الكفالات", "المدفوعات", "التقارير"],
  },
  {
    id: "library",
    title: "المكتبة والمعرفة القانونية",
    sub: "قوانين ونماذج ومراجع",
    pages: ["المكتبة", "النماذج", "المعرفة", "الأرشيف"],
  },
  {
    id: "governance",
    title: "الحوكمة والتوقيع",
    sub: "موافقات وصلاحيات وسجلات تدقيق",
    pages: ["الموافقات", "التوقيع الإلكتروني", "الصلاحيات", "التدقيق"],
  },
  {
    id: "ai",
    title: "الذكاء الاصطناعي القانوني",
    sub: "تحليل مستندات وصياغات وتلخيص",
    pages: ["تحليل مستند", "تلخيص قضية", "اقتراح صياغات"],
  },
  {
    id: "comms",
    title: "الاتصالات والتنبيهات",
    sub: "إشعارات رسمية ومتابعات",
    pages: ["الإشعارات", "المتابعات", "التعاميم"],
  },
] as const;

export const LAW_SPECIALTY_OPTIONS = [
  "محامٍ عام",
  "قانون تجاري وشركات",
  "قضايا مدنية",
  "جنائي",
  "أحوال شخصية",
  "تحكيم وتسوية منازعات",
  "ملكية فكرية",
  "عمل وتأمينات",
];
