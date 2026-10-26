/**
 * Verify announcement marquee: Arabic first word enters at the right edge, then moves left.
 * Run: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/test-marquee-rtl.mts
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/marquee-rtl";

type Row = { id: string; ok: boolean; detail: string };
const results: Row[] = [];

function record(id: string, ok: boolean, detail: string) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

async function sampleRightEdgeText(page: Page) {
  return page.evaluate(() => {
    const bar = document.querySelector(".announcement-bar") as HTMLElement | null;
    const inner = document.querySelector(".announcement-inner") as HTMLElement | null;
    if (!bar || !inner) return { error: "missing elements" as const };

    const barRect = bar.getBoundingClientRect();
    // Probe a few points near the right edge of the bar
    const ys = [barRect.top + barRect.height / 2];
    const xs = [
      barRect.right - 8,
      barRect.right - 24,
      barRect.right - 48,
      barRect.right - 80,
    ];
    const chars: string[] = [];
    for (const y of ys) {
      for (const x of xs) {
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        const tn = document.caretRangeFromPoint
          ? (() => {
              const r = document.caretRangeFromPoint(x, y);
              if (!r) return "";
              const node = r.startContainer;
              const text = node.textContent || "";
              const offset = Math.min(r.startOffset, Math.max(0, text.length - 1));
              return text.slice(Math.max(0, offset - 2), offset + 6);
            })()
          : "";
        if (tn) chars.push(tn);
      }
    }

    const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
    const style = mover ? getComputedStyle(mover) : null;
    const transform = style?.transform || "";
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    const tx = matrix ? parseFloat(matrix[1].split(",")[4]) : null;

    return {
      barWidth: barRect.width,
      innerText: (inner.innerText || "").replace(/\s+/g, " ").trim(),
      startsWithIbda: (inner.innerText || "").trim().startsWith("ابدأ"),
      probe: chars.join(" | "),
      tx,
      animName: style?.animationName || "",
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      overflowX: getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      barOverflowX: getComputedStyle(bar).overflowX,
    };
  });
}

async function captureViewport(page: Page, width: number, height: number, label: string) {
  await page.setViewportSize({ width, height });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover", { timeout: 20000 });
  await page.waitForTimeout(400);

  // Force animation to near-start: set currentTime ≈ 0 via Web Animations API
  await page.evaluate(() => {
    const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
    if (!mover) return;
    const anims = mover.getAnimations();
    for (const a of anims) {
      a.currentTime = 50; // just after start so first glyphs are entering
    }
  });
  await page.waitForTimeout(80);
  await page.screenshot({
    path: path.join(OUT, `${label}-t0-right-entry.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });
  const t0 = await sampleRightEdgeText(page);

  await page.evaluate(() => {
    const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
    if (!mover) return;
    for (const a of mover.getAnimations()) {
      // ~35% through the cycle — text should have moved leftward
      const d = typeof a.effect?.getTiming().duration === "number"
        ? (a.effect!.getTiming().duration as number)
        : 28000;
      a.currentTime = d * 0.35;
    }
  });
  await page.waitForTimeout(80);
  await page.screenshot({
    path: path.join(OUT, `${label}-t35-moving-left.png`),
    clip: { x: 0, y: 0, width, height: Math.min(120, height) },
  });
  const t35 = await sampleRightEdgeText(page);

  const noHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });

  record(
    `${label}-text-rtl`,
    Boolean(t0.startsWithIbda),
    `text="${t0.innerText}" startsWithIbda=${t0.startsWithIbda}`
  );
  record(
    `${label}-anim`,
    (t0.animName || "").includes("homepageAnnouncementSlide"),
    `anim=${t0.animName} tx0=${t0.tx} tx35=${t35.tx}`
  );
  // Movement right→left means translateX decreases over time (from +W toward -W)
  const movedLeft =
    t0.tx != null && t35.tx != null && t35.tx < t0.tx;
  record(`${label}-moves-left`, movedLeft, `tx0=${t0.tx} tx35=${t35.tx}`);
  record(`${label}-no-hscroll`, noHScroll, `noHScroll=${noHScroll}`);

  // Full page context shot (header only area wider)
  await page.screenshot({ path: path.join(OUT, `${label}-header.png`), clip: { x: 0, y: 0, width, height: Math.min(160, height) } });

  return { t0, t35 };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ locale: "ar" });

  const widths = [
    { w: 1920, h: 900, label: "desktop-1920" },
    { w: 768, h: 900, label: "tablet-768" },
    { w: 390, h: 844, label: "mobile-390" },
    { w: 360, h: 740, label: "mobile-360" },
  ];

  for (const v of widths) {
    await captureViewport(page, v.w, v.h, v.label);
  }

  // prefers-reduced-motion: animation off, text still RTL and starts with ابدأ
  const reduced = await browser.newPage({ locale: "ar", reducedMotion: "reduce" });
  await reduced.setViewportSize({ width: 1280, height: 800 });
  await reduced.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await reduced.waitForSelector(".announcement-inner", { timeout: 20000 });
  const red = await sampleRightEdgeText(reduced);
  const redAnimNone =
    !red.animName || red.animName === "none" || (await reduced.evaluate(() => {
      const m = document.querySelector(".announcement-mover") as HTMLElement | null;
      return !m || getComputedStyle(m).animationName === "none" || getComputedStyle(m).animationDuration === "0s";
    }));
  record("reduced-motion", Boolean(red.startsWithIbda && redAnimNone), `startsWithIbda=${red.startsWithIbda} anim=${red.animName}`);
  await reduced.screenshot({
    path: path.join(OUT, "reduced-motion-header.png"),
    clip: { x: 0, y: 0, width: 1280, height: 140 },
  });

  // Short frame sequence for video (desktop + mobile)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover");
  const framesDir = path.join(OUT, "frames-desktop");
  fs.mkdirSync(framesDir, { recursive: true });
  for (let i = 0; i < 16; i++) {
    await page.evaluate((i) => {
      const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
      if (!mover) return;
      for (const a of mover.getAnimations()) {
        const d = typeof a.effect?.getTiming().duration === "number"
          ? (a.effect!.getTiming().duration as number)
          : 28000;
        a.currentTime = (d * i) / 16;
      }
    }, i);
    await page.waitForTimeout(40);
    await page.screenshot({
      path: path.join(framesDir, `f${String(i).padStart(2, "0")}.png`),
      clip: { x: 0, y: 0, width: 1440, height: 100 },
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".announcement-mover");
  const framesMobile = path.join(OUT, "frames-mobile");
  fs.mkdirSync(framesMobile, { recursive: true });
  for (let i = 0; i < 16; i++) {
    await page.evaluate((i) => {
      const mover = document.querySelector(".announcement-mover") as HTMLElement | null;
      if (!mover) return;
      for (const a of mover.getAnimations()) {
        const d = typeof a.effect?.getTiming().duration === "number"
          ? (a.effect!.getTiming().duration as number)
          : 28000;
        a.currentTime = (d * i) / 16;
      }
    }, i);
    await page.waitForTimeout(40);
    await page.screenshot({
      path: path.join(framesMobile, `f${String(i).padStart(2, "0")}.png`),
      clip: { x: 0, y: 0, width: 390, height: 90 },
    });
  }

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
