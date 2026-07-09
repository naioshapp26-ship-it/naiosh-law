import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";
import type { LibraryDocumentType } from "@/generated/prisma/client";

const typeLabels: Record<LibraryDocumentType, string> = {
  law: "قانون",
  regulation: "لائحة / نظام",
  contract_template: "قالب عقد",
  court_form: "نموذج محكمة",
  memo_template: "قالب مذكرة",
  other: "أخرى",
};
const documentTypes = Object.keys(typeLabels) as LibraryDocumentType[];

function normalizeDocumentType(value: unknown): LibraryDocumentType {
  const type = String(value ?? "other") as LibraryDocumentType;
  return documentTypes.includes(type) ? type : "other";
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q");
  const normalizedType = type && documentTypes.includes(type as LibraryDocumentType)
    ? (type as LibraryDocumentType)
    : null;

  return withApiError(async () => {
    const items = await prisma.legalDocument.findMany({
      where: {
        ...(normalizedType ? { type: normalizedType } : {}),
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
  }, "List legal documents");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const title = requiredString(body, { field: "title", label: "عنوان المستند" });
  if (title.error) return title.error;

  return withApiError(async () => {
    const created = await prisma.legalDocument.create({
      data: {
        title: title.value,
        type: normalizeDocumentType(body.type),
        category: nullableString(body.category),
        branchId: nullableString(body.branchId),
        specializationId: nullableString(body.specializationId),
        summary: nullableString(body.summary),
        content: nullableString(body.content),
        fileUrl: nullableString(body.fileUrl),
        tags: nullableString(body.tags),
        status: nullableString(body.status) ?? "منشور",
        publishedAt: nullableString(body.publishedAt),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create legal document");
}
