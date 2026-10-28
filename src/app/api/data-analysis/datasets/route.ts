import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import {
  LEGAL_DATASET_META,
  loadLegalDataset,
  resolveClientScope,
  type LegalDatasetKey,
} from "@/lib/data-analysis/legal-sources";

const KEYS = Object.keys(LEGAL_DATASET_META) as LegalDatasetKey[];

export async function GET(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const url = new URL(request.url);
  const key = (url.searchParams.get("key") || "") as LegalDatasetKey;
  const format = url.searchParams.get("format") || "json";

  const scope = await resolveClientScope({
    role: session!.role,
    userId: session!.sub,
  });

  if (!key) {
    return NextResponse.json({
      datasets: KEYS.map((k) => ({
        key: k,
        ...LEGAL_DATASET_META[k],
        available: scope.all || Boolean(scope.clientId),
      })),
      role: session!.role,
      scope: scope.all ? "office" : "own-client",
    });
  }

  if (!KEYS.includes(key)) {
    return NextResponse.json({ error: "مصدر بيانات غير معروف" }, { status: 400 });
  }

  if (!scope.all && !scope.clientId) {
    return NextResponse.json(
      { error: "لا توجد بيانات موكل مرتبطة بحسابك" },
      { status: 403 }
    );
  }

  const data = await loadLegalDataset(key, scope);

  if (format === "csv") {
    return new NextResponse(data.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="law-${key}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    key,
    meta: LEGAL_DATASET_META[key],
    headers: data.headers,
    rows: data.rows,
    csv: data.csv,
    count: data.rows.length,
    scope: scope.all ? "office" : "own-client",
  });
}
