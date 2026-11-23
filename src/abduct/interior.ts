import { CameraCone } from './camera-cone';
import type { AbductFailReason, Audio } from '../contracts';
import { clamp, type Blade, type Circle, type Ragdoll, type Rect, type Solid, STEP, type SwingingRect } from './ragdoll';
import type { Building, Checkpoint, Cycle, Hazard, Sleeper } from './rooms/interior';
import type { Area } from './rooms/layout';

export const LASER_TELL = 0.35;
export const GATE_TRAVEL = 0.32;
export const CAMERA_FUSE = 1;
const CAMERA_GRACE = 0.25;
const CAMERA_DECAY = 1.5;
const CAMERA_PILOT_LAGS = [0.32, 0.48, 0.64] as const;
const LASER_CLEARANCE = 0.11;
const BREAK_SPEED = 72;
const CREAK_SPEED = 96;

export interface InteriorFailure {
  reason: AbductFailReason;
  by: string;
}

export class HazardState {
  readonly shapes: readonly Solid[];
  firstSolid = -1;
  angle = 0;
  level = 0;
  tell = false;
  broken = false;
  detecting = false;
  pulse = 0;
  next = 0;

  readonly cone: CameraCone | undefined;

  constructor(readonly spec: Hazard, building: Building) {
    this.cone = spec.kind === 'camera' ? new CameraCone(building, spec) : undefined;
    switch (spec.kind) {
      case 'swing': {
        const { sprite: s } = spec;
        const shape: SwingingRect = { kind: 'swingingRect', x: s.x + s.w / 2, y: s.y, w: s.w, h: s.h, angle: 0, omega: 0 };
        this.shapes = [shape];
        break;
      }
      case 'fan': {
        const { x, y, length } = spec;
        const hub: Circle = { kind: 'circle', x, y, r: 18, vx: 0, vy: 0 };
        const blade: Blade = { kind: 'blade', x, y, angle: 0, from: 12, to: length - 10, r: 10, omega: spec.speed };
        this.shapes = [hub, blade, { ...blade }];
        break;
      }
      case 'gear': {
        const { sprite: s } = spec;
        this.shapes = [{ kind: 'circle', x: s.x + s.w / 2, y: s.y + s.h / 2, r: s.w / 2, vx: 0, vy: 0, omega: spec.speed }];
        break;
      }
      case 'gate': {
        const a = spec.area;
        this.shapes = spec.hinged
          ? [{ kind: 'swingingRect', x: a.x + a.w / 2, y: a.y, w: a.w, h: a.h, angle: 0, omega: 0 }]
          : [solidRect(a)];
        break;
      }
      case 'laser':
      case 'pop':
        this.shapes = [solidRect(spec.area)];
        break;
      case 'speaker':
        this.next = spec.period;
        this.shapes = [solidRect(spec.sprite)];
        break;
      case 'patrol':
      case 'fragile':
        this.shapes = [solidRect(spec.sprite)];
        break;
      case 'camera':
      case 'draft':
      case 'creak':
        this.shapes = [];
        break;
    }
  }
}

export class SleeperState {
  readonly x: number;
  readonly y: number;
  wake = 0;
  pulse = 0;

  constructor(readonly spec: Sleeper) {
    this.x = spec.asleep.x + spec.asleep.w / 2;
    this.y = spec.asleep.y + spec.asleep.h / 2;
  }
}

export function solidRect(a: Area): Rect {
  return { kind: 'rect', x: a.x, y: a.y, w: a.w, h: a.h, vx: 0, vy: 0 };
}

export function inside(a: Area, x: number, y: number): boolean {
  return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
}

function phase(cycle: Cycle, time: number): number {
  return (time + cycle.phase) % cycle.period;
}

export class InteriorSimulation {
  readonly hazards: readonly HazardState[];
  readonly sleepers: readonly SleeperState[];
  exposure = 0;
  watching: HazardState | undefined;
  strain = 0;
  draftX = 0;
  draftY = 0;
  failure: InteriorFailure | undefined;

  private readonly namedHazards = new Map<string, HazardState>();
  private x: number;
  private y: number;
  private cameraGrace = 0;
  private nextTick = 0;
  private eventNoise = 0;

  constructor(
    readonly building: Building, solids: Solid[], startX: number, startY: number,
    private readonly audio: Audio, private readonly hush: boolean,
  ) {
    this.x = startX;
    this.y = startY;
    this.hazards = building.hazards.map(spec => new HazardState(spec, building));
    this.sleepers = building.sleepers.map(spec => new SleeperState(spec));
    for (const state of this.hazards) {
      this.namedHazards.set(state.spec.name, state);
      if (state.spec.kind !== 'laser' && state.shapes.length > 0) {
        state.firstSolid = solids.length;
        solids.push(...state.shapes);
      }
    }
    this.prepare(0, startX, startY);
  }

  /** Move each collider to the same geometry the view will draw this frame. */
  prepare(time: number, x: number, y: number): void {
    this.draftX = 0;
    this.draftY = 0;
    for (const state of this.hazards) {
      const { spec } = state;
      switch (spec.kind) {
        case 'swing': {
          const shape = state.shapes[0] as SwingingRect;
          const p = time * spec.speed + spec.phase;
          shape.angle = spec.amplitude * Math.sin(p);
          shape.omega = spec.amplitude * spec.speed * Math.cos(p);
          break;
        }
        case 'fan': {
          const angle = time * spec.speed + spec.phase;
          (state.shapes[1] as Blade).angle = angle;
          (state.shapes[2] as Blade).angle = angle + Math.PI;
          break;
        }
        case 'gear':
          state.angle = time * spec.speed;
          break;
        case 'patrol': {
          const shape = state.shapes[0] as Rect;
          const p = time * spec.speed + spec.phase;
          const offset = Math.sin(p);
          const speed = spec.speed * Math.cos(p);
          shape.x = spec.sprite.x + spec.dx * offset;
          shape.y = spec.sprite.y + spec.dy * offset;
          shape.vx = spec.dx * speed;
          shape.vy = spec.dy * speed;
          break;
        }
        case 'camera':
          state.angle = spec.angle + Math.sin(time * spec.speed + spec.phase) * spec.sweep;
          break;
        case 'laser': {
          const p = phase(spec.cycle, time);
          state.level = p >= spec.cycle.open ? 1 : 0;
          state.tell = p >= spec.cycle.open - LASER_TELL && p < spec.cycle.open;
          break;
        }
        case 'gate':
        case 'pop': {
          const { area, cycle } = spec;
          const shape = state.shapes[0]!;
          const p = phase(cycle, time);
          const retract = Math.min(1, p / GATE_TRAVEL, (cycle.open - p) / GATE_TRAVEL);
          const size = 1 - clamp(retract, 0, 1);
          const opening = p < GATE_TRAVEL;
          const closing = p > cycle.open - GATE_TRAVEL && p < cycle.open;
          state.tell = (p >= cycle.open - 0.55 && p < cycle.open) || p >= cycle.period - 0.22;
          state.level = size;
          if (shape.kind === 'swingingRect') {
            shape.angle = (1 - size) * Math.PI / 2;
            shape.omega = opening ? 1.08 : closing ? -1.08 : 0;
            break;
          }
          if (shape.kind !== 'rect') break;
          shape.active = size > 0;
          if (spec.kind === 'gate' && spec.axis === 'y') {
            shape.h = area.h * size;
            shape.vy = opening ? -area.h / GATE_TRAVEL : closing ? area.h / GATE_TRAVEL : 0;
          } else {
            shape.w = area.w * size;
            shape.vx = opening ? -area.w / GATE_TRAVEL : closing ? area.w / GATE_TRAVEL : 0;
            if (spec.kind === 'pop') {
              shape.x = area.x + area.w - shape.w;
              shape.vx *= -1;
            }
          }
          // The moving edge travels with the panel. Cap its transfer to the
          // body so a closing gate bonks it without flinging it through a wall.
          shape.vx = clamp(shape.vx, -235, 235);
          shape.vy = clamp(shape.vy, -235, 235);
          break;
        }
        case 'draft':
          if (inside(spec.area, x, y)) {
            this.draftX += spec.ax;
            this.draftY += spec.ay;
          }
          break;
        case 'fragile':
        case 'creak':
        case 'speaker':
          break;
      }
    }
  }

  /** Returns wake gained by the specimen from noise hazards on this step. */
  step(body: Ragdoll, time: number, wallContact: boolean): number {
    if (this.failure) return 0;
    this.eventNoise = 0;
    const x = body.chestX;
    const y = body.chestY;
    const speed = Math.hypot(x - this.x, y - this.y) / STEP;
    this.x = x;
    this.y = y;
    const lead = Math.hypot(body.beamX - x, body.beamY - y);
    this.strain = wallContact && lead > 148 && speed < 120 ? Math.min(1, this.strain + STEP * 2.4) : Math.max(0, this.strain - STEP * 4);
    for (const sleeper of this.sleepers) {
      sleeper.wake = Math.max(0, sleeper.wake - 2.1 * STEP);
      sleeper.pulse = Math.max(0, sleeper.pulse - STEP * 2);
    }
    this.watching = undefined;

    for (const state of this.hazards) {
      const { spec } = state;
      state.pulse = Math.max(0, state.pulse - STEP * 2.3);
      switch (spec.kind) {
        case 'laser':
          if (state.level === 1 && Math.abs(x - spec.area.x) < spec.area.w + 230 &&
              Math.abs(y - spec.area.y) < spec.area.h + 230 && body.overlaps(state.shapes[0]!)) {
            this.trip('alarm', spec.name);
            this.audio.sfx('laser');
            return 0;
          }
          break;
        case 'camera':
          state.detecting = state.cone?.overlapsBody(body, state.angle) ?? false;
          if (state.detecting) this.watching ??= state;
          break;
        case 'fragile':
          if (!state.broken && body.impacts[state.firstSolid]! >= BREAK_SPEED) {
            state.broken = true;
            state.pulse = 1;
            (state.shapes[0] as Rect).active = false;
            this.eventNoise += 29;
            this.noise(94, spec.sprite.x + spec.sprite.w / 2, spec.sprite.y + spec.sprite.h / 2);
            this.audio.sfx('crash');
          }
          break;
        case 'creak':
          if (time >= state.next && speed > CREAK_SPEED && inside(spec.area, x, y)) {
            state.next = time + 0.31;
            state.pulse = 1;
            const gain = 7 + clamp((speed - CREAK_SPEED) * 0.025, 0, 8);
            this.eventNoise += gain;
            this.noise(gain * 2.1, x, y);
            this.audio.sfx('creak', 0.6);
          }
          break;
        case 'speaker':
          if (time >= state.next) {
            state.next += spec.period;
            state.pulse = 1;
            const cx = spec.sprite.x + spec.sprite.w / 2;
            const cy = spec.sprite.y + spec.sprite.h / 2;
            const distance = Math.hypot(x - cx, y - cy);
            if (distance < spec.radius) {
              const gain = 2 + 9 * (1 - distance / spec.radius);
              this.eventNoise += gain;
              this.noise(gain * 2.1, x, y);
              this.audio.sfx('creak', 0.32);
            }
            this.noise(5, cx, cy);
          }
          break;
        case 'patrol':
          if (spec.barks && time >= state.next && body.touched[state.firstSolid]) {
            state.next = time + 1.25;
            state.pulse = 1;
            this.eventNoise += 31;
            const shape = state.shapes[0] as Rect;
            this.noise(62, shape.x + shape.w / 2, shape.y + shape.h / 2);
            this.audio.sfx('bark');
          }
          break;
        case 'gate':
        case 'pop':
        case 'swing':
        case 'fan':
        case 'gear':
        case 'draft':
          break;
      }
      if (this.failure) return this.eventNoise;
    }

    if (this.watching) {
      this.cameraGrace = CAMERA_GRACE;
      this.exposure = Math.min(CAMERA_FUSE, this.exposure + STEP * (this.hush ? 0.8 : 1));
      if (time >= this.nextTick) {
        this.audio.sfx('alert', 0.25 + this.exposure * 0.55);
        this.nextTick = time + 0.24 - 0.15 * this.exposure;
      }
      if (this.exposure >= CAMERA_FUSE - 1e-9) this.trip('alarm', this.watching.spec.name);
    } else if (this.cameraGrace > 0) {
      this.cameraGrace -= STEP;
    } else {
      this.exposure = Math.max(0, this.exposure - STEP * CAMERA_DECAY);
    }
    return this.eventNoise;
  }

  noise(power: number, x: number, y: number): void {
    for (const sleeper of this.sleepers) {
      const falloff = Math.max(0, 1 - Math.hypot(x - sleeper.x, y - sleeper.y) / sleeper.spec.radius);
      if (falloff === 0) continue;
      sleeper.pulse = Math.max(sleeper.pulse, Math.min(1, power * falloff / 29));
      sleeper.wake = Math.min(100, sleeper.wake + power * falloff * (this.hush ? 0.75 : 1));
      if (sleeper.wake === 100) this.trip('sleeper', sleeper.spec.name);
    }
  }

  calm(amount: number): void {
    for (const sleeper of this.sleepers) sleeper.wake = Math.max(0, sleeper.wake - amount);
  }

  canCross(from: Checkpoint, target: Checkpoint, time: number, speed: number): boolean {
    if (!target.cross) return true;
    const state = this.namedHazards.get(target.cross);
    if (!state) throw new Error('Unknown crossing hazard: ' + target.cross);
    const { spec } = state;
    if (spec.kind === 'laser' || spec.kind === 'gate' || spec.kind === 'pop') {
      const p = phase(spec.cycle, time);
      const margin = spec.kind === 'laser' ? LASER_CLEARANCE : GATE_TRAVEL;
      const duration = Math.hypot(target.x - from.x, target.y - from.y) / speed;
      return p >= margin && p + duration + 0.62 < spec.cycle.open - margin;
    }
    if (spec.kind === 'fan') {
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      const length = Math.hypot(dx, dy);
      const near = clamp(((spec.x - from.x) * dx + (spec.y - from.y) * dy) / (length * length), 0, 1);
      const angle = (time + near * length / speed + 0.44) * spec.speed + spec.phase;
      const hx = spec.x - from.x - dx * near;
      const hy = spec.y - from.y - dy * near;
      // A blade parallel to the route leaves its perpendicular clearance open.
      return Math.abs(Math.cos(angle) * hy - Math.sin(angle) * hx) < Math.hypot(hx, hy) * 0.49;
    }
    if (spec.kind === 'camera') {
      if (Math.hypot(this.x - from.x, this.y - from.y) > 22) return false;
      const duration = Math.hypot(target.x - from.x, target.y - from.y) / speed;
      // The beam leads the body by a fraction of a second at crossing speed.
      // Check both immediate input and a brief delay from delivery or re-gripping.
      for (const lag of CAMERA_PILOT_LAGS) {
        let seen = this.exposure;
        let grace = this.cameraGrace;
        for (let t = 0; t <= duration + lag + 0.33; t += 0.08) {
          const p = clamp((t - lag) / duration, 0, 1);
          const x = from.x + (target.x - from.x) * p;
          const y = from.y + (target.y - from.y) * p + 9;
          const angle = spec.angle + Math.sin((time + t) * spec.speed + spec.phase) * spec.sweep;
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);
          if (nearCone(spec, dx, dy, x, y - 55) || nearCone(spec, dx, dy, x, y + 35) ||
              nearCone(spec, dx, dy, x, y + 120)) {
            seen += 0.08;
            grace = CAMERA_GRACE;
            if (seen >= 0.8) return false;
          } else if (grace > 0) grace -= 0.08;
          else seen = Math.max(0, seen - 0.08 * CAMERA_DECAY);
        }
      }
      return true;
    }
    return true;
  }

  private trip(reason: InteriorFailure['reason'], by: string): void {
    if (this.failure) return;
    this.failure = { reason, by };
    if (reason === 'alarm') this.audio.sfx('alarm');
    else this.audio.sfx(by === 'Biscuit' ? 'bark' : 'scream');
  }
}

function nearCone(spec: Extract<Hazard, { kind: 'camera' }>, forwardX: number, forwardY: number, x: number, y: number): boolean {
  const dx = x - spec.x;
  const dy = y - spec.y;
  const r = 45;
  if (dx * dx + dy * dy > (spec.range + r) ** 2) return false;
  const forward = dx * forwardX + dy * forwardY;
  const side = Math.abs(dx * forwardY - dy * forwardX);
  return forward >= -r && side * Math.cos(spec.spread) - forward * Math.sin(spec.spread) < r;
}
