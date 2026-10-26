import type { AuthPayload } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * Reject JWTs issued before the user's last password change (invalidates other sessions).
 * Soft-fail (allow) if DB unreachable so health/login aren't bricked offline.
 */
export async function assertSessionNotRevoked(session: AuthPayload): Promise<boolean> {
  if (!session.iat) return true;
  try {
    const user = await getPrisma().user.findUnique({
      where: { id: session.sub },
      select: { passwordChangedAt: true, active: true },
    });
    if (!user || !user.active) return false;
    if (!user.passwordChangedAt) return true;
    return session.iat * 1000 >= user.passwordChangedAt.getTime();
  } catch {
    return true;
  }
}
