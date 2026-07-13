import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { mapArchiveRecord } from "@/lib/archive-mapper";
import type { ArchiveAttachment } from "@/lib/archive-types";
import { MAX_ATTACHMENT_BYTES } from "@/lib/archive-types";

type Params = { params: Promise<{ id: string }> };

function validateAttachments(attachments: unknown): ArchiveAttachment[] | null {
  if (!attachments) return [];
  if (!Array.isArray(attachments)) return null;
  for (const item of attachments) {
    if (!item || typeof item !== "object") return null;
    const a = item as ArchiveAttachment;
    if (!a.name || !a.mimeType || !a.fileData) return null;
    if (typeof a.size === "number" && a.size > MAX_ATTACHMENT_BYTES) return null;
  }
  return attachments as ArchiveAttachment[];
}

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const row = await prisma.archiveRecord.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  return NextResponse.json(mapArchiveRecord(row));
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = String(body.title);
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.category !== undefined) data.category = body.category ? String(body.category) : null;
  if (body.tags !== undefined) data.tags = body.tags ? String(body.tags) : null;
  if (body.status !== undefined) data.status = String(body.status);
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
  if (body.recordData !== undefined) data.recordData = JSON.stringify(body.recordData);
  if (body.attachments !== undefined) {
    const attachments = validateAttachments(body.attachments);
    if (attachments === null) {
      return NextResponse.json({ error: "مرفقات غير صالحة" }, { status: 400 });
    }
    data.attachments = attachments.length ? JSON.stringify(attachments) : null;
  }

  const updated = await prisma.archiveRecord.update({ where: { id }, data });
  return NextResponse.json(mapArchiveRecord(updated));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;

  const { id } = await params;
  await prisma.archiveRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
