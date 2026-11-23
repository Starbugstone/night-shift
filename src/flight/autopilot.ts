// Deep-level flight autopilot: the finger a competent player would hold this frame.
// Test-only (headless solvability proof + the e2e bot), but it plays through the real sim.
//
// 1. Exposure grid: every 40 px cell is sampled over 90 s of hazard time. The result is the
//    fraction of time something can see it, plus solid / scramble / porch-trigger zones.
// 2. A* over that grid to the cheapest remaining ring gives a dense path. Cells that are never
//    exposed (with a one-cell margin) right before an exposed stretch become hold points.
// 3. Every 0.1 s the autopilot rolls the real physics forward (copied state, a second hazard
//    field) for "go to the next hold point", "go with a dash" and "wait here", and picks the
//    first one that keeps the suspicion fuse well short of full.
import type { FlightAutopilotIntent, Vec2 } from '../contracts';
import type { DeepMap } from '../levels/types';
import { circleSegment, pointInCircle, pointInCone } from './geometry';
import { HazardField, Route } from './hazards';
import { DeepFlightSim, copyFlightState, newFlightState, stepFlight, type FlightState } from './deep-sim';
import { POWER_LINE, SAUCER } from './sim';

export const CELL = 40;
const SAMPLE_SPAN = 90;
const SAMPLE_DT = 0.15;
const DECIDE_EVERY = 0.1;
const ROLL_DT = 1 / 60;
/** Never commit to a plan whose predicted fuse peaks above this. */
const SAFE_PEAK = 0.45;
const FULL = 190;
/** Finger offset slew (px/s): keeps ordinary steering well under the 900 px/s flick speed. */
const SLEW = 650;

interface Finger {
  down: boolean;
  dx: number;
  dy: number;
}

/** Move the held finger offset `cur` toward `want`, like a thumb would. */
function slew(cur: Finger, want: Finger, dt: number): void {
  if (!want.down) {
    cur.down = false;
    return;
  }
  if (!cur.down) {
    cur.down = true;
    cur.dx = want.dx;
    cur.dy = want.dy;
    return;
  }
  const ex = want.dx - cur.dx;
  const ey = want.dy - cur.dy;
  const e = Math.hypot(ex, ey);
  const max = SLEW * dt;
  if (e <= max) {
    cur.dx = want.dx;
    cur.dy = want.dy;
  } else {
    cur.dx += (ex / e) * max;
    cur.dy += (ey / e) * max;
  }
}

export interface ExposureGrid {
  cols: number;
  rows: number;
  /** Fraction of sampled time each cell centre is inside a detector. */
  exposure: Float32Array;
  /** Extra path cost (crane sweep, flocks, neon, porch triggers). */
  extra: Float32Array;
  blocked: Uint8Array;
  /** Safe to wait here (never exposed, with margin, and nothing moving through). */
  hold: Uint8Array;
}

const grids = new WeakMap<DeepMap, ExposureGrid>();

/** Build (once per map) the exposure grid. */
export function exposureGrid(m: DeepMap): ExposureGrid {
  const hit = grids.get(m);
  if (hit) return hit;
  const cols = Math.ceil(m.w / CELL);
  const rows = Math.ceil(m.h / CELL);
  const n = cols * rows;
  const count = new Uint16Array(n);
  const stamp = new Int32Array(n).fill(-1);
  const extra = new Float32Array(n);
  const blocked = new Uint8Array(n);
  const noHold = new Uint8Array(n);
  const field = new HazardField(m.hazards);
  const lit = new Float64Array(field.porchCount).fill(1);
  const samples = Math.round(SAMPLE_SPAN / SAMPLE_DT);
  const cx = (c: number): number => c * CELL + CELL / 2;

  const raster = (k: number, x: number, y: number, r: number, test: (px: number, py: number) => boolean): void => {
    const c0 = Math.max(0, Math.floor((x - r) / CELL));
    const c1 = Math.min(cols - 1, Math.floor((x + r) / CELL));
    const r0 = Math.max(0, Math.floor((y - r) / CELL));
    const r1 = Math.min(rows - 1, Math.floor((y + r) / CELL));
    for (let rr = r0; rr <= r1; rr++)
      for (let c = c0; c <= c1; c++) {
        const i = c + rr * cols;
        if (stamp[i] === k) continue;
        if (test(cx(c), cx(rr))) {
          stamp[i] = k;
          count[i]!++;
        }
      }
  };

  for (let k = 0; k < samples; k++) {
    field.sample(k * SAMPLE_DT);
    for (let i = 0; i < m.hazards.length; i++) {
      const d = m.hazards[i]!;
      switch (d.type) {
        case 'car': {
          const c = field.cars[i]![0]!;
          raster(k, c.ox, c.oy, d.coneRange, (px, py) => pointInCone(px, py, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange));
          if (d.barR > 0) raster(k, c.x, c.y, d.barR, (px, py) => pointInCircle(px, py, c.x, c.y, d.barR));
          break;
        }
        case 'traffic':
          for (const c of field.cars[i]!) {
            if (!c.live) continue;
            raster(k, c.ox, c.oy, d.coneRange, (px, py) => pointInCone(px, py, c.ox, c.oy, c.cone, d.coneHalf, d.coneRange));
          }
          break;
        case 'watcher':
        case 'camera': {
          const a = field.a[i]!;
          raster(k, d.x, d.y, d.range, (px, py) => pointInCone(px, py, d.x, d.y, a, d.half, d.range));
          break;
        }
        case 'dog': {
          const r = field.a[i]!;
          raster(k, d.x, d.y, r, (px, py) => pointInCircle(px, py, d.x, d.y, r));
          break;
        }
        case 'heli': {
          const x = field.x2[i]!;
          const y = field.y2[i]!;
          raster(k, x, y, d.spotR, (px, py) => pointInCircle(px, py, x, y, d.spotR));
          break;
        }
        case 'window':
          if (field.on[i]) raster(k, d.x, d.y, d.r, (px, py) => pointInCircle(px, py, d.x, d.y, d.r));
          break;
        default:
          break;
      }
    }
  }
  void lit;

  const hitR = SAUCER.radius * POWER_LINE.hitFrac;
  const seg = { nx: 0, ny: 0, depth: 0 };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = c + r * cols;
      const x = cx(c);
      const y = cx(r);
      if (x < SAUCER.radius || y < SAUCER.radius || x > m.w - SAUCER.radius || y > m.h - SAUCER.radius) blocked[i] = 1;
      for (const d of m.hazards) {
        if (d.type === 'wire' && circleSegment(x, y, hitR + 8, d.ax, d.ay, d.bx, d.by, seg)) blocked[i] = 1;
        else if (d.type === 'crane' && pointInCircle(x, y, d.x, d.y, d.len + d.width / 2 + hitR + 10)) {
          extra[i] = extra[i]! + 2;
          noHold[i] = 1;
        } else if (d.type === 'neon' && pointInCircle(x, y, d.x, d.y, d.r + 10)) {
          extra[i] = extra[i]! + 1.2;
          noHold[i] = 1;
        } else if (d.type === 'porch' && pointInCircle(x, y, d.x, d.y, d.trigger + 30)) {
          extra[i] = extra[i]! + 14;
          noHold[i] = 1;
        } else if (d.type === 'porch' && pointInCircle(x, y, d.x, d.y, d.r + 20)) {
          noHold[i] = 1;
        }
      }
    }
  // flocks: everything near their loop
  for (const d of m.hazards) {
    if (d.type !== 'flock') continue;
    const route = new Route(d.path, true);
    const p = { x: 0, y: 0 };
    const reach = d.r + SAUCER.radius * 0.7 + 30;
    for (let s = 0; s < route.total; s += CELL / 2) {
      route.at(s, p);
      const c0 = Math.max(0, Math.floor((p.x - reach) / CELL));
      const c1 = Math.min(cols - 1, Math.floor((p.x + reach) / CELL));
      const r0 = Math.max(0, Math.floor((p.y - reach) / CELL));
      const r1 = Math.min(rows - 1, Math.floor((p.y + reach) / CELL));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const i = c + r * cols;
          if (noHold[i] === 2) continue;
          if (pointInCircle(cx(c), cx(r), p.x, p.y, reach)) {
            extra[i] = extra[i]! + 0.6;
            noHold[i] = 2;
          }
        }
    }
  }

  const exposure = new Float32Array(n);
  for (let i = 0; i < n; i++) exposure[i] = count[i]! / samples;
  const hold = new Uint8Array(n);
  for (let r = 1; r < rows - 1; r++)
    for (let c = 1; c < cols - 1; c++) {
      let ok = true;
      for (let dr = -1; dr <= 1 && ok; dr++)
        for (let dc = -1; dc <= 1 && ok; dc++) {
          const j = c + dc + (r + dr) * cols;
          if (exposure[j]! > 0 || blocked[j] || noHold[j]) ok = false;
        }
      hold[c + r * cols] = ok ? 1 : 0;
    }
  const g: ExposureGrid = { cols, rows, exposure, extra, blocked, hold };
  grids.set(m, g);
  return g;
}

/** 8-connected A* from world point a to b. Returns cell centres (or null). */
export function findPath(grid: ExposureGrid, a: Vec2, b: Vec2): { pts: Vec2[]; cost: number } | null {
  const { cols, rows } = grid;
  const n = cols * rows;
  const ci = (p: Vec2): number => Math.min(cols - 1, Math.max(0, Math.floor(p.x / CELL))) + Math.min(rows - 1, Math.max(0, Math.floor(p.y / CELL))) * cols;
  const start = ci(a);
  const goal = ci(b);
  const gs = new Float32Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  // binary heap of (f, i)
  const heapF: number[] = [];
  const heapI: number[] = [];
  const push = (f: number, i: number): void => {
    let k = heapF.length;
    heapF.push(f);
    heapI.push(i);
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heapF[p]! <= f) break;
      heapF[k] = heapF[p]!;
      heapI[k] = heapI[p]!;
      k = p;
    }
    heapF[k] = f;
    heapI[k] = i;
  };
  const pop = (): number => {
    const top = heapI[0]!;
    const lf = heapF.pop()!;
    const li = heapI.pop()!;
    if (heapF.length > 0) {
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        if (l >= heapF.length) break;
        const r = l + 1;
        const m = r < heapF.length && heapF[r]! < heapF[l]! ? r : l;
        if (heapF[m]! >= lf) break;
        heapF[k] = heapF[m]!;
        heapI[k] = heapI[m]!;
        k = m;
      }
      heapF[k] = lf;
      heapI[k] = li;
    }
    return top;
  };
  const gx = goal % cols;
  const gy = (goal - gx) / cols;
  const h = (i: number): number => {
    const x = i % cols;
    const y = (i - x) / cols;
    return Math.hypot(x - gx, y - gy) * CELL;
  };
  gs[start] = 0;
  push(h(start), start);
  const cellCost = (i: number): number => 1 + 9 * grid.exposure[i]! + grid.extra[i]!;
  while (heapF.length) {
    const i = pop();
    if (closed[i]) continue;
    closed[i] = 1;
    if (i === goal) break;
    const x = i % cols;
    const y = (i - x) / cols;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const j = nx + ny * cols;
        if (closed[j] || (grid.blocked[j] && j !== goal)) continue;
        // no corner cutting past blocked cells
        if (dx && dy && (grid.blocked[x + dx + y * cols] || grid.blocked[x + (y + dy) * cols])) continue;
        const step = (dx && dy ? Math.SQRT2 : 1) * CELL * 0.5 * (cellCost(i) + cellCost(j));
        const ng = gs[i]! + step;
        if (ng < gs[j]!) {
          gs[j] = ng;
          from[j] = i;
          push(ng + h(j), j);
        }
      }
  }
  if (!closed[goal]) return null;
  const cells: number[] = [];
  for (let i = goal; i >= 0; i = from[i]!) {
    cells.push(i);
    if (i === start) break;
  }
  cells.reverse();
  const pts = cells.map((i) => {
    const x = i % cols;
    return { x: x * CELL + CELL / 2, y: ((i - x) / cols) * CELL + CELL / 2 };
  });
  pts[0] = { x: a.x, y: a.y };
  pts[pts.length - 1] = { x: b.x, y: b.y };
  return { pts, cost: gs[goal]! };
}

type Mode = 'go' | 'hold' | 'back';

export interface AutopilotStats {
  decisions: number;
  holds: number;
  dashes: number;
  replans: number;
  /** Target order visited. */
  order: number[];
}

/**
 * Hazard-aware autopilot. Call `intent()` once per frame (or per bot poll); it returns the
 * finger position in logical screen coords.
 */
export class FlightAutopilot {
  readonly grid: ExposureGrid;
  private readonly rf: HazardField;
  private readonly rs: FlightState;
  private path: Vec2[] = [];
  private holds: number[] = [];
  private pi = 0;
  private target = -1;
  private ring = -1;
  private mode: Mode = 'hold';
  private decideAt = -1;
  private holdSince = 0;
  private flickAt = -1;
  private flickDir = { x: 0, y: 0 };
  private anchor: Vec2 = { x: 0, y: 0 };
  private lastPos: Vec2 = { x: 0, y: 0 };
  /** Last decision (debug): mode chosen and the predicted fuse peaks. */
  readonly last = { go: 0, dash: -1, hold: 0, back: 0, mode: 'hold' as string, stop: 0, forced: false };
  readonly stats: AutopilotStats = { decisions: 0, holds: 0, dashes: 0, replans: 0, order: [] };
  private readonly out: FlightAutopilotIntent = { down: false, x: 0, y: 0 };

  constructor(
    private readonly sim: DeepFlightSim,
    /** Fixed visiting order (target indices); default = cheapest next. */
    private readonly order?: readonly number[],
    /** Use the afterburner when owned. */
    private readonly useDash = true,
  ) {
    this.grid = exposureGrid(sim.map);
    this.rf = new HazardField(sim.map.hazards);
    this.rs = newFlightState(this.rf.porchCount);
  }

  /** Current planned path (for debug drawing). */
  get plan(): readonly Vec2[] {
    return this.path;
  }

  get holdPoints(): readonly number[] {
    return this.holds;
  }

  get currentMode(): string {
    return this.mode;
  }

  /** Target the autopilot is heading for, or -1. */
  get heading(): number {
    return this.target;
  }

  /** Rings we gave up on (stuck too long): extra planning cost. */
  private readonly avoid = new Float32Array(6);

  private replan(): void {
    const sim = this.sim;
    const s = sim.saucer;
    let best: { pts: Vec2[]; cost: number } | null = null;
    let bestCost = Infinity;
    let bestT = -1;
    let bestE = -1;
    const candidates = this.order ? this.order.filter((t) => !sim.delivered[t]).slice(0, 1) : [0, 1, 2].filter((t) => !sim.delivered[t]);
    for (const t of candidates) {
      for (let e = 0; e < 2; e++) {
        const r = sim.ringPos(t, e);
        const p = findPath(this.grid, s, r);
        const cost = p ? p.cost + this.avoid[t * 2 + e]! : Infinity;
        if (p && cost < bestCost) {
          bestCost = cost;
          best = p;
          bestT = t;
          bestE = e;
        }
      }
    }
    this.stats.replans++;
    this.target = bestT;
    this.ring = bestT >= 0 ? bestT * 2 + bestE : -1;
    this.path = best ? best.pts : [{ x: s.x, y: s.y }];
    this.pi = 0;
    // hold points: never-exposed cells right before an exposed stretch, plus the goal
    const holds: number[] = [];
    const g = this.grid;
    const holdAt = (p: Vec2): boolean => {
      const c = Math.floor(p.x / CELL);
      const r = Math.floor(p.y / CELL);
      return g.hold[c + r * g.cols] === 1;
    };
    for (let i = 1; i < this.path.length - 1; i++) {
      if (holdAt(this.path[i]!) && !holdAt(this.path[i + 1]!)) holds.push(i);
    }
    holds.push(this.path.length - 1);
    this.holds = holds;
    this.anchor = { x: s.x, y: s.y };
    this.stop = 0;
    this.mode = 'hold';
    this.decideAt = -1;
    this.holdSince = sim.t;
    if (bestT >= 0 && this.stats.order[this.stats.order.length - 1] !== bestT) this.stats.order.push(bestT);
  }

  /** Steering law shared by the live intent and the rollouts. Returns finger offset in `o`. */
  private control(st: FlightState, piRef: { pi: number }, stop: number, mode: Mode, anchor: Vec2, o: { down: boolean; dx: number; dy: number }): void {
    const s = st.s;
    const path = this.path;
    if (mode === 'hold' || mode === 'back') {
      this.brakeTo(s, anchor, o);
      return;
    }
    // advance along the path
    while (piRef.pi < stop && Math.hypot(path[piRef.pi]!.x - s.x, path[piRef.pi]!.y - s.y) < 60) piRef.pi++;
    const stopP = path[stop]!;
    const ds = Math.hypot(stopP.x - s.x, stopP.y - s.y);
    if (piRef.pi >= stop || ds < 150) {
      this.brakeTo(s, stopP, o);
      return;
    }
    // pure pursuit: a point ~2 cells ahead along the path
    let k = piRef.pi;
    while (k < stop && Math.hypot(path[k]!.x - s.x, path[k]!.y - s.y) < 90) k++;
    const q = path[k]!;
    let dx = q.x - s.x;
    let dy = q.y - s.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const along = s.vx * dx + s.vy * dy;
    const px = s.vx - along * dx;
    const py = s.vy - along * dy;
    o.down = true;
    o.dx = dx * FULL - px * 0.4;
    o.dy = dy * FULL - py * 0.4;
  }

  private brakeTo(s: { x: number; y: number; vx: number; vy: number }, p: Vec2, o: { down: boolean; dx: number; dy: number }): void {
    const dx = p.x - s.x;
    const dy = p.y - s.y;
    const d = Math.hypot(dx, dy);
    const sp = Math.hypot(s.vx, s.vy);
    if (d < 12 && sp < 60) {
      o.down = false;
      o.dx = o.dy = 0;
      return;
    }
    const lead = Math.min(FULL, d * 1.4);
    o.down = true;
    o.dx = (d > 0 ? (dx / d) * lead : 0) - s.vx * 0.35;
    o.dy = (d > 0 ? (dy / d) * lead : 0) - s.vy * 0.35;
  }

  private readonly ro: Finger = { down: false, dx: 0, dy: 0 };
  private readonly rf2: Finger = { down: false, dx: 0, dy: 0 };
  /** The finger currently held (offset from the saucer). */
  private readonly finger: Finger = { down: false, dx: 0, dy: 0 };
  private lastCall = -1;
  private readonly rpi = { pi: 0 };
  private readonly cands: number[] = [];
  /** Path index we are flying to in 'go' mode. */
  private stop = 0;

  /** Roll the physics forward; returns the peak suspicion (1 = spotted). */
  private rollout(mode: Mode, stop: number, anchor: Vec2, horizon: number, settle: number, dash: Vec2 | null): number {
    const sim = this.sim;
    const rs = this.rs;
    copyFlightState(rs, sim.st);
    this.rpi.pi = this.pi;
    let peak = rs.sus;
    let held = 0;
    const f = this.rf2;
    f.down = this.finger.down;
    f.dx = this.finger.dx;
    f.dy = this.finger.dy;
    const goalP = mode === 'go' ? this.path[stop]! : anchor;
    for (let k = 0; k * ROLL_DT < horizon; k++) {
      this.control(rs, this.rpi, stop, mode, anchor, this.ro);
      slew(f, this.ro, ROLL_DT);
      const flick = k === 0 && dash !== null;
      stepFlight(this.rf, sim.map, rs, f.down, f.dx, f.dy, flick, dash?.x ?? 0, dash?.y ?? 0, ROLL_DT, sim.mult, sim.afterburner);
      if (rs.sus > peak) peak = rs.sus;
      if (peak >= 1) return 1;
      const s = rs.s;
      if (Math.hypot(goalP.x - s.x, goalP.y - s.y) < 30 && Math.hypot(s.vx, s.vy) < 140) {
        held += ROLL_DT;
        if (held >= settle) break;
      }
    }
    return peak;
  }

  private nextStop(): number {
    const s = this.sim.saucer;
    for (const h of this.holds) {
      if (h < this.pi) continue;
      const p = this.path[h]!;
      if (h < this.path.length - 1 && Math.hypot(p.x - s.x, p.y - s.y) < 45) continue;
      return h;
    }
    return this.path.length - 1;
  }

  private decide(): void {
    const sim = this.sim;
    const s = sim.saucer;
    this.stats.decisions++;
    const next = this.nextStop();
    const last = this.path.length - 1;
    const waited = sim.t - this.holdSince;
    const limit = waited > 25 ? 0.9 : SAFE_PEAK;
    const horizon = 5;
    const L = this.last;
    L.dash = -1;
    L.hold = -1;
    L.back = -1;
    L.forced = false;
    // Candidate stops, farthest first: the next hold point, then points part-way along the path
    // where we could pause (only if the rollout shows sitting there is safe for a moment).
    const cands = this.cands;
    cands.length = 0;
    cands.push(next);
    for (let k = next - 4; k > this.pi + 1; k -= 4) cands.push(k);
    let best = -1;
    let bestPeak = 2;
    for (let c = 0; c < cands.length && c < 6; c++) {
      const stop = cands[c]!;
      const peak = this.rollout('go', stop, this.anchor, horizon, stop === last ? 1.5 : 0.9, null);
      if (c === 0) L.go = peak;
      if (peak < limit) {
        best = stop;
        bestPeak = peak;
        break;
      }
      if (peak < bestPeak) bestPeak = peak;
    }
    if (best >= 0) {
      this.stop = best;
      L.stop = best;
      this.setMode('go');
      return;
    }
    if (this.useDash && sim.afterburner && sim.st.dash.cool <= 0 && sim.st.dash.active <= 0) {
      // dash along the first stretch of the path
      const k = Math.min(last, this.pi + 3);
      const q = this.path[k]!;
      const dx = q.x - s.x;
      const dy = q.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 30) {
        const dir = { x: dx / d, y: dy / d };
        const dashed = this.rollout('go', next, this.anchor, horizon, next === last ? 1.5 : 0.9, dir);
        L.dash = dashed;
        if (dashed < limit) {
          this.stop = next;
          L.stop = next;
          this.setMode('go');
          this.flickAt = sim.t;
          this.flickDir = dir;
          this.stats.dashes++;
          return;
        }
      }
    }
    // not safe to go: wait where we are if that's a safe spot, else pick the least bad option
    const here = { x: s.x, y: s.y };
    const atAnchor = Math.hypot(this.anchor.x - s.x, this.anchor.y - s.y) < 40;
    const holdHere = this.rollout('hold', next, atAnchor ? this.anchor : here, 1.2, 99, null);
    L.hold = holdHere;
    if (holdHere < limit) {
      if (!atAnchor) this.anchor = here;
      this.setMode('hold');
      return;
    }
    const back = atAnchor ? 1 : this.rollout('back', next, this.anchor, 3, 99, null);
    L.back = back;
    L.forced = true;
    const go = L.go;
    const least = Math.min(go, holdHere, back);
    if (least === go) {
      this.stop = next;
      this.setMode('go');
    } else if (least === holdHere) {
      this.anchor = here;
      this.setMode('hold');
    } else this.setMode('back');
  }

  private setMode(m: Mode): void {
    this.last.mode = m;
    if (m !== 'go' && this.mode === 'go') {
      this.holdSince = this.sim.t;
      this.stats.holds++;
    }
    if (m === 'go' && this.mode !== 'go') this.holdSince = this.sim.t;
    this.mode = m;
  }

  /** The finger this frame (logical screen coords). */
  intent(): FlightAutopilotIntent {
    const sim = this.sim;
    const s = sim.saucer;
    const o = this.out;
    if (sim.phase !== 'fly') {
      o.down = false;
      return o;
    }
    const jumped = Math.hypot(s.x - this.lastPos.x, s.y - this.lastPos.y) > 200;
    this.lastPos.x = s.x;
    this.lastPos.y = s.y;
    const ringGone = this.ring >= 0 && sim.delivered[this.target];
    if (this.target < 0 || jumped || ringGone || this.path.length === 0) this.replan();
    if (this.target < 0) {
      o.down = false;
      return o;
    }
    // arrived at a hold point: it becomes the new anchor
    for (const h of this.holds) {
      if (h >= this.pi - 1 && h < this.path.length - 1) {
        const p = this.path[h]!;
        if (Math.hypot(p.x - s.x, p.y - s.y) < 40) {
          this.anchor = { x: p.x, y: p.y };
          if (this.pi < h) this.pi = h;
        }
      }
    }
    if (sim.t >= this.decideAt) {
      this.decideAt = sim.t + DECIDE_EVERY;
      // stuck behind something for a long time: try another ring / target
      if (this.mode !== 'go' && sim.t - this.holdSince > 20) {
        this.avoid[this.ring] = this.avoid[this.ring]! + 1500;
        this.replan();
      }
      this.decide();
    }
    const rpi = { pi: this.pi };
    this.control(sim.st, rpi, Math.max(this.stop, this.pi), this.mode, this.anchor, this.ro);
    this.pi = rpi.pi;
    const sx = s.x - sim.camX;
    const sy = s.y - sim.camY;
    // a flick in progress: sweep the finger fast through the saucer along the dash direction
    const dt = this.lastCall < 0 ? 1 / 60 : Math.max(0, Math.min(0.1, sim.t - this.lastCall));
    this.lastCall = sim.t;
    const ft = sim.t - this.flickAt;
    const f = this.finger;
    if (this.flickAt >= 0 && ft < 0.14) {
      const off = -70 + ft * 1700;
      f.down = true;
      f.dx = this.flickDir.x * off;
      f.dy = this.flickDir.y * off;
    } else slew(f, this.ro, dt);
    o.down = f.down;
    o.x = sx + f.dx;
    o.y = sy + f.dy;
    return o;
  }
}
