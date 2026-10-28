/**
 * Authorized legal datasets for NAIOSH LAW data analysis.
 * Filters client-role users to their own records. Never fabricates values.
 */

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export type LegalDatasetKey = "cases" | "sessions" | "clients" | "finance";

export const LEGAL_DATASET_META: Record<
  LegalDatasetKey,
  { label: string; description: string; staffOnly?: boolean }
> = {
  cases: {
    label: "القضايا",
    description: "رقم القضية، الموكل، النوع، المحكمة، الحالة، الرسوم، التواريخ",
  },
  sessions: {
    label: "الجلسات",
    description: "القضية، الموكل، المحكمة، التاريخ، الحالة، المحامي",
  },
  clients: {
    label: "الموكلين",
    description: "الاسم، النوع، الدولة، المدينة، عدد القضايا، الحالة",
  },
  finance: {
    label: "المحاسبة القانونية",
    description: "المرجع، الموكل، النوع، المبلغ، الحالة، التاريخ",
  },
};

export async function resolveClientScope(opts: {
  role: UserRole;
  userId: string;
}): Promise<{ all: boolean; clientId: string | null }> {
  if (opts.role !== "client") return { all: true, clientId: null };
  const linked = await prisma.client.findFirst({
    where: { userId: opts.userId },
    select: { id: true },
  });
  return { all: false, clientId: linked?.id ?? null };
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function loadLegalDataset(
  key: LegalDatasetKey,
  scope: { all: boolean; clientId: string | null }
): Promise<{ headers: string[]; rows: Array<Record<string, unknown>>; csv: string }> {
  if (!scope.all && !scope.clientId) {
    return { headers: [], rows: [], csv: "" };
  }

  if (key === "cases") {
    const cases = await prisma.case.findMany({
      where: scope.all ? undefined : { clientId: scope.clientId! },
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { client: { select: { country: true, city: true } } },
    });
    const headers = [
      "caseNo",
      "client",
      "type",
      "court",
      "status",
      "nextDate",
      "fees",
      "country",
      "city",
      "createdAt",
    ];
    const rows = cases.map((c) => ({
      caseNo: c.caseNo,
      client: c.clientName,
      type: c.type,
      court: c.court,
      status: c.status,
      nextDate: c.nextDate ?? "",
      fees: Number(String(c.fees ?? "").replace(/[^\d.-]/g, "")) || 0,
      country: c.client?.country ?? "",
      city: c.client?.city ?? "",
      createdAt: c.createdAt.toISOString().slice(0, 10),
    }));
    return { headers, rows, csv: rowsToCsv(headers, rows) };
  }

  if (key === "sessions") {
    const sessions = await prisma.courtSession.findMany({
      where: scope.all
        ? undefined
        : { case: { clientId: scope.clientId! } },
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { case: { select: { clientId: true, clientName: true } } },
    });
    const headers = [
      "caseNo",
      "client",
      "court",
      "date",
      "time",
      "type",
      "status",
      "lawyer",
    ];
    const rows = sessions.map((s) => ({
      caseNo: s.caseNo ?? "",
      client: s.client ?? s.case?.clientName ?? "",
      court: s.court,
      date: s.date,
      time: s.time ?? "",
      type: s.type,
      status: s.status,
      lawyer: s.lawyer ?? "",
    }));
    return { headers, rows, csv: rowsToCsv(headers, rows) };
  }

  if (key === "clients") {
    const clients = await prisma.client.findMany({
      where: scope.all ? undefined : { id: scope.clientId! },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    const headers = [
      "name",
      "type",
      "country",
      "city",
      "casesCount",
      "status",
      "since",
    ];
    const rows = clients.map((c) => ({
      name: c.name,
      type: c.type,
      country: c.country ?? "",
      city: c.city ?? "",
      casesCount: c.casesCount,
      status: c.status,
      since: c.since.toISOString().slice(0, 10),
    }));
    return { headers, rows, csv: rowsToCsv(headers, rows) };
  }

  // finance
  const records = await prisma.financialRecord.findMany({
    where: scope.all ? undefined : { clientId: scope.clientId! },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { client: { select: { name: true } } },
  });
  const headers = [
    "invoiceNo",
    "client",
    "type",
    "amount",
    "paid",
    "status",
    "issueDate",
    "caseRef",
  ];
  const rows = records.map((r) => ({
    invoiceNo: r.invoiceNo,
    client: r.client?.name ?? r.clientName,
    type: r.type,
    amount: r.amount,
    paid: r.paid,
    status: r.status,
    issueDate: r.issueDate,
    caseRef: r.caseRef ?? "",
  }));
  return { headers, rows, csv: rowsToCsv(headers, rows) };
}
