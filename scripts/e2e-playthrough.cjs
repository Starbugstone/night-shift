// End-to-end bot: plays all four tutorial routes (L1 window/chimney, L2 skylight/loading door), then
// full deep shifts from L3 through L9, all through real pointer input.
// Every abduction (tutorial and deep) is driven by the scene's own per-frame autopilot through
// `debug.autopilotFinger()`: the screen point to hold the mouse button at (the beam heads for it).
// The mouse stays down for the whole room.
// Deep flights use the flight `debug.autopilot()` (an absolute finger position, logical px);
// tutorial flights steer through fixed waypoints.
// Run it against a preview build, not the dev server (HMR reloads kill long runs):
//   npm run build -- --mode e2e --outDir review/e2e-build
//   npm run preview -- --outDir review/e2e-build --port <free port> --strictPort
//   source ~/.local/share/claude-media-tools/env.sh
//   BASE=http://localhost:<port>/ node scripts/e2e-playthrough.cjs   (add GPUARGS=... for the real GPU, below)
// Env: ONLY=tutorial|deep|L3…L9|probe to run a subset (RUNS=L1-window,... picks tutorial routes, ROOM= the probe room); PLAYWRIGHT_PATH or PLAYWRIGHT_MODULE to find playwright.
// CAR_FIRST=1 exercises the optional intercept on L9 and requires all four stars.
// Screenshots use window.__nightShift.capture() (page.screenshot hangs on this WSL box, and the
// WebGL canvas is blank to toDataURL outside the frame that drew it).
const path = require('path');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:5199/';
const OUT = process.env.OUT || path.resolve(__dirname, '../review/e2e');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Bot idle poll interval. Polling this hard slows the game clock (to roughly 0.4x real time on
// this box), which is harmless (everything runs on the game clock) but makes runs long.
const POLL_MS = Number(process.env.POLL_MS || 8);
(async () => {
  const { chromium } = process.env.PLAYWRIGHT_PATH
    ? require(process.env.PLAYWRIGHT_PATH)
    : await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  // GPUARGS picks the GL backend. The game renders with WebGL (Pixi): on software GL (SwiftShader,
  // the default here) it is far slower than on a GPU. The real GPU on WSL:
  //   GALLIUM_DRIVER=d3d12 LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH GPUARGS='--use-angle=gl --ignore-gpu-blocklist --enable-gpu'
  const args = (process.env.GPUARGS || '--use-angle=swiftshader --enable-unsafe-swiftshader').split(' ').filter(Boolean);
  const browser = await chromium.launch({ args });
  // DSF 1: with swiftshader at DSF 2 every mouse.move stalls the renderer here (~6 moves/s) and the
  // game runs at about 0.16x real time; at DSF 1 it runs in real time. Override with DSF=2.
  const page = await browser.newPage({ viewport: { width: 375, height: 690 }, deviceScaleFactor: Number(process.env.DSF || 1), hasTouch: false });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = async (name) => {
    // the game canvas is WebGL: capture() renders and reads it in one go
    const data = await page.evaluate(() => window.__nightShift.capture());
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
  };
  const map = await (async () => {
    return (lx, ly) => {
      const s = Math.min(375 / 540, 690 / 960);
      const ox = (375 - 540 * s) / 2, oy = (690 - 960 * s) / 2;
      return [ox + lx * s, oy + ly * s];
    };
  })();
  const st = () => page.evaluate(() => window.__nightShift?.scene);
  const waitScene = async (name, ms = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if ((await st()) === name) return true; await sleep(100); }
    throw new Error(`timeout waiting for ${name}, at ${await st()}`);
  };

  async function openFixture(query) {
    await page.goto(BASE + query);
    try {
      await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene !== 'loading');
    } catch (error) {
      throw new Error('Game fixtures did not become ready. Serve a build made with --mode e2e.', { cause: error });
    }
  }

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
      if (s.state === 'spotted') {
        // the SPOTTED card waits for a tap
        if (down) { await page.mouse.up(); down = false; }
        wp = 0; await sleep(1200);
        const box = await page.locator('canvas').boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(200); continue;
      }
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

  /**
   * Real-mouse side of the abduction driver. The pilot runs every frame inside the page
   * (installDriver) and says where to hold the pointer; this keeps the real mouse button down and
   * moves it there. Call step() while the scene is 'abduct', reset() when it changes.
   */
  function abductDriver() {
    const ANCHOR = [270, 520];
    let fx = ANCHOR[0], fy = ANCHOR[1];
    let down = false;
    const moveTo = async (lx, ly) => { const [px, py] = map(lx, ly); await page.mouse.move(px, py); };
    const waitForPointer = async (down) => {
      await page.waitForFunction((expected) => window.__nightShift.pointer.down === expected, down);
    };
    const press = async () => {
      await moveTo(fx, fy);
      await page.mouse.down();
      down = true;
      await waitForPointer(true);
    };
    const release = async () => {
      await page.mouse.up();
      down = false;
      await waitForPointer(false);
    };
    return {
      async reset() {
        if (down) await release();
        await page.evaluate(() => { if (window.__e2eDrv) window.__e2eDrv.on = false; });
        fx = ANCHOR[0]; fy = ANCHOR[1];
      },
      async step(drv) {
        if (!drv) { await installDriver(); return; }
        if (!down) {
          await waitForPointer(false);
          // The scene manager swallows presses until the transition into the room ends (and the
          // first frame of a new scene can be long while it builds its view), so wait it out.
          await page.waitForFunction(() => !window.__nightShift.transitioning);
          // Press where the pilot wants the pointer, so the grab itself does not yank the body.
          const at = await page.evaluate(() => {
            const d = window.__e2eDrv;
            const f = window.__nightShift.active.debug.autopilotFinger(1 / 60);
            d.fx = f.x; d.fy = f.y; d.on = true;
            return [f.x, f.y];
          });
          fx = at[0]; fy = at[1];
          await press();
          return;
        }
        const tx = Math.min(538, Math.max(2, drv.fx)), ty = Math.min(958, Math.max(2, drv.fy));
        if (Math.abs(tx - fx) < 0.05 && Math.abs(ty - fy) < 0.05) { await sleep(POLL_MS); return; }
        // no pause after a move: input latency here is latency for the pilot's laser timing
        fx = tx; fy = ty;
        await moveTo(fx, fy);
      },
    };
  }

  /** Tutorial abduction: the same in-page autopilot driver as the deep shifts. */
  async function abduct() {
    await waitScene('abduct', 20000);
    await installDriver();
    await sleep(500);
    const drv = abductDriver();
    await drv.reset();
    // Budget in game seconds: swiftshader runs the game well under real time on this box.
    const t0 = Date.now();
    while (Date.now() - t0 < 900000) {
      const info = await page.evaluate(() => {
        const ns = window.__nightShift;
        const a = ns.active;
        const d = window.__e2eDrv;
        return { scene: ns.scene, ready: !!(a && a.debug && typeof a.debug.autopilot === 'function'), elapsed: a && a.debug ? a.debug.elapsed : 0, drv: d ? { fx: d.fx, fy: d.fy } : null };
      });
      if (info.scene !== 'abduct' || info.elapsed > 120) break;
      if (!info.ready) { await sleep(50); continue; }
      await drv.step(info.drv);
    }
    const stuck = await page.evaluate(() => {
      const ns = window.__nightShift;
      const d = ns.active && ns.active.debug;
      if (!d || ns.scene !== 'abduct') return null;
      const pilot = d.pilot || {};
      const route = (d.room && d.room.route) || [];
      const tgt = route[pilot.index];
      return { pilotIndex: pilot.index, of: route.length, target: tgt, beam: [d.body.beamX, d.body.beamY], pointer: [ns.pointer.x, ns.pointer.y, ns.pointer.down], drv: window.__e2eDrv && [window.__e2eDrv.fx, window.__e2eDrv.fy, window.__e2eDrv.on], elapsed: d.elapsed, delivered: d.delivered, failure: d.failure };
    });
    await drv.reset();
    if ((await st()) === 'abduct') throw new Error('abduction did not finish in 120 game s: ' + JSON.stringify(stuck));
  }

  // ------------------------------------------------------------------ deep shifts (L3, L4)
  /** In-page per-frame driver for the abduction autopilot (see the abduct branch of deepShift). */
  async function installDriver(carFirst = false) {
    await page.evaluate((carFirst) => {
      if (window.__e2eDrv) return;
      const drv = (window.__e2eDrv = { fx: 270, fy: 520, on: false, flight: null });
      const tick = () => {
        const ns = window.__nightShift;
        const a = ns && ns.active;
        const p = ns && ns.pointer;
        // flight: ask the autopilot every frame; the bot replays its finger with the real mouse
        if (ns && ns.scene === 'flight' && a && a.debug && typeof a.debug.autopilot === 'function') {
          const timeCar = ns.run?.collectible?.timeCar;
          const it = carFirst && timeCar?.visible ? a.debug.timeCarAutopilot() : a.debug.autopilot();
          drv.flight = { down: it.down, x: it.x, y: it.y };
        } else drv.flight = null;
        if (ns && ns.scene === 'abduct' && a && a.debug && typeof a.debug.autopilot === 'function' && drv.on && p && p.down) {
          // The four-star chase uses the skilled drag pace from the difficulty evaluator.
          if (carFirst) a.debug.pilot.pace = 2.2;
          const f = a.debug.autopilotFinger(1 / 60);
          drv.fx = f.x;
          drv.fy = f.y;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, carFirst);
  }

  async function deepShift({ id, num }, name) {
    const carFirst = id === 'level9' && process.env.CAR_FIRST === '1';
    await openFixture('?unlock=1&flight=' + num);
    await waitScene('flight');
    await installDriver(carFirst);
    const log = [];
    const t0 = Date.now();
    let down = false;
    let lastScene = '';
    let shots = 0;
    let lastWitnesses = 0;
    let lifted = false;
    let caveShot = false;
    let carShot = false;
    let lastCarPhase;
    const renderer = await page.evaluate(() => {
      const gl = document.querySelector('canvas#game')?.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    });
    const abd = abductDriver();
    const up = async () => { if (down) { await page.mouse.up(); down = false; } };
    const moveTo = async (lx, ly) => { const [px, py] = map(lx, ly); await page.mouse.move(px, py); };
    // a whole shift: up to 6 game minutes, which runs slower than real time under the bot
    while (Date.now() - t0 < 1800000) {
      const info = await page.evaluate(() => {
        const ns = window.__nightShift;
        const a = ns.active;
        const run = ns.run;
        const base = { scene: ns.scene, busy: ns.transitioning, clock: run ? run.clockText() : null, elapsed: run ? run.elapsed : null, delivered: run ? run.delivered.slice() : null, spotted: run ? run.spotted : null, failed: run ? run.failedAbductions : null };
        if (run?.level.id === 'level8') {
          base.witnesses = run.specimenCount;
          base.troops = run.troops.map(t => t?.caught.size ?? null);
          base.room = run.current?.roomId;
          base.inCave = ns.scene === 'abduct' && !ns.transitioning && a?.debug?.elapsed > 4;
          base.lifting = ns.scene === 'flight' && a?.state === 'locking' && a.st > 0.22 && !!a.sim.ringRef[a.sim.lockedRing]?.ape;
        }
        if (run?.level.id === 'level9') {
          base.room = run.current?.roomId;
          const car = run.collectible?.timeCar;
          base.carPhase = car?.phase;
          base.carProgress = car?.progress ?? 0;
        }
        if (!a || !a.debug || typeof a.debug.autopilot !== 'function') return base;
        if (ns.scene === 'flight') { const f = window.__e2eDrv && window.__e2eDrv.flight; return { ...base, kind: 'flight', it: f ? { down: f.down, x: f.x, y: f.y } : null, state: a.state }; }
        if (ns.scene === 'abduct') return { ...base, kind: 'abduct', drv: window.__e2eDrv ? { fx: window.__e2eDrv.fx, fy: window.__e2eDrv.fy } : null };
        return base;
      });
      if (info.witnesses > lastWitnesses) {
        lastWitnesses = info.witnesses;
        log.push({ clock: info.clock, witnesses: info.witnesses, troops: info.troops });
      }
      if (info.lifting && !lifted) {
        lifted = true;
        await shot(name + '-beam');
      }
      if (info.inCave && !caveShot) {
        caveShot = true;
        await shot(name + '-cave');
      }
      if (info.carPhase && info.carPhase !== lastCarPhase) {
        log.push({ clock: info.clock, carPhase: info.carPhase, scene: info.scene });
        lastCarPhase = info.carPhase;
      }
      if (!carShot && carFirst && info.carProgress > 0.2) {
        carShot = true;
        await shot(name + '-time-car-lock');
      }
      if (info.room && info.scene !== lastScene) log.push({ room: info.room });
      if (info.scene !== lastScene) {
        log.push({ at: ((Date.now() - t0) / 1000).toFixed(1), scene: info.scene, clock: info.clock, delivered: info.delivered, spotted: info.spotted, failed: info.failed });
        await up();
        await abd.reset();
        if (shots < 24 && (info.scene === 'abduct' || info.scene === 'flight' || info.scene === 'choice')) { await sleep(700); await shot(`${name}-${String(++shots).padStart(2, '0')}-${info.scene}`); }
        lastScene = info.scene;
        continue;
      }
      if (info.scene === 'report') { await sleep(3500); await shot(`${name}-zz-report`); break; }
      if (info.scene === 'choice') { await up(); await moveTo(270, 598); await page.mouse.down(); await sleep(60); await page.mouse.up(); await sleep(600); continue; }
      // presses are swallowed while a transition runs: don't start a gesture until it ends
      if (info.busy && !down) { await sleep(16); continue; }
      if (info.kind === 'flight') {
        if (!info.it) { await installDriver(carFirst); await sleep(30); continue; }
        const it = info.it;
        if (!it.down) { await up(); await sleep(16); continue; }
        await moveTo(Math.max(2, Math.min(538, it.x)), Math.max(84, Math.min(958, it.y)));
        if (!down) { await page.mouse.down(); down = true; }
        await sleep(POLL_MS);
        continue;
      }
      if (info.kind === 'abduct') {
        await abd.step(info.drv);
        continue;
      }
      await up();
      await sleep(100);
    }
    await up();
    await abd.reset();
    const end = await page.evaluate(() => ({ scene: window.__nightShift.scene, level: JSON.parse(JSON.stringify(window.__nightShift.save.levels)) }));
    if (id === 'level8') {
      if (!lifted || !caveShot || end.scene !== 'report' || !end.level.level8.delivered) {
        throw new Error('Time trial did not deliver its witnesses: ' + JSON.stringify({ end, log }));
      }
      await openFixture('');
      const reloaded = await page.evaluate(() => window.__nightShift.save.levels.level8);
      if (JSON.stringify(reloaded) !== JSON.stringify(end.level.level8)) throw new Error('Time-trial save changed on reload');
      log.push({ reloaded });
    }
    if (id === 'level9') {
      const result = end.level.level9;
      if (end.scene !== 'report' || !result.delivered || carFirst && (!carShot || !result.stars.every(Boolean))) {
        throw new Error('Crest Valley did not finish with the requested outcome: ' + JSON.stringify({ result, log }));
      }
      await openFixture('');
      const reloaded = await page.evaluate(() => window.__nightShift.save.levels.level9);
      if (JSON.stringify(reloaded) !== JSON.stringify(result)) throw new Error('Crest Valley save changed on reload');
      log.push({ reloaded });
    }
    return { wallSec: ((Date.now() - t0) / 1000).toFixed(1), renderer, end, log };
  }

  const ONLY = process.env.ONLY || '';
  await openFixture('?reset=1');
  await sleep(350);
  await shot('00-boot');
  const results = {};
  if (ONLY === 'probe') {
    // one tutorial abduction on its own: ROOM=farm_window|farm_chimney|laundry_skylight|laundry_loading
    await openFixture('?unlock=1&room=' + encodeURIComponent(process.env.ROOM || 'farm_chimney'));
    try { await abduct(); results.probe = await st(); } catch (e) { results.probe = 'abduct error ' + e.message; }
    console.log(JSON.stringify({ results, errors }, null, 1));
    await browser.close();
    return;
  }
  const deepOrders = await page.evaluate(() => window.__nightShift.workOrders.filter(order => order.kind === 'deep'));
  const runName = id => id.replace(/^level(\d+)$/, 'L$1');
  if (ONLY === 'deep' || deepOrders.some(order => runName(order.id) === ONLY)) {
    for (const order of deepOrders) {
      const name = runName(order.id);
      if (ONLY === 'deep' || ONLY === name) results[name] = await deepShift(order, name);
    }
    console.log(JSON.stringify({ results, errors }, null, 1));
    await browser.close();
    return;
  }
  const ONLY_RUNS = process.env.RUNS ? process.env.RUNS.split(',') : null;
  const runs = [
    { level: 1, ring: 1, via: [{ x: 150, y: 1500 }, { x: 150, y: 450 }], name: 'L1-chimney' },
    { level: 1, ring: 0, via: [{ x: 150, y: 1400 }, { x: 150, y: 590 }], name: 'L1-window' },
    { level: 2, ring: 0, via: [{ x: 540, y: 1400 }, { x: 540, y: 700 }], name: 'L2-skylight' },
    { level: 2, ring: 1, via: [{ x: 540, y: 1500 }, { x: 540, y: 700 }, { x: 640, y: 330 }], name: 'L2-loading' },
  ];
  for (const r of runs) {
    if (ONLY_RUNS && !ONLY_RUNS.includes(r.name)) continue;
    await openFixture('?unlock=1');
    await fly(r.level, r.ring, r.via);
    await shot(`${r.name}-a-flight-end`);
    try { await abduct(); } catch (e) { results[r.name] = 'abduct error ' + e.message; console.error('RESULT', r.name, results[r.name]); await shot(`${r.name}-err`); continue; }
    await sleep(6000);
    await shot(`${r.name}-b-report`);
    results[r.name] = { scene: await st(), save: await page.evaluate(() => JSON.parse(JSON.stringify(window.__nightShift.save))) };
    console.error('RESULT', r.name, results[r.name].scene);
  }
  if (ONLY !== 'tutorial') {
    for (const order of deepOrders) {
      const name = runName(order.id);
      results[name] = await deepShift(order, name);
      console.error('RESULT', name, results[name].end.scene, results[name].wallSec);
    }
  }
  console.log(JSON.stringify({ results, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
