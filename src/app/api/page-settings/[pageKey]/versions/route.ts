import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getPageDefinition } from "@/lib/page-settings/registry";
import {
  assertNotClient,
  canManagePageSettings,
  listPageSettingVersions,
  resolvePageSettings,
  restorePageSettingVersion,
} from "@/lib/page-settings/server";

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }
  if (!canManagePageSettings(session!.role, pageKey)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  if (!getPageDefinition(pageKey)) {
    return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  }

  const versions = await listPageSettingVersions({ pageKey, limit: 25 });
  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      label: v.label,
      createdAt: v.createdAt.toISOString(),
      createdById: v.createdById,
    })),
  });
}

export async function POST(request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }
  if (!canManagePageSettings(session!.role, pageKey)) {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const versionId = body?.versionId ? String(body.versionId) : "";
  if (!versionId) {
    return NextResponse.json({ error: "معرّف النسخة مطلوب" }, { status: 400 });
  }

  const result = await restorePageSettingVersion({
    pageKey,
    versionId,
    userId: session!.sub,
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const resolved = await resolvePageSettings({
    pageKey,
    role: session!.role,
    userId: session!.sub,
  });
  return NextResponse.json({ ok: true, action: "restore", resolved });
}
