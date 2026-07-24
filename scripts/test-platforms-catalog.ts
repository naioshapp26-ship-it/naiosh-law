/**
 * Verify platforms page catalog counts and required names.
 * Run: npx tsx scripts/test-platforms-catalog.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  LAW_INCUBATOR_STACK,
  LAW_PLATFORM_CARDS,
  LAW_PLATFORM_CATEGORIES,
  LAW_PLATFORMS_STATS,
} from "../src/data/law-platforms";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const byId = Object.fromEntries(LAW_PLATFORM_CATEGORIES.map((c) => [c.id, c]));

assert(byId["operational-platforms"]?.items.length === 41, "expected 41 operational platforms");
assert(byId["electronic-offices"]?.items.length === 41, "expected 41 electronic offices");
assert(byId["specialized-centers"]?.items.length === 15, "expected 15 specialized centers");
assert(byId["academies"]?.items.length === 10, "expected 10 academies");

assert(
  byId["operational-platforms"].items[0] === "منصة القيادة الإستراتيجية",
  "first operational platform mismatch"
);
assert(
  byId["operational-platforms"].items.at(-1) === "منصة التكامل مع الأنظمة الخارجية",
  "last operational platform mismatch"
);
assert(byId["electronic-offices"].items[0] === "المكتب التنفيذي", "first office mismatch");
assert(byId["electronic-offices"].items.at(-1) === "مكتب المتعاملين", "last office mismatch");
assert(byId["specialized-centers"].items.includes("مركز الذكاء الاصطناعي"), "AI center missing");
assert(byId["academies"].items.includes("أكاديمية التسويق"), "marketing academy missing");

assert(LAW_PLATFORM_CARDS.length === 4, "expected 4 overview cards");
assert(LAW_PLATFORMS_STATS.length === 4, "expected 4 stats");
assert(LAW_INCUBATOR_STACK.length === 13, "expected 13 incubator stack items");
assert(LAW_INCUBATOR_STACK.includes("نظام ذكاء اصطناعي موحد (NAIS)"), "NAIS missing from stack");

const page = readFileSync(join(process.cwd(), "src/components/platforms-page.tsx"), "utf8");
assert(page.includes("LAW_PLATFORM_CATEGORIES"), "platforms page must render categories");
assert(page.includes("LAW_INCUBATOR_STACK"), "platforms page must render incubator stack");
assert(page.includes("platforms-overview-grid"), "overview 2x2 card grid missing");
assert(page.includes("platforms-items-grid"), "ordered items grid missing");
assert(page.includes("platforms-item-card"), "item card class missing");
assert(page.includes("naiosh-360-incubators"), "incubator section id missing");

const totalItems = LAW_PLATFORM_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
assert(totalItems === 41 + 41 + 15 + 10, `unexpected total catalog size: ${totalItems}`);

console.log("✅ platforms catalog verified");
console.log(`   categories: ${LAW_PLATFORM_CATEGORIES.map((c) => `${c.title}(${c.items.length})`).join(" · ")}`);
console.log(`   incubator stack: ${LAW_INCUBATOR_STACK.length}`);
