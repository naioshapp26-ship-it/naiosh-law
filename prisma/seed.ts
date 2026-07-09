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
  await prisma.payment.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.bailGuarantee.deleteMany();
  await prisma.personalGuarantee.deleteMany();
  await prisma.officialNotification.deleteMany();
  await prisma.feeRule.deleteMany();
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

  await prisma.courtSession.createMany({
    data: [
      { caseNo: "#2024-0547", client: "أحمد محمد الصاوي", court: "محكمة الاستئناف القاهرة", room: "7", date: "15 يوليو 2026", time: "10:00", status: "مجدولة", lawyer: "أحمد المحامي" },
      { caseNo: "#2024-0548", client: "شركة النيل للتجارة", court: "المحكمة الابتدائية الجيزة", room: "3", date: "16 يوليو 2026", time: "11:30", status: "قريبة", lawyer: "أحمد المحامي" },
      { caseNo: "#2024-0280", client: "خالد عبد الرحمن عمر", court: "محكمة الجنايات القاهرة", room: "12", date: "18 يوليو 2026", time: "09:00", status: "مجدولة", lawyer: "أحمد المحامي" },
    ],
  });

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
