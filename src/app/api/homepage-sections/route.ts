import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

async function listSections() {
  return prisma.homepageSection.findMany({ orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] });
}

export async function GET() {
  const items = await listSections();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const count = await prisma.homepageSection.count();
  const created = await prisma.homepageSection.create({
    data: {
      title: String(body.title || `قسم جديد`),
      description: body.description ? String(body.description) : null,
      link: body.link ? String(body.link) : null,
      iconClass: String(body.iconClass || "fas fa-square"),
      iconUrl: body.iconUrl ? String(body.iconUrl) : null,
      orderIndex: Number.isFinite(Number(body.orderIndex)) ? Number(body.orderIndex) : count + 1,
    },
  });

  return NextResponse.json({ item: created, items: await listSections(), message: "تمت إضافة القسم" });
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const updated = await prisma.homepageSection.update({
    where: { id },
    data: {
      title: body.title !== undefined ? String(body.title) : undefined,
      description: body.description !== undefined ? String(body.description || "") || null : undefined,
      link: body.link !== undefined ? String(body.link || "") || null : undefined,
      iconClass: body.iconClass !== undefined ? String(body.iconClass || "fas fa-square") : undefined,
      iconUrl: body.iconUrl !== undefined ? String(body.iconUrl || "") || null : undefined,
      orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) || 0 : undefined,
    },
  });

  return NextResponse.json({ item: updated, items: await listSections(), message: "تم تحديث القسم" });
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف مطلوب" }, { status: 400 });

  const current = await prisma.homepageSection.findUnique({ where: { id } });
  if (current?.iconUrl?.startsWith("/api/uploads/section/")) {
    const fileName = current.iconUrl.replace("/api/uploads/section/", "");
    if (!fileName.includes("..")) {
      try {
        await unlink(path.join(process.cwd(), ".data", "uploads", "section", fileName));
      } catch {
        /* ignore */
      }
    }
  }

  await prisma.homepageSection.delete({ where: { id } });
  return NextResponse.json({ items: await listSections(), message: "تم حذف القسم" });
}

/** رفع أيقونة قسم */
export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const form = await request.formData();
  const id = String(form.get("id") || "");
  const file = form.get("file");
  if (!id || !(file instanceof File)) {
    return NextResponse.json({ error: "معرّف وملف مطلوبان" }, { status: 400 });
  }

  const root = path.join(process.cwd(), ".data", "uploads", "section");
  await mkdir(root, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const fileName = `section-${Date.now()}-${randomBytes(3).toString("hex")}.${ext}`;
  await writeFile(path.join(root, fileName), Buffer.from(await file.arrayBuffer()));
  const iconUrl = `/api/uploads/section/${fileName}`;

  const updated = await prisma.homepageSection.update({
    where: { id },
    data: { iconUrl },
  });

  return NextResponse.json({ item: updated, items: await listSections(), message: "تم رفع الأيقونة" });
}
