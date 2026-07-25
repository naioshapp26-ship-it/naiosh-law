/**
 * Ensure ERP studio CSS is declared for first paint (no overlapping table text).
 * Run: npx tsx scripts/test-erp-studio-first-paint.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const globals = readFileSync(resolve("src/app/globals.css"), "utf8");
const workspace = readFileSync(resolve("src/components/erp-module-workspace.tsx"), "utf8");
const shell = readFileSync(resolve("src/components/app-shell.tsx"), "utf8");

assert(
  layout.includes('href="/erp-app/studio.css') && layout.includes('data-erp-studio="1"'),
  "root layout must include studio.css link for first paint"
);
assert(
  layout.indexOf("/newhome/ads-page.css") < layout.indexOf("/erp-app/studio.css"),
  "studio.css must load after homepage CSS so ERP table rules win"
);
assert(
  globals.includes(".erp-workspace .table-cell") && globals.includes("white-space: nowrap"),
  "globals must ship critical ERP table nowrap styles"
);
assert(
  workspace.includes("Prefer stylesheet already declared in root layout"),
  "erp workspace hook must prefer layout stylesheet"
);
assert(
  shell.includes('link[data-erp-studio]') && shell.includes("MutationObserver"),
  "app shell must re-ensure studio.css if Next drops the link"
);

console.log("✅ ERP studio first-paint protections verified");
console.log("   layout: studio.css in <head>");
console.log("   globals: critical .erp-workspace table/panel rules");
console.log("   app-shell: MutationObserver keep-alive");
