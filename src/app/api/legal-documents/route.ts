import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { LibraryDocumentType } from "@/generated/prisma/client";
import { neutralizeCountryWording } from "@/lib/neutralize-country-wording";

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

  const mapped = [];
  for (const d of items) {
    const title = neutralizeCountryWording(d.title);
    const summary = d.summary ? neutralizeCountryWording(d.summary) : "";
    if (title !== d.title || (d.summary && summary !== d.summary)) {
      await prisma.legalDocument.update({
        where: { id: d.id },
        data: { title, summary: summary || null },
      });
    }
    mapped.push({
      id: d.id,
      title,
      type: typeLabels[d.type] ?? d.type,
      category: d.category ?? "—",
      branch: d.branch?.name ?? "—",
      specialization: d.specialization?.name ?? "—",
      summary,
      tags: d.tags ?? "",
      status: d.status,
      publishedAt: d.publishedAt ?? "—",
      fileUrl: d.fileUrl,
    });
  }

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.legalDocument.create({
    data: {
      title: neutralizeCountryWording(String(body.title ?? "")),
      type: (body.type as LibraryDocumentType) ?? "other",
      category: body.category ? String(body.category) : null,
      branchId: body.branchId ? String(body.branchId) : null,
      specializationId: body.specializationId ? String(body.specializationId) : null,
      summary: body.summary ? neutralizeCountryWording(String(body.summary)) : null,
      content: body.content ? String(body.content) : null,
      fileUrl: body.fileUrl ? String(body.fileUrl) : null,
      tags: body.tags ? String(body.tags) : null,
      status: String(body.status ?? "منشور"),
      publishedAt: body.publishedAt ? String(body.publishedAt) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
