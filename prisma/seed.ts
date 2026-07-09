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
  await prisma.officialEntity.deleteMany();
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

  const caseRecords = [];
  for (const c of casesData) {
    const caseRecord = await prisma.case.create({
      data: {
        ...c,
        branchId: branchRecords[3].id,
        specializationId: specRecords[0].id,
      },
    });
    caseRecords.push(caseRecord);
  }

  await Promise.all(
    clientRecords.map(async (client) => {
      const casesCount = await prisma.case.count({ where: { clientId: client.id } });
      return prisma.client.update({ where: { id: client.id }, data: { casesCount } });
    })
  );

  await prisma.courtSession.createMany({
    data: [
      { caseId: caseRecords[0].id, caseNo: "#2024-0547", client: "أحمد محمد الصاوي", court: "محكمة الاستئناف القاهرة", room: "7", date: "15 يوليو 2026", time: "10:00", status: "مجدولة", lawyer: "أحمد المحامي" },
      { caseId: caseRecords[1].id, caseNo: "#2024-0548", client: "شركة النيل للتجارة", court: "المحكمة الابتدائية الجيزة", room: "3", date: "16 يوليو 2026", time: "11:30", status: "قريبة", lawyer: "أحمد المحامي" },
      { caseId: caseRecords[3].id, caseNo: "#2024-0280", client: "خالد عبد الرحمن عمر", court: "محكمة الجنايات القاهرة", room: "12", date: "18 يوليو 2026", time: "09:00", status: "مجدولة", lawyer: "أحمد المحامي" },
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
