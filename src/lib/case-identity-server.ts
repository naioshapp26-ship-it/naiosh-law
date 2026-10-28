/**
 * Server-only case identity resolvers (Prisma).
 * Import only from API routes / server modules — never from client components.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CaseLink, CaseResolveResult } from "@/lib/case-identity";
import { NO_LINKED_CASE } from "@/lib/case-identity";
import type { AuthPayload } from "@/lib/auth";

/**
 * Scope Case queries by session role.
 * Clients only see cases linked to their Client record — never the full firm docket.
 */
export async function caseAccessWhere(
  session: Pick<AuthPayload, "sub" | "role" | "email">
): Promise<Prisma.CaseWhereInput | undefined> {
  if (session.role !== "client") return undefined;
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { userId: session.sub },
        ...(session.email ? [{ email: session.email }] : []),
      ],
    },
    select: { id: true },
  });
  if (!client) return { id: "__no_access__" };
  return { clientId: client.id };
}

export async function assertCaseAccessible(
  session: Pick<AuthPayload, "sub" | "role" | "email">,
  caseId: string
): Promise<CaseLink | null> {
  const linked = await resolveCaseById(caseId);
  if (!linked) return null;
  if (session.role !== "client") return linked;
  const where = await caseAccessWhere(session);
  const allowed = await prisma.case.findFirst({
    where: { AND: [{ id: caseId }, where ?? {}] },
    select: { id: true, caseNo: true },
  });
  return allowed;
}

/** Resolve free-text caseRef against canonical Case.caseNo — never guess. */
export async function resolveCaseRef(
  raw: string | null | undefined
): Promise<CaseResolveResult> {
  const text = String(raw ?? "").trim();
  if (!text || text === "—" || text === NO_LINKED_CASE) {
    return { status: "none" };
  }
  const found = await prisma.case.findFirst({
    where: { caseNo: text },
    select: { id: true, caseNo: true },
  });
  if (found) return { status: "linked", case: found };
  return { status: "review", raw: text };
}

export async function resolveCaseById(
  caseId: string | null | undefined
): Promise<CaseLink | null> {
  if (!caseId) return null;
  return prisma.case.findUnique({
    where: { id: String(caseId) },
    select: { id: true, caseNo: true },
  });
}

export async function casesForClientIds(
  clientIds: string[]
): Promise<Map<string, CaseLink[]>> {
  const map = new Map<string, CaseLink[]>();
  if (clientIds.length === 0) return map;
  const rows = await prisma.case.findMany({
    where: { clientId: { in: clientIds } },
    select: { id: true, caseNo: true, clientId: true },
    orderBy: { createdAt: "desc" },
  });
  for (const row of rows) {
    if (!row.clientId) continue;
    const list = map.get(row.clientId) ?? [];
    list.push({ id: row.id, caseNo: row.caseNo });
    map.set(row.clientId, list);
  }
  return map;
}

/** Parse caseIds from request body — only real IDs accepted later by sync. */
export function parseCaseIdsFromBody(body: Record<string, unknown>): string[] | undefined {
  if (!("caseIds" in body) && !("caseLinks" in body) && !("caseId" in body)) {
    return undefined;
  }
  const raw = body.caseIds ?? body.caseLinks;
  if (Array.isArray(raw)) {
    return [
      ...new Set(
        raw
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object" && "id" in item) {
              return String((item as { id: unknown }).id ?? "").trim();
            }
            return "";
          })
          .filter(Boolean)
      ),
    ];
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parseCaseIdsFromBody({ caseIds: parsed });
      }
    } catch {
      /* fall through — single id string */
    }
    return [raw.trim()];
  }
  if (body.caseId) {
    const id = String(body.caseId).trim();
    return id ? [id] : [];
  }
  return [];
}

/**
 * Replace a client's Case.clientId links with the given real case IDs.
 * Rejects unknown IDs (no fake case numbers). Updates casesCount for affected clients.
 */
export async function syncClientCaseLinks(opts: {
  clientId: string;
  clientName: string;
  caseIds: string[];
}): Promise<{ ok: true; links: CaseLink[] } | { ok: false; error: string; status: number }> {
  const unique = [...new Set(opts.caseIds.map(String).filter(Boolean))];

  if (unique.length) {
    const found = await prisma.case.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      return {
        ok: false,
        error: "لا يُسمح بربط رقم قضية غير موجود — اختر من السجل الحقيقي أو أنشئ قضية جديدة",
        status: 400,
      };
    }
  }

  const current = await prisma.case.findMany({
    where: { clientId: opts.clientId },
    select: { id: true },
  });
  const currentIds = new Set(current.map((c) => c.id));
  const nextIds = new Set(unique);
  const toUnlink = [...currentIds].filter((id) => !nextIds.has(id));
  const toLink = unique.filter((id) => !currentIds.has(id));

  // Clients that lose a case when we reassign ownership
  const reassigned = toLink.length
    ? await prisma.case.findMany({
        where: { id: { in: toLink }, clientId: { not: null } },
        select: { clientId: true },
      })
    : [];
  const affectedClientIds = new Set<string>([
    opts.clientId,
    ...reassigned.map((r) => r.clientId!).filter(Boolean),
  ]);

  await prisma.$transaction(async (tx) => {
    if (toUnlink.length) {
      await tx.case.updateMany({
        where: { id: { in: toUnlink }, clientId: opts.clientId },
        data: { clientId: null },
      });
    }
    for (const id of toLink) {
      await tx.case.update({
        where: { id },
        data: { clientId: opts.clientId, clientName: opts.clientName },
      });
    }
    for (const clientId of affectedClientIds) {
      const count = await tx.case.count({ where: { clientId } });
      await tx.client.update({
        where: { id: clientId },
        data: { casesCount: count },
      });
    }
  });

  const links = await prisma.case.findMany({
    where: { clientId: opts.clientId },
    select: { id: true, caseNo: true },
    orderBy: { createdAt: "desc" },
  });
  return { ok: true, links };
}
