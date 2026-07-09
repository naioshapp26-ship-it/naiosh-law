import "server-only";

import { cookies } from "next/headers";
import { decodeSession, sessionCookieName } from "@/lib/auth-session";

export async function getServerSessionUser() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(sessionCookieName)?.value);
}
