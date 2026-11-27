// Route pills checked on the real flight view (v0.2 council round 3, Opus O2): tests/flight-pill-lines.test.ts and
// tests/flight-pill-reach.test.ts place a copy of the pills, so switching off the cable check in
// src/flight/views/deep.ts still passed them. This test builds the real deep flight view headless (tests/pixi-headless.ts,
// as tests/flight-pill-edges.test.ts does) for every deep level in LEVELS, in English and French, flies each shift on the
// scene's own autopilot (rooms passed as delivered) and reads every shown pill from the ROUTE_PILLS layer:
// - no shown pill covers a solid line as drawn (docs/REGRESSIONS.md F12, round 2 Opus F2);
// - no shown pill sits more than PILL_FAR gaps from its ring, or across a solid line from it (round 3 Fable F2).
// The mutation checks switch each rule off in the live view and want the check to fail.
import './pixi-headless';
import { Container, Point, type ContainerChild } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { GameContext, PointerState } from '../src/contracts';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { RING_R } from '../src/flight/sim';
import { LINE_DRAWN, PILL_FAR, placePills, segmentHitsBox } from '../src/flight/views/clear-of';
import { EntryLabels, ROUTE_PILLS } from '../src/flight/views/craft';
import { getLang, LANGS, setLang } from '../src/i18n';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef } from '../src/levels/types';

const DT = 1 / 60;
const EVERY = 10;
/** Pill centre to ring centre (craft.ts PILL_GAP). */
const GAP = RING_R + 34;

interface Rect { x: number; y: number; w: number; h: number }
interface Check { frames: number; pills: number; delivered: number; covers: string[]; far: string[] }

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
  for (const root of layer.children) {
    const pill = root.children[0];
    if (!pill || !shown(pill)) continue;
    const b = pill.getBounds();
    const box: Rect = { x: b.x, y: b.y, w: b.width, h: b.height };
    if (box.x + box.w < 0 || box.x > 540 || box.y + box.h < 0 || box.y > 960) continue;
    out.pills++;
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

/** Flies a deep shift on the scene's autopilot and checks every EVERY-th rendered frame. */
function flyDeep(level: DeepLevelDef, limit: number, out: Check, tamper?: Tamper): void {
  const ctx = context();
  const run = new DeepRun(level, workOrderNumber(level.id) - 1);
  let locked: [number, number] | null = null;
  let over = false;
  const make = (): DeepFlightScene => {
    const scene = new DeepFlightScene({
      ctx, level, run, onLocked: (t, e) => { locked = [t, e]; }, onSunrise: () => { over = true; }, onQuotaMet: () => { over = true; }, onQuit: () => { over = true; },
    });
    // the scene manager builds the view before the first render, which syncs it (SceneManager.swap)
    void scene.view;
    return scene;
  };
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
    // every frame renders: the pills' show/hide state runs per frame, as in the game
    const undo = tamper?.(scene);
    scene.render();
    undo?.();
    if (f % EVERY === 0) checkFrame(scene, `${getLang()} t=${(f * DT).toFixed(1)} s`, out);
  }
}

const deep = LEVELS.filter(isDeep);
const fresh = (): Check => ({ frames: 0, pills: 0, delivered: 0, covers: [], far: [] });

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
    }, 240_000);
  }

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
});
