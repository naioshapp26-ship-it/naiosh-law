import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
  findClientContactById,
  findClientContactByName,
  type ClientContactRow,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";
import { displayResolvedCase } from "@/lib/case-identity";
import { resolveCaseById, resolveCaseRef } from "@/lib/case-identity-server";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const role = session!.role;
  const canView = canViewPersonContact(role);
  if (role === "client") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const records = await prisma.financialRecord.findMany({
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
    },
  });

  const nameCache = new Map<string, ClientContactRow | null>();
  const base = [];
  for (const r of records) {
    let contact = r.client as ClientContactRow | null;
    if (!contact && r.clientName) {
      if (!nameCache.has(r.clientName)) {
        nameCache.set(r.clientName, await findClientContactByName(r.clientName));
      }
      contact = nameCache.get(r.clientName) ?? null;
    }
    const resolved = await resolveCaseRef(r.caseRef);
    const caseDisplay = displayResolvedCase(resolved);
    base.push(
      mapRowWithClientContact(
        {
          id: r.id,
          invoiceNo: r.invoiceNo,
          ref: r.invoiceNo,
          client: r.clientName,
          type: r.type,
          amount: String(r.amount),
          paid: String(r.paid),
          issueDate: r.issueDate,
          date: r.issueDate,
          status: r.status,
          caseRef: r.caseRef ?? "",
          caseNo: caseDisplay.caseNo,
          caseId: caseDisplay.caseId ?? "",
          caseLinks: caseDisplay.caseLinks,
          caseLinkStatus: caseDisplay.caseLinkStatus,
        },
        contact,
        canView ? role : null
      )
    );
  }
  return NextResponse.json(await attachCustomValuesToRows("legal-accounting", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const gate = await assertPageAction({
    pageKey: "legal-accounting",
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;
  const body = await request.json();

  const count = await prisma.financialRecord.count();
  const invoiceNo =
    body.invoiceNo ??
    `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}-${Date.now().toString(36)}`;

  const ensured = await ensureClientWithContact({
    name: String(body.client ?? body.clientName ?? ""),
    clientId: body.clientId ? String(body.clientId) : null,
    body: body as Record<string, unknown>,
    role: session!.role,
    changedById: session!.sub,
    changedByName: session!.name ?? session!.email,
    sourceModule: "legal-accounting",
    requireComplete: true,
  });
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: ensured.status });
  }

  let caseRef: string | null = null;
  if (body.caseId) {
    const linked = await resolveCaseById(String(body.caseId));
    if (!linked) {
      return NextResponse.json({ error: "القضية غير موجودة في السجل المركزي" }, { status: 400 });
    }
    caseRef = linked.caseNo;
  } else if (body.caseNo || body.caseRef) {
    const resolved = await resolveCaseRef(String(body.caseNo ?? body.caseRef));
    if (resolved.status !== "linked") {
      return NextResponse.json(
        { error: "يجب اختيار قضية حقيقية من السجل المركزي لرقم القضية" },
        { status: 400 }
      );
    }
    caseRef = resolved.case.caseNo;
  } else {
    return NextResponse.json(
      { error: "رقم القضية إلزامي — اختر قضية من السجل المركزي" },
      { status: 400 }
    );
  }

  const created = await prisma.financialRecord.create({
    data: {
      invoiceNo,
      clientId: ensured.clientId,
      clientName: ensured.clientName,
      type: String(body.type ?? "رسوم قضية"),
      amount: Number(body.amount ?? 0),
      paid: Number(body.paid ?? 0),
      issueDate: String(body.issueDate ?? new Date().toISOString().slice(0, 10)),
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: String(body.status ?? "غير مسدد"),
      paymentMethod: body.paymentMethod as PaymentMethod | undefined,
      caseRef,
      notes: body.notes ? String(body.notes) : null,
      isDemo: false,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "legal-accounting",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  void findClientContactById;
  return NextResponse.json(
    {
      id: created.id,
      clientId: created.clientId,
      phone: ensured.contact.phone,
      country: ensured.contact.country,
      city: ensured.contact.city,
    },
    { status: 201 }
  );
}
