// Route pills checked on the real flight view (v0.2 council round 3, Opus O2): tests/flight-pill-lines.test.ts and
// tests/flight-pill-reach.test.ts place a copy of the pills, so switching off the cable check in
// src/flight/views/deep.ts still passed them. This test builds the real deep flight view headless (tests/pixi-headless.ts,
// as tests/flight-pill-edges.test.ts does) for every deep level in LEVELS, in English and French, flies each shift on the
// scene's own autopilot (rooms passed as delivered) and reads every shown pill from the ROUTE_PILLS layer:
// - no shown pill covers a solid line as drawn (docs/REGRESSIONS.md F12, round 2 Opus F2);
// - no shown pill sits more than PILL_FAR gaps from its ring, or across a solid line from it (round 3 Fable F2).
// - every ring the autopilot locks showed its pill for at least readSeconds(pill text) before the lock (round 4,
//   Fable F2: the far-pill rule hid pills a lot, L12's "Bathroom hatch" was never labelled at launch or on approach).
// - round 5 (Fable): the same floor with the autopilot steered to every entry ring (a player may pick any), and no pill
//   that flashes for less than PILL_HOLD_FRAMES (checked every rendered frame) unless its ring leaves or locks.
// - round 6 (Fable P3, items 5 and 6): every rendered frame, no two shown pills overlap and none sits off screen, under
//   the top bar or under Zib's bubble (checkPillBoxes); each pill shows at the launch in every language about as long
//   as in English.
// The mutation checks switch each rule off in the live view and want the check to fail.
import './pixi-headless';
import { Container, Point, type ContainerChild } from 'pixi.js';
import { afterAll, describe, expect, it } from 'vitest';
import type { GameContext, PointerState } from '../src/contracts';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { RING_R } from '../src/flight/sim';
import { FlightAutopilot } from '../src/flight/autopilot';
import { LINE_DRAWN, PILL_FAR, PILL_HOLD_FRAMES, placePills, segmentHitsBox } from '../src/flight/views/clear-of';
import { EntryLabels, ROUTE_PILLS, routePillText } from '../src/flight/views/craft';
import { ZIB_BUBBLE } from '../src/flight/views/overlays';
import { DeepFlightHud } from '../src/flight/views/deep-hud';
import { EntryRingView } from '../src/flight/views/craft';
import { readSeconds } from '../src/core/read-time';
import { HUD_ROW } from '../src/ui/hud';
import { getLang, LANGS, setLang } from '../src/i18n';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef } from '../src/levels/types';

const DT = 1 / 60;
const EVERY = 10;
/** Pill centre to ring centre (craft.ts PILL_GAP). */
const GAP = RING_R + 34;

interface Rect { x: number; y: number; w: number; h: number }
interface Check {
  frames: number; pills: number; delivered: number; covers: string[]; far: string[];
  /** Seconds each ring's pill has shown on screen so far this shift, by `lang target:entry`. */
  seen: Map<string, number>;
  /** Seconds each ring has been on screen so far this shift (its pill shown or not). */
  onScreen: Map<string, number>;
  /** Every lock: the ring, how long its pill showed before it, and its read time. */
  locks: { key: string; room: string; shown: number; need: number; on: number }[];
  /** Pills shown for fewer than PILL_HOLD_FRAMES while their ring stayed on screen and unlocked (round 5, Fable). */
  flickers: string[];
  /**
   * Steered launch runs that never locked while the autopilot's own fuse model called the ring a catch (it held).
   * Only named in the failure: no ring is exempt (council round 6, Opus F2; L3's garage door was, until its CCTV moved).
   */
  unreached: Set<string>;
}

function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {}, speak() {}, hush() {} } as never, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0,
  };
}

function press(p: PointerState, down: boolean, x: number, y: number): void {
  p.pressed = down && !p.down;
  p.released = !down && p.down;
  p.down = down;
  p.x = x;
  p.y = y;
}

const shown = (o: ContainerChild): boolean => {
  for (let c: Container | null = o as Container; c; c = c.parent) if (!c.visible || c.alpha <= 0.01 || c.renderable === false) return false;
  return true;
};

function crosses(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (d === 0) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function find(o: Container, label: string): Container | null {
  if (o.label === label) return o;
  for (const c of o.children) {
    const hit = find(c as Container, label);
    if (hit) return hit;
  }
  return null;
}

/** One rendered frame: every shown pill against every solid line on the map, in screen px. */
function checkFrame(scene: DeepFlightScene, at: string, out: Check): void {
  out.frames++;
  const layer = find(scene.view, ROUTE_PILLS);
  if (!layer) throw new Error('no route-pill layer');
  const lines: { a: Point; b: Point; half: number }[] = [];
  const l = { ax: 0, ay: 0, bx: 0, by: 0, half: 0 };
  for (let i = 0; i < scene.sim.field.defs.length; i++) {
    if (scene.sim.field.solidLine(i, l)) lines.push({ a: layer.toGlobal(new Point(l.ax, l.ay)), b: layer.toGlobal(new Point(l.bx, l.by)), half: l.half });
  }
  const entryRings = scene.sim.ringRef.filter(r => !r.ape);
  for (const [k, root] of layer.children.entries()) {
    const ringAt = root.getGlobalPosition();
    // on screen and below the top bar (a ring under the bar has no room for its pill: EntryLabels.request)
    if (shown(root) && ringAt.x > 0 && ringAt.x < 540 && ringAt.y > HUD_ROW.y + HUD_ROW.h + 2 && ringAt.y < 960) {
      const r = entryRings[k]!;
      const key = `${getLang()} ${r.target}:${r.entry}`;
      out.onScreen.set(key, (out.onScreen.get(key) ?? 0) + EVERY * DT);
    }
    const pill = root.children[0];
    if (!pill || !shown(pill)) continue;
    const b = pill.getBounds();
    const box: Rect = { x: b.x, y: b.y, w: b.width, h: b.height };
    if (box.x + box.w < 0 || box.x > 540 || box.y + box.h < 0 || box.y > 960) continue;
    out.pills++;
    const ref = entryRings[k]!;
    const key = `${getLang()} ${ref.target}:${ref.entry}`;
    out.seen.set(key, (out.seen.get(key) ?? 0) + EVERY * DT);
    const ring = root.getGlobalPosition();
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    for (const line of lines) {
      const grow = line.half + LINE_DRAWN;
      if (segmentHitsBox(line.a.x, line.a.y, line.b.x, line.b.y, { x: box.x - grow, y: box.y - grow, w: box.w + grow * 2, h: box.h + grow * 2 }))
        out.covers.push(`${at}: a pill at (${Math.round(box.x)}, ${Math.round(box.y)}) covers the line (${Math.round(line.a.x)}, ${Math.round(line.a.y)})–(${Math.round(line.b.x)}, ${Math.round(line.b.y)})`);
    }
    const px = Math.min(Math.max(ring.x, box.x), box.x + box.w);
    const across = lines.some(line => crosses(ring.x, ring.y, px, cy, line.a.x, line.a.y, line.b.x, line.b.y) || crosses(ring.x, ring.y, cx, cy, line.a.x, line.a.y, line.b.x, line.b.y));
    const reach = Math.abs(cy - ring.y) / GAP;
    if (across || reach > PILL_FAR + 0.02) out.far.push(`${at}: a pill ${across ? 'across a solid line' : `${Math.round(reach * GAP)} px`} from its ring at (${Math.round(ring.x)}, ${Math.round(ring.y)})`);
  }
}

type Tamper = (scene: DeepFlightScene) => () => void;

/**
 * Round 5 (Fable): frames each pill has been shown in a row, by its index in the route-pill layer. A shown run that
 * ends shorter than PILL_HOLD_FRAMES is a flicker, unless its ring left the screen (`EntryLabels.request`), was hidden
 * or is locking. Checked every rendered frame (a 3-frame flash falls between the EVERY-frame samples).
 */
function trackRuns(scene: DeepFlightScene, at: string, runs: number[], out: Check): void {
  const layer = find(scene.view, ROUTE_PILLS)!;
  const top = HUD_ROW.y + HUD_ROW.h + 2;
  let k = -1;
  for (let i = 0; i < scene.sim.ringRef.length; i++) {
    if (scene.sim.ringRef[i]!.ape) continue;
    const root = layer.children[++k]!;
    const pill = root.children[0];
    if (pill && shown(pill)) {
      runs[k] = (runs[k] ?? 0) + 1;
      keepSpot(pill, k);
      continue;
    }
    const len = runs[k] ?? 0;
    runs[k] = 0;
    if (len === 0 || len >= PILL_HOLD_FRAMES) continue;
    const p = root.getGlobalPosition();
    const gone = !shown(root) || p.x < -RING_R || p.x > 540 + RING_R || p.y < top || p.y > 960 + RING_R;
    if (gone || scene.sim.lock.ring === i || scene.sim.lockedRing === i) continue;
    if (heldSpotTaken(scene, root, k)) continue;
    const r = scene.sim.ringRef[i]!;
    out.flickers.push(`${at} ${r.target}:${r.entry}: pill shown ${len} frames (${(len * DT).toFixed(2)} s)`);
  }
}

/** Round 6: the spot each shown pill sat at last frame (local to its world-anchored root) and its drawn width. */
const lastSpots: { x: number; y: number; w: number }[] = [];

function keepSpot(pill: ContainerChild, k: number): void {
  const spot = lastSpots[k] ??= { x: 0, y: 0, w: 0 };
  spot.x = pill.x;
  spot.y = pill.y;
  spot.w = pill.getBounds().width - 2;
}

/**
 * Round 6 (Fable P3): a held pill keeps its spot in world space, and hides at once when the camera carries that spot off
 * screen, under the top bar, or under a HUD box (Zib's bubble, the minimap, the target chips): it may not stay there
 * (checkPillBoxes), and nowhere near its ring is free, so that early end is not a flash.
 */
function heldSpotTaken(scene: DeepFlightScene, root: ContainerChild, k: number): boolean {
  const spot = lastSpots[k];
  if (!spot) return false;
  // the panel, as in checkPillBoxes
  const at = (root as Container).toGlobal(new Point(spot.x, spot.y - 20));
  const box = { x: at.x, y: at.y, w: spot.w, h: 40 };
  const top = HUD_ROW.y + HUD_ROW.h + 2;
  if (box.x < 0.01 || box.x + box.w > 539.99 || box.y < top + 0.01 || box.y + box.h > 959.99) return true;
  const meets = (o: Rect, air: number) => box.x < o.x + o.w + air && o.x - air < box.x + box.w && box.y < o.y + o.h + air && o.y - air < box.y + box.h;
  // from the first frame of a line (the view keeps pills out from then; the bubble fades in over it)
  const bubble = find(scene.view, ZIB_BUBBLE);
  if (bubble?.visible) {
    const b = bubble.getBounds();
    if (meets({ x: b.x, y: b.y, w: b.width, h: b.height }, 4)) return true;
  }
  const hud = (scene as unknown as { look: { peek(): { hud: { avoid: Rect[] } } | undefined } }).look.peek()?.hud.avoid ?? [];
  return hud.some(o => meets(o, 4));
}

/** Where to steer the autopilot: target `target`'s entry `entry`, or (target -1) entry `entry` of every target. */
interface Steer { target: number; entry: number }

/**
 * Round 5 (Fable): the autopilot steered to one entry (the other entries cost it 10^6 px), so every ring a player can
 * pick gets locked, not only the autopilot's cheapest. One target from the launch (`target` first), or every target's
 * entry `entry` over a whole shift (other approaches, and the rings the launch run can't reach).
 */
function steerTo(scene: DeepFlightScene, steer: Steer): void {
  const targets = scene.sim.map.targets;
  const order = steer.target < 0 ? undefined : [steer.target, ...targets.map((_, t) => t).filter(t => t !== steer.target)];
  const ap = new FlightAutopilot(scene.sim, order);
  const avoid = (ap as unknown as { avoid: Float32Array }).avoid;
  for (let i = 0; i < scene.sim.ringRef.length; i++) {
    const r = scene.sim.ringRef[i]!;
    const mine = steer.target < 0 ? targets[r.target]!.entries.length > steer.entry : r.target === steer.target;
    if (!r.ape && mine && r.entry !== steer.entry) avoid[i] = 1e6;
  }
  (scene as unknown as { autopilot: FlightAutopilot | null }).autopilot = ap;
}

/**
 * Round 6 (Fable P3, Neon/parent item 5): every rendered frame, no two shown pills overlap, no shown pill sits off
 * screen or under the top bar, and none sits under Zib's speech bubble (the HUD draws it over the pills). The round 5
 * hold kept a pill's old spot without reserving it, so another pill was placed on it (L10's Black Knight arch over the
 * loft for 13 frames at the lock). Reported in `out.covers`.
 */
function checkPillBoxes(scene: DeepFlightScene, at: string, out: Check): void {
  const layer = find(scene.view, ROUTE_PILLS)!;
  const top = HUD_ROW.y + HUD_ROW.h + 2;
  const bubble = find(scene.view, ZIB_BUBBLE);
  const zib = bubble?.visible ? bubble.getBounds() : null;
  const boxes: { x: number; y: number; w: number; h: number; k: number }[] = [];
  for (const [k, root] of layer.children.entries()) {
    const pill = root.children[0];
    if (!pill || !shown(pill)) continue;
    // the panel: the bounds less the pill's 1 px outline (craft.ts PILL_PANEL), which may hang over the edge
    const b = pill.getBounds();
    const box = { x: b.x + 1, y: b.y + 1, w: b.width - 2, h: b.height - 2, k };
    const name = () => { const r = scene.sim.ringRef.filter(q => !q.ape)[k]!; return `${r.target}:${r.entry}`; };
    if (box.x < -0.01 || box.x + box.w > 540.01 || box.y + box.h > 960.01) out.covers.push(`${at} ${name()}: pill partly off screen at (${Math.round(box.x)}, ${Math.round(box.y)})`);
    else if (box.y < top - 0.01) out.covers.push(`${at} ${name()}: pill under the top bar at y ${Math.round(box.y)}`);
    if (zib && box.x < zib.x + zib.width - 0.5 && zib.x < box.x + box.w - 0.5 && box.y < zib.y + zib.height - 0.5 && zib.y < box.y + box.h - 0.5) out.covers.push(`${at} ${name()}: pill under Zib's bubble`);
    for (const o of boxes) {
      const w = Math.min(o.x + o.w, box.x + box.w) - Math.max(o.x, box.x);
      const h = Math.min(o.y + o.h, box.y + box.h) - Math.max(o.y, box.y);
      if (w > 0.5 && h > 0.5) out.covers.push(`${at} ${name()}: pill overlaps another shown pill by ${Math.round(w)}×${Math.round(h)} px`);
    }
    boxes.push(box);
  }
}

/** With `steer` on one target, flies from the launch to that ring and stops at its lock. */
function flyDeep(level: DeepLevelDef, limit: number, out: Check, tamper?: Tamper, steer?: Steer): void {
  const ctx = context();
  const run = new DeepRun(level, workOrderNumber(level.id) - 1);
  let locked: [number, number] | null = null;
  let over = false;
  const make = (): DeepFlightScene => {
    const scene = new DeepFlightScene({
      ctx, level, run, onLocked: (t, e) => {
        locked = [t, e];
        const key = `${getLang()} ${t}:${e}`;
        const room = level.map.targets[t]!.entries[e]!.roomId;
        out.locks.push({ key, room, shown: out.seen.get(key) ?? 0, need: readSeconds(routePillText(room)), on: out.onScreen.get(key) ?? 0 });
      }, onSunrise: () => { over = true; }, onQuotaMet: () => { over = true; }, onQuit: () => { over = true; },
    });
    // the scene manager builds the view before the first render, which syncs it (SceneManager.swap)
    void scene.view;
    if (steer) steerTo(scene, steer);
    runs.length = 0;
    return scene;
  };
  const runs: number[] = [];
  // each flight's pill times count from its own launch
  out.seen.clear();
  out.onScreen.clear();
  let scene = make();
  for (let f = 0; f < limit / DT && !over; f++) {
    ctx.time += DT;
    if (locked && steer && steer.target >= 0) break;
    if (locked) {
      run.startAbduct(locked[0], locked[1]);
      locked = null;
      const next = run.finishAbduct({ delivered: true, woke: false, timeSec: 30, bonks: 0, dignity: 100, snores: 0, itemsStolen: [], aborted: false });
      out.delivered++;
      if (next !== 'flight') break;
      scene = make();
    }
    if (scene.state === 'spotted') press(ctx.pointer, Math.floor(f / 6) % 2 === 0, 270, 480);
    else {
      const hand = scene.debug.autopilot();
      press(ctx.pointer, hand.down, hand.x, hand.y);
    }
    scene.update(DT);
    // every frame renders: the pills' show/hide state runs per frame, as in the game
    const undo = tamper?.(scene);
    scene.render();
    undo?.();
    trackRuns(scene, `${getLang()} ${level.id} t=${(f * DT).toFixed(2)} s`, runs, out);
    checkPillBoxes(scene, `${getLang()} ${level.id} t=${(f * DT).toFixed(2)} s`, out);
    if (f % EVERY === 0) checkFrame(scene, `${getLang()} t=${(f * DT).toFixed(1)} s`, out);
  }
  const ap = scene.debug.ap;
  if (steer && steer.target >= 0 && !locked && ap?.last.mode === 'hold' && ap.last.go >= 1) out.unreached.add(`${getLang()} ${steer.target}:${steer.entry}`);
}

const deep = LEVELS.filter(isDeep);
const fresh = (): Check => ({ frames: 0, pills: 0, delivered: 0, covers: [], far: [], seen: new Map(), onScreen: new Map(), locks: [], flickers: [], unreached: new Set() });
/**
 * The locks whose pill showed for less than its read time (sampled every EVERY frames). The autopilot sometimes reaches
 * a ring sooner than that after it comes on screen: then the pill must have shown for all the time its ring was on
 * screen below the top bar.
 */
const shortLocks = (out: Check): string[] => out.locks.filter(l => l.shown + 1e-9 < Math.min(l.need, l.on))
  .map(l => `${l.key} ${l.room}: pill shown ${l.shown.toFixed(2)} s of ${l.need.toFixed(2)} s (ring on screen ${l.on.toFixed(2)} s) before the lock`);

/** PILL_TABLE=<file>: write every lock's pill time (level, ring, room, shown s, on screen s, read s) there. */
const TABLE: string[] = [];
/** The same for the steered runs (PILL_TABLE=<file> writes them to <file>.steered). */
const STEERED: string[] = [];
/** And every flicker (<file>.flickers). */
const FLICKERS: string[] = [];
const TABLE_FILE = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PILL_TABLE;
afterAll(async () => {
  if (!TABLE_FILE) return;
  const fsName = 'node:fs';
  const fs = await import(/* @vite-ignore */ fsName) as { writeFileSync(path: string, data: string): void };
  fs.writeFileSync(TABLE_FILE, `${TABLE.join('\n')}\n`);
  fs.writeFileSync(`${TABLE_FILE}.steered`, `${STEERED.join('\n')}\n`);
  fs.writeFileSync(`${TABLE_FILE}.flickers`, `${FLICKERS.join('\n')}\n`);
});

/**
 * Flies the steered runs, in every language: each entry ring from the launch, then a whole shift on each entry index.
 * Returns the rings never locked (`lang target:entry`), each marked when the autopilot held off it (`go = caught`).
 */
function flySteered(level: DeepLevelDef, out: Check, langs: readonly (typeof LANGS)[number][] = LANGS, only?: Steer): string[] {
  const lang = getLang();
  try {
    for (const l of langs) {
      setLang(l);
      if (only) {
        flyDeep(level, 300, out, undefined, only);
        continue;
      }
      level.map.targets.forEach((t, target) => t.entries.forEach((_, entry) => flyDeep(level, 300, out, undefined, { target, entry })));
      const most = Math.max(...level.map.targets.map(t => t.entries.length));
      for (let entry = 0; entry < most; entry++) flyDeep(level, 300, out, undefined, { target: -1, entry });
    }
  } finally {
    setLang(lang);
  }
  const locked = new Set(out.locks.map(l => l.key));
  const missing: string[] = [];
  for (const l of langs) level.map.targets.forEach((t, ti) => t.entries.forEach((_, ei) => {
    if (only && (ti !== only.target || ei !== only.entry)) return;
    const key = `${l} ${ti}:${ei}`;
    if (!locked.has(key)) missing.push(out.unreached.has(key) ? `${key} (the autopilot holds: go = caught)` : key);
  }));
  return missing;
}

describe('route pills on the real flight view', () => {
  it('walks every deep level, EN and FR', () => {
    expect(deep.length).toBeGreaterThan(10);
    expect(LANGS).toEqual(expect.arrayContaining(['en', 'fr']));
  });

  for (const level of deep) {
    it(`${level.id}: no shown pill covers a solid line or strays from its ring (EN, FR)`, () => {
      const out = fresh();
      const lang = getLang();
      try {
        for (const l of LANGS) {
          setLang(l);
          flyDeep(level, 300, out);
        }
      } finally {
        setLang(lang);
      }
      expect(out.delivered, 'the autopilot flies the whole shift in both languages').toBeGreaterThanOrEqual(2 * level.map.targets.filter(t => t.entries.length > 0).length);
      expect(out.pills).toBeGreaterThan(0);
      expect(out.covers.slice(0, 6)).toEqual([]);
      expect(out.far.slice(0, 6)).toEqual([]);
      for (const l of out.locks) TABLE.push(`${level.id}\t${l.key}\t${l.room}\t${l.shown.toFixed(2)}\t${l.on.toFixed(2)}\t${l.need.toFixed(2)}`);
      expect(out.locks.length, 'the autopilot locks every ring it delivers').toBe(out.delivered);
      expect(shortLocks(out)).toEqual([]);
      FLICKERS.push(...out.flickers.map(f => `default ${f}`));
      expect(out.flickers.slice(0, 6), 'no pill flashes for less than PILL_HOLD_FRAMES').toEqual([]);
    }, 240_000);

    // round 5 (Fable): the floor for every ring a player can lock, not only the autopilot's choice
    it(`${level.id}: every entry ring, the autopilot steered to it, showed its pill before the lock (EN, FR)`, () => {
      const out = fresh();
      const missing = flySteered(level, out);
      for (const l of out.locks) STEERED.push(`${level.id}\t${l.key}\t${l.room}\t${l.shown.toFixed(2)}\t${l.on.toFixed(2)}\t${l.need.toFixed(2)}`);
      for (const key of missing) STEERED.push(`${level.id}\t${key}\tnever locked`);
      FLICKERS.push(...out.flickers.map(f => `steered ${f}`));
      // no exemption (council round 6, Opus F2): a ring the autopilot holds off is a ring a player can't time either
      expect(missing, 'the steered autopilot locks every entry ring').toEqual([]);
      expect(out.covers.slice(0, 6)).toEqual([]);
      expect(out.far.slice(0, 6)).toEqual([]);
      expect(shortLocks(out)).toEqual([]);
      expect(out.flickers.slice(0, 6), 'no pill flashes for less than PILL_HOLD_FRAMES').toEqual([]);
    }, 240_000);
  }

  // mutation (council round 6, Opus F2): a static camera parked over Gary's skylight made both Gary rings "unreached"
  // and L3 still passed while the floor exempted a ring the autopilot holds off. Now that ring fails the floor.
  it('fails a ring under a static camera (L3 skylight)', () => {
    const level = deep.find(l => l.id === 'level3')!;
    const sky = level.map.targets[2]!.entries[0]!;
    const hazards = level.map.hazards.map(d => (d.type === 'camera' && d.x === 1440 && d.y === 1930
      ? { ...d, base: Math.atan2(sky.y - d.y, sky.x - d.x), amp: 0, half: 0.4 } : d));
    expect(hazards).not.toEqual(level.map.hazards);
    const mutant = { ...level, map: { ...level.map, hazards } } as DeepLevelDef;
    expect(flySteered(mutant, fresh(), ['en'], { target: 2, entry: 0 })[0]).toMatch(/^en 2:0/);
  }, 240_000);

  const l12 = deep.find(l => l.id === 'level12')!;
  const inEnglish = (fly: () => void): void => {
    const lang = getLang();
    setLang('en');
    try { fly(); } finally { setLang(lang); }
  };

  it('catches the view without its cable check (mutation check)', () => {
    // deep.ts without the solid-line branch: the view sees no solid line while it places pills
    const blind: Tamper = (scene) => {
      const field = scene.sim.field;
      const real = field.solidLine;
      field.solidLine = () => false;
      return () => { field.solidLine = real; };
    };
    const out = fresh();
    inEnglish(() => flyDeep(l12, 60, out, blind));
    expect(out.covers.length).toBeGreaterThan(0);
  }, 240_000);

  it('catches the view without the far-pill rule (mutation check)', () => {
    // EntryLabels.place as it was: every placed pill shows
    const old: Tamper = () => {
      const real = EntryLabels.prototype.place;
      EntryLabels.prototype.place = function (this: EntryLabels, n: number, camX: number, camY: number): void {
        const me = this as unknown as { obstacles: never; asks: never; count: number; spots: { x: number; y: number }[]; moved: Uint8Array; rings: { showPill(v: boolean): void; putPill(x: number, y: number, cx: number, cy: number): void }[]; lineCount: number };
        placePills(me.obstacles, n, me.asks, me.count, me.spots, me.moved);
        for (let i = 0; i < me.count; i++) {
          me.rings[i]!.showPill(me.moved[i] !== 2);
          me.rings[i]!.putPill(me.spots[i]!.x, me.spots[i]!.y, camX, camY);
        }
        me.count = 0;
        me.lineCount = 0;
      };
      return () => { EntryLabels.prototype.place = real; };
    };
    const out = fresh();
    inEnglish(() => flyDeep(l12, 60, out, old));
    expect(out.far.length).toBeGreaterThan(0);
  }, 240_000);

  // round 4 (Fable F2): the floor fails a level whose pills never show, and the view without the fuse-box exception
  const placing = (soft: (given: number | undefined) => number | undefined, hideAll = false): Tamper => () => {
    const real = EntryLabels.prototype.place;
    EntryLabels.prototype.place = function (this: EntryLabels, n: number, camX: number, camY: number, given?: number): void {
      const me = this as unknown as { count: number; rings: { showPill(v: boolean): void }[] };
      const rings = me.rings.slice(0, me.count);
      real.call(this, n, camX, camY, soft(given));
      if (hideAll) for (const r of rings) r.showPill(false);
    };
    return () => { EntryLabels.prototype.place = real; };
  };

  it('catches a level whose pills never show (mutation check)', () => {
    const out = fresh();
    inEnglish(() => flyDeep(l12, 300, out, placing(g => g, true)));
    expect(out.locks.length).toBeGreaterThan(0);
    expect(shortLocks(out).length).toBe(out.locks.length);
  }, 240_000);

  it('catches the view without the fuse-box exception (mutation check)', () => {
    // round 5: the short pill and the heading-first order rescue L10's English "rodney_flap" now; the French one still
    // needs its one-gap spot under the fuse box
    const out = fresh();
    const l10 = deep.find(l => l.id === 'level10')!;
    const lang = getLang();
    setLang('fr');
    try { flyDeep(l10, 300, out, placing(() => -1)); } finally { setLang(lang); }
    expect(shortLocks(out).join('\n')).toMatch(/rodney_flap/);
  }, 240_000);

  // round 5 (Fable): each new rule, switched off in the live view, fails its check
  const tampered = (before: (me: { count: number; asks: { short?: number }[]; rings: { pillHideFrames: number }[] }) => void): Tamper => () => {
    const real = EntryLabels.prototype.place;
    EntryLabels.prototype.place = function (this: EntryLabels, ...args: Parameters<EntryLabels['place']>): void {
      before(this as unknown as Parameters<typeof before>[0]);
      real.apply(this, args);
    };
    return () => { EntryLabels.prototype.place = real; };
  };

  it('catches the view without the short pill (mutation check)', () => {
    const out = fresh();
    const l5 = deep.find(l => l.id === 'level5')!;
    const target = l5.map.targets.findIndex(t => t.entries.some(e => e.roomId === 'sal_dock'));
    const entry = l5.map.targets[target]!.entries.findIndex(e => e.roomId === 'sal_dock');
    inEnglish(() => flyDeep(l5, 300, out, tampered(me => { for (let i = 0; i < me.count; i++) me.asks[i]!.short = 0; }), { target, entry }));
    expect(shortLocks(out).join('\n')).toMatch(/sal_dock: pill shown 0\.00 s/);
  }, 240_000);

  it('catches the view without the hold on hiding (mutation check)', () => {
    // the placement rules above already keep most pills steady; L10's ring 1:1 still flashes for 0.4 s without the hold
    const out = fresh();
    const l10 = deep.find(l => l.id === 'level10')!;
    inEnglish(() => flyDeep(l10, 300, out, tampered(me => { for (let i = 0; i < me.count; i++) me.rings[i]!.pillHideFrames = PILL_HOLD_FRAMES; })));
    expect(out.flickers.join('\n')).toMatch(/pill shown \d+ frames/);
  }, 240_000);

  // round 6 (Fable P3): a held pill that reserves nothing lets another pill land on its spot (L10's Black Knight arch
  // over the loft at the lock), and pills placed without Zib's bubble as an obstacle sit under it (item 5)
  it('catches held pills that reserve nothing, and pills placed under Zib\'s bubble (mutation check)', () => {
    const l10 = deep.find(l => l.id === 'level10')!;
    const l3 = deep.find(l => l.id === 'level3')!;
    const unreserved: Tamper = () => {
      const real = EntryRingView.prototype.heldBox;
      EntryRingView.prototype.heldBox = (_x: number, _y: number, out: { x: number; y: number; w: number; h: number }) => {
        out.x = 270;
        out.y = 500;
        out.w = out.h = 0;
      };
      return () => { EntryRingView.prototype.heldBox = real; };
    };
    const held = fresh();
    inEnglish(() => flyDeep(l10, 300, held, unreserved));
    expect(held.covers.join('\n')).toMatch(/pill overlaps another shown pill/);
    const blind: Tamper = () => {
      const real = DeepFlightHud.prototype.zibBox;
      DeepFlightHud.prototype.zibBox = () => false;
      return () => { DeepFlightHud.prototype.zibBox = real; };
    };
    const zib = fresh();
    inEnglish(() => flyDeep(l3, 300, zib, blind));
    expect(zib.covers.join('\n')).toMatch(/pill under Zib's bubble/);
  }, 240_000);

  // round 6 (Neon P3): L12's French "Trappe de la salle de bains" (310 px) found no room at the launch, so its pill showed
  // 0.00 s of the 5.50 s its ring was on screen while the English one showed throughout. A route name shows at the launch
  // in every language about as long as in English (the widest gap measured is 0.17 s).
  it('every ring\'s pill shows at the launch in every language about as long as in English', () => {
    const lang = getLang();
    const gaps: string[] = [];
    try {
      for (const level of deep) {
        const seen = new Map<string, Map<string, number>>();
        for (const l of LANGS) {
          setLang(l);
          const out = fresh();
          flyDeep(level, 8, out);
          seen.set(l, new Map([...out.seen].map(([k, v]) => [k.slice(k.indexOf(' ') + 1), v])));
        }
        const en = seen.get('en')!;
        for (const l of LANGS) {
          for (const ring of new Set([...en.keys(), ...seen.get(l)!.keys()])) {
            const a = en.get(ring) ?? 0, b = seen.get(l)!.get(ring) ?? 0;
            if (Math.abs(a - b) > 0.5) gaps.push(`${level.id} ${ring}: pill shown ${a.toFixed(2)} s in en, ${b.toFixed(2)} s in ${l}`);
          }
        }
      }
    } finally {
      setLang(lang);
    }
    expect(gaps).toEqual([]);
  }, 240_000);
});
