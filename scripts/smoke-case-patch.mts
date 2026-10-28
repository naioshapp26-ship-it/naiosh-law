import { chromium } from "playwright";
import { prisma } from "../src/lib/prisma";

async function main() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
  await p.fill("input[type=email]", "admin@naioshlaw.com");
  await p.fill("input[type=password]", "Admin@123");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/app/, { timeout: 20000 });
  const cookie = (await p.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const cases = await prisma.case.findMany({ take: 2, orderBy: { createdAt: "desc" } });
  const sess = await prisma.courtSession.findFirst({ orderBy: { createdAt: "desc" } });
  const fin = await prisma.financialRecord.findFirst({ orderBy: { createdAt: "desc" } });
  const bail = await prisma.bailGuarantee.findFirst();
  const out: unknown[] = [];
  if (sess) {
    const r = await fetch(`http://127.0.0.1:3000/api/court-sessions/${sess.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ caseId: cases[0]!.id }),
    });
    out.push({ sess: r.status, body: await r.json() });
  }
  if (fin) {
    const r = await fetch(`http://127.0.0.1:3000/api/financial-records/${fin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ caseId: cases[0]!.id }),
    });
    out.push({ fin: r.status, body: await r.json() });
  }
  if (bail) {
    const bad = await fetch(`http://127.0.0.1:3000/api/bail-guarantees/${bail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ caseNo: "#FAKE-PATCH" }),
    });
    const good = await fetch(`http://127.0.0.1:3000/api/bail-guarantees/${bail.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ caseId: cases[0]!.id }),
    });
    out.push({
      bailBad: bad.status,
      bailGood: good.status,
      badBody: await bad.json(),
      goodCaseRef: (await good.json()).caseRef,
    });
  }
  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
  await b.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
