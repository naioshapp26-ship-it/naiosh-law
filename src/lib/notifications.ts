import type { NotificationChannel, NotificationProvider } from "@/generated/prisma/client";

export type SendNotificationInput = {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
};

export type SendNotificationResult = {
  success: boolean;
  provider: NotificationProvider;
  status: string;
  errorMessage?: string;
  simulated: boolean;
};

export async function sendEmail(
  recipient: string,
  subject: string,
  body: string
): Promise<SendNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Naiosh Law <noreply@naioshlaw.com>";

  if (!apiKey) {
    return {
      success: true,
      provider: "internal",
      status: "محاكاة — أضف RESEND_API_KEY للإرسال الحقيقي",
      simulated: true,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [recipient], subject, html: `<p dir="rtl">${body}</p>` }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, provider: "resend", status: "فشل", errorMessage: err, simulated: false };
    }

    return { success: true, provider: "resend", status: "مرسل", simulated: false };
  } catch (e) {
    return {
      success: false,
      provider: "resend",
      status: "فشل",
      errorMessage: e instanceof Error ? e.message : "خطأ غير معروف",
      simulated: false,
    };
  }
}

export async function sendSms(
  recipient: string,
  body: string
): Promise<SendNotificationResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return {
      success: true,
      provider: "internal",
      status: "محاكاة — أضف TWILIO_* للإرسال الحقيقي",
      simulated: true,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ To: recipient, From: from, Body: body });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, provider: "twilio", status: "فشل", errorMessage: err, simulated: false };
    }

    return { success: true, provider: "twilio", status: "مرسل", simulated: false };
  } catch (e) {
    return {
      success: false,
      provider: "twilio",
      status: "فشل",
      errorMessage: e instanceof Error ? e.message : "خطأ غير معروف",
      simulated: false,
    };
  }
}

export async function sendWhatsApp(
  recipient: string,
  body: string
): Promise<SendNotificationResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886";

  if (!sid || !token) {
    return {
      success: true,
      provider: "internal",
      status: "محاكاة — أضف TWILIO_* للإرسال الحقيقي",
      simulated: true,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const to = recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`;
    const params = new URLSearchParams({ To: to, From: from, Body: body });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, provider: "twilio", status: "فشل", errorMessage: err, simulated: false };
    }

    return { success: true, provider: "twilio", status: "مرسل", simulated: false };
  } catch (e) {
    return {
      success: false,
      provider: "twilio",
      status: "فشل",
      errorMessage: e instanceof Error ? e.message : "خطأ غير معروف",
      simulated: false,
    };
  }
}

export async function dispatchNotification(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  switch (input.channel) {
    case "email":
      return sendEmail(input.recipient, input.subject ?? "إشعار من Naiosh Law", input.body);
    case "sms":
      return sendSms(input.recipient, input.body);
    case "whatsapp":
      return sendWhatsApp(input.recipient, input.body);
    case "in_app":
      return { success: true, provider: "internal", status: "محفوظ في النظام", simulated: false };
    default:
      return { success: false, provider: "internal", status: "فشل", errorMessage: "قناة غير مدعومة", simulated: false };
  }
}

const channelLabels: Record<NotificationChannel, string> = {
  email: "بريد إلكتروني",
  sms: "رسالة نصية",
  whatsapp: "واتساب",
  in_app: "إشعار النظام",
};

export function labelChannel(channel: NotificationChannel) {
  return channelLabels[channel] ?? channel;
}

const integrationTypeLabels: Record<string, string> = {
  email: "بريد إلكتروني",
  sms: "رسائل نصية",
  whatsapp: "واتساب",
  payment: "مدفوعات",
  webhook: "Webhook",
  other: "أخرى",
};

export function labelIntegrationType(type: string) {
  return integrationTypeLabels[type] ?? type;
}
