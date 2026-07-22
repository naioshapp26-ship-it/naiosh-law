import type { PrismaClient } from "@/generated/prisma/client";
import { neutralizeCountryWording } from "@/lib/neutralize-country-wording";

export type EnrichResult = Record<string, number>;

async function existsCase(prisma: PrismaClient, caseNo: string) {
  return Boolean(await prisma.case.findUnique({ where: { caseNo } }));
}

async function existsInvoice(prisma: PrismaClient, invoiceNo: string) {
  return Boolean(await prisma.financialRecord.findUnique({ where: { invoiceNo } }));
}

async function existsLawRef(prisma: PrismaClient, refNo: string) {
  return Boolean(await prisma.legalClassificationEntry.findUnique({ where: { refNo } }));
}

async function existsArchive(prisma: PrismaClient, refNo: string) {
  return Boolean(await prisma.archiveRecord.findUnique({ where: { refNo } }));
}

async function existsClientByName(prisma: PrismaClient, name: string) {
  return Boolean(await prisma.client.findFirst({ where: { name } }));
}

async function existsCircular(prisma: PrismaClient, circularNo: string) {
  return Boolean(await prisma.circularInstruction.findFirst({ where: { circularNo } }));
}

async function existsApproval(prisma: PrismaClient, refNo: string) {
  return Boolean(await prisma.approvalRequest.findFirst({ where: { refNo } }));
}

/**
 * Additive enrichment only — never deletes or overwrites existing rows.
 * Inserts missing demo/legal operational data by unique keys.
 */
export async function enrichDemoData(prisma: PrismaClient): Promise<EnrichResult> {
  const result: EnrichResult = {};
  let n = 0;

  // ── Clients (by name) ──
  const newClients = [
    { name: "بنك القاهرة الدولي", type: "شركة", phone: "0223944556", email: "legal@cairobank.eg", status: "نشط", notes: "موكل مؤسسي — قضايا مصرفية" },
    { name: "مؤسسة الريادة العقارية", type: "شركة", phone: "01005556667", email: "ops@reyada.eg", status: "نشط", notes: "نزاعات عقارية وتوثيق" },
    { name: "خالد عبدالرحمن السعيد", type: "فرد", phone: "01007778889", status: "نشط", notes: "دعوى مدنية — تعويض" },
    { name: "شركة أفق الشحن البحري", type: "شركة", phone: "0334455667", status: "نشط", notes: "قضايا بحرية ووكالات" },
  ];
  n = 0;
  for (const c of newClients) {
    if (await existsClientByName(prisma, c.name)) continue;
    await prisma.client.create({ data: c });
    n++;
  }
  if (n) result.clients = n;

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });
  const branch = await prisma.legalBranch.findFirst({ orderBy: { sortOrder: "asc" } });
  const spec = await prisma.legalSpecialization.findFirst({ orderBy: { sortOrder: "asc" } });

  // ── Cases (by caseNo) ──
  const newCases = [
    {
      caseNo: "#2026-1001",
      clientName: "بنك القاهرة الدولي",
      type: "نزاع مصرفي",
      court: "المحكمة الاقتصادية بالقاهرة",
      status: "نشطة",
      nextDate: "20 يوليو 2026",
      fees: "85000",
      notes: "مطالبة بسداد تسهيلات ائتمانية",
    },
    {
      caseNo: "#2026-1002",
      clientName: "مؤسسة الريادة العقارية",
      type: "نزاع عقاري",
      court: "محكمة الجيزة الابتدائية",
      status: "نشطة",
      nextDate: "22 يوليو 2026",
      fees: "42000",
      notes: "فسخ عقد بيع وتسليم وحدة",
    },
    {
      caseNo: "#2026-1003",
      clientName: "خالد عبدالرحمن السعيد",
      type: "تعويض مدني",
      court: "محكمة شمال القاهرة",
      status: "معلقة",
      nextDate: "28 يوليو 2026",
      fees: "18000",
      notes: "دعوى تعويض عن ضرر تعاقدي",
    },
    {
      caseNo: "#2026-1004",
      clientName: "شركة أفق الشحن البحري",
      type: "بحري / شحن",
      court: "محكمة الإسكندرية الابتدائية — دائرة بحرية",
      status: "نشطة",
      nextDate: "25 يوليو 2026",
      fees: "110000",
      notes: "تأخر بضاعة وتلف جزئي في الشحنة",
    },
  ];
  n = 0;
  for (const c of newCases) {
    if (await existsCase(prisma, c.caseNo)) continue;
    const client = clients.find((x) => x.name === c.clientName);
    await prisma.case.create({
      data: {
        ...c,
        clientId: client?.id,
        branchId: branch?.id,
        specializationId: spec?.id,
      },
    });
    n++;
  }
  if (n) result.cases = n;

  const cases = await prisma.case.findMany({ orderBy: { createdAt: "asc" } });

  // ── Court sessions (additive: unique caseNo+date+time) ──
  const sessionSeeds = [
    { caseNo: "#2024-0547", date: "15 يوليو 2026", time: "10:30", type: "مرافعة", status: "مجدولة", court: "محكمة الاستئناف القاهرة", room: "الغرفة 7", lawyer: "أحمد المحامي", notes: "جلسة استئناف — تقديم مذكرة" },
    { caseNo: "#2024-0548", date: "16 يوليو 2026", time: "12:00", type: "تأجيل", status: "مجدولة", court: "المحكمة الابتدائية الجيزة", room: "دائرة 3", lawyer: "أحمد المحامي", notes: "استكمال المستندات" },
    { caseNo: "#2026-1001", date: "20 يوليو 2026", time: "11:00", type: "مرافعة", status: "مجدولة", court: "المحكمة الاقتصادية بالقاهرة", room: "دائرة 5", lawyer: "د. منى الاستشارية", notes: "رد البنك على المذكرة" },
    { caseNo: "#2026-1002", date: "22 يوليو 2026", time: "09:30", type: "معاينة", status: "مجدولة", court: "محكمة الجيزة الابتدائية", room: "دائرة عقارية", lawyer: "أحمد المحامي", notes: "معاينة الموقع محل النزاع" },
    { caseNo: "#2026-1003", date: "28 يوليو 2026", time: "13:00", type: "تحكيم", status: "مجدولة", court: "محكمة شمال القاهرة", room: "دائرة 2", lawyer: "د. منى الاستشارية", notes: "سماع شهود" },
    { caseNo: "#2026-1004", date: "25 يوليو 2026", time: "10:00", type: "مرافعة", status: "قريبة", court: "محكمة الإسكندرية الابتدائية", room: "دائرة بحرية", lawyer: "أحمد المحامي", notes: "تقرير معاينة الشحنة" },
    { caseNo: "#2026-1001", date: "05 أغسطس 2026", time: "11:30", type: "حكم", status: "مجدولة", court: "المحكمة الاقتصادية بالقاهرة", room: "دائرة 5", lawyer: "د. منى الاستشارية", notes: "جلسة حجز للحكم" },
  ];
  n = 0;
  for (const s of sessionSeeds) {
    const linked = cases.find((c) => c.caseNo === s.caseNo);
    const already = await prisma.courtSession.findFirst({
      where: { caseNo: s.caseNo, date: s.date, time: s.time },
    });
    if (already) continue;
    await prisma.courtSession.create({
      data: {
        ...s,
        caseId: linked?.id,
        client: linked?.clientName ?? s.caseNo,
      },
    });
    n++;
  }
  if (n) result.courtSessions = n;

  // ── Consultations ──
  const consultSeeds = [
    { clientName: "بنك القاهرة الدولي", topic: "استشارة امتثال مصرفي — تغطية ضمانات", status: "جارٍ", lawyer: "د. منى الاستشارية", date: "2026-07-12", fees: "12000" },
    { clientName: "مؤسسة الريادة العقارية", topic: "مراجعة عقد بيع وحدات — مخاطر قانونية", status: "جديد", lawyer: "أحمد المحامي", date: "2026-07-14", fees: "8000" },
    { clientName: "شركة أفق الشحن البحري", topic: "تقدير مسؤولية الشاحن وفق اتفاقية هامبورغ", status: "مكتمل", lawyer: "أحمد المحامي", date: "2026-07-08", fees: "15000" },
  ];
  n = 0;
  for (const c of consultSeeds) {
    const exists = await prisma.consultation.findFirst({
      where: { clientName: c.clientName, topic: c.topic },
    });
    if (exists) continue;
    await prisma.consultation.create({
      data: {
        ...c,
        branchId: branch?.id,
        specializationId: spec?.id,
        notes: "استشارة تشغيلية مضافة لخدمة النظام",
      },
    });
    n++;
  }
  if (n) result.consultations = n;

  // ── Financial invoices (by invoiceNo) ──
  const invoices = [
    { invoiceNo: "INV-2026-0101", clientName: "بنك القاهرة الدولي", type: "أتعاب قضية", amount: 85000, paid: 40000, issueDate: "2026-06-01", dueDate: "2026-08-01", status: "جزئي", caseRef: "#2026-1001" },
    { invoiceNo: "INV-2026-0102", clientName: "مؤسسة الريادة العقارية", type: "استشارة قانونية", amount: 8000, paid: 8000, issueDate: "2026-07-01", dueDate: "2026-07-15", status: "مسدد", caseRef: "#2026-1002" },
    { invoiceNo: "INV-2026-0103", clientName: "خالد عبدالرحمن السعيد", type: "أتعاب قضية", amount: 18000, paid: 0, issueDate: "2026-07-05", dueDate: "2026-08-05", status: "غير مسدد", caseRef: "#2026-1003" },
    { invoiceNo: "INV-2026-0104", clientName: "شركة أفق الشحن البحري", type: "أتعاب بحرية", amount: 110000, paid: 55000, issueDate: "2026-06-20", dueDate: "2026-09-01", status: "جزئي", caseRef: "#2026-1004" },
  ];
  n = 0;
  for (const inv of invoices) {
    if (await existsInvoice(prisma, inv.invoiceNo)) continue;
    await prisma.financialRecord.create({ data: inv });
    n++;
  }
  if (n) result.financialRecords = n;

  // ── Legal classification with parties (new refs only) ──
  const lawEntries = [
    {
      refNo: "LAW-2026-0201",
      axisSlug: "intl-cross-border",
      topicSlug: "intl-disputes",
      topicName: "النزاعات الدولية",
      title: "تحكيم تجاري دولي — تأخير توريد معدات",
      jurisdiction: "دولي",
      country: "الإمارات",
      category: "تحكيم",
      status: "نشط",
      clientName: "شركة الخليج القابضة",
      firstParty: "شركة الخليج القابضة",
      firstPartyPhone: "0501234567",
      secondParty: "مصنع أوروبا للمعدات",
      secondPartyPhone: "+491701234567",
      effectiveDate: "2026-03-01",
      source: "ICC Arbitration",
      description: "نزاع توريد عبر الحدود مع شرط تحكيم دولي.",
    },
    {
      refNo: "LAW-2026-0202",
      axisSlug: "national-local",
      topicSlug: "local-disputes",
      topicName: "النزاعات المحلية",
      title: "نزاع إيجار تجاري — مركز أعمال وسط البلد",
      jurisdiction: "محلي",
      country: "مصر",
      category: "إيجار",
      status: "نشط",
      clientName: "مؤسسة الريادة العقارية",
      firstParty: "مؤسسة الريادة العقارية",
      firstPartyPhone: "01005556667",
      secondParty: "شركة الأفق للإدارة",
      secondPartyPhone: "01008889990",
      effectiveDate: "2026-05-12",
      source: "عقد إيجار موثق",
      description: "مطالبة بفسخ عقد وإخلاء وحدات.",
    },
    {
      refNo: "LAW-2026-0203",
      axisSlug: "commercial-maritime",
      topicSlug: "maritime-law",
      topicName: "القانون البحري",
      title: "مطالبة تعويض عن تلف شحنة حاويات",
      jurisdiction: "بحري",
      country: "مصر",
      category: "شحن بحري",
      status: "قيد المراجعة",
      clientName: "شركة أفق الشحن البحري",
      firstParty: "شركة أفق الشحن البحري",
      firstPartyPhone: "0334455667",
      secondParty: "موانئ البحر الأحمر",
      secondPartyPhone: "0651234567",
      effectiveDate: "2026-06-18",
      source: "بوليصة شحن",
      description: "تلف جزئي لحاويتين أثناء التفريغ.",
    },
    {
      refNo: "LAW-2026-0204",
      axisSlug: "labor-safety",
      topicSlug: "occupational-safety",
      topicName: "السلامة المهنية",
      title: "فصل تعسفي — مطالبة تعويضات عمالية",
      jurisdiction: "عمالي",
      country: "مصر",
      category: "عمالي",
      status: "نشط",
      clientName: "خالد عبدالرحمن السعيد",
      firstParty: "خالد عبدالرحمن السعيد",
      firstPartyPhone: "01007778889",
      secondParty: "مصنع الدلتا للصناعات",
      secondPartyPhone: "01002223334",
      effectiveDate: "2026-04-02",
      source: "مكتب العمل",
      description: "دعوى عمالية بطلب تعويض عن فصل دون سبب مشروع.",
    },
    {
      refNo: "LAW-2026-0205",
      axisSlug: "contracts-poa",
      topicSlug: "legal-poa",
      topicName: "التوكيلات القانونية",
      title: "توكيل قضائي شامل — تمثيل أمام المحاكم",
      jurisdiction: "محلي",
      country: "مصر",
      category: "توكيل",
      status: "نشط",
      clientName: "بنك القاهرة الدولي",
      firstParty: "بنك القاهرة الدولي",
      firstPartyPhone: "0223944556",
      secondParty: "مكتب نايوش للمحاماة",
      secondPartyPhone: "0223910000",
      effectiveDate: "2026-07-01",
      source: "كاتب العدل",
      description: "توكيل بالتقاضي في النزاعات المصرفية.",
    },
    {
      refNo: "LAW-2026-0206",
      axisSlug: "compliance-crimes",
      topicSlug: "cyber-crimes",
      topicName: "قانون الجرائم الإلكترونية",
      title: "تحقيق في اختراق بيانات عملاء",
      jurisdiction: "جنائي / تقني",
      country: "مصر",
      category: "سيبراني",
      status: "قيد المراجعة",
      clientName: "بنك القاهرة الدولي",
      firstParty: "بنك القاهرة الدولي",
      firstPartyPhone: "0223944556",
      secondParty: "جهة تحقيق سيبراني",
      secondPartyPhone: "01200001111",
      effectiveDate: "2026-07-10",
      source: "بلاغ رسمي",
      description: "متابعة تحقيق بشأن محاولة اختراق أنظمة العملاء.",
    },
  ];
  n = 0;
  for (const e of lawEntries) {
    if (await existsLawRef(prisma, e.refNo)) continue;
    await prisma.legalClassificationEntry.create({
      data: {
        ...e,
        notes: "سجل قانوني تشغيلي — مُضاف لتعزيز بيانات النظام",
      },
    });
    n++;
  }
  if (n) result.legalClassificationEntries = n;

  // ── Archive snapshots (new refs only) ──
  const archives = [
    {
      refNo: "ARC-2026-0101",
      title: "أرشيف قضية استئناف تجاري — مرحلية",
      sourceModule: "case-management",
      sourceModuleLabel: "إدارة القضايا",
      sourceRef: "#2024-0547",
      category: "قضايا",
      firstParty: "أحمد محمد الصاوي",
      secondParty: "شركة النيل للتجارة",
    },
    {
      refNo: "ARC-2026-0102",
      title: "أرشيف توكيل قضائي — بنك القاهرة",
      sourceModule: "legal-classification",
      sourceModuleLabel: "القوانين الدولية والتصنيف",
      sourceRef: "LAW-2026-0205",
      category: "توكيلات",
      firstParty: "بنك القاهرة الدولي",
      secondParty: "مكتب نايوش للمحاماة",
    },
    {
      refNo: "ARC-2026-0103",
      title: "أرشيف جلسة معاينة عقارية",
      sourceModule: "court-sessions",
      sourceModuleLabel: "الجلسات والمتابعات",
      sourceRef: "#2026-1002",
      category: "جلسات",
      firstParty: "مؤسسة الريادة العقارية",
      secondParty: "شركة الأفق للإدارة",
    },
  ];
  n = 0;
  for (const a of archives) {
    if (await existsArchive(prisma, a.refNo)) continue;
    const notes = `طرف أول: ${a.firstParty}\nطرف ثاني: ${a.secondParty}`;
    await prisma.archiveRecord.create({
      data: {
        refNo: a.refNo,
        title: a.title,
        description: "نسخة أرشيفية تشغيلية — بيانات خدمة النظام",
        sourceModule: a.sourceModule,
        sourceModuleLabel: a.sourceModuleLabel,
        sourceRef: a.sourceRef,
        category: a.category,
        status: "مؤرشف",
        archivedBy: "نظام التعبئة",
        notes,
        recordData: JSON.stringify(a),
        tags: "خدمة,قانوني,تشغيل",
      },
    });
    // store parties separately without touching other records
    const created = await prisma.archiveRecord.findUnique({ where: { refNo: a.refNo } });
    if (created) {
      await prisma.recordParty.upsert({
        where: { sourceModule_sourceId: { sourceModule: "archive", sourceId: created.id } },
        create: {
          sourceModule: "archive",
          sourceId: created.id,
          sourceRef: a.refNo,
          firstParty: a.firstParty,
          firstPartyPhone: "01000000000",
          secondParty: a.secondParty,
          secondPartyPhone: "01000000001",
          updatedBy: "نظام التعبئة",
        },
        update: {},
      });
    }
    n++;
  }
  if (n) result.archiveRecords = n;

  // ── Circular instructions (by circularNo) ──
  const circulars = [
    { circularNo: "CIR-2026-10", title: "تعميم مواعيد الجلسات الصيفية", issuer: "وزارة العدل", issueDate: "2026-06-15", summary: "تنظيم جداول الجلسات خلال يوليو-أغسطس.", status: "ساري" },
    { circularNo: "CIR-2026-11", title: "ضوابط التوكيلات الإلكترونية", issuer: "وزارة العدل", issueDate: "2026-07-01", summary: "اعتماد التوكيلات الرقمية للمحامين.", status: "ساري" },
  ];
  n = 0;
  for (const c of circulars) {
    if (await existsCircular(prisma, c.circularNo)) continue;
    await prisma.circularInstruction.create({ data: c });
    n++;
  }
  if (n) result.circularInstructions = n;

  // ── Legal docs / articles (by title) — بدون تخصيص لدولة ──
  const docs = [
    { title: "دليل التحكيم التجاري", type: "other" as const, category: "تحكيم", summary: "مرجع إجرائي للتحكيم المحلي والدولي.", tags: "تحكيم,تجاري", status: "منشور", publishedAt: "2026-04-01" },
    { title: "نموذج مذكرة دفاع — نزاع إيجار", type: "memo_template" as const, category: "مذكرات", summary: "قالب مذكرة دفاع لدعوى إيجار تجاري.", tags: "إيجار,مذكرة", status: "منشور", publishedAt: "2026-05-20" },
  ];
  n = 0;
  for (const d of docs) {
    const exists = await prisma.legalDocument.findFirst({ where: { title: d.title } });
    if (exists) continue;
    await prisma.legalDocument.create({ data: d });
    n++;
  }
  if (n) result.legalDocuments = n;

  const articles = [
    { title: "قواعد الاختصاص في المنازعات البحرية", author: "أحمد المحامي", summary: "تحليل اختصاص المحاكم البحرية في المنازعات التجارية.", tags: "بحري,اختصاص", readMinutes: 9, status: "منشور", publishedAt: "2026-06-12" },
    { title: "حماية البيانات في القطاع المصرفي", author: "د. منى الاستشارية", summary: "امتثال البنوك لقوانين حماية البيانات.", tags: "بنوك,خصوصية", readMinutes: 7, status: "منشور", publishedAt: "2026-07-01" },
  ];
  n = 0;
  for (const a of articles) {
    const exists = await prisma.legalArticle.findFirst({ where: { title: a.title } });
    if (exists) continue;
    await prisma.legalArticle.create({ data: a });
    n++;
  }
  if (n) result.legalArticles = n;

  // Rename legacy country-specific library titles already in DB
  const renamedDocs = await prisma.legalDocument.updateMany({
    where: { title: "دليل التحكيم التجاري المصري" },
    data: { title: "دليل التحكيم التجاري" },
  });
  if (renamedDocs.count) result.neutralizedDocuments = renamedDocs.count;

  n = 0;
  const libraryDocs = await prisma.legalDocument.findMany({ select: { id: true, title: true, summary: true } });
  for (const d of libraryDocs) {
    const title = neutralizeCountryWording(d.title);
    const summary = d.summary ? neutralizeCountryWording(d.summary) : d.summary;
    if (title === d.title && summary === d.summary) continue;
    await prisma.legalDocument.update({ where: { id: d.id }, data: { title, summary } });
    n++;
  }
  const libraryArticles = await prisma.legalArticle.findMany({ select: { id: true, title: true, summary: true } });
  for (const a of libraryArticles) {
    const title = neutralizeCountryWording(a.title);
    const summary = a.summary ? neutralizeCountryWording(a.summary) : a.summary;
    if (title === a.title && summary === a.summary) continue;
    await prisma.legalArticle.update({ where: { id: a.id }, data: { title, summary } });
    n++;
  }
  if (n) result.neutralizedLibraryCopy = n;

  // ── Approvals (by refNo) ──
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    const approvals = [
      { refNo: "APR-2026-0101", title: "اعتماد مذكرة استئناف — #2026-1001", type: "contract_signing" as const, requesterId: admin.id, status: "pending" as const, priority: "عاجل", requestedAt: "2026-07-13" },
      { refNo: "APR-2026-0102", title: "موافقة صرف أتعاب بحرية — #2026-1004", type: "fee_waiver" as const, requesterId: admin.id, status: "pending" as const, priority: "عادي", requestedAt: "2026-07-14" },
    ];
    n = 0;
    for (const a of approvals) {
      if (await existsApproval(prisma, a.refNo)) continue;
      await prisma.approvalRequest.create({ data: a });
      n++;
    }
    if (n) result.approvalRequests = n;
  }

  // ── Fee rules (by name) ──
  const fees = [
    { name: "أتعاب بحرية — مرافعة", caseType: "بحري", stage: "ابتدائي", hourlyRate: 2200, minAmount: 30000, maxAmount: 150000 },
    { name: "أتعاب مصرفية — تحكيم", caseType: "مصرفي", stage: "تحكيم", fixedAmount: 95000 },
  ];
  n = 0;
  for (const f of fees) {
    const exists = await prisma.feeRule.findFirst({ where: { name: f.name } });
    if (exists) continue;
    await prisma.feeRule.create({ data: f });
    n++;
  }
  if (n) result.feeRules = n;

  // ── Record parties for newly added classification entries (idempotent upsert only when empty?) ──
  // Use upsert with update: {} so we don't overwrite existing party data
  const partyTargets = await prisma.legalClassificationEntry.findMany({
    where: { refNo: { in: lawEntries.map((e) => e.refNo) } },
  });
  n = 0;
  for (const entry of partyTargets) {
    const seed = lawEntries.find((e) => e.refNo === entry.refNo);
    if (!seed) continue;
    const existing = await prisma.recordParty.findUnique({
      where: { sourceModule_sourceId: { sourceModule: "legal-classification", sourceId: entry.id } },
    });
    if (existing) continue;
    await prisma.recordParty.create({
      data: {
        sourceModule: "legal-classification",
        sourceId: entry.id,
        sourceRef: entry.refNo,
        firstParty: seed.firstParty,
        firstPartyPhone: seed.firstPartyPhone,
        secondParty: seed.secondParty,
        secondPartyPhone: seed.secondPartyPhone,
        updatedBy: "نظام التعبئة",
      },
    });
    n++;
  }
  if (n) result.recordParties = n;

  return result;
}
