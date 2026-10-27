import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const { id } = await params;
  const wantDownload = new URL(req.url).searchParams.get("download") === "1";

  if (isDemoPortalSession(session) && id.startsWith("demo-doc-")) {
    return NextResponse.json({
      document: {
        id,
        title: "مستند تجريبي",
        status: "متاح (تجريبي)",
        fileUrl: null,
        fileName: "demo.pdf",
        isDemo: true,
        downloadable: false,
      },
      note: "المستندات التجريبية للعرض فقط ولا تُنزَّل.",
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

    if (wantDownload) {
      if (!doc.fileUrl) {
        return NextResponse.json({ error: "لا يوجد ملف قابل للتنزيل لهذا المستند" }, { status: 404 });
      }
      if (doc.fileUrl.startsWith("data:")) {
        const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(doc.fileUrl);
        if (!match) {
          return NextResponse.json({ error: "صيغة الملف غير صالحة" }, { status: 500 });
        }
        const mime = match[1];
        const buf = Buffer.from(match[2], "base64");
        const filename = doc.fileName || `${doc.title || "document"}.bin`;
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            "Content-Length": String(buf.length),
            "Cache-Control": "private, no-store",
          },
        });
      }
      // External URL — redirect only if owned record points there
      return NextResponse.redirect(doc.fileUrl);
    }

    return NextResponse.json({
      document: {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        status: doc.status,
        caseId: doc.caseId,
        createdAt: doc.createdAt.toISOString().slice(0, 10),
        isDemo: doc.isDemo,
        downloadable: Boolean(doc.fileUrl),
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر جلب المستند" }, { status: 500 });
  }
}
