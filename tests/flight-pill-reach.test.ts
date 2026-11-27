// A route pill stays next to its ring (v0.2 council round 3, Fable F2): once pills kept off solid lines, L12's
// "Bathroom hatch" pill was pushed 165–310 px from its ring at the launch, over the barge and the DON'T PANIC sign,
// and flipped sides around t = 3 s. A pill now shows only while it sits within PILL_FAR (1.5) of its gaps from its
// ring and on the ring's side of every solid line (`pillReach`); a hidden one comes back under PILL_NEAR (1.3) after
// PILL_HOLD_FRAMES, so it does not flicker at the edge (`pillShown`, used by `EntryLabels.place`).
//
// Walks every deep level in LEVELS: the launch and every third of a second of the autopilot's shift, in English and
// French, placing the pills as the view does (the harness of tests/flight-pill-lines.test.ts) and applying the view's
// show rule with its state per ring.
import { describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { FlightAutopilot } from '../src/flight/autopilot';
import type { SolidLine } from '../src/flight/hazards';
import { RING_R } from '../src/flight/sim';
import { PILL_FAR, PILL_HOLD_FRAMES, PILL_NEAR, lineObstacles, pillReach, pillShown, placePills, type Box, type PillAsk, type PillLine } from '../src/flight/views/clear-of';
import craftSource from '../src/flight/views/craft.ts?raw';
import deepSource from '../src/flight/views/deep.ts?raw';
import { RING_CLEAR, routePillWidth } from '../src/flight/views/craft';
import { getLang, LANGS, setLang } from '../src/i18n';
import { LEVELS } from '../src/levels/levels';
import type { DeepLevelDef } from '../src/levels/types';
import { HUD_ROW } from '../src/ui/hud';
import { runHeadless } from './flight-deep-harness';

// the deep flight HUD under the top bar, with the view's 4 px of air: minimap and the widest target chips
const HUD: Box[] = [{ x: 435, y: 81, w: 98, h: 127 }, { x: 6, y: 80, w: 355, h: 50 }];
const TOP = HUD_ROW.y + HUD_ROW.h + 2;
const GAP = RING_R + 34;
const SAMPLE_FRAMES = 20;

interface Sample {
  t: number;
  camX: number;
  camY: number;
  /** Rings still to visit, world centres. */
  rings: { x: number; y: number; roomId: DeepLevelDef['map']['targets'][number]['entries'][number]['roomId']; side: -1 | 1 }[];
  /** Solid lines on the map now, world px. */
  lines: SolidLine[];
}

function fly(level: DeepLevelDef): Sample[] {
  const samples: Sample[] = [];
  const entries = level.map.targets.map(t => t.entries);
  runHeadless(level.map, [], (sim) => {
    const ap = new FlightAutopilot(sim);
    let frame = 0;
    return () => {
      if (frame++ % SAMPLE_FRAMES === 0) {
        const lines: SolidLine[] = [];
        for (let i = 0; i < sim.field.defs.length; i++) {
          const l = { ax: 0, ay: 0, bx: 0, by: 0, half: 0 };
          if (sim.field.solidLine(i, l)) lines.push(l);
        }
        const rings = sim.rings.flatMap((p, i) => {
          const ref = sim.ringRef[i]!;
          if (ref.ape || sim.delivered[ref.target]) return [];
          const e = entries[ref.target]![ref.entry]!;
          return [{ x: p.x, y: p.y, roomId: e.roomId, side: e.labelSide === 'above' ? -1 as const : 1 as const }];
        });
        samples.push({ t: sim.st.t, camX: sim.camX, camY: sim.camY, rings, lines });
      }
      return ap.intent();
    };
  }, 240);
  return samples;
}

/** The shown pills at one sample, placed as the deep flight view places them. */
function pills(s: Sample): { box: Box; roomId: string; key: string; reach: number }[] {
  const obs: Box[] = HUD.map(b => ({ ...b }));
  const extra = 64 + s.lines.length * 16;
  for (let i = 0; i < extra; i++) obs.push({ x: 0, y: 0, w: 0, h: 0 });
  let n = HUD.length;
  for (const l of s.lines) n = lineObstacles(obs, n, l.ax, l.ay, l.bx, l.by, l.half, s.camX, s.camY);
  const seen = s.rings.filter(r => r.x > s.camX - 160 && r.x < s.camX + VIEW_W + 160 && r.y > s.camY - 160 && r.y < s.camY + VIEW_H + 160);
  for (const r of seen) {
    const b = obs[n++]!;
    b.x = r.x - s.camX - RING_CLEAR;
    b.y = r.y - s.camY - RING_CLEAR;
    b.w = b.h = RING_CLEAR * 2;
  }
  const asks: PillAsk[] = [];
  const shown: typeof seen = [];
  for (const r of seen) {
    const w = routePillWidth(r.roomId);
    const ringX = r.x - s.camX;
    const ringY = r.y - s.camY;
    if (ringX < -RING_R || ringX > VIEW_W + RING_R || ringY < TOP || ringY > VIEW_H + RING_R) continue;
    asks.push({ x: Math.min(Math.max(ringX - w / 2, 8), VIEW_W - 8 - w), ringX, ringY, reach: RING_R, gap: GAP, side: r.side, w, h: 40, top: TOP });
    shown.push(r);
  }
  const outs = asks.map(() => ({ x: 0, y: 0 }));
  const moved = new Uint8Array(asks.length);
  placePills(obs, n, asks, asks.length, outs, moved);
  const lines: PillLine[] = s.lines.map(l => ({ ax: l.ax - s.camX, ay: l.ay - s.camY, bx: l.bx - s.camX, by: l.by - s.camY }));
  return outs.flatMap((o, i) => moved[i] === 2 ? [] : [{
    box: { x: o.x, y: o.y, w: asks[i]!.w, h: 40 }, roomId: shown[i]!.roomId, key: `${shown[i]!.x},${shown[i]!.y}`,
    reach: pillReach(asks[i]!, o.x, o.y, lines, lines.length),
  }]);
}

const deep = LEVELS.filter((l): l is DeepLevelDef => l.kind === 'deep');

/** Every pill the view shows along a shift, with its reach, applying the view's show rule and state per ring. */
function shownAlong(samples: Sample[]): { t: number; roomId: string; reach: number }[] {
  const state = new Map<string, { was: boolean; hidden: number }>();
  const out: { t: number; roomId: string; reach: number }[] = [];
  for (const s of samples) {
    for (const p of pills(s)) {
      const st = state.get(p.key) ?? { was: true, hidden: PILL_HOLD_FRAMES };
      const shown = pillShown(p.reach, st.was, st.hidden);
      st.hidden = shown ? 0 : st.hidden + SAMPLE_FRAMES;
      st.was = shown;
      state.set(p.key, st);
      if (shown) out.push({ t: s.t, roomId: p.roomId, reach: p.reach });
    }
  }
  return out;
}

describe('route pills stay next to their rings', () => {
  it('the deep view applies the rule to every pill, with every solid line on screen', () => {
    expect(craftSource).toMatch(/const shown = this\.moved\[i\] !== 2 && pillShown\(pillReach\(this\.asks\[i\]!, spot\.x, spot\.y, this\.lines, this\.lineCount\), ring\.pillWasShown, ring\.pillHiddenFrames\);/);
    expect(craftSource).toMatch(/ring\.showPill\(shown\);/);
    expect(deepSource).toMatch(/n = lineObstacles\(clear, n, l\.ax, l\.ay, l\.bx, l\.by, l\.half, cam\.x, cam\.y\);\s*\n(?:\s*\/\/[^\n]*\n)?\s*this\.labels\.line\(l\.ax - cam\.x, l\.ay - cam\.y, l\.bx - cam\.x, l\.by - cam\.y\);/);
    expect(deepSource).toMatch(/new EntryLabels\([\s\S]*?, m\.hazards\.length\);/);
  });

  for (const level of deep) {
    it(`${level.id}: no shown pill is more than ${PILL_FAR} gaps from its ring, or across a solid line (EN, FR)`, () => {
      const samples = fly(level);
      expect(samples.length).toBeGreaterThan(5);
      const lang = getLang();
      const far: string[] = [];
      try {
        for (const l of LANGS) {
          setLang(l);
          for (const p of shownAlong(samples)) {
            if (!(p.reach <= PILL_FAR)) far.push(`${l} t=${p.t.toFixed(1)} s: the ${p.roomId} pill is ${Number.isFinite(p.reach) ? `${(p.reach * GAP).toFixed(0)} px` : 'across a solid line'} from its ring`);
          }
        }
      } finally {
        setLang(lang);
      }
      expect(far.slice(0, 8)).toEqual([]);
    }, 60_000);
  }

  it('the L12 launch placement pushes the Bathroom hatch pill far from its ring, and the rule hides it (mutation check)', () => {
    const level = deep.find(l => l.id === 'level12')!;
    const launch = fly(level).slice(0, 12);
    const lang = getLang();
    try {
      setLang('en');
      const placed = launch.flatMap(s => pills(s));
      expect(placed.some(p => p.roomId === 'artie_bath' && !(p.reach <= PILL_FAR))).toBe(true);
      expect(shownAlong(launch).every(p => p.reach <= PILL_FAR)).toBe(true);
    } finally {
      setLang(lang);
    }
  });

  it('a pill at the edge does not flicker: hidden past PILL_FAR, back only under PILL_NEAR after the hold', () => {
    expect(pillShown(PILL_FAR, true, 0)).toBe(true);
    expect(pillShown(PILL_FAR + 0.01, true, 0)).toBe(false);
    expect(pillShown(Infinity, true, 0)).toBe(false);
    // hovering between the two thresholds: stays as it was
    expect(pillShown((PILL_FAR + PILL_NEAR) / 2, false, 999)).toBe(false);
    expect(pillShown((PILL_FAR + PILL_NEAR) / 2, true, 0)).toBe(true);
    // back near: only after the hold
    expect(pillShown(1, false, PILL_HOLD_FRAMES - 1)).toBe(false);
    expect(pillShown(1, false, PILL_HOLD_FRAMES)).toBe(true);
    // a reach that wobbles across PILL_FAR every frame toggles at most once per hold
    let was = true, hidden = 0, toggles = 0;
    for (let f = 0; f < 600; f++) {
      const shown = pillShown(f % 2 ? PILL_FAR + 0.1 : PILL_FAR - 0.1, was, hidden);
      if (shown !== was) toggles++;
      hidden = shown ? 0 : hidden + 1;
      was = shown;
    }
    expect(toggles).toBeLessThanOrEqual(1);
  });

  it('a solid line between a ring and its pill counts as across', () => {
    const ask: PillAsk = { x: 200, ringX: 270, ringY: 500, reach: 60, gap: GAP, side: 1, w: 140, h: 40, top: 80 };
    const y = 500 + GAP - 20;
    expect(pillReach(ask, 200, y, [], 0)).toBeCloseTo(1);
    expect(pillReach(ask, 200, y, [{ ax: 100, ay: 560, bx: 440, by: 560 }], 1)).toBe(Infinity);
    expect(pillReach(ask, 200, y, [{ ax: 100, ay: 700, bx: 440, by: 700 }], 1)).toBeCloseTo(1);
  });
});
