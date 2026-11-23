// Town life on the deep maps: things that move at night and never matter to the rules.
//
// Honest-tell rule: a detector always has a hard edge (a ring or a cone outline). Nothing in here
// draws an edged pool of light on the ground, so decor can never be read as something that sees
// you. Everything is laid out once from the map (typed arrays, no per-frame allocation) and
// culled to the view when drawn.
import { VIEW_H, VIEW_W } from '../contracts';
import { GLOW, drawGlow } from '../core/fx';
import type { DeepMap, PropDef } from '../levels/types';
import { outlinedText } from '../ui/draw';
import { C } from '../ui/theme';
import { ROAD_W } from './draw-common';
import { propSize } from './props';

const TAU = Math.PI * 2;
const INK = '#1b1433';
const CAT_COATS = ['#e09a62', '#a9adc4', '#f0e9dc', '#c9a27a'] as const;
const CAT_SPEED = 40;
/** A cat stops and stares when the saucer is this close. */
const CAT_NOTICE = 170;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function inView(x: number, y: number, m: number, camX: number, camY: number): boolean {
  return x > camX - m && x < camX + VIEW_W + m && y > camY - m && y < camY + VIEW_H + m;
}

export class Ambient {
  /** Fireflies (suburb) / drifting dust motes (city): x, y, phase. */
  private readonly flies: Float32Array;
  /** Moths: lamp x, lamp y, phase. Three per lamp. */
  private readonly moths: Float32Array;
  /** TV glow in a bedroom window: x, y, phase, and the dawn level (0..1) at which the light goes on. */
  private readonly tvs: Float32Array;
  /** Rooftop aircraft beacons: x, y, phase. */
  private readonly beacons: Float32Array;
  /** Steam vents: x, y, phase. */
  private readonly vents: Float32Array;
  /** Chimneys with a fire still in: x, y, phase. */
  private readonly smoke: Float32Array;
  /** Pools: x, y, half-width. */
  private readonly pools: Float32Array;
  /** Cats: loop centre x, y, half-width, half-height, distance along the loop, stare (0..1), coat. */
  private readonly cats: Float32Array;
  private readonly catCount: number;
  /** A sheet of newspaper blowing along the first long road: x0, y, length. */
  private readonly paper: Float32Array;
  private readonly suburb: boolean;

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

  /** On the ground, under the night wash: pool glints and the newspaper. */
  drawGround(g: CanvasRenderingContext2D, camX: number, camY: number, t: number, rm: boolean): void {
    // pool water: two glints sliding across
    const p = this.pools;
    g.lineCap = 'round';
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i]!;
      const y = p[i + 1]!;
      if (!inView(x, y, 90, camX, camY)) continue;
      const hw = p[i + 2]!;
      g.strokeStyle = 'rgba(220,255,250,0.5)';
      g.lineWidth = 2.5;
      g.beginPath();
      for (let k = 0; k < 2; k++) {
        const ph = rm ? k * 0.5 : (t * 0.22 + k * 0.5 + i) % 1;
        const gx = x - hw + ph * hw * 2;
        const gy = y - 14 + k * 26;
        const len = 9 * Math.sin(Math.PI * ph);
        g.moveTo(gx - len, gy);
        g.quadraticCurveTo(gx, gy - 3, gx + len, gy);
      }
      g.stroke();
    }
    g.lineCap = 'butt';

    // yesterday's paper, tumbling down the main road
    const len = this.paper[2]!;
    if (len > 0 && !rm) {
      const k = (t * 34) % (len + 200);
      const x = this.paper[0]! + k - 100;
      const y = this.paper[1]! + Math.sin(t * 1.3) * 14;
      if (inView(x, y, 30, camX, camY)) {
        g.save();
        g.translate(x, y);
        g.rotate(t * 2.2);
        g.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * 3.1)));
        g.fillStyle = '#d8d2c4';
        g.fillRect(-9, -7, 18, 14);
        g.strokeStyle = INK;
        g.lineWidth = 1.6;
        g.strokeRect(-9, -7, 18, 14);
        g.fillStyle = '#8f8aa0';
        g.fillRect(-6, -4, 12, 1.6);
        g.fillRect(-6, -1, 9, 1.6);
        g.fillRect(-6, 2, 11, 1.6);
        g.restore();
      }
    }

  }

  /** The cats, drawn over the night wash so they read; and the smoke off the chimneys. */
  drawCritters(g: CanvasRenderingContext2D, camX: number, camY: number, t: number, rm: boolean, sx: number, sy: number): void {
    const c = this.cats;
    for (let i = 0; i < this.catCount; i++) {
      const o = i * 7;
      catPos(c[o]!, c[o + 1]!, c[o + 2]!, c[o + 3]!, c[o + 4]!, POS);
      if (!inView(POS.x, POS.y, 60, camX, camY)) continue;
      drawCat(g, POS.x, POS.y, POS.a, t + i * 1.7, c[o + 5]!, CAT_COATS[c[o + 6]!]!, Math.atan2(sy - POS.y, sx - POS.x), rm);
    }
    const s = this.smoke;
    g.fillStyle = '#b9b4cf';
    for (let i = 0; i < s.length; i += 3) {
      const x = s[i]!;
      const y = s[i + 1]!;
      if (!inView(x, y, 90, camX, camY)) continue;
      for (let k = 0; k < 4; k++) {
        const ph = rm ? 0.2 + k * 0.2 : (t * 0.22 + s[i + 2]! + k / 4) % 1;
        g.globalAlpha = 0.3 * Math.sin(Math.PI * ph);
        g.beginPath();
        g.arc(x + ph * 46 + Math.sin(ph * 6 + k) * 6, y - ph * 58, 6 + ph * 15, 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  /**
   * Small lights, drawn additively over the night wash. `dawn` (0..1) switches bedroom lights on
   * house by house: the humans are waking up.
   */
  drawLights(g: CanvasRenderingContext2D, camX: number, camY: number, t: number, rm: boolean, dawn: number): void {
    const tv = this.tvs;
    for (let i = 0; i < tv.length; i += 4) {
      const x = tv[i]!;
      const y = tv[i + 1]!;
      if (!inView(x, y, 40, camX, camY)) continue;
      if (dawn > tv[i + 3]!) {
        // lights on: somebody is up
        drawGlow(g, GLOW.lamp, x, y, 44, 30, 0.9);
        continue;
      }
      const ph = tv[i + 2]!;
      if (ph < 0) continue;
      const k = rm ? 0.5 : 0.35 + 0.65 * Math.abs(Math.sin(t * 7.3 + ph) * Math.sin(t * 2.9 + ph * 2));
      drawGlow(g, '120,190,255', x, y, 38, 26, 0.9 * k);
    }

    const b = this.beacons;
    for (let i = 0; i < b.length; i += 3) {
      const x = b[i]!;
      const y = b[i + 1]!;
      if (!inView(x, y, 30, camX, camY)) continue;
      const on = rm || (t + b[i + 2]!) % 1.6 < 0.28;
      drawGlow(g, GLOW.red, x, y, on ? 20 : 8, on ? 20 : 8, on ? 0.95 : 0.5);
    }

    // moths and city dust are a few pixels each: plain squares, lit additively; a firefly gets a soft dot
    const m = this.moths;
    g.fillStyle = '#fff4d6';
    for (let i = 0; i < m.length; i += 3) {
      const x = m[i]!;
      const y = m[i + 1]!;
      if (!inView(x, y, 60, camX, camY)) continue;
      const ph = m[i + 2]!;
      const a = rm ? ph : t * (1.6 + (i % 5) * 0.23) + ph;
      const r = 22 + 14 * Math.sin(a * 0.7 + ph);
      const flap = rm ? 1 : 0.5 + 0.5 * Math.sin(t * 40 + ph);
      g.fillRect(x + Math.cos(a) * r - 2 - flap * 2, y + Math.sin(a * 1.3) * r * 0.8 - 1.5, 4 + flap * 4, 3);
    }

    const f = this.flies;
    const night = 1 - dawn;
    g.fillStyle = this.suburb ? '#c8ff8c' : '#bec8ff';
    for (let i = 0; i < f.length; i += 3) {
      const ph = f[i + 2]!;
      const x = f[i]! + (rm ? 0 : Math.sin(t * 0.31 + ph) * 46);
      const y = f[i + 1]! + (rm ? 0 : Math.cos(t * 0.23 + ph * 1.7) * 38);
      if (!inView(x, y, 12, camX, camY)) continue;
      const blink = rm ? 0.6 : Math.max(0, Math.sin(t * 1.4 + ph * 3));
      if (blink < 0.08) continue;
      if (this.suburb) {
        g.globalAlpha = 1;
        drawGlow(g, '200,255,140', x, y, 9, 9, blink * night);
      } else {
        g.globalAlpha = 0.35 * blink;
        g.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
    g.globalAlpha = 1;
  }

  /** Over everything on the ground: steam drifting up off the grates. */
  drawSteam(g: CanvasRenderingContext2D, camX: number, camY: number, t: number, rm: boolean): void {
    const v = this.vents;
    if (v.length === 0) return;
    g.fillStyle = '#c9cfe6';
    for (let i = 0; i < v.length; i += 3) {
      const x = v[i]!;
      const y = v[i + 1]!;
      if (!inView(x, y, 70, camX, camY)) continue;
      // the grate
      g.globalAlpha = 0.5;
      g.fillStyle = '#12101f';
      g.fillRect(x - 11, y - 7, 22, 14);
      g.fillStyle = '#c9cfe6';
      for (let k = 0; k < 3; k++) {
        const ph = rm ? 0.3 + k * 0.2 : (t * 0.33 + v[i + 2]! + k / 3) % 1;
        g.globalAlpha = 0.2 * Math.sin(Math.PI * ph);
        g.beginPath();
        g.arc(x + Math.sin(ph * 5 + k) * 9 + ph * 16, y - ph * 46, 7 + ph * 17, 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
}

const POS = { x: 0, y: 0, a: 0 };

/** Position and heading at distance `d` along a rectangle (clockwise from the top-left corner). */
function catPos(cx: number, cy: number, hw: number, hh: number, d: number, out: { x: number; y: number; a: number }): void {
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

/** A cat from above, nose along +x. `stare` 0..1: stopped, head turned to `look`, a "?" over it. */
function drawCat(g: CanvasRenderingContext2D, x: number, y: number, heading: number, t: number, stare: number, coat: string, look: number, rm: boolean): void {
  const walk = rm ? 0 : Math.sin(t * 9) * (1 - stare);
  g.save();
  g.translate(x, y);
  g.rotate(heading);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // tail
  g.lineWidth = 6.5;
  g.strokeStyle = INK;
  const sw = rm ? 0.3 : Math.sin(t * (2.4 + stare * 6)) * (0.5 + stare * 0.5);
  g.beginPath();
  g.moveTo(-12, 0);
  g.quadraticCurveTo(-22, sw * 10, -27, sw * 15);
  g.stroke();
  g.lineWidth = 3.5;
  g.strokeStyle = coat;
  g.stroke();
  // paws
  g.fillStyle = INK;
  for (let k = 0; k < 4; k++) {
    const fx = k < 2 ? 8 : -8;
    const side = k % 2 === 0 ? 1 : -1;
    g.beginPath();
    g.arc(fx + walk * side * 3.5, side * 7.5, 3.2, 0, TAU);
    g.fill();
  }
  // body
  g.beginPath();
  g.ellipse(-1, 0, 14, 8, 0, 0, TAU);
  g.fillStyle = coat;
  g.fill();
  g.lineWidth = 2.6;
  g.strokeStyle = INK;
  g.stroke();
  // head: turns to the saucer when staring
  let d = look - heading;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  g.translate(13, 0);
  g.rotate(Math.max(-1.3, Math.min(1.3, d)) * stare);
  g.beginPath();
  g.moveTo(-3, -8);
  g.lineTo(3, -10);
  g.lineTo(4, -4);
  g.moveTo(-3, 8);
  g.lineTo(3, 10);
  g.lineTo(4, 4);
  g.fillStyle = coat;
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(1, 0, 7, 0, TAU);
  g.fill();
  g.stroke();
  if (stare > 0.4) {
    g.fillStyle = '#eaffd0';
    g.beginPath();
    g.arc(4.5, -3, 2.2, 0, TAU);
    g.arc(4.5, 3, 2.2, 0, TAU);
    g.fill();
  }
  g.restore();
  if (stare > 0.6) {
    g.globalAlpha = (stare - 0.6) / 0.4;
    outlinedText(g, '?', x + 4, y - 26 - (rm ? 0 : Math.sin(t * 5) * 2), 20, C.text, C.ink, 900);
    g.globalAlpha = 1;
  }
}
