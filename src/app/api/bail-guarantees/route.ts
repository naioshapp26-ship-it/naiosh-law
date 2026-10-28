import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  ensureClientWithContact,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;
  const canView = canViewPersonContact(session!.role);

  const items = await prisma.bailGuarantee.findMany({ orderBy: { createdAt: "desc" } });
  const nameCache = new Map<string, Awaited<ReturnType<typeof findClientContactByName>>>();
  const out = [];
  for (const b of items) {
    if (!nameCache.has(b.clientName)) {
      nameCache.set(b.clientName, await findClientContactByName(b.clientName));
    }
    const contact = nameCache.get(b.clientName) ?? null;
    out.push(
      mapRowWithClientContact(
        {
          id: b.id,
          caseRef: b.caseRef,
          client: b.clientName,
          amount: String(b.amount),
          court: b.court,
          status: b.status,
          depositDate: b.depositDate,
          refundDate: b.refundDate ?? "—",
          notes: b.notes ?? "",
        },
        contact,
        canView ? session!.role : null
      )
    );
  }
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const name = String(body.client ?? body.clientName ?? "").trim();
  let clientName = name;
  if (name || body.phone || body.country || body.city) {
    const ensured = await ensureClientWithContact({
      name: name || "موكل كفالة",
      clientId: body.clientId ? String(body.clientId) : null,
      body,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "bail-guarantees",
      requireComplete: Boolean(body.phone || body.country || body.city),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientName = ensured.clientName;
  }

  const created = await prisma.bailGuarantee.create({
    data: {
      caseRef: String(body.caseRef ?? ""),
      clientName,
      amount: Number(body.amount ?? 0),
      court: String(body.court ?? ""),
      status: String(body.status ?? "نشط"),
      depositDate: String(body.depositDate ?? ""),
      refundDate: body.refundDate ? String(body.refundDate) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
