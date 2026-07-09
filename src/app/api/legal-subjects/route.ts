import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const subjects = await prisma.legalSubject.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { cases: true } } },
  });
  return NextResponse.json(subjects);
}
