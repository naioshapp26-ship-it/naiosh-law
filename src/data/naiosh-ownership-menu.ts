import { erpModuleHref } from "@/data/erp-sidebar-modules";

export type NaioshOwnershipMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  desc: string;
};

const ownershipBase = erpModuleHref("intellectual-property");

/** أنواع الملكية في الساتر ونموذج الإضافة — مصدر واحد */
export const NAIOSH_OWNERSHIP_TYPE_OPTIONS = [
  "ملكية المكتب الرئيس",
  "ملكية الفرع",
  "ملكية الحاضنة",
  "ملكية المنصة",
  "ملكية المكتب",
  "ملكية الفريلانسر",
  "الملكية الفكرية",
  "توثيق العقود",
  "توثيق النشر",
  "توثيق براءات الإختراع",
  "توثيق الإبتكار",
  "توثيق الإفصاح",
  "توثيق علامة تجارية",
  "توثيق نموذج تجاري",
  "توثيق نموذج صناعي",
  "توثيق تسوية النزاعات",
  "أخرى",
] as const;

export type NaioshOwnershipType = (typeof NAIOSH_OWNERSHIP_TYPE_OPTIONS)[number];

/** رابط يفتح صفحة الملكية مع نموذج الإضافة (ونوع اختياري مسبق) */
export function ownershipAddHref(type?: string) {
  const params = new URLSearchParams();
  params.set("add", "1");
  if (type?.trim()) params.set("type", type.trim());
  return `${ownershipBase}?${params.toString()}`;
}

function ownershipHref(type: string) {
  return ownershipAddHref(type);
}

/** إضافة ملكية جديدة بدون نوع مسبق — يفتح نفس النموذج */
export const NAIOSH_OWNERSHIP_ADD_HREF = ownershipAddHref();

const OWNERSHIP_META: Record<
  string,
  { id: string; icon: string; desc: string }
> = {
  "ملكية المكتب الرئيس": {
    id: "hq-office",
    icon: "fa-building",
    desc: "تسجيل وإدارة ملكية المكتب الرئيسي ضمن منظومة نايوش.",
  },
  "ملكية الفرع": {
    id: "branch",
    icon: "fa-code-branch",
    desc: "توثيق ملكية الفروع وربطها بالشبكة التشغيلية.",
  },
  "ملكية الحاضنة": {
    id: "incubator",
    icon: "fa-seedling",
    desc: "إدارة ملكية الحاضنات والوحدات التابعة لها.",
  },
  "ملكية المنصة": {
    id: "platform",
    icon: "fa-layer-group",
    desc: "تسجيل ملكية المنصات الرقمية والتشغيلية.",
  },
  "ملكية المكتب": {
    id: "office",
    icon: "fa-briefcase",
    desc: "توثيق ملكية المكاتب المهنية والإلكترونية.",
  },
  "ملكية الفريلانسر": {
    id: "freelancer",
    icon: "fa-user-tie",
    desc: "تسجيل ملكية المستقلين والعاملين عن بُعد.",
  },
  "الملكية الفكرية": {
    id: "ip",
    icon: "fa-copyright",
    desc: "حماية وإدارة حقوق الملكية الفكرية.",
  },
  "توثيق العقود": {
    id: "contracts",
    icon: "fa-file-contract",
    desc: "توثيق العقود والاتفاقيات المرتبطة بالملكية.",
  },
  "توثيق النشر": {
    id: "publish",
    icon: "fa-book-open",
    desc: "توثيق حقوق النشر والمحتوى المنشور.",
  },
  "توثيق براءات الإختراع": {
    id: "patents",
    icon: "fa-lightbulb",
    desc: "تسجيل وتوثيق براءات الاختراع.",
  },
  "توثيق الإبتكار": {
    id: "innovation",
    icon: "fa-flask",
    desc: "توثيق الابتكارات والمبادرات الجديدة.",
  },
  "توثيق الإفصاح": {
    id: "disclosure",
    icon: "fa-file-lines",
    desc: "توثيق الإفصاحات الرسمية والقانونية.",
  },
  "توثيق علامة تجارية": {
    id: "trademark",
    icon: "fa-registered",
    desc: "تسجيل وتوثيق العلامات التجارية.",
  },
  "توثيق نموذج تجاري": {
    id: "business-model",
    icon: "fa-chart-pie",
    desc: "توثيق النماذج التجارية المعتمدة.",
  },
  "توثيق نموذج صناعي": {
    id: "industrial",
    icon: "fa-industry",
    desc: "توثيق النماذج والتصاميم الصناعية.",
  },
  "توثيق تسوية النزاعات": {
    id: "disputes",
    icon: "fa-scale-balanced",
    desc: "توثيق إجراءات تسوية النزاعات المتعلقة بالملكية.",
  },
  أخرى: {
    id: "other",
    icon: "fa-ellipsis",
    desc: "أنواع ملكية أخرى ضمن منظومة نايوش.",
  },
};

/** بطاقة «إضافة ملكية جديدة» في صفحة ملكية نايوش */
export const NAIOSH_OWNERSHIP_ADD_CARD: NaioshOwnershipMenuItem = {
  id: "add-new",
  label: "إضافة ملكية جديدة",
  href: NAIOSH_OWNERSHIP_ADD_HREF,
  icon: "fa-plus-circle",
  desc: "افتح نموذج إضافة ملكية جديدة بنفس التحقق والصلاحيات الحالية.",
};

/** عناصر صفحة / قائمة «ملكية نايوش» — نفس الروابط والأسماء */
export const NAIOSH_OWNERSHIP_MENU: NaioshOwnershipMenuItem[] = NAIOSH_OWNERSHIP_TYPE_OPTIONS.map(
  (label) => {
    const meta = OWNERSHIP_META[label]!;
    return {
      id: meta.id,
      label,
      href: ownershipHref(label),
      icon: meta.icon,
      desc: meta.desc,
    };
  }
);

/** كل البطاقات المعروضة في الصفحة المستقلة (إضافة + الأنواع) */
export const NAIOSH_OWNERSHIP_PAGE_CARDS: NaioshOwnershipMenuItem[] = [
  NAIOSH_OWNERSHIP_ADD_CARD,
  ...NAIOSH_OWNERSHIP_MENU,
];

export const NAIOSH_OWNERSHIP_PAGE_HREF = "/naiosh-ownership";

export const NAIOSH_OWNERSHIP_PAGE_INTRO =
  "اختر نوع الملكية أو التوثيق المطلوب. كل بطاقة تفتح نفس الوجهة السابقة مع الحفاظ على الصلاحيات والتحقق.";
