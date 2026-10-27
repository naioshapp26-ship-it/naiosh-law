import type { AuthPayload } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  DEMO_CLIENT_EMAIL,
  DEMO_CLIENT_ID,
  demoDashboard,
  demoPortalBundle,
  isDemoPortalSession,
  type PortalCase,
  type PortalDashboard,
  type PortalDocument,
  type PortalInvoice,
  type PortalNotification,
  type PortalProfile,
  type PortalRequest,
  type PortalSession,
} from "@/lib/client-portal";

function parsePrefs(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) {
    return { cases: true, sessions: true, documents: true, invoices: true, messages: true };
  }
  try {
    return { ...JSON.parse(raw) };
  } catch {
    return { cases: true, sessions: true, documents: true, invoices: true, messages: true };
  }
}

function parseTimeline(raw: string | null | undefined): { date: string; text: string }[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function dbAvailable() {
  try {
    getPrisma();
    return true;
  } catch {
    return false;
  }
}

export async function resolvePortalClientId(session: AuthPayload): Promise<string | null> {
  if (isDemoPortalSession(session)) {
    if (!(await dbAvailable())) return DEMO_CLIENT_ID;
    try {
      const prisma = getPrisma();
      const existing = await prisma.client.findFirst({
        where: { OR: [{ userId: session.sub }, { email: DEMO_CLIENT_EMAIL, isDemo: true }] },
      });
      return existing?.id ?? DEMO_CLIENT_ID;
    } catch {
      return DEMO_CLIENT_ID;
    }
  }

  try {
    const prisma = getPrisma();
    const client = await prisma.client.findFirst({ where: { userId: session.sub } });
    if (client) return client.id;
    // Fallback: match by email for legacy accounts
    const byEmail = await prisma.client.findFirst({ where: { email: session.email } });
    if (byEmail) {
      if (!byEmail.userId) {
        await prisma.client.update({ where: { id: byEmail.id }, data: { userId: session.sub } });
      }
      return byEmail.id;
    }
    return null;
  } catch {
    return isDemoPortalSession(session) ? DEMO_CLIENT_ID : null;
  }
}

export async function ensurePortalClientRecord(session: AuthPayload) {
  if (isDemoPortalSession(session)) return null;
  const prisma = getPrisma();
  let client = await prisma.client.findFirst({ where: { userId: session.sub } });
  if (!client && session.email) {
    client = await prisma.client.findFirst({ where: { email: session.email } });
    if (client && !client.userId) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { userId: session.sub },
      });
    }
  }
  if (client) return client;
  // Auto-provision CRM Client for a portal user that somehow lacks a linked row
  return prisma.client.create({
    data: {
      userId: session.sub,
      name: session.name || session.email,
      email: session.email,
      type: "فرد",
      internalNo: `CL-${Date.now().toString().slice(-8)}`,
      preferredLanguage: "ar",
      profileComplete: false,
      isDemo: false,
      status: "نشط",
      notes: "أُنشئ تلقائياً عند أول دخول لبوابة العميل",
    },
  });
}

export async function loadPortalProfile(session: AuthPayload): Promise<PortalProfile | null> {
  if (isDemoPortalSession(session) && !(await tryDb())) {
    return demoPortalBundle().profile;
  }
  try {
    const prisma = getPrisma();
    let client = await prisma.client.findFirst({ where: { userId: session.sub } });
    if (!client && session.email) {
      client = await prisma.client.findFirst({ where: { email: session.email } });
      if (client && !client.userId) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { userId: session.sub },
        });
      }
    }
    if (!client) {
      if (isDemoPortalSession(session)) return demoPortalBundle().profile;
      client = await ensurePortalClientRecord(session);
    }
    if (!client) return null;
    return {
      id: client.id,
      userId: client.userId ?? session.sub,
      name: client.name,
      email: client.email ?? session.email,
      phone: client.phone,
      type: client.type,
      avatarUrl: client.avatarUrl,
      country: client.country,
      city: client.city,
      address: client.address,
      preferredLanguage: client.preferredLanguage,
      companyName: client.companyName,
      authorizedPerson: client.authorizedPerson,
      authorizedPhone: client.authorizedPhone,
      internalNo: client.internalNo,
      linkedOffice: client.linkedOffice,
      lawyerName: client.lawyerName,
      profileComplete: client.profileComplete,
      isDemo: client.isDemo,
      notificationPrefs: parsePrefs(client.notificationPrefs),
      status: client.status,
    };
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().profile : null;
  }
}

async function tryDb() {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function loadPortalDashboard(session: AuthPayload): Promise<PortalDashboard | null> {
  if (!(await tryDb()) || isDemoPortalSession(session)) {
    // Prefer DB demo seed when available
    if (await tryDb()) {
      try {
        return await loadDashboardFromDb(session);
      } catch {
        return demoDashboard();
      }
    }
    return isDemoPortalSession(session) ? demoDashboard() : null;
  }
  return loadDashboardFromDb(session);
}

async function loadDashboardFromDb(session: AuthPayload): Promise<PortalDashboard | null> {
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoDashboard() : null;

  if (profile.isDemo && profile.id === DEMO_CLIENT_ID) {
    // Ensure we still show fixtures if record missing in DB
    const prisma = getPrisma();
    const exists = await prisma.client.findUnique({ where: { id: profile.id } }).catch(() => null);
    if (!exists) return demoDashboard();
  }

  const prisma = getPrisma();
  const clientId = profile.id;

  const [cases, sessions, documents, requests, invoices, notifications] = await Promise.all([
    prisma.case.findMany({ where: { clientId }, orderBy: { updatedAt: "desc" } }),
    prisma.courtSession.findMany({
      where: { case: { clientId } },
      orderBy: { date: "asc" },
      take: 20,
    }),
    prisma.clientPortalDocument.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientServiceRequest.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.financialRecord.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } }),
    prisma.clientPortalNotification.findMany({ where: { clientId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const dueAmount = invoices.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);

  return {
    profile,
    stats: {
      casesTotal: cases.length,
      casesActive: cases.filter((c) => c.status === "نشطة").length,
      casesClosed: cases.filter((c) => c.status !== "نشطة").length,
      upcomingSessions: sessions.filter((s) => s.status === "مجدولة").length,
      documents: documents.length,
      openRequests: requests.filter((r) => !["مغلق", "مكتمل", "مرفوض"].includes(r.status)).length,
      dueAmount,
      unreadNotifications: notifications.filter((n) => !n.read).length,
    },
    upcomingSessions: sessions
      .filter((s) => s.status === "مجدولة")
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        caseNo: s.caseNo,
        court: s.court,
        room: s.room,
        date: s.date,
        time: s.time,
        type: s.type,
        status: s.status,
        lawyer: s.lawyer,
        notes: s.notes,
      })),
    recentNotifications: notifications.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      href: n.href,
      read: n.read,
      createdAt: n.createdAt.toISOString().slice(0, 10),
      isDemo: n.isDemo,
    })),
    recentRequests: requests.slice(0, 5).map((r) => ({
      id: r.id,
      refNo: r.refNo,
      type: r.type,
      title: r.title,
      status: r.status,
      assignee: r.assignee,
      notes: r.notes,
      lastUpdate: r.lastUpdate,
      createdAt: r.createdAt.toISOString().slice(0, 10),
      timeline: parseTimeline(r.timeline),
      isDemo: r.isDemo,
    })),
  };
}

export async function loadPortalCases(session: AuthPayload): Promise<PortalCase[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().cases : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().cases : [];
  try {
    const prisma = getPrisma();
    const cases = await prisma.case.findMany({ where: { clientId: profile.id }, orderBy: { updatedAt: "desc" } });
    if (!cases.length && profile.isDemo) return demoPortalBundle().cases;
    const docs = await prisma.clientPortalDocument.groupBy({
      by: ["caseId"],
      where: { clientId: profile.id },
      _count: { _all: true },
    });
    const docMap = new Map(docs.map((d) => [d.caseId, d._count._all]));
    return cases.map((c) => ({
      id: c.id,
      caseNo: c.caseNo,
      type: c.type,
      title: c.notes?.trim() || `${c.type} — ${c.clientName}`,
      court: c.court,
      status: c.status,
      lawyerName: profile.lawyerName,
      nextDate: c.nextDate,
      lastUpdate: c.updatedAt.toISOString().slice(0, 10),
      timeline: [{ date: c.createdAt.toISOString().slice(0, 10), text: "فتح الملف" }],
      documentCount: docMap.get(c.id) ?? 0,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().cases : [];
  }
}

export async function loadPortalSessions(session: AuthPayload): Promise<PortalSession[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().sessions : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().sessions : [];
  try {
    const prisma = getPrisma();
    // Strict ownership: only sessions linked to this client's cases (never match by name alone)
    const rows = await prisma.courtSession.findMany({
      where: { case: { clientId: profile.id } },
      orderBy: { date: "desc" },
    });
    if (!rows.length && profile.isDemo) return demoPortalBundle().sessions;
    return rows.map((s) => ({
      id: s.id,
      caseNo: s.caseNo,
      court: s.court,
      room: s.room,
      date: s.date,
      time: s.time,
      type: s.type,
      status: s.status,
      lawyer: s.lawyer,
      notes: s.notes,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().sessions : [];
  }
}

export async function loadPortalDocuments(session: AuthPayload): Promise<PortalDocument[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().documents : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().documents : [];
  try {
    const prisma = getPrisma();
    const rows = await prisma.clientPortalDocument.findMany({
      where: { clientId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    if (!rows.length && profile.isDemo) return demoPortalBundle().documents;
    return rows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      fileName: d.fileName,
      // Do not ship base64 payloads in list responses — download via /api/portal/documents/:id?download=1
      fileUrl: d.fileUrl ? `/api/portal/documents/${d.id}?download=1` : null,
      status: d.status,
      caseId: d.caseId,
      createdAt: d.createdAt.toISOString().slice(0, 10),
      isDemo: d.isDemo,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().documents : [];
  }
}

export async function loadPortalRequests(session: AuthPayload): Promise<PortalRequest[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().requests : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().requests : [];
  try {
    const prisma = getPrisma();
    const rows = await prisma.clientServiceRequest.findMany({
      where: { clientId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    if (!rows.length && profile.isDemo) return demoPortalBundle().requests;
    return rows.map((r) => ({
      id: r.id,
      refNo: r.refNo,
      type: r.type,
      title: r.title,
      status: r.status,
      assignee: r.assignee,
      notes: r.notes,
      lastUpdate: r.lastUpdate,
      createdAt: r.createdAt.toISOString().slice(0, 10),
      timeline: parseTimeline(r.timeline),
      isDemo: r.isDemo,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().requests : [];
  }
}

export async function loadPortalInvoices(session: AuthPayload): Promise<PortalInvoice[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().invoices : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().invoices : [];
  try {
    const prisma = getPrisma();
    const rows = await prisma.financialRecord.findMany({
      where: { clientId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    if (!rows.length && profile.isDemo) return demoPortalBundle().invoices;
    return rows.map((i) => ({
      id: i.id,
      invoiceNo: i.invoiceNo,
      type: i.type,
      amount: i.amount,
      paid: i.paid,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      status: i.status,
      caseRef: i.caseRef,
      notes: i.notes,
      isDemo: i.isDemo,
      collectible: !i.isDemo,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().invoices : [];
  }
}

export async function loadPortalNotifications(session: AuthPayload): Promise<PortalNotification[]> {
  if (!(await tryDb())) {
    return isDemoPortalSession(session) ? demoPortalBundle().notifications : [];
  }
  const profile = await loadPortalProfile(session);
  if (!profile) return isDemoPortalSession(session) ? demoPortalBundle().notifications : [];
  try {
    const prisma = getPrisma();
    const rows = await prisma.clientPortalNotification.findMany({
      where: { clientId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    if (!rows.length && profile.isDemo) return demoPortalBundle().notifications;
    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      href: n.href,
      read: n.read,
      createdAt: n.createdAt.toISOString().slice(0, 10),
      isDemo: n.isDemo,
    }));
  } catch {
    return isDemoPortalSession(session) ? demoPortalBundle().notifications : [];
  }
}

export const SERVICE_REQUEST_TYPES = [
  "طلب استشارة",
  "طلب فتح ملف قضية",
  "طلب متابعة قضية",
  "طلب مراجعة عقد",
  "طلب صياغة مستند قانوني",
  "طلب موعد",
  "طلب خدمة أخرى",
] as const;
