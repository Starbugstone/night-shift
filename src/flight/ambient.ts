// Town life on the deep maps: things that move at night and never matter to the rules.
//
// Honest-tell rule: a detector always has a hard edge (a ring or a cone outline). Nothing in here
// draws an edged pool of light on the ground, so decor can never be read as something that sees
// you. Everything is laid out once from the map (typed arrays, no per-frame allocation) and
// culled to the view when drawn.
import type { DeepMap, PropDef } from '../levels/types';
import { ROAD_W } from './draw-common';
import { propSize } from './props';

const TAU = Math.PI * 2;
export const CAT_COATS = ['#e09a62', '#a9adc4', '#f0e9dc', '#c9a27a'] as const;
const CAT_SPEED = 40;
/** A cat stops and stares when the saucer is this close. */
const CAT_NOTICE = 170;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class Ambient {
  /** Fireflies (suburb) / drifting dust motes (city): x, y, phase. */
  readonly flies: Float32Array;
  /** Moths: lamp x, lamp y, phase. Three per lamp. */
  readonly moths: Float32Array;
  /** TV glow in a bedroom window: x, y, phase, and the dawn level (0..1) at which the light goes on. */
  readonly tvs: Float32Array;
  /** Rooftop aircraft beacons: x, y, phase. */
  readonly beacons: Float32Array;
  /** Steam vents: x, y, phase. */
  readonly vents: Float32Array;
  /** Chimneys with a fire still in: x, y, phase. */
  readonly smoke: Float32Array;
  /** Pools: x, y, half-width. */
  readonly pools: Float32Array;
  /** Cats: loop centre x, y, half-width, half-height, distance along the loop, stare (0..1), coat. */
  readonly cats: Float32Array;
  readonly catCount: number;
  /** A sheet of newspaper blowing along the first long road: x0, y, length. */
  readonly paper: Float32Array;
  readonly suburb: boolean;

  constructor(map: DeepMap) {
    this.suburb = map.theme === 'suburb';
    const targets = new Set<PropDef>(map.targets.map((t) => t.building));
    const all = [...map.props, ...targets];

    const houses = all.filter((p) => p.kind === 'suburb_house');
    const towers = all.filter((p) => p.kind === 'highrise');
    const civic = all.filter((p) => p.kind === 'civic');

    // a telly left on: a small flicker on the south wall, about one house in two
    const tvs: number[] = [];
    houses.forEach((p, i) => {
      const { w, h } = propSize(p);
      if (p.rot) return;
      const tv = hash(i * 3.1 + p.x) < 0.6;
      const x = p.x - w * 0.24 + hash(i + 9) * w * 0.48;
      const y = p.y + h * 0.5 - h * 0.09;
      tvs.push(x, y, tv ? hash(i * 7.7) * 20 : -1, 0.15 + hash(i * 1.9 + 4) * 0.8);
    });
    this.tvs = new Float32Array(tvs);

    // a few chimneys are still smoking (where the art has one: houses a and c)
    const smoke: number[] = [];
    houses.forEach((p, i) => {
      if (p.rot || hash(i * 4.7 + 3) > 0.7) return;
      const { w, h } = propSize(p);
      if (p.key.endsWith('suburb_a')) smoke.push(p.x - w / 2 + w * 0.2, p.y - h / 2 + h * 0.2, hash(i) * 3);
      else if (p.key.endsWith('suburb_c')) smoke.push(p.x - w / 2 + w * 0.87, p.y - h / 2 + h * 0.2, hash(i) * 3);
    });
    this.smoke = new Float32Array(smoke);

    const beacons: number[] = [];
    towers.forEach((p, i) => {
      const { w, h } = propSize(p);
      beacons.push(p.x + w * 0.5 - 20, p.y - h * 0.5 + 20, hash(i * 5.3) * 2);
    });
    civic.forEach((p, i) => {
      const { w, h } = propSize(p);
      beacons.push(p.x - w * 0.5 + 18, p.y - h * 0.5 + 18, hash(i * 2.3 + 1) * 2);
    });
    this.beacons = new Float32Array(beacons);

    const moths: number[] = [];
    for (let i = 0; i < map.lamps.length; i++) {
      const l = map.lamps[i]!;
      for (let k = 0; k < 3; k++) moths.push(l.x, l.y, hash(i * 3 + k) * TAU);
    }
    this.moths = new Float32Array(moths);

    const n = this.suburb ? 110 : 40;
    this.flies = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.flies[i * 3] = hash(i * 1.37 + 2) * map.w;
      this.flies[i * 3 + 1] = hash(i * 2.11 + 7) * map.h;
      this.flies[i * 3 + 2] = hash(i * 0.73) * TAU;
    }

    // steam from the pavement grates, city only: on the kerb of the horizontal streets
    const vents: number[] = [];
    if (!this.suburb) {
      map.roads.forEach((r, i) => {
        if (r.dir !== 'h') return;
        for (let k = 0; k < 3; k++) {
          const x = r.from + (r.to - r.from) * (0.14 + 0.32 * k + hash(i * 4 + k) * 0.08);
          vents.push(x, r.at + (k % 2 === 0 ? -1 : 1) * (ROAD_W / 2 + 26), hash(i + k * 3) * 4);
        }
      });
    }
    this.vents = new Float32Array(vents);

    const pools = map.groundProps.filter((p) => p.kind === 'pool');
    this.pools = new Float32Array(pools.length * 3);
    pools.forEach((p, i) => {
      const { w } = propSize(p);
      this.pools.set([p.x, p.y, w * 0.3], i * 3);
    });

    // cats patrol the outside of a few buildings (never the targets': their rings live there)
    const hosts = (this.suburb ? houses : towers).filter((p) => !targets.has(p) && !p.rot);
    const cats: number[] = [];
    const want = Math.min(this.suburb ? 4 : 3, hosts.length);
    for (let k = 0; k < want; k++) {
      const p = hosts[Math.floor(((k + 0.5) / want) * hosts.length)]!;
      const { w, h } = propSize(p);
      cats.push(p.x, p.y, w / 2 + 22, h / 2 + 22, hash(k * 9.1) * 600, 0, k % CAT_COATS.length);
    }
    this.cats = new Float32Array(cats);
    this.catCount = want;

    const road = map.roads.find((r) => r.dir === 'h' && r.to - r.from > 1200) ?? map.roads[0];
    this.paper = new Float32Array(road ? [road.from, road.at + 30, road.to - road.from] : [0, 0, 0]);
  }

  /** Cats walk their loop, and stop to stare when the saucer drifts over. */
  update(dt: number, sx: number, sy: number): void {
    const c = this.cats;
    for (let i = 0; i < this.catCount; i++) {
      const o = i * 7;
      const hw = c[o + 2]!;
      const hh = c[o + 3]!;
      const per = 4 * (hw + hh);
      catPos(c[o]!, c[o + 1]!, hw, hh, c[o + 4]!, POS);
      const near = Math.hypot(sx - POS.x, sy - POS.y) < CAT_NOTICE;
      const stare = c[o + 5]! + ((near ? 1 : 0) - c[o + 5]!) * Math.min(1, dt * 6);
      c[o + 5] = stare;
      c[o + 4] = (c[o + 4]! + CAT_SPEED * dt * (1 - stare)) % per;
    }
  }

}

const POS = { x: 0, y: 0, a: 0 };

/** Position and heading at distance `d` along a rectangle (clockwise from the top-left corner). */
export function catPos(cx: number, cy: number, hw: number, hh: number, d: number, out: { x: number; y: number; a: number }): void {
  const w = hw * 2;
  const h = hh * 2;
  if (d < w) {
    out.x = cx - hw + d;
    out.y = cy - hh;
    out.a = 0;
  } else if (d < w + h) {
    out.x = cx + hw;
    out.y = cy - hh + (d - w);
    out.a = Math.PI / 2;
  } else if (d < 2 * w + h) {
    out.x = cx + hw - (d - w - h);
    out.y = cy + hh;
    out.a = Math.PI;
  } else {
    out.x = cx - hw;
    out.y = cy + hh - (d - 2 * w - h);
    out.a = -Math.PI / 2;
  }
}
