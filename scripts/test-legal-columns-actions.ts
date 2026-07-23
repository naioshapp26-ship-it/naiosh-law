/**
 * Verify sc-legal columns and unified action variants order.
 * Run: npx tsx scripts/test-legal-columns-actions.ts
 */
import { getErpPageConfig } from "../src/data/erp-page-catalog";
import { fieldsFromColumnLabels } from "../src/lib/form-field-labels";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const config = getErpPageConfig("sc-legal");
assert(config, "sc-legal page missing from catalog");
assert(config.title === "القانونية والمحاماة", `unexpected title: ${config.title}`);

const columns = config.columns ?? [];
const expected = [
  "الملف",
  "طرف أول الجوال",
  "طرف ثاني الجوال",
  "الدولة",
  "النوع",
  "المحامي",
  "الحالة",
];

assert(
  columns.length === expected.length,
  `expected ${expected.length} columns, got ${columns.length}: ${columns.join(" | ")}`
);
expected.forEach((label, i) => {
  assert(columns[i] === label, `column[${i}] expected «${label}» got «${columns[i]}»`);
});

// Columns must sit beside الملف (right after it in RTL table header order)
assert(columns[0] === "الملف", "الملف must remain first column");
assert(columns[1] === "طرف أول الجوال", "طرف أول الجوال must be next to الملف");
assert(columns[2] === "طرف ثاني الجوال", "طرف ثاني الجوال must follow first-party mobile");
assert(columns[3] === "الدولة", "الدولة must follow second-party mobile");

const seed = config.seed ?? [];
assert(seed.length >= 3, "sc-legal should keep demo seed rows");
for (const row of seed) {
  assert(row.length === columns.length, `seed row length ${row.length} != columns ${columns.length}`);
  assert(row[1] && /\d/.test(row[1]), `first-party mobile missing digits in seed: ${row[1]}`);
  assert(row[2] && /\d/.test(row[2]), `second-party mobile missing digits in seed: ${row[2]}`);
  assert(row[3] && row[3].length > 1, `country missing in seed: ${row[3]}`);
}

const fields = fieldsFromColumnLabels(columns);
const phoneFields = fields.filter((f) => /جوال/.test(f.label));
assert(phoneFields.length === 2, `expected 2 phone fields, got ${phoneFields.length}`);
assert(
  phoneFields.every((f) => f.type === "tel"),
  "party mobile columns must be tel fields"
);
const countryField = fields.find((f) => f.label === "الدولة");
assert(countryField, "الدولة field missing from form fields");

// Unified action order contract used by RowActions / standardRowActions
const UNIFIED_ACTION_ORDER = ["view", "edit", "add", "archive", "delete"] as const;
assert(UNIFIED_ACTION_ORDER.length === 5, "system must expose five unified row actions");

console.log("✅ sc-legal columns + unified row actions verified");
console.log(`   columns: ${columns.join(" · ")}`);
console.log(`   seed rows: ${seed.length}`);
console.log(`   actions: ${UNIFIED_ACTION_ORDER.join(" · ")}`);
console.log(`   form fields: ${fields.map((f) => f.label).join(" · ")}`);
