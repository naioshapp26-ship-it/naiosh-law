import type { PageSettingsDefinition } from "./types";
import { actionsTab, displayTab, field } from "./defaults";

/** Public marketing homepage `/` — admin-managed, separate from staff ERP pages. */
export const PUBLIC_HOMEPAGE_SETTINGS: PageSettingsDefinition = {
  pageKey: "public-homepage",
  title: "الصفحة العامة (الموقع)",
  description: "عنوان ووصف وأقسام الصفحة الرئيسية العامة للجمهور — منفصلة عن صفحات الموظفين",
  category: "admin",
  pageHref: "/",
  settingsHref: "/app/page-settings/public-homepage",
  status: "operational",
  icon: "🏠",
  manageRoles: ["admin"],
  tabs: [
    displayTab({
      defaultTitle: "NAIOSH Law — النظام القانوني السيادي 360",
      defaultSubtitle: "إدارة القضايا والموكلين بذكاء قانوني",
      columnOptions: [
        { value: "hero", label: "البطل" },
        { value: "features", label: "الميزات" },
        { value: "modules", label: "الوحدات" },
      ],
      defaultVisibleColumns: ["hero", "features", "modules"],
    }),
    actionsTab({
      allowCreate: false,
      allowDelete: false,
      allowArchive: false,
      allowExport: false,
      allowEdit: true,
    }),
    {
      id: "permissions",
      label: "الصلاحيات",
      fields: [
        field({
          key: "canManageSettingsRoles",
          path: "permissions.canManageSettingsRoles",
          label: "من يغيّر إعدادات الصفحة العامة",
          type: "multi-select",
          options: [{ value: "admin", label: "مدير النظام" }],
          defaultValue: ["admin"],
          locked: true,
        }),
        field({
          key: "canViewRoles",
          path: "permissions.canViewRoles",
          label: "أدوار إدارة المحتوى (محرر الإعدادات)",
          type: "multi-select",
          options: [{ value: "admin", label: "مدير النظام" }],
          defaultValue: ["admin"],
          locked: true,
        }),
      ],
    },
    {
      id: "specialized",
      label: "أقسام الصفحة العامة",
      fields: [
        field({
          key: "showHero",
          path: "specialized.showHero",
          label: "إظهار قسم البطل",
          type: "boolean",
          defaultValue: true,
        }),
        field({
          key: "showFeatures",
          path: "specialized.showFeatures",
          label: "إظهار بطاقات الميزات",
          type: "boolean",
          defaultValue: true,
        }),
        field({
          key: "showModules",
          path: "specialized.showModules",
          label: "إظهار شبكة الوحدات",
          type: "boolean",
          defaultValue: true,
        }),
        field({
          key: "showPromoBar",
          path: "specialized.showPromoBar",
          label: "إظهار شريط الترويج",
          type: "boolean",
          defaultValue: true,
        }),
      ],
    },
  ],
};
