import type { PrismaClient } from "@/generated/prisma/client";

const branches = [
  "القانون العام",
  "القانون الخاص",
  "القانون الجنائي",
  "القانون التجاري",
  "القانون الإداري والمالي",
  "القانون الدستوري",
  "الملكية الفكرية",
  "القانون البيئي",
  "القانون المدني",
];

const specializations = [
  "الأوراق المالية",
  "تطبيقات قضائية",
  "الجرائم الخاصة",
  "حقوق الإنسان",
  "القانون الإداري",
  "قانون العقوبات",
  "قانون المحاكمات الجزائية",
  "القضاء الإداري",
  "المالية العامة والضرائب",
];

const subjects = [
  "حكام الالتزام",
  "أصول المحاكمات المدنية",
  "التشريعات التجارية",
  "حق المؤلف",
  "الشركات والإفلاس",
  "قانون العقوبات",
  "مصادر الالتزام",
  "الملكية الصناعية والتجارية",
];

export type SeedDemoResult = Record<string, number>;

/** Additive demo data — never deletes existing records */
export async function seedDemoData(prisma: PrismaClient): Promise<SeedDemoResult> {
  const result: SeedDemoResult = {};

  let branchRecords = await prisma.legalBranch.findMany({ orderBy: { sortOrder: "asc" } });
  if (branchRecords.length === 0) {
    branchRecords = await Promise.all(
      branches.map((name, i) => prisma.legalBranch.create({ data: { name, sortOrder: i + 1 } }))
    );
    result.legalBranches = branchRecords.length;
  }

  let specRecords = await prisma.legalSpecialization.findMany({ orderBy: { sortOrder: "asc" } });
  if (specRecords.length === 0) {
    specRecords = await Promise.all(
      specializations.map((name, i) =>
        prisma.legalSpecialization.create({
          data: {
            name,
            sortOrder: i + 1,
            branchId: branchRecords[i % branchRecords.length]?.id,
          },
        })
      )
    );
    result.legalSpecializations = specRecords.length;
  }

  let subjectRecords = await prisma.legalSubject.findMany({ orderBy: { sortOrder: "asc" } });
  if (subjectRecords.length === 0) {
    subjectRecords = await Promise.all(
      subjects.map((name, i) => prisma.legalSubject.create({ data: { name, sortOrder: i + 1 } }))
    );
    result.legalSubjects = subjectRecords.length;

    for (let i = 0; i < Math.min(specRecords.length, subjectRecords.length); i++) {
      await prisma.specializationSubject.create({
        data: { specializationId: specRecords[i].id, subjectId: subjectRecords[i].id },
      });
    }
  }

  if ((await prisma.professional.count()) === 0) {
    await prisma.professional.createMany({
      data: [
        { name: "أحمد المحامي", type: "lawyer", licenseNo: "EG-LAW-45821", phone: "01001234567", rating: 4.8, status: "نشط" },
        { name: "د. منى الاستشارية", type: "consultant", licenseNo: "EG-CON-99210", phone: "01009876543", rating: 4.6, status: "نشط" },
        { name: "المستشار محمد رفعت", type: "judge", licenseNo: "EG-JUD-11220", rating: 4.9, status: "نشط" },
      ],
    });
    result.professionals = 3;
  }

  if ((await prisma.officialEntity.count()) === 0) {
    const entity = await prisma.officialEntity.create({
      data: {
        name: "محكمة الاستئناف بالقاهرة",
        type: "محكمة",
        city: "القاهرة",
        address: "باب اللوق، وسط البلد",
        phone: "0223912345",
        status: "نشط",
      },
    });
    await prisma.officialEntity.create({
      data: { name: "المحكمة الإدارية العليا", type: "محكمة إدارية", city: "القاهرة", status: "نشط" },
    });
    const prof = await prisma.professional.findFirst();
    if (prof) {
      await prisma.courtOfficial.create({
        data: {
          entityId: entity.id,
          professionalId: prof.id,
          name: "المستشار محمد رفعت",
          role: "قاضي",
          court: "محكمة الاستئناف بالقاهرة",
          chamber: "الغرفة 7",
          status: "نشط",
        },
      });
    }
    result.officialEntities = 2;
  }

  if ((await prisma.client.count()) === 0) {
    await prisma.client.createMany({
      data: [
        { name: "أحمد محمد الصاوي", type: "فرد", phone: "01001112223", status: "نشط" },
        { name: "شركة النيل للتجارة", type: "شركة", phone: "0225566778", status: "نشط" },
        { name: "سارة إبراهيم المصري", type: "فرد", phone: "01003334445", status: "نشط" },
      ],
    });
    result.clients = 3;
  }

  if ((await prisma.case.count()) === 0) {
    const clients = await prisma.client.findMany({ take: 3 });
    const branch = branchRecords[3] ?? branchRecords[0];
    const spec = specRecords[0];
    if (clients.length && branch && spec) {
      await prisma.case.createMany({
        data: [
          { caseNo: "#2024-0547", clientName: clients[0].name, type: "استئناف تجاري", court: "محكمة الاستئناف القاهرة", status: "نشطة", nextDate: "15 يوليو 2026", fees: "25000", clientId: clients[0].id, branchId: branch.id, specializationId: spec.id },
          { caseNo: "#2024-0548", clientName: clients[1]?.name ?? "شركة النيل", type: "نزاع عقاري", court: "المحكمة الابتدائية الجيزة", status: "نشطة", nextDate: "16 يوليو 2026", fees: "45000", clientId: clients[1]?.id, branchId: branch.id, specializationId: spec.id },
        ],
      });
      result.cases = 2;
    }
  }

  if ((await prisma.officeBranch.count()) === 0) {
    await prisma.officeBranch.createMany({
      data: [
        { name: "المقر الرئيسي — القاهرة", code: "CAI", city: "القاهرة", phone: "0223910000", status: "نشط", isMain: true },
        { name: "فرع الإسكندرية", code: "ALX", city: "الإسكندرية", phone: "0331234567", status: "نشط" },
      ],
    });
    result.officeBranches = 2;
  }

  if ((await prisma.financialRecord.count()) === 0) {
    await prisma.financialRecord.createMany({
      data: [
        { invoiceNo: "INV-2026-001", clientName: "أحمد محمد الصاوي", type: "رسوم قضية", amount: 25000, paid: 15000, issueDate: "2026-01-10", dueDate: "2026-03-10", status: "مسدد جزئياً", caseRef: "#2024-0547" },
        { invoiceNo: "INV-2026-002", clientName: "شركة النيل للتجارة", type: "استشارة قانونية", amount: 18000, paid: 18000, issueDate: "2026-02-05", dueDate: "2026-02-28", status: "مسدد بالكامل", caseRef: "#2024-0548" },
      ],
    });
    result.financialRecords = 2;
  }

  if ((await prisma.feeRule.count()) === 0) {
    await prisma.feeRule.createMany({
      data: [
        { name: "أتعاب تجارية — ابتدائي", caseType: "تجاري", stage: "ابتدائي", hourlyRate: 1500, minAmount: 15000, maxAmount: 80000 },
        { name: "أتعاب جنائية — ثابت", caseType: "جنائي", stage: "جنايات", fixedAmount: 55000 },
      ],
    });
    result.feeRules = 2;
  }

  if ((await prisma.legalDocument.count()) === 0) {
    await prisma.legalDocument.createMany({
      data: [
        { title: "قانون الإثبات في المواد المدنية والتجارية", type: "law", category: "تشريعات", summary: "ينظم قواعد الإثبات أمام المحاكم.", tags: "إثبات,مدني", status: "منشور", publishedAt: "2024-01-01" },
        { title: "نموذج عقد بيع تجاري", type: "contract_template", category: "عقود", summary: "قالب جاهز لعقود البيع التجاري.", tags: "عقد,بيع", status: "منشور", publishedAt: "2025-06-15" },
      ],
    });
    result.legalDocuments = 2;
  }

  if ((await prisma.legalArticle.count()) === 0) {
    await prisma.legalArticle.createMany({
      data: [
        { title: "مبادئ المسؤولية التعاقدية", author: "د. سارة المستشارة", summary: "تحليل للمسؤولية التعاقدية في العقود.", tags: "عقود,تجاري", readMinutes: 8, status: "منشور", publishedAt: "2026-01-15" },
        { title: "الدفوع الشكلية في المحاكم الجنائية", author: "أحمد المحامي", summary: "أهم الدفوع الشكلية ومواعيدها.", tags: "جنائي,دفوع", readMinutes: 6, status: "منشور", publishedAt: "2026-02-20" },
      ],
    });
    result.legalArticles = 2;
  }

  if ((await prisma.circularInstruction.count()) === 0) {
    await prisma.circularInstruction.createMany({
      data: [
        { circularNo: "CIR-2026-01", title: "تعميم بشأن الجلسات الإلكترونية", issuer: "وزارة العدل", issueDate: "2026-01-05", summary: "إجراءات الجلسات عن بُعد.", status: "ساري" },
        { circularNo: "CIR-2026-02", title: "تعليمات الكفالات البنكية", issuer: "نيابة عامة", issueDate: "2026-02-10", summary: "ضوابط تجديد الكفالات.", status: "ساري" },
      ],
    });
    result.circularInstructions = 2;
  }

  if ((await prisma.notificationRule.count()) === 0) {
    await prisma.notificationRule.createMany({
      data: [
        { title: "تذكير الجلسات", trigger: "session_reminder", channel: "email", audience: "lawyers", status: "نشط" },
        { title: "مواعيد السداد", trigger: "payment_due", channel: "sms", audience: "clients", status: "نشط" },
      ],
    });
    result.notificationRules = 2;
  }

  if ((await prisma.integration.count()) === 0) {
    await prisma.integration.createMany({
      data: [
        { name: "Resend Email", type: "email", provider: "resend", status: "متصل" },
        { name: "Twilio SMS", type: "sms", provider: "twilio", status: "متصل" },
      ],
    });
    result.integrations = 2;
  }

  if ((await prisma.approvalRequest.count()) === 0) {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (admin) {
      await prisma.approvalRequest.createMany({
        data: [
          { refNo: "APR-2026-001", title: "اعتماد عقد وكالة", type: "contract_signing", requesterId: admin.id, status: "pending", priority: "عادي", requestedAt: "2026-07-01" },
          { refNo: "APR-2026-002", title: "صرف أتعاب قضية", type: "fee_waiver", requesterId: admin.id, status: "pending", priority: "عاجل", requestedAt: "2026-07-05" },
        ],
      });
      result.approvalRequests = 2;
    }
  }

  if ((await prisma.governancePolicy.count()) === 0) {
    await prisma.governancePolicy.createMany({
      data: [
        { title: "سياسة حماية البيانات", category: "أمن معلومات", version: "1.0", status: "ساري", effectiveDate: "2026-01-01" },
        { title: "سياسة الصلاحيات", category: "حوكمة", version: "2.1", status: "ساري", effectiveDate: "2026-03-01" },
      ],
    });
    result.governancePolicies = 2;
  }

  if ((await prisma.supplyChainPartner.count()) === 0) {
    await prisma.supplyChainPartner.createMany({
      data: [
        { name: "مكتب التوثيق الدولي", type: "notary", country: "مصر", status: "نشط" },
        { name: "شركة الشحن القانوني", type: "logistics", country: "الإمارات", status: "نشط" },
      ],
    });
    result.supplyChainPartners = 2;
  }

  if ((await prisma.naiochBranch.count()) === 0) {
    await prisma.naiochBranch.createMany({
      data: [
        { name: "فرع القاهرة", code: "CAI", city: "القاهرة", country: "مصر", status: "نشط" },
        { name: "فرع دبي", code: "DXB", city: "دبي", country: "الإمارات", status: "نشط" },
      ],
    });
    result.naiochBranches = 2;
  }

  if ((await prisma.legalClassificationEntry.count()) === 0) {
    const demoAxes = [
      { axisSlug: "intl-cross-border", topicSlug: "intl-law", topicName: "القانون الدولي", title: "اتفاقية جنيف الرابعة — دراسة امتثال", jurisdiction: "دولي", country: "سويسرا", category: "معاهدات", status: "نشط", clientName: "مؤسسة الإغاثة الدولية", effectiveDate: "1949-08-12", source: "الأمم المتحدة" },
      { axisSlug: "national-local", topicSlug: "constitution", topicName: "دستور الدولة", title: "مراجعة دستورية — المادة 53", jurisdiction: "محلي", country: "مصر", category: "دستوري", status: "نشط", clientName: "أحمد محمد الصاوي", effectiveDate: "2014-01-18", source: "الجريدة الرسمية" },
      { axisSlug: "commercial-maritime", topicSlug: "maritime-law", topicName: "القانون البحري", title: "نزاع شحن بحري — بضاعة متأخرة", jurisdiction: "بحري", country: "مصر", category: "نقل بحري", status: "نشط", clientName: "شركة الشحن القانوني", effectiveDate: "2026-02-15", source: "هيئة الموانئ" },
      { axisSlug: "labor-safety", topicSlug: "occupational-safety", topicName: "السلامة المهنية", title: "تفتيش سلامة مصنع", jurisdiction: "عمالي", country: "مصر", category: "سلامة", status: "قيد المراجعة", clientName: "مصنع الدلتا", effectiveDate: "2026-05-10", source: "وزارة القوى العاملة" },
      { axisSlug: "contracts-poa", topicSlug: "legal-poa", topicName: "التوكيلات القانونية", title: "توكيل قضائي — قضية تجارية", jurisdiction: "محلي", country: "مصر", category: "توكيل", status: "نشط", clientName: "سارة إبراهيم المصري", effectiveDate: "2026-07-01", source: "كاتب العدل" },
      { axisSlug: "compliance-crimes", topicSlug: "legal-compliance", topicName: "أنظمة الامتثال القانوني", title: "تدقيق امتثال — ISO 37301", jurisdiction: "امتثال", country: "الإمارات", category: "رقابة", status: "نشط", clientName: "شركة الخليج القابضة", effectiveDate: "2026-03-15", source: "ISO" },
    ];
    let n = 0;
    for (const e of demoAxes) {
      n++;
      await prisma.legalClassificationEntry.create({
        data: {
          refNo: `LAW-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`,
          ...e,
          description: `سجل تجريبي — ${e.topicName}`,
        },
      });
    }
    result.legalClassificationEntries = n;
  }

  return result;
}
