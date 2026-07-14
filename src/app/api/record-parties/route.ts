import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

function mapParty(row: {
  id: string;
  sourceModule: string;
  sourceId: string;
  sourceRef: string | null;
  firstParty: string | null;
  firstPartyPhone: string | null;
  secondParty: string | null;
  secondPartyPhone: string | null;
  updatedBy: string | null;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    sourceModule: row.sourceModule,
    sourceId: row.sourceId,
    sourceRef: row.sourceRef ?? "",
    firstParty: row.firstParty ?? "",
    firstPartyPhone: row.firstPartyPhone ?? "",
    secondParty: row.secondParty ?? "",
    secondPartyPhone: row.secondPartyPhone ?? "",
    updatedBy: row.updatedBy ?? "",
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const sourceModule = searchParams.get("sourceModule");
    const sourceId = searchParams.get("sourceId");
    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "sourceModule و sourceId مطلوبان" }, { status: 400 });
    }

    const row = await prisma.recordParty.findUnique({
      where: { sourceModule_sourceId: { sourceModule, sourceId } },
    });
    return NextResponse.json(row ? mapParty(row) : null);
  } catch (e) {
    console.error("[record-parties GET]", e);
    return NextResponse.json({ error: "تعذر تحميل بيانات الأطراف" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  try {
    const body = await request.json();
    const sourceModule = String(body.sourceModule ?? "");
    const sourceId = String(body.sourceId ?? "");
    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "بيانات المرجع ناقصة" }, { status: 400 });
    }

    const data = {
      sourceRef: body.sourceRef ? String(body.sourceRef) : null,
      firstParty: body.firstParty ? String(body.firstParty) : null,
      firstPartyPhone: body.firstPartyPhone ? String(body.firstPartyPhone) : null,
      secondParty: body.secondParty ? String(body.secondParty) : null,
      secondPartyPhone: body.secondPartyPhone ? String(body.secondPartyPhone) : null,
      updatedBy: session?.name ?? session?.email ?? null,
    };

    const row = await prisma.recordParty.upsert({
      where: { sourceModule_sourceId: { sourceModule, sourceId } },
      create: { sourceModule, sourceId, ...data },
      update: data,
    });

    return NextResponse.json(mapParty(row), { status: 201 });
  } catch (e) {
    console.error("[record-parties POST]", e);
    return NextResponse.json({ error: "فشل حفظ بيانات الأطراف" }, { status: 500 });
  }
}
