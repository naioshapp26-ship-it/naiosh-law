import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { verifySessionToken } from "@/lib/session-token";

export async function GET(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
