import { imperialAxes } from "@/data/empire-structure";
import { LANDING_SPECIALTIES } from "@/data/landing-specialties";
import type { PageSettingsDefinition } from "./types";
import {
  actionsTab,
  displayTab,
  permissionsTab,
  reportsTab,
  field,
} from "./defaults";

const STAFF_MANAGE = ["admin", "industrial_agent"] as const;

/**
 * Imperial axis hub pages under /app/axis/[slug] only.
 * Axes that deep-link to another real page (e.g. international-laws) are covered
 * by that page's own settings — avoid duplicate pageHref collisions.
 */
export const AXIS_PAGE_SETTINGS: PageSettingsDefinition[] = imperialAxes
  .filter((a) => a.id <= 9 && a.href.startsWith("/app/axis/"))
  .map((axis) => ({
    pageKey: `axis-${axis.slug}`,
    title: axis.title,
    description: axis.subtitle,
    category: "operations" as const,
    pageHref: `/app/axis/${axis.slug}`,
    settingsHref: `/app/page-settings/axis-${axis.slug}`,
    status: "operational" as const,
    icon: axis.icon || "🧭",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: axis.title,
        defaultSubtitle: axis.subtitle,
        columnOptions: [
          { value: "label", label: "العنصر" },
          { value: "description", label: "الوصف" },
        ],
        defaultVisibleColumns: ["label", "description"],
      }),
      actionsTab({ allowExport: false, allowArchive: false }),
      permissionsTab(),
      {
        id: "specialized" as const,
        label: "عرض المحور",
        fields: [
          field({
            key: "showItems",
            path: "specialized.showItems",
            label: "إظهار عناصر المحور",
            type: "boolean",
            defaultValue: true,
          }),
          field({
            key: "allowItemEdit",
            path: "specialized.allowItemEdit",
            label: "السماح بإضافة/تعديل عناصر المحور",
            type: "boolean",
            defaultValue: true,
          }),
          field({
            key: "showDescription",
            path: "specialized.showDescription",
            label: "إظهار وصف المحور",
            type: "boolean",
            defaultValue: true,
          }),
        ],
      },
    ],
  }));

export const INTERNATIONAL_LAWS_SETTINGS: PageSettingsDefinition = {
  pageKey: "international-laws",
  title: "التصنيف القانوني الدولي والمحلي",
  description: "محاور القوانين الدولية والوطنية والسجلات المرتبطة",
  category: "knowledge",
  pageHref: "/app/international-laws",
  settingsHref: "/app/page-settings/international-laws",
  status: "operational",
  icon: "🌐",
  manageRoles: [...STAFF_MANAGE],
  tabs: [
    displayTab({
      defaultTitle: "التصنيف القانوني الدولي والمحلي",
      defaultSubtitle: "محاور القوانين والسجلات عبر المواضيع القانونية",
      columnOptions: [
        { value: "title", label: "العنوان" },
        { value: "jurisdiction", label: "الاختصاص" },
        { value: "status", label: "الحالة" },
      ],
      defaultVisibleColumns: ["title", "jurisdiction", "status"],
    }),
    actionsTab(),
    permissionsTab(),
    reportsTab(),
    {
      id: "specialized",
      label: "أقسام التصنيف",
      fields: [
        field({
          key: "showAxes",
          path: "specialized.showAxes",
          label: "إظهار بطاقات المحاور",
          type: "boolean",
          defaultValue: true,
        }),
        field({
          key: "showRecords",
          path: "specialized.showRecords",
          label: "إظهار سجلات المواضيع",
          type: "boolean",
          defaultValue: true,
        }),
        field({
          key: "allowAxisEdit",
          path: "specialized.allowAxisEdit",
          label: "السماح بتعديل المحاور المخصصة",
          type: "boolean",
          defaultValue: true,
        }),
      ],
    },
  ],
};

/** Specialty workspaces — operational display/actions; inherit module engine via embedded ModuleShell where applicable */
export const SPECIALTY_PAGE_SETTINGS: PageSettingsDefinition[] = LANDING_SPECIALTIES.map(
  (sp) => ({
    pageKey: `specialty-${sp.slug}`,
    title: sp.title,
    description: sp.subtitle,
    category: "other" as const,
    pageHref: `/app/specialty/${sp.slug}`,
    settingsHref: `/app/page-settings/specialty-${sp.slug}`,
    status: "operational" as const,
    icon: sp.icon || "👤",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: sp.title,
        defaultSubtitle: sp.subtitle,
        columnOptions: [
          { value: "highlights", label: "أبرز الميزات" },
          { value: "module", label: "الوحدة المرتبطة" },
        ],
        defaultVisibleColumns: ["highlights", "module"],
      }),
      actionsTab({
        allowCreate: Boolean(sp.moduleSlug),
        allowDelete: false,
        allowExport: Boolean(sp.moduleSlug),
      }),
      permissionsTab(),
      {
        id: "specialized" as const,
        label: "مساحة التخصص",
        fields: [
          field({
            key: "showHighlights",
            path: "specialized.showHighlights",
            label: "إظهار أبرز الميزات",
            type: "boolean",
            defaultValue: true,
          }),
          field({
            key: "showModulePanel",
            path: "specialized.showModulePanel",
            label: "إظهار لوحة الوحدة المرتبطة",
            type: "boolean",
            defaultValue: true,
          }),
          field({
            key: "showDomainLink",
            path: "specialized.showDomainLink",
            label: "إظهار رابط الواجهة الكاملة",
            type: "boolean",
            defaultValue: true,
          }),
        ],
      },
    ],
  })
);
