import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

type CaseBody = NonNullable<Awaited<ReturnType<typeof readJsonObject>>["body"]>;

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}

function caseNumberForAttempt(count: number, attempt: number) {
  return `#${new Date().getFullYear()}-${String(count + attempt + 1).padStart(4, "0")}`;
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, branch: true, specialization: true },
  });

  return NextResponse.json(
    cases.map((c) => ({
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
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const suppliedCaseNo = String(body.caseNo ?? "").trim();

  try {
    const created = await createCaseWithRetry(body, suppliedCaseNo);
    return NextResponse.json({ id: created.id, caseNo: created.caseNo }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "فشل إنشاء القضية");
  }
}

async function createCaseWithRetry(body: CaseBody, suppliedCaseNo: string) {
  const maxAttempts = suppliedCaseNo ? 1 : 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const count = await tx.case.count();
        const clientName = String(body.client ?? "").trim();
        const client = clientName
          ? await tx.client.findFirst({ where: { name: clientName }, select: { id: true } })
          : null;

        const item = await tx.case.create({
          data: {
            caseNo: suppliedCaseNo || caseNumberForAttempt(count, attempt),
            clientId: client?.id,
            clientName,
            type: String(body.type ?? "مدني"),
            court: String(body.court ?? ""),
            status: String(body.status ?? "نشطة"),
            nextDate: body.nextDate ? String(body.nextDate) : null,
            fees: body.fees != null ? String(body.fees) : null,
            notes: body.notes ? String(body.notes) : null,
          },
        });

        if (client) {
          const casesCount = await tx.case.count({ where: { clientId: client.id } });
          await tx.client.update({
            where: { id: client.id },
            data: { casesCount },
          });
        }

        return item;
      });
    } catch (error) {
      lastError = error;
      if (suppliedCaseNo || !isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}
