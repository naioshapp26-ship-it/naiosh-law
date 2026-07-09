export type Role = "admin" | "client";

export type LegalModule = {
  slug: string;
  title: string;
  subtitle: string;
  screens: string[];
  functions: string[];
  workflow: string[];
  relations: string[];
  dbTables: string[];
  permissions: Record<Role, string[]>;
};

const basePermissions = {
  admin: ["عرض", "إضافة", "تعديل", "اعتماد", "تقارير"],
  client: ["عرض الحالة", "تحميل المستندات", "متابعة التنبيهات"],
};

const adminOnlyPermissions = {
  admin: basePermissions.admin,
  client: [],
};

export const modules: LegalModule[] = [
  { slug: "dashboard", title: "لوحة التحكم", subtitle: "مؤشرات الأداء والملخصات اليومية", screens: ["مؤشرات الأداء", "إحصائيات القضايا", "الجلسات القادمة", "المهام اليومية", "التنبيهات", "الملخص المالي"], functions: ["مراقبة KPIs", "عرض تنبيهات ذكية", "فلترة حسب الفريق"], workflow: ["تحميل البيانات", "تحليل الحالة", "إرسال تنبيه"], relations: ["إدارة القضايا", "مركز المتابعات", "المحاسبة القانونية"], dbTables: ["dash_widgets", "alerts", "daily_tasks"], permissions: basePermissions },
  { slug: "case-management", title: "إدارة القضايا", subtitle: "إدارة الملف القانوني بالكامل", screens: ["القضايا", "الإجراءات", "الجلسات", "الأحكام", "التنفيذ", "المرفقات", "سير العمل", "سجل التعديلات", "الرسوم والمدفوعات"], functions: ["إضافة قضية", "تحديث مراحل القضية", "أرشفة المستندات"], workflow: ["فتح قضية", "إسناد مسؤول", "متابعة الجلسات", "إغلاق القضية"], relations: ["إدارة الموكلين", "إدارة الجلسات", "المحاسبة القانونية"], dbTables: ["cases", "case_steps", "case_judgments", "case_payments"], permissions: basePermissions },
  { slug: "clients-management", title: "إدارة الموكلين", subtitle: "بيانات العملاء والعقود والوثائق", screens: ["بيانات الموكلين", "الوكالات", "العقود", "الوثائق", "الجهات المرجعية", "التقارير"], functions: ["ملف موكل", "إدارة الوثائق", "تقارير العميل"], workflow: ["تسجيل موكل", "توقيع وكالة", "تحديث ملف"], relations: ["إدارة القضايا", "الاستشارات القانونية"], dbTables: ["clients", "contracts", "client_docs"], permissions: basePermissions },
  { slug: "court-sessions", title: "إدارة الجلسات", subtitle: "الجلسات والتقويم والتذكيرات", screens: ["جلسات المحكمة", "جلسات الخبراء", "التقويم", "التذكيرات", "رول الأسبوع"], functions: ["جدولة جلسة", "تذكيرات تلقائية", "عرض رول الأسبوع"], workflow: ["إضافة جلسة", "تأكيد الحضور", "توثيق النتيجة"], relations: ["إدارة القضايا", "الإشعارات"], dbTables: ["sessions", "session_calendar", "session_reminders"], permissions: basePermissions },
  { slug: "follow-up-center", title: "مركز المتابعات", subtitle: "متابعة الأحكام والإجراءات والسداد", screens: ["متابعة الأحكام", "متابعة الإجراءات", "متابعة السداد", "متابعة الأتعاب"], functions: ["إنشاء تذكرة متابعة", "تحديث الحالة", "تنبيهات متأخرات"], workflow: ["تحديد حالة", "تصعيد", "إغلاق"], relations: ["المحاسبة القانونية", "لوحة التحكم"], dbTables: ["follow_ups", "follow_up_logs"], permissions: basePermissions },
  { slug: "legal-accounting", title: "المحاسبة القانونية", subtitle: "رسوم وفواتير ومدفوعات وتقارير", screens: ["الرسوم", "الفواتير", "المدفوعات", "المصروفات", "الضرائب", "التقارير المالية"], functions: ["إصدار فاتورة", "تسجيل دفعة", "تحليل مالي"], workflow: ["إنشاء بند مالي", "مطابقة دفعات", "إغلاق دورة"], relations: ["إدارة القضايا", "مركز التقارير"], dbTables: ["fees", "invoices", "payments", "expenses", "taxes"], permissions: basePermissions },
  { slug: "legal-services", title: "الخدمات القانونية", subtitle: "إدارة الخدمات القانونية المقدمة", screens: ["كتالوج الخدمات", "طلبات الخدمات", "تتبع التنفيذ"], functions: ["تحديد SLA", "توزيع المهام"], workflow: ["طلب خدمة", "تنفيذ", "اعتماد"], relations: ["الطلبات الداخلية"], dbTables: ["services", "service_orders"], permissions: basePermissions },
  { slug: "legal-consultations", title: "الاستشارات القانونية", subtitle: "إدارة جلسات الاستشارات والتوصيات", screens: ["حجوزات الاستشارات", "محاضر الاستشارة", "التوصيات"], functions: ["تسجيل استشارة", "إرفاق توصية"], workflow: ["حجز", "جلسة", "تقرير"], relations: ["إدارة الموكلين"], dbTables: ["consultations", "consultation_notes"], permissions: basePermissions },
  { slug: "internal-requests", title: "الطلبات الداخلية", subtitle: "تدفق طلبات الفريق داخليًا", screens: ["صندوق الطلبات", "إسناد الطلب", "متابعة التنفيذ"], functions: ["تذكرة داخلية", "SLA داخلي"], workflow: ["فتح طلب", "إسناد", "إنجاز"], relations: ["الإدارة والصلاحيات"], dbTables: ["internal_requests"], permissions: basePermissions },
  { slug: "complaints-management", title: "إدارة الشكاوى", subtitle: "معالجة الشكاوى بآلية موثقة", screens: ["استقبال الشكوى", "التحقيق", "القرار"], functions: ["تصنيف الشكوى", "إغلاق مع سبب"], workflow: ["استلام", "تحليل", "إجراء تصحيحي"], relations: ["الإشعارات"], dbTables: ["complaints", "complaint_actions"], permissions: basePermissions },
  { slug: "smart-templates", title: "النماذج الذكية", subtitle: "توليد مستندات قانونية آليًا", screens: ["قوالب العقود", "قوالب المذكرات", "متغيرات القالب"], functions: ["دمج بيانات تلقائي", "تصدير PDF"], workflow: ["اختيار قالب", "إدخال المتغيرات", "توليد"], relations: ["الذكاء الاصطناعي القانوني"], dbTables: ["templates", "template_versions"], permissions: basePermissions },
  { slug: "reports-center", title: "مركز التقارير", subtitle: "تقارير تنفيذية وتشغيلية", screens: ["تقارير القضايا", "تقارير الأداء", "تقارير مالية"], functions: ["فلاتر متقدمة", "جدولة إرسال"], workflow: ["اختيار تقرير", "فلترة", "تصدير"], relations: ["لوحة التحكم", "المحاسبة القانونية"], dbTables: ["reports", "report_exports"], permissions: basePermissions },
  { slug: "administration", title: "الإدارة والصلاحيات", subtitle: "إدارة المستخدمين والأدوار", screens: ["المستخدمون", "الأدوار", "سجلات الدخول"], functions: ["تفعيل/تعطيل مستخدم", "تخصيص صلاحيات"], workflow: ["إنشاء دور", "ربط مستخدم", "مراجعة سجل"], relations: ["كل الوحدات"], dbTables: ["users", "roles", "role_permissions", "audit_logs"], permissions: adminOnlyPermissions },
  { slug: "notifications-center", title: "الإشعارات والتنبيهات", subtitle: "إدارة قنوات الإشعار والتنبيه", screens: ["قواعد التنبيه", "قناة البريد", "قناة الرسائل"], functions: ["قواعد Trigger", "إرسال متعدد القنوات"], workflow: ["تحديد حدث", "اختيار جمهور", "إرسال"], relations: ["إدارة الجلسات", "المتابعات"], dbTables: ["notifications", "notification_rules"], permissions: basePermissions },
  { slug: "integrations", title: "التكاملات الخارجية", subtitle: "ربط النظام بأنظمة خارجية", screens: ["واجهات API", "Webhooks", "حالة التكامل"], functions: ["توليد API key", "سجل الاستدعاءات"], workflow: ["تعريف تكامل", "اختبار اتصال", "تفعيل"], relations: ["كل الوحدات"], dbTables: ["integrations", "integration_logs"], permissions: adminOnlyPermissions },
  { slug: "ai-center", title: "الذكاء الاصطناعي القانوني", subtitle: "مساعدات تحليلية قانونية ذكية", screens: ["تحليل مستند", "تلخيص قضية", "اقتراح صياغات"], functions: ["NLP قانوني", "استخراج بنود حرجة"], workflow: ["رفع مستند", "تحليل", "مراجعة النتيجة"], relations: ["النماذج الذكية", "إدارة القضايا"], dbTables: ["ai_jobs", "ai_results"], permissions: adminOnlyPermissions },
  { slug: "general-tools", title: "الأدوات العامة", subtitle: "أدوات مساعدة يومية للفريق", screens: ["المهام الشخصية", "الملاحظات", "أرشيف سريع"], functions: ["قائمة مهام", "بحث موحد"], workflow: ["تسجيل", "تنظيم", "أرشفة"], relations: ["لوحة التحكم"], dbTables: ["tools_tasks", "notes"], permissions: basePermissions },
];

export const moduleMap = Object.fromEntries(modules.map((item) => [item.slug, item]));
