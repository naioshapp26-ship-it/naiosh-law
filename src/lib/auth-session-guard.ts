import type { AuthPayload } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * Reject JWTs issued before the user's last password change (invalidates other sessions).
 * Soft-fail (allow) if DB unreachable so health/login aren't bricked offline.
 *
 * JWT `iat` is second-precision. Comparing it as `iat * 1000 >= passwordChangedAt(ms)`
 * falsely rejects a brand-new cookie issued in the same second as the password bump
 * (change-password / invalidate-sessions / fresh login right after). Compare in whole
 * seconds so same-second tokens remain valid.
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
    const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
    // 2s grace covers minor clock skew between sign and DB write
    return session.iat + 2 >= changedAtSec;
  } catch {
    return true;
  }
}
