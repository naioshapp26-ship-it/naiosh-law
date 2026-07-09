import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/session-shared";
import { decodeSessionUser, encodeSessionUser, sessionCookieName } from "@/lib/session-shared";

const sessionMaxAge = 60 * 60 * 8;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function readSessionCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return decodeSessionUser(cookieStore.get(sessionCookieName)?.value);
}

export async function writeSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, encodeSessionUser(user), {
    ...cookieOptions,
    maxAge: sessionMaxAge,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}
