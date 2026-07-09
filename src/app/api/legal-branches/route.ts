import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const branches = await prisma.legalBranch.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      specializations: {
        orderBy: { sortOrder: "asc" },
        include: {
          subjects: { include: { subject: true } },
        },
      },
      _count: { select: { cases: true, consultations: true } },
    },
  });

  return NextResponse.json(branches);
}
