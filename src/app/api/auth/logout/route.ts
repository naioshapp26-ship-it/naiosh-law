import { NextRequest, NextResponse } from "next/server";
import { getExpiredSessionCookieOptions } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getExpiredSessionCookieOptions(request));
  return response;
}
