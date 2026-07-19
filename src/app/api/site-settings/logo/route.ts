import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-helpers";
import {
  DEFAULT_SITE_THEME,
  hasHeroBannerMedia,
  heroBannerPublicUrl,
  logoPublicUrl,
  recordToTheme,
} from "@/lib/site-settings";
import {
  deleteLogoMediaFile,
  isDefaultLogoPath,
  readLogoMediaFile,
  resolveLogoUploadFileName,
  saveLogoMediaFile,
} from "@/lib/logo-media-server";

export const runtime = "nodejs";
export const maxDuration = 120;

async function readBundledPublicLogo() {
  try {
    const fullPath = path.join(process.cwd(), "public", "naiosh-logo.png");
    const data = await readFile(fullPath);
    return { data, mimeType: "image/png" as const };
  } catch {
    return null;
  }
}

function toDataUrl(mimeType: string, bytes: Buffer) {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

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
  const customLogo =
    Boolean(theme.logoData?.trim()) ||
    (!isDefaultLogoPath(theme.logoPath) && Boolean(theme.logoPath?.trim()));
  return {
    id: row.id,
    ...theme,
    logoData: null,
    logoPath: customLogo ? logoPublicUrl(row.updatedAt) : "",
    heroBannerData: null,
    heroBannerPath: hasBanner ? heroBannerPublicUrl(row.updatedAt) : null,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Buffer } | null {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return {
      mimeType: match[1] || "application/octet-stream",
      bytes: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

function logoResponse(bytes: Buffer, mimeType: string, immutable = false) {
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": immutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60, must-revalidate",
      "Content-Length": String(bytes.byteLength),
    },
  });
}

/** تقديم الشعار الحالي — ملف مرفوع → قاعدة البيانات → الشعار المدمج */
export async function GET() {
  const row = await getOrCreateSettings();
  const pathValue = row.logoPath?.trim() || null;
  const fileName = resolveLogoUploadFileName(pathValue);

  if (fileName) {
    const media = await readLogoMediaFile(fileName);
    if (media) return logoResponse(media.data, media.mimeType);
  }

  const dataUrl = row.logoData?.trim() || null;
  if (dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (parsed) return logoResponse(parsed.bytes, parsed.mimeType);
  }

  if (pathValue && !isDefaultLogoPath(pathValue) && /^https?:\/\//i.test(pathValue)) {
    return NextResponse.redirect(pathValue);
  }

  const bundled = await readBundledPublicLogo();
  if (bundled) return logoResponse(bundled.data, bundled.mimeType, true);

  return NextResponse.json({ error: "لا يوجد شعار مرفوع" }, { status: 404 });
}

/** رفع شعار جديد واستبدال الثابت فورًا */
export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم استلام ملف" }, { status: 400 });
    }

    const saved = await saveLogoMediaFile(file);
    const current = await getOrCreateSettings();
    await deleteLogoMediaFile(current.logoPath);

    // احتفظ بنسخة في قاعدة البيانات حتى لا يختفي الشعار بعد إعادة نشر Railway
    const durableData = toDataUrl(saved.mimeType, saved.buffer);

    const updated = await prisma.siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...DEFAULT_SITE_THEME,
        logoPath: saved.url,
        logoData: durableData,
        updatedBy: session!.email,
      },
      update: {
        logoPath: saved.url,
        logoData: durableData,
        updatedBy: session!.email,
      },
    });

    return NextResponse.json({
      ...toClientPayload(updated),
      uploaded: {
        url: saved.url,
        mimeType: saved.mimeType,
        size: saved.size,
        fileName: saved.fileName,
      },
      message: "تم استبدال الشعار بنجاح — يظهر في كل الموقع فورًا",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل رفع الشعار";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** إزالة الشعار المخصص بالكامل */
export async function DELETE() {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const current = await getOrCreateSettings();
  await deleteLogoMediaFile(current.logoPath);

  const updated = await prisma.siteSettings.update({
    where: { id: "default" },
    data: {
      logoPath: "",
      logoData: null,
      updatedBy: session!.email,
    },
  });

  return NextResponse.json({
    ...toClientPayload(updated),
    message: "تم إزالة الشعار — ارفع شعارًا جديدًا متى شئت",
  });
}
