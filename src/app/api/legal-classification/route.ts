import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { mapEntryAttachments, serializeAttachments } from "@/lib/entry-attachments";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const axisSlug = searchParams.get("axisSlug");
  const topicSlug = searchParams.get("topicSlug");

  const entries = await prisma.legalClassificationEntry.findMany({
    where: {
      ...(axisSlug ? { axisSlug } : {}),
      ...(topicSlug ? { topicSlug } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      refNo: e.refNo,
      axisSlug: e.axisSlug,
      topicSlug: e.topicSlug,
      topicName: e.topicName,
      title: e.title,
      jurisdiction: e.jurisdiction ?? "—",
      country: e.country ?? "—",
      category: e.category ?? "—",
      status: e.status,
      client: e.clientName ?? "—",
      effectiveDate: e.effectiveDate ?? "—",
      source: e.source ?? "—",
      description: e.description ?? "",
      notes: e.notes ?? "",
      attachments: mapEntryAttachments(e.attachments),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.legalClassificationEntry.count();
  const refNo = `LAW-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const created = await prisma.legalClassificationEntry.create({
    data: {
      refNo,
      axisSlug: String(body.axisSlug ?? ""),
      topicSlug: String(body.topicSlug ?? ""),
      topicName: String(body.topicName ?? body.title ?? ""),
      title: String(body.title ?? ""),
      jurisdiction: body.jurisdiction ? String(body.jurisdiction) : null,
      country: body.country ? String(body.country) : null,
      category: body.category ? String(body.category) : null,
      status: body.status ? String(body.status) : "نشط",
      clientName: body.client ? String(body.client) : body.clientName ? String(body.clientName) : null,
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : null,
      source: body.source ? String(body.source) : null,
      description: body.description ? String(body.description) : null,
      notes: body.notes ? String(body.notes) : null,
      attachments: serializeAttachments(body.attachments),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
