import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** وسائط الهيرو الظاهرة للعامة (الصفحة الرئيسية) */
export async function GET() {
  const items = await prisma.homepageHeroMedia.findMany({
    where: { isActive: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ items });
}
