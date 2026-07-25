/**
 * Verify مهامي table has المكلف + الموضوع beside المهمة.
 * Run: npx tsx scripts/test-my-tasks-columns.ts
 */
import { getErpPageConfig } from "../src/data/erp-page-catalog";
import { fieldsFromColumnLabels } from "../src/lib/form-field-labels";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const config = getErpPageConfig("my-tasks");
assert(config, "my-tasks page missing from catalog");
assert(config.title === "مهامي", `unexpected title: ${config.title}`);

const columns = config.columns ?? [];
const expected = ["المهمة", "المكلف", "الموضوع", "الأولوية", "الاستحقاق", "الحالة"];

assert(
  columns.length === expected.length,
  `expected ${expected.length} columns, got ${columns.length}: ${columns.join(" | ")}`
);
expected.forEach((label, i) => {
  assert(columns[i] === label, `column[${i}] expected «${label}» got «${columns[i]}»`);
});

// Must sit beside المهمة (right after it in RTL table header order)
assert(columns[0] === "المهمة", "المهمة must remain first column");
assert(columns[1] === "المكلف", "المكلف must be next to المهمة");
assert(columns[2] === "الموضوع", "الموضوع must follow المكلف");

const seed = config.seed ?? [];
assert(seed.length >= 4, "my-tasks should keep demo seed rows");
for (const row of seed) {
  assert(row.length === columns.length, `seed row length ${row.length} != columns ${columns.length}`);
  assert(row[0]?.trim(), `task title missing in seed: ${JSON.stringify(row)}`);
  assert(row[1]?.trim(), `المكلف missing in seed: ${JSON.stringify(row)}`);
  assert(row[2]?.trim(), `الموضوع missing in seed: ${JSON.stringify(row)}`);
}

const fields = fieldsFromColumnLabels(columns);
const assignee = fields.find((f) => f.label === "المكلف");
const subject = fields.find((f) => f.label === "الموضوع");
assert(assignee, "المكلف field missing from add form");
assert(subject, "الموضوع field missing from add form");
assert(assignee.type === "text", "المكلف should be a text field");
assert(subject.type === "text", "الموضوع should be a text field");

console.log("✅ my-tasks columns verified");
console.log(`   columns: ${columns.join(" · ")}`);
console.log(`   seed rows: ${seed.length}`);
console.log(`   form fields: ${fields.map((f) => f.label).join(" · ")}`);
console.log("   sample row:", seed[0]?.join(" | "));
