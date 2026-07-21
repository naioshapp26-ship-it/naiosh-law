import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import {
  getCreatorPageByUserId,
  isUsernameAvailable,
  upsertCreatorPage,
} from "@/lib/creator-pages-store";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const page = await getCreatorPageByUserId(session.sub);
  return NextResponse.json({ page, customLinks: page?.customLinks ?? [] });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "يجب تسجيل الدخول لحفظ الصفحة" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const fd = await request.formData();
    body = Object.fromEntries(fd.entries());
    const linksRaw = String(fd.get("customLinks") ?? "[]");
    try {
      body.customLinks = JSON.parse(linksRaw);
    } catch {
      body.customLinks = [];
    }
  } else {
    body = await request.json();
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  if (!name || !username) {
    return NextResponse.json({ error: "الاسم واسم المستخدم مطلوبان" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
    return NextResponse.json(
      { error: "اسم المستخدم يجب أن يبدأ بحرف/رقم، وطوله 3-30 (a-z, 0-9, _ -)" },
      { status: 400 }
    );
  }

  const available = await isUsernameAvailable(username, session.sub);
  if (!available) {
    return NextResponse.json({ error: "اسم المستخدم مستخدم بالفعل" }, { status: 409 });
  }

  const customLinks = Array.isArray(body.customLinks)
    ? (body.customLinks as { label?: string; url?: string }[])
        .map((l) => ({ label: String(l.label ?? "").trim(), url: String(l.url ?? "").trim() }))
        .filter((l) => l.label && l.url)
    : [];

  const page = await upsertCreatorPage(session.sub, session.email, {
    name,
    username,
    bio: String(body.bio ?? ""),
    phone: String(body.phone ?? ""),
    pageEmail: String(body.email ?? body.pageEmail ?? session.email),
    whatsapp: String(body.whatsapp ?? ""),
    facebook: String(body.facebook ?? ""),
    instagram: String(body.instagram ?? ""),
    youtube: String(body.youtube ?? ""),
    snapchat: String(body.snapchat ?? ""),
    tiktok: String(body.tiktok ?? ""),
    specialty: String(body.specialty ?? "محامٍ عام"),
    city: String(body.city ?? ""),
    customLinks,
    profileImageUrl: String(body.profileImageUrl ?? ""),
    coverImageUrl: String(body.coverImageUrl ?? ""),
  });

  return NextResponse.json({ page, customLinks: page.customLinks });
}
