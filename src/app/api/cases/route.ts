import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
  findClientContactByName,
  type ClientContactRow,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const role = session!.role;
  const canView = canViewPersonContact(role);

  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          phoneDialCode: true,
          phoneSecondary: true,
          phoneSecondaryDialCode: true,
          primaryPhoneSlot: true,
          country: true,
          city: true,
          countrySecondary: true,
          citySecondary: true,
          primaryAddressSlot: true,
        },
      },
      branch: true,
      specialization: true,
    },
  });

  // Resolve contacts for cases linked only by name
  const nameCache = new Map<string, ClientContactRow | null>();
  const base = [];
  for (const c of cases) {
    let contact = c.client as ClientContactRow | null;
    if (!contact && c.clientName) {
      if (!nameCache.has(c.clientName)) {
        nameCache.set(c.clientName, await findClientContactByName(c.clientName));
      }
      contact = nameCache.get(c.clientName) ?? null;
    }
    const row = mapRowWithClientContact(
      {
        id: c.id,
        caseNo: c.caseNo,
        client: c.clientName,
        type: c.type,
        court: c.court,
        status: c.status,
        nextDate: c.nextDate ?? "—",
        fees: c.fees ?? "0",
        branch: c.branch?.name,
        specialization: c.specialization?.name,
      },
      contact,
      canView ? role : null
    );
    base.push(row);
  }

  const withCustom = await attachCustomValuesToRows("case-management", base);
  return NextResponse.json(withCustom);
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const gate = await assertPageAction({
    pageKey: "case-management",
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const count = await prisma.case.count();
  const caseNo = body.caseNo ?? `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const clientNameInput = String(body.client ?? body.clientName ?? "");
  const ensured = await ensureClientWithContact({
    name: clientNameInput,
    clientId: body.clientId ? String(body.clientId) : null,
    body: body as Record<string, unknown>,
    role: session!.role,
    changedById: session!.sub,
    changedByName: session!.name ?? session!.email,
    sourceModule: "case-management",
    requireComplete: true,
  });
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: ensured.status });
  }

  await prisma.client.update({
    where: { id: ensured.clientId },
    data: { casesCount: { increment: 1 } },
  });

  const created = await prisma.case.create({
    data: {
      caseNo,
      clientId: ensured.clientId,
      clientName: ensured.clientName,
      type: String(body.type ?? "مدني"),
      court: String(body.court ?? ""),
      status: String(body.status ?? "نشطة"),
      nextDate: body.nextDate ? String(body.nextDate) : null,
      fees: body.fees != null ? String(body.fees) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "case-management",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  // Link audit sourceId now that case exists
  await prisma.personContactChange.updateMany({
    where: {
      clientId: ensured.clientId,
      sourceModule: "case-management",
      sourceId: null,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    data: { sourceId: created.id },
  });

  return NextResponse.json(
    {
      id: created.id,
      caseNo: created.caseNo,
      clientId: created.clientId,
      phone: ensured.contact.phone,
      country: ensured.contact.country,
      city: ensured.contact.city,
    },
    { status: 201 }
  );
}
