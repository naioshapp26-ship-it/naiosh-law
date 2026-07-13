import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { mapArchiveRecord } from "@/lib/archive-mapper";
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

async function nextRefNo() {
  const count = await prisma.archiveRecord.count();
  return `ARC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const sourceModule = searchParams.get("sourceModule");
  const q = searchParams.get("q");

  const rows = await prisma.archiveRecord.findMany({
    where: {
      ...(sourceModule ? { sourceModule } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { refNo: { contains: q, mode: "insensitive" } },
              { sourceRef: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(mapArchiveRecord));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const body = await request.json();
  const attachments = validateAttachments(body.attachments);
  if (attachments === null) {
    return NextResponse.json({ error: "مرفقات غير صالحة" }, { status: 400 });
  }

  const refNo = await nextRefNo();
  const created = await prisma.archiveRecord.create({
    data: {
      refNo,
      title: String(body.title ?? "سجل مؤرشف"),
      description: body.description ? String(body.description) : null,
      sourceModule: String(body.sourceModule ?? "manual"),
      sourceModuleLabel: body.sourceModuleLabel ? String(body.sourceModuleLabel) : "إضافة يدوية",
      sourceId: body.sourceId ? String(body.sourceId) : null,
      sourceRef: body.sourceRef ? String(body.sourceRef) : null,
      recordData: body.recordData ? JSON.stringify(body.recordData) : null,
      category: body.category ? String(body.category) : null,
      tags: body.tags ? String(body.tags) : null,
      status: body.status ? String(body.status) : "مؤرشف",
      archivedBy: session?.name ?? session?.email ?? null,
      notes: body.notes ? String(body.notes) : null,
      attachments: attachments.length ? JSON.stringify(attachments) : null,
    },
  });

  return NextResponse.json(mapArchiveRecord(created), { status: 201 });
}
