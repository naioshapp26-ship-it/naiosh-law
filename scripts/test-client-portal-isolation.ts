/**
 * Permission / isolation checks for Client Portal 360 (fixture + API contract).
 * Run: npx tsx scripts/test-client-portal-isolation.ts
 */
import {
  DEMO_CLIENT_EMAIL,
  DEMO_CLIENT_ID,
  SERVICE_REQUEST_TYPES,
  demoPortalBundle,
  isClientRole,
  postLoginPath,
} from "../src/lib/client-portal";

const issues: string[] = [];

function assert(cond: unknown, msg: string) {
  if (!cond) issues.push(msg);
}

assert(isClientRole("client"), "client role detected");
assert(!isClientRole("admin"), "admin is not client");
assert(postLoginPath("client") === "/portal", "client lands on /portal");
assert(postLoginPath("admin") === "/app/dashboard", "admin lands on staff dashboard");

const bundle = demoPortalBundle();
assert(bundle.profile.isDemo === true, "demo profile flagged");
assert(bundle.profile.email === DEMO_CLIENT_EMAIL, "demo email");
assert(bundle.profile.id === DEMO_CLIENT_ID, "demo client id stable");
assert(bundle.cases.length >= 2, "demo has >=2 cases");
assert(bundle.sessions.some((s) => s.status === "مجدولة"), "demo upcoming session");
assert(bundle.documents.length >= 1, "demo documents");
assert(bundle.invoices.every((i) => i.isDemo && !i.collectible), "demo invoices not collectible");
assert(bundle.requests.length >= 1, "demo consultation request");
assert(bundle.notifications.length >= 1, "demo notifications");
assert(SERVICE_REQUEST_TYPES.length >= 6, "service request catalog");

// Ensure demo labels are clearly marked in case notes/titles
assert(
  bundle.cases.every((c) => c.title.includes("تجريب") || c.caseNo.startsWith("DEMO")),
  "demo cases labeled"
);

if (issues.length) {
  console.error("FAIL client portal isolation:");
  for (const i of issues) console.error(" -", i);
  process.exit(1);
}

console.log("PASS: client portal isolation + demo fixtures");
console.log(
  `demo cards: cases=${bundle.cases.length} sessions=${bundle.sessions.length} docs=${bundle.documents.length} invoices=${bundle.invoices.length}`
);
console.log(`request types: ${SERVICE_REQUEST_TYPES.join(" · ")}`);
