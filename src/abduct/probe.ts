// L6 abduction signature: Form 7-B probe drones (docs/GDD-3-new-shifts.md, L6).
//
// Each L6 route has two small static Bureau drones from {thermometer → HEAD, reflex hammer →
// KNEE, tickle feather → FOOT}. Hold the named joint inside the drone's mint ring for HOLD s and
// the reading ticks (the ring fills like the flight lock-on; it drains twice as fast as it fills).
// The feather sets off a giggle (a small noise burst) and a reflex kick; the hammer a smaller
// knee kick. Both show an amber arrow beside the joint for KICK_TELL s before the one impulse.
// The exit stays shut until every reading has ticked (amber empty checkboxes, never red).
//
// DOM-free: the interior simulation steps it, the autopilot asks it where to aim, the view
// (./probe-draw.ts) draws exactly the state kept here.
import type { Audio } from '../contracts';
import { Joint, type Ragdoll } from './ragdoll';

export type ProbeKind = 'thermo' | 'hammer' | 'feather';

export interface ProbeDrone {
  kind: ProbeKind;
  /** Ring centre, world px. */
  x: number;
  y: number;
  /** Ring radius: the joint's centre must be inside it. */
  r: number;
  /** Clipboard line before the reading, e.g. "Temperature" (English source, shown through gt()). */
  label: string;
  /** The reading once taken, e.g. "Temperature: lukewarm" (English source; lands in AbductResult.probeReadings). */
  reading: string;
  /** Hammer / feather: world direction of the reflex kick (normalised here). Ignored by the thermometer. */
  kickX?: number;
  kickY?: number;
}

export const PROBE = {
  /** Seconds the joint must stay in the ring. */
  hold: 0.8,
  /** Progress drains this many times faster than it fills (like the flight lock-on). */
  drain: 2,
  /** Amber arrow shown this long before a reflex kick fires. */
  kickTell: 0.35,
  /** Reflex kick impulse, px/s on the joint (feather on the foot, hammer on the knee). */
  featherKick: 300,
  hammerKick: 170,
  /** The giggle: wake added to the specimen and noise power for other sleepers. */
  giggleWake: 6,
  giggleNoise: 24,
} as const;

/** Joints a drone accepts: the head, either knee, either foot. */
const JOINTS: Readonly<Record<ProbeKind, readonly Joint[]>> = {
  thermo: [Joint.Head],
  hammer: [Joint.NearKnee, Joint.FarKnee],
  feather: [Joint.NearFoot, Joint.FarFoot],
};

export class ProbeState {
  /** Hold progress 0..1. */
  fill = 0;
  done = false;
  /** Seconds since the reading ticked (-1 before). Kicks fire at PROBE.kickTell. */
  since = -1;
  kicked = false;
  /** The joint being probed (nearest accepted joint), and whether it is inside the ring this step. */
  joint: Joint;
  inside = false;
  readonly kx: number;
  readonly ky: number;

  constructor(readonly spec: ProbeDrone) {
    this.joint = JOINTS[spec.kind][0]!;
    const kx = spec.kickX ?? 0;
    const ky = spec.kickY ?? -1;
    const k = Math.hypot(kx, ky) || 1;
    this.kx = kx / k;
    this.ky = ky / k;
  }

  /** True once the reading is taken and its kick (if any) has fired and settled. */
  get settled(): boolean {
    return this.done && (this.spec.kind === 'thermo' || (this.kicked && this.since >= PROBE.kickTell + 0.3));
  }

  /** Seconds left of the amber kick tell, or -1 when no kick is pending. */
  get kickPending(): number {
    if (!this.done || this.kicked || this.spec.kind === 'thermo') return -1;
    return Math.max(0, PROBE.kickTell - this.since);
  }
}

/** Where a sleeper-noise burst goes (the interior simulation's noise()). */
export interface NoiseSink {
  noise(power: number, x: number, y: number): void;
}

export class ProbeSim {
  readonly drones: readonly ProbeState[];

  constructor(specs: readonly ProbeDrone[], private readonly audio: Audio) {
    this.drones = specs.map((s) => new ProbeState(s));
  }

  /** Every reading taken: the exit opens. */
  get done(): boolean {
    for (const d of this.drones) if (!d.done) return false;
    return true;
  }

  /** Readings taken so far, in drone order (English source strings). */
  readings(): string[] {
    return this.drones.filter((d) => d.done).map((d) => d.spec.reading);
  }

  /**
   * One physics step (dt = STEP). Fills / drains each ring, ticks readings, fires reflex kicks.
   * Returns wake for the specimen (the giggle); sleepers hear it through `sink`.
   */
  step(body: Ragdoll, dt: number, sink: NoiseSink): number {
    let wake = 0;
    for (const d of this.drones) {
      const { spec } = d;
      if (d.done) {
        d.since += dt;
        if (!d.kicked && spec.kind !== 'thermo' && d.since >= PROBE.kickTell) {
          d.kicked = true;
          const power = spec.kind === 'feather' ? PROBE.featherKick : PROBE.hammerKick;
          body.kick(d.joint, d.kx * power, d.ky * power);
          // the lower leg goes with the foot / knee
          const other = d.joint === Joint.NearFoot ? Joint.NearKnee : d.joint === Joint.FarFoot ? Joint.FarKnee : -1;
          if (other >= 0) body.kick(other, d.kx * power * 0.45, d.ky * power * 0.45);
        }
        continue;
      }
      // nearest accepted joint
      let best = Infinity;
      for (const j of JOINTS[spec.kind]) {
        const dd = Math.hypot(body.x[j]! - spec.x, body.y[j]! - spec.y);
        if (dd < best) {
          best = dd;
          d.joint = j;
        }
      }
      d.inside = best <= spec.r;
      d.fill = d.inside ? Math.min(1, d.fill + dt / PROBE.hold) : Math.max(0, d.fill - (dt * PROBE.drain) / PROBE.hold);
      if (d.fill >= 1 - 1e-9) {
        d.done = true;
        d.since = 0;
        this.audio.sfx('stamp', 0.5);
        if (spec.kind === 'feather') {
          // the giggle
          wake += PROBE.giggleWake;
          sink.noise(PROBE.giggleNoise, body.x[d.joint]!, body.y[d.joint]!);
          this.audio.sfx('mumble', 0.8);
        }
      }
    }
    return wake;
  }

  /**
   * Autopilot / human-model aim for drone `i`: the beam position that would put the probed
   * joint on the ring centre (beam + ring − joint), into `out`.
   */
  aim(i: number, body: Ragdoll, out: { x: number; y: number }): void {
    const d = this.drones[i]!;
    const { spec } = d;
    let best = Infinity;
    let jx = 0;
    let jy = 0;
    for (const j of JOINTS[spec.kind]) {
      const x = body.x[j]!;
      const y = body.y[j]!;
      const dd = Math.hypot(x - spec.x, y - spec.y);
      if (dd < best) {
        best = dd;
        jx = x;
        jy = y;
      }
    }
    out.x = body.beamX + spec.x - jx;
    out.y = body.beamY + spec.y - jy;
  }
}
