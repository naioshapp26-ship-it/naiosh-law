import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprover } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireApprover();
  if (error) return error;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      user: l.user?.name ?? "النظام",
      action: l.action,
      entity: l.entity,
      entityId: l.entityId ?? "—",
      details: l.details ?? "—",
      severity: l.severity,
      ip: l.ipAddress ?? "—",
      time: l.createdAt.toISOString().slice(0, 16).replace("T", " "),
    }))
  );
}
