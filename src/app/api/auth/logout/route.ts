import { AUTH_COOKIE } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-helpers";

export async function POST() {
  const response = jsonResponse({ ok: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
