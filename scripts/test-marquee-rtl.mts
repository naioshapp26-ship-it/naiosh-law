/**
 * Verify announcement marquee:
 * - Enters from the far LEFT, travels toward the RIGHT
 * - First Arabic word (ابدأ) appears first; natural RTL inside the sentence
 * Run: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/test-marquee-rtl.mts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/marquee-ltr-motion";
const EXPECTED =
  "ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 — سجّل مجانًا";

type Row = { id: string; ok: boolean; detail: string };
const results: Row[] = [];

function record(id: string, ok: boolean, detail: string) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

async function setAnimProgress(page: Page, fraction: number) {
  await page.evaluate((fraction) => {
    const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
    if (!mover) return;
    for (const a of mover.getAnimations()) {
      const timing = a.effect?.getTiming();
      const d =
        typeof timing?.duration === "number" ? (timing.duration as number) : 28000;
      a.currentTime = d * fraction;
    }
  }, fraction);
}

async function probe(page: Page) {
  return page.evaluate(() => {
    const bar = document.querySelector(".announcement-bar") as HTMLElement | null;
    const inner = document.querySelector(".announcement-inner") as HTMLElement | null;
    const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
    if (!bar || !inner || !mover) return { error: "missing elements" as const };

    const barRect = bar.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const y = barRect.top + barRect.height / 2;

    // Sample near the LEFT edge (entry side for left→right motion)
    const samples: string[] = [];
    const left = Math.floor(barRect.left + 2);
    const rightBound = Math.floor(Math.min(barRect.right, barRect.left + 160, innerRect.right));
    for (let x = left; x <= rightBound; x += 5) {
      if (x < innerRect.left || x > innerRect.right) continue;
      const range = document.caretRangeFromPoint?.(x, y);
      if (!range) continue;
      const text = range.startContainer.textContent || "";
      if (!text.trim()) continue;
      const o = Math.min(range.startOffset, Math.max(0, text.length - 1));
      samples.push(text.slice(Math.max(0, o - 1), o + 4));
    }

    const joined = samples.join(" ");
    const style = getComputedStyle(mover);
    const matrix = (style.transform || "").match(/matrix\(([^)]+)\)/);
    const tx = matrix ? parseFloat(matrix[1].split(",")[4]) : null;

    // Just entering from left: right edge of text past bar.left, most of text still left of bar
    const justEntering =
      innerRect.right > barRect.left + 2 &&
      innerRect.left < barRect.left - 20 &&
      innerRect.right < barRect.left + 120;

    return {
      innerText: (inner.innerText || "").replace(/\s+/g, " ").trim(),
      startsWithIbda: (inner.innerText || "").trim().startsWith("ابدأ"),
      barDir: bar.getAttribute("dir"),
      innerDir: inner.getAttribute("dir") || getComputedStyle(inner).direction,
      leftSamples: joined,
      leftHasIbda: /ابد|بدأ|دأ/.test(joined),
      leftHasSajil: /سج[ّ]?ل|مجان/.test(joined),
      justEntering,
      innerLeft: innerRect.left,
      innerRight: innerRect.right,
      tx,
      animName: style.animationName || "",
    };
  });
}

async function seekJustEntering(page: Page) {
  for (let i = 0; i <= 100; i++) {
    const frac = i / 400;
    await setAnimProgress(page, frac);
    const p = await probe(page);
    if ("error" in p) continue;
    if (p.justEntering && p.leftHasIbda) return { frac, p };
  }
  await setAnimProgress(page, 0.01);
  return { frac: 0.01, p: await probe(page) };
}

async function captureViewport(page: Page, width: number, height: number, label: string) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover", { timeout: 20000 });
  await page.waitForTimeout(250);

  const { frac, p: t0 } = await seekJustEntering(page);
  await page.waitForTimeout(40);
  await page.screenshot({
    path: path.join(OUT, `${label}-t0-left-entry.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });

  await setAnimProgress(page, Math.min(0.95, frac + 0.2));
  await page.waitForTimeout(40);
  const t1 = await probe(page);
  await page.screenshot({
    path: path.join(OUT, `${label}-t-moving-right.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });

  const noHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });

  record(
    `${label}-text`,
    !("error" in t0) && t0.startsWithIbda && t0.innerText === EXPECTED,
    `text="${!("error" in t0) ? t0.innerText : t0.error}"`
  );
  record(
    `${label}-rtl`,
    !("error" in t0) && t0.barDir === "rtl" && t0.innerDir === "rtl",
    `barDir=${!("error" in t0) ? t0.barDir : ""} innerDir=${!("error" in t0) ? t0.innerDir : ""}`
  );
  record(
    `${label}-anim`,
    !("error" in t0) && (t0.animName || "").includes("homepageAnnouncementSlide"),
    `anim=${!("error" in t0) ? t0.animName : ""}`
  );

  // Left→right means translateX increases over time
  const movesRight =
    !("error" in t0) &&
    !("error" in t1) &&
    t0.tx != null &&
    t1.tx != null &&
    t1.tx > t0.tx;
  record(
    `${label}-moves-right`,
    movesRight,
    `tx0=${!("error" in t0) ? t0.tx : null} tx1=${!("error" in t1) ? t1.tx : null}`
  );

  const entryOk =
    !("error" in t0) && t0.leftHasIbda && !t0.leftHasSajil;
  record(
    `${label}-left-entry-start`,
    entryOk,
    `frac=${frac} just=${!("error" in t0) ? t0.justEntering : false} samples="${!("error" in t0) ? t0.leftSamples : ""}" hasIbda=${!("error" in t0) ? t0.leftHasIbda : false} hasSajil=${!("error" in t0) ? t0.leftHasSajil : false}`
  );

  record(`${label}-no-hscroll`, noHScroll, `noHScroll=${noHScroll}`);
}

async function captureFrames(
  page: Page,
  width: number,
  height: number,
  dirName: string,
  clipH: number
) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover");
  const framesDir = path.join(OUT, dirName);
  fs.mkdirSync(framesDir, { recursive: true });

  const { frac } = await seekJustEntering(page);
  const start = Math.max(0, frac - 0.005);
  for (let i = 0; i < 32; i++) {
    const f = start + (i / 31) * 0.35;
    await setAnimProgress(page, f);
    await page.waitForTimeout(20);
    await page.screenshot({
      path: path.join(framesDir, `f${String(i).padStart(2, "0")}.png`),
      clip: { x: 0, y: 0, width, height: clipH },
    });
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ locale: "ar" });

  for (const v of [
    { w: 1920, h: 900, label: "desktop-1920" },
    { w: 768, h: 900, label: "tablet-768" },
    { w: 390, h: 844, label: "mobile-390" },
    { w: 360, h: 740, label: "mobile-360" },
  ]) {
    await captureViewport(page, v.w, v.h, v.label);
  }

  const reduced = await browser.newPage({ locale: "ar", reducedMotion: "reduce" });
  await reduced.setViewportSize({ width: 1280, height: 800 });
  await reduced.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await reduced.waitForSelector(".announcement-inner", { timeout: 20000 });
  const red = await probe(reduced);
  const redAnimNone = await reduced.evaluate(() => {
    const m = document.querySelector(".announcement-mover") as HTMLElement | null;
    if (!m) return true;
    const s = getComputedStyle(m);
    return s.animationName === "none" || s.animationDuration === "0s";
  });
  record(
    "reduced-motion",
    !("error" in red) && red.startsWithIbda && redAnimNone,
    `startsWithIbda=${!("error" in red) ? red.startsWithIbda : false} anim=${!("error" in red) ? red.animName : ""}`
  );
  await reduced.screenshot({
    path: path.join(OUT, "reduced-motion-header.png"),
    clip: { x: 0, y: 0, width: 1280, height: 140 },
  });

  await captureFrames(page, 1440, 900, "frames-desktop", 110);
  await captureFrames(page, 390, 844, "frames-mobile", 100);

  await browser.close();

  const summary = {
    results,
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
  };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log("\n=== SUMMARY ===", summary.pass, "PASS /", summary.fail, "FAIL");
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
