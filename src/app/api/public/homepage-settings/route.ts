import { NextResponse } from "next/server";
import { getDefaultValues, resolvePageSettings } from "@/lib/page-settings/server";

/**
 * Public read of marketing homepage display settings only.
 * Management remains admin-only via /api/page-settings/public-homepage.
 */
export async function GET() {
  try {
    const resolved = await resolvePageSettings({
      pageKey: "public-homepage",
      role: "admin",
      userId: null,
    });
    const values = resolved.values as {
      display?: { title?: string; subtitle?: string };
      specialized?: Record<string, boolean>;
    };
    const allValues = resolved.values as {
      display?: { title?: string; subtitle?: string };
      specialized?: Record<string, boolean>;
      sections?: Array<{ id: string; title: string; kind: string; visible?: boolean; order?: number }>;
      sectionData?: Record<string, Record<string, unknown>>;
    };
    const publicSections = (allValues.sections ?? [])
      .filter((s) => s && s.visible !== false && (s.kind === "custom" || s.kind === "notes"))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => ({
        id: s.id,
        title: s.title,
        kind: s.kind,
        data: (allValues.sectionData ?? {})[s.id] ?? {},
      }));
    return NextResponse.json({
      pageKey: "public-homepage",
      display: {
        title: values.display?.title || (getDefaultValues("public-homepage").display as { title?: string })?.title,
        subtitle:
          values.display?.subtitle ||
          (getDefaultValues("public-homepage").display as { subtitle?: string })?.subtitle,
      },
      specialized: values.specialized ?? {},
      sections: publicSections,
    });
  } catch {
    const defaults = getDefaultValues("public-homepage");
    return NextResponse.json({
      pageKey: "public-homepage",
      display: (defaults as { display?: unknown }).display ?? {},
      specialized: (defaults as { specialized?: unknown }).specialized ?? {},
    });
  }
}
