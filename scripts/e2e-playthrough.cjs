// End-to-end bot: plays all four routes (L1 window/chimney, L2 skylight/loading door) through real pointer input.
// Usage: npx vite --port 5199 & PLAYWRIGHT_PATH=<path to playwright> node scripts/e2e-playthrough.cjs
// Screenshots use canvas.toDataURL (page.screenshot hangs on this WSL box).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:5199/';
const OUT = process.env.OUT || '/home/stone/dev/night-shift/review/e2e';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 690 }, deviceScaleFactor: 2, hasTouch: false });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name) => {
    const data = await page.evaluate(() => document.getElementById('game').toDataURL('image/png'));
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
  };
  const map = await (async () => {
    return (lx, ly) => {
      const s = Math.min(375 / 540, 690 / 960);
      const ox = (375 - 540 * s) / 2, oy = (690 - 960 * s) / 2;
      return [ox + lx * s, oy + ly * s];
    };
  })();
  const st = () => page.evaluate(() => window.__nightShift.scene);
  const waitScene = async (name, ms = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if ((await st()) === name) return true; await sleep(100); }
    throw new Error(`timeout waiting for ${name}, at ${await st()}`);
  };

  async function fly(level, ringIndex, via) {
    await page.evaluate((l) => window.__nightShift.goto('flight', l), level);
    await waitScene('flight');
    await sleep(600);
    const ring = await page.evaluate((i) => { const a = window.__nightShift.active; return a.ringPts[i]; }, ringIndex);
    const pts = [...via, ring];
    let down = false;
    const t0 = Date.now();
    let wp = 0;
    while (Date.now() - t0 < 90000) {
      const s = await page.evaluate(() => { const a = window.__nightShift.active; if (!a || !a.saucer) return null; return { x: a.saucer.x, y: a.saucer.y, vx: a.saucer.vx, vy: a.saucer.vy, cx: a.camX, cy: a.camY, state: a.state, scene: window.__nightShift.scene }; });
      if (!s || s.scene !== 'flight') break;
      if (s.state === 'spotted') { if (down) { await page.mouse.up(); down = false; } wp = 0; await sleep(300); continue; }
      const tgt = pts[wp];
      const dx = tgt.x - s.x, dy = tgt.y - s.y, d = Math.hypot(dx, dy);
      const last = wp === pts.length - 1;
      if (!last && d < 50) { wp++; continue; }
      if (last && d < 22) { if (down) { await page.mouse.up(); down = false; } await sleep(100); continue; }
      // aim finger: proportional, with braking via velocity
      const lead = last ? Math.min(170, d * 0.9) : 170;
      let fx = dx / d * lead - s.vx * (last ? 0.35 : 0.1), fy = dy / d * lead - s.vy * (last ? 0.35 : 0.1);
      const sx = s.x - s.cx + fx, sy = s.y - s.cy + fy;
      const [px, py] = map(Math.max(5, Math.min(535, sx)), Math.max(130, Math.min(950, sy)));
      await page.mouse.move(px, py);
      if (!down) { await page.mouse.down(); down = true; }
      await sleep(40);
    }
    if (down) await page.mouse.up();
  }

  async function abduct() {
    await waitScene('abduct', 20000);
    await sleep(500);
    const route = await page.evaluate(() => window.__nightShift.active.debug.room.route);
    const ANCHOR = [270, 520];
    let fx = ANCHOR[0], fy = ANCHOR[1];
    const press = async () => { const [qx, qy] = map(fx, fy); await page.mouse.move(qx, qy); await page.mouse.down(); await sleep(50); };
    await press();
    const t0 = Date.now();
    for (const p of route) {
      const tEnd = Date.now() + p.seconds * 1000;
      const b0 = await page.evaluate(() => { const d = window.__nightShift.active.debug; return { x: d.body.beamX, y: d.body.beamY }; });
      const tStart = Date.now();
      while (true) {
        const info = await page.evaluate(() => { const a = window.__nightShift.active; if (!a || !a.debug) return null; const d = a.debug; return { x: d.body.beamX, y: d.body.beamY, done: d.delivered }; });
        if (!info || info.done) break;
        const k = Math.min(1, (Date.now() - tStart) / (tEnd - tStart));
        const tx = b0.x + (p.x - b0.x) * k, ty = b0.y + (p.y - b0.y) * k;
        const ddx = tx - info.x, ddy = ty - info.y;
        if (fx + ddx < 30 || fx + ddx > 510 || fy + ddy < 170 || fy + ddy > 880) { await page.mouse.up(); fx = ANCHOR[0]; fy = ANCHOR[1]; await press(); continue; }
        fx += ddx; fy += ddy;
        const [qx, qy] = map(fx, fy); await page.mouse.move(qx, qy);
        if (k >= 1 && Math.hypot(p.x - info.x, p.y - info.y) < 4) break;
        if (Date.now() - tEnd > 8000) break;
        await sleep(16);
      }
    }
    await page.mouse.up();
    while (Date.now() - t0 < 120000 && (await st()) === 'abduct') await sleep(200);
  }

  await page.goto(BASE + '?reset=1');
  await sleep(2500);
  await shot('00-boot');
  const results = {};
  const runs = [
    { level: 1, ring: 1, via: [{ x: 150, y: 1500 }, { x: 150, y: 450 }], name: 'L1-chimney' },
    { level: 1, ring: 0, via: [{ x: 150, y: 1400 }, { x: 150, y: 590 }], name: 'L1-window' },
    { level: 2, ring: 0, via: [{ x: 540, y: 1400 }, { x: 540, y: 700 }], name: 'L2-skylight' },
    { level: 2, ring: 1, via: [{ x: 540, y: 1500 }, { x: 540, y: 700 }, { x: 640, y: 330 }], name: 'L2-loading' },
  ];
  for (const r of runs) {
    await page.goto(BASE + '?unlock=1'); await sleep(2000);
    await fly(r.level, r.ring, r.via);
    await shot(`${r.name}-a-flight-end`);
    try { await abduct(); } catch (e) { results[r.name] = 'abduct error ' + e.message; await shot(`${r.name}-err`); continue; }
    await sleep(6000);
    await shot(`${r.name}-b-report`);
    results[r.name] = { scene: await st(), save: await page.evaluate(() => JSON.parse(JSON.stringify(window.__nightShift.save))) };
  }
  console.log(JSON.stringify({ results, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
