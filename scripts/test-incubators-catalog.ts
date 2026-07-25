/**
 * Verify incubators catalog + nav wiring.
 * Run: npx tsx scripts/test-incubators-catalog.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  LAW_INCUBATOR_CARDS,
  LAW_INCUBATOR_CATEGORIES,
  LAW_INCUBATORS_STATS,
  LAW_INCUBATORS_TITLE,
} from "../src/data/law-incubators";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(LAW_INCUBATORS_TITLE === "الحاضنات", "title mismatch");
assert(LAW_INCUBATOR_CARDS.length === 4, "expected 4 overview cards");
assert(LAW_INCUBATORS_STATS.length === 4, "expected 4 stats");
assert(LAW_INCUBATOR_CATEGORIES.length >= 18, `expected >= 18 categories, got ${LAW_INCUBATOR_CATEGORIES.length}`);

const byId = Object.fromEntries(LAW_INCUBATOR_CATEGORIES.map((c) => [c.id, c]));
assert(byId["strategic-tech"]?.title.includes("التقنية"), "tech incubator missing");
assert(byId["strategic-education"]?.items.includes("منصات LMS و LXP"), "education LMS missing");
assert(byId["commercial"]?.items.includes("مركز نمو الشركات"), "commercial center missing");
assert(byId["logistics"]?.items.includes("مركز النقل الذكي"), "logistics center missing");
assert(byId["health"]?.items.includes("حاضنة الصحة"), "health incubator missing");
assert(byId["finance"]?.items.includes("مركز التمويل الذكي"), "finance center missing");
assert(byId["agriculture"]?.items.includes("حاضنة الزراعة الذكية"), "agriculture missing");
assert(byId["community"]?.items.includes("حاضنة الجمعيات"), "associations missing");
assert(byId["community"]?.items.includes("حاضنة الأسواق التجارية"), "markets missing");

const requiredTitles = [
  "حاضنة التقنية والتحول الرقمي",
  "حاضنة التعليم والتدريب",
  "حاضنة الصناعة والإنتاج",
  "حاضنة الطاقة والموارد الطبيعية",
  "حاضنة الإعلام والاتصال",
  "حاضنة العقار والبناء",
  "حاضنة السياحة والترفيه",
  "حاضنة الرياضة واللياقة",
  "حاضنة البيئة والاستدامة",
  "حاضنة الأمن والسلامة",
  "حاضنة الموارد البشرية",
  "الحاضنة التجارية",
  "حاضنة اللوجستيات",
  "الحاضنة التقنية",
  "حاضنة الصحة",
  "الحاضنة المالية",
  "حاضنة السياحة",
  "حاضنة الزراعة",
  "حاضنات المجتمع والقطاعات",
];
for (const title of requiredTitles) {
  assert(
    LAW_INCUBATOR_CATEGORIES.some((c) => c.title === title),
    `missing category: ${title}`
  );
}

const page = readFileSync(join(process.cwd(), "src/components/incubators-page.tsx"), "utf8");
assert(page.includes("LAW_INCUBATOR_CATEGORIES"), "incubators page must render categories");
assert(page.includes("platforms-overview-grid"), "must reuse platforms overview grid design");
assert(page.includes("platforms-items-grid"), "must reuse platforms items grid design");

const navbar = readFileSync(join(process.cwd(), "src/components/navbar.tsx"), "utf8");
assert(navbar.includes('{ href: "/incubators", label: "الحاضنات" }'), "navbar link missing");
assert(navbar.includes('label === "الحاضنات"'), "navbar active state missing");

const chrome = readFileSync(join(process.cwd(), "src/components/homepage-route-chrome.tsx"), "utf8");
assert(chrome.includes('/incubators'), "homepage chrome must treat /incubators as landing");

const route = readFileSync(join(process.cwd(), "src/app/incubators/page.tsx"), "utf8");
assert(route.includes("IncubatorsPage"), "route page missing IncubatorsPage");

const totalItems = LAW_INCUBATOR_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
assert(totalItems >= 80, `expected substantial catalog, got ${totalItems} items`);

console.log("✅ incubators catalog verified");
console.log(`   title: ${LAW_INCUBATORS_TITLE}`);
console.log(`   categories: ${LAW_INCUBATOR_CATEGORIES.length}`);
console.log(`   items: ${totalItems}`);
console.log(`   nav: /incubators beside المنصات`);
