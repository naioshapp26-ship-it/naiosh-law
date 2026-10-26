import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import {
  DEMO_CLIENT_EMAIL,
  DEMO_CLIENT_ID,
  demoPortalBundle,
} from "@/lib/client-portal";

/**
 * Ensures isolated demo client user + labeled fake data exist.
 * Password comes from DEMO_CLIENT_PASSWORD env (never shipped to the browser).
 * Safe to call repeatedly (additive / upsert by unique keys).
 */
export async function ensureDemoClientPortal() {
  const prisma = getPrisma();
  const passwordPlain =
    process.env.DEMO_CLIENT_PASSWORD?.trim() ||
    (process.env.NODE_ENV === "production" ? null : "Client@123");

  if (!passwordPlain) {
    throw new Error("DEMO_CLIENT_PASSWORD غير مضبوط على بيئة الإنتاج");
  }

  const hash = await bcrypt.hash(passwordPlain, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_CLIENT_EMAIL },
    update: {
      name: "عميل تجريبي",
      role: "client",
      active: true,
      phone: "+966500000001",
    },
    create: {
      email: DEMO_CLIENT_EMAIL,
      password: hash,
      name: "عميل تجريبي",
      role: "client",
      phone: "+966500000001",
      active: true,
    },
  });

  // Refresh password hash when env password is provided (keeps demo login working)
  if (process.env.DEMO_CLIENT_PASSWORD?.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });
  }

  const bundle = demoPortalBundle();

  const client = await prisma.client.upsert({
    where: { id: DEMO_CLIENT_ID },
    update: {
      userId: user.id,
      name: bundle.profile.name,
      email: DEMO_CLIENT_EMAIL,
      phone: bundle.profile.phone,
      type: bundle.profile.type,
      isDemo: true,
      profileComplete: true,
      country: bundle.profile.country,
      city: bundle.profile.city,
      address: bundle.profile.address,
      internalNo: bundle.profile.internalNo,
      linkedOffice: bundle.profile.linkedOffice,
      lawyerName: bundle.profile.lawyerName,
      preferredLanguage: "ar",
      status: "نشط",
      casesCount: bundle.cases.length,
      notes: "حساب تجريبي معزول — بيانات وهمية للعرض فقط",
    },
    create: {
      id: DEMO_CLIENT_ID,
      userId: user.id,
      name: bundle.profile.name,
      email: DEMO_CLIENT_EMAIL,
      phone: bundle.profile.phone,
      type: bundle.profile.type,
      isDemo: true,
      profileComplete: true,
      country: bundle.profile.country,
      city: bundle.profile.city,
      address: bundle.profile.address,
      internalNo: bundle.profile.internalNo,
      linkedOffice: bundle.profile.linkedOffice,
      lawyerName: bundle.profile.lawyerName,
      preferredLanguage: "ar",
      status: "نشط",
      casesCount: bundle.cases.length,
      notes: "حساب تجريبي معزول — بيانات وهمية للعرض فقط",
    },
  });

  for (const c of bundle.cases) {
    await prisma.case.upsert({
      where: { caseNo: c.caseNo },
      update: {
        clientId: client.id,
        clientName: client.name,
        type: c.type,
        court: c.court,
        status: c.status,
        nextDate: c.nextDate,
        notes: `[تجريبي] ${c.title}`,
      },
      create: {
        id: c.id,
        caseNo: c.caseNo,
        clientId: client.id,
        clientName: client.name,
        type: c.type,
        court: c.court,
        status: c.status,
        nextDate: c.nextDate,
        notes: `[تجريبي] ${c.title}`,
      },
    });
  }

  for (const s of bundle.sessions) {
    const existing = await prisma.courtSession.findFirst({
      where: { caseNo: s.caseNo, date: s.date, court: s.court },
    });
    if (existing) {
      await prisma.courtSession.update({
        where: { id: existing.id },
        data: {
          client: client.name,
          room: s.room,
          time: s.time,
          type: s.type,
          status: s.status,
          lawyer: s.lawyer,
          notes: s.notes,
        },
      });
    } else {
      await prisma.courtSession.create({
        data: {
          id: s.id,
          caseNo: s.caseNo,
          client: client.name,
          court: s.court,
          room: s.room,
          date: s.date,
          time: s.time,
          type: s.type,
          status: s.status,
          lawyer: s.lawyer,
          notes: s.notes,
        },
      });
    }
  }

  for (const d of bundle.documents) {
    const existing = await prisma.clientPortalDocument.findFirst({
      where: { clientId: client.id, title: d.title, isDemo: true },
    });
    if (!existing) {
      await prisma.clientPortalDocument.create({
        data: {
          id: d.id,
          clientId: client.id,
          caseId: d.caseId,
          title: d.title,
          category: d.category,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          status: d.status,
          isDemo: true,
        },
      });
    }
  }

  for (const r of bundle.requests) {
    await prisma.clientServiceRequest.upsert({
      where: { refNo: r.refNo },
      update: {
        clientId: client.id,
        type: r.type,
        title: r.title,
        status: r.status,
        assignee: r.assignee,
        notes: r.notes,
        lastUpdate: r.lastUpdate,
        timeline: JSON.stringify(r.timeline),
        isDemo: true,
      },
      create: {
        id: r.id,
        clientId: client.id,
        refNo: r.refNo,
        type: r.type,
        title: r.title,
        status: r.status,
        assignee: r.assignee,
        notes: r.notes,
        lastUpdate: r.lastUpdate,
        timeline: JSON.stringify(r.timeline),
        isDemo: true,
      },
    });
  }

  for (const inv of bundle.invoices) {
    await prisma.financialRecord.upsert({
      where: { invoiceNo: inv.invoiceNo },
      update: {
        clientId: client.id,
        clientName: client.name,
        type: inv.type,
        amount: inv.amount,
        paid: inv.paid,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        caseRef: inv.caseRef,
        notes: inv.notes,
        isDemo: true,
      },
      create: {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        clientId: client.id,
        clientName: client.name,
        type: inv.type,
        amount: inv.amount,
        paid: inv.paid,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        caseRef: inv.caseRef,
        notes: inv.notes,
        isDemo: true,
      },
    });
  }

  for (const n of bundle.notifications) {
    const existing = await prisma.clientPortalNotification.findFirst({
      where: { clientId: client.id, title: n.title, isDemo: true },
    });
    if (!existing) {
      await prisma.clientPortalNotification.create({
        data: {
          id: n.id,
          clientId: client.id,
          title: n.title,
          body: n.body,
          category: n.category,
          href: n.href,
          read: n.read,
          isDemo: true,
        },
      });
    }
  }

  return { user, client };
}
