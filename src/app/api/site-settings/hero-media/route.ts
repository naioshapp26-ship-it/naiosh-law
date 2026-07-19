import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import {
  DEFAULT_SITE_THEME,
  hasHeroBannerMedia,
  heroBannerPublicUrl,
  recordToTheme,
} from "@/lib/site-settings";
import { deleteHeroMediaFile, saveHeroMediaFile } from "@/lib/hero-media-server";

export const runtime = "nodejs";
/** رفع فيديو/صورة الهيرو قد يستغرق وقتًا على الشبكة للملفات الكبيرة */
export const maxDuration = 300;

async function getOrCreateSettings() {
  let row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await prisma.siteSettings.create({
      data: { id: "default", ...DEFAULT_SITE_THEME },
    });
  }
  return row;
}

function toClientPayload(row: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  const theme = recordToTheme(row);
  const hasBanner = hasHeroBannerMedia(theme);
  return {
    id: row.id,
    ...theme,
    heroBannerData: null,
    heroBannerPath: hasBanner ? heroBannerPublicUrl(row.updatedAt) : null,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** رفع بنر/فيديو الهيرو حتى 100MB */
export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم استلام ملف" }, { status: 400 });
    }

    const saved = await saveHeroMediaFile(file);
    if (saved.kind === "image" && !saved.inlineDataUrl) {
      return NextResponse.json(
        { error: "تعذر حفظ نسخة دائمة من الصورة — جرّب صورة أصغر قليلاً" },
        { status: 400 },
      );
    }

    const current = await getOrCreateSettings();
    await deleteHeroMediaFile(current.heroBannerPath);

    // احفظ مسار الملف + نسخة DB دائمة حتى تبقى بعد إعادة نشر Railway
    const updated = await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...DEFAULT_SITE_THEME,
        heroBannerPath: saved.url,
        heroBannerData: saved.inlineDataUrl,
        heroMediaKind: saved.kind,
        heroActiveType: saved.kind,
        updatedBy: session!.email,
      },
      update: {
        heroBannerPath: saved.url,
        heroBannerData: saved.inlineDataUrl,
        heroMediaKind: saved.kind,
        heroActiveType: saved.kind,
        updatedBy: session!.email,
      },
    });

    // زامن مكتبة الهيرو أيضاً حتى لا تفضّل الصفحة الرئيسية رابط قرص مكسور
    const count = await prisma.homepageHeroMedia.count();
    await prisma.homepageHeroMedia.create({
      data: {
        type: saved.kind,
        url: saved.url,
        dataUrl: saved.inlineDataUrl,
        title: file.name || saved.fileName,
        isActive: true,
        orderIndex: count,
      },
    });

    const payload = toClientPayload(updated);
    return NextResponse.json({
      ...payload,
      uploaded: {
        url: payload.heroBannerPath,
        kind: saved.kind,
        mimeType: saved.mimeType,
        size: saved.size,
        fileName: saved.fileName,
        storedAs: saved.inlineDataUrl ? "database+file" : "file",
      },
      message:
        saved.kind === "video"
          ? "تم رفع فيديو الهيرو بنجاح وظهر على الصفحة الرئيسية"
          : "تم رفع بنر الهيرو بنجاح — محفوظ بشكل دائم",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل رفع الملف";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** إزالة بنر/فيديو الهيرو */
export async function DELETE() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const current = await getOrCreateSettings();
  await deleteHeroMediaFile(current.heroBannerPath);

  const updated = await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      heroBannerPath: null,
      heroBannerData: null,
      heroMediaKind: null,
      updatedBy: session!.email,
    },
  });

  return NextResponse.json({
    ...toClientPayload(updated),
    message: "تم إزالة بنر/فيديو الهيرو",
  });
}
