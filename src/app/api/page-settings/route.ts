import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { listPageDefinitions, coverageReport } from "@/lib/page-settings/registry";
import { assertNotClient } from "@/lib/page-settings/server";
import { prisma } from "@/lib/prisma";

/** Catalog of all page settings + coverage + which keys have saved rows */
export async function GET(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const status = url.searchParams.get("status") as
    | "operational"
    | "partial"
    | "planned"
    | null;
  const q = url.searchParams.get("q") || undefined;

  const defs = listPageDefinitions({
    category: category as never,
    status: status || undefined,
    q,
  });

  const saved = await prisma.pageSetting.findMany({
    where: { scope: "global", scopeId: "" },
    select: { pageKey: true, updatedAt: true, version: true },
  });
  const savedMap = new Map(saved.map((s) => [s.pageKey, s]));

  return NextResponse.json({
    coverage: coverageReport(),
    pages: defs.map((d) => ({
      pageKey: d.pageKey,
      title: d.title,
      description: d.description,
      category: d.category,
      pageHref: d.pageHref,
      settingsHref: d.settingsHref,
      status: d.status,
      icon: d.icon,
      gapReason: d.gapReason ?? null,
      canManage: d.manageRoles.includes(session!.role),
      saved: savedMap.has(d.pageKey),
      updatedAt: savedMap.get(d.pageKey)?.updatedAt?.toISOString() ?? null,
      version: savedMap.get(d.pageKey)?.version ?? null,
    })),
  });
}
