import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const logs = await prisma.integrationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { integration: true },
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      integration: l.integration.name,
      method: l.method ?? "—",
      path: l.path ?? "—",
      statusCode: l.statusCode ?? "—",
      durationMs: l.durationMs ?? 0,
      success: l.success ? "ناجح" : "فشل",
      error: l.errorMessage ?? "—",
      time: l.createdAt.toISOString().slice(0, 16).replace("T", " "),
    }))
  );
}
