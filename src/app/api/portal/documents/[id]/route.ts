import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const { id } = await params;

  if (isDemoPortalSession(session) && id.startsWith("demo-doc-")) {
    return NextResponse.json({
      document: { id, title: "مستند تجريبي", status: "متاح (تجريبي)", fileUrl: null, isDemo: true },
    });
  }

  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  try {
    const prisma = getPrisma();
    const doc = await prisma.clientPortalDocument.findFirst({
      where: { id, clientId: profile.id },
    });
    if (!doc) return NextResponse.json({ error: "المستند غير موجود أو غير مصرح" }, { status: 404 });
    return NextResponse.json({ document: doc });
  } catch {
    return NextResponse.json({ error: "تعذر جلب المستند" }, { status: 500 });
  }
}
