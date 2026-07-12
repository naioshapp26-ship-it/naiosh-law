import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const alerts = await prisma.circularAlert.findMany({
    orderBy: { createdAt: "desc" },
    include: { branch: true },
  });

  return NextResponse.json(
    alerts.map((a) => ({
      id: a.id,
      title: a.title,
      circularRef: a.circularRef ?? "—",
      message: a.message ?? "",
      priority: a.priority,
      status: a.status,
      dueDate: a.dueDate ?? "—",
      branch: a.branch?.name ?? "كل الفروع",
      acknowledgedAt: a.acknowledgedAt ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.circularAlert.create({
    data: {
      title: String(body.title ?? ""),
      circularRef: body.circularRef ? String(body.circularRef) : null,
      message: body.message ? String(body.message) : null,
      priority: String(body.priority ?? "متوسط"),
      status: String(body.status ?? "جديد"),
      dueDate: body.dueDate ? String(body.dueDate) : null,
      branchId: body.branchId ? String(body.branchId) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
