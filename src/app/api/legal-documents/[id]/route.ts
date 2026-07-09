import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, requireWrite } from "@/lib/api-helpers";
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

  const updated = await prisma.legalDocument.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      type: body.type !== undefined ? normalizeDocumentType(body.type) : undefined,
      category: body.category !== undefined ? String(body.category) || null : undefined,
      summary: body.summary !== undefined ? String(body.summary) || null : undefined,
      content: body.content !== undefined ? String(body.content) || null : undefined,
      tags: body.tags !== undefined ? String(body.tags) || null : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.legalDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
