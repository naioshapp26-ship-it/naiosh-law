import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q");

  return withApiError(async () => {
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
      }))
    );
  }, "List legal articles");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const title = requiredString(body, { field: "title", label: "عنوان المقال" });
  if (title.error) return title.error;

  return withApiError(async () => {
    const created = await prisma.legalArticle.create({
      data: {
        title: title.value,
        author: nullableString(body.author),
        branchId: nullableString(body.branchId),
        specializationId: nullableString(body.specializationId),
        summary: nullableString(body.summary),
        content: nullableString(body.content),
        tags: nullableString(body.tags),
        readMinutes: body.readMinutes != null ? Number(body.readMinutes) || null : null,
        status: nullableString(body.status) ?? "منشور",
        publishedAt: nullableString(body.publishedAt),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create legal article");
}
