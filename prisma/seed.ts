import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  "الجرائم الواقعة على أمن الدولة",
  "حقوق الإنسان",
  "الحقوق والحريات العامة",
  "العقود الإدارية",
  "علم الجرائم",
  "قانون الإدارة المحلية",
  "القانون الإداري",
  "القانون البيئي",
  "قانون التنظيم الدولي",
  "القانون الدولي الإنساني",
  "القانون الدولي الجنائي",
  "القانون الدولي العام",
  "القانون الدولي للبحار",
  "قانون العقوبات",
  "قانون المحاكمات الجزائية",
  "القضاء الإداري",
  "المالية العامة والضرائب",
  "النظام الدستوري",
  "النظم السياسية والقانون الدستوري",
  "الوظيفة العامة",
];

const subjects = [
  "حكام الالتزام",
  "أصول المحاكمات المدنية",
  "التشريعات التجارية",
  "حق المؤلف",
  "الحقوق العينية",
  "حقوق الملكية الفكرية",
  "الشركات والإفلاس",
  "عقود التأمين",
  "العقود التجارية",
  "العقود المسماة",
  "قانون التجارة الدولية",
  "قانون الجنسية والأجانب",
  "القانون الدولي الخاص",
  "قانون العقوبات",
  "قانون النقل",
  "القوانين الاجتماعية",
  "مبادئ القانون التجاري",
  "مدخل إلى علم القانون",
  "مصادر الالتزام",
  "الملكية الصناعية والتجارية",
];

async function main() {
  console.log("🌱 Seeding Naiosh Law database...");

  await prisma.auditLog.deleteMany();
  await prisma.circularAlert.deleteMany();
  await prisma.supplyChainShipment.deleteMany();
  await prisma.supplyChainPartner.deleteMany();
  await prisma.internationalLawMatter.deleteMany();
  await prisma.naiochBranch.deleteMany();
  await prisma.eSignature.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.governancePolicy.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.notificationRule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.bailGuarantee.deleteMany();
  await prisma.personalGuarantee.deleteMany();
  await prisma.officialNotification.deleteMany();
  await prisma.feeRule.deleteMany();
  await prisma.circularInstruction.deleteMany();
  await prisma.legalArticle.deleteMany();
  await prisma.legalDocument.deleteMany();
  await prisma.professionalNetwork.deleteMany();
  await prisma.caseSubject.deleteMany();
  await prisma.specializationSubject.deleteMany();
  await prisma.lawyerSpecialization.deleteMany();
  await prisma.courtOfficial.deleteMany();
  await prisma.courtSession.deleteMany();
  await prisma.case.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.legalSpecialization.deleteMany();
  await prisma.legalSubject.deleteMany();
  await prisma.legalBranch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.officeBranch.deleteMany();

  const hash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@naioshlaw.com",
      password: hash,
      name: "مدير النظام",
      role: "admin",
    },
  });

  const lawyer = await prisma.user.create({
    data: {
      email: "lawyer@naioshlaw.com",
      password: await bcrypt.hash("Lawyer@123", 10),
      name: "أحمد المحامي",
      role: "lawyer",
    },
  });

  // Phase 5 — Office branches (must be created before assigning users)
  const mainBranch = await prisma.officeBranch.create({
    data: {
      name: "المقر الرئيسي — القاهرة",
      code: "CAI",
      city: "القاهرة",
      address: "وسط البلد، شارع رمسيس",
      phone: "0223910000",
      email: "cairo@naioshlaw.com",
      managerName: "مدير النظام",
      status: "نشط",
      isMain: true,
    },
  });

  const alexBranch = await prisma.officeBranch.create({
    data: {
      name: "فرع الإسكندرية",
      code: "ALX",
      city: "الإسكندرية",
      address: "سموحة",
      phone: "0331234567",
      email: "alex@naioshlaw.com",
      managerName: "محمد الفرع",
      status: "نشط",
    },
  });

  await prisma.officeBranch.create({
    data: {
      name: "فرع الجيزة",
      code: "GIZ",
      city: "الجيزة",
      phone: "0235678901",
      email: "giza@naioshlaw.com",
      status: "نشط",
    },
  });

  await prisma.user.update({
    where: { id: admin.id },
    data: { officeBranchId: mainBranch.id },
  });

  await prisma.user.update({
    where: { id: lawyer.id },
    data: { officeBranchId: mainBranch.id },
  });

  await prisma.user.create({
    data: {
      email: "client@naioshlaw.com",
      password: await bcrypt.hash("Client@123", 10),
      name: "عميل تجريبي",
      role: "client",
    },
  });

  await prisma.user.create({
    data: {
      email: "consultant@naioshlaw.com",
      password: await bcrypt.hash("Consult@123", 10),
      name: "د. سارة المستشارة",
      role: "consultant",
    },
  });

  const industrialAgent = await prisma.user.create({
    data: {
      email: "agent@naioshlaw.com",
      password: await bcrypt.hash("Agent@123", 10),
      name: "م. خالد الوكيل الصناعي",
      role: "industrial_agent",
    },
  });

  const branchRecords = await Promise.all(
    branches.map((name, i) =>
      prisma.legalBranch.create({ data: { name, sortOrder: i + 1 } })
    )
  );

  const specRecords = await Promise.all(
    specializations.map((name, i) =>
      prisma.legalSpecialization.create({
        data: {
          name,
          sortOrder: i + 1,
          branchId: branchRecords[i % branchRecords.length].id,
        },
      })
    )
  );

  const subjectRecords = await Promise.all(
    subjects.map((name, i) =>
      prisma.legalSubject.create({ data: { name, sortOrder: i + 1 } })
    )
  );

  // Link some subjects to specializations
  for (let i = 0; i < Math.min(specRecords.length, subjectRecords.length); i++) {
    await prisma.specializationSubject.create({
      data: {
        specializationId: specRecords[i].id,
        subjectId: subjectRecords[i].id,
      },
    });
  }

  const prof = await prisma.professional.create({
    data: {
      userId: lawyer.id,
      name: "أحمد المحامي",
      type: "lawyer",
      licenseNo: "EG-LAW-45821",
      phone: "01001234567",
      email: "lawyer@naioshlaw.com",
      rating: 4.8,
      status: "نشط",
      specializations: {
        create: [{ specializationId: specRecords[0].id }, { specializationId: specRecords[16].id }],
      },
    },
  });

  await prisma.professional.create({
    data: {
      name: "د. منى الاستشارية",
      type: "consultant",
      licenseNo: "EG-CON-99210",
      phone: "01009876543",
      rating: 4.6,
      status: "نشط",
    },
  });

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

  await prisma.officialEntity.create({
    data: {
      name: "المحكمة الإدارية العليا",
      type: "محكمة إدارية",
      city: "القاهرة",
      status: "نشط",
    },
  });

  const clientsData = [
    { name: "أحمد محمد الصاوي", type: "فرد", phone: "01001112223", status: "نشط" },
    { name: "شركة النيل للتجارة", type: "شركة", phone: "0225566778", status: "نشط" },
    { name: "سارة إبراهيم المصري", type: "فرد", phone: "01003334445", status: "نشط" },
    { name: "مجموعة الدلتا الصناعية", type: "شركة", phone: "0401234567", status: "نشط" },
    { name: "خالد عبد الرحمن عمر", type: "فرد", phone: "01005556667", status: "نشط" },
  ];

  const clientRecords = await Promise.all(
    clientsData.map((c) => prisma.client.create({ data: c }))
  );

  const casesData = [
    { caseNo: "#2024-0547", clientName: "أحمد محمد الصاوي", type: "استئناف تجاري", court: "محكمة الاستئناف القاهرة", status: "نشطة", nextDate: "15 يوليو 2026", fees: "25000", clientId: clientRecords[0].id },
    { caseNo: "#2024-0548", clientName: "شركة النيل للتجارة", type: "نزاع عقاري", court: "المحكمة الابتدائية الجيزة", status: "نشطة", nextDate: "16 يوليو 2026", fees: "45000", clientId: clientRecords[1].id },
    { caseNo: "#2024-0312", clientName: "سارة إبراهيم المصري", type: "أحوال شخصية", court: "محكمة الأسرة القاهرة", status: "معلقة", nextDate: "20 يوليو 2026", fees: "12000", clientId: clientRecords[2].id },
    { caseNo: "#2024-0280", clientName: "خالد عبد الرحمن عمر", type: "جنائي", court: "محكمة الجنايات القاهرة", status: "نشطة", nextDate: "18 يوليو 2026", fees: "55000", clientId: clientRecords[4].id },
  ];

  for (const c of casesData) {
    await prisma.case.create({
      data: {
        ...c,
        branchId: branchRecords[3].id,
        specializationId: specRecords[0].id,
      },
    });
  }

  // Phase 3 — Advanced Legal Finance
  await prisma.feeRule.createMany({
    data: [
      {
        name: "أتعاب تجارية — ابتدائي",
        caseType: "تجاري",
        specializationId: specRecords[0].id,
        stage: "ابتدائي",
        hourlyRate: 1500,
        minAmount: 15000,
        maxAmount: 80000,
        description: "أتعاب القضايا التجارية في المرحلة الابتدائية",
      },
      {
        name: "أتعاب جنائية — ثابت",
        caseType: "جنائي",
        specializationId: specRecords[16].id,
        stage: "جنايات",
        fixedAmount: 55000,
        description: "مبلغ ثابت للقضايا الجنائية",
      },
      {
        name: "أتعاب أحوال شخصية — نسبة",
        caseType: "أحوال شخصية",
        percentRate: 12,
        minAmount: 8000,
        maxAmount: 40000,
        description: "نسبة من قيمة المطالبة",
      },
    ],
  });

  const inv1 = await prisma.financialRecord.create({
    data: {
      invoiceNo: "INV-2026-001",
      clientName: "أحمد محمد الصاوي",
      type: "رسوم قضية",
      amount: 25000,
      paid: 15000,
      issueDate: "2026-01-10",
      dueDate: "2026-03-10",
      status: "مسدد جزئياً",
      paymentMethod: "transfer",
      caseRef: "#2024-0547",
    },
  });

  const inv2 = await prisma.financialRecord.create({
    data: {
      invoiceNo: "INV-2026-002",
      clientName: "شركة النيل للتجارة",
      type: "استشارة قانونية",
      amount: 18000,
      paid: 18000,
      issueDate: "2026-02-05",
      dueDate: "2026-02-28",
      status: "مسدد بالكامل",
      paymentMethod: "cash",
      caseRef: "#2024-0548",
    },
  });

  await prisma.financialRecord.create({
    data: {
      invoiceNo: "INV-2026-003",
      clientName: "خالد عبد الرحمن عمر",
      type: "رسوم قضية",
      amount: 55000,
      paid: 0,
      issueDate: "2026-03-01",
      dueDate: "2026-05-01",
      status: "غير مسدد",
      caseRef: "#2024-0280",
    },
  });

  await prisma.payment.createMany({
    data: [
      { recordId: inv1.id, amount: 10000, method: "transfer", reference: "TRX-88421", paidAt: "2026-01-15" },
      { recordId: inv1.id, amount: 5000, method: "cash", paidAt: "2026-02-01" },
      { recordId: inv2.id, amount: 18000, method: "cash", paidAt: "2026-02-20" },
    ],
  });

  await prisma.bailGuarantee.createMany({
    data: [
      {
        caseRef: "#2024-0280",
        clientName: "خالد عبد الرحمن عمر",
        amount: 100000,
        court: "محكمة الجنايات القاهرة",
        status: "نشط",
        depositDate: "2026-01-20",
      },
      {
        caseRef: "#2024-0548",
        clientName: "شركة النيل للتجارة",
        amount: 50000,
        court: "المحكمة الابتدائية الجيزة",
        status: "مسترد",
        depositDate: "2025-11-10",
        refundDate: "2026-02-15",
      },
    ],
  });

  await prisma.personalGuarantee.createMany({
    data: [
      {
        caseRef: "#2024-0280",
        clientName: "خالد عبد الرحمن عمر",
        guarantorName: "محمود عبد الرحمن",
        relationship: "أخ",
        status: "ساري",
        documents: "صورة بطاقة + إقرار ضامن",
      },
      {
        caseRef: "#2024-0312",
        clientName: "سارة إبراهيم المصري",
        guarantorName: "فاطمة إبراهيم",
        relationship: "والدة",
        status: "ساري",
      },
    ],
  });

  await prisma.officialNotification.createMany({
    data: [
      {
        type: "court_summons",
        title: "استدعاء جلسة 15 يوليو",
        entityName: "محكمة الاستئناف بالقاهرة",
        caseRef: "#2024-0547",
        dueDate: "2026-07-15",
        status: "قيد المتابعة",
        deliveryMethod: "بريد رسمي",
      },
      {
        type: "bail_deadline",
        title: "موعد تجديد الكفالة",
        entityName: "محكمة الجنايات القاهرة",
        caseRef: "#2024-0280",
        dueDate: "2026-08-01",
        status: "عاجل",
        deliveryMethod: "إعلان",
      },
      {
        type: "judgment_delivery",
        title: "إعلان حكم نهائي",
        entityName: "المحكمة الابتدائية الجيزة",
        caseRef: "#2024-0548",
        dueDate: "2026-06-30",
        status: "مكتمل",
        deliveryMethod: "محضر قضائي",
      },
    ],
  });


  // Phase 4 — Legal Library
  await prisma.legalDocument.createMany({
    data: [
      {
        title: "قانون الإثبات في المواد المدنية والتجارية",
        type: "law",
        category: "تشريعات",
        branchId: branchRecords[1].id,
        specializationId: specRecords[0].id,
        summary: "ينظم قواعد الإثبات أمام المحاكم المدنية والتجارية ويحدد وسائل الإثبات المقبولة.",
        tags: "إثبات,مدني,تجاري",
        status: "منشور",
        publishedAt: "2024-01-01",
      },
      {
        title: "نموذج عقد بيع تجاري",
        type: "contract_template",
        category: "عقود",
        branchId: branchRecords[3].id,
        specializationId: specRecords[0].id,
        summary: "قالب جاهز لعقود البيع التجاري مع بنود الضمان والتسليم والدفع.",
        tags: "عقد,بيع,تجاري",
        status: "منشور",
        publishedAt: "2025-06-15",
      },
      {
        title: "نموذج مذكرة دفاع جنائي",
        type: "memo_template",
        category: "مذكرات",
        branchId: branchRecords[2].id,
        specializationId: specRecords[16].id,
        summary: "هيكل مذكرة دفاع أمام محاكم الجنايات مع أقسام الوقائع والدفوع والطلبات.",
        tags: "جنائي,مذكرة,دفاع",
        status: "منشور",
        publishedAt: "2025-09-01",
      },
      {
        title: "لائحة تنظيم جلسات المحاكم الابتدائية",
        type: "regulation",
        category: "لوائح",
        branchId: branchRecords[4].id,
        summary: "تنظم إجراءات الجلسات والتأجيل والحضور والغياب في المحاكم الابتدائية.",
        tags: "إجراءات,محاكم",
        status: "منشور",
        publishedAt: "2023-11-20",
      },
    ],
  });

  await prisma.legalArticle.createMany({
    data: [
      {
        title: "مبادئ المسؤولية التعاقدية في العقود التجارية",
        author: "د. سارة المستشارة",
        branchId: branchRecords[3].id,
        specializationId: specRecords[0].id,
        summary: "تحليل للمسؤولية التعاقدية وشروط الإخلال والتعويض في العقود التجارية المعاصرة.",
        content: "تتناول هذه المقالة أسس المسؤولية التعاقدية...",
        tags: "عقود,تجاري,مسؤولية",
        readMinutes: 8,
        status: "منشور",
        publishedAt: "2026-02-10",
      },
      {
        title: "حق الدفاع في القضايا الجنائية — ضمانات دستورية",
        author: "أحمد المحامي",
        branchId: branchRecords[2].id,
        specializationId: specRecords[16].id,
        summary: "مراجعة لضمانات حق الدفاع في الدستور والقانون والممارسة القضائية.",
        tags: "جنائي,دفاع,دستور",
        readMinutes: 12,
        status: "منشور",
        publishedAt: "2026-03-05",
      },
      {
        title: "التحكيم التجاري الدولي: نظرة مقارنة",
        author: "د. منى الاستشارية",
        branchId: branchRecords[3].id,
        specializationId: specRecords[11].id,
        summary: "مقارنة بين أنظمة التحكيم في مصر والمركز القومي للتحكيم والقواعد الدولية.",
        tags: "تحكيم,دولي,تجاري",
        readMinutes: 15,
        status: "منشور",
        publishedAt: "2026-04-18",
      },
    ],
  });

  await prisma.circularInstruction.createMany({
    data: [
      {
        circularNo: "تعميم مجلس القضاء 12/2025",
        title: "تنظيم إجراءات الجلسات عن بُعد",
        issuer: "مجلس القضاء الأعلى",
        branchId: branchRecords[4].id,
        issueDate: "2025-12-01",
        effectiveDate: "2026-01-01",
        summary: "يحدد شروط عقد الجلسات عن بُعد ومتطلبات التوثيق والحضور الإلكتروني.",
        status: "ساري",
        tags: "جلسات,إلكتروني",
      },
      {
        circularNo: "وزارة العدل 45/2026",
        title: "تحديث رسوم التوثيق والشهر العقاري",
        issuer: "وزارة العدل",
        branchId: branchRecords[1].id,
        issueDate: "2026-01-15",
        effectiveDate: "2026-02-01",
        summary: "تعديل جداول الرسوم الخاصة بتوثيق العقود والشهر العقاري.",
        status: "ساري",
        tags: "رسوم,توثيق",
      },
      {
        circularNo: "محكمة النقض 8/2024",
        title: "مبادئ توحيد الاجتهاد في القضايا التجارية",
        issuer: "محكمة النقض",
        branchId: branchRecords[3].id,
        issueDate: "2024-09-20",
        effectiveDate: "2024-10-01",
        summary: "تعليمات بشأن توحيد المبادئ القضائية في نزاعات الشركات والإفلاس.",
        status: "ملغى",
        tags: "نقض,تجاري",
      },
    ],
  });

  // Phase 5 — Notifications & Integrations
  const rule1 = await prisma.notificationRule.create({
    data: {
      title: "تذكير جلسة قادمة",
      trigger: "قبل الجلسة بـ 24 ساعة",
      channel: "email",
      audience: "المسؤول + الموكل",
      status: "نشط",
      sentCount: 892,
      officeBranchId: mainBranch.id,
      templateBody: "تذكير: لديك جلسة غداً في {{court}} الساعة {{time}}",
    },
  });

  await prisma.notificationRule.createMany({
    data: [
      {
        title: "فاتورة غير مسددة",
        trigger: "تجاوز تاريخ الاستحقاق",
        channel: "email",
        audience: "الموكل",
        status: "نشط",
        sentCount: 234,
        officeBranchId: mainBranch.id,
      },
      {
        title: "تذكير دفع رسوم",
        trigger: "قبل الاستحقاق بـ 7 أيام",
        channel: "sms",
        audience: "الموكل",
        status: "نشط",
        sentCount: 89,
        officeBranchId: alexBranch.id,
      },
      {
        title: "تحديث حالة القضية",
        trigger: "تغيير حالة القضية",
        channel: "whatsapp",
        audience: "الموكل",
        status: "نشط",
        sentCount: 312,
      },
    ],
  });

  const resendIntegration = await prisma.integration.create({
    data: {
      name: "Resend Email",
      type: "email",
      provider: "resend",
      endpoint: "https://api.resend.com/emails",
      apiKeyMasked: "re_••••••••",
      callsToday: 218,
      successRate: 99.9,
      lastChecked: "منذ 2 دقائق",
      status: "متصل",
      officeBranchId: mainBranch.id,
    },
  });

  const twilioIntegration = await prisma.integration.create({
    data: {
      name: "Twilio SMS & WhatsApp",
      type: "sms",
      provider: "twilio",
      endpoint: "https://api.twilio.com/2010-04-01",
      apiKeyMasked: "AC••••••••",
      callsToday: 342,
      successRate: 99.7,
      lastChecked: "منذ 5 دقائق",
      status: "متصل",
    },
  });

  await prisma.integration.create({
    data: {
      name: "Payment Webhook",
      type: "webhook",
      provider: "custom",
      endpoint: "/api/webhooks/payments",
      callsToday: 45,
      successRate: 100,
      lastChecked: "منذ 10 دقائق",
      status: "متصل",
    },
  });

  await prisma.notificationLog.createMany({
    data: [
      {
        ruleId: rule1.id,
        channel: "email",
        provider: "resend",
        recipient: "client@naioshlaw.com",
        subject: "تذكير جلسة",
        body: "لديك جلسة غداً في محكمة الاستئناف",
        status: "مرسل",
        officeBranchId: mainBranch.id,
        sentAt: "2026-07-08 10:30",
      },
      {
        channel: "sms",
        provider: "twilio",
        recipient: "+201001234567",
        body: "تذكير: موعد تقديم مذكرة غداً",
        status: "مرسل",
        sentAt: "2026-07-08 14:15",
      },
      {
        channel: "whatsapp",
        provider: "internal",
        recipient: "+201009876543",
        body: "تحديث حالة قضيتك #2024-0547",
        status: "محاكاة — أضف TWILIO_* للإرسال الحقيقي",
        sentAt: "2026-07-09 09:00",
      },
    ],
  });

  await prisma.integrationLog.createMany({
    data: [
      { integrationId: resendIntegration.id, method: "POST", path: "/emails", statusCode: 200, durationMs: 142, success: true },
      { integrationId: twilioIntegration.id, method: "POST", path: "/Messages.json", statusCode: 200, durationMs: 198, success: true },
    ],
  });

  // Phase 6 — Governance & E-Signing
  await prisma.governancePolicy.createMany({
    data: [
      {
        title: "سياسة حماية البيانات الشخصية للموكلين",
        category: "خصوصية",
        description: "تنظم جمع وتخزين ومعالجة بيانات الموكلين وفقاً للتشريعات المصرية.",
        version: "2.1",
        status: "ساري",
        effectiveDate: "2025-01-01",
      },
      {
        title: "سياسة الصلاحيات والأدوار",
        category: "أمن معلومات",
        description: "تحدد مستويات الوصول لكل دور: مدير، محامٍ، مستشار، وكيل صناعي، موكل.",
        version: "1.3",
        status: "ساري",
        effectiveDate: "2025-06-15",
      },
      {
        title: "سياسة الاحتفاظ بالمستندات القانونية",
        category: "أرشفة",
        description: "مدة الاحتفاظ بالقضايا المغلقة والمستندات والنسخ الاحتياطية.",
        version: "1.0",
        status: "ساري",
        effectiveDate: "2024-09-01",
      },
    ],
  });

  await prisma.approvalRequest.createMany({
    data: [
      {
        refNo: "APR-2026-0001",
        type: "case_opening",
        title: "اعتماد فتح قضية تجارية #2024-0548",
        description: "طلب اعتماد فتح ملف قضية نزاع عقاري بقيمة 45000 ج.م",
        requesterId: lawyer.id,
        status: "pending",
        priority: "عالٍ",
        entity: "case",
        entityId: "#2024-0548",
        requestedAt: "2026-07-01",
      },
      {
        refNo: "APR-2026-0002",
        type: "fee_waiver",
        title: "إعفاء جزئي من رسوم الاستشارة",
        description: "طلب إعفاء 30% من رسوم استشارة لموكل متكرر",
        requesterId: lawyer.id,
        approverId: industrialAgent.id,
        status: "approved",
        priority: "متوسط",
        requestedAt: "2026-06-28",
        resolvedAt: "2026-06-29",
      },
      {
        refNo: "APR-2026-0003",
        type: "document_release",
        title: "إصدار نسخة من حكم نهائي",
        description: "طلب إصدار نسخة موثقة من حكم للموكل سارة إبراهيم",
        requesterId: lawyer.id,
        approverId: admin.id,
        status: "approved",
        priority: "عاجل",
        requestedAt: "2026-07-05",
        resolvedAt: "2026-07-06",
      },
      {
        refNo: "APR-2026-0004",
        type: "user_access",
        title: "منح صلاحية محامٍ لموظف جديد",
        description: "طلب تفعيل حساب محامٍ للانضمام لفريق القضايا الجنائية",
        requesterId: admin.id,
        status: "pending",
        priority: "متوسط",
        requestedAt: "2026-07-08",
      },
    ],
  });

  await prisma.eSignature.createMany({
    data: [
      {
        refNo: "SIG-2026-0001",
        documentTitle: "عقد وكالة قانونية — أحمد الصاوي",
        documentRef: "DOC-2026-0547",
        signerName: "أحمد محمد الصاوي",
        signerEmail: "ahmed@example.com",
        signerRole: "موكل",
        status: "signed",
        signatureHash: "a3f8c2d91e7b4f6058a2c1d9e0b3f7a2",
        signedAt: "2026-06-20 14:30",
      },
      {
        refNo: "SIG-2026-0002",
        documentTitle: "اتفاقية سرية — شركة النيل للتجارة",
        documentRef: "DOC-2026-0548",
        signerName: "ممثل شركة النيل",
        signerEmail: "legal@niletrade.com",
        signerRole: "موكل",
        status: "pending",
        expiresAt: "2026-07-20",
      },
      {
        refNo: "SIG-2026-0003",
        documentTitle: "إقرار بالموافقة على الأتعاب",
        documentRef: "DOC-2026-0280",
        signerName: "خالد عبد الرحمن عمر",
        signerRole: "موكل",
        userId: lawyer.id,
        status: "pending",
        expiresAt: "2026-07-15",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "login", entity: "auth", details: "تسجيل دخول المدير", severity: "info" },
      { userId: lawyer.id, action: "create_case", entity: "case", entityId: "#2024-0547", details: "إنشاء قضية جديدة", severity: "info" },
      { userId: industrialAgent.id, action: "approve_request", entity: "approval", entityId: "APR-2026-0002", details: "اعتماد إعفاء رسوم", severity: "info" },
      { userId: admin.id, action: "sign_document", entity: "e_signature", details: "توقيع عقد وكالة", severity: "info" },
      { action: "system_backup", entity: "system", details: "نسخ احتياطي تلقائي", severity: "info" },
    ],
  });

  // Phase 7 — Global Operations
  const partner1 = await prisma.supplyChainPartner.create({
    data: {
      name: "LogiLegal Shipping",
      type: "شحن دولي",
      country: "الإمارات",
      contactName: "أحمد الشحات",
      email: "ops@logilegal.ae",
      phone: "+971501234567",
      rating: 4.7,
    },
  });

  await prisma.supplyChainPartner.create({
    data: {
      name: "مستندات قانونية سريعة",
      type: "توثيق",
      country: "مصر",
      contactName: "منى حسن",
      phone: "01002223344",
      rating: 4.5,
    },
  });

  await prisma.supplyChainShipment.createMany({
    data: [
      {
        refNo: "SHP-2026-0001",
        partnerId: partner1.id,
        caseRef: "#2024-0548",
        description: "مستندات قضية نزاع عقاري",
        origin: "القاهرة",
        destination: "دبي",
        status: "في الطريق",
        shipDate: "2026-07-01",
        eta: "2026-07-12",
      },
      {
        refNo: "SHP-2026-0002",
        caseRef: "#2024-0547",
        description: "نسخ معتمدة من أحكام",
        origin: "الإسكندرية",
        destination: "الرياض",
        status: "تم التسليم",
        shipDate: "2026-06-20",
        eta: "2026-06-28",
      },
    ],
  });

  await prisma.internationalLawMatter.createMany({
    data: [
      {
        refNo: "INT-2026-0001",
        title: "نزاع تحكيم تجاري دولي — شركة النيل",
        jurisdiction: "ICC باريس",
        treaty: "اتفاقية نيويورك 1958",
        clientName: "شركة النيل للتجارة",
        matterType: "تحكيم تجاري",
        status: "نشط",
        openedDate: "2026-03-15",
      },
      {
        refNo: "INT-2026-0002",
        title: "استرداد أصول عبر الحدود",
        jurisdiction: "المحكمة الجنائية الدولية",
        clientName: "مجموعة الدلتا الصناعية",
        matterType: "تعاون قضائي دولي",
        status: "قيد المراجعة",
        openedDate: "2026-05-01",
      },
    ],
  });

  const hq = await prisma.naiochBranch.create({
    data: {
      name: "نايوش — المقر الإقليمي",
      code: "HQ-CAI",
      country: "مصر",
      city: "القاهرة",
      managerName: "مدير النظام",
      phone: "0223910000",
      email: "hq@naioshlaw.com",
      isHQ: true,
    },
  });

  const dxb = await prisma.naiochBranch.create({
    data: {
      name: "نايوش — دبي",
      code: "DXB",
      country: "الإمارات",
      city: "دبي",
      managerName: "سارة المنصوري",
      phone: "+97143334455",
      email: "dubai@naioshlaw.com",
    },
  });

  await prisma.naiochBranch.create({
    data: {
      name: "نايوش — الرياض",
      code: "RUH",
      country: "السعودية",
      city: "الرياض",
      managerName: "فهد العتيبي",
      email: "riyadh@naioshlaw.com",
    },
  });

  await prisma.circularAlert.createMany({
    data: [
      {
        title: "تعميم جديد: جلسات عن بُعد",
        circularRef: "تعميم مجلس القضاء 12/2025",
        message: "يجب تطبيق إجراءات الجلسات الإلكترونية قبل 1 أغسطس",
        priority: "عالٍ",
        status: "جديد",
        dueDate: "2026-08-01",
        branchId: hq.id,
      },
      {
        title: "تحديث رسوم التوثيق",
        circularRef: "وزارة العدل 45/2026",
        message: "تعديل جداول الرسوم — راجع قسم المحاسبة",
        priority: "متوسط",
        status: "مقروء",
        dueDate: "2026-07-20",
        branchId: dxb.id,
        acknowledgedAt: "2026-07-05 10:00",
      },
      {
        title: "مبادئ النقض التجارية",
        circularRef: "محكمة النقض 8/2024",
        message: "توحيد الاجتهاد في قضايا الشركات",
        priority: "منخفض",
        status: "جديد",
        dueDate: "2026-09-01",
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "seed",
      entity: "system",
      details: "تهيئة قاعدة البيانات الأولية",
    },
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
