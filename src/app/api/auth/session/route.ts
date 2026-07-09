import { NextResponse } from "next/server";
import {
  getCookieValue,
  readSessionToken,
  sessionCookieName,
} from "@/lib/session-shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), sessionCookieName);
  const user = await readSessionToken(token);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, user });
}
