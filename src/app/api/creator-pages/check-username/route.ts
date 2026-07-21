import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { isUsernameAvailable } from "@/lib/creator-pages-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = String(searchParams.get("username") ?? "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ available: false, error: "username required" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  const session = await getSessionFromCookies();
  const available = await isUsernameAvailable(username, session?.sub);
  return NextResponse.json({ available });
}
