import { describe, expect, it } from 'vitest';
import { ART } from '../src/art-manifest';
import type { MapCollectibleId } from '../src/contracts';
import { BEAT_SLOT, BLINK_SLOT, beatStart, figurePose, figureSeed, newFigurePose, type FigureBeat } from '../src/flight/pickup-pose';
import { PERSON_RIGS, PICKUP_SIZE, pickupArtKeys, pickupKey } from '../src/flight/pickup-rig';
import { ROAD_W } from '../src/flight/draw-common';
import { RING_R } from '../src/flight/sim';
import { PickupFigure, pickupFallback } from '../src/flight/views/collectible';
import { LEVELS } from '../src/levels/levels';

const DT = 1 / 60;
const IDS = Object.keys(PICKUP_SIZE) as MapCollectibleId[];
const files = import.meta.glob('../public/art/flight/pickup_*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const file = (key: string): string | undefined => files[`../public/art/${key}.svg`];

/** Play `secs` of a figure and list when each beat and each blink starts. */
function watch(seed: number, secs: number, pattern?: readonly FigureBeat[]) {
  const pose = newFigurePose();
  const beats: { at: number; beat: FigureBeat }[] = [];
  let blinks = 0;
  let wasBeat: FigureBeat | null = null;
  let wasShut = false;
  for (let t = 0; t < secs; t += DT) {
    figurePose(t, seed, false, pose, pattern);
    if (pose.beat && pose.beat !== wasBeat) beats.push({ at: t, beat: pose.beat });
    wasBeat = pose.beat;
    // a blink outside a yawn (a yawn shuts the eyes by itself)
    const shut = pose.lid > 0.5 && pose.yawn === 0;
    if (shut && !wasShut) blinks++;
    wasShut = shut;
  }
  return { beats, blinks };
}

describe('town pickup art', () => {
  it('every pickup has its whole art in the manifest at its map size, and the file matches', () => {
    for (const lv of LEVELS) {
      const id = lv.map.collectible?.id;
      if (id) expect(PICKUP_SIZE[id], `${lv.id} pickup ${id} needs a size`).toBeDefined();
    }
    for (const id of IDS) {
      const [w, h] = PICKUP_SIZE[id];
      expect(ART[pickupKey(id)], pickupKey(id)).toEqual({ w, h });
      // readable on a phone: about the saucer's size, never the 40 px blob it was
      expect(Math.max(w, h), `${id} long side`).toBeGreaterThanOrEqual(84);
      expect(Math.max(w, h), `${id} long side`).toBeLessThanOrEqual(130);
    }
    for (const key of pickupArtKeys()) {
      const spec = ART[key];
      expect(spec, `${key} in the manifest`).toBeDefined();
      const svg = file(key);
      expect(svg, `public/art/${key}.svg`).toBeDefined();
      expect(svg, `${key} viewBox`).toContain(`viewBox="0 0 ${spec!.w} ${spec!.h}"`);
      expect(svg, `${key}: no text in art`).not.toMatch(/<text|font-family/);
    }
  });

  it('a person is cut into layers that fit the figure, with a face on exactly one of them', () => {
    for (const id of IDS) {
      const rig = PERSON_RIGS[id];
      if (!rig) continue;
      const [w, h] = PICKUP_SIZE[id];
      expect(rig.parts.filter((p) => p.face), `${id} face layer`).toHaveLength(1);
      for (const p of rig.parts) {
        expect(ART[p.key], p.key).toEqual({ w: p.w, h: p.h });
        expect(p.x >= 0 && p.y >= 0 && p.x + p.w <= w && p.y + p.h <= h, `${p.key} inside the figure`).toBe(true);
      }
      const head = rig.parts.find((p) => p.face)!;
      for (const e of [...rig.eyes, rig.mouth]) {
        expect(e.x > head.x && e.x < head.x + head.w && e.y > head.y && e.y < head.y + head.h, `${id} face on the head layer`).toBe(true);
      }
      // every beat in the pattern is one the figure can show
      expect(new Set(rig.pattern), `${id} uses all four beats`).toEqual(new Set<FigureBeat>(['look', 'yawn', 'actA', 'actB']));
    }
    // the two people of this release
    expect(Object.keys(PERSON_RIGS).sort()).toEqual(['astronomer', 'krix']);
  });

  it('the art footprint stays off the road surface, the buildings, the entry rings and the map edge', () => {
    for (const lv of LEVELS) {
      const m = lv.map;
      const p = m.collectible;
      if (!p) continue;
      const [w, h] = PICKUP_SIZE[p.id];
      const box = { l: p.x - w / 2, r: p.x + w / 2, t: p.y - h / 2, b: p.y + h / 2 };
      expect(box.l >= 0 && box.t >= 0 && box.r <= m.w && box.b <= m.h, `${lv.id} inside the map`).toBe(true);
      // the kerb may be brushed (14 px), the lanes and the centre line never
      for (const r of m.roads) {
        const lanes = ROAD_W / 2 - 14;
        const across = r.dir === 'h' ? box.t < r.at + lanes && box.b > r.at - lanes : box.l < r.at + lanes && box.r > r.at - lanes;
        const along = r.dir === 'h' ? box.l < r.to && box.r > r.from : box.t < r.to && box.b > r.from;
        expect(across && along, `${lv.id} pickup art on the road at ${r.dir} ${r.at}`).toBe(false);
      }
      const solid = 'targets' in m ? [...m.props, ...m.targets.map((tg) => tg.building)] : [...m.props, m.target];
      for (const prop of solid) {
        const spec = ART[prop.key];
        if (!spec) continue;
        // the art's own box has a few px of air round the walls: allow a 12 px brush (the L2 flyer is pinned on the wall)
        const hw = (prop.w ?? spec.w) / 2 - 12;
        const hh = (prop.h ?? spec.h) / 2 - 12;
        const hit = box.l < prop.x + hw && box.r > prop.x - hw && box.t < prop.y + hh && box.b > prop.y - hh;
        expect(hit, `${lv.id} pickup art over ${prop.key} at (${prop.x},${prop.y})`).toBe(false);
      }
      const entries = 'targets' in m ? m.targets.flatMap((tg) => tg.entries) : m.entries;
      for (const e of entries) {
        const dx = Math.max(box.l - e.x, 0, e.x - box.r);
        const dy = Math.max(box.t - e.y, 0, e.y - box.b);
        expect(Math.hypot(dx, dy), `${lv.id} pickup art vs ring ${e.roomId}`).toBeGreaterThan(RING_R);
      }
    }
  });
});

describe('a person idling on the map', () => {
  it('is a pure function of the clock and the seed', () => {
    const a = newFigurePose();
    const b = newFigurePose();
    for (const t of [0, 0.4, 3.7, 12.34, 600.5]) {
      figurePose(t, 42, false, a);
      figurePose(1e3, 7, false, b); // scribble on the other pose first
      figurePose(t, 42, false, b);
      expect(b).toEqual(a);
    }
    expect(figureSeed('astronomer')).toBe(figureSeed('astronomer'));
  });

  it('plays a beat every 2–4 s, walks its pattern in order and blinks more often than that', () => {
    for (const id of IDS) {
      const rig = PERSON_RIGS[id];
      if (!rig) continue;
      const { beats, blinks } = watch(figureSeed(id), 120, rig.pattern);
      expect(beats.length, `${id} beats in two minutes`).toBeGreaterThanOrEqual(38);
      for (let i = 1; i < beats.length; i++) {
        const gap = beats[i]!.at - beats[i - 1]!.at;
        expect(gap, `${id} gap before beat ${i}`).toBeGreaterThanOrEqual(2 - 2 * DT);
        expect(gap, `${id} gap before beat ${i}`).toBeLessThanOrEqual(4 + 2 * DT);
        const k = rig.pattern.indexOf(beats[i - 1]!.beat);
        expect(rig.pattern.some((b, j) => b === beats[i - 1]!.beat && rig.pattern[(j + 1) % rig.pattern.length] === beats[i]!.beat), `${id} pattern order at ${i} (${k})`).toBe(true);
      }
      for (const beat of ['look', 'yawn', 'actA', 'actB'] as const) {
        expect(beats.some((b) => b.beat === beat), `${id} shows ${beat}`).toBe(true);
      }
      expect(blinks, `${id} blinks`).toBeGreaterThan(beats.length);
      expect(BLINK_SLOT).toBeLessThan(BEAT_SLOT);
    }
  });

  it('two people never move in step', () => {
    const a = figureSeed('astronomer');
    const k = figureSeed('krix');
    expect(a).not.toBe(k);
    const first = (seed: number) => watch(seed, 30).beats.map((b) => b.at);
    const [ta, tk] = [first(a), first(k)];
    expect(ta.some((t, i) => Math.abs(t - (tk[i] ?? 0)) > 0.2)).toBe(true);
    expect(beatStart(3, a)).not.toBe(beatStart(3, k));
  });

  it('keeps every channel in range and comes back to rest between beats', () => {
    const pose = newFigurePose();
    let rested = 0;
    for (let t = 0; t < 90; t += DT) {
      figurePose(t, figureSeed('krix'), false, pose, PERSON_RIGS.krix!.pattern);
      for (const v of [pose.lid, pose.yawn, pose.actA, pose.actB]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(Math.abs(pose.lookX)).toBeLessThanOrEqual(1);
      expect(Math.abs(pose.wobble)).toBeLessThanOrEqual(1);
      if (!pose.beat) {
        expect([pose.lookX, pose.lookY, pose.yawn, pose.actA, pose.actB, pose.wobble]).toEqual([0, 0, 0, 0, 0, 0]);
        rested++;
      }
    }
    expect(rested).toBeGreaterThan(60 * 20);
  });

  it('reduced motion: nothing moves but a slow blink', () => {
    const pose = newFigurePose();
    let shut = 0;
    let longest = 0;
    let run = 0;
    for (let t = 0; t < 60; t += DT) {
      figurePose(t, figureSeed('astronomer'), true, pose, PERSON_RIGS.astronomer!.pattern);
      expect(pose.beat).toBeNull();
      expect([pose.lookX, pose.lookY, pose.yawn, pose.actA, pose.actB, pose.wobble]).toEqual([0, 0, 0, 0, 0, 0]);
      run = pose.lid > 0 ? run + 1 : 0;
      longest = Math.max(longest, run);
      if (pose.lid > 0.5) shut++;
    }
    expect(shut).toBeGreaterThan(0);
    // slower than a normal blink (0.17 s) and rare
    expect(longest * DT).toBeGreaterThan(0.4);
    expect(shut * DT).toBeLessThan(6);
  });
});

describe('PickupFigure', () => {
  const none = { get: () => undefined };

  it('falls back to the primitive sketch at the art footprint when the art is missing, at any scale', () => {
    for (const id of IDS) {
      const [w, h] = PICKUP_SIZE[id];
      const sketch = pickupFallback(id);
      const b = sketch.getLocalBounds();
      // the sketch fills most of the footprint and never spills far outside it (tilt and shadow aside)
      expect(Math.max(b.width * sketch.scale.x / w, b.height * sketch.scale.y / h), `${id} sketch fills the footprint`).toBeGreaterThan(0.8);
      expect(b.width * sketch.scale.x, `${id} sketch width`).toBeLessThanOrEqual(w * 1.15);
      expect(b.height * sketch.scale.y, `${id} sketch height`).toBeLessThanOrEqual(h * 1.15);
      for (const scale of [1, 2.5]) {
        const figure = new PickupFigure(none, id, scale);
        expect([figure.w, figure.h]).toEqual([w * scale, h * scale]);
        expect(figure.alive).toBe(false);
        expect(figure.root.children.length).toBeGreaterThan(0);
        figure.sync(3.2, false); // a sketch stands still: nothing to move, nothing thrown
        figure.root.destroy({ children: true });
      }
    }
  });
});
