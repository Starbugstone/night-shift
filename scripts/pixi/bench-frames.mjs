// Frame-time bench (docs/PIXI-MIGRATION.md): real requestAnimationFrame timing with CDP CPU throttling.
//   THROTTLE=1,4,6 PAGES=flight=3,room=dave_roof node scripts/pixi/bench-frames.mjs BASE_URL
// Prints fps, frame interval p50/p95 and main-thread update, sync and render time per frame.
// Use the real GPU on WSL (see shots.mjs) or the numbers measure software rendering.
const base = process.argv[2];
if (!base) {
  console.error('usage: bench-frames.mjs BASE_URL');
  process.exit(2);
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const extra = process.argv[3] ?? '';
const throttles = (process.env.THROTTLE ?? '1,4').split(',').map(Number);
const pages = (process.env.PAGES ?? 'flight=3,flight=5,flight=7,room=dave_roof,title').split(',');
const browser = await chromium.launch({ args: (process.env.GPUARGS ?? '').split(' ').filter(Boolean) });
const ctx = await browser.newContext({ viewport: { width: 375, height: 690 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(base + '/?unlock=1' + extra);
const gl = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); const e = c?.getExtension('WEBGL_debug_renderer_info'); return c ? c.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : c.RENDERER) : 'none'; });
console.log('GL:', gl);
for (const p of pages) {
  await page.goto(base + '/?unlock=1&' + p + extra);
  await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene !== 'loading', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  for (const th of throttles) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: th });
    const r = await page.evaluate(async () => {
      const h = window.__nightShift;
      const ft = []; let last = performance.now(); const end = last + 5000;
      await new Promise((done) => { const tick = (now) => { ft.push(now - last); last = now; if (now < end) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
      // Read the game's samples for update, scene sync and the Pixi render call.
      const work = [];
      if (h.frameMs) { const n = Math.min(h.frameMs.length, ft.length); for (let i = 0; i < n; i++) work.push(h.frameMs[(h.frameAt - 1 - i + h.frameMs.length) % h.frameMs.length]); }
      const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))] ?? NaN; };
      const avg = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
      return { scene: h.scene, fps: ft.length / 5, ftP50: pct(ft, 0.5), ftP95: pct(ft, 0.95), workAvg: avg(work), workP95: pct(work, 0.95), slow: ft.filter((x) => x > 20).length };
    });
    console.log(p.padEnd(18), `x${th}`, JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(2) : v]))));
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
}
await browser.close();
