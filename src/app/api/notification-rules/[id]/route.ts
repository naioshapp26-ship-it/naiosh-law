import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import type { NotificationChannel } from "@/generated/prisma/client";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.notificationRule.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      trigger: body.trigger !== undefined ? String(body.trigger) : undefined,
      channel: body.channel !== undefined ? (body.channel as NotificationChannel) : undefined,
      audience: body.audience !== undefined ? String(body.audience) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "notifications-center",
    sourceId: id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.notificationRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
