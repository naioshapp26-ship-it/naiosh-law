/**
 * Proves passwordChangedAt vs JWT iat second-precision no longer rejects fresh logins.
 */
import { getPrisma } from "../src/lib/prisma";
import { signToken, verifyToken } from "../src/lib/auth";
import { assertSessionNotRevoked } from "../src/lib/auth-session-guard";
import bcrypt from "bcryptjs";

const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";

async function main() {
  const prisma = getPrisma();
  const email = `loopfix.${Date.now()}@test.local`;
  const password = "Portal@12345Aa";
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name: "Loop Fix", role: "client", active: true },
  });

  try {
    // Same-second bump that used to break sessions
    const changedAt = new Date();
    await prisma.user.update({ where: { id: user.id }, data: { passwordChangedAt: changedAt } });
    const token = await signToken({ sub: user.id, email, name: "Loop Fix", role: "client" });
    const session = await verifyToken(token);
    if (!session?.iat) throw new Error("token missing iat");

    const oldBrokenWouldAccept = session.iat * 1000 >= changedAt.getTime();
    const fixedAccepts = await assertSessionNotRevoked(session);
    console.log(
      JSON.stringify(
        {
          iat: session.iat,
          changedAt: changedAt.toISOString(),
          oldBrokenWouldAccept,
          fixedAccepts,
        },
        null,
        2
      )
    );
    if (!fixedAccepts) throw new Error("assertSessionNotRevoked still rejects fresh token");

    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const rawCookies = typeof login.headers.getSetCookie === "function" ? login.headers.getSetCookie() : [];
    const cookie = rawCookies.map((c) => c.split(";")[0]).join("; ");
    const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
    const meText = await me.text();
    console.log(JSON.stringify({ login: login.status, me: me.status, meText }, null, 2));
    if (!login.ok || !me.ok) throw new Error("login→me failed");

    // invalidate-sessions then me must still work with new cookie
    const inv = await fetch(`${BASE}/api/auth/invalidate-sessions`, {
      method: "POST",
      headers: { cookie },
    });
    const invCookies = typeof inv.headers.getSetCookie === "function" ? inv.headers.getSetCookie() : [];
    const cookie2 = invCookies.map((c) => c.split(";")[0]).join("; ") || cookie;
    const me2 = await fetch(`${BASE}/api/auth/me`, { headers: { cookie: cookie2 } });
    console.log(JSON.stringify({ invalidate: inv.status, meAfter: me2.status, body: await me2.text() }, null, 2));
    if (!inv.ok || !me2.ok) throw new Error("invalidate→me failed");

    console.log("PASS session-login-loop");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
