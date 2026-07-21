export type LawAdCategory = {
  icon: string;
  title: string;
  desc: string;
};

export type LawAdItem = {
  id: string;
  title: string;
  price: string;
  image: string;
  imageAlt: string;
  views: string;
  time: string;
  tab: "all" | "latest" | "popular";
};

export type LawAdTestimonial = {
  initial: string;
  name: string;
  text: string;
};

export const LAW_ADS_HERO = {
  title: "اكتشف أفضل الإعلانات المبوبة",
  subtitle: "منصة متكاملة لنشر الإعلانات باحترافية والوصول السريع إلى المهتمين في كل الفئات.",
  searchPlaceholder: "ابحث عن إعلان، منتج، أو خدمة...",
} as const;

export const LAW_ADS_STATS = [
  { value: 24, label: "دعم 24/7", format: "plain" as const },
  { value: 95, label: "معدل رضا %", format: "plain" as const },
  { value: 850, label: "معلن نشط", format: "plain" as const },
  { value: 1250, label: "إعلان منشور", format: "comma" as const },
] as const;

export const LAW_ADS_CATEGORIES: LawAdCategory[] = [
  { icon: "fa-house", title: "العقارات", desc: "بيع وإيجار الشقق والمكاتب." },
  { icon: "fa-car", title: "السيارات", desc: "جديد ومستعمل مع عروض خاصة." },
  { icon: "fa-briefcase", title: "الخدمات", desc: "خدمات احترافية للأفراد والشركات." },
  { icon: "fa-laptop", title: "الإلكترونيات", desc: "أجهزة حديثة بضمان وأسعار منافسة." },
];

export const LAW_ADS_TABS = [
  { id: "all", label: "الكل" },
  { id: "latest", label: "الأحدث" },
  { id: "popular", label: "الأكثر مشاهدة" },
] as const;

export const LAW_ADS_ITEMS: LawAdItem[] = [
  {
    id: "office",
    title: "مكتب مجهز بالكامل في موقع حيوي",
    price: "320$",
    image: "/newhome/booking-workspace.svg",
    imageAlt: "مساحة عمل متميزة",
    views: "1.2K مشاهدة",
    time: "منذ ساعتين",
    tab: "latest",
  },
  {
    id: "campaigns",
    title: "خدمة إدارة حملات رقمية للشركات الناشئة",
    price: "120$",
    image: "/newhome/booking-workspace.svg",
    imageAlt: "إعلان خدمة",
    views: "960 مشاهدة",
    time: "منذ 4 ساعات",
    tab: "latest",
  },
  {
    id: "tech-pack",
    title: "باقة تقنية متكاملة للأعمال الصغيرة",
    price: "870$",
    image: "/newhome/booking-workspace.svg",
    imageAlt: "إعلان تقني",
    views: "1.8K مشاهدة",
    time: "منذ يوم",
    tab: "popular",
  },
];

export const LAW_ADS_TESTIMONIALS: LawAdTestimonial[] = [
  {
    initial: "س",
    name: "سارة أحمد",
    text: "واجهتنا الجديدة رفعت التفاعل مع الإعلانات بشكل ملحوظ وكانت تجربة النشر سهلة وسريعة جدًا.",
  },
  {
    initial: "م",
    name: "محمد خالد",
    text: "تقارير الأداء والوضوح البصري ساعدونا على تحسين نتائج الحملات والوصول للجمهور المناسب.",
  },
  {
    initial: "ل",
    name: "ليلى ناصر",
    text: "تصميم احترافي جدًا مع تجربة مريحة على الجوال وسرعة ملحوظة في استعراض أحدث الإعلانات.",
  },
];

export const LAW_ADS_STEPS = [
  {
    n: 1,
    icon: "fa-user-plus",
    title: "إنشاء حساب",
    desc: "أنشئ حسابك وابدأ إعداد ملفك التجاري خلال دقائق.",
  },
  {
    n: 2,
    icon: "fa-pen-to-square",
    title: "أضف إعلانك",
    desc: "أضف الصور، الوصف، والسعر بشكل منظم وجذاب.",
  },
  {
    n: 3,
    icon: "fa-rocket",
    title: "نشر وترويج",
    desc: "انشر الإعلان في الفئة المناسبة مع خيارات ترويج ذكية.",
  },
  {
    n: 4,
    icon: "fa-chart-line",
    title: "تابع الأداء",
    desc: "راقب المشاهدات والتفاعل وطور النتائج باستمرار.",
  },
] as const;

export const LAW_ADS_PREMIUM = {
  title: "خطة الإعلان المميز",
  subtitle: "حل متكامل لزيادة الوصول والتحويل.",
  price: "29$",
  period: "شهريًا",
  features: [
    { label: "ظهور الإعلان في الأعلى", value: 92 },
    { label: "استهداف أدق للجمهور", value: 86 },
    { label: "تقارير أداء متقدمة", value: 80 },
  ],
} as const;
