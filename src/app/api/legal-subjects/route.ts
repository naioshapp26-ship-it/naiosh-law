import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const subjects = await prisma.legalSubject.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { cases: true } } },
  });
  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const body = await request.json();
  const created = await prisma.legalSubject.create({
    data: {
      name: String(body.name),
      description: body.description ? String(body.description) : null,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
