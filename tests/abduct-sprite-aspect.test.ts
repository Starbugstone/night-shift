// Art is never stretched (player reports: a washing machine drawn at twice its height, the L4 bouncer
// stretched to make new sleepers, the time car's declared size not matching the manifest).
//
// Rule: every sprite a room places (furniture, exit, item, cat, cart, sign, interior decor / furniture /
// supports / mounts, hazard sprites, gate and pop art, sleepers asleep and awake) is drawn within 5% of
// its manifest aspect ratio (src/art-manifest.ts). So is every flight map prop that declares its own
// w / h. The only exceptions are art drawn to any length on purpose, listed in STRETCHABLE with the
// reason. Scale a prop up or down as a whole; for a different shape, ask for new art (or a new key).
//
// PENDING lists the art keys still drawn out of shape somewhere. It shrinks to empty: a pending key that
// is no longer stretched anywhere fails the test until it is taken off the list.
import { describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import { isDeep, LEVELS } from '../src/levels/levels';
import type { PropDef } from '../src/levels/types';
import { placements } from './abduct-guard-helpers';

const TOLERANCE = 0.05;

/** Art drawn at any size on purpose, with why. */
const STRETCHABLE: Readonly<Record<string, string>> = {
  'room/ladder': 'prop() in src/abduct/views/building.ts paints rails and rungs to any length; the SVG is never stretched',
  'room/chimney_stack': 'painted by chimney() in src/abduct/views/building.ts at the size asked; it has no manifest art',
};

/** Room art keys still drawn out of their manifest shape in at least one room. */
const PENDING_ROOM = new Set<string>();

/** Flight prop keys still drawn out of their manifest shape on some map. */
const PENDING_FLIGHT = new Set<string>();

/** Drawn w/h over manifest w/h, as a ratio of ratios (1 = same shape). */
function shape(key: string, w: number, h: number): number {
  const a = ART[key]!;
  return (w / h) / (a.w / a.h);
}

function stretched(key: string, w: number, h: number): boolean {
  return Math.abs(shape(key, w, h) - 1) > TOLERANCE;
}

describe('room art is never stretched', () => {
  const all = placements();
  const out = new Map<string, string[]>();
  for (const { room, role, sprite: s } of all) {
    if (s.key in STRETCHABLE || !ART[s.key]) continue;
    if (!stretched(s.key, s.w, s.h)) continue;
    const list = out.get(s.key) ?? [];
    out.set(s.key, list);
    list.push(`${room} ${role} ${s.w}x${s.h} (${shape(s.key, s.w, s.h).toFixed(2)}x)`);
  }

  it('finds the placements', () => {
    expect(all.length).toBeGreaterThan(500);
  });

  it('sizes every placed key in the manifest', () => {
    const missing = [...new Set(all.filter(p => !(p.sprite.key in STRETCHABLE) && !ART[p.sprite.key]).map(p => `${p.sprite.key} (${p.room} ${p.role})`))];
    expect(missing).toEqual([]);
  });

  it('draws every key in its manifest shape', () => {
    const bad = [...out].filter(([k]) => !PENDING_ROOM.has(k)).map(([k, list]) => `${k} ${ART[k]!.w}x${ART[k]!.h}: ${list.join('; ')}`);
    expect(bad).toEqual([]);
  });

  for (const key of PENDING_ROOM) {
    it(`${key} still waits for its fix (remove it from PENDING_ROOM once it keeps its shape)`, () => {
      expect(out.has(key), `${key} is no longer stretched: drop it from PENDING_ROOM`).toBe(true);
    });
  }

  it('keeps STRETCHABLE short, explained and in use', () => {
    expect(Object.keys(STRETCHABLE).length).toBeLessThanOrEqual(4);
    for (const [key, why] of Object.entries(STRETCHABLE)) {
      expect(why.length, `${key} needs a reason`).toBeGreaterThan(30);
      expect(all.some(p => p.sprite.key === key), `${key} is not placed any more: drop it from STRETCHABLE`).toBe(true);
    }
  });
});

describe('flight props that declare a size keep the manifest shape', () => {
  const out = new Map<string, string[]>();
  const missing: string[] = [];
  for (const l of LEVELS) {
    const props: PropDef[] = isDeep(l)
      ? [...l.map.groundProps, ...l.map.props, ...l.map.targets.map(t => t.building)]
      : [...l.map.groundProps, ...l.map.props, l.map.target];
    for (const p of props) {
      if (p.w === undefined && p.h === undefined) continue;
      const a = ART[p.key];
      if (!a) {
        missing.push(`${l.id} ${p.key}`);
        continue;
      }
      const w = p.w ?? a.w;
      const h = p.h ?? a.h;
      if (!stretched(p.key, w, h)) continue;
      const list = out.get(p.key) ?? [];
      out.set(p.key, list);
      list.push(`${l.id} at ${p.x},${p.y} ${w}x${h} (${shape(p.key, w, h).toFixed(2)}x)`);
    }
  }

  it('sizes every resized prop in the manifest', () => {
    expect(missing).toEqual([]);
  });

  it('draws every resized prop in its manifest shape', () => {
    const bad = [...out].filter(([k]) => !PENDING_FLIGHT.has(k)).map(([k, list]) => `${k} ${ART[k]!.w}x${ART[k]!.h}: ${list.join('; ')}`);
    expect(bad).toEqual([]);
  });

  for (const key of PENDING_FLIGHT) {
    it(`${key} still waits for its fix (remove it from PENDING_FLIGHT once it keeps its shape)`, () => {
      expect(out.has(key), `${key} is no longer stretched: drop it from PENDING_FLIGHT`).toBe(true);
    });
  }
});
