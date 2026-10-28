import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import {
  assertPageAction,
  isGenericModuleKey,
} from "@/lib/page-settings/page-action-auth";
import type { Prisma } from "@/generated/prisma/client";
import {
  ensureClientWithContact,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import {
  canViewPersonContact,
  formatPhoneDisplay,
  UNSPECIFIED_CONTACT,
} from "@/lib/person-contact";
import {
  CASE_PICKER_REQUIRED_SLUGS,
  displayResolvedCase,
  NO_LINKED_CASE,
} from "@/lib/case-identity";
import { resolveCaseById, resolveCaseRef } from "@/lib/case-identity-server";

type Ctx = { params: Promise<{ moduleKey: string }> };

function personNameFromData(data: Record<string, unknown>): string {
  for (const key of ["client", "clientName", "name", "requester"]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function hasPersonFields(data: Record<string, unknown>): boolean {
  return Boolean(
    data.client ||
      data.clientName ||
      data.phone ||
      data.country ||
      data.city ||
      data.phoneDialCode
  );
}

function flattenRow(id: string, data: Record<string, unknown>, status: string) {
  return { id, status, ...data };
}

export async function GET(_request: Request, ctx: Ctx) {
  const { moduleKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "view",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const role = session!.role;
  const canView = canViewPersonContact(role);

  const rows = await prisma.moduleRecord.findMany({
    where: { moduleKey },
    orderBy: { createdAt: "desc" },
  });

  const base = [];
  for (const r of rows) {
    const data = (r.data ?? {}) as Record<string, unknown>;
    const flat = flattenRow(r.id, data, r.status);
    const name = personNameFromData(data);
    const clientId = typeof data.clientId === "string" ? data.clientId : null;

    let caseEnrich: Record<string, unknown> = {};
    if (typeof data.caseId === "string" && data.caseId) {
      const linked = await resolveCaseById(data.caseId);
      if (linked) {
        caseEnrich = {
          caseId: linked.id,
          caseNo: linked.caseNo,
          caseLinks: [linked],
          caseLinkStatus: "linked",
        };
      } else {
        caseEnrich = {
          caseNo: `${displayResolvedCase({ status: "review", raw: String(data.caseNo ?? data.caseId) }).caseNo}`,
          caseLinks: [],
          caseLinkStatus: "review",
        };
      }
    } else if (typeof data.caseNo === "string" && data.caseNo.trim()) {
      const resolved = await resolveCaseRef(data.caseNo);
      const disp = displayResolvedCase(resolved);
      caseEnrich = {
        caseNo: disp.caseNo,
        caseId: disp.caseId ?? "",
        caseLinks: disp.caseLinks,
        caseLinkStatus: disp.caseLinkStatus,
      };
    } else {
      caseEnrich = {
        caseNo: NO_LINKED_CASE,
        caseLinks: [],
        caseLinkStatus: "none",
      };
    }

    if (name || clientId) {
      const contact = clientId
        ? await prisma.client.findUnique({
            where: { id: clientId },
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
          })
        : await findClientContactByName(name);
      if (contact) {
        base.push({
          ...mapRowWithClientContact(flat, contact, canView ? role : null),
          ...caseEnrich,
        });
        continue;
      }
    }
    // Prefer stored display fields; never invent values
    base.push({
      ...flat,
      ...caseEnrich,
      phone:
        typeof data.phone === "string" && data.phone
          ? formatPhoneDisplay(
              typeof data.phoneDialCode === "string" ? data.phoneDialCode : null,
              data.phone
            )
          : UNSPECIFIED_CONTACT,
      country:
        typeof data.country === "string" && data.country ? data.country : UNSPECIFIED_CONTACT,
      city: typeof data.city === "string" && data.city ? data.city : UNSPECIFIED_CONTACT,
      contactIncomplete: true,
    });
  }
  const withCustom = await attachCustomValuesToRows(moduleKey, base);
  return NextResponse.json(withCustom);
}

export async function POST(request: Request, ctx: Ctx) {
  const { moduleKey } = await ctx.params;
  const { error, session } = await requireWrite();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const status = body.status != null ? String(body.status) : "نشط";
  const { id: _id, ...rest } = body;
  void _id;

  let dataPayload: Record<string, unknown> = { ...rest };

  const requireRealCase = CASE_PICKER_REQUIRED_SLUGS.has(moduleKey);
  // Canonical case link: prefer caseId, else exact caseNo match — never invent
  if (body.caseId) {
    const linked = await resolveCaseById(String(body.caseId));
    if (!linked) {
      return NextResponse.json({ error: "القضية غير موجودة في السجل المركزي" }, { status: 400 });
    }
    dataPayload.caseId = linked.id;
    dataPayload.caseNo = linked.caseNo;
  } else if (body.caseNo) {
    const resolved = await resolveCaseRef(String(body.caseNo));
    if (resolved.status === "linked") {
      dataPayload.caseId = resolved.case.id;
      dataPayload.caseNo = resolved.case.caseNo;
    } else if (String(body.caseNo).trim()) {
      if (requireRealCase) {
        return NextResponse.json(
          {
            error:
              "لا يُسمح بربط رقم قضية غير موجود — اختر من السجل الحقيقي أو أنشئ قضية جديدة",
          },
          { status: 400 }
        );
      }
      // Optional modules: keep raw for review — do not auto-link a wrong case
      dataPayload.caseNo = String(body.caseNo).trim();
      delete dataPayload.caseId;
    }
  } else if (requireRealCase) {
    return NextResponse.json(
      { error: "رقم القضية إلزامي — اختر قضية من السجل المركزي" },
      { status: 400 }
    );
  }

  if (hasPersonFields(body)) {
    const name = personNameFromData(body);
    if (name || body.phone || body.country || body.city) {
      const ensured = await ensureClientWithContact({
        name: name || "طرف خارجي",
        clientId: body.clientId ? String(body.clientId) : null,
        body,
        role: session!.role,
        changedById: session!.sub,
        changedByName: session!.name ?? session!.email,
        sourceModule: moduleKey,
        requireComplete: Boolean(body.phone || body.country || body.city),
      });
      if (!ensured.ok) {
        return NextResponse.json({ error: ensured.error }, { status: ensured.status });
      }
      dataPayload = {
        ...dataPayload,
        clientId: ensured.clientId,
        client: ensured.clientName,
        phone: ensured.contact.phone ?? "",
        phoneDialCode: ensured.contact.phoneDialCode ?? "",
        country: ensured.contact.country ?? "",
        city: ensured.contact.city ?? "",
      };
    }
  }

  const created = await prisma.moduleRecord.create({
    data: {
      moduleKey,
      data: dataPayload as Prisma.InputJsonValue,
      status,
      createdById: session!.sub,
      updatedById: session!.sub,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: moduleKey,
    sourceId: created.id,
    body,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json(
    {
      id: created.id,
      clientId: dataPayload.clientId ?? null,
      phone: dataPayload.phone ?? null,
      country: dataPayload.country ?? null,
      city: dataPayload.city ?? null,
    },
    { status: 201 }
  );
}
