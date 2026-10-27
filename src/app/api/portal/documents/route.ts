import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalDocuments, loadPortalProfile } from "@/lib/client-portal-data";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

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

  const contentType = request.headers.get("content-type") || "";
  let title = "";
  let category = "عام";
  let caseId: string | null = null;
  let fileName: string | null = null;
  let fileUrl: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      title = String(form.get("title") ?? "").trim();
      category = String(form.get("category") ?? "عام").trim() || "عام";
      const caseRaw = form.get("caseId");
      caseId = caseRaw ? String(caseRaw) : null;
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "الحد الأقصى لحجم الملف 10MB" }, { status: 400 });
      }
      mimeType = file.type || null;
      if (!mimeType || !ALLOWED_MIME.includes(mimeType)) {
        return NextResponse.json({ error: "نوع الملف غير مسموح (PDF / JPEG / PNG / WEBP)" }, { status: 400 });
      }
      fileName = file.name || `${title || "document"}.bin`;
      sizeBytes = file.size;
      const buf = Buffer.from(await file.arrayBuffer());
      fileUrl = `data:${mimeType};base64,${buf.toString("base64")}`;
    } else {
      const body = await request.json();
      title = String(body.title ?? "").trim();
      category = String(body.category ?? "عام").trim() || "عام";
      caseId = body.caseId ? String(body.caseId) : null;
      fileName = body.fileName ? String(body.fileName) : null;
      fileUrl = body.fileUrl ? String(body.fileUrl) : null;
      mimeType = body.mimeType ? String(body.mimeType) : null;
      sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : null;

      if (sizeBytes != null && sizeBytes > MAX_BYTES) {
        return NextResponse.json({ error: "الحد الأقصى لحجم الملف 10MB" }, { status: 400 });
      }
      if (mimeType && !ALLOWED_MIME.includes(mimeType)) {
        return NextResponse.json({ error: "نوع الملف غير مسموح" }, { status: 400 });
      }
      if (fileUrl && fileUrl.startsWith("data:")) {
        const approx = Math.floor((fileUrl.length * 3) / 4);
        if (approx > MAX_BYTES) {
          return NextResponse.json({ error: "الحد الأقصى لحجم الملف 10MB" }, { status: 400 });
        }
        sizeBytes = sizeBytes ?? approx;
      }
    }
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الرفع" }, { status: 400 });
  }

  if (!title) return NextResponse.json({ error: "عنوان المستند مطلوب" }, { status: 400 });
  if (!fileUrl && !fileName) {
    return NextResponse.json({ error: "الملف مطلوب للرفع" }, { status: 400 });
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

    await prisma.clientPortalNotification.create({
      data: {
        clientId: profile.id,
        title: "تم استلام مستندك",
        body: `${title} — بانتظار مراجعة المكتب`,
        category: "مستندات",
        href: "/portal/documents",
        read: false,
        isDemo: false,
      },
    });

    return NextResponse.json(
      {
        document: {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          fileName: doc.fileName,
          status: doc.status,
          createdAt: doc.createdAt.toISOString().slice(0, 10),
          hasFile: Boolean(doc.fileUrl),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "تعذر رفع المستند", details: message }, { status: 500 });
  }
}
