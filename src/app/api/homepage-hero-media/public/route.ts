import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicHeroMediaItem } from "@/lib/hero-media-server";

export const runtime = "nodejs";

/** وسائط الهيرو الظاهرة للعامة (الصفحة الرئيسية) — بروابط دائمة */
export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  let items = await prisma.homepageHeroMedia.findMany({
    where: { isActive: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

  // اشفِ العناصر القديمة التي بلا dataUrl من بنر الإعدادات الدائم
  if (settings?.heroBannerData?.trim()) {
    const missing = items.filter((i) => !i.dataUrl?.trim());
    if (missing.length) {
      await Promise.all(
        missing.map((i) =>
          prisma.homepageHeroMedia
            .update({
              where: { id: i.id },
              data: { dataUrl: settings.heroBannerData },
            })
            .catch(() => null),
        ),
      );
      items = await prisma.homepageHeroMedia.findMany({
        where: { isActive: true },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      });
    }
  }

  // إن كانت المكتبة فارغة لكن بنر الإعدادات موجود، أعِد عنصراً اصطناعياً من المسار الدائم
  if (items.length === 0) {
    if (settings?.heroBannerData?.trim() || settings?.heroBannerPath?.trim()) {
      return NextResponse.json({
        items: [
          {
            id: "site-settings-banner",
            type: settings.heroMediaKind || settings.heroActiveType || "image",
            url: `/api/site-settings/hero-banner?v=${settings.updatedAt.getTime()}`,
            title: "بنر الهيرو",
            caption: null,
            isActive: true,
            orderIndex: 0,
            createdAt: settings.createdAt.toISOString(),
            updatedAt: settings.updatedAt.toISOString(),
            durable: true,
          },
        ],
      });
    }
  }

  return NextResponse.json({ items: items.map(toPublicHeroMediaItem) });
}
