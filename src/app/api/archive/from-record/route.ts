import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { mapArchiveRecord } from "@/lib/archive-mapper";
import { MODULE_LABELS } from "@/lib/archive-types";

async function markSourceArchived(sourceModule: string, sourceId: string) {
  switch (sourceModule) {
    case "legal-classification":
      await prisma.legalClassificationEntry.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "case-management":
      await prisma.case.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "clients-management":
      await prisma.client.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "court-sessions":
      await prisma.courtSession.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "legal-accounting":
      await prisma.financialRecord.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "notifications-center":
      await prisma.notificationRule.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    case "integrations":
      await prisma.integration.update({
        where: { id: sourceId },
        data: { status: "مؤرشف" },
      });
      break;
    default:
      break;
  }
}

async function nextRefNo() {
  const count = await prisma.archiveRecord.count();
  return `ARC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const body = await request.json();
  const sourceModule = String(body.sourceModule ?? "");
  const sourceId = body.sourceId ? String(body.sourceId) : "";
  const title = String(body.title ?? "سجل مؤرشف");

  if (!sourceModule || !sourceId) {
    return NextResponse.json({ error: "بيانات المصدر ناقصة" }, { status: 400 });
  }

  const existing = await prisma.archiveRecord.findFirst({
    where: { sourceModule, sourceId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "هذا السجل مؤرشف مسبقاً", id: existing.id, refNo: existing.refNo },
      { status: 409 }
    );
  }

  const refNo = await nextRefNo();
  const sourceModuleLabel =
    body.sourceModuleLabel ? String(body.sourceModuleLabel) : MODULE_LABELS[sourceModule] ?? sourceModule;

  const created = await prisma.archiveRecord.create({
    data: {
      refNo,
      title,
      description: body.description ? String(body.description) : null,
      sourceModule,
      sourceModuleLabel,
      sourceId,
      sourceRef: body.sourceRef ? String(body.sourceRef) : null,
      recordData: body.recordData ? JSON.stringify(body.recordData) : null,
      category: body.category ? String(body.category) : sourceModuleLabel,
      tags: body.tags ? String(body.tags) : null,
      status: "مؤرشف",
      archivedBy: session?.name ?? session?.email ?? null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  try {
    await markSourceArchived(sourceModule, sourceId);
  } catch {
    // Source may not exist or lack status field — archive copy still created
  }

  return NextResponse.json(mapArchiveRecord(created), { status: 201 });
}
