import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { getPageDefinition } from "@/lib/page-settings/registry";
import {
  assertNotClient,
  canManagePageSettings,
  getDefaultValues,
  resetPageSettings,
  resolvePageSettings,
  savePageSettings,
} from "@/lib/page-settings/server";
import { prisma } from "@/lib/prisma";
import type { PageSettingsScope } from "@/lib/page-settings/types";

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const isClient = session!.role === "client";
  // Clients may only read the resolved portal settings (no editor definition)
  if (isClient && pageKey !== "client-portal") {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }

  const def = getPageDefinition(pageKey);
  if (!def) {
    return NextResponse.json({ error: "الصفحة غير موجودة في سجل الإعدادات" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.sub },
    select: { officeBranchId: true },
  });

  const resolved = await resolvePageSettings({
    pageKey,
    role: session!.role,
    userId: session!.sub,
    officeBranchId: user?.officeBranchId,
  });

  if (isClient) {
    const v = resolved.values as Record<string, unknown>;
    return NextResponse.json({
      pageKey,
      resolved: {
        pageKey,
        values: {
          specialized: v.specialized ?? {},
          display: v.display ?? {},
          sections: v.sections ?? [],
          sectionData: v.sectionData ?? {},
          customFields: v.customFields ?? [],
        },
      },
      canManage: false,
    });
  }

  return NextResponse.json({
    definition: {
      pageKey: def.pageKey,
      title: def.title,
      description: def.description,
      category: def.category,
      pageHref: def.pageHref,
      settingsHref: def.settingsHref,
      status: def.status,
      icon: def.icon,
      gapReason: def.gapReason ?? null,
      tabs: def.tabs,
      manageRoles: def.manageRoles,
    },
    resolved,
    defaults: getDefaultValues(pageKey),
    canManage: canManagePageSettings(session!.role, pageKey),
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }
  if (!canManagePageSettings(session!.role, pageKey)) {
    return NextResponse.json({ error: "صلاحية غير كافية لتعديل إعدادات هذه الصفحة" }, { status: 403 });
  }

  const def = getPageDefinition(pageKey);
  if (!def) {
    return NextResponse.json({ error: "الصفحة غير موجودة في سجل الإعدادات" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const scope = (body.scope as PageSettingsScope) || "global";
  if (!["global", "office", "role", "user"].includes(scope)) {
    return NextResponse.json({ error: "نطاق غير صالح" }, { status: 400 });
  }

  // Non-admins may only edit global for now when listed in manageRoles
  if (scope !== "global" && session!.role !== "admin") {
    return NextResponse.json({ error: "تعديل النطاقات الفرعية للمدير فقط حالياً" }, { status: 403 });
  }

  if (body.reset === true) {
    const result = await resetPageSettings({
      pageKey,
      scope,
      scopeId: body.scopeId,
      userId: session!.sub,
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const resolved = await resolvePageSettings({ pageKey, role: session!.role, userId: session!.sub });
    return NextResponse.json({ ok: true, action: "reset", resolved });
  }

  const values = (body.values ?? {}) as Record<string, unknown>;
  const result = await savePageSettings({
    pageKey,
    scope,
    scopeId: body.scopeId,
    values,
    userId: session!.sub,
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const resolved = await resolvePageSettings({ pageKey, role: session!.role, userId: session!.sub });
  return NextResponse.json({
    ok: true,
    action: "save",
    version: result.row?.version,
    resolved,
  });
}
