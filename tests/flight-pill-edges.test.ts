// No route pill hides a detector's hard edge (docs/REGRESSIONS.md F11; v0.2 council round 2, F10 follow-up): pills
// stay next to their rings, so on 8 of 12 deep levels they crossed a cone edge, and the pill (90% opaque, drawn
// above every detector) covered the edge. Pills now sit in their own layer (ROUTE_PILLS) under every layer of
// detector tells (DETECTOR_TELLS): a cone's hard edge, its hot rim and its live fill draw over the pill.
//
// Builds the real flight views headless (tests/pixi-headless.ts) for every level in LEVELS, in English and French,
// and flies each shift on the scene's own autopilot (rooms passed as delivered). At the launch and every 10 frames
// after, every shown pill that meets a shown detector tell on screen must be drawn before (under) that tell.
import './pixi-headless';
import { Container, type ContainerChild } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { GameContext, PointerState } from '../src/contracts';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { FlightScene } from '../src/flight/scene';
import { DETECTOR_TELLS, ROUTE_PILLS } from '../src/flight/views/craft';
import { getLang, LANGS, setLang } from '../src/i18n';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef, TutorialLevelDef } from '../src/levels/types';

declare const process: { stdout: { write(s: string): void } };
const DT = 1 / 60;
const EVERY = 10;

function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {}, speak() {}, hush() {} } as never, upgrades: new Set(),
    reducedMotion: false, tutorial: false, time: 0,
  };
}

function press(p: PointerState, down: boolean, x: number, y: number): void {
  p.pressed = down && !p.down;
  p.released = !down && p.down;
  p.down = down;
  p.x = x;
  p.y = y;
}

interface Rect { x: number; y: number; w: number; h: number }

const shown = (o: ContainerChild): boolean => {
  for (let c: Container | null = o as Container; c; c = c.parent) if (!c.visible || c.alpha <= 0.01 || c.renderable === false) return false;
  return true;
};

const meet = (a: Rect, b: Rect): boolean => a.w > 0 && a.h > 0 && b.w > 0 && b.h > 0 &&
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function bounds(o: ContainerChild): Rect {
  const b = o.getBounds();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}

export interface PillCheck {
  /** Pill-frames where a shown pill meets a shown detector tell on screen. */
  meetings: number;
  /** Of those, the tell outlines (Graphics), the old F10 count's kind. */
  outlines: number;
  /** A tell drawn under a pill it meets (the pill hides it). */
  hidden: string[];
  /** Frames checked, and rooms delivered on the way (the route really was flown). */
  frames: number;
  delivered: number;
}

/** Checks one rendered frame of a flight view: every pill that meets a tell is drawn before it. */
export function checkFrame(root: Container, at: string, out: PillCheck): void {
  out.frames++;
  const order = new Map<ContainerChild, number>();
  const pills: ContainerChild[] = [];
  const tells: ContainerChild[] = [];
  let k = 0;
  const walk = (o: ContainerChild, inTells: boolean): void => {
    order.set(o, k++);
    const tell = inTells || o.label === DETECTOR_TELLS;
    if (o.label === ROUTE_PILLS) {
      for (const p of o.children) if (p.children[0] && shown(p.children[0])) pills.push(p.children[0]);
    }
    if (tell && o.children.length === 0 && shown(o)) tells.push(o);
    for (const c of o.children) walk(c, tell);
  };
  walk(root, false);
  const view: Rect = { x: 0, y: 0, w: 540, h: 960 };
  for (const pill of pills) {
    // only the part of the pill on screen
    const raw = bounds(pill);
    const x = Math.max(raw.x, view.x);
    const y = Math.max(raw.y, view.y);
    const pb: Rect = { x, y, w: Math.min(raw.x + raw.w, view.w) - x, h: Math.min(raw.y + raw.h, view.h) - y };
    if (!meet(pb, view)) continue;
    let met = false;
    for (const tell of tells) {
      const tb = bounds(tell);
      if (!meet(pb, tb)) continue;
      met = true;
      if (tell.constructor.name === 'Graphics' || tell.constructor.name === 'Shape') out.outlines++;
      // a pill is never inside a tell's subtree, so draw order is the walk order
      if (order.get(tell)! < order.get(pill)!) out.hidden.push(`${at}: a ${tell.constructor.name} tell at (${Math.round(tb.x)}, ${Math.round(tb.y)}) is drawn under a route pill`);
    }
    if (met) out.meetings++;
  }
}

/** Flies a deep shift on the scene's autopilot and checks every EVERY-th frame. */
function flyDeep(level: DeepLevelDef, limit: number, out: PillCheck, tamper?: (view: Container) => void): void {
  const ctx = context();
  const run = new DeepRun(level, workOrderNumber(level.id) - 1);
  let locked: [number, number] | null = null;
  let over = false;
  const make = (): DeepFlightScene => new DeepFlightScene({
    ctx, level, run, onLocked: (t, e) => { locked = [t, e]; }, onSunrise: () => { over = true; }, onQuotaMet: () => { over = true; }, onQuit: () => { over = true; },
  });
  let scene = make();
  for (let f = 0; f < limit / DT && !over; f++) {
    ctx.time += DT;
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
    if (f % EVERY === 0) {
      scene.render();
      tamper?.(scene.view);
      checkFrame(scene.view, `${getLang()} t=${(f * DT).toFixed(1)} s`, out);
    }
  }
}

/** A tutorial flight: a finger held toward each ring in turn, checked every EVERY-th frame. */
function flyTutorial(level: TutorialLevelDef, limit: number, out: PillCheck): void {
  const ctx = context();
  let locked = false;
  const scene = new FlightScene({ ctx, level, spotted: 0, onLocked: () => { locked = true; }, onQuit: () => { locked = true; } });
  const rings = level.map.entries;
  for (let f = 0; f < limit / DT && !locked; f++) {
    ctx.time += DT;
    if (scene.state === 'spotted') press(ctx.pointer, Math.floor(f / 6) % 2 === 0, 270, 480);
    else {
      const ring = rings[Math.floor(f * DT / 20) % rings.length]!;
      const dx = ring.x - scene.saucer.x;
      const dy = ring.y - scene.saucer.y;
      const d = Math.hypot(dx, dy) || 1;
      press(ctx.pointer, true, 270 + (dx / d) * 120, 480 + (dy / d) * 120);
    }
    scene.update(DT);
    if (f % EVERY === 0) {
      scene.render();
      checkFrame(scene.view, `${getLang()} t=${(f * DT).toFixed(1)} s`, out);
    }
  }
}

function inLangs(fly: () => void): void {
  const lang = getLang();
  try {
    for (const l of LANGS) {
      setLang(l);
      fly();
    }
  } finally {
    setLang(lang);
  }
}


describe('route pills never hide a detector edge', () => {
  it('walks every level, EN and FR', () => {
    expect(LEVELS.filter(isDeep).length).toBeGreaterThan(10);
    expect(LANGS).toEqual(expect.arrayContaining(['en', 'fr']));
  });

  for (const level of LEVELS) {
    it(`${level.id}: at the launch and along the shift, every pill is drawn under the tells it meets (EN, FR)`, () => {
      const out: PillCheck = { meetings: 0, outlines: 0, hidden: [], frames: 0, delivered: 0 };
      inLangs(() => isDeep(level) ? flyDeep(level, 300, out) : flyTutorial(level as TutorialLevelDef, 90, out));
      process.stdout.write(`[pill-edges ${level.id}] ${out.frames} frames, ${out.delivered} rooms delivered: ${out.meetings} pill-frames meet a tell (${out.outlines} outline meetings), ${out.hidden.length} hidden\n`);
      if (isDeep(level)) expect(out.delivered, 'the autopilot flies the whole shift in both languages').toBeGreaterThanOrEqual(2 * level.map.targets.filter(t => t.entries.length > 0).length);
      expect(out.hidden.slice(0, 6)).toEqual([]);
    }, 240_000);
  }

  it('catches the old layering, pills above the tells (mutation check)', () => {
    const level = LEVELS.filter(isDeep).find(l => l.id === 'level12')!;
    const out: PillCheck = { meetings: 0, outlines: 0, hidden: [], frames: 0, delivered: 0 };
    // the old view: the pills drawn last in their layer's parent, above the detectors
    const above = (view: Container): void => {
      const find = (o: Container): Container | null => o.label === ROUTE_PILLS ? o : o.children.reduce<Container | null>((hit, c) => hit ?? find(c), null);
      const pills = find(view);
      if (pills?.parent && pills.parent.children.at(-1) !== pills) pills.parent.addChild(pills);
    };
    const lang = getLang();
    setLang('en');
    try {
      flyDeep(level as DeepLevelDef, 300, out, above);
    } finally {
      setLang(lang);
    }
    expect(out.hidden.length).toBeGreaterThan(0);
  }, 240_000);
});
