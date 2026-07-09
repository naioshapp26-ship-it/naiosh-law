import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** One-time bootstrap when DB is migrated but empty (Railway first deploy) */
export async function POST() {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return NextResponse.json({ ok: true, message: "النظام مهيأ مسبقاً", users: count });
    }

    const hash = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        email: "admin@naioshlaw.com",
        password: hash,
        name: "مدير النظام",
        role: "admin",
      },
    });

    await prisma.user.createMany({
      data: [
        {
          email: "lawyer@naioshlaw.com",
          password: await bcrypt.hash("Lawyer@123", 10),
          name: "أحمد المحامي",
          role: "lawyer",
        },
        {
          email: "client@naioshlaw.com",
          password: await bcrypt.hash("Client@123", 10),
          name: "عميل تجريبي",
          role: "client",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      message: "تم إنشاء المستخدمين التجريبيين",
      users: 3,
    });
  } catch (error) {
    console.error("Setup error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "فشل التهيئة — تأكد من تشغيل migrations أولاً", details: message },
      { status: 500 }
    );
  }
}
