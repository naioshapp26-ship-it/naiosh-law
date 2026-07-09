import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  return withApiError(async () => {
    const items = await prisma.circularInstruction.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { circularNo: { contains: q, mode: "insensitive" } },
                { issuer: { contains: q, mode: "insensitive" } },
                { summary: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { issueDate: "desc" },
      include: { branch: true },
    });

    return NextResponse.json(
      items.map((c) => ({
        id: c.id,
        circularNo: c.circularNo,
        title: c.title,
        issuer: c.issuer,
        branch: c.branch?.name ?? "—",
        issueDate: c.issueDate,
        effectiveDate: c.effectiveDate ?? "—",
        summary: c.summary ?? "",
        status: c.status,
        tags: c.tags ?? "",
      }))
    );
  }, "List circular instructions");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const circularNo = requiredString(body, { field: "circularNo", label: "رقم التعليمات" });
  if (circularNo.error) return circularNo.error;
  const title = requiredString(body, { field: "title", label: "عنوان التعليمات" });
  if (title.error) return title.error;
  const issuer = requiredString(body, { field: "issuer", label: "الجهة المصدرة" });
  if (issuer.error) return issuer.error;
  const issueDate = requiredString(body, { field: "issueDate", label: "تاريخ الإصدار" });
  if (issueDate.error) return issueDate.error;

  return withApiError(async () => {
    const created = await prisma.circularInstruction.create({
      data: {
        circularNo: circularNo.value,
        title: title.value,
        issuer: issuer.value,
        branchId: nullableString(body.branchId),
        issueDate: issueDate.value,
        effectiveDate: nullableString(body.effectiveDate),
        summary: nullableString(body.summary),
        content: nullableString(body.content),
        status: nullableString(body.status) ?? "ساري",
        tags: nullableString(body.tags),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create circular instruction");
}
