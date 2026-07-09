import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.integration.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      endpoint: body.endpoint !== undefined ? String(body.endpoint) : undefined,
      status: body.status !== undefined ? String(body.status) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.integration.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const start = Date.now();

  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration) {
    return NextResponse.json({ error: "التكامل غير موجود" }, { status: 404 });
  }

  let success = true;
  let statusCode = 200;
  let errorMessage: string | null = null;

  if (integration.provider === "resend") {
    success = Boolean(process.env.RESEND_API_KEY);
    if (!success) errorMessage = "RESEND_API_KEY غير مضبوط — وضع محاكاة";
    statusCode = success ? 200 : 503;
  } else if (integration.provider === "twilio") {
    success = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    if (!success) errorMessage = "TWILIO_* غير مضبوط — وضع محاكاة";
    statusCode = success ? 200 : 503;
  }

  const durationMs = Date.now() - start;
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  await prisma.integrationLog.create({
    data: {
      integrationId: id,
      method: "GET",
      path: integration.endpoint ?? "/health",
      statusCode,
      durationMs,
      success,
      errorMessage,
    },
  });

  await prisma.integration.update({
    where: { id },
    data: {
      lastChecked: `منذ لحظات (${now})`,
      callsToday: { increment: 1 },
      status: success ? "متصل" : "تحذير",
    },
  });

  return NextResponse.json({
    success,
    status: success ? "متصل" : "تحذير",
    message: success ? "الاتصال ناجح" : errorMessage ?? "فشل الاتصال",
    durationMs,
  });
}
