// Human-model players for the difficulty evaluator (see .claude/skills/evaluate-difficulty).
//
// The solvability autopilots play with perfect timing and a glacial, steady hand. That proves a
// route can be done, not that a person can do it. These wrappers run the same route planners
// through a "hand" that a person actually has:
//   - pace: drag speed as a multiple of the autopilot's cruise (people drag 2-4x faster),
//   - reaction: the hand executes the plan this many seconds late (sees, then moves),
//   - jitter: smooth tremor/wobble added to the finger or beam position (px),
//   - fresh hazard phase on every run (start delay) and a seeded RNG, so runs are repeatable.
import type { AbductRules, RoomId, UpgradeId } from '../../src/contracts';
import { AbductPilot } from '../../src/abduct/autopilot';
import { ROOMS } from '../../src/abduct/rooms';
import { AbductSimulation } from '../../src/abduct/simulation';
import { FlightAutopilot } from '../../src/flight/autopilot';
import type { DeepFlightSim } from '../../src/flight/deep-sim';
import type { DeepMap } from '../../src/levels/types';
import { runHeadless, type Controller, type HeadlessResult } from '../flight-deep-harness';

export interface HumanProfile {
  name: string;
  /** Multiplier on the abduction autopilot's drag speed. */
  pace: number;
  /** Seconds between seeing and doing. */
  reaction: number;
  /** Peak hand wobble, logical px (a few Hz). */
  jitter: number;
  /** Peak slow wander off the ideal line, logical px (well under 1 Hz): not knowing the route. */
  drift: number;
}

/** Calibrated against real play: "skilled" is a practised player, "casual" a first evening. */
export const PROFILES = {
  bot: { name: 'bot', pace: 1, reaction: 0, jitter: 0, drift: 0 },
  skilled: { name: 'skilled', pace: 2.2, reaction: 0.18, jitter: 4, drift: 10 },
  casual: { name: 'casual', pace: 3, reaction: 0.28, jitter: 7, drift: 20 },
} as const satisfies Record<string, HumanProfile>;

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth two-axis wobble: a few incommensurate sines with random phases. */
function tremor(random: () => number, amplitude: number, hz = 1): (t: number) => { x: number; y: number } {
  const waves = Array.from({ length: 3 }, (_, i) => ({
    f: (0.7 + random() * 0.9) * (i + 1) * hz,
    px: random() * Math.PI * 2,
    py: random() * Math.PI * 2,
    a: amplitude / (i + 1.5),
  }));
  return (t) => {
    let x = 0;
    let y = 0;
    for (const w of waves) {
      x += w.a * Math.sin(t * w.f * Math.PI * 2 + w.px);
      y += w.a * Math.sin(t * w.f * Math.PI * 2 + w.py);
    }
    return { x, y };
  };
}

// ------------------------------------------------------------------ abduction

export interface AbductRun {
  delivered: boolean;
  failReason?: string;
  failBy?: string;
  timeSec: number;
  bonks: number;
  /** Highest specimen wake meter reached, 0..100. */
  peakWake: number;
  /** Highest second-sleeper wake reached, 0..100 (0 when there is none). */
  peakSleeper: number;
  /** Highest camera fuse reached, 0..1. */
  peakCamera: number;
  /** Checkpoint the hand was steering to when the run ended, and where the chest was. */
  stall: { checkpoint: number; x: number; y: number };
  /** Times the hand had to drag back to a snagged body. */
  recoveries: number;
  /** L5 pier code: lowest moisture reached (1 = no sheath) and whether she dried out. */
  minMoisture: number;
  driedOut: boolean;
}

export const HARD_RULES: AbductRules = { wakeFails: true, hard: true };
const DT = 1 / 60;

export function playAbduction(
  id: RoomId, profile: HumanProfile, seed: number, rules: AbductRules = HARD_RULES, upgrades: readonly UpgradeId[] = [],
): AbductRun {
  const random = rng(seed * 7919 + 17);
  const room = ROOMS[id];
  // A person hears a creak or a rattle and eases off for a moment.
  let heard = -Infinity;
  const ears = { sfx(name: string) { if (name === 'creak' || name === 'crash') heard = sim?.elapsed ?? 0; } };
  const sim: AbductSimulation = new AbductSimulation(room, new Set(upgrades), ears, rng(seed), rules);
  const pilot = new AbductPilot(room, profile.pace);
  const shake = tremor(random, profile.jitter);
  const wander = tremor(random, profile.drift, 0.18);
  const wobble = (t: number) => {
    const a = shake(t);
    const b = wander(t);
    return { x: a.x + b.x, y: a.y + b.y };
  };
  const lag = Math.round(profile.reaction / DT);
  // Hand plan (where the player means the beam to be) and the queue of what the hand actually does.
  let planX = sim.body.beamX;
  let planY = sim.body.beamY;
  const queue: { x: number; y: number }[] = Array.from({ length: lag }, () => ({ x: planX, y: planY }));
  // Fresh hazard phase: the player looks at the room for a moment before grabbing.
  const wait = Math.floor(random() * 8 * 60);
  for (let f = 0; f < wait; f++) sim.update(DT);
  const t0 = sim.elapsed;
  let peakWake = 0;
  let peakSleeper = 0;
  let peakCamera = 0;
  let snag = 0;
  let snagX = 0;
  let snagY = 0;
  let recoveries = 0;
  let minMoisture = 1;
  while (sim.elapsed - t0 < 180 && !sim.complete) {
    const { body } = sim;
    pilot.pace = sim.elapsed - heard < 2.5 ? Math.min(profile.pace, 1.4) : profile.pace;
    const realX = body.beamX;
    const realY = body.beamY;
    // Plan from where the hand is heading, not where the lagging beam is.
    body.beamX = planX;
    body.beamY = planY;
    const { dx, dy } = sim.delivered || sim.failure ? { dx: 0, dy: 0 } : pilot.move(body, sim.elapsed, sim.interior);
    body.beamX = realX;
    body.beamY = realY;
    planX += dx;
    planY += dy;
    queue.push({ x: planX, y: planY });
    const hand = queue.shift()!;
    // A person sees the body snag and the beam run on ahead, and drags back to it.
    // Snagged = the beam is well ahead and the body has barely moved for half a second.
    const lead = Math.hypot(body.beamX - body.chestX, body.beamY - body.chestY);
    if (lead > 150) {
      if (snag === 0) {
        snagX = body.chestX;
        snagY = body.chestY;
      }
      snag += DT;
      if (Math.hypot(body.chestX - snagX, body.chestY - snagY) > 50) snag = 0;
    } else snag = 0;
    if (snag > 0.5 + profile.reaction) {
      snag = 0;
      recoveries++;
      planX = body.chestX;
      planY = body.chestY - 40;
      pilot.rewindTo(body.chestX, body.chestY);
      queue.fill({ x: planX, y: planY });
    }
    const w = wobble(sim.elapsed);
    sim.moveBeam(hand.x + w.x, hand.y + w.y);
    sim.update(DT);
    peakWake = Math.max(peakWake, sim.wake.value);
    for (const s of sim.interior?.sleepers ?? []) peakSleeper = Math.max(peakSleeper, s.wake);
    peakCamera = Math.max(peakCamera, sim.interior?.exposure ?? 0);
    if (sim.wet?.sheathed) minMoisture = Math.min(minMoisture, sim.wet.level);
  }
  const result = sim.result();
  return {
    delivered: result.delivered,
    failReason: result.failReason ?? (result.delivered ? undefined : 'timeout'),
    failBy: result.failBy,
    timeSec: sim.elapsed - t0,
    bonks: result.bonks,
    peakWake: Math.round(peakWake),
    peakSleeper: Math.round(peakSleeper),
    peakCamera: Math.round(peakCamera * 100) / 100,
    recoveries,
    minMoisture: Math.round(minMoisture * 100) / 100,
    driedOut: !!sim.wet?.dried,
    stall: { checkpoint: pilot.checkpoint, x: Math.round(sim.body.chestX), y: Math.round(sim.body.chestY) },
  };
}

// ------------------------------------------------------------------ flight

/** Continuous steering lag: people track their own saucer smoothly, a beat behind. */
const MOTOR_LAG = 0.08;

/**
 * The flight autopilot's plan, with a person's reaction: when the right move changes (wait →
 * go, go → wait, dash), the thumb keeps doing what it was doing for `reaction` seconds before it
 * follows. Steering itself runs a short motor lag behind, with tremor and drift on top.
 */
export function humanFlightController(profile: HumanProfile, seed: number, dash = false): (sim: DeepFlightSim) => Controller {
  return (sim) => {
    const ap = new FlightAutopilot(sim, undefined, dash);
    const random = rng(seed * 104729 + 3);
    const shake = tremor(random, profile.jitter * 2.5);
    const wander = tremor(random, profile.drift * 2.5, 0.18);
    const lag = Math.round(Math.min(profile.reaction, MOTOR_LAG) / DT);
    const queue: { down: boolean; x: number; y: number }[] = Array.from({ length: lag }, () => ({ down: false, x: 0, y: 0 }));
    let mode = '';
    let frozenUntil = -1;
    const held = { down: false, dx: 0, dy: 0 };
    const c: Controller = () => {
      const it = ap.intent();
      const t = sim.st.t;
      const sx = sim.saucer.x - sim.camX;
      const sy = sim.saucer.y - sim.camY;
      if (ap.last.mode !== mode) {
        if (mode !== '') frozenUntil = t + profile.reaction;
        mode = ap.last.mode;
      }
      queue.push({ down: it.down, x: it.x, y: it.y });
      let hand = queue.shift()!;
      if (t < frozenUntil) hand = { down: held.down, x: sx + held.dx, y: sy + held.dy };
      else {
        held.down = hand.down;
        held.dx = hand.x - sx;
        held.dy = hand.y - sy;
      }
      const a = shake(t);
      const b = wander(t);
      return { down: hand.down, x: hand.x + a.x + b.x, y: hand.y + a.y + b.y };
    };
    c.note = () => JSON.stringify(ap.last);
    return c;
  };
}

export interface FlightRun extends HeadlessResult {
  seed: number;
}

export function playFlight(map: DeepMap, profile: HumanProfile, seed: number, upgrades: UpgradeId[] = [], limitSec = 420): FlightRun {
  const start = rng(seed)() * 9;
  const r = runHeadless(map, upgrades, humanFlightController(profile, seed, upgrades.includes('afterburner')), limitSec, false, start);
  return { ...r, seed };
}
