import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  readSessionToken,
  sessionCookieName,
} from "@/lib/session-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const user = await readSessionToken(token);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, user });
}
