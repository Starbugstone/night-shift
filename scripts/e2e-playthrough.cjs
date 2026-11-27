// End-to-end bot: plays all four tutorial routes (L1 window/chimney, L2 skylight/loading door), then
// every deep shift in the Work Orders (Birch Lane, L3…L12), all through real pointer input.
// Every abduction (tutorial and deep) is driven by the scene's own per-frame autopilot through
// `debug.autopilotFinger()`: the screen point to hold the mouse button at (the beam heads for it), at a drag
// pace no slower than the game's SLOWEST_HONEST_PACE (read from `__nightShift.honestPace`).
// The mouse stays down for the whole room.
// Deep flights use the flight `debug.autopilot()` (an absolute finger position, logical px);
// tutorial flights steer through fixed waypoints. A SPOTTED card is closed with a real tap.
// Every shift the run plays must end on a report with a fresh successful delivery (one more report
// and attempt, the level delivered, the run 'done' rather than out of time) that survives a reload;
// a full run must play every registered order. Any failure, page error or console error exits 1.
// Run it against a preview build, not the dev server (HMR reloads kill long runs):
//   npm run build -- --mode e2e --outDir review/e2e-build
//   npm run preview -- --outDir review/e2e-build --port <free port> --strictPort
//   source ~/.local/share/claude-media-tools/env.sh
//   BASE=http://localhost:<port>/ node scripts/e2e-playthrough.cjs   (add GPUARGS=... for the real GPU, below)
// Env: ONLY=tutorial|deep|<order> to run a subset, where <order> is a level id or its short name,
// comma-separated (ONLY=birch_bakery,L10,L11). RUNS=L1-window,... picks tutorial routes (with ONLY=tutorial or
// no ONLY); an unknown name or a selection that plays nothing exits 1. ONLY=probe
// with ROOM= plays one room. PLAYWRIGHT_PATH or PLAYWRIGHT_MODULE finds playwright.
// PICKUP=1 takes the town pickup first where the run has a pickup driver (Birch Lane, L9 time car,
// L11 tripod leg) and then requires all four stars. CAR_FIRST=1 (L9) and BIRCH_PICKUP=1 (Birch Lane)
// are the older per-level switches for the same thing. The Birch pickup endpoint is read from the
// live map (`run.collectible.position`), so a moved pickup cannot strand the bot.
// LOAD_SECONDS (default 120) bounds each page load on a busy host.
// FORCE_SPOT=1 raises one sighting early in each deep flight, to prove the SPOTTED tap path.
// DRAW=1 keeps the game drawing every frame. By default rendering is off between evidence frames
// (each capture redraws first), which keeps software GL in real time on a busy host.
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
    const data = await page.evaluate(() => { window.__nightShift.redraw(); return window.__nightShift.capture(); });
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

  // A busy host can take well over Playwright's 30 s default to load and decode the build.
  const LOAD_MS = Number(process.env.LOAD_SECONDS || 120) * 1000;
  async function openFixture(query) {
    await page.goto(BASE + query, { timeout: LOAD_MS });
    try {
      await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene !== 'loading', undefined, { timeout: LOAD_MS });
    } catch (error) {
      throw new Error('Game fixtures did not become ready. Serve a build made with --mode e2e.', { cause: error });
    }
    // rendering off between evidence frames: shot() redraws the frame it captures
    if (process.env.DRAW !== '1') await page.evaluate(() => { window.__nightShift.drawing = false; });
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

  // ------------------------------------------------------------------ deep shifts
  /**
   * In-page per-frame driver: asks the flight autopilot (or a pickup pilot) for its finger every
   * frame, and the room autopilot for its finger while the mouse is down in a room.
   * `pickup` is 'birch' (via points, then the live pickup position), 'time_car', 'tripod' or null.
   */
  async function installDriver(pickup = null) {
    const pace = await page.evaluate(() => window.__nightShift.honestPace);
    if (typeof pace !== 'number' || !(pace >= 1)) throw new Error(`the build exposes no honest drag pace (__nightShift.honestPace = ${pace})`);
    await page.evaluate(({ pickup }) => {
      if (window.__e2eDrv) return;
      const drv = (window.__e2eDrv = { fx: 270, fy: 520, on: false, flight: null, pickup });
      let via = 0;
      // Corridors from tests/difficulty/birch.ts (PIE_APPROACH, GNOME_APPROACH) without their end:
      // the last point is always where the pickup is on the active map.
      const BIRCH_VIA = {
        cherry_pie: [{ x: 140, y: 1250 }, { x: 140, y: 560 }],
        garden_gnome: [{ x: 1620, y: 1520 }, { x: 1620, y: 560 }, { x: 1275, y: 560 }],
      };
      let route = null;
      const birchRoute = ns => {
        const c = ns.run.collectible;
        const viaPts = BIRCH_VIA[c.def.id];
        if (!viaPts) throw new Error('no Birch pickup corridor for ' + c.def.id);
        const at = c.position;
        return [...viaPts, { x: at.x, y: at.y }];
      };
      const detour = sim => {
        const { saucer: s, camX, camY } = sim;
        if (via < route.length - 1 && Math.hypot(s.x - route[via].x, s.y - route[via].y) < 46) via++;
        const { x, y } = route[via];
        const dx = x - s.x, dy = y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        const hover = via === route.length - 1;
        const lead = hover ? Math.min(190, d * 1.4) : 186;
        const damp = hover && d < 130 ? 0.35 : 0.1;
        return { down: !hover || d > 14 || Math.hypot(s.vx, s.vy) > 65,
          x: s.x - camX + dx / d * lead - s.vx * damp, y: s.y - camY + dy / d * lead - s.vy * damp };
      };
      const tick = () => {
        const ns = window.__nightShift;
        const a = ns && ns.active;
        const p = ns && ns.pointer;
        // flight: ask the autopilot every frame; the bot replays its finger with the real mouse
        if (ns && ns.scene === 'flight' && a && a.debug && typeof a.debug.autopilot === 'function') {
          const c = ns.run?.collectible;
          let it;
          if (pickup === 'time_car' && c?.timeCar?.visible) it = a.debug.timeCarAutopilot();
          else if (pickup === 'tripod' && c && !c.collected) it = a.debug.tripodLegAutopilot();
          else if (pickup === 'birch' && c && !c.collected) { route ??= birchRoute(ns); it = detour(a.debug.sim); }
          else it = a.debug.autopilot();
          drv.flight = { down: it.down, x: it.x, y: it.y };
        } else drv.flight = null;
        if (ns && ns.scene === 'abduct' && a && a.debug && typeof a.debug.autopilot === 'function' && drv.on && p && p.down) {
          // Every room at an honest pace: never slower than the game's SLOWEST_HONEST_PACE (the pace every deep
          // shift's clock is proved against, tests/difficulty/honest-pace.ts), the practiced 2.2 on the timed
          // crossings. Artie's blade needs a steady lift.
          const dispatchCrossing = ns.run?.level.id === 'level12' && a.debug.room.human !== 'artie';
          a.debug.pilot.pace = Math.max(ns.honestPace, pickup === 'time_car' || dispatchCrossing ? 2.2 : 0);
          const f = a.debug.autopilotFinger(1 / 60);
          drv.fx = f.x;
          drv.fy = f.y;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { pickup });
  }

  /** Which pickup driver a shift uses when PICKUP (or the older per-level switches) asks for one. */
  const pickupDriver = (id) => {
    const all = process.env.PICKUP === '1';
    if (id.startsWith('birch_')) return all || process.env.BIRCH_PICKUP === '1' ? 'birch' : null;
    if (id === 'level9') return all || process.env.CAR_FIRST === '1' ? 'time_car' : null;
    if (id === 'level11') return all ? 'tripod' : null;
    return null;
  };

  /** What the report on screen says about this attempt (the run itself is gone by then). */
  const reportOf = () => page.evaluate(() => {
    const a = window.__nightShift.active;
    if (window.__nightShift.scene !== 'report' || !a?.model) return null;
    return { stamp: a.model.stamp, delivered: a.model.delivered, stars: a.outcome.stars.slice() };
  });

  /** Save numbers a fresh delivery must move: total reports and this level's attempts. */
  const progressOf = (id) => page.evaluate((id) => {
    const save = window.__nightShift.save;
    return { reports: save.reports, level: JSON.parse(JSON.stringify(save.levels[id])) };
  }, id);

  /**
   * A shift passes only on a fresh, successful, persisted delivery: a report stamped 'delivered'
   * whose own stars include Delivered (not sunrise, storm, demolition or failed), one more report
   * and attempt than before, the level delivered with a best time, and the same level record
   * after a reload.
   */
  async function expectDelivered(id, before, end, extra = []) {
    const after = end.progress;
    const problems = [...extra];
    if (end.scene !== 'report') problems.push(`ended on ${end.scene}, not report`);
    if (!end.report) problems.push('no report model');
    else if (end.report.stamp !== 'delivered' || !end.report.delivered || !end.report.stars[0]) problems.push(`report ${JSON.stringify(end.report)}`);
    if (after.reports !== before.reports + 1) problems.push(`reports ${before.reports} -> ${after.reports}`);
    if (after.level.attempts !== before.level.attempts + 1) problems.push(`attempts ${before.level.attempts} -> ${after.level.attempts}`);
    if (!after.level.delivered || after.level.bestTimeSec === null) problems.push('level not delivered');
    if (!problems.length) {
      await openFixture('');
      const reloaded = await progressOf(id);
      if (JSON.stringify(reloaded) !== JSON.stringify(after)) problems.push('save changed on reload: ' + JSON.stringify({ after, reloaded }));
    }
    if (problems.length) throw new Error(`${id}: ${problems.join('; ')}`);
    return after;
  }

  async function deepShift({ id, num }, name) {
    const pickup = pickupDriver(id);
    await openFixture('?unlock=1&flight=' + num);
    await waitScene('flight');
    await installDriver(pickup);
    const before = await progressOf(id);
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
    let spottedTaps = 0;
    let atReport = null;
    let forcedSpot = process.env.FORCE_SPOT !== '1';
    // the shift clock as the run last read it, and its deadline (null: a stopwatch shift)
    let gameSec = null;
    let budgetSec = null;
    const renderer = await page.evaluate(() => {
      const gl = document.querySelector('canvas#game')?.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return gl && ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    });
    const abd = abductDriver();
    const up = async () => { if (down) { await page.mouse.up(); down = false; } };
    const moveTo = async (lx, ly) => { const [px, py] = map(lx, ly); await page.mouse.move(px, py); };
    /** A real tap: press, wait until the game saw it, release, wait until it saw that too. */
    const tap = async (lx, ly) => {
      await up();
      await moveTo(lx, ly);
      await page.mouse.down();
      await page.waitForFunction(() => window.__nightShift.pointer.down === true);
      await page.mouse.up();
      await page.waitForFunction(() => window.__nightShift.pointer.down === false);
    };
    // a whole shift: up to 6 game minutes, which runs slower than real time under the bot
    while (Date.now() - t0 < 1800000) {
      const info = await page.evaluate(() => {
        const ns = window.__nightShift;
        const a = ns.active;
        const run = ns.run;
        const base = { scene: ns.scene, busy: ns.transitioning, clock: run ? run.clockText() : null, elapsed: run ? run.elapsed : null, budget: run && Number.isFinite(run.level.budgetSec) ? run.level.budgetSec : null, phase: run ? run.phase : null, delivered: run ? run.delivered.slice() : null, spotted: run ? run.spotted : null, failed: run ? run.failedAbductions : null, pickup: run?.collectible ? run.collectible.collected : null };
        base.room = run?.current?.roomId;
        if (run?.level.id === 'level8') {
          base.witnesses = run.specimenCount;
          base.troops = run.troops.map(t => t?.caught.size ?? null);
          base.inCave = ns.scene === 'abduct' && !ns.transitioning && a?.debug?.elapsed > 4;
          base.lifting = ns.scene === 'flight' && a?.state === 'locking' && a.st > 0.22 && !!a.sim.ringRef[a.sim.lockedRing]?.ape;
        }
        if (run?.level.id === 'level9') {
          const car = run.collectible?.timeCar;
          base.carPhase = car?.phase;
          base.carProgress = car?.progress ?? 0;
        }
        if (!a || !a.debug || typeof a.debug.autopilot !== 'function') return base;
        if (ns.scene === 'flight') { const f = window.__e2eDrv && window.__e2eDrv.flight; return { ...base, kind: 'flight', it: f ? { down: f.down, x: f.x, y: f.y } : null, state: a.state, st: a.st }; }
        if (ns.scene === 'abduct') return { ...base, kind: 'abduct', roomElapsed: a.debug.elapsed, checkpoint: a.debug.pilot.index, drv: window.__e2eDrv ? { fx: window.__e2eDrv.fx, fy: window.__e2eDrv.fy } : null };
        return base;
      });
      if (info.elapsed !== null) { gameSec = info.elapsed; budgetSec = info.budget; }
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
      if (!carShot && pickup === 'time_car' && info.carProgress > 0.2) {
        carShot = true;
        await shot(name + '-time-car-lock');
      }
      if (info.scene !== lastScene) {
        console.error(name, info.scene, info.clock, info.room ?? '');
        log.push({ at: ((Date.now() - t0) / 1000).toFixed(1), scene: info.scene, clock: info.clock, room: info.room, delivered: info.delivered, spotted: info.spotted, failed: info.failed });
        await up();
        await abd.reset();
        if (shots < 24 && (info.scene === 'abduct' || info.scene === 'flight' || info.scene === 'choice')) { await sleep(700); await shot(`${name}-${String(++shots).padStart(2, '0')}-${info.scene}`); }
        lastScene = info.scene;
        continue;
      }
      if (info.scene === 'report') {
        // read the report at once: after the first 2199 delivery it moves on to the finale by itself
        atReport = { report: await reportOf(), progress: await progressOf(id) };
        await sleep(3500);
        await shot(`${name}-zz-report`);
        break;
      }
      if (info.scene === 'choice') { await up(); await moveTo(270, 598); await page.mouse.down(); await sleep(60); await page.mouse.up(); await sleep(600); continue; }
      // presses are swallowed while a transition runs: don't start a gesture until it ends
      if (info.busy && !down) { await sleep(16); continue; }
      if (info.kind === 'flight' && info.state === 'spotted') {
        // The SPOTTED card waits for a fresh press after SPOT_SKIP (0.9 s): a held finger never
        // closes it. Release, let the card become skippable, then tap the middle of the screen.
        await up();
        if (info.st < 1.1) { await sleep(30); continue; }
        await shot(`${name}-spotted-${++spottedTaps}`);
        log.push({ clock: info.clock, spottedTap: spottedTaps });
        await tap(270, 520);
        await sleep(100);
        continue;
      }
      if (info.kind === 'flight' && !forcedSpot && info.state === 'fly' && info.elapsed > 3) {
        // FORCE_SPOT=1: one sighting through the flight sim, to prove the SPOTTED tap path
        forcedSpot = true;
        await page.evaluate(() => { window.__nightShift.active.sim.phase = 'spotted'; });
        log.push({ clock: info.clock, forcedSpot: true });
        continue;
      }
      if (info.kind === 'flight') {
        if (pickup && info.pickup === false && info.elapsed > 150) throw new Error(`${name}: the pickup detour did not reach the pickup in 150 game s`);
        if (!info.it) { await installDriver(pickup); await sleep(30); continue; }
        const it = info.it;
        if (!it.down) { await up(); await sleep(16); continue; }
        await moveTo(Math.max(2, Math.min(538, it.x)), Math.max(84, Math.min(958, it.y)));
        if (!down) { await page.mouse.down(); down = true; }
        await sleep(POLL_MS);
        continue;
      }
      if (info.kind === 'abduct') {
        if (info.roomElapsed > 120) throw new Error(`${name}: ${info.room} stalled at checkpoint ${info.checkpoint} after 120 game s`);
        await abd.step(info.drv);
        continue;
      }
      await up();
      await sleep(100);
    }
    await up();
    await abd.reset();
    const end = atReport ? { scene: 'report', ...atReport } : { scene: await st(), progress: await progressOf(id), report: null };
    const extra = [];
    if (process.env.FORCE_SPOT === '1' && spottedTaps < 1) extra.push('FORCE_SPOT: no SPOTTED card was tapped');
    if (id === 'level8' && (!lifted || !caveShot)) extra.push(`time trial evidence missing (beam ${lifted}, cave ${caveShot})`);
    if (pickup) {
      const stars = end.progress.level.stars;
      if (!end.progress.level.mapCollectible || !end.report?.stars[3]) extra.push('pickup not taken on this run');
      if (!stars.every(Boolean)) extra.push(`pickup run needs all four stars, has ${JSON.stringify(stars)}`);
      if (pickup === 'time_car' && !carShot) extra.push('time car lock not captured');
    }
    const result = await expectDelivered(id, before, end, extra);
    return { wallSec: ((Date.now() - t0) / 1000).toFixed(1), gameSec: gameSec === null ? null : Math.round(gameSec * 10) / 10, budgetSec, renderer, pickup, spottedTaps, report: end.report, before, result, log };
  }

  const ONLY = (process.env.ONLY || '').split(',').map(t => t.trim()).filter(Boolean);
  await openFixture('?reset=1');
  await sleep(350);
  await shot('00-boot');
  const results = {};
  const failures = {};
  const finish = async () => {
    if (errors.length) failures.browser = errors.slice();
    console.log(JSON.stringify({ results, failures, errors }, null, 1));
    await browser.close();
    const failed = Object.keys(failures);
    if (failed.length) { console.error('FAILED', failed.join(', ')); process.exit(1); }
    console.error('PASSED', Object.keys(results).join(', '));
  };
  if (ONLY[0] === 'probe') {
    // one tutorial abduction on its own: ROOM=farm_window|farm_chimney|laundry_skylight|laundry_loading
    await openFixture('?unlock=1&room=' + encodeURIComponent(process.env.ROOM || 'farm_chimney'));
    try { await abduct(); results.probe = await st(); } catch (e) { failures.probe = 'abduct error ' + e.message; }
    await finish();
    return;
  }
  const orders = await page.evaluate(() => window.__nightShift.workOrders);
  const deepOrders = orders.filter(order => order.kind === 'deep');
  const tutorialOrders = orders.filter(order => order.kind === 'tutorial');
  const runName = id => id.replace(/^level(\d+)$/, 'L$1');
  const known = new Set(['tutorial', 'deep', ...deepOrders.flatMap(o => [o.id, runName(o.id)])]);
  const unknown = ONLY.filter(t => !known.has(t));
  if (unknown.length) throw new Error(`ONLY names no order: ${unknown.join(', ')}`);
  const allDeep = ONLY.length === 0 || ONLY.includes('deep');
  const playTutorial = ONLY.length === 0 || ONLY.includes('tutorial');
  const deepToPlay = deepOrders.filter(o => allDeep || ONLY.includes(o.id) || ONLY.includes(runName(o.id)));

  const ONLY_RUNS = process.env.RUNS ? process.env.RUNS.split(',').map(t => t.trim()).filter(Boolean) : null;
  const runs = require('./tutorial-approaches.cjs');
  // v0.2 council round 2 (Sol P2): the fixtures must match the registered tutorial orders ring for ring, so a new
  // tutorial ring (or a moved one) fails here instead of being skipped
  const fixtureProblems = [];
  for (const o of tutorialOrders) {
    o.rings.forEach((room, ring) => {
      const f = runs.find(r => r.level === o.num && r.ring === ring);
      if (!f) fixtureProblems.push(`no tutorial approach for order ${o.num} (${o.id}) ring ${ring} (${room})`);
      else if (f.room !== room) fixtureProblems.push(`${f.name} flies to ring ${ring} of order ${o.num}, which is ${room}, not ${f.room}`);
    });
  }
  for (const r of runs) if (!tutorialOrders.some(o => o.num === r.level && o.rings[r.ring] === r.room)) fixtureProblems.push(`${r.name} names no registered tutorial ring`);
  if (fixtureProblems.length) throw new Error(`tutorial approaches out of date (scripts/tutorial-approaches.cjs): ${fixtureProblems.join('; ')}`);
  if (ONLY_RUNS) {
    if (!playTutorial) throw new Error(`RUNS=${process.env.RUNS} picks tutorial routes, but ONLY=${process.env.ONLY} plays no tutorial`);
    const typos = ONLY_RUNS.filter(n => !runs.some(r => r.name === n));
    if (typos.length || !ONLY_RUNS.length) throw new Error(`RUNS names no tutorial route: ${typos.join(', ') || '(empty)'}; routes are ${runs.map(r => r.name).join(', ')}`);
  }
  const tutorialToPlay = playTutorial ? runs.filter(r => !ONLY_RUNS || ONLY_RUNS.includes(r.name)) : [];
  if (!tutorialToPlay.length && !deepToPlay.length) throw new Error(`the selection plays nothing (ONLY=${process.env.ONLY || ''} RUNS=${process.env.RUNS || ''})`);
  for (const r of tutorialToPlay) {
    const id = `level${r.level}`;
    try {
      await openFixture('?unlock=1');
      const before = await progressOf(id);
      await fly(r.level, r.ring, r.via);
      await shot(`${r.name}-a-flight-end`);
      await abduct();
      await waitScene('report', 30000);
      const end = { scene: 'report', report: await reportOf(), progress: await progressOf(id) };
      await sleep(3000);
      await shot(`${r.name}-b-report`);
      results[r.name] = { before, report: end.report, result: await expectDelivered(id, before, end) };
      console.error('RESULT', r.name, 'delivered');
    } catch (e) {
      failures[r.name] = String(e.message || e);
      console.error('RESULT', r.name, failures[r.name]);
      await shot(`${r.name}-err`).catch(() => {});
    }
  }
  for (const order of deepToPlay) {
    const name = runName(order.id);
    try {
      results[name] = await deepShift(order, name);
      console.error('RESULT', name, 'delivered', results[name].wallSec + ' s wall,', results[name].gameSec + ' game s of', results[name].budgetSec ?? 'no clock');
    } catch (e) {
      failures[name] = String(e.message || e);
      console.error('RESULT', name, failures[name]);
      await shot(`${name}-err`).catch(() => {});
    }
  }
  // a full run proves every registered order, not just the ones that happened to finish
  if (allDeep) for (const o of deepOrders) if (!results[runName(o.id)] && !failures[runName(o.id)]) failures[runName(o.id)] = 'not played';
  // ...and every registered tutorial ring (the approaches match them, checked above)
  if (playTutorial && !ONLY_RUNS) for (const r of runs) if (!results[r.name] && !failures[r.name]) failures[r.name] = 'not played';
  await finish();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
