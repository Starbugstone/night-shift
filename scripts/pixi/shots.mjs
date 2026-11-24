#!/usr/bin/env node
// Capture game frames for before/after comparison (docs/PIXI-MIGRATION.md).
//   node scripts/pixi/shots.mjs BASE_URL OUT_DIR name=/?query[@ms] ...
// Each shot opens BASE_URL + query (375×690 CSS px, DPR 2, touch), waits until the
// loading scene is gone plus `ms` (default 1200) of real time, then saves __nightShift.capture()
// (or a direct capture on the old Canvas 2D build) as OUT_DIR/name.png. Prints page errors.
// Playwright comes from the media tooling (source ~/.local/share/claude-media-tools/env.sh).
// Real GPU on WSL: GALLIUM_DRIVER=d3d12 LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH.
import { mkdirSync, writeFileSync } from 'node:fs';

const [base, out, ...shots] = process.argv.slice(2);
if (!base || !out || shots.length === 0) {
  console.error('usage: shots.mjs BASE_URL OUT_DIR name=/?query[@ms] ...');
  process.exit(2);
}
mkdirSync(out, { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: (process.env.GPUARGS ?? '--use-angle=gl --ignore-gpu-blocklist --enable-gpu').split(' ').filter(Boolean) });
const ctx = await browser.newContext({ viewport: { width: 375, height: 690 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`);
});
let failed = false;
for (const s of shots) {
  const eq = s.indexOf('=');
  const name = s.slice(0, eq);
  const [path, wait] = s.slice(eq + 1).split('@');
  await page.goto(base + path);
  try {
    await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene !== 'loading', null, { timeout: 20000 });
  } catch {
    errors.push(`${name}: game fixtures did not become ready after 20 s. Use the dev server or a build made with --mode e2e.`);
    failed = true;
    continue;
  }
  await page.waitForTimeout(Number(wait ?? 1200));
  const url = await page.evaluate(() => {
    if (window.__nightShift?.capture) return window.__nightShift.capture();
    const canvas = document.querySelector('canvas#game');
    return canvas?.getContext('2d') ? canvas.toDataURL('image/png') : null;
  });
  if (!url?.startsWith('data:image/png;base64,')) {
    errors.push(`${name}: the capture hook did not return a PNG`);
    failed = true;
    continue;
  }
  writeFileSync(`${out}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${name}: scene ${await page.evaluate(() => window.__nightShift?.scene)} -> ${out}/${name}.png`);
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
process.exit(failed || errors.some((e) => e.startsWith('pageerror')) ? 1 : 0);
