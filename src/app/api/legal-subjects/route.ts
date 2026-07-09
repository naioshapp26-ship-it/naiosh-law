import { prisma } from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const subjects = await prisma.legalSubject.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { cases: true } } },
  });
  return jsonResponse(subjects);
}
