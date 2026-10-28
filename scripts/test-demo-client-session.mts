/**
 * Demo client session must survive /api/auth/me (DB user + fixture offline token).
 */
import { signToken, verifyToken } from "../src/lib/auth";
import { assertSessionNotRevoked } from "../src/lib/auth-session-guard";
import { DEMO_CLIENT_EMAIL, DEMO_CLIENT_USER_ID } from "../src/lib/client-portal";
import { ensureDemoClientPortal } from "../src/lib/ensure-demo-client";

const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";

function cookieFrom(res: Response) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  // 1) Fixture offline token (no DB row for DEMO_CLIENT_USER_ID) must be accepted
  const fixtureToken = await signToken({
    sub: DEMO_CLIENT_USER_ID,
    email: DEMO_CLIENT_EMAIL,
    name: "عميل تجريبي",
    role: "client",
  });
  const fixtureSession = await verifyToken(fixtureToken);
  if (!fixtureSession) throw new Error("fixture verify failed");
  const fixtureOk = await assertSessionNotRevoked(fixtureSession);
  console.log(JSON.stringify({ fixtureOk }, null, 2));
  if (!fixtureOk) throw new Error("fixture demo session rejected");

  // 2) ensureDemoClientPortal without requiring DEMO_CLIENT_PASSWORD
  const prev = process.env.DEMO_CLIENT_PASSWORD;
  delete process.env.DEMO_CLIENT_PASSWORD;
  try {
    const { user } = await ensureDemoClientPortal();
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "client",
    });
    const session = await verifyToken(token);
    const ok = session ? await assertSessionNotRevoked(session) : false;
    console.log(JSON.stringify({ dbUserId: user.id, dbSessionOk: ok }, null, 2));
    if (!ok) throw new Error("DB demo session rejected");
  } finally {
    if (prev !== undefined) process.env.DEMO_CLIENT_PASSWORD = prev;
  }

  // 3) HTTP: demo-client → me
  await fetch(`${BASE}/api/auth/logout`, { method: "POST" });
  const demo = await fetch(`${BASE}/api/auth/demo-client`, { method: "POST" });
  const cookie = cookieFrom(demo);
  const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
  const meText = await me.text();
  console.log(JSON.stringify({ demo: demo.status, me: me.status, meText, hasCookie: Boolean(cookie) }, null, 2));
  if (!demo.ok || !me.ok) throw new Error("demo-client → me failed");

  console.log("PASS demo-client-session");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
