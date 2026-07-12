import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireApprover } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const policies = await prisma.governancePolicy.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    policies.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description ?? "",
      version: p.version,
      status: p.status,
      effectiveDate: p.effectiveDate ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireApprover();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.governancePolicy.create({
    data: {
      title: String(body.title ?? ""),
      category: String(body.category ?? "عام"),
      description: body.description ? String(body.description) : null,
      version: String(body.version ?? "1.0"),
      status: String(body.status ?? "ساري"),
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
