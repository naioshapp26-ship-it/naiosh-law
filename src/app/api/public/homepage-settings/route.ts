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
    return NextResponse.json({
      pageKey: "public-homepage",
      display: {
        title: values.display?.title || (getDefaultValues("public-homepage").display as { title?: string })?.title,
        subtitle:
          values.display?.subtitle ||
          (getDefaultValues("public-homepage").display as { subtitle?: string })?.subtitle,
      },
      specialized: values.specialized ?? {},
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
