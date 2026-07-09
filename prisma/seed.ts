import "dotenv/config";
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
  await prisma.eSignature.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.governancePolicy.deleteMany();
  await prisma.professionalNetwork.deleteMany();
  await prisma.caseSubject.deleteMany();
  await prisma.specializationSubject.deleteMany();
  await prisma.lawyerSpecialization.deleteMany();
  await prisma.courtOfficial.deleteMany();
  await prisma.courtSession.deleteMany();
  await prisma.case.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.client.deleteMany();
  await prisma.officialEntity.deleteMany();
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

  const caseRecords = [];
  for (const c of casesData) {
    const createdCase = await prisma.case.create({
      data: {
        ...c,
        branchId: branchRecords[3].id,
        specializationId: specRecords[0].id,
      },
    });
    caseRecords.push(createdCase);
  }

  await prisma.courtSession.createMany({
    data: [
      { caseNo: "#2024-0547", client: "أحمد محمد الصاوي", court: "محكمة الاستئناف القاهرة", room: "7", date: "15 يوليو 2026", time: "10:00", status: "مجدولة", lawyer: "أحمد المحامي" },
      { caseNo: "#2024-0548", client: "شركة النيل للتجارة", court: "المحكمة الابتدائية الجيزة", room: "3", date: "16 يوليو 2026", time: "11:30", status: "قريبة", lawyer: "أحمد المحامي" },
      { caseNo: "#2024-0280", client: "خالد عبد الرحمن عمر", court: "محكمة الجنايات القاهرة", room: "12", date: "18 يوليو 2026", time: "09:00", status: "مجدولة", lawyer: "أحمد المحامي" },
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
        entityId: caseRecords[1].id,
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
