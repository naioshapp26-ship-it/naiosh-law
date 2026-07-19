import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { deleteHeroMediaFile, saveHeroMediaFile } from "@/lib/hero-media-server";

export const runtime = "nodejs";
export const maxDuration = 300;

async function listMedia() {
  return prisma.homepageHeroMedia.findMany({ orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] });
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const items = await listMedia();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم استلام ملف" }, { status: 400 });
    }

    const caption = String(form.get("caption") || "").trim() || null;
    const saved = await saveHeroMediaFile(file);
    const count = await prisma.homepageHeroMedia.count();

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        heroBannerPath: saved.url,
        heroBannerData: saved.inlineDataUrl,
        heroMediaKind: saved.kind,
      },
      update: {
        heroBannerPath: saved.url,
        heroBannerData: saved.inlineDataUrl,
        heroMediaKind: saved.kind,
        heroActiveType: saved.kind,
      },
    });

    const created = await prisma.homepageHeroMedia.create({
      data: {
        type: saved.kind,
        url: saved.url,
        title: file.name || caption || saved.fileName,
        caption,
        isActive: true,
        orderIndex: count,
      },
    });

    return NextResponse.json({
      item: created,
      items: await listMedia(),
      message: saved.kind === "video" ? "تم رفع فيديو الهيرو" : "تم رفع صورة الهيرو",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل الرفع" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const current = await prisma.homepageHeroMedia.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  if (body.action === "toggle") {
    await prisma.homepageHeroMedia.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
  } else if (body.action === "move") {
    const direction = body.direction === "up" ? -1 : 1;
    const items = await listMedia();
    const idx = items.findIndex((i) => i.id === id);
    const swapIdx = idx + direction;
    if (idx >= 0 && swapIdx >= 0 && swapIdx < items.length) {
      const a = items[idx];
      const b = items[swapIdx];
      await prisma.$transaction([
        prisma.homepageHeroMedia.update({ where: { id: a.id }, data: { orderIndex: b.orderIndex } }),
        prisma.homepageHeroMedia.update({ where: { id: b.id }, data: { orderIndex: a.orderIndex } }),
      ]);
    }
  } else {
    await prisma.homepageHeroMedia.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title) : undefined,
        caption: body.caption !== undefined ? String(body.caption) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });
  }

  return NextResponse.json({ items: await listMedia(), message: "تم التحديث" });
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const current = await prisma.homepageHeroMedia.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await deleteHeroMediaFile(current.url);
  await prisma.homepageHeroMedia.delete({ where: { id } });

  return NextResponse.json({ items: await listMedia(), message: "تم حذف الوسائط" });
}
