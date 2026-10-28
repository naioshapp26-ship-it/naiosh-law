import { prisma } from "../src/lib/prisma";
import { resolveCaseRef } from "../src/lib/case-identity-server";

async function countReview(label: string, refs: (string | null | undefined)[]) {
  let linked = 0;
  let none = 0;
  let review = 0;
  const samples: string[] = [];
  for (const r of refs) {
    const res = await resolveCaseRef(r);
    if (res.status === "linked") linked++;
    else if (res.status === "none") none++;
    else {
      review++;
      if (samples.length < 8) samples.push(String(r));
    }
  }
  return { label, total: refs.length, linked, none, review, samples };
}

async function main() {
  const out: unknown[] = [];

  out.push(
    await countReview(
      "financial-records",
      (await prisma.financialRecord.findMany({ select: { caseRef: true } })).map((x) => x.caseRef)
    )
  );
  out.push(
    await countReview(
      "bail-guarantees",
      (await prisma.bailGuarantee.findMany({ select: { caseRef: true } })).map((x) => x.caseRef)
    )
  );
  out.push(
    await countReview(
      "personal-guarantees",
      (await prisma.personalGuarantee.findMany({ select: { caseRef: true } })).map((x) => x.caseRef)
    )
  );
  out.push(
    await countReview(
      "official-notifications",
      (await prisma.officialNotification.findMany({ select: { caseRef: true } })).map((x) => x.caseRef)
    )
  );

  const sessions = await prisma.courtSession.findMany({ select: { caseId: true, caseNo: true } });
  let sLinked = 0;
  let sNone = 0;
  let sReview = 0;
  const sSamples: string[] = [];
  for (const s of sessions) {
    if (s.caseId) {
      const c = await prisma.case.findUnique({ where: { id: s.caseId } });
      if (c) sLinked++;
      else {
        sReview++;
        if (sSamples.length < 8) sSamples.push(`orphan-caseId:${s.caseId}`);
      }
    } else if (s.caseNo) {
      const res = await resolveCaseRef(s.caseNo);
      if (res.status === "linked") sLinked++;
      else if (res.status === "none") sNone++;
      else {
        sReview++;
        if (sSamples.length < 8) sSamples.push(String(s.caseNo));
      }
    } else sNone++;
  }
  out.push({
    label: "court-sessions",
    total: sessions.length,
    linked: sLinked,
    none: sNone,
    review: sReview,
    samples: sSamples,
  });

  const mods = await prisma.moduleRecord.findMany({ select: { moduleKey: true, data: true } });
  const byKey: Record<
    string,
    { linked: number; none: number; review: number; total: number; samples: string[] }
  > = {};
  for (const m of mods) {
    const d = (m.data ?? {}) as Record<string, unknown>;
    if (!byKey[m.moduleKey]) {
      byKey[m.moduleKey] = { linked: 0, none: 0, review: 0, total: 0, samples: [] };
    }
    byKey[m.moduleKey].total++;
    const caseId = typeof d.caseId === "string" ? d.caseId : "";
    const caseNo = typeof d.caseNo === "string" ? d.caseNo : "";
    if (caseId) {
      const c = await prisma.case.findUnique({ where: { id: caseId } });
      if (c) byKey[m.moduleKey].linked++;
      else {
        byKey[m.moduleKey].review++;
        if (byKey[m.moduleKey].samples.length < 5) {
          byKey[m.moduleKey].samples.push(`orphan-caseId:${caseId}`);
        }
      }
    } else if (caseNo.trim()) {
      const res = await resolveCaseRef(caseNo);
      if (res.status === "linked") byKey[m.moduleKey].linked++;
      else if (res.status === "none") byKey[m.moduleKey].none++;
      else {
        byKey[m.moduleKey].review++;
        if (byKey[m.moduleKey].samples.length < 5) {
          byKey[m.moduleKey].samples.push(caseNo);
        }
      }
    } else byKey[m.moduleKey].none++;
  }
  out.push({ label: "module-records", byKey });

  try {
    const pn = await prisma.professionalNetwork.findMany({ select: { caseRef: true } });
    out.push(await countReview("professional-network", pn.map((x) => x.caseRef)));
  } catch {
    out.push({ label: "professional-network", error: "unavailable" });
  }

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
