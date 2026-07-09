import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { labelChannel } from "@/lib/notifications";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { rule: true, officeBranch: true },
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      rule: l.rule?.title ?? "—",
      channel: labelChannel(l.channel),
      recipient: l.recipient,
      subject: l.subject ?? "—",
      provider: l.provider,
      status: l.status,
      branch: l.officeBranch?.name ?? "—",
      sentAt: l.sentAt ?? "—",
    }))
  );
}
