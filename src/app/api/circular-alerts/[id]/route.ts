import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.circularAlert.update({
    where: { id },
    data: {
      status: body.status !== undefined ? String(body.status) : undefined,
      acknowledgedAt:
        body.acknowledge === true
          ? new Date().toISOString().slice(0, 16).replace("T", " ")
          : body.acknowledgedAt !== undefined
            ? String(body.acknowledgedAt)
            : undefined,
    },
  });
  return NextResponse.json(updated);
}
