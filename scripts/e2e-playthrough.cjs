// End-to-end bot: plays all four tutorial routes (L1 window/chimney, L2 skylight/loading door), then
// full deep shifts of L3 and L4, all through real pointer input.
// Deep shifts use the scenes' own autopilots: flight `debug.autopilot()` is an absolute finger
// position (logical px), abduction `debug.autopilot()` is a finger delta applied as a held drag.
// Usage: npx vite --port 5199 & PLAYWRIGHT_PATH=<path to playwright> node scripts/e2e-playthrough.cjs
// Env: ONLY=tutorial|deep|L3|L4 to run a subset.
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
    await installDriver();
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

  // ------------------------------------------------------------------ deep shifts (L3, L4)
  /** In-page per-frame driver for the abduction autopilot (see the abduct branch of deepShift). */
  async function installDriver() {
    await page.evaluate(() => {
      if (window.__e2eDrv) return;
      const drv = (window.__e2eDrv = { fx: 270, fy: 520, on: false, flight: null });
      const tick = () => {
        const ns = window.__nightShift;
        const a = ns && ns.active;
        const p = ns && ns.pointer;
        // flight: ask the autopilot every frame; the bot replays its finger with the real mouse
        if (ns && ns.scene === 'flight' && a && a.debug && typeof a.debug.autopilot === 'function') {
          const it = a.debug.autopilot();
          drv.flight = { down: it.down, x: it.x, y: it.y };
        } else drv.flight = null;
        if (ns && ns.scene === 'abduct' && a && a.debug && typeof a.debug.autopilot === 'function' && drv.on && p && p.down) {
          const body = a.debug.body;
          const bx = body.beamX;
          const by = body.beamY;
          // predict: the beam will move by however far the finger still has to travel
          body.beamX = bx + (drv.fx - p.x);
          body.beamY = by + (drv.fy - p.y);
          let it;
          try { it = a.debug.autopilot(); } finally { body.beamX = bx; body.beamY = by; }
          drv.fx += it.dx;
          drv.fy += it.dy;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function deepShift(level, name) {
    await page.goto(BASE + '?unlock=1');
    await sleep(2000);
    await page.evaluate((l) => window.__nightShift.goto('flight', l), level);
    await waitScene('flight');
    await installDriver();
    const log = [];
    const t0 = Date.now();
    let down = false;
    let lastScene = '';
    let shots = 0;
    let fx = 270, fy = 520; // abduction finger (logical)
    const ANCHOR = [270, 520];
    const up = async () => { if (down) { await page.mouse.up(); down = false; } };
    const moveTo = async (lx, ly) => { const [px, py] = map(lx, ly); await page.mouse.move(px, py); };
    while (Date.now() - t0 < 600000) {
      const info = await page.evaluate(() => {
        const ns = window.__nightShift;
        const a = ns.active;
        const run = ns.run;
        const base = { scene: ns.scene, clock: run ? run.clockText() : null, elapsed: run ? run.elapsed : null, delivered: run ? run.delivered.slice() : null, spotted: run ? run.spotted : null, failed: run ? run.failedAbductions : null };
        if (!a || !a.debug || typeof a.debug.autopilot !== 'function') return base;
        if (ns.scene === 'flight') { const f = window.__e2eDrv && window.__e2eDrv.flight; return { ...base, kind: 'flight', it: f ? { down: f.down, x: f.x, y: f.y } : null, state: a.state }; }
        if (ns.scene === 'abduct') return { ...base, kind: 'abduct', drv: window.__e2eDrv ? { fx: window.__e2eDrv.fx, fy: window.__e2eDrv.fy } : null };
        return base;
      });
      if (info.scene !== lastScene) {
        log.push({ at: ((Date.now() - t0) / 1000).toFixed(1), scene: info.scene, clock: info.clock, delivered: info.delivered, spotted: info.spotted, failed: info.failed });
        await up();
        await page.evaluate(() => { if (window.__e2eDrv) window.__e2eDrv.on = false; });
        if (shots < 24 && (info.scene === 'abduct' || info.scene === 'flight' || info.scene === 'choice')) { await sleep(700); await shot(`${name}-${String(++shots).padStart(2, '0')}-${info.scene}`); }
        lastScene = info.scene;
        fx = ANCHOR[0]; fy = ANCHOR[1];
        continue;
      }
      if (info.scene === 'report') { await sleep(3500); await shot(`${name}-zz-report`); break; }
      if (info.scene === 'choice') { await up(); await moveTo(270, 598); await page.mouse.down(); await sleep(60); await page.mouse.up(); await sleep(600); continue; }
      if (info.kind === 'flight') {
        if (!info.it) { await installDriver(); await sleep(30); continue; }
        const it = info.it;
        if (!it.down) { await up(); await sleep(16); continue; }
        await moveTo(Math.max(2, Math.min(538, it.x)), Math.max(84, Math.min(958, it.y)));
        if (!down) { await page.mouse.down(); down = true; }
        await sleep(8);
        continue;
      }
      if (info.kind === 'abduct') {
        // The abduction pilot runs every frame inside the page (installDriver); it integrates its
        // per-frame drag into a finger target, seeing the beam where the moves still in flight will
        // put it. Here we just move the real mouse to that target, re-anchoring near the edges.
        if (!info.drv) { await installDriver(); continue; }
        if (!down) {
          await page.evaluate(([x, y]) => { const d = window.__e2eDrv; d.fx = x; d.fy = y; d.on = true; }, ANCHOR);
          fx = ANCHOR[0]; fy = ANCHOR[1];
          await moveTo(fx, fy); await page.mouse.down(); down = true; await sleep(30); continue;
        }
        const tx = info.drv.fx, ty = info.drv.fy;
        if (tx < 30 || tx > 510 || ty < 170 || ty > 900) {
          // lift, carry the not-yet-sent part of the drag over to the anchor, press again
          await page.mouse.up(); down = false;
          const nx = ANCHOR[0] + (tx - fx), ny = ANCHOR[1] + (ty - fy);
          await page.evaluate(([x, y]) => { const d = window.__e2eDrv; d.fx = x; d.fy = y; }, [nx, ny]);
          fx = ANCHOR[0]; fy = ANCHOR[1];
          await moveTo(fx, fy); await page.mouse.down(); down = true; await sleep(20); continue;
        }
        if (Math.abs(tx - fx) < 0.05 && Math.abs(ty - fy) < 0.05) { await sleep(8); continue; }
        fx = tx; fy = ty;
        await moveTo(fx, fy);
        continue;
      }
      await up();
      await sleep(100);
    }
    await up();
    const end = await page.evaluate(() => ({ scene: window.__nightShift.scene, level: JSON.parse(JSON.stringify(window.__nightShift.save.levels)) }));
    return { wallSec: ((Date.now() - t0) / 1000).toFixed(1), end, log };
  }

  const ONLY = process.env.ONLY || '';
  await page.goto(BASE + '?reset=1');
  await sleep(2500);
  await shot('00-boot');
  const results = {};
  if (ONLY === 'deep' || ONLY === 'L3' || ONLY === 'L4') {
    if (ONLY !== 'L4') results.L3 = await deepShift(3, 'L3');
    if (ONLY !== 'L3') results.L4 = await deepShift(4, 'L4');
    console.log(JSON.stringify({ results, errors }, null, 1));
    await browser.close();
    return;
  }
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
  if (ONLY !== 'tutorial') {
    results.L3 = await deepShift(3, 'L3');
    results.L4 = await deepShift(4, 'L4');
  }
  console.log(JSON.stringify({ results, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
