/**
 * Verify NAIOSH branches catalog: order, uniqueness, no duplicates.
 * Run: npx tsx scripts/test-branches-catalog.ts
 */
import { LAW_BRANCHES } from "../src/data/law-branches";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const expectedOrder = [
  "السعودية",
  "الإمارات",
  "قطر",
  "الكويت",
  "عمان",
  "البحرين",
  "الأردن",
  "سوريا",
  "لبنان",
  "العراق",
  "تركيا",
  "مصر",
  "ليبيا",
  "تونس",
  "الجزائر",
  "المغرب",
  "السودان",
  "جيبوتي",
  "المملكة المتحدة",
  "ألمانيا",
  "الولايات المتحدة",
  "كندا",
  "سنغافورة",
  "ماليزيا",
  "أستراليا",
  "جنوب أفريقيا",
  "الهند",
  "هولندا",
  "كينيا",
];

assert(LAW_BRANCHES.length === expectedOrder.length, `expected ${expectedOrder.length} branches, got ${LAW_BRANCHES.length}`);

const names = LAW_BRANCHES.map((b) => b.nameAr);
expectedOrder.forEach((name, i) => {
  assert(names[i] === name, `order[${i}] expected «${name}» got «${names[i]}»`);
});

const uniqueAr = new Set(names);
assert(uniqueAr.size === names.length, "duplicate Arabic names found");

const uniqueIds = new Set(LAW_BRANCHES.map((b) => b.id));
assert(uniqueIds.size === LAW_BRANCHES.length, "duplicate branch ids found");

// Morocco only once (user listed it twice)
assert(names.filter((n) => n === "المغرب").length === 1, "Morocco should appear once");

// Existing six preserved
for (const id of ["saudi-arabia", "uae", "jordan", "iraq", "turkey", "egypt"]) {
  assert(uniqueIds.has(id), `existing branch id missing: ${id}`);
}

for (const b of LAW_BRANCHES) {
  assert(b.flagSrc.startsWith("data:image/svg+xml"), `${b.id} missing svg flag`);
  assert(b.hours.includes("صباح"), `${b.id} missing hours`);
  assert(["مكاتب خاصة", "حاضنة أعمال", "مسرعة أعمال"].includes(b.type), `${b.id} bad type`);
}

console.log("✅ branches catalog verified");
console.log(`   count: ${LAW_BRANCHES.length}`);
console.log(`   names: ${names.join(" · ")}`);
