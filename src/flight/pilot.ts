// Zib at the wheel: the pilot's mood and body animation, fed by what the flight already knows
// (the saucer's velocity and stun, whether a detector sees it, the fuse, the scene phase, Zib's
// speech bubble). Pure logic, DOM- and Pixi-free, allocation-free per frame; the saucer view
// (src/flight/pilot-view.ts) turns it into display properties. Decoration only: nothing here
// feeds back into the sim, the hit box or the tells.

/** What the pilot is doing, most urgent first in `Pilot.update`. */
export type PilotMood =
  | 'caught' //   the photo flash: pinprick pupils, a long scream, hands slapped to the cheeks
  | 'cheer' //    locked onto a ring: happy eyes, grin, hands up, hopping
  | 'dizzy' //    just bonked something: spinning eyes, tongue lolling, wheel spinning free
  | 'panic' //    a detector sees the saucer: ducks behind the wheel, huge eyes, gritted teeth, sweat
  | 'phew' //     slipped out of sight with the fuse half-burnt: eyes shut, cheeks puffed
  | 'innocent' // respawned after a photo: half-lidded eyes, whistling, nothing to see here
  | 'turn' //     a sharp turn: wheel cranked, body thrown sideways, cheeks squashed, tongue out
  | 'zoom' //     flat out: face pushed back, manic grin
  | 'bored' //    parked a while: heavy lids
  | 'yawn' //     parked longer: a big yawn
  | 'pick' //     parked longer still: one hand off the wheel, finger up the nose
  | 'cruise'; //  default: tongue out in concentration

export type PilotEyes = 'open' | 'wide' | 'spin' | 'x' | 'shut' | 'squeeze' | 'happy' | 'lid';
export type PilotMouth = 'tongue' | 'grin' | 'open' | 'teeth' | 'wavy' | 'whistle' | 'puff';
export type PilotPhase = 'fly' | 'spotted' | 'locking';

/** Per-frame input, filled in place by the view (no allocation). */
export interface PilotInput {
  vx: number;
  vy: number;
  /** Saucer stun seconds (> 0 after a bump); a rise is a fresh hit. */
  stun: number;
  /** A detector covers the saucer this frame. */
  exposed: boolean;
  /** The fuse, 0..1. */
  sus: number;
  phase: PilotPhase;
  /** Zib's speech bubble is up (mouth flaps). */
  talking: boolean;
  /** Respawn ghost seconds left (0 = none). */
  ghost: number;
}

export function newPilotInput(): PilotInput {
  return { vx: 0, vy: 0, stun: 0, exposed: false, sus: 0, phase: 'fly', talking: false, ghost: 0 };
}

export const PILOT = {
  /** Speed (px/s) under which the saucer counts as parked. */
  parked: 25,
  /** Parked this long before boredom sets in (s). */
  boredAfter: 2.2,
  /** The parked loop after boredom: bored, yawn, bored, pick (s, cumulative ends). */
  yawnAt: 0.8,
  yawnEnd: 2.4,
  pickAt: 4.2,
  pickEnd: 6.6,
  loop: 7.6,
  /** Heading turn rate (rad/s) that counts as a sharp turn, above `turnSpeed` px/s. */
  turnRate: 2.4,
  turnSpeed: 110,
  /** A sharp turn shows for at least this long (s). */
  turnHold: 0.35,
  /** Fraction of the saucer's top speed that counts as flat out. */
  zoomFrac: 0.88,
  maxSpeed: 430,
  dizzy: 1.15,
  phew: 0.9,
  /** Escaping with at least this much fuse burnt earns a phew. */
  phewSus: 0.3,
  /** Respawn ghost seconds above which Zib acts innocent (the level start has a short one). */
  innocentGhost: 0.5,
  blinkEvery: 3.3,
  blinkFor: 0.13,
} as const;

const TAU = Math.PI * 2;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function wrap(a: number): number {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

/** Exponential approach factor for rate `k` over `dt`. */
function ease(k: number, dt: number): number {
  return 1 - Math.exp(-k * dt);
}

export class Pilot {
  mood: PilotMood = 'cruise';
  /** Seconds in the current mood. */
  moodT = 0;
  eyes: PilotEyes = 'open';
  mouth: PilotMouth = 'tongue';
  /** 0..1 how open the 'open' mouth is (talking flaps, yawns, screams). */
  mouthOpen = 0;
  /** Wheel rotation (rad, + = clockwise = turning right on screen). */
  wheel = 0;
  /** -1..1 sideways lean of head and body, on screen (thrown away from the acceleration). */
  lean = 0;
  /** 0..1 ducked down behind the wheel. */
  duck = 0;
  /** 0..1 g-force squash of the cheeks. */
  squash = 0;
  /** Pupil offset, -1..1 each way (looks where the saucer is going). */
  lookX = 0;
  lookY = 0;
  /** -1..1 which corner the tongue hangs out of. */
  tongue = 0;
  /** Antenna angles (rad, 0 = straight up) and their spring velocities. */
  antL = 0;
  antR = 0;
  private antLv = 0;
  private antRv = 0;
  /** Eye spiral angle (dizzy). */
  spin = 0;
  /** Vertical hop (px, negative = up). */
  hop = 0;
  /** 0..1 left hand off the wheel towards the nose (pick). */
  pick = 0;
  /** 0..1 both hands off the wheel, up in the air (cheer). */
  handsUp = 0;
  /** 0..1 both hands slapped to the cheeks (caught). */
  palms = 0;
  /** Panic tremble (px). */
  shake = 0;
  /** Sweat drop 0..1 slide progress, or -1 when hidden. */
  sweat = -1;
  /** Orbiting stars' angle (dizzy), rad. */
  stars = 0;

  private t = 0;
  private prevVx = 0;
  private prevVy = 0;
  private prevStun = 0;
  private heading = 0;
  private turnRate = 0;
  private turnHold = 0;
  private dizzyT = 0;
  private phewT = 0;
  private parkedT = 0;
  private wasExposed = false;
  private peakSus = 0;
  private started = false;

  /** Put the pilot back to a calm start (new scene, respawn). */
  reset(): void {
    this.mood = 'cruise';
    this.moodT = 0;
    this.wheel = this.lean = this.duck = this.squash = this.lookX = this.lookY = this.tongue = 0;
    this.antL = this.antR = this.antLv = this.antRv = 0;
    this.spin = this.hop = this.pick = this.handsUp = this.palms = this.shake = this.stars = 0;
    this.sweat = -1;
    this.turnRate = this.turnHold = this.dizzyT = this.phewT = this.parkedT = this.peakSus = 0;
    this.wasExposed = false;
    this.started = false;
  }

  /** Advance by `dt` seconds. `rm` = reduced motion: expressions change, nothing wobbles or spins. */
  update(dt: number, inp: PilotInput, rm: boolean): this {
    dt = clamp(dt, 0, 0.1);
    this.t += dt;
    const speed = Math.hypot(inp.vx, inp.vy);
    if (!this.started) {
      this.started = true;
      this.prevVx = inp.vx;
      this.prevVy = inp.vy;
      this.prevStun = inp.stun;
      this.heading = Math.atan2(inp.vy, inp.vx);
    }
    // screen-space acceleration and heading turn rate
    const ax = dt > 0 ? (inp.vx - this.prevVx) / dt : 0;
    const ay = dt > 0 ? (inp.vy - this.prevVy) / dt : 0;
    this.prevVx = inp.vx;
    this.prevVy = inp.vy;
    let rate = 0;
    if (speed > 40) {
      const h = Math.atan2(inp.vy, inp.vx);
      rate = dt > 0 ? wrap(h - this.heading) / dt : 0;
      this.heading = h;
    }
    this.turnRate += (rate - this.turnRate) * ease(14, dt);

    // ---- events
    const hit = inp.stun > this.prevStun + 0.01;
    this.prevStun = inp.stun;
    if (hit) {
      this.dizzyT = PILOT.dizzy;
      // the knock throws the antennae
      this.antLv += 9;
      this.antRv += 7;
    }
    this.dizzyT = Math.max(0, this.dizzyT - dt);
    if (inp.exposed) this.peakSus = Math.max(this.peakSus, inp.sus);
    else if (this.wasExposed) {
      if (this.peakSus >= PILOT.phewSus && inp.phase === 'fly') this.phewT = PILOT.phew;
      this.peakSus = 0;
    }
    this.wasExposed = inp.exposed;
    this.phewT = Math.max(0, this.phewT - dt);
    const sharp = speed > PILOT.turnSpeed && Math.abs(this.turnRate) > PILOT.turnRate;
    this.turnHold = sharp ? PILOT.turnHold : Math.max(0, this.turnHold - dt);
    this.parkedT = speed < PILOT.parked && inp.phase === 'fly' && !inp.exposed ? this.parkedT + dt : 0;

    // ---- mood, most urgent first
    let mood: PilotMood;
    if (inp.phase === 'spotted') mood = 'caught';
    else if (inp.phase === 'locking') mood = 'cheer';
    else if (this.dizzyT > 0) mood = 'dizzy';
    else if (inp.exposed) mood = 'panic';
    else if (this.phewT > 0) mood = 'phew';
    else if (inp.ghost > PILOT.innocentGhost) mood = 'innocent';
    else if (this.turnHold > 0) mood = 'turn';
    else if (speed > PILOT.maxSpeed * PILOT.zoomFrac) mood = 'zoom';
    else if (this.parkedT > PILOT.boredAfter) {
      const p = (this.parkedT - PILOT.boredAfter) % PILOT.loop;
      mood = p >= PILOT.yawnAt && p < PILOT.yawnEnd ? 'yawn' : p >= PILOT.pickAt && p < PILOT.pickEnd ? 'pick' : 'bored';
    } else mood = 'cruise';
    if (mood !== this.mood) {
      this.mood = mood;
      this.moodT = 0;
    } else this.moodT += dt;
    this.pose(dt, speed, ax, ay, inp, rm);
    return this;
  }

  private pose(dt: number, speed: number, ax: number, ay: number, inp: PilotInput, rm: boolean): void {
    const m = this.mood;
    const mt = this.moodT;
    const t = this.t;

    // wheel follows the turn; spins free when dizzy, jitters when panicking
    let wheelTo = clamp(this.turnRate * 0.32, -2.2, 2.2);
    if (m === 'caught' || m === 'cheer') wheelTo = 0;
    if (m === 'dizzy' && !rm) this.wheel += 9 * dt;
    else this.wheel += (wheelTo - this.wheel) * ease(m === 'turn' ? 16 : 9, dt);
    if (rm) this.wheel = clamp(this.wheel, -0.6, 0.6);

    // thrown sideways, away from the saucer's sideways acceleration (out of a turn, back on a shove)
    const leanTo = rm ? 0 : clamp(-ax * 0.0011, -1, 1);
    this.lean += (leanTo - this.lean) * ease(10, dt);
    const sqTo = m === 'turn' ? clamp(Math.abs(this.turnRate) / 6, 0.45, 1) : m === 'zoom' ? 0.35 : 0;
    this.squash += (sqTo - this.squash) * ease(12, dt);

    const duckTo = m === 'panic' ? 0.45 + 0.55 * clamp(inp.sus, 0, 1) : m === 'caught' ? 0.2 : 0;
    this.duck += (duckTo - this.duck) * ease(14, dt);

    // eyes look where the saucer is going; panic stares straight out
    let lx = speed > 30 ? clamp(inp.vx / 300, -1, 1) : 0;
    let ly = speed > 30 ? clamp(inp.vy / 300, -1, 1) : 0;
    if (m === 'panic') ((lx = 0), (ly = -0.2));
    if (m === 'bored' || m === 'yawn' || m === 'innocent') ((lx = Math.sin(t * 0.7) * 0.6), (ly = -0.5));
    if (rm) ((lx = 0), (ly = 0));
    this.lookX += (lx - this.lookX) * ease(10, dt);
    this.lookY += (ly - this.lookY) * ease(10, dt);
    this.tongue += (clamp(this.wheel * 0.7 + this.lean, -1, 1) - this.tongue) * ease(8, dt);

    // antennae: damped springs dragged by the saucer's acceleration (they lag, then boing)
    if (rm) {
      this.antL = this.antR = this.antLv = this.antRv = 0;
    } else {
      const stiff = m === 'panic' ? 260 : 90;
      const damp = m === 'panic' ? 9 : 5;
      // sideways acceleration drags both tips the other way; braking splays them apart
      const push = -ax * 0.024;
      const splay = clamp(ay * 0.0003, -0.4, 0.4);
      const wave = m === 'cheer' ? Math.sin(t * 16) * 0.35 : 0;
      const tremble = m === 'panic' ? Math.sin(t * 47) * 0.06 : 0;
      const droop = m === 'bored' || m === 'yawn' ? 0.35 : 0;
      const restL = -droop + wave + tremble - splay;
      const restR = droop - wave + tremble + splay;
      this.antLv += (-stiff * (this.antL - restL) - damp * this.antLv + push) * dt;
      this.antRv += (-stiff * (this.antR - restR) - damp * this.antRv + push) * dt;
      this.antL = clamp(this.antL + this.antLv * dt, -1.3, 1.3);
      this.antR = clamp(this.antR + this.antRv * dt, -1.3, 1.3);
    }

    this.spin = m === 'dizzy' && !rm ? this.spin + 11 * dt : 0;
    this.stars = m === 'dizzy' && !rm ? this.stars + 6 * dt : 0;
    this.hop = rm ? 0 : m === 'cheer' ? -Math.abs(Math.sin(mt * 9)) * 3.5 : m === 'zoom' ? Math.sin(t * 31) * 0.5 : 0;
    this.shake = rm || m !== 'panic' ? 0 : Math.sin(t * 61) * 0.7;
    this.sweat = m === 'panic' ? (rm ? 0.3 : (mt * 1.6) % 1) : -1;
    const pickTo = m === 'pick' ? 1 : 0;
    this.pick += (pickTo - this.pick) * ease(7, dt);
    this.handsUp += ((m === 'cheer' ? 1 : 0) - this.handsUp) * ease(14, dt);
    // the photo is taken on the first caught frame, so the scream pose snaps in
    this.palms = m === 'caught' ? 1 : this.palms * (1 - ease(18, dt));

    // face
    const blink = !rm && t % PILOT.blinkEvery < PILOT.blinkFor;
    this.mouthOpen = 0;
    switch (m) {
      case 'caught':
        this.eyes = 'wide';
        this.mouth = 'open';
        this.mouthOpen = rm ? 1 : 0.85 + 0.15 * Math.sin(t * 40);
        break;
      case 'cheer':
        this.eyes = 'happy';
        this.mouth = 'grin';
        break;
      case 'dizzy':
        this.eyes = rm ? 'x' : 'spin';
        this.mouth = 'wavy';
        break;
      case 'panic':
        this.eyes = 'wide';
        this.mouth = 'teeth';
        break;
      case 'phew':
        this.eyes = 'shut';
        this.mouth = 'puff';
        break;
      case 'innocent':
        this.eyes = 'lid';
        this.mouth = 'whistle';
        break;
      case 'zoom':
        this.eyes = blink ? 'shut' : 'wide';
        this.mouth = 'grin';
        break;
      case 'bored':
      case 'pick':
        this.eyes = 'lid';
        this.mouth = m === 'pick' ? 'tongue' : 'wavy';
        break;
      case 'yawn': {
        const k = mt / (PILOT.yawnEnd - PILOT.yawnAt);
        this.eyes = 'shut';
        this.mouth = 'open';
        this.mouthOpen = Math.sin(clamp(k, 0, 1) * Math.PI);
        break;
      }
      default:
        this.eyes = blink ? 'shut' : 'open';
        this.mouth = 'tongue';
    }
    // Zib's lines come out of this mouth
    if (inp.talking && (m === 'cruise' || m === 'turn' || m === 'bored' || m === 'innocent' || m === 'phew' || m === 'zoom')) {
      this.mouth = 'open';
      this.mouthOpen = rm ? 0.5 : 0.25 + 0.6 * Math.abs(Math.sin(t * 13));
    }
  }
}
