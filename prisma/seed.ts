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
  await prisma.integrationLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.notificationRule.deleteMany();
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
