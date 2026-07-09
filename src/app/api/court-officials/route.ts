import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");

  const officials = await prisma.courtOfficial.findMany({
    where: entityId ? { entityId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { entity: true },
  });

  return NextResponse.json(officials);
}
