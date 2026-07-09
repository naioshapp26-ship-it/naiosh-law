import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api-response";
import { getExpiredSessionCookieOptions } from "@/lib/session-cookie";

export async function POST(request: NextRequest) {
  const response = jsonResponse({ ok: true });
  response.cookies.set(getExpiredSessionCookieOptions(request));
  return response;
}
