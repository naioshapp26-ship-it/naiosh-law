/** Seed data mirroring NAIOSH ERP Super Admin (roles & permissions). */

export type PermissionLevel = {
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  description: string;
  priority: number;
};

export type SystemDef = {
  code: string;
  name_ar: string;
  name_en: string;
};

export type RoleDef = {
  code: string;
  title_ar: string;
  title_en: string;
  description: string;
  hierarchy_level: number;
  max_approval_limit: number | null;
  is_active: boolean;
  users_count: number;
  systems_count: number;
  permissions: Record<string, string>;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  account_type: string;
  entity_name: string;
  entity_id: string;
  job_title: string;
  role_code: string | null;
  is_active: boolean;
  password?: string;
};

export type AuditEntry = {
  id: string;
  date: string;
  type: string;
  entity_id: string;
  action: string;
  by: string;
};

export type PageDef = { key: string; label: string };

export type TenantSystem = {
  key: string;
  label: string;
  pages: PageDef[];
};

export const PERMISSION_LEVELS: PermissionLevel[] = [
  { code: "NONE", name_ar: "لا يوجد", name_en: "No Access", color: "#FF0000", description: "لا توجد صلاحيات", priority: 6 },
  { code: "LIMITED", name_ar: "محدود", name_en: "Limited", color: "#FFB6C1", description: "صلاحيات محدودة جداً بنطاق ضيق", priority: 5 },
  { code: "VIEW", name_ar: "عرض/قراءة", name_en: "View/Read Only", color: "#90EE90", description: "عرض البيانات فقط", priority: 4 },
  { code: "EXECUTIVE", name_ar: "تنفيذي", name_en: "Executive", color: "#87CEEB", description: "تنفيذ العمليات اليومية", priority: 3 },
  { code: "VIEW_APPROVE", name_ar: "عرض+موافقة", name_en: "View & Approve", color: "#FFD700", description: "عرض البيانات والموافقة على العمليات", priority: 2 },
  { code: "FULL", name_ar: "كامل", name_en: "Full Access", color: "#00FF00", description: "صلاحيات كاملة بدون قيود", priority: 1 },
];

export const HIERARCHY_OPTIONS = [
  { value: 0, label: "0 - القيادة العليا" },
  { value: 1, label: "1 - الإدارة العليا" },
  { value: 2, label: "2 - الإدارة الوسطى" },
  { value: 3, label: "3 - الإدارة التنفيذية" },
  { value: 4, label: "4 - الموظفين" },
];

export const SYSTEMS: SystemDef[] = [
  { code: "DASHBOARD", name_ar: "لوحة التحكم", name_en: "Dashboard" },
  { code: "CASES", name_ar: "إدارة القضايا", name_en: "Case Management" },
  { code: "CLIENTS", name_ar: "إدارة الموكلين", name_en: "Clients" },
  { code: "SESSIONS", name_ar: "الجلسات والتقويم", name_en: "Court Sessions" },
  { code: "FOLLOWUP", name_ar: "مركز المتابعات", name_en: "Follow-up" },
  { code: "FINANCE", name_ar: "المحاسبة القانونية", name_en: "Legal Accounting" },
  { code: "LIBRARY", name_ar: "المكتبة القانونية", name_en: "Legal Library" },
  { code: "ARCHIVE", name_ar: "الأرشيف", name_en: "Archive" },
  { code: "REPORTS", name_ar: "مركز التقارير", name_en: "Reports" },
  { code: "ADMIN", name_ar: "الإدارة والصلاحيات", name_en: "Administration" },
  { code: "GOVERNANCE", name_ar: "الحوكمة والاعتمادات", name_en: "Governance" },
  { code: "COMMUNICATIONS", name_ar: "الاتصالات والفروع", name_en: "Communications" },
  { code: "AI", name_ar: "الذكاء الاصطناعي القانوني", name_en: "AI Center" },
  { code: "NETWORK", name_ar: "الشبكة المهنية", name_en: "Professional Network" },
];

const fullPerms = Object.fromEntries(SYSTEMS.map((s) => [s.code, "FULL"]));
const viewPerms = Object.fromEntries(SYSTEMS.map((s) => [s.code, "VIEW"]));
const lawyerPerms: Record<string, string> = {
  ...viewPerms,
  CASES: "FULL",
  CLIENTS: "EXECUTIVE",
  SESSIONS: "FULL",
  FOLLOWUP: "EXECUTIVE",
  LIBRARY: "VIEW",
  ARCHIVE: "VIEW_APPROVE",
  REPORTS: "VIEW",
  ADMIN: "NONE",
  FINANCE: "VIEW",
  AI: "EXECUTIVE",
};
const financePerms: Record<string, string> = {
  ...viewPerms,
  FINANCE: "FULL",
  REPORTS: "VIEW_APPROVE",
  CASES: "VIEW",
  CLIENTS: "VIEW",
  ADMIN: "NONE",
  GOVERNANCE: "VIEW_APPROVE",
};
const secretaryPerms: Record<string, string> = {
  ...Object.fromEntries(SYSTEMS.map((s) => [s.code, "LIMITED"])),
  SESSIONS: "EXECUTIVE",
  CLIENTS: "EXECUTIVE",
  CASES: "VIEW",
  COMMUNICATIONS: "VIEW",
  ADMIN: "NONE",
};

export const SEED_ROLES: RoleDef[] = [
  {
    code: "SUPER_ADMIN",
    title_ar: "المسؤول العام",
    title_en: "Super Admin",
    description: "صلاحيات كاملة على كل أنظمة المكتب السيادي",
    hierarchy_level: 0,
    max_approval_limit: null,
    is_active: true,
    users_count: 1,
    systems_count: SYSTEMS.length,
    permissions: fullPerms,
  },
  {
    code: "MANAGING_PARTNER",
    title_ar: "الشريك المدير",
    title_en: "Managing Partner",
    description: "قيادة المكتب والموافقات العليا والقضايا الاستراتيجية",
    hierarchy_level: 0,
    max_approval_limit: 5000000,
    is_active: true,
    users_count: 1,
    systems_count: SYSTEMS.length,
    permissions: { ...fullPerms, ADMIN: "VIEW_APPROVE" },
  },
  {
    code: "SENIOR_LAWYER",
    title_ar: "محامٍ أول",
    title_en: "Senior Lawyer",
    description: "إدارة ملفات القضايا والإشراف على فريق المحامين",
    hierarchy_level: 1,
    max_approval_limit: 500000,
    is_active: true,
    users_count: 2,
    systems_count: 11,
    permissions: { ...lawyerPerms, GOVERNANCE: "VIEW_APPROVE", NETWORK: "EXECUTIVE" },
  },
  {
    code: "LAWYER",
    title_ar: "محامٍ",
    title_en: "Lawyer",
    description: "تنفيذ الأعمال اليومية للقضايا والجلسات والاستشارات",
    hierarchy_level: 2,
    max_approval_limit: 100000,
    is_active: true,
    users_count: 4,
    systems_count: 9,
    permissions: lawyerPerms,
  },
  {
    code: "LEGAL_ASSISTANT",
    title_ar: "مساعد قانوني",
    title_en: "Legal Assistant",
    description: "دعم إعداد المذكرات والأرشفة ومتابعة الجلسات",
    hierarchy_level: 3,
    max_approval_limit: 10000,
    is_active: true,
    users_count: 2,
    systems_count: 7,
    permissions: {
      ...viewPerms,
      CASES: "EXECUTIVE",
      SESSIONS: "EXECUTIVE",
      ARCHIVE: "EXECUTIVE",
      LIBRARY: "VIEW",
      ADMIN: "NONE",
      FINANCE: "NONE",
      GOVERNANCE: "LIMITED",
    },
  },
  {
    code: "LEGAL_ACCOUNTANT",
    title_ar: "محاسب قانوني",
    title_en: "Legal Accountant",
    description: "الفواتير والأتعاب والكفالات والمدفوعات",
    hierarchy_level: 2,
    max_approval_limit: 250000,
    is_active: true,
    users_count: 1,
    systems_count: 6,
    permissions: financePerms,
  },
  {
    code: "SECRETARY",
    title_ar: "سكرتارية",
    title_en: "Secretary",
    description: "الاستقبال وجدولة المواعيد وإدارة الاتصالات",
    hierarchy_level: 4,
    max_approval_limit: 0,
    is_active: true,
    users_count: 1,
    systems_count: 5,
    permissions: secretaryPerms,
  },
  {
    code: "CLIENT_PORTAL",
    title_ar: "عميل — بوابة",
    title_en: "Client Portal",
    description: "عرض حالة القضايا والمستندات الخاصة بالموكل فقط",
    hierarchy_level: 4,
    max_approval_limit: 0,
    is_active: true,
    users_count: 2,
    systems_count: 3,
    permissions: {
      ...Object.fromEntries(SYSTEMS.map((s) => [s.code, "NONE"])),
      CASES: "VIEW",
      SESSIONS: "VIEW",
      FINANCE: "LIMITED",
      LIBRARY: "LIMITED",
    },
  },
  {
    code: "COMPLIANCE_OFFICER",
    title_ar: "مسؤول امتثال",
    title_en: "Compliance Officer",
    description: "مراجعة السياسات والاعتمادات وسجل التدقيق",
    hierarchy_level: 1,
    max_approval_limit: 1000000,
    is_active: true,
    users_count: 1,
    systems_count: 8,
    permissions: {
      ...viewPerms,
      GOVERNANCE: "FULL",
      ADMIN: "VIEW_APPROVE",
      REPORTS: "VIEW_APPROVE",
      ARCHIVE: "VIEW",
      FINANCE: "VIEW",
    },
  },
  {
    code: "ARCHIVIST",
    title_ar: "أمين أرشيف",
    title_en: "Archivist",
    description: "إدارة الأرشيف الرقمي والتصنيف والاسترجاع",
    hierarchy_level: 3,
    max_approval_limit: 5000,
    is_active: false,
    users_count: 0,
    systems_count: 4,
    permissions: {
      ...Object.fromEntries(SYSTEMS.map((s) => [s.code, "NONE"])),
      ARCHIVE: "FULL",
      LIBRARY: "EXECUTIVE",
      CASES: "VIEW",
      REPORTS: "VIEW",
    },
  },
];

export const SEED_USERS: AdminUser[] = [
  { id: 1, name: "مدير النظام", email: "admin@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "مدير النظام", role_code: "SUPER_ADMIN", is_active: true },
  { id: 2, name: "م. سامي علي", email: "sami@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "محامٍ أول", role_code: "SENIOR_LAWYER", is_active: true },
  { id: 3, name: "م. منى محمد", email: "mona@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "محامية", role_code: "LAWYER", is_active: true },
  { id: 4, name: "م. كريم أحمد", email: "karim@naioshlaw.com", account_type: "BRANCH", entity_name: "فرع الإسكندرية", entity_id: "BR-ALX", job_title: "محامٍ", role_code: "LAWYER", is_active: true },
  { id: 5, name: "م. هدى إبراهيم", email: "hoda@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "مساعدة قانونية", role_code: "LEGAL_ASSISTANT", is_active: true },
  { id: 6, name: "م. يوسف طارق", email: "yousef@naioshlaw.com", account_type: "BRANCH", entity_name: "فرع الجيزة", entity_id: "BR-GIZ", job_title: "محامٍ", role_code: "LAWYER", is_active: true },
  { id: 7, name: "م. رانيا فرحات", email: "rania@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "محاسبة قانونية", role_code: "LEGAL_ACCOUNTANT", is_active: true },
  { id: 8, name: "م. طارق عمر", email: "tarek@naioshlaw.com", account_type: "OFFICE", entity_name: "مكتب المعادي", entity_id: "OF-MAA", job_title: "مساعد قانوني", role_code: "LEGAL_ASSISTANT", is_active: true },
  { id: 9, name: "م. أميرة سالم", email: "amira@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "سكرتارية تنفيذية", role_code: "SECRETARY", is_active: true },
  { id: 10, name: "عميل تجريبي", email: "client@naioshlaw.com", account_type: "TENANT", entity_name: "شركة النيل القابضة", entity_id: "TN-NIL", job_title: "موكل", role_code: "CLIENT_PORTAL", is_active: true },
  { id: 11, name: "م. إبراهيم حسن", email: "ibrahim@naioshlaw.com", account_type: "BRANCH", entity_name: "فرع الإسكندرية", entity_id: "BR-ALX", job_title: "محامٍ", role_code: "LAWYER", is_active: false },
  { id: 12, name: "د. نادية منصور", email: "nadia@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "شريكة مديرة", role_code: "MANAGING_PARTNER", is_active: true },
  { id: 13, name: "م. فهد العتيبي", email: "fahd@naioshlaw.com", account_type: "HQ", entity_name: "المكتب الرئيسي — نايوش", entity_id: "HQ-001", job_title: "مسؤول امتثال", role_code: "COMPLIANCE_OFFICER", is_active: true },
  { id: 14, name: "م. ليلى حسن", email: "layla@naioshlaw.com", account_type: "BRANCH", entity_name: "فرع الجيزة", entity_id: "BR-GIZ", job_title: "محامية أولى", role_code: "SENIOR_LAWYER", is_active: true },
  { id: 15, name: "شركة الأفق", email: "horizon@corp.eg", account_type: "TENANT", entity_name: "شركة الأفق للتطوير", entity_id: "TN-HOR", job_title: "موكل مؤسسي", role_code: "CLIENT_PORTAL", is_active: true },
  { id: 16, name: "م. عمر خالد", email: "omar@naioshlaw.com", account_type: "OFFICE", entity_name: "مكتب مدينة نصر", entity_id: "OF-NSR", job_title: "محامٍ", role_code: "LAWYER", is_active: true },
  { id: 17, name: "م. سارة نبيل", email: "sara@naioshlaw.com", account_type: "PLATFORM", entity_name: "منصة نايوش", entity_id: "PL-001", job_title: "مشغّل منصة", role_code: "SUPER_ADMIN", is_active: true },
  { id: 18, name: "م. حسام رضا", email: "hossam@naioshlaw.com", account_type: "INCUBATOR", entity_name: "حاضنة النخبة القانونية", entity_id: "IN-ELITE", job_title: "منسق حاضنة", role_code: null, is_active: true },
];

export const SEED_AUDIT: AuditEntry[] = [
  { id: "a1", date: "2026-07-19 16:42", type: "ROLE", entity_id: "SENIOR_LAWYER", action: "تحديث صلاحيات الدور", by: "مدير النظام" },
  { id: "a2", date: "2026-07-19 15:10", type: "USER", entity_id: "14", action: "تعيين دور SENIOR_LAWYER", by: "مدير النظام" },
  { id: "a3", date: "2026-07-19 14:05", type: "USER", entity_id: "18", action: "إضافة مستخدم جديد", by: "م. سارة نبيل" },
  { id: "a4", date: "2026-07-18 11:22", type: "OFFICE", entity_id: "OF-MAA", action: "تحديث صلاحيات صفحات المكتب", by: "مدير النظام" },
  { id: "a5", date: "2026-07-18 09:40", type: "TENANT", entity_id: "TN-NIL", action: "تحديث صلاحيات المستأجر", by: "د. نادية منصور" },
  { id: "a6", date: "2026-07-17 17:55", type: "ROLE", entity_id: "LEGAL_ACCOUNTANT", action: "إنشاء دور جديد", by: "مدير النظام" },
  { id: "a7", date: "2026-07-17 12:18", type: "USER", entity_id: "11", action: "تعطيل مستخدم", by: "م. فهد العتيبي" },
  { id: "a8", date: "2026-07-16 10:03", type: "SIDEBAR", entity_id: "BRANCH", action: "تحديث القائمة الجانبية لنوع الحساب", by: "مدير النظام" },
  { id: "a9", date: "2026-07-15 19:30", type: "USER", entity_id: "7", action: "إلغاء الدور ثم إعادة التعيين", by: "مدير النظام" },
  { id: "a10", date: "2026-07-14 08:15", type: "ROLE", entity_id: "ARCHIVIST", action: "تعطيل الدور", by: "م. فهد العتيبي" },
  { id: "a11", date: "2026-07-13 16:00", type: "PERMISSION", entity_id: "LAWYER", action: "حفظ مصفوفة الصلاحيات", by: "د. نادية منصور" },
  { id: "a12", date: "2026-07-12 13:44", type: "USER", entity_id: "15", action: "تعديل بيانات مستخدم", by: "م. أميرة سالم" },
];

export const OFFICE_PAGES: PageDef[] = [
  { key: "dashboard", label: "لوحة التحكم الإمبراطورية" },
  { key: "cases", label: "إدارة القضايا" },
  { key: "clients", label: "إدارة الموكلين" },
  { key: "sessions", label: "التقويم والجلسات" },
  { key: "followup", label: "مركز المتابعات" },
  { key: "finance", label: "المالية القانونية" },
  { key: "library", label: "المكتبة القانونية" },
  { key: "archive", label: "الأرشيف" },
  { key: "reports", label: "التقارير" },
  { key: "admin", label: "الإدارة والصلاحيات" },
  { key: "governance", label: "الحوكمة والاعتمادات" },
  { key: "communications", label: "الاتصالات والفروع" },
  { key: "global-ops", label: "العمليات الدولية" },
  { key: "officials", label: "الجهات الرسمية" },
  { key: "network", label: "الشبكة المهنية" },
  { key: "ai", label: "الذكاء الاصطناعي" },
  { key: "notifications", label: "الإشعارات" },
  { key: "integrations", label: "التكاملات" },
  { key: "templates", label: "النماذج الذكية" },
  { key: "consultations", label: "الاستشارات" },
  { key: "complaints", label: "الشكاوى" },
  { key: "internal-requests", label: "الطلبات الداخلية" },
  { key: "system-settings", label: "إعدادات الصفحة الرئيسية" },
  { key: "audit-logs", label: "سجل النظام" },
];

export const TENANT_SYSTEMS: TenantSystem[] = [
  {
    key: "core-litigation",
    label: "التقاضي الأساسي",
    pages: [
      { key: "core-litigation", label: "التقاضي الأساسي" },
      { key: "cases", label: "القضايا" },
      { key: "sessions", label: "الجلسات" },
      { key: "followup", label: "المتابعات" },
    ],
  },
  {
    key: "client-services",
    label: "خدمات الموكلين",
    pages: [
      { key: "client-services", label: "خدمات الموكلين" },
      { key: "clients", label: "ملفات الموكلين" },
      { key: "consultations", label: "الاستشارات" },
      { key: "contracts", label: "العقود والوكالات" },
    ],
  },
  {
    key: "legal-finance",
    label: "المالية القانونية",
    pages: [
      { key: "legal-finance", label: "المالية القانونية" },
      { key: "invoices", label: "الفواتير" },
      { key: "fees", label: "الأتعاب" },
      { key: "bail", label: "الكفالات" },
      { key: "payments", label: "المدفوعات" },
    ],
  },
  {
    key: "knowledge",
    label: "المعرفة والأرشيف",
    pages: [
      { key: "knowledge", label: "المعرفة والأرشيف" },
      { key: "library", label: "المكتبة" },
      { key: "archive", label: "الأرشيف" },
      { key: "templates", label: "النماذج" },
    ],
  },
  {
    key: "governance",
    label: "الحوكمة",
    pages: [
      { key: "governance", label: "الحوكمة" },
      { key: "approvals", label: "الاعتمادات" },
      { key: "signatures", label: "التوقيعات" },
      { key: "policies", label: "السياسات" },
    ],
  },
  {
    key: "platform",
    label: "المنصة والإدارة",
    pages: [
      { key: "platform", label: "المنصة والإدارة" },
      { key: "admin", label: "الأدوار والصلاحيات" },
      { key: "reports", label: "التقارير" },
      { key: "system-settings", label: "إعدادات الهوية" },
    ],
  },
];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "BRANCH", label: "فرع (BRANCH)" },
  { value: "OFFICE", label: "مكتب (OFFICE)" },
  { value: "INCUBATOR", label: "حاضنة (INCUBATOR)" },
  { value: "TENANT", label: "مستأجر (TENANT)" },
  { value: "PLATFORM", label: "منصة (PLATFORM)" },
  { value: "HQ", label: "المكتب الرئيسي (HQ)" },
];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  BRANCH: "فرع",
  OFFICE: "مكتب",
  INCUBATOR: "حاضنة",
  TENANT: "مستأجر",
  PLATFORM: "منصة",
  HQ: "المكتب الرئيسي",
};

export const SEED_OFFICES: Record<string, { name: string; code: string; pages: string[] }> = {
  "97": { name: "مكتب المعادي", code: "OF-MAA", pages: ["dashboard", "cases", "clients", "sessions", "finance", "archive"] },
  OFF636298: { name: "مكتب مدينة نصر", code: "OF-NSR", pages: ["dashboard", "cases", "sessions", "reports", "network"] },
  "OF-MAA": { name: "مكتب المعادي", code: "OF-MAA", pages: ["dashboard", "cases", "clients", "sessions", "finance", "archive"] },
  "OF-NSR": { name: "مكتب مدينة نصر", code: "OF-NSR", pages: ["dashboard", "cases", "sessions", "reports", "network"] },
};

export const SEED_TENANTS: Record<string, { name: string; subdomain: string; entity_id: string; pages: string[]; systems: string[] }> = {
  "moka.naiosherp.com": {
    name: "موكا القانونية",
    subdomain: "moka",
    entity_id: "TEN000123",
    pages: ["cases", "sessions", "clients", "invoices"],
    systems: ["core-litigation", "client-services", "legal-finance"],
  },
  TEN000123: {
    name: "موكا القانونية",
    subdomain: "moka",
    entity_id: "TEN000123",
    pages: ["cases", "sessions", "clients", "invoices"],
    systems: ["core-litigation", "client-services", "legal-finance"],
  },
  "TN-NIL": {
    name: "شركة النيل القابضة",
    subdomain: "nile",
    entity_id: "TN-NIL",
    pages: ["cases", "sessions", "finance"],
    systems: ["core-litigation", "legal-finance"],
  },
};

export const STORAGE_KEY = "naiosh-roles-permissions-v1";
