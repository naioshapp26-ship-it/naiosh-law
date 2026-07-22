import { erpModuleHref } from "@/data/erp-sidebar-modules";

export type NaioshOwnershipMenuItem = {
  id: string;
  label: string;
  href: string;
};

const ownershipBase = erpModuleHref("intellectual-property");

function ownershipHref(type: string) {
  return `${ownershipBase}?type=${encodeURIComponent(type)}`;
}

/** قائمة ساتر «ملكية نايوش» في هيدر صفحة الهبوط */
export const NAIOSH_OWNERSHIP_MENU: NaioshOwnershipMenuItem[] = [
  { id: "hq-office", label: "ملكية المكتب الرئيس", href: ownershipHref("ملكية المكتب الرئيس") },
  { id: "branch", label: "ملكية الفرع", href: ownershipHref("ملكية الفرع") },
  { id: "incubator", label: "ملكية الحاضنة", href: ownershipHref("ملكية الحاضنة") },
  { id: "platform", label: "ملكية المنصة", href: ownershipHref("ملكية المنصة") },
  { id: "office", label: "ملكية المكتب", href: ownershipHref("ملكية المكتب") },
  { id: "freelancer", label: "ملكية الفريلانسر", href: ownershipHref("ملكية الفريلانسر") },
  { id: "ip", label: "الملكية الفكرية", href: ownershipHref("الملكية الفكرية") },
  { id: "contracts", label: "توثيق العقود", href: ownershipHref("توثيق العقود") },
  { id: "publish", label: "توثيق النشر", href: ownershipHref("توثيق النشر") },
  { id: "patents", label: "توثيق براءات الإختراع", href: ownershipHref("توثيق براءات الإختراع") },
  { id: "innovation", label: "توثيق الإبتكار", href: ownershipHref("توثيق الإبتكار") },
  { id: "disclosure", label: "توثيق الإفصاح", href: ownershipHref("توثيق الإفصاح") },
  { id: "trademark", label: "توثيق علامة تجارية", href: ownershipHref("توثيق علامة تجارية") },
  { id: "business-model", label: "توثيق نموذج تجاري", href: ownershipHref("توثيق نموذج تجاري") },
  { id: "industrial", label: "توثيق نموذج صناعي", href: ownershipHref("توثيق نموذج صناعي") },
  { id: "disputes", label: "توثيق تسوية النزاعات", href: ownershipHref("توثيق تسوية النزاعات") },
  { id: "other", label: "أخرى", href: ownershipHref("أخرى") },
];
