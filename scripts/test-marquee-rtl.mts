/**
 * Verify announcement marquee: Arabic first word enters at the right edge, then moves left.
 * Run: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/test-marquee-rtl.mts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/marquee-rtl";
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

    const samples: string[] = [];
    const right = Math.floor(barRect.right - 2);
    const leftBound = Math.floor(Math.max(barRect.left, barRect.right - 160));
    for (let x = right; x >= leftBound; x -= 6) {
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
    const tokenEls = Array.from(inner.querySelectorAll(".announcement-token"));
    const tokens = tokenEls.map((el) => (el.textContent || "").trim());

    // Which token intersects the rightmost 80px of the bar?
    const rightTokens: string[] = [];
    for (const el of tokenEls) {
      const r = el.getBoundingClientRect();
      if (r.right < barRect.right - 80 || r.left > barRect.right - 1) continue;
      if (r.bottom < barRect.top || r.top > barRect.bottom) continue;
      rightTokens.push((el.textContent || "").trim());
    }

    return {
      barWidth: barRect.width,
      innerText: (inner.innerText || "").replace(/\s+/g, " ").trim(),
      tokens,
      token0: tokens[0] || "",
      barDir: bar.getAttribute("dir"),
      innerDir: inner.getAttribute("dir"),
      rightSamples: joined,
      rightTokens,
      // Start word (or a fragment of it) at the right — never the closing CTA
      rightHasIbda:
        rightTokens.includes("ابدأ") ||
        rightTokens.includes("الآن") ||
        /ابد|بدأ|دأ/.test(joined),
      rightHasSajil:
        rightTokens.some((t) => /سج[ّ]?ل|مجان/.test(t)) ||
        (/سج[ّ]?ل|مجان/.test(joined) && !rightTokens.includes("ابدأ")),
      partial:
        innerRect.left < barRect.right - 4 &&
        innerRect.left > barRect.left + 8 &&
        innerRect.right > barRect.right - 2,
      innerLeft: innerRect.left,
      tx,
      animName: style.animationName || "",
    };
  });
}

/** Seek until the strip is partially entering from the right. */
async function seekPartialEntry(page: Page, width: number) {
  for (let i = 0; i <= 50; i++) {
    const frac = i / 100;
    await setAnimProgress(page, frac);
    const p = await probe(page);
    if ("error" in p) continue;
    if (p.partial) return { frac, p };
  }
  // Fallback early frame
  await setAnimProgress(page, 0.08);
  return { frac: 0.08, p: await probe(page) };
}

async function captureViewport(page: Page, width: number, height: number, label: string) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover", { timeout: 20000 });
  await page.waitForTimeout(250);

  const { frac, p: t0 } = await seekPartialEntry(page, width);
  await page.waitForTimeout(40);
  await page.screenshot({
    path: path.join(OUT, `${label}-t0-right-entry.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });

  await setAnimProgress(page, Math.min(0.95, frac + 0.25));
  await page.waitForTimeout(40);
  const t35 = await probe(page);
  await page.screenshot({
    path: path.join(OUT, `${label}-t35-moving-left.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });

  const noHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });

  const textOk =
    !("error" in t0) &&
    t0.token0 === "ابدأ" &&
    t0.innerText.replace(/\s+/g, " ") === EXPECTED.replace(/\s+/g, " ");
  record(
    `${label}-text`,
    Boolean(textOk),
    `token0="${!('error' in t0) ? t0.token0 : ''}" text="${!('error' in t0) ? t0.innerText : t0.error}"`
  );

  record(
    `${label}-dirs`,
    !("error" in t0) && t0.barDir === "rtl" && t0.innerDir === "rtl",
    `barDir=${!('error' in t0) ? t0.barDir : ''} innerDir=${!('error' in t0) ? t0.innerDir : ''}`
  );

  record(
    `${label}-anim`,
    !("error" in t0) && (t0.animName || "").includes("homepageAnnouncementSlide"),
    `anim=${!('error' in t0) ? t0.animName : ''} tx0=${!('error' in t0) ? t0.tx : null} tx1=${!('error' in t35) ? t35.tx : null}`
  );

  const movedLeft =
    !("error" in t0) &&
    !("error" in t35) &&
    t0.tx != null &&
    t35.tx != null &&
    t35.tx < t0.tx;
  record(`${label}-moves-left`, movedLeft, `tx0=${!('error' in t0) ? t0.tx : null} tx1=${!('error' in t35) ? t35.tx : null}`);

  // Critical: at partial right-edge entry, start must show and end must not lead
  const entryOk =
    !("error" in t0) &&
    t0.rightHasIbda &&
    !t0.rightHasSajil;
  record(
    `${label}-right-entry-start`,
    entryOk,
    `frac=${frac} partial=${!('error' in t0) ? t0.partial : false} rightTokens=${JSON.stringify(!('error' in t0) ? t0.rightTokens : [])} samples="${!('error' in t0) ? t0.rightSamples : ''}" hasIbda=${!('error' in t0) ? t0.rightHasIbda : false} hasSajil=${!('error' in t0) ? t0.rightHasSajil : false}`
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

  // Find entry start, then capture through mid-travel
  const { frac } = await seekPartialEntry(page, width);
  const start = Math.max(0, frac - 0.02);
  for (let i = 0; i < 24; i++) {
    const f = start + (i / 23) * 0.4;
    await setAnimProgress(page, f);
    await page.waitForTimeout(25);
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
    !("error" in red) && red.token0 === "ابدأ" && redAnimNone,
    `token0=${!('error' in red) ? red.token0 : ''} anim=${!('error' in red) ? red.animName : ''}`
  );
  await reduced.screenshot({
    path: path.join(OUT, "reduced-motion-header.png"),
    clip: { x: 0, y: 0, width: 1280, height: 140 },
  });

  await captureFrames(page, 1440, 900, "frames-desktop", 100);
  await captureFrames(page, 390, 844, "frames-mobile", 90);

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
