import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requireWrite, withApiError } from "@/lib/api-helpers";
import type { LibraryDocumentType } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };
const documentTypes: LibraryDocumentType[] = ["law", "regulation", "contract_template", "court_form", "memo_template", "other"];

function normalizeDocumentType(value: unknown): LibraryDocumentType {
  const type = String(value ?? "other") as LibraryDocumentType;
  return documentTypes.includes(type) ? type : "other";
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  return withApiError(async () => {
    const updated = await prisma.legalDocument.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title).trim() : undefined,
        type: body.type !== undefined ? normalizeDocumentType(body.type) : undefined,
        category: body.category !== undefined ? nullableString(body.category) : undefined,
        summary: body.summary !== undefined ? nullableString(body.summary) : undefined,
        content: body.content !== undefined ? nullableString(body.content) : undefined,
        tags: body.tags !== undefined ? nullableString(body.tags) : undefined,
        status: body.status !== undefined ? String(body.status).trim() : undefined,
      },
    });
    return NextResponse.json(updated);
  }, "Update legal document");
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  return withApiError(async () => {
    await prisma.legalDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, "Delete legal document");
}
