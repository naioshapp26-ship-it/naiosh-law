/** Shared client-portal types/fixtures — safe for Client Components (no Prisma/pg). */

export const DEMO_CLIENT_EMAIL = "client@naioshlaw.com";
export const DEMO_CLIENT_USER_ID = "demo-client-portal-user";
export const DEMO_CLIENT_ID = "demo-client-portal-record";

export const PORTAL_HOME = "/portal";
export const STAFF_HOME = "/app/dashboard";

export function postLoginPath(role: string) {
  return role === "client" ? PORTAL_HOME : STAFF_HOME;
}

export function isClientRole(role: string) {
  return role === "client";
}

export function isDemoPortalSession(session: { sub: string; email: string; role: string }) {
  return session.role === "client" && (session.sub === DEMO_CLIENT_USER_ID || session.email === DEMO_CLIENT_EMAIL);
}

export type PortalProfile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  phoneDialCode: string | null;
  phoneSecondary: string | null;
  phoneSecondaryDialCode: string | null;
  type: string;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  preferredLanguage: string;
  companyName: string | null;
  authorizedPerson: string | null;
  authorizedPhone: string | null;
  internalNo: string | null;
  linkedOffice: string | null;
  lawyerName: string | null;
  profileComplete: boolean;
  isDemo: boolean;
  notificationPrefs: Record<string, boolean>;
  status: string;
};

export type PortalCase = {
  id: string;
  caseNo: string;
  type: string;
  title: string;
  court: string;
  status: string;
  lawyerName: string | null;
  nextDate: string | null;
  lastUpdate: string;
  timeline: { date: string; text: string }[];
  documentCount: number;
};

export type PortalSession = {
  id: string;
  caseNo: string | null;
  court: string;
  room: string | null;
  date: string;
  time: string | null;
  type: string;
  status: string;
  lawyer: string | null;
  notes: string | null;
};

export type PortalDocument = {
  id: string;
  title: string;
  category: string;
  fileName: string | null;
  fileUrl: string | null;
  status: string;
  caseId: string | null;
  createdAt: string;
  isDemo: boolean;
};

export type PortalRequest = {
  id: string;
  refNo: string;
  type: string;
  title: string;
  status: string;
  assignee: string | null;
  notes: string | null;
  lastUpdate: string | null;
  createdAt: string;
  timeline: { date: string; text: string }[];
  isDemo: boolean;
};

export type PortalInvoice = {
  id: string;
  invoiceNo: string;
  type: string;
  amount: number;
  paid: number;
  issueDate: string;
  dueDate: string | null;
  status: string;
  caseRef: string | null;
  notes: string | null;
  isDemo: boolean;
  collectible: boolean;
};

export type PortalNotification = {
  id: string;
  title: string;
  body: string;
  category: string;
  href: string | null;
  read: boolean;
  createdAt: string;
  isDemo: boolean;
};

export type PortalDashboard = {
  profile: PortalProfile;
  stats: {
    casesTotal: number;
    casesActive: number;
    casesClosed: number;
    upcomingSessions: number;
    documents: number;
    openRequests: number;
    dueAmount: number;
    unreadNotifications: number;
  };
  upcomingSessions: PortalSession[];
  recentNotifications: PortalNotification[];
  recentRequests: PortalRequest[];
};

export const SERVICE_REQUEST_TYPES = [
  "طلب استشارة",
  "طلب فتح ملف قضية",
  "طلب متابعة قضية",
  "طلب مراجعة عقد",
  "طلب صياغة مستند قانوني",
  "طلب موعد",
  "طلب خدمة أخرى",
] as const;

/** Isolated demo fixtures — clearly labeled, never real client data */
export function demoPortalBundle() {
  const profile: PortalProfile = {
    id: DEMO_CLIENT_ID,
    userId: DEMO_CLIENT_USER_ID,
    name: "عميل تجريبي",
    email: DEMO_CLIENT_EMAIL,
    phone: "500000001",
    phoneDialCode: "+966",
    phoneSecondary: null,
    phoneSecondaryDialCode: null,
    type: "فرد",
    avatarUrl: null,
    country: "السعودية",
    city: "الرياض",
    address: "حي تجريبي — للاطلاع فقط",
    preferredLanguage: "ar",
    companyName: null,
    authorizedPerson: null,
    authorizedPhone: null,
    internalNo: "DEMO-CL-001",
    linkedOffice: "مكتب نايوش التجريبي",
    lawyerName: "أ. أحمد المحامي (تجريبي)",
    profileComplete: true,
    isDemo: true,
    notificationPrefs: { cases: true, sessions: true, documents: true, invoices: true, messages: true },
    status: "نشط",
  };

  const cases: PortalCase[] = [
    {
      id: "demo-case-1",
      caseNo: "DEMO-2026/01",
      type: "تجاري",
      title: "قضية تجريبية — نزاع تعاقدي (بيانات وهمية)",
      court: "المحكمة التجارية — تجريبي",
      status: "نشطة",
      lawyerName: "أ. أحمد المحامي (تجريبي)",
      nextDate: "2026-11-12",
      lastUpdate: "تحديث تجريبي: تم جدولة جلسة قادمة",
      timeline: [
        { date: "2026-09-01", text: "فتح الملف التجريبي" },
        { date: "2026-09-20", text: "استلام مستند تجريبي من العميل" },
        { date: "2026-10-10", text: "جدولة جلسة تجريبية" },
      ],
      documentCount: 2,
    },
    {
      id: "demo-case-2",
      caseNo: "DEMO-2026/02",
      type: "عمالي",
      title: "قضية تجريبية مغلقة — مطالبة عمالية (وهمية)",
      court: "المحكمة العمالية — تجريبي",
      status: "مغلقة",
      lawyerName: "أ. أحمد المحامي (تجريبي)",
      nextDate: null,
      lastUpdate: "أُغلقت القضية التجريبية",
      timeline: [
        { date: "2026-05-01", text: "فتح الملف التجريبي" },
        { date: "2026-07-15", text: "صدور حكم تجريبي" },
        { date: "2026-08-01", text: "إغلاق الملف" },
      ],
      documentCount: 1,
    },
  ];

  const sessions: PortalSession[] = [
    {
      id: "demo-session-1",
      caseNo: "DEMO-2026/01",
      court: "المحكمة التجارية — تجريبي",
      room: "قاعة 3 (تجريبي)",
      date: "2026-11-12",
      time: "10:30",
      type: "جلسة مرافعة",
      status: "مجدولة",
      lawyer: "أ. أحمد المحامي (تجريبي)",
      notes: "تعليمات حضور تجريبية: إحضار الهوية والمستندات المطلوبة.",
    },
    {
      id: "demo-session-2",
      caseNo: "DEMO-2026/02",
      court: "المحكمة العمالية — تجريبي",
      room: null,
      date: "2026-07-15",
      time: "09:00",
      type: "جلسة نطق",
      status: "منتهية",
      lawyer: "أ. أحمد المحامي (تجريبي)",
      notes: "جلسة سابقة ضمن البيانات التجريبية.",
    },
  ];

  const documents: PortalDocument[] = [
    {
      id: "demo-doc-1",
      title: "عقد تجريبي — غير قابل للتنفيذ",
      category: "عقود",
      fileName: "demo-contract.pdf",
      fileUrl: null,
      status: "متاح (تجريبي)",
      caseId: "demo-case-1",
      createdAt: "2026-09-20",
      isDemo: true,
    },
    {
      id: "demo-doc-2",
      title: "مذكرة حضور تجريبية",
      category: "مذكرات",
      fileName: "demo-memo.pdf",
      fileUrl: null,
      status: "قيد المراجعة (تجريبي)",
      caseId: "demo-case-1",
      createdAt: "2026-10-05",
      isDemo: true,
    },
    {
      id: "demo-doc-3",
      title: "حكم تجريبي — قضية مغلقة",
      category: "أحكام",
      fileName: "demo-judgment.pdf",
      fileUrl: null,
      status: "متاح (تجريبي)",
      caseId: "demo-case-2",
      createdAt: "2026-07-16",
      isDemo: true,
    },
  ];

  const requests: PortalRequest[] = [
    {
      id: "demo-req-1",
      refNo: "REQ-DEMO-001",
      type: "طلب استشارة",
      title: "استشارة تجريبية حول عقد توريد",
      status: "قيد المعالجة",
      assignee: "مكتب نايوش التجريبي",
      notes: "طلب وهمي للاطلاع — لا يُنشئ مهمة إنتاج.",
      lastUpdate: "تم تعيين مستشار تجريبي",
      createdAt: "2026-10-01",
      timeline: [
        { date: "2026-10-01", text: "إنشاء الطلب التجريبي" },
        { date: "2026-10-02", text: "قيد المعالجة" },
      ],
      isDemo: true,
    },
  ];

  const invoices: PortalInvoice[] = [
    {
      id: "demo-inv-1",
      invoiceNo: "INV-DEMO-001",
      type: "أتعاب استشارة",
      amount: 1500,
      paid: 0,
      issueDate: "2026-10-01",
      dueDate: "2026-10-30",
      status: "غير مسدد (تجريبي — غير قابل للتحصيل)",
      caseRef: "DEMO-2026/01",
      notes: "فاتورة وهمية للعرض فقط — لا بوابة دفع.",
      isDemo: true,
      collectible: false,
    },
  ];

  const notifications: PortalNotification[] = [
    {
      id: "demo-n-1",
      title: "جلسة قادمة (تجريبي)",
      body: "لديك جلسة تجريبية بتاريخ 12 نوفمبر 2026.",
      category: "جلسات",
      href: "/portal/sessions",
      read: false,
      createdAt: "2026-10-20",
      isDemo: true,
    },
    {
      id: "demo-n-2",
      title: "مستند مطلوب (تجريبي)",
      body: "يرجى رفع صورة الهوية — ضمن بيئة العرض فقط.",
      category: "مستندات",
      href: "/portal/documents",
      read: false,
      createdAt: "2026-10-18",
      isDemo: true,
    },
    {
      id: "demo-n-3",
      title: "فاتورة تجريبية",
      body: "فاتورة INV-DEMO-001 معروضة للاطلاع وغير قابلة للتحصيل.",
      category: "فواتير",
      href: "/portal/finance",
      read: true,
      createdAt: "2026-10-01",
      isDemo: true,
    },
  ];

  return { profile, cases, sessions, documents, requests, invoices, notifications };
}

export function demoDashboard(): PortalDashboard {
  const b = demoPortalBundle();
  const dueAmount = b.invoices.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);
  return {
    profile: b.profile,
    stats: {
      casesTotal: b.cases.length,
      casesActive: b.cases.filter((c) => c.status === "نشطة").length,
      casesClosed: b.cases.filter((c) => c.status !== "نشطة").length,
      upcomingSessions: b.sessions.filter((s) => s.status === "مجدولة").length,
      documents: b.documents.length,
      openRequests: b.requests.filter((r) => r.status !== "مغلق" && r.status !== "مكتمل").length,
      dueAmount,
      unreadNotifications: b.notifications.filter((n) => !n.read).length,
    },
    upcomingSessions: b.sessions.filter((s) => s.status === "مجدولة"),
    recentNotifications: b.notifications.slice(0, 5),
    recentRequests: b.requests.slice(0, 5),
  };
}
