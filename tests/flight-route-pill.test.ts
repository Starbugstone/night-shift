import { describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { LEVELS, isDeep } from '../src/levels/levels';
import { RING_R } from '../src/flight/sim';
import { placePill, placePills, type Box, type PillAsk } from '../src/flight/views/clear-of';

// the deep flight HUD under the top bar: minimap, target chips, Field Check badge
const minimap: Box = { x: 439, y: 85, w: 90, h: 119 };
const chips = (w: number): Box => ({ x: 10, y: 84, w, h: 42 });
const badge: Box = { x: 150, y: 148, w: 240, h: 20 };
const TOP = 80;
const CLEAR = RING_R + 8;
const GAP = RING_R + 34;

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const ringBox = (x: number, y: number): Box => ({ x: x - CLEAR, y: y - CLEAR, w: CLEAR * 2, h: CLEAR * 2 });
const clampX = (x: number, w: number) => Math.min(Math.max(x, 8), VIEW_W - 8 - w);

/** Places the pill of the ring at `rings[own]` (screen centres) the way `EntryRingView` asks. */
function place(hud: Box[], rings: [number, number][], own: number, w: number, side: -1 | 1): Box {
  const obs = [...hud, ...rings.map(([x, y]) => ringBox(x, y))];
  const [rx, ry] = rings[own]!;
  const ask: PillAsk = { x: clampX(rx - w / 2, w), ringX: rx, ringY: ry, reach: RING_R, gap: GAP, side, w, h: 40, top: TOP };
  const out = { x: 0, y: 0 };
  placePill(obs, obs.length, ask, out);
  return { ...out, w, h: 40 };
}

function expectClear(p: Box, hud: Box[], rings: [number, number][], what: string): void {
  for (const b of hud) expect(overlaps(p, b), `${what} hits HUD ${JSON.stringify(b)}: ${JSON.stringify(p)}`).toBe(false);
  for (const [x, y] of rings) expect(overlaps(p, ringBox(x, y)), `${what} hits ring ${x},${y}: ${JSON.stringify(p)}`).toBe(false);
  expect(p.y, `${what} under the top bar`).toBeGreaterThanOrEqual(TOP);
  expect(p.x).toBeGreaterThanOrEqual(8);
  expect(p.x + p.w).toBeLessThanOrEqual(VIEW_W - 8);
}

describe('route pill placement', () => {
  it('leaves a pill alone when nothing is in the way', () => {
    expect(place([minimap, chips(110)], [[250, 520]], 0, 300, -1)).toMatchObject({ x: 100, y: 520 - GAP - 20 });
  });

  it('slides a narrow pill left of the minimap when that clears everything', () => {
    // EN at the Field Check start: "Patio door — creaky stairs", clamped to the right edge
    const hud = [minimap, chips(110), badge];
    const rings: [number, number][] = [[420, 300]];
    const p = place(hud, rings, 0, 300, -1);
    expect(p.y).toBe(300 - GAP - 20);
    expect(p.x).toBeLessThanOrEqual(minimap.x - 8 - 300);
    expectClear(p, hud, rings, 'patio');
  });

  it('flips an above pill below its ring when the HUD blocks it, never dropping it across the ring (council round 3)', () => {
    // FR kev_vent / dave_roof: ring at the map top (screen y 217), 288–415 px wide label, chips
    // and minimap in the way; round 2 dropped it below the chips, straight onto the ring
    const hud = [minimap, chips(110)];
    for (const w of [288, 345, 415, 440]) {
      const rings: [number, number][] = [[270, 217]];
      const p = place(hud, rings, 0, w, -1);
      expectClear(p, hud, rings, `w=${w}`);
      // a narrow one still fits above, between the chips and the minimap; wider ones go below
      expect(p.y).toBe(w <= 288 ? 217 - GAP - 20 : 217 + GAP - 20);
    }
  });

  it('keeps clear of a sibling ring on a two-entry building (captain_mast FR)', () => {
    // the mast ring with the bridge ring under it: flipping below must not land on the sibling
    const hud = [minimap, chips(200)];
    const rings: [number, number][] = [[270, 237], [300, 400]];
    const p = place(hud, rings, 0, 440, -1);
    expectClear(p, hud, rings, 'mast');
  });

  it("keeps a flipped pill off its sibling's pill (kev_vent FR over the fire escape)", () => {
    // kev_vent's above pill is blocked by the chips, so it flips below its ring, where the fire
    // escape's own pill sits (below its ring): the unmoved pill keeps its spot, the moved one goes elsewhere
    const hud = [minimap, chips(330)];
    const rings: [number, number][] = [[270, 216], [100, 317]];
    const sides: (-1 | 1)[] = [-1, 1];
    const widths = [450, 400];
    const boxes = placeAll(hud, rings, sides, widths);
    boxes.forEach((p, i) => expectClear(p, hud, rings, `pill ${i}`));
    expect(overlaps(boxes[0]!, boxes[1]!), JSON.stringify(boxes)).toBe(false);
  });

  it('keeps every deep-level pill clear of the HUD, of every ring and of every other pill on screen', () => {
    const misses: string[] = [];
    for (const level of LEVELS) {
      if (!isDeep(level)) continue;
      const m = level.map;
      const entries = m.targets.flatMap((tg) => tg.entries);
      for (const e of entries) {
        for (const sy of [140, 200, 240, 280, 320, 480, 700, 840]) {
          const camX = Math.max(0, Math.min(m.w - VIEW_W, e.x - VIEW_W / 2));
          const camY = Math.max(0, Math.min(m.h - VIEW_H, e.y - sy));
          // rings fully on screen below the top bar (one scrolling off the top takes its pill with it)
          const near = entries.filter((o) => o.x > camX - 160 && o.x < camX + VIEW_W + 160 && o.y > camY - 160 && o.y < camY + VIEW_H + 160);
          const rings = near.map((o): [number, number] => [o.x - camX, o.y - camY]);
          for (const w of [200, 300, 415, 440]) {
            for (const chipW of [110, 260, 347]) {
              const hud = [minimap, chips(chipW)];
              const boxes = placeAll(hud, rings, near.map((o) => o.labelSide === 'above' ? -1 : 1), near.map(() => w));
              boxes.forEach((p, i) => {
                const [, ry] = rings[i]!;
                if (ry < TOP || ry > VIEW_H || rings[i]![0] < 0 || rings[i]![0] > VIEW_W) return;
                const bad = hud.some((b) => overlaps(p, b)) || rings.some(([x, y]) => overlaps(p, ringBox(x, y))) || p.y < TOP ||
                  boxes.some((q, j) => j !== i && overlaps(p, q));
                if (bad) misses.push(`${level.id} ${near[i]!.roomId} screenY=${sy} w=${w} chips=${chipW}`);
              });
            }
          }
        }
      }
    }
    expect(misses).toEqual([]);
  });
});

/** Places every pill on screen the way the deep flight view does (`placePills`). */
function placeAll(hud: Box[], rings: [number, number][], sides: (-1 | 1)[], widths: number[]): Box[] {
  const obs = [...hud, ...rings.map(([x, y]) => ringBox(x, y)), ...rings.map(() => ({ x: 0, y: 0, w: 0, h: 0 }))];
  const asks: PillAsk[] = rings.map(([rx, ry], i) => ({ x: clampX(rx - widths[i]! / 2, widths[i]!), ringX: rx, ringY: ry, reach: RING_R, gap: GAP, side: sides[i]!, w: widths[i]!, h: 40, top: TOP }));
  const outs = rings.map(() => ({ x: 0, y: 0 }));
  placePills(obs, hud.length + rings.length, asks, asks.length, outs, new Uint8Array(rings.length));
  return outs.map((o, i) => ({ ...o, w: widths[i]!, h: 40 }));
}
