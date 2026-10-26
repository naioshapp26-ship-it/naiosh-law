import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalDocuments, loadPortalProfile } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const documents = await loadPortalDocuments(session);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;

  if (isDemoPortalSession(session)) {
    return NextResponse.json(
      { error: "الحساب التجريبي لا يخزّن مرفوعات على بيئة الإنتاج." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "عام").trim() || "عام";
  const caseId = body.caseId ? String(body.caseId) : null;
  const fileName = body.fileName ? String(body.fileName) : null;
  const fileUrl = body.fileUrl ? String(body.fileUrl) : null;
  const mimeType = body.mimeType ? String(body.mimeType) : null;
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : null;

  if (!title) return NextResponse.json({ error: "عنوان المستند مطلوب" }, { status: 400 });
  if (sizeBytes != null && sizeBytes > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "الحد الأقصى لحجم الملف 10MB" }, { status: 400 });
  }
  if (mimeType && !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return NextResponse.json({ error: "نوع الملف غير مسموح" }, { status: 400 });
  }

  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  try {
    const prisma = getPrisma();
    if (caseId) {
      const owned = await prisma.case.findFirst({ where: { id: caseId, clientId: profile.id } });
      if (!owned) return NextResponse.json({ error: "القضية غير مرتبطة بحسابك" }, { status: 403 });
    }
    const doc = await prisma.clientPortalDocument.create({
      data: {
        clientId: profile.id,
        caseId,
        title,
        category,
        fileName,
        fileUrl,
        mimeType,
        sizeBytes: sizeBytes ?? undefined,
        status: "قيد المراجعة",
        isDemo: false,
      },
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "تعذر رفع المستند", details: message }, { status: 500 });
  }
}
