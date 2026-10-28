/**
 * Read-only full case-link audit (code env DB).
 * Does NOT modify or delete records. Separates TEST/DEMO-looking caseNos
 * (source inspection only) from link integrity.
 */
import { writeFileSync, mkdirSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { resolveCaseRef } from "../src/lib/case-identity-server";
import { CASE_BEARING_MODULE_SLUGS, CASE_PICKER_REQUIRED_SLUGS, CASE_LINK_REVIEW } from "../src/lib/case-identity";

const OUT = "/opt/cursor/artifacts/case-full-audit";
mkdirSync(OUT, { recursive: true });

const LOOKS_TEST = /^(TEST|DEMO|#?TEST|#?DEMO|#F-|#PC-|#LINK-|#ACCEPT-)/i;

type LinkBucket = { linked: number; none: number; review: number; total: number; samples: string[] };

function emptyBucket(): LinkBucket {
  return { linked: 0, none: 0, review: 0, total: 0, samples: [] };
}

function pushSample(b: LinkBucket, s: string) {
  if (b.samples.length < 12) b.samples.push(s);
}

async function main() {
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    environment: "isolated-code-db",
    disclaimer:
      "نتائج هذه البيئة المعزولة لا تثبت بيانات الإنتاج. تدقيق الإنتاج يجب أن يكون قراءة فقط ومنفصلًا.",
    caseBearingSlugs: [...CASE_BEARING_MODULE_SLUGS],
    pickerRequiredSlugs: [...CASE_PICKER_REQUIRED_SLUGS],
  };

  const cases = await prisma.case.findMany({
    select: {
      id: true,
      caseNo: true,
      clientId: true,
      clientName: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const testLooking = cases.filter((c) => LOOKS_TEST.test(c.caseNo));
  const orphanClient = cases.filter((c) => !c.clientId);
  report.cases = {
    total: cases.length,
    withClientId: cases.filter((c) => c.clientId).length,
    withoutClientId: orphanClient.length,
    looksTestOrDemo: {
      count: testLooking.length,
      note: "أسماء تبدو تجريبية — لا حذف تلقائي؛ فحص المصدر أولًا",
      samples: testLooking.slice(0, 40).map((c) => ({
        id: c.id,
        caseNo: c.caseNo,
        clientId: c.clientId,
        clientName: c.clientName,
        createdAt: c.createdAt,
      })),
    },
    orphanClientSamples: orphanClient.slice(0, 15).map((c) => ({
      id: c.id,
      caseNo: c.caseNo,
      clientName: c.clientName,
    })),
  };

  // Clients multi-link
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, casesCount: true },
  });
  const caseByClient = new Map<string, string[]>();
  for (const c of cases) {
    if (!c.clientId) continue;
    const list = caseByClient.get(c.clientId) ?? [];
    list.push(c.caseNo);
    caseByClient.set(c.clientId, list);
  }
  let c0 = 0,
    c1 = 0,
    cMany = 0;
  const multiSamples: Array<{ name: string; cases: string[] }> = [];
  for (const cl of clients) {
    const n = (caseByClient.get(cl.id) ?? []).length;
    if (n === 0) c0++;
    else if (n === 1) c1++;
    else {
      cMany++;
      if (multiSamples.length < 8) {
        multiSamples.push({ name: cl.name, cases: caseByClient.get(cl.id)! });
      }
    }
  }
  report.clients = {
    total: clients.length,
    with0Cases: c0,
    with1Case: c1,
    withManyCases: cMany,
    multiSamples,
  };

  // Court sessions
  const sessions = await prisma.courtSession.findMany({
    select: { id: true, caseId: true, caseNo: true },
  });
  const sess = emptyBucket();
  for (const s of sessions) {
    sess.total++;
    if (s.caseId) {
      const c = await prisma.case.findUnique({ where: { id: s.caseId }, select: { caseNo: true } });
      if (c) sess.linked++;
      else {
        sess.review++;
        pushSample(sess, `orphan-caseId:${s.caseId}`);
      }
    } else if (s.caseNo) {
      const res = await resolveCaseRef(s.caseNo);
      if (res.status === "linked") sess.linked++;
      else if (res.status === "none") sess.none++;
      else {
        sess.review++;
        pushSample(sess, String(s.caseNo));
      }
    } else sess.none++;
  }
  report.courtSessions = sess;

  async function auditCaseRefTable(
    label: string,
    rows: Array<{ caseRef: string | null }>
  ) {
    const b = emptyBucket();
    for (const r of rows) {
      b.total++;
      const res = await resolveCaseRef(r.caseRef);
      if (res.status === "linked") b.linked++;
      else if (res.status === "none") b.none++;
      else {
        b.review++;
        pushSample(b, String(r.caseRef));
      }
    }
    return { label, ...b };
  }

  report.financialRecords = await auditCaseRefTable(
    "financial-records",
    await prisma.financialRecord.findMany({ select: { caseRef: true } })
  );
  report.bailGuarantees = await auditCaseRefTable(
    "bail-guarantees",
    await prisma.bailGuarantee.findMany({ select: { caseRef: true } })
  );
  report.personalGuarantees = await auditCaseRefTable(
    "personal-guarantees",
    await prisma.personalGuarantee.findMany({ select: { caseRef: true } })
  );
  report.officialNotifications = await auditCaseRefTable(
    "official-notifications",
    await prisma.officialNotification.findMany({ select: { caseRef: true } })
  );

  const mods = await prisma.moduleRecord.findMany({
    select: { moduleKey: true, data: true },
  });
  const byKey: Record<string, LinkBucket> = {};
  for (const m of mods) {
    const d = (m.data ?? {}) as Record<string, unknown>;
    if (!byKey[m.moduleKey]) byKey[m.moduleKey] = emptyBucket();
    const b = byKey[m.moduleKey];
    b.total++;
    const caseId = typeof d.caseId === "string" ? d.caseId : "";
    const caseNo = typeof d.caseNo === "string" ? d.caseNo : "";
    if (caseId) {
      const c = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } });
      if (c) b.linked++;
      else {
        b.review++;
        pushSample(b, `orphan-caseId:${caseId}`);
      }
    } else if (caseNo.trim() && caseNo !== "لا توجد قضية مرتبطة") {
      const res = await resolveCaseRef(caseNo);
      if (res.status === "linked") b.linked++;
      else if (res.status === "none") b.none++;
      else {
        b.review++;
        pushSample(b, caseNo.startsWith(CASE_LINK_REVIEW) ? caseNo : caseNo);
      }
    } else b.none++;
  }
  report.moduleRecords = byKey;

  try {
    const pn = await prisma.professionalNetwork.findMany({ select: { caseRef: true } });
    report.professionalNetwork = await auditCaseRefTable("professional-network", pn);
  } catch (e) {
    report.professionalNetwork = { error: String(e) };
  }

  // Users with client role for isolation checks later
  const clientUsers = await prisma.user.findMany({
    where: { role: "client" },
    select: { id: true, email: true, name: true },
    take: 20,
  });
  report.clientUsersSample = clientUsers;

  writeFileSync(`${OUT}/readonly-db-audit.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
