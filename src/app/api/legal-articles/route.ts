import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q");

  const items = await prisma.legalArticle.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { author: { contains: q, mode: "insensitive" } },
              { tags: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { branch: true, specialization: true },
  });

  return NextResponse.json(
    items.map((a) => ({
      id: a.id,
      title: a.title,
      author: a.author ?? "—",
      branch: a.branch?.name ?? "—",
      specialization: a.specialization?.name ?? "—",
      summary: a.summary ?? "",
      tags: a.tags ?? "",
      readMinutes: a.readMinutes ?? 5,
      status: a.status,
      publishedAt: a.publishedAt ?? "—",
      mediaUrl: a.mediaUrl ?? "",
      mediaKind: a.mediaKind ?? "",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.legalArticle.create({
    data: {
      title: String(body.title ?? ""),
      author: body.author ? String(body.author) : null,
      branchId: body.branchId ? String(body.branchId) : null,
      specializationId: body.specializationId ? String(body.specializationId) : null,
      summary: body.summary ? String(body.summary) : null,
      content: body.content ? String(body.content) : null,
      mediaUrl: body.mediaUrl ? String(body.mediaUrl) : null,
      mediaKind: body.mediaKind ? String(body.mediaKind) : null,
      tags: body.tags ? String(body.tags) : null,
      readMinutes: body.readMinutes != null ? Number(body.readMinutes) : null,
      status: String(body.status ?? "منشور"),
      publishedAt: body.publishedAt ? String(body.publishedAt) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
