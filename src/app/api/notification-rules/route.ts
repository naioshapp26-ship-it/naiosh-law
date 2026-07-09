import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody } from "@/lib/api-helpers";
import { labelChannel } from "@/lib/notifications";
import type { NotificationChannel } from "@/generated/prisma/client";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const rules = await prisma.notificationRule.findMany({
    orderBy: { createdAt: "desc" },
    include: { officeBranch: true },
  });

  return NextResponse.json(
    rules.map((r) => ({
      id: r.id,
      title: r.title,
      trigger: r.trigger,
      channel: labelChannel(r.channel),
      audience: r.audience,
      branch: r.officeBranch?.name ?? "كل الفروع",
      sent: r.sentCount,
      status: r.status,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const created = await prisma.notificationRule.create({
    data: {
      title: String(body.title ?? ""),
      trigger: String(body.trigger ?? ""),
      channel: (body.channel as NotificationChannel) ?? "email",
      audience: String(body.audience ?? "الجميع"),
      status: String(body.status ?? "نشط"),
      templateBody: body.templateBody ? String(body.templateBody) : null,
      officeBranchId: body.officeBranchId ? String(body.officeBranchId) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
