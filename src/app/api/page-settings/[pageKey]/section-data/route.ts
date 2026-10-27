import { NextResponse } from "next/server";
import { requireWrite } from "@/lib/api-helpers";
import { getPageDefinition } from "@/lib/page-settings/registry";
import {
  assertNotClient,
  resolvePageSettings,
  savePageSettings,
} from "@/lib/page-settings/server";

type Ctx = { params: Promise<{ pageKey: string }> };

/**
 * Persist page-level No-Code section field values (sectionData) without
 * requiring full settings-manage permission — writers can fill content;
 * clients cannot.
 */
export async function PUT(request: Request, ctx: Ctx) {
  const { pageKey } = await ctx.params;
  const { error, session } = await requireWrite();
  if (error) return error;
  if (!assertNotClient(session!.role)) {
    return NextResponse.json({ error: "غير مصرح للعميل" }, { status: 403 });
  }

  const def = getPageDefinition(pageKey);
  if (!def) {
    return NextResponse.json({ error: "الصفحة غير موجودة في سجل الإعدادات" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    sectionId?: string;
    data?: Record<string, unknown>;
  } | null;
  const sectionId = String(body?.sectionId ?? "").trim();
  if (!sectionId) {
    return NextResponse.json({ error: "sectionId مطلوب" }, { status: 400 });
  }
  if (!body?.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return NextResponse.json({ error: "data غير صالح" }, { status: 400 });
  }

  const resolved = await resolvePageSettings({
    pageKey,
    role: session!.role,
    userId: session!.sub,
  });
  const values = { ...(resolved.values as Record<string, unknown>) };
  const sections = Array.isArray(values.sections) ? values.sections : [];
  const allowed = sections.some(
    (s) =>
      s &&
      typeof s === "object" &&
      String((s as { id?: string }).id) === sectionId &&
      (s as { visible?: boolean }).visible !== false
  );
  if (!allowed) {
    return NextResponse.json({ error: "القسم غير موجود أو مخفي" }, { status: 400 });
  }

  const prevData =
    values.sectionData && typeof values.sectionData === "object" && !Array.isArray(values.sectionData)
      ? ({ ...(values.sectionData as Record<string, unknown>) } as Record<string, Record<string, unknown>>)
      : {};

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body.data)) {
    const key = String(k).slice(0, 64);
    if (v == null) {
      cleaned[key] = "";
      continue;
    }
    if (typeof v === "boolean" || typeof v === "number") {
      cleaned[key] = v;
      continue;
    }
    cleaned[key] = String(v).slice(0, 8000);
  }

  prevData[sectionId] = {
    ...(typeof prevData[sectionId] === "object" && prevData[sectionId] ? prevData[sectionId] : {}),
    ...cleaned,
  };
  values.sectionData = prevData;

  const result = await savePageSettings({
    pageKey,
    scope: "global",
    values,
    userId: session!.sub,
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    sectionId,
    sectionData: prevData,
  });
}
