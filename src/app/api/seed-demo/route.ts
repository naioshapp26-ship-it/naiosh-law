import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { seedDemoData } from "@/lib/seed-demo-data";

/** Load demo data into empty tables (additive — safe to call multiple times) */
export async function POST() {
  const { error } = await requireWrite();
  if (error) return error;

  try {
    const seeded = await seedDemoData(getPrisma());
    const total = Object.values(seeded).reduce((a, b) => a + b, 0);
    return NextResponse.json({
      ok: true,
      message: total > 0 ? "تم تحميل البيانات التجريبية بنجاح" : "البيانات موجودة مسبقاً",
      seeded,
      total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "فشل تحميل البيانات التجريبية", details: message }, { status: 500 });
  }
}
