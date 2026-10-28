/**
 * Server-only case identity resolvers (Prisma).
 * Import only from API routes / server modules — never from client components.
 */

import { prisma } from "@/lib/prisma";
import type { CaseLink, CaseResolveResult } from "@/lib/case-identity";
import { NO_LINKED_CASE } from "@/lib/case-identity";

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
