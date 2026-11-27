// Route pills never hide a solid line the saucer can bump into (v0.2 council round 2, Opus F2): L12's survey cable
// (0.4 s stun) sat under the "Bathroom hatch" pill at the launch, because pills only kept clear of the HUD, the rings
// and each other. The deep flight view now adds every on-screen solid line (wires, bunting, survey cables, crane
// booms: `HazardField.solidLine`) to the pill obstacles through `lineObstacles`.
//
// Walks every deep level in LEVELS: the launch camera and every third of a second of the autopilot's shift, in English
// and French, placing the pills as the view does (`placePills`, the view's pill widths) and wanting no shown pill
// over a solid line as drawn (its wires, flags and ink, LINE_DRAWN) on screen.
import { describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { FlightAutopilot } from '../src/flight/autopilot';
import type { SolidLine } from '../src/flight/hazards';
import { RING_R } from '../src/flight/sim';
import { LINE_DRAWN, lineObstacles, placePills, segmentHitsBox, type Box, type PillAsk } from '../src/flight/views/clear-of';
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
function pills(s: Sample): { box: Box; roomId: string }[] {
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
  return outs.flatMap((o, i) => moved[i] === 2 ? [] : [{ box: { x: o.x, y: o.y, w: asks[i]!.w, h: 40 }, roomId: shown[i]!.roomId }]);
}

const deep = LEVELS.filter((l): l is DeepLevelDef => l.kind === 'deep');

describe('route pills keep off solid lines', () => {
  it('walks every deep level, and some of them have solid lines', () => {
    expect(deep.length).toBeGreaterThan(10);
    expect(deep.filter(l => l.map.hazards.some(h => h.type === 'wire' || h.type === 'crane')).length).toBeGreaterThan(2);
  });

  for (const level of deep) {
    it(`${level.id}: no pill covers a solid line at the launch or along the autopilot shift (EN, FR)`, () => {
      const samples = fly(level);
      expect(samples.length).toBeGreaterThan(5);
      const lang = getLang();
      const hits: string[] = [];
      try {
        for (const l of LANGS) {
          setLang(l);
          for (const s of samples) {
            for (const { box, roomId } of pills(s)) {
              for (const line of s.lines) {
                // the line as drawn: its wires, flags and ink
                const grow = line.half + LINE_DRAWN;
                const b = { x: box.x - grow, y: box.y - grow, w: box.w + grow * 2, h: box.h + grow * 2 };
                if (segmentHitsBox(line.ax - s.camX, line.ay - s.camY, line.bx - s.camX, line.by - s.camY, b))
                  hits.push(`${l} t=${s.t.toFixed(1)} s: the ${roomId} pill covers the line (${line.ax}, ${line.ay})–(${line.bx}, ${line.by})`);
              }
            }
          }
        }
      } finally {
        setLang(lang);
      }
      expect(hits.slice(0, 8)).toEqual([]);
    }, 60_000);
  }

  it('the old view (no line obstacles) let the L12 launch pill sit on the survey cable (mutation check)', () => {
    const level = deep.find(l => l.id === 'level12')!;
    const launch = fly(level)[0]!;
    const blind = { ...launch, lines: [] as SolidLine[] };
    const lang = getLang();
    try {
      setLang('en');
      const grow = LINE_DRAWN;
      const covered = pills(blind).some(({ box }) => launch.lines.some(line =>
        segmentHitsBox(line.ax - launch.camX, line.ay - launch.camY, line.bx - launch.camX, line.by - launch.camY,
          { x: box.x - grow, y: box.y - grow, w: box.w + grow * 2, h: box.h + grow * 2 })));
      expect(covered).toBe(true);
    } finally {
      setLang(lang);
    }
  });
});
