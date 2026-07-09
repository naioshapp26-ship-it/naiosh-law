import { getSessionFromCookies } from "@/lib/auth";
import { jsonError, jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionFromCookies();

  if (!user) {
    return jsonError("Unauthenticated.", 401);
  }

  return jsonResponse({
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
