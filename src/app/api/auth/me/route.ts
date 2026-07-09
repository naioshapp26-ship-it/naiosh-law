import { getSessionFromCookies } from "@/lib/auth";
import { jsonError, jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return jsonError("غير مصرح", 401);
  }
  return jsonResponse({
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
