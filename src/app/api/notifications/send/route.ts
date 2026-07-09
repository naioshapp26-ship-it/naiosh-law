import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite, parseJsonBody } from "@/lib/api-helpers";
import { dispatchNotification } from "@/lib/notifications";
import type { NotificationChannel } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  const channel = (body.channel as NotificationChannel) ?? "email";
  const recipient = String(body.recipient ?? "");
  const subject = body.subject ? String(body.subject) : undefined;
  const message = String(body.body ?? body.message ?? "");
  const ruleId = body.ruleId ? String(body.ruleId) : null;
  const officeBranchId = body.officeBranchId ? String(body.officeBranchId) : null;

  if (!recipient || !message) {
    return NextResponse.json({ error: "المستلم والرسالة مطلوبان" }, { status: 400 });
  }

  const result = await dispatchNotification({ channel, recipient, subject, body: message });
  const sentAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const log = await prisma.notificationLog.create({
    data: {
      ruleId,
      channel,
      provider: result.provider,
      recipient,
      subject: subject ?? null,
      body: message,
      status: result.status,
      errorMessage: result.errorMessage ?? null,
      officeBranchId,
      sentAt,
    },
  });

  if (ruleId && result.success) {
    await prisma.notificationRule.update({
      where: { id: ruleId },
      data: { sentCount: { increment: 1 } },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session!.sub,
      action: "send_notification",
      entity: "notification",
      entityId: log.id,
      details: `${channel} → ${recipient} (${result.simulated ? "محاكاة" : "حقيقي"})`,
    },
  });

  return NextResponse.json({
    id: log.id,
    success: result.success,
    simulated: result.simulated,
    status: result.status,
    provider: result.provider,
  });
}
