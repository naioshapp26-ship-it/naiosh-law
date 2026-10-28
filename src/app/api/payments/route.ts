import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import type { PaymentMethod } from "@/generated/prisma/client";
import {
  findClientContactById,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "نقدي",
  transfer: "تحويل بنكي",
  check: "شيك",
  payment_gateway: "بوابة دفع",
};

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;
  const canView = canViewPersonContact(session!.role);

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      record: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              phoneDialCode: true,
              phoneSecondary: true,
              phoneSecondaryDialCode: true,
              primaryPhoneSlot: true,
              country: true,
              city: true,
              countrySecondary: true,
              citySecondary: true,
              primaryAddressSlot: true,
            },
          },
        },
      },
    },
  });

  const out = [];
  for (const p of payments) {
    let contact = p.record?.client ?? null;
    if (!contact && p.record?.clientId) {
      contact = await findClientContactById(p.record.clientId);
    }
    if (!contact && p.record?.clientName) {
      contact = await findClientContactByName(p.record.clientName);
    }
    out.push(
      mapRowWithClientContact(
        {
          id: p.id,
          invoiceNo: p.record?.invoiceNo ?? "—",
          client: p.record?.clientName ?? "—",
          amount: String(p.amount),
          method: methodLabels[p.method] ?? p.method,
          reference: p.reference ?? "—",
          paidAt: p.paidAt,
          notes: p.notes ?? "",
          recordId: p.recordId ?? "",
        },
        contact,
        canView ? session!.role : null
      )
    );
  }
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const recordId = body.recordId ? String(body.recordId) : null;
  const amount = Number(body.amount ?? 0);

  const payment = await prisma.payment.create({
    data: {
      recordId,
      amount,
      method: (body.method as PaymentMethod) ?? "cash",
      reference: body.reference ? String(body.reference) : null,
      paidAt: String(body.paidAt ?? new Date().toISOString().slice(0, 10)),
      notes: body.notes ? String(body.notes) : null,
    },
  });

  if (recordId) {
    const record = await prisma.financialRecord.findUnique({ where: { id: recordId } });
    if (record) {
      const newPaid = record.paid + amount;
      const status =
        newPaid >= record.amount ? "مسدد بالكامل" : newPaid > 0 ? "مسدد جزئياً" : "غير مسدد";
      await prisma.financialRecord.update({
        where: { id: recordId },
        data: { paid: newPaid, status },
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
