import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { labelChannel } from "@/lib/notifications";
import type { NotificationChannel } from "@/generated/prisma/client";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const rules = await prisma.notificationRule.findMany({
    orderBy: { createdAt: "desc" },
    include: { officeBranch: true },
  });

  const base = rules.map((r) => ({
    id: r.id,
    title: r.title,
    trigger: r.trigger,
    channel: labelChannel(r.channel),
    audience: r.audience,
    branch: r.officeBranch?.name ?? "كل الفروع",
    sent: r.sentCount,
    status: r.status,
  }));
  return NextResponse.json(await attachCustomValuesToRows("notifications-center", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const gate = await assertPageAction({
    pageKey: "notifications-center",
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;
  const body = await request.json();

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

  await persistCustomFieldsFromBody({
    sourceModule: "notifications-center",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json(created, { status: 201 });
}
