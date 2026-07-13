import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { parseAttachments } from "@/lib/archive-mapper";
import type { ArchiveAttachment } from "@/lib/archive-types";
import { MAX_ATTACHMENT_BYTES } from "@/lib/archive-types";

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

function mapRow(row: {
  id: string;
  sourceModule: string;
  sourceId: string;
  sourceRef: string | null;
  title: string | null;
  notes: string | null;
  attachments: string | null;
  addedBy: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    sourceModule: row.sourceModule,
    sourceId: row.sourceId,
    sourceRef: row.sourceRef ?? "—",
    title: row.title ?? "",
    notes: row.notes ?? "",
    attachments: parseAttachments(row.attachments),
    addedBy: row.addedBy ?? "—",
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const sourceModule = searchParams.get("sourceModule");
    const sourceId = searchParams.get("sourceId");

    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "sourceModule و sourceId مطلوبان" }, { status: 400 });
    }

    const rows = await prisma.recordSupplement.findMany({
      where: { sourceModule, sourceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rows.map(mapRow));
  } catch (e) {
    console.error("[record-supplements GET]", e);
    return NextResponse.json({ error: "تعذر تحميل المعلومات الإضافية" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  try {
    const body = await request.json();
    const sourceModule = String(body.sourceModule ?? "");
    const sourceId = String(body.sourceId ?? "");

    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "بيانات المرجع ناقصة" }, { status: 400 });
    }

    const attachments = validateAttachments(body.attachments);
    if (attachments === null) {
      return NextResponse.json({ error: "مرفقات غير صالحة" }, { status: 400 });
    }

    const created = await prisma.recordSupplement.create({
      data: {
        sourceModule,
        sourceId,
        sourceRef: body.sourceRef ? String(body.sourceRef) : null,
        title: body.title ? String(body.title) : null,
        notes: body.notes ? String(body.notes) : null,
        attachments: attachments.length ? JSON.stringify(attachments) : null,
        addedBy: session?.name ?? session?.email ?? null,
      },
    });

    return NextResponse.json(mapRow(created), { status: 201 });
  } catch (e) {
    console.error("[record-supplements POST]", e);
    return NextResponse.json({ error: "فشل حفظ المعلومات الإضافية" }, { status: 500 });
  }
}
