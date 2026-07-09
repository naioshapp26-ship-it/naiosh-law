import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { LibraryDocumentType } from "@/generated/prisma/client";

const typeLabels: Record<LibraryDocumentType, string> = {
  law: "قانون",
  regulation: "لائحة / نظام",
  contract_template: "قالب عقد",
  court_form: "نموذج محكمة",
  memo_template: "قالب مذكرة",
  other: "أخرى",
};

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q");

  const items = await prisma.legalDocument.findMany({
    where: {
      ...(type ? { type: type as LibraryDocumentType } : {}),
      ...(branchId ? { branchId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { tags: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { branch: true, specialization: true },
  });

  return NextResponse.json(
    items.map((d) => ({
      id: d.id,
      title: d.title,
      type: typeLabels[d.type] ?? d.type,
      category: d.category ?? "—",
      branch: d.branch?.name ?? "—",
      specialization: d.specialization?.name ?? "—",
      summary: d.summary ?? "",
      tags: d.tags ?? "",
      status: d.status,
      publishedAt: d.publishedAt ?? "—",
      fileUrl: d.fileUrl,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.legalDocument.create({
    data: {
      title: String(body.title ?? ""),
      type: (body.type as LibraryDocumentType) ?? "other",
      category: body.category ? String(body.category) : null,
      branchId: body.branchId ? String(body.branchId) : null,
      specializationId: body.specializationId ? String(body.specializationId) : null,
      summary: body.summary ? String(body.summary) : null,
      content: body.content ? String(body.content) : null,
      fileUrl: body.fileUrl ? String(body.fileUrl) : null,
      tags: body.tags ? String(body.tags) : null,
      status: String(body.status ?? "منشور"),
      publishedAt: body.publishedAt ? String(body.publishedAt) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
