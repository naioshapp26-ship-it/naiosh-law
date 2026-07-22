import { erpModuleHref } from "@/data/erp-sidebar-modules";

export type NaioshOwnershipMenuItem = {
  id: string;
  label: string;
  href: string;
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

/** قائمة ساتر «ملكية نايوش» في هيدر صفحة الهبوط */
export const NAIOSH_OWNERSHIP_MENU: NaioshOwnershipMenuItem[] = NAIOSH_OWNERSHIP_TYPE_OPTIONS.map(
  (label, index) => ({
    id: [
      "hq-office",
      "branch",
      "incubator",
      "platform",
      "office",
      "freelancer",
      "ip",
      "contracts",
      "publish",
      "patents",
      "innovation",
      "disclosure",
      "trademark",
      "business-model",
      "industrial",
      "disputes",
      "other",
    ][index]!,
    label,
    href: ownershipHref(label),
  })
);
