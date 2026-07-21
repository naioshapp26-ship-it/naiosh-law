import { NextResponse } from "next/server";
import { bumpCreatorPageStat, getCreatorPageByUsername } from "@/lib/creator-pages-store";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const page = await getCreatorPageByUsername(username);
  if (!page || page.status !== "active") {
    return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  }
  await bumpCreatorPageStat(username, "views");
  return NextResponse.json({ page: { ...page, views: page.views + 1 } });
}

export async function POST(request: Request, { params }: Params) {
  const { username } = await params;
  const body = await request.json().catch(() => ({}));
  if (body?.event === "click") {
    await bumpCreatorPageStat(username, "clicks");
  }
  return NextResponse.json({ ok: true });
}
