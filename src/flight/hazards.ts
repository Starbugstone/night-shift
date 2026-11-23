// Deep-level flight hazards: data definitions and a DOM-free runtime.
//
// Every hazard except porch lights is a pure function of the hazard clock `t`, so the same
// field can be sampled at future times (the autopilot looks ahead this way) and the drawn shape
// is always the hit shape: render code reads the positions/angles sampled here.
import type { Vec2 } from '../contracts';
import { circleSegment, pointInCircle, pointInCone, wrapAngle, type SegHit } from './geometry';
import { POWER_LINE, SAUCER, barkRadius, neonOn, neonScramble, type Saucer } from './sim';

export type CarKey = 'flight/police_top' | 'flight/sedan_top' | 'flight/taxi_top' | 'flight/pickup_top' | 'flight/van_top';

/** A car on a route: police cruiser (light bar), patrol car or plain car. */
export interface CarHazard {
  type: 'car';
  key: CarKey;
  role: 'police' | 'patrol';
  path: Vec2[];
  /** Closed loop (last point joins the first) or back-and-forth. */
  loop: boolean;
  speed: number;
  /** Ping-pong only: seconds turning round at each end (the headlights sweep). */
  dwell: number;
  /** Start offset along the route, px. */
  phase: number;
  coneRange: number;
  coneHalf: number;
  sweepAmp: number;
  sweepRate: number;
  /** Rotating light-bar detection radius around the car; 0 = none. */
  barR: number;
}

/** A stream of cars along a road lane, evenly spaced, each with headlights. */
export interface TrafficHazard {
  type: 'traffic';
  dir: 'h' | 'v';
  /** Lane centre line (y for 'h', x for 'v'). */
  at: number;
  from: number;
  to: number;
  /** +1 = towards `to`. */
  sign: 1 | -1;
  speed: number;
  gap: number;
  offset: number;
  coneRange: number;
  coneHalf: number;
  keys: readonly CarKey[];
}

/** Motion-sensor porch light: arms after PORCH.arm s inside `trigger`, then lights radius `r` for PORCH.lit s. */
export interface PorchHazard {
  type: 'porch';
  x: number;
  y: number;
  trigger: number;
  r: number;
}

/** Insomniac at a window (Mrs. Pruitt): a narrow binocular cone that sweeps and snaps between angles. */
export interface WatcherHazard {
  type: 'watcher';
  name: string;
  x: number;
  y: number;
  range: number;
  half: number;
  /** Base angles visited in turn, radians. */
  angles: readonly number[];
  /** Seconds at each base angle before snapping to the next. */
  hold: number;
  sweepAmp: number;
  sweepRate: number;
}

export interface DogHazard {
  type: 'dog';
  x: number;
  y: number;
  rMin: number;
  rMax: number;
  period: number;
  phase: number;
}

/** Bats or pigeons flying a closed loop. Solid: they bump the saucer. */
export interface FlockHazard {
  type: 'flock';
  kind: 'bat' | 'pigeon';
  path: Vec2[];
  speed: number;
  r: number;
  phase: number;
}

/** Power line or tram wire: a solid segment. */
export interface WireHazard {
  type: 'wire';
  kind: 'power' | 'tram';
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

/** Police helicopter on an elliptical loop; its searchlight spot circles around it. */
export interface HeliHazard {
  type: 'heli';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Seconds per lap. Negative = anticlockwise. */
  period: number;
  phase: number;
  spotR: number;
  spotDist: number;
  /** Searchlight sweep, rad/s. */
  spotRate: number;
}

/** Rooftop security camera: a sweeping cone. */
export interface CameraHazard {
  type: 'camera';
  x: number;
  y: number;
  range: number;
  half: number;
  base: number;
  amp: number;
  rate: number;
  phase: number;
}

/** Neon sign / billboard: inside the glow, steering is scrambled while it is lit. */
export interface NeonHazard {
  type: 'neon';
  x: number;
  y: number;
  r: number;
  text: string;
  billboard: boolean;
}

/** Construction crane: the boom rotates about the tower and is solid. */
export interface CraneHazard {
  type: 'crane';
  x: number;
  y: number;
  len: number;
  /** rad/s */
  rate: number;
  a0: number;
  /** Boom thickness (drawn and hit). */
  width: number;
}

/** Insomniac office window: lights a pool in front of it on a cycle, flickering first. */
export interface WindowHazard {
  type: 'window';
  /** Window position (on the roof edge) and light pool centre. */
  wx: number;
  wy: number;
  x: number;
  y: number;
  r: number;
  period: number;
  /** Seconds lit per period. */
  on: number;
  phase: number;
}

/** Jokes, no gameplay: a lawn sprinkler, or Gary's own tripwire across his drive. */
export interface GagHazard {
  type: 'gag';
  kind: 'sprinkler' | 'tripwire';
  x: number;
  y: number;
  bx: number;
  by: number;
}

export type HazardDef =
  | CarHazard
  | TrafficHazard
  | PorchHazard
  | WatcherHazard
  | DogHazard
  | FlockHazard
  | WireHazard
  | HeliHazard
  | CameraHazard
  | NeonHazard
  | CraneHazard
  | WindowHazard
  | GagHazard;

export type HazardType = HazardDef['type'];

export const PORCH = {
  /** Seconds in range before the light clicks on. */
  arm: 0.4,
  /** Seconds it stays lit. */
  lit: 3,
};

/** Watcher tell: the binoculars glint this long before snapping to the next angle. */
export const WATCHER_TELL = 0.45;
/** Office windows flicker this long before they light up. */
export const WINDOW_TELL = 0.6;
/** Flocks and crane bumps stun for this long. */
export const BUMP_STUN = 0.35;

// ------------------------------------------------------------------ paths

/** A polyline with cumulative lengths, for O(segments) lookups without allocation. */
export class Route {
  readonly cum: Float64Array;
  readonly total: number;
  readonly n: number;

  constructor(
    readonly pts: readonly Vec2[],
    readonly loop: boolean,
  ) {
    const segs = loop ? pts.length : pts.length - 1;
    this.n = segs;
    this.cum = new Float64Array(segs + 1);
    for (let i = 0; i < segs; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      this.cum[i + 1] = this.cum[i]! + Math.hypot(b.x - a.x, b.y - a.y);
    }
    this.total = this.cum[segs]!;
  }

  private seg(s: number): number {
    let i = 0;
    while (i < this.n - 1 && s > this.cum[i + 1]!) i++;
    return i;
  }

  segHeading(i: number): number {
    const a = this.pts[i]!;
    const b = this.pts[(i + 1) % this.pts.length]!;
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  /** Position at arc length s (clamped / wrapped) into out; returns the segment heading, blended over `blend` px at corners. */
  at(s: number, out: { x: number; y: number }, blend = 0): number {
    if (this.total <= 0) {
      out.x = this.pts[0]?.x ?? 0;
      out.y = this.pts[0]?.y ?? 0;
      return -Math.PI / 2;
    }
    if (this.loop) s = ((s % this.total) + this.total) % this.total;
    else s = s < 0 ? 0 : s > this.total ? this.total : s;
    const i = this.seg(s);
    const l = this.cum[i + 1]! - this.cum[i]!;
    const k = l > 0 ? (s - this.cum[i]!) / l : 0;
    const a = this.pts[i]!;
    const b = this.pts[(i + 1) % this.pts.length]!;
    out.x = a.x + (b.x - a.x) * k;
    out.y = a.y + (b.y - a.y) * k;
    let h = this.segHeading(i);
    if (blend > 0) {
      const toEnd = this.cum[i + 1]! - s;
      const fromStart = s - this.cum[i]!;
      if (toEnd < blend && (this.loop || i < this.n - 1)) {
        const hn = this.segHeading((i + 1) % this.n);
        h = wrapAngle(h + wrapAngle(hn - h) * (0.5 - toEnd / (2 * blend)));
      } else if (fromStart < blend && (this.loop || i > 0)) {
        const hp = this.segHeading((i - 1 + this.n) % this.n);
        h = wrapAngle(hp + wrapAngle(h - hp) * (0.5 + fromStart / (2 * blend)));
      }
    }
    return h;
  }
}

// ------------------------------------------------------------------ runtime

/** Reasons the saucer can be detected (for Zib's lines and the spotted caption). */
export type SpotCause = 'police' | 'patrol' | 'traffic' | 'porch' | 'watcher' | 'dog' | 'heli' | 'camera' | 'window';

/** Things that bump the saucer. */
export type BumpCause = 'wire' | 'tram' | 'bat' | 'pigeon' | 'crane';

const CAR_LEN = 150;
const CORNER_BLEND = 60;

export interface CarRT {
  x: number;
  y: number;
  heading: number;
  ox: number;
  oy: number;
  cone: number;
  /** Visible on its lane (traffic only). */
  live: boolean;
  key: CarKey;
}

function newCar(key: CarKey): CarRT {
  return { x: 0, y: 0, heading: 0, ox: 0, oy: 0, cone: 0, live: true, key };
}

/**
 * Runtime for one map's hazards. `sample(t)` positions everything for hazard time t; queries
 * then read those positions. Porch-light state lives outside (in the flight state) so it can be
 * copied for look-ahead.
 */
export class HazardField {
  readonly defs: readonly HazardDef[];
  /** Per-hazard sampled pose: x, y, angle (meaning depends on type). */
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly a: Float64Array;
  /** Second point (helicopter spot, crane tip, watcher next angle in `b`). */
  readonly x2: Float64Array;
  readonly y2: Float64Array;
  readonly b: Float64Array;
  /** Per-hazard flag: detector currently live (lit window, neon on, traffic visible...). */
  readonly on: Uint8Array;
  /** Per-hazard: tell phase active (watcher about to snap, window about to light). */
  readonly tell: Uint8Array;
  /** Cars for 'car' (one) and 'traffic' (several) hazards, indexed by hazard. */
  readonly cars: CarRT[][];
  readonly routes: (Route | null)[];
  /** Number of porch lights; porch hazard i -> porch slot porchSlot[i]. */
  readonly porchCount: number;
  readonly porchSlot: Int16Array;
  t = 0;
  private readonly tmp = { x: 0, y: 0 };
  private readonly hit: SegHit = { nx: 0, ny: 0, depth: 0 };

  constructor(defs: readonly HazardDef[]) {
    this.defs = defs;
    const n = defs.length;
    this.x = new Float64Array(n);
    this.y = new Float64Array(n);
    this.a = new Float64Array(n);
    this.x2 = new Float64Array(n);
    this.y2 = new Float64Array(n);
    this.b = new Float64Array(n);
    this.on = new Uint8Array(n);
    this.tell = new Uint8Array(n);
    this.cars = [];
    this.routes = [];
    this.porchSlot = new Int16Array(n).fill(-1);
    let porch = 0;
    for (let i = 0; i < n; i++) {
      const d = defs[i]!;
      let cars: CarRT[] = [];
      let route: Route | null = null;
      if (d.type === 'car') {
        cars = [newCar(d.key)];
        route = new Route(d.path, d.loop);
      } else if (d.type === 'traffic') {
        const len = Math.abs(d.to - d.from) + CAR_LEN * 2;
        const count = Math.max(1, Math.ceil(len / d.gap));
        for (let k = 0; k < count; k++) cars.push(newCar(d.keys[k % d.keys.length]!));
      } else if (d.type === 'flock') {
        route = new Route(d.path, true);
      } else if (d.type === 'porch') {
        this.porchSlot[i] = porch++;
      }
      this.cars.push(cars);
      this.routes.push(route);
    }
    this.porchCount = porch;
    this.sample(0);
  }

  /** Position every hazard for time t. Allocation-free. */
  sample(t: number): void {
    this.t = t;
    const defs = this.defs;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i]!;
      this.on[i] = 1;
      this.tell[i] = 0;
      switch (d.type) {
        case 'car': {
          const car = this.cars[i]![0]!;
          const r = this.routes[i]!;
          let h: number;
          if (d.loop) {
            h = r.at(d.phase + d.speed * t, this.tmp, CORNER_BLEND);
          } else {
            // ping-pong with a dwell (turning round) at each end
            const run = r.total / d.speed;
            const period = 2 * (run + d.dwell);
            let tau = (((d.phase / d.speed + t) % period) + period) % period;
            if (tau < run) h = r.at(tau * d.speed, this.tmp, CORNER_BLEND);
            else if ((tau -= run) < d.dwell) {
              const h0 = r.at(r.total, this.tmp);
              h = wrapAngle(h0 + Math.PI * (tau / d.dwell));
            } else if ((tau -= d.dwell) < run) {
              h = wrapAngle(r.at(r.total - tau * d.speed, this.tmp, CORNER_BLEND) + Math.PI);
            } else {
              tau -= run;
              const h0 = wrapAngle(r.at(0, this.tmp) + Math.PI);
              h = wrapAngle(h0 + Math.PI * (tau / d.dwell));
            }
          }
          car.x = this.tmp.x;
          car.y = this.tmp.y;
          car.heading = h;
          car.ox = car.x + Math.cos(h) * CAR_LEN * 0.45;
          car.oy = car.y + Math.sin(h) * CAR_LEN * 0.45;
          car.cone = h + d.sweepAmp * Math.sin(t * d.sweepRate + d.phase * 0.01);
          this.x[i] = car.x;
          this.y[i] = car.y;
          this.a[i] = t * 9; // light-bar spin (decor)
          break;
        }
        case 'traffic': {
          const cars = this.cars[i]!;
          const span = cars.length * d.gap;
          const lo = Math.min(d.from, d.to);
          const hi = Math.max(d.from, d.to);
          const h = d.dir === 'h' ? (d.sign > 0 ? 0 : Math.PI) : d.sign > 0 ? Math.PI / 2 : -Math.PI / 2;
          for (let k = 0; k < cars.length; k++) {
            const car = cars[k]!;
            const s = ((((d.offset + k * d.gap + d.speed * t) % span) + span) % span) - CAR_LEN;
            const along = d.sign > 0 ? lo + s : hi - s;
            car.live = along > lo - CAR_LEN && along < hi + CAR_LEN;
            if (d.dir === 'h') {
              car.x = along;
              car.y = d.at;
            } else {
              car.x = d.at;
              car.y = along;
            }
            car.heading = h;
            car.cone = h;
            car.ox = car.x + Math.cos(h) * CAR_LEN * 0.45;
            car.oy = car.y + Math.sin(h) * CAR_LEN * 0.45;
          }
          break;
        }
        case 'watcher': {
          const n = d.angles.length;
          const k = Math.floor(t / d.hold);
          const base = d.angles[((k % n) + n) % n]!;
          const next = d.angles[(((k + 1) % n) + n) % n]!;
          this.x[i] = d.x;
          this.y[i] = d.y;
          this.a[i] = base + d.sweepAmp * Math.sin(t * d.sweepRate);
          this.b[i] = next + d.sweepAmp * Math.sin(t * d.sweepRate);
          this.tell[i] = t - k * d.hold > d.hold - WATCHER_TELL ? 1 : 0;
          break;
        }
        case 'dog':
          this.x[i] = d.x;
          this.y[i] = d.y;
          this.a[i] = barkRadius(t + d.phase, d.rMin, d.rMax, d.period);
          break;
        case 'flock': {
          const r = this.routes[i]!;
          this.a[i] = r.at(d.phase + d.speed * t, this.tmp);
          this.x[i] = this.tmp.x;
          this.y[i] = this.tmp.y;
          break;
        }
        case 'heli': {
          const th = (Math.PI * 2 * t) / d.period + d.phase;
          const hx = d.cx + d.rx * Math.cos(th);
          const hy = d.cy + d.ry * Math.sin(th);
          this.x[i] = hx;
          this.y[i] = hy;
          // heading = direction of travel
          const sg = d.period > 0 ? 1 : -1;
          this.a[i] = Math.atan2(d.ry * Math.cos(th) * sg, -d.rx * Math.sin(th) * sg);
          const sa = d.spotRate * t + d.phase;
          this.x2[i] = hx + Math.cos(sa) * d.spotDist;
          this.y2[i] = hy + Math.sin(sa) * d.spotDist;
          break;
        }
        case 'camera':
          this.x[i] = d.x;
          this.y[i] = d.y;
          this.a[i] = d.base + d.amp * Math.sin(t * d.rate + d.phase);
          break;
        case 'neon':
          this.x[i] = d.x;
          this.y[i] = d.y;
          this.on[i] = neonOn(t + d.x * 0.001) ? 1 : 0;
          this.a[i] = neonScramble(t);
          break;
        case 'crane': {
          const ang = d.a0 + d.rate * t;
          this.x[i] = d.x;
          this.y[i] = d.y;
          this.a[i] = ang;
          this.x2[i] = d.x + Math.cos(ang) * d.len;
          this.y2[i] = d.y + Math.sin(ang) * d.len;
          break;
        }
        case 'window': {
          const tau = (((t + d.phase) % d.period) + d.period) % d.period;
          const litFrom = d.period - d.on;
          this.on[i] = tau >= litFrom ? 1 : 0;
          this.tell[i] = tau >= litFrom - WINDOW_TELL && tau < litFrom ? 1 : 0;
          this.x[i] = d.x;
          this.y[i] = d.y;
          break;
        }
        case 'porch':
        case 'wire':
        case 'gag':
          this.x[i] = d.type === 'wire' ? d.ax : d.x;
          this.y[i] = d.type === 'wire' ? d.ay : d.y;
          break;
      }
    }
  }

  /**
   * Index of the first hazard whose detector covers (x,y) right now, or -1.
   * `porchLit[slot] > 0` = that porch light is on.
   */
  detect(x: number, y: number, porchLit: Float64Array): number {
    const defs = this.defs;
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i]!;
      switch (d.type) {
        case 'car': {
          const c = this.cars[i]![0]!;
          if (d.barR > 0 && pointInCircle(x, y, c.x, c.y, d.barR)) return i;
          if (pointInCone(x, y, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange)) return i;
          break;
        }
        case 'traffic': {
          // quick reject: far from the lane
          const across = d.dir === 'h' ? Math.abs(y - d.at) : Math.abs(x - d.at);
          if (across > d.coneRange) break;
          const cars = this.cars[i]!;
          for (let k = 0; k < cars.length; k++) {
            const c = cars[k]!;
            if (c.live && pointInCone(x, y, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange)) return i;
          }
          break;
        }
        case 'porch':
          if (porchLit[this.porchSlot[i]!]! > 0 && pointInCircle(x, y, d.x, d.y, d.r)) return i;
          break;
        case 'watcher':
          if (pointInCone(x, y, d.x, d.y, this.a[i]!, d.half, d.range)) return i;
          break;
        case 'dog':
          if (pointInCircle(x, y, d.x, d.y, this.a[i]!)) return i;
          break;
        case 'heli':
          if (pointInCircle(x, y, this.x2[i]!, this.y2[i]!, d.spotR)) return i;
          break;
        case 'camera':
          if (pointInCone(x, y, d.x, d.y, this.a[i]!, d.half, d.range)) return i;
          break;
        case 'window':
          if (this.on[i] && pointInCircle(x, y, d.x, d.y, d.r)) return i;
          break;
        default:
          break;
      }
    }
    return -1;
  }

  /** Total steering scramble from lit neon zones at (x,y), radians. */
  scramble(x: number, y: number): number {
    let rot = 0;
    for (let i = 0; i < this.defs.length; i++) {
      const d = this.defs[i]!;
      if (d.type === 'neon' && this.on[i] && pointInCircle(x, y, d.x, d.y, d.r)) rot += this.a[i]!;
    }
    return rot;
  }

  /** Advance porch lights for a saucer at (x,y). */
  stepPorches(x: number, y: number, dt: number, arm: Float64Array, lit: Float64Array): number {
    let clicked = -1;
    for (let i = 0; i < this.defs.length; i++) {
      const d = this.defs[i]!;
      if (d.type !== 'porch') continue;
      const s = this.porchSlot[i]!;
      if (lit[s]! > 0) lit[s] = Math.max(0, lit[s]! - dt);
      if (pointInCircle(x, y, d.x, d.y, d.trigger)) {
        arm[s] = arm[s]! + dt;
        if (arm[s]! >= PORCH.arm) {
          if (lit[s]! <= 0) clicked = i;
          lit[s] = PORCH.lit;
        }
      } else arm[s] = 0;
    }
    return clicked;
  }

  /**
   * Push the saucer out of solid hazards (wires, crane boom, flocks). Returns the index of the
   * first hazard touched, or -1. Writes the push normal into `out`.
   */
  collide(s: Saucer, out: SegHit): number {
    const R = SAUCER.radius;
    const hit = this.hit;
    let first = -1;
    for (let i = 0; i < this.defs.length; i++) {
      const d = this.defs[i]!;
      let touched = false;
      if (d.type === 'wire') {
        touched = circleSegment(s.x, s.y, R * POWER_LINE.hitFrac, d.ax, d.ay, d.bx, d.by, hit);
      } else if (d.type === 'crane') {
        touched = circleSegment(s.x, s.y, R * POWER_LINE.hitFrac + d.width / 2, d.x, d.y, this.x2[i]!, this.y2[i]!, hit);
      } else if (d.type === 'flock') {
        const dx = s.x - this.x[i]!;
        const dy = s.y - this.y[i]!;
        const rr = d.r + R * 0.7;
        const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) {
          const dd = Math.sqrt(d2) || 1;
          hit.nx = dx / dd;
          hit.ny = dy / dd;
          hit.depth = rr - dd;
          touched = true;
        }
      }
      if (!touched) continue;
      s.x += hit.nx * hit.depth;
      s.y += hit.ny * hit.depth;
      const vn = s.vx * hit.nx + s.vy * hit.ny;
      if (vn < 0) {
        s.vx -= 1.7 * vn * hit.nx;
        s.vy -= 1.7 * vn * hit.ny;
      }
      if (d.type !== 'wire') {
        // moving things shove you
        s.vx += hit.nx * 160;
        s.vy += hit.ny * 160;
      }
      if (first < 0) {
        first = i;
        out.nx = hit.nx;
        out.ny = hit.ny;
        out.depth = hit.depth;
      }
    }
    return first;
  }

  /** What kind of thing hazard i is, for detection captions. */
  spotCause(i: number): SpotCause {
    const d = this.defs[i]!;
    switch (d.type) {
      case 'car':
        return d.role;
      case 'traffic':
        return 'traffic';
      case 'porch':
        return 'porch';
      case 'watcher':
        return 'watcher';
      case 'dog':
        return 'dog';
      case 'heli':
        return 'heli';
      case 'camera':
        return 'camera';
      default:
        return 'window';
    }
  }

  bumpCause(i: number): BumpCause {
    const d = this.defs[i]!;
    if (d.type === 'wire') return d.kind === 'tram' ? 'tram' : 'wire';
    if (d.type === 'flock') return d.kind;
    return 'crane';
  }

  /** Rough bounding radius of hazard i around its sampled position, for culling. */
  reach(i: number): number {
    const d = this.defs[i]!;
    switch (d.type) {
      case 'car':
        return Math.max(d.coneRange + CAR_LEN, d.barR);
      case 'watcher':
      case 'camera':
        return d.range;
      case 'dog':
        return d.rMax;
      case 'heli':
        return d.spotDist + d.spotR + 120;
      case 'crane':
        return d.len + 60;
      case 'window':
        return d.r + Math.hypot(d.wx - d.x, d.wy - d.y);
      case 'porch':
        return Math.max(d.r, d.trigger);
      case 'neon':
        return d.r;
      case 'flock':
        return d.r + 60;
      default:
        return 4000;
    }
  }
}
