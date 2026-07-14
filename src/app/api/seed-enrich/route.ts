import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { enrichDemoData } from "@/lib/enrich-demo-data";

/** Additive enrichment — never deletes/overwrites existing records */
export async function POST() {
  const { error } = await requireWrite();
  if (error) return error;

  try {
    const seeded = await enrichDemoData(getPrisma());
    const total = Object.values(seeded).reduce((a, b) => a + b, 0);
    return NextResponse.json({
      ok: true,
      message:
        total > 0
          ? `تم ضبط النظام وإضافة ${total} سجل تشغيلي جديد دون المساس بالبيانات الموجودة`
          : "لا توجد إضافات جديدة — كل البيانات موجودة مسبقاً",
      seeded,
      total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "فشل ضبط بيانات النظام", details: message },
      { status: 500 }
    );
  }
}
