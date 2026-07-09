import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

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
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const created = await prisma.circularInstruction.create({
    data: {
      circularNo: String(body.circularNo ?? ""),
      title: String(body.title ?? ""),
      issuer: String(body.issuer ?? ""),
      branchId: body.branchId ? String(body.branchId) : null,
      issueDate: String(body.issueDate ?? ""),
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : null,
      summary: body.summary ? String(body.summary) : null,
      content: body.content ? String(body.content) : null,
      status: String(body.status ?? "ساري"),
      tags: body.tags ? String(body.tags) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
