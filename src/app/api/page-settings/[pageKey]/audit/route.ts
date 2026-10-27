import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import {
  assertNotClient,
  canManagePageSettings,
} from "@/lib/page-settings/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }
  if (!canManagePageSettings(session!.role, pageKey) && session!.role !== "admin") {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 30)));

  const rows = await prisma.pageSettingAudit.findMany({
    where: { pageKey },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    audits: rows.map((r) => ({
      id: r.id,
      action: r.action,
      scope: r.scope,
      scopeId: r.scopeId,
      beforeJson: r.beforeJson,
      afterJson: r.afterJson,
      changedBy: r.changedBy,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
