import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite, parseJsonBody, prismaErrorResponse } from "@/lib/api-helpers";
import type { NotificationChannel } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  try {
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
    return NextResponse.json(updated);
  } catch (err) {
    const response = prismaErrorResponse(err);
    if (response) return response;
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.notificationRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const response = prismaErrorResponse(err);
    if (response) return response;
    throw err;
  }
}
