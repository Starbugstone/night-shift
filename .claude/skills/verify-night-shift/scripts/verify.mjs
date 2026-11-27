#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const [portArg, runId, target, option] = process.argv.slice(2);
const port = Number(portArg);
const fromOrders = option === '--from-orders';
if (!Number.isInteger(port) || port < 1024 || port > 65535 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(runId ?? '') || !target ||
    (option !== undefined && !fromOrders)) {
  console.error('Usage: verify.mjs PORT RUN_ID doctor|ROOM_ID|./journey.mjs [--from-orders]');
  process.exit(2);
}
process.chdir(root);
const evidenceRoot = resolve('review/night-shift-verify');
const evidence = resolve(evidenceRoot, runId);
await mkdir(evidenceRoot, { recursive: true });
await mkdir(evidence);
const runtime = await mkdtemp(resolve(evidenceRoot, '.runtime-'));
process.env.TMPDIR = runtime;

let server;
let browser;
let interrupted;
const errors = [];
const trace = [];
const provenance = {
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  checkout: root,
  port,
  target,
  fromOrders,
  viewport: { width: 375, height: 690 },
  // DPR 1 by default: at 2, software GL stalls on every pointer move on this host. DSF=2 for crisp captures.
  deviceScaleFactor: Number(process.env.DSF || 1),
  // DRAW=1 renders every stepped frame; by default only evidence frames are drawn (capture redraws).
  drawEveryFrame: process.env.DRAW === '1',
  // A cold dev server compiles every module on the first load: give it time on a busy host.
  loadSeconds: Number(process.env.LOAD_SECONDS || 90),
  framesPerSecond: 60,
};
const base = 'http://127.0.0.1:' + port;
const wait = (ms) => new Promise((done) => setTimeout(done, ms));
// Read the live key from the game so this runner cannot fall behind a save migration again.
const saveSource = await readFile(resolve('src/levels/save.ts'), 'utf8');
const saveKey = saveSource.match(/export const SAVE_KEY = '([^']+)'/)?.[1];
assert(saveKey, 'SAVE_KEY not found in src/levels/save.ts');
provenance.saveKey = saveKey;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    interrupted = signal;
    void browser?.close().catch(() => {});
  });
}

function virtualClock() {
  let now = 0;
  let nextId = 0;
  let callbacks = new Map();
  performance.now = () => now;
  window.requestAnimationFrame = (callback) => {
    callbacks.set(++nextId, callback);
    return nextId;
  };
  window.cancelAnimationFrame = (id) => callbacks.delete(id);
  window.__verifyStep = (frames) => {
    for (let frame = 0; frame < frames; frame++) {
      now += 1000 / 60;
      const pending = callbacks;
      callbacks = new Map();
      for (const callback of pending.values()) callback(now);
    }
    return now;
  };
}

function controls(page) {
  let now = 0;
  let priorPages = 0;
  let cursor;
  let x, y;
  const observe = (read) => page.evaluate(read);
  const record = (action, values = {}) => trace.push({ ms: Math.round(priorPages + now), action, ...values });
  const step = async (frames = 1) => {
    now = await page.evaluate((count) => window.__verifyStep(count), frames);
  };
  const scene = () => observe(() => window.__nightShift?.scene);
  const stored = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  const save = () => observe(() => window.__nightShift.save);
  const capture = async (name) => {
    assert.match(name, /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
    // the game canvas is WebGL and may not have drawn since the last step (drawing is off between
    // evidence frames): redraw, then read it in the same task
    const data = await observe(() => { window.__nightShift.redraw(); return window.__nightShift.capture(); });
    assert.match(data, /^data:image\/png;base64,/);
    await writeFile(resolve(evidence, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    record('capture', { name, scene: await scene() });
  };
  const expectScene = async (expected, settleFrames = 30) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await scene() === expected) {
        // a transition swallows taps until it ends, and entering a scene can hold the cover closed
        // while its view uploads to the GPU, so wait for the transition itself, then settle
        for (let n = 0; n < 240 && await observe(() => window.__nightShift.transitioning); n++) await step(1);
        await step(settleFrames);
        assert.equal(await scene(), expected);
        return;
      }
      await step(4);
    }
    assert.equal(await scene(), expected);
  };
  const open = async (path = '/', expected = 'title') => {
    assert.equal(new URL(path, base).origin, base, 'Use the verification origin');
    record('open', { path, expected });
    priorPages += now;
    now = 0;
    const response = await page.goto(new URL(path, base).href, { timeout: provenance.loadSeconds * 1000 });
    assert.equal(response?.status(), 200, 'Vite response');
    const canvas = page.locator('#game');
    await canvas.waitFor();
    const box = await canvas.boundingBox();
    const scale = Math.min(box.width / 540, box.height / 960);
    cursor = {
      scale,
      x: box.x + (box.width - 540 * scale) / 2,
      y: box.y + (box.height - 960 * scale) / 2,
    };
    const deadline = Date.now() + provenance.loadSeconds * 1000;
    while (Date.now() < deadline) {
      await step(4);
      const actual = await scene();
      if (actual && actual !== 'loading') {
        if (!provenance.drawEveryFrame) await observe(() => { window.__nightShift.drawing = false; });
        // wait out the transition (and any cover hold while the new view uploads), then settle
        for (let n = 0; n < 240 && await observe(() => window.__nightShift.transitioning); n++) await step(1);
        await step(30);
        record('opened', { path, scene: await scene() });
        if (await scene() !== expected) await capture('unexpected-entry');
        assert.equal(await scene(), expected, path + ' entry');
        return;
      }
      await wait(30);
    }
    throw new Error('Game did not finish loading at ' + path + '. Scene: ' + await scene());
  };
  const move = async (lx, ly, frames = 1) => {
    await page.mouse.move(cursor.x + lx * cursor.scale, cursor.y + ly * cursor.scale);
    x = lx;
    y = ly;
    record('pointermove', { x, y });
    if (frames) await step(frames);
  };
  const down = async (lx, ly) => {
    await move(lx, ly, 0);
    await page.mouse.down();
    record('pointerdown', { x, y });
    await step();
  };
  const up = async () => {
    await page.mouse.up();
    record('pointerup', { x, y });
    await step();
  };
  const tap = async (lx, ly) => {
    await down(lx, ly);
    await up();
  };
  const drag = async (x1, y1, x2, y2, frames = 24) => {
    await down(x1, y1);
    for (let i = 1; i <= frames; i++) {
      await move(x1 + (x2 - x1) * i / frames, y1 + (y2 - y1) * i / frames);
    }
    await up();
  };
  /**
   * Navigate inside the loaded page (`__nightShift.goto(scene, arg)`), e.g. goto('flight', 12) or
   * goto('abduct', 'nora_kitchen'). Under load a second page.goto can time out; this cannot.
   */
  const goto = async (name, arg, expected = name) => {
    record('goto', { scene: name, arg });
    await page.evaluate(([n, a]) => window.__nightShift.goto(n, a), [name, arg]);
    await expectScene(expected);
  };
  return { page, observe, record, step, scene, stored, save, capture, expectScene, open, goto, move, down, up, tap, drag };
}

// World-space tutorial approaches, shared with scripts/e2e-playthrough.cjs, with input on the virtual clock.
const approaches = Object.fromEntries(createRequire(import.meta.url)('../../../../scripts/tutorial-approaches.cjs')
  .map(({ room, ring, via }) => [room, { ring, via: via.map(({ x, y }) => [x, y]) }]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

async function flyRing(game, roomId) {
  const { ring, via } = approaches[roomId];
  await game.expectScene('flight', 40);
  await game.capture(roomId + '-flight-start');
  const end = await game.page.evaluate((index) => {
    const { x, y } = window.__nightShift.active.ringPts[index];
    return [x, y];
  }, ring);
  const waypoints = [...via, end];
  let index = 0;
  let held = false;
  let captured = false;
  for (let command = 0; command < 1800; command++) {
    const flight = await game.observe(() => {
      const { scene, active } = window.__nightShift;
      if (scene !== 'flight') return null;
      const { x, y, vx, vy } = active.saucer;
      return { x, y, vx, vy, camX: active.camX, camY: active.camY, state: active.state };
    });
    if (!flight) break;
    if (flight.state !== 'fly') {
      if (held) await game.up();
      held = false;
      if (flight.state === 'spotted') index = 0;
      if (flight.state === 'locking' && !captured) {
        await game.capture(roomId + '-flight-lock');
        captured = true;
      }
      await game.step(4);
      continue;
    }
    const [wx, wy] = waypoints[index];
    const dx = wx - flight.x;
    const dy = wy - flight.y;
    const distance = Math.hypot(dx, dy);
    const last = index === waypoints.length - 1;
    if (!last && distance < 50) {
      index++;
      continue;
    }
    if (last && distance < 22) {
      if (held) await game.up();
      held = false;
      await game.step(4);
      continue;
    }
    const lead = last ? Math.min(170, distance * 0.9) : 170;
    const brake = last ? 0.35 : 0.1;
    const x = clamp(flight.x - flight.camX + dx / distance * lead - flight.vx * brake, 5, 535);
    const y = clamp(flight.y - flight.camY + dy / distance * lead - flight.vy * brake, 130, 950);
    if (held) await game.move(x, y, 4);
    else {
      await game.down(x, y);
      await game.step(3);
      held = true;
    }
  }
  if (held) await game.up();
  await game.expectScene('abduct');
  assert(captured, 'The requested ring should lock on before abduction');
}

async function pilotRoom(game, roomId, { keepReport = false } = {}) {
  const before = await game.save();
  const initial = await game.page.evaluate(async (id) => {
    const { ROOMS } = await import('/src/abduct/rooms/index.ts');
    const sim = window.__nightShift.active?.debug;
    return { matches: Boolean(sim && sim.room === ROOMS[id]), deep: Boolean(sim?.interior),
      backdrop: sim?.room.backdrop, rules: sim?.rules, beam: [sim?.body.beamX, sim?.body.beamY],
      camera: sim?.camera };
  }, roomId);
  assert(initial.matches, 'Active room must be ' + roomId);
  game.record('room-start', { roomId, ...initial });
  await game.capture(roomId + '-room-start');
  // The beam heads for a held pointer: press where the pilot wants it and keep the button down.
  const first = await game.observe(() => window.__nightShift.active.debug.autopilotFinger(3 / 60));
  let result;
  let captured = false;
  await game.down(first.x, first.y);
  for (let command = 0; command < 2400; command++) {
    const status = await game.observe(() => {
      const sim = window.__nightShift.active.debug;
      return { result: sim.result(), beam: [sim.body.beamX, sim.body.beamY], camera: sim.camera };
    });
    result = status.result;
    if (result.delivered || result.failReason || result.timeSec >= 100) break;
    const distance = Math.hypot(status.beam[0] - initial.beam[0], status.beam[1] - initial.beam[1]);
    if (!captured && distance >= 70) {
      game.record('room-mid-drag', status);
      await game.capture(roomId + '-room-mid-drag');
      captured = true;
    }
    const finger = await game.observe(() => window.__nightShift.active.debug.autopilotFinger(3 / 60));
    await game.move(Math.min(538, Math.max(2, finger.x)), Math.min(958, Math.max(2, finger.y)), 3);
  }
  await game.up();
  game.record('room-end', { result });
  await game.capture(roomId + '-room-end');
  if (result?.delivered || result?.failReason) {
    await game.expectScene('report', 210);
    await game.capture(roomId + '-report');
    const stored = await game.stored();
    assert.deepEqual(stored, await game.save(), 'Report write to localStorage');
    assert.equal(stored.reports, before.reports + 1, 'Exactly one report filed');
    game.record('report-saved', { stored });
    if (!keepReport) {
      await game.open();
      const reloaded = await game.save();
      assert.deepEqual(reloaded, stored, 'Same-context reload restores saved progress');
      game.record('report-reloaded', { reloaded });
      await game.tap(270, 686);
      await game.expectScene('workorders');
      await game.capture(roomId + '-reloaded-orders');
    }
  }
  assert.equal(result?.delivered, true, JSON.stringify(result));
  assert.equal(result?.woke, false, JSON.stringify(result));
  assert(captured, 'Capture the beam moving during the drag');
}

try {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  server = await createServer({
    root,
    cacheDir: resolve(runtime, 'vite'),
    server: { host: '127.0.0.1', port, strictPort: true, watch: null },
  });
  await server.listen();
  assert.deepEqual(server.httpServer.address(), { address: '127.0.0.1', family: 'IPv4', port });
  if (interrupted) throw new Error('Interrupted by ' + interrupted);
  // The game renders with WebGL (Pixi). Software GL is the default (it works anywhere, and the
  // virtual clock makes the run deterministic); GPUARGS switches to a real GPU.
  browser = await chromium.launch({
    args: (process.env.GPUARGS || '--use-angle=swiftshader --enable-unsafe-swiftshader').split(' ').filter(Boolean),
    handleSIGINT: false,
    handleSIGTERM: false,
  });
  if (interrupted) throw new Error('Interrupted by ' + interrupted);
  provenance.chromium = browser.version();
  const context = await browser.newContext({ viewport: provenance.viewport, deviceScaleFactor: provenance.deviceScaleFactor });
  await context.addInitScript(virtualClock);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  const game = {
    ...controls(page),
    evidence,
    flyRing: (id) => flyRing(game, id),
    pilotRoom: (id, options) => pilotRoom(game, id, options),
  };
  await game.open();
  assert.match(await page.title(), /Night Shift/);
  assert.equal(await game.stored(), null, 'Doctor requires a fresh browser context');
  assert.deepEqual(errors, [], 'Doctor browser errors');
  console.log('Doctor passed:', base, provenance.revision.slice(0, 8), 'title ready, empty', saveKey);

  if (target.endsWith('.mjs')) {
    const { default: journey } = await import(pathToFileURL(resolve(target)));
    await journey(game);
  } else if (target !== 'doctor') {
    if (fromOrders) {
      assert(Object.hasOwn(approaches, target), 'This build has four tutorial flight entries');
      // A fresh save has only Farmer Doyle open; Larry needs Doyle delivered first (use a journey).
      assert(target.startsWith('farm_'), '--from-orders starts from an empty save, where only Farmer Doyle is open');
      await game.tap(270, 686);
      await game.expectScene('workorders');
      await game.tap(270, 364);
      await game.expectScene('memo');
      await game.tap(270, 894);
      await game.flyRing(target);
    } else {
      await game.open('/?room=' + encodeURIComponent(target), 'abduct');
    }
    await game.pilotRoom(target);
  }

  assert.deepEqual(errors, [], 'Browser errors');
  if (interrupted) throw new Error('Interrupted by ' + interrupted);
  recordOutcome('passed');
} catch (error) {
  recordOutcome('failed', String(error));
  console.error(error);
  process.exitCode = interrupted === 'SIGINT' ? 130 : interrupted === 'SIGTERM' ? 143 : 1;
} finally {
  const cleanup = await Promise.allSettled([browser?.close(), server?.close()]);
  try {
    await rm(runtime, { recursive: true });
    cleanup.forEach((result) => {
      if (result.status === 'rejected') {
        console.error(result.reason);
        process.exitCode = 1;
      }
    });
  } finally {
    await writeFile(resolve(evidence, 'trace.json'), JSON.stringify({ provenance, errors, cleanup, trace }, null, 2) + '\n');
    console.log('Evidence:', evidence);
  }
}

function recordOutcome(status, error) {
  trace.push({ action: 'outcome', status, error });
}
