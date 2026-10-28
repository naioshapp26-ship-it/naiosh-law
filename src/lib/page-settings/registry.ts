import { ERP_SIDEBAR_MODULES, erpModuleHref } from "@/data/erp-sidebar-modules";
import type { PageSettingsDefinition, PageSettingsCategory, SettingTabDef } from "./types";
import {
  actionsTab,
  displayTab,
  fieldsTab,
  linksTab,
  permissionsTab,
  reportsTab,
  workflowTab,
  field,
} from "./defaults";
import { allModuleShellDefinitions } from "./from-module-config";
import { FIXED_STAFF_OPERATIONAL } from "./fixed-staff";
import {
  AXIS_PAGE_SETTINGS,
  INTERNATIONAL_LAWS_SETTINGS,
  SPECIALTY_PAGE_SETTINGS,
} from "./axis-and-specialty";
import { PUBLIC_HOMEPAGE_SETTINGS } from "./public-homepage";

const STAFF_MANAGE = ["admin", "industrial_agent"] as const;

function planned(
  pageKey: string,
  title: string,
  description: string,
  category: PageSettingsCategory,
  pageHref: string,
  icon: string,
  gapReason: string
): PageSettingsDefinition {
  return {
    pageKey,
    title,
    description,
    category,
    pageHref,
    settingsHref: `/app/page-settings/${pageKey}`,
    status: "planned",
    icon,
    manageRoles: [...STAFF_MANAGE],
    gapReason,
    tabs: [
      displayTab({
        defaultTitle: title,
        defaultSubtitle: description,
        columnOptions: [{ value: "name", label: "الاسم" }],
        defaultVisibleColumns: ["name"],
      }),
      actionsTab({ allowDelete: false }),
      permissionsTab(),
    ],
  };
}

function specializedCases(): SettingTabDef {
  return {
    id: "specialized",
    label: "إعدادات القضايا",
    fields: [
      field({
        key: "caseTypes",
        path: "specialized.caseTypes",
        label: "أنواع القضايا",
        type: "string-list",
        defaultValue: [
          "تجاري",
          "مدني",
          "جنائي",
          "عمالي",
          "أحوال شخصية",
          "إداري",
          "عقاري",
          "ملكية فكرية",
        ],
      }),
      field({
        key: "caseStages",
        path: "specialized.caseStages",
        label: "مراحل القضية",
        type: "string-list",
        defaultValue: ["تسجيل", "تحضير", "مرافعة", "حكم", "تنفيذ", "أرشفة"],
      }),
      field({
        key: "requireCourtFields",
        path: "specialized.requireCourtFields",
        label: "إلزام حقول المحكمة والدائرة",
        type: "boolean",
        defaultValue: true,
        locked: true,
      }),
      field({
        key: "autoAssignLawyer",
        path: "specialized.autoAssignLawyer",
        label: "اقتراح إسناد المحامي المسؤول",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "hearingRemindersDays",
        path: "specialized.hearingRemindersDays",
        label: "أيام التنبيه قبل الجلسة",
        type: "number",
        defaultValue: 3,
        min: 0,
        max: 30,
      }),
      field({
        key: "linkFees",
        path: "specialized.linkFees",
        label: "ربط الأتعاب بالقضية",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "archiveClosedAfterDays",
        path: "specialized.archiveClosedAfterDays",
        label: "أيام قبل اقتراح أرشفة القضايا المغلقة",
        type: "number",
        defaultValue: 90,
        min: 0,
        max: 730,
      }),
    ],
  };
}

function specializedPortal(): SettingTabDef {
  return {
    id: "specialized",
    label: "إعدادات بوابة العميل",
    fields: [
      field({
        key: "showCases",
        path: "specialized.showCases",
        label: "إظهار قسم القضايا للعميل",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showSessions",
        path: "specialized.showSessions",
        label: "إظهار الجلسات والمواعيد",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showDocuments",
        path: "specialized.showDocuments",
        label: "إظهار المستندات القابلة للتنزيل",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showFinance",
        path: "specialized.showFinance",
        label: "إظهار الفواتير والمدفوعات",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showRequests",
        path: "specialized.showRequests",
        label: "إظهار طلبات الخدمات والاستشارات",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "showMessages",
        path: "specialized.showMessages",
        label: "إظهار الرسائل",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "allowProfileEdit",
        path: "specialized.allowProfileEdit",
        label: "السماح بتعديل الملف الشخصي",
        type: "boolean",
        defaultValue: true,
      }),
      field({
        key: "hideInternalNotes",
        path: "specialized.hideInternalNotes",
        label: "إخفاء الملاحظات الداخلية عن العميل",
        type: "boolean",
        defaultValue: true,
        locked: true,
      }),
      field({
        key: "isolateClients",
        path: "specialized.isolateClients",
        label: "عزل بيانات العملاء (لا يرى بيانات عميل آخر)",
        type: "boolean",
        defaultValue: true,
        locked: true,
      }),
    ],
  };
}

function specializedFinance(): SettingTabDef {
  return {
    id: "specialized",
    label: "إعدادات المالية",
    fields: [
      field({
        key: "paymentMethods",
        path: "specialized.paymentMethods",
        label: "طرق الدفع المسموحة",
        type: "multi-select",
        options: [
          { value: "cash", label: "نقدي" },
          { value: "transfer", label: "تحويل" },
          { value: "check", label: "شيك" },
          { value: "payment_gateway", label: "بوابة دفع" },
        ],
        defaultValue: ["cash", "transfer", "check", "payment_gateway"],
      }),
      field({
        key: "collectionStatuses",
        path: "specialized.collectionStatuses",
        label: "حالات التحصيل",
        type: "string-list",
        defaultValue: ["مسدد", "جزئي", "غير مسدد", "مؤجل"],
      }),
      field({
        key: "requireApprovalAbove",
        path: "specialized.requireApprovalAbove",
        label: "مبلغ يتطلب اعتمادًا (عملة محلية)",
        type: "number",
        defaultValue: 50000,
        min: 0,
      }),
      field({
        key: "receiptTemplate",
        path: "specialized.receiptTemplate",
        label: "قالب الإيصال",
        type: "select",
        options: [
          { value: "standard", label: "قياسي" },
          { value: "detailed", label: "مفصّل" },
          { value: "minimal", label: "مختصر" },
        ],
        defaultValue: "standard",
      }),
      field({
        key: "auditSettlements",
        path: "specialized.auditSettlements",
        label: "تسجيل تدقيق للتسويات",
        type: "boolean",
        defaultValue: true,
        locked: true,
      }),
    ],
  };
}

/** Mandatory RTL order: caseNo → client → phone → type → court → country → city → status → nextDate → fees */
const CASE_COLUMNS = [
  { value: "caseNo", label: "رقم القضية" },
  { value: "client", label: "الموكل" },
  { value: "phone", label: "رقم الجوال" },
  { value: "type", label: "النوع" },
  { value: "court", label: "المحكمة" },
  { value: "country", label: "الدولة" },
  { value: "city", label: "المدينة" },
  { value: "status", label: "الحالة" },
  { value: "nextDate", label: "الجلسة القادمة" },
  { value: "fees", label: "الرسوم" },
];

const CLIENT_COLUMNS = [
  { value: "name", label: "الاسم" },
  { value: "type", label: "النوع" },
  { value: "phone", label: "رقم الجوال" },
  { value: "country", label: "الدولة" },
  { value: "city", label: "المدينة" },
  { value: "cases", label: "عدد القضايا" },
  { value: "status", label: "الحالة" },
  { value: "since", label: "منذ" },
];

const SESSION_COLUMNS = [
  { value: "caseNo", label: "القضية" },
  { value: "client", label: "الموكل" },
  { value: "phone", label: "رقم الجوال" },
  { value: "court", label: "المحكمة" },
  { value: "country", label: "الدولة" },
  { value: "city", label: "المدينة" },
  { value: "date", label: "التاريخ" },
  { value: "time", label: "الوقت" },
  { value: "type", label: "النوع" },
  { value: "status", label: "الحالة" },
];

const FINANCE_COLUMNS = [
  { value: "ref", label: "المرجع" },
  { value: "client", label: "الموكل" },
  { value: "phone", label: "رقم الجوال" },
  { value: "country", label: "الدولة" },
  { value: "city", label: "المدينة" },
  { value: "type", label: "النوع" },
  { value: "amount", label: "المبلغ" },
  { value: "status", label: "الحالة" },
  { value: "date", label: "التاريخ" },
];

/** Shared person-contact field options for page-settings (visibility / required / order) */
export const PERSON_CONTACT_SETTING_FIELDS = [
  { value: "phone", label: "رقم الجوال" },
  { value: "phoneDialCode", label: "مفتاح الدولة" },
  { value: "country", label: "الدولة" },
  { value: "city", label: "المدينة" },
];

/** Fully operational core pages — phase 1 */
const CORE_OPERATIONAL: PageSettingsDefinition[] = [
  {
    pageKey: "case-management",
    title: "إدارة القضايا",
    description: "أنواع القضايا، المراحل، الأعمدة، الصلاحيات، وربط الجلسات والمستندات",
    category: "cases",
    pageHref: "/app/modules/case-management",
    settingsHref: "/app/page-settings/case-management",
    status: "operational",
    icon: "⚖️",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "إدارة القضايا",
        defaultSubtitle: "إدارة الملف القانوني بالكامل",
        columnOptions: CASE_COLUMNS,
        defaultVisibleColumns: CASE_COLUMNS.map((c) => c.value),
      }),
      fieldsTab({
        fieldOptions: [
          ...CASE_COLUMNS,
          { value: "phoneDialCode", label: "مفتاح الدولة" },
        ],
        defaultRequired: ["caseNo", "client", "phone", "country", "city", "type", "status"],
        lockedRequired: ["caseNo", "client", "phone", "country", "city", "status"],
      }),
      actionsTab(),
      permissionsTab(),
      workflowTab(["نشطة", "معلقة", "مغلقة", "فائزة", "خاسرة", "محكوم"], "نشطة"),
      reportsTab(),
      linksTab([
        { key: "linkClients", label: "ربط بالموكلين", defaultValue: true },
        { key: "linkLawyers", label: "ربط بالمحامين", defaultValue: true },
        { key: "linkSessions", label: "ربط بالجلسات", defaultValue: true },
        { key: "linkDocuments", label: "ربط بالمستندات", defaultValue: true },
        { key: "linkFinance", label: "ربط بالفواتير والأتعاب", defaultValue: true },
      ]),
      specializedCases(),
    ],
  },
  {
    pageKey: "clients-management",
    title: "إدارة الموكلين",
    description: "بيانات الموكلين، الحقول الظاهرة، والصلاحيات مع عزل بيانات العملاء",
    category: "clients",
    pageHref: "/app/modules/clients-management",
    settingsHref: "/app/page-settings/clients-management",
    status: "operational",
    icon: "👥",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "إدارة الموكلين",
        defaultSubtitle: "بيانات العملاء والعقود والوثائق",
        columnOptions: CLIENT_COLUMNS,
        defaultVisibleColumns: CLIENT_COLUMNS.map((c) => c.value),
      }),
      fieldsTab({
        fieldOptions: [
          ...CLIENT_COLUMNS,
          { value: "phoneDialCode", label: "مفتاح الدولة" },
        ],
        defaultRequired: ["name", "phone", "country", "city", "type", "status"],
        lockedRequired: ["name", "phone", "country", "city", "status"],
      }),
      actionsTab(),
      permissionsTab(),
      workflowTab(["نشط", "معلق", "محظور", "موقف"], "نشط"),
      reportsTab(),
      linksTab([
        { key: "linkCases", label: "ربط بالقضايا", defaultValue: true },
        { key: "linkDocuments", label: "ربط بالمستندات", defaultValue: true },
        { key: "linkPortal", label: "ربط ببوابة العميل", defaultValue: true },
        { key: "linkFinance", label: "ربط بالمالية", defaultValue: true },
      ]),
      {
        id: "specialized",
        label: "إعدادات الموكلين",
        fields: [
          field({
            key: "clientTypes",
            path: "specialized.clientTypes",
            label: "أنواع الموكلين",
            type: "string-list",
            defaultValue: ["فرد", "شركة", "مؤسسة"],
          }),
          field({
            key: "requireNationalId",
            path: "specialized.requireNationalId",
            label: "إلزام الرقم الوطني / السجل",
            type: "boolean",
            defaultValue: false,
          }),
          field({
            key: "isolateRecords",
            path: "specialized.isolateRecords",
            label: "منع كشف بيانات موكل لغير المخوّل",
            type: "boolean",
            defaultValue: true,
            locked: true,
          }),
        ],
      },
    ],
  },
  {
    pageKey: "court-sessions",
    title: "إدارة الجلسات",
    description: "التقويم، التذكيرات، حالات الجلسة، والربط بالقضايا",
    category: "sessions",
    pageHref: "/app/modules/court-sessions",
    settingsHref: "/app/page-settings/court-sessions",
    status: "operational",
    icon: "🏛️",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "إدارة الجلسات",
        defaultSubtitle: "الجلسات والتقويم والتذكيرات",
        columnOptions: SESSION_COLUMNS,
        defaultVisibleColumns: SESSION_COLUMNS.map((c) => c.value),
      }),
      fieldsTab({
        fieldOptions: SESSION_COLUMNS,
        defaultRequired: ["caseNo", "date", "status"],
        lockedRequired: ["caseNo", "date", "status"],
      }),
      actionsTab(),
      permissionsTab(),
      workflowTab(["مجدولة", "قريبة", "منعقدة", "مؤجلة", "ملغاة"], "مجدولة"),
      reportsTab(),
      linksTab([
        { key: "linkCases", label: "ربط بالقضايا", defaultValue: true },
        { key: "linkNotifications", label: "ربط بالإشعارات", defaultValue: true },
      ]),
      {
        id: "specialized",
        label: "إعدادات الجلسات",
        fields: [
          field({
            key: "reminderDays",
            path: "specialized.reminderDays",
            label: "أيام التذكير قبل الجلسة",
            type: "number",
            defaultValue: 2,
            min: 0,
            max: 30,
          }),
          field({
            key: "calendarWeekStart",
            path: "specialized.calendarWeekStart",
            label: "بداية الأسبوع في التقويم",
            type: "select",
            options: [
              { value: "sat", label: "السبت" },
              { value: "sun", label: "الأحد" },
              { value: "mon", label: "الاثنين" },
            ],
            defaultValue: "sat",
          }),
        ],
      },
    ],
  },
  {
    pageKey: "legal-accounting",
    title: "المحاسبة القانونية",
    description: "الفواتير، طرق الدفع، حالات التحصيل، وصلاحيات الاعتماد",
    category: "finance",
    pageHref: "/app/modules/legal-accounting",
    settingsHref: "/app/page-settings/legal-accounting",
    status: "operational",
    icon: "💰",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "المحاسبة القانونية",
        defaultSubtitle: "رسوم وفواتير ومدفوعات وتقارير",
        columnOptions: FINANCE_COLUMNS,
        defaultVisibleColumns: FINANCE_COLUMNS.map((c) => c.value),
      }),
      fieldsTab({
        fieldOptions: FINANCE_COLUMNS,
        defaultRequired: ["ref", "amount", "status"],
        lockedRequired: ["ref", "amount", "status"],
      }),
      actionsTab({ allowDelete: false }),
      permissionsTab(),
      workflowTab(["مسدد", "جزئي", "غير مسدد", "مؤجل"], "غير مسدد"),
      reportsTab(),
      linksTab([
        { key: "linkCases", label: "ربط بالقضايا", defaultValue: true },
        { key: "linkClients", label: "ربط بالموكلين", defaultValue: true },
      ]),
      specializedFinance(),
    ],
  },
  {
    pageKey: "legal-finance",
    title: "المالية القانونية (لوحة)",
    description: "لوحة المالية المتقدمة، الأتعاب، والتحصيل",
    category: "finance",
    pageHref: "/app/legal-finance",
    settingsHref: "/app/page-settings/legal-finance",
    status: "operational",
    icon: "💵",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "المالية القانونية",
        defaultSubtitle: "لوحة مالية للقضايا والأتعاب",
        columnOptions: FINANCE_COLUMNS,
        defaultVisibleColumns: FINANCE_COLUMNS.map((c) => c.value),
      }),
      actionsTab({ allowDelete: false }),
      permissionsTab(),
      reportsTab(),
      specializedFinance(),
    ],
  },
  {
    pageKey: "professional-network",
    title: "المحامون والشبكة المهنية",
    description: "إعدادات عرض المحامين، طلبات الشبكة، والصلاحيات",
    category: "lawyers",
    pageHref: "/app/professional-network",
    settingsHref: "/app/page-settings/professional-network",
    status: "operational",
    icon: "🧑‍⚖️",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "الشبكة المهنية",
        defaultSubtitle: "المحامون والجهات المهنية",
        columnOptions: [
          { value: "name", label: "الاسم" },
          { value: "specialty", label: "التخصص" },
          { value: "status", label: "الحالة" },
        ],
        defaultVisibleColumns: ["name", "specialty", "status"],
      }),
      actionsTab(),
      permissionsTab(),
      workflowTab(["نشط", "معلق", "مرفوض"], "نشط"),
      linksTab([
        { key: "linkCases", label: "ربط بإسناد القضايا", defaultValue: true },
      ]),
      {
        id: "specialized",
        label: "إعدادات المحامين",
        fields: [
          field({
            key: "requireSpecialty",
            path: "specialized.requireSpecialty",
            label: "إلزام التخصص",
            type: "boolean",
            defaultValue: true,
          }),
          field({
            key: "allowSelfRegister",
            path: "specialized.allowSelfRegister",
            label: "السماح بالتسجيل الذاتي في الشبكة",
            type: "boolean",
            defaultValue: false,
          }),
        ],
      },
    ],
  },
  {
    pageKey: "archive",
    title: "الأرشيف والمستندات",
    description: "قواعد الأرشفة، أنواع الملفات، وحدود الرفع",
    category: "documents",
    pageHref: "/app/archive",
    settingsHref: "/app/page-settings/archive",
    status: "operational",
    icon: "📁",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "الأرشيف",
        defaultSubtitle: "المستندات والسجلات المؤرشفة",
        columnOptions: [
          { value: "title", label: "العنوان" },
          { value: "module", label: "الوحدة" },
          { value: "date", label: "التاريخ" },
        ],
        defaultVisibleColumns: ["title", "module", "date"],
      }),
      actionsTab({ allowCreate: false, allowDelete: false }),
      permissionsTab(),
      reportsTab(),
      {
        id: "specialized",
        label: "إعدادات المستندات",
        fields: [
          field({
            key: "allowedExtensions",
            path: "specialized.allowedExtensions",
            label: "امتدادات الملفات المسموحة",
            type: "string-list",
            defaultValue: ["pdf", "doc", "docx", "jpg", "png", "xlsx"],
          }),
          field({
            key: "maxUploadMb",
            path: "specialized.maxUploadMb",
            label: "حد الرفع (ميجابايت)",
            type: "number",
            defaultValue: 25,
            min: 1,
            max: 100,
          }),
          field({
            key: "requireCaseLink",
            path: "specialized.requireCaseLink",
            label: "إلزام ربط المستند بقضية عند الإمكان",
            type: "boolean",
            defaultValue: true,
          }),
        ],
      },
    ],
  },
  {
    pageKey: "client-portal",
    title: "بوابة العميل",
    description: "الأقسام الظاهرة للعميل، العزل، والرسائل — بدون كشف بيانات داخلية",
    category: "portal",
    pageHref: "/portal",
    settingsHref: "/app/page-settings/client-portal",
    status: "operational",
    icon: "🚪",
    manageRoles: [...STAFF_MANAGE],
    tabs: [
      displayTab({
        defaultTitle: "بوابة العميل",
        defaultSubtitle: "ما يراه العميل في البوابة",
        columnOptions: [{ value: "section", label: "القسم" }],
        defaultVisibleColumns: ["section"],
      }),
      actionsTab({
        allowCreate: false,
        allowEdit: false,
        allowDelete: false,
        allowArchive: false,
        allowExport: false,
      }),
      permissionsTab(),
      reportsTab(),
      linksTab([
        { key: "linkOwnCasesOnly", label: "عرض قضايا العميل فقط", defaultValue: true },
        { key: "linkNotifications", label: "ربط الإشعارات بأحداث العميل", defaultValue: true },
      ]),
      specializedPortal(),
    ],
  },
];

/** Remaining ModuleShell units — rich shared engine defs from module-configs */
const MODULE_ENGINE: PageSettingsDefinition[] = allModuleShellDefinitions(
  new Set(CORE_OPERATIONAL.map((c) => c.pageKey))
);

/** Real NAIOSH staff pages with nature-specific No-Code tabs (not ERP catalog). */
const FIXED_STAFF: PageSettingsDefinition[] = FIXED_STAFF_OPERATIONAL;

const SPECIALTY: PageSettingsDefinition[] = SPECIALTY_PAGE_SETTINGS;
const AXIS_AND_LAWS: PageSettingsDefinition[] = [
  ...AXIS_PAGE_SETTINGS,
  INTERNATIONAL_LAWS_SETTINGS,
];

const ERP_PLANNED: PageSettingsDefinition[] = ERP_SIDEBAR_MODULES.flatMap((mod) => {
  const parent = planned(
    `erp-${mod.id}`,
    mod.label,
    `وحدة ERP: ${mod.label}`,
    mod.id.includes("payment")
      ? "finance"
      : mod.id.includes("task")
        ? "tasks"
        : "operations",
    erpModuleHref(mod.id),
    "📦",
    "كتالوج ERP — ربط إعدادات تفصيلية لكل صفحة فرعية في مرحلة لاحقة"
  );
  const children = (mod.subItems ?? []).map((sub) =>
    planned(
      `erp-${mod.id}-${sub.id}`,
      sub.label,
      `${mod.label} ← ${sub.label}`,
      parent.category,
      erpModuleHref(sub.id),
      "▫️",
      "صفحة ERP فرعية — إعدادات تشغيلية مخصصة في مرحلة لاحقة"
    )
  );
  return [parent, ...children];
});

function dedupe(defs: PageSettingsDefinition[]): PageSettingsDefinition[] {
  const map = new Map<string, PageSettingsDefinition>();
  for (const d of defs) {
    if (!map.has(d.pageKey)) map.set(d.pageKey, d);
  }
  return Array.from(map.values());
}

export const PAGE_SETTINGS_REGISTRY: PageSettingsDefinition[] = dedupe([
  ...CORE_OPERATIONAL,
  ...MODULE_ENGINE,
  ...FIXED_STAFF,
  ...AXIS_AND_LAWS,
  ...SPECIALTY,
  PUBLIC_HOMEPAGE_SETTINGS,
  ...ERP_PLANNED,
]);

export const pageSettingsMap = Object.fromEntries(
  PAGE_SETTINGS_REGISTRY.map((d) => [d.pageKey, d])
) as Record<string, PageSettingsDefinition>;

export function getPageDefinition(pageKey: string): PageSettingsDefinition | null {
  return pageSettingsMap[pageKey] ?? null;
}

export function listPageDefinitions(filter?: {
  category?: PageSettingsCategory;
  status?: PageSettingsDefinition["status"];
  q?: string;
}): PageSettingsDefinition[] {
  let list = PAGE_SETTINGS_REGISTRY;
  if (filter?.category) list = list.filter((d) => d.category === filter.category);
  if (filter?.status) list = list.filter((d) => d.status === filter.status);
  if (filter?.q?.trim()) {
    const q = filter.q.trim().toLowerCase();
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.pageKey.toLowerCase().includes(q)
    );
  }
  return list;
}

export function coverageReport() {
  const total = PAGE_SETTINGS_REGISTRY.length;
  const operational = PAGE_SETTINGS_REGISTRY.filter((d) => d.status === "operational").length;
  const partial = PAGE_SETTINGS_REGISTRY.filter((d) => d.status === "partial").length;
  const planned = PAGE_SETTINGS_REGISTRY.filter((d) => d.status === "planned").length;
  return { total, operational, partial, planned };
}
