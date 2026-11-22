// End-to-end bot: plays L1 (chimney) and L2 (loading door) through real pointer input.
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
    const route = await page.evaluate(async () => {
      const a = window.__nightShift.active.debug;
      return a.room ? a.room.route : null;
    });
    if (!route) throw new Error('no route');
    const ANCHOR = [270, 520];
    let fx = ANCHOR[0], fy = ANCHOR[1];
    const [ax, ay] = map(fx, fy);
    await page.mouse.move(ax, ay); await page.mouse.down();
    for (const p of route) {
      const b = await page.evaluate(() => { const d = window.__nightShift.active.debug; return { x: d.body.beamX, y: d.body.beamY }; });
      const frames = Math.ceil(p.seconds * 30);
      let prevX = b.x, prevY = b.y;
      for (let f = 1; f <= frames; f++) {
        const t = f / frames;
        const nx = b.x + (p.x - b.x) * t, ny = b.y + (p.y - b.y) * t;
        let ddx = nx - prevX, ddy = ny - prevY;
        if (fx + ddx < 30 || fx + ddx > 510 || fy + ddy < 160 || fy + ddy > 880) {
          await page.mouse.up(); fx = ANCHOR[0]; fy = ANCHOR[1];
          const [qx, qy] = map(fx, fy); await page.mouse.move(qx, qy); await page.mouse.down(); await sleep(40);
        }
        fx += ddx; fy += ddy; prevX = nx; prevY = ny;
        const [qx, qy] = map(fx, fy);
        await page.mouse.move(qx, qy);
        await sleep(33);
      }
    }
    await page.mouse.up();
    const t0 = Date.now();
    while (Date.now() - t0 < 15000 && (await st()) === 'abduct') await sleep(200);
    return page.evaluate(() => { const a = window.__nightShift.active; return null; });
  }

  await page.goto(BASE + '?reset=1');
  await sleep(2500);
  await shot('00-boot');
  const results = {};
  const runs = [
    { level: 1, ring: 1, via: [{ x: 150, y: 1500 }, { x: 150, y: 450 }], name: 'L1-chimney' },
    { level: 2, ring: 1, via: [{ x: 540, y: 1500 }, { x: 540, y: 700 }, { x: 640, y: 330 }], name: 'L2-loading' },
  ];
  for (const r of runs) {
    await fly(r.level, r.ring, r.via);
    await shot(`${r.name}-a-flight-end`);
    try { await abduct(); } catch (e) { results[r.name] = 'abduct error ' + e.message; await shot(`${r.name}-err`); continue; }
    await sleep(2500);
    await shot(`${r.name}-b-report`);
    results[r.name] = { scene: await st(), save: await page.evaluate(() => JSON.parse(JSON.stringify(window.__nightShift.save))) };
  }
  console.log(JSON.stringify({ results, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
