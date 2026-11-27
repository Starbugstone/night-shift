// Human-model players for the difficulty evaluator (see .claude/skills/evaluate-difficulty).
//
// The solvability autopilots play with perfect timing and a glacial, steady hand. That proves a
// route can be done, not that a person can do it. These wrappers run the same route planners
// through a "hand" that a person actually has:
//   - pace: drag speed as a multiple of the autopilot's cruise (people drag 2-4x faster),
//   - reaction: the hand executes the plan this many seconds late (sees, then moves),
//   - jitter: smooth tremor/wobble added to the finger or beam position (px),
//   - fresh hazard phase on every run (start delay) and a seeded RNG, so runs are repeatable.
import type { AbductResult, AbductRules, FlightAutopilotIntent, RoomId, UpgradeId } from '../../src/contracts';
import { SouvenirAttempt } from './souvenir';
import { AbductPilot } from '../../src/abduct/autopilot';
import { solidRect } from '../../src/abduct/interior';
import { ROOMS } from '../../src/abduct/rooms';
import type { Room } from '../../src/abduct/rooms/layout';
import { AbductSimulation } from '../../src/abduct/simulation';
import { Contact } from '../../src/abduct/ragdoll';
import { POINT, clampToScreen, pointReach } from '../../src/abduct/point';
import { roomChargesShift } from '../../src/levels/run';
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
  result: AbductResult;
  delivered: boolean;
  captured: boolean;
  failReason?: string;
  failBy?: string;
  timeSec: number;
  /** Wall clock in the room, including the initial wait and the outcome animation. */
  clockSec: number;
  /** Shift clock the room charges, as the game counts it (`roomChargesShift`): the wait, the play and a failure's animation, not a delivery's exit animation. */
  shiftSec: number;
  bonks: number;
  /** Highest specimen wake meter reached, 0..100. */
  peakWake: number;
  /** Highest second-sleeper wake reached, 0..100 (0 when there is none). */
  peakSleeper: number;
  /** Highest camera fuse reached, 0..1. */
  peakCamera: number;
  /** The model approached a real obstacle or engaged a room hazard after leaving spawn. */
  approachedObstacle: boolean;
  /** Checkpoint the hand was steering to when the run ended, and where the chest was. */
  stall: { checkpoint: number; x: number; y: number };
  /** Times the hand had to drag back to a snagged body. */
  recoveries: number;
  /** L5 pier code: lowest moisture reached (1 = no sheath) and whether she dried out. */
  minMoisture: number;
  driedOut: boolean;
}

/**
 * Where the finger presses to move the beam toward where the hand means it to be, through the live touch path
 * (`AbductSimulation.pointAt`, what src/abduct/index.ts calls for a held finger): the finger is held
 * ahead of the beam and the beam heads for it at `pointStep`, so it never beats the `POINT.max` touch
 * speed cap. The finger placement is the one `AbductSimulation.autopilotFinger` uses, and like a real
 * thumb it stays on the screen (`clampToScreen`): a hand that would reach past the edge presses on it.
 */
function touchFinger(sim: AbductSimulation, x: number, y: number): { x: number; y: number } {
  const { body } = sim;
  const dx = x - body.beamX;
  const dy = y - body.beamY;
  const d = Math.hypot(dx, dy);
  const origin = sim.screenOrigin;
  if (d === 0) return clampToScreen(body.beamX - origin.x, body.beamY - origin.y);
  const speed = Math.min(d / DT, POINT.max);
  const reach = speed < POINT.min ? POINT.dead + d : pointReach(speed);
  return clampToScreen(body.beamX + dx / d * reach - origin.x, body.beamY + dy / d * reach - origin.y);
}

/**
 * Where the model's hand meets the room. Each frame it gets the screen point the finger presses
 * (null: lifted), then the room steps once. `charged` is the shift time spent so far.
 */
export interface RoomHost {
  readonly sim: AbductSimulation;
  frame(finger: { x: number; y: number } | null): void;
  readonly charged: number;
}

export interface RoomSetup {
  room: Room;
  random: () => number;
  audio: { sfx(name: string): void };
  rules: AbductRules;
  upgrades: ReadonlySet<UpgradeId>;
}

/**
 * The default host: the room simulation on its own, the finger through `pointAt` and the shift
 * charged with `roomChargesShift`. tests/levels-difficulty-clock.test.ts plays the same hands
 * through the game's own scenes (createAbductScene in a DeepAbductScene) and checks both agree.
 */
export function simulationHost({ room, random, audio, rules, upgrades }: RoomSetup): RoomHost {
  const sim = new AbductSimulation(room, new Set(upgrades), audio, random, rules);
  let frames = 0;
  return {
    sim,
    frame(finger) {
      if (finger) sim.pointAt(finger.x, finger.y, DT);
      if (roomChargesShift(sim)) frames++;
      sim.update(DT);
    },
    get charged() { return frames * DT; },
  };
}

export const HARD_RULES: AbductRules = { wakeFails: true, hard: true };
export const OBSTACLE_NEAR_PX = 80;
const DT = 1 / 60;

export function playAbduction(
  id: RoomId | Room, profile: HumanProfile, seed: number, rules: AbductRules = HARD_RULES, upgrades: readonly UpgradeId[] = [],
  goal: 'exit' | 'souvenir' = 'exit', host: (setup: RoomSetup) => RoomHost = simulationHost,
): AbductRun {
  const random = rng(seed * 7919 + 17);
  const room = typeof id === 'string' ? ROOMS[id] : id;
  // A person hears a creak or a rattle and eases off for a moment.
  let heard = -Infinity;
  const ears = { sfx(name: string) { if (name === 'creak' || name === 'crash') heard = sim?.elapsed ?? 0; } };
  const stage = host({ room, random: rng(seed), audio: ears, rules, upgrades: new Set(upgrades) });
  const sim: AbductSimulation = stage.sim;
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
  const detour = goal === 'souvenir' ? new SouvenirAttempt(room, { x: planX, y: planY }) : undefined;
  const queue: { x: number; y: number }[] = Array.from({ length: lag }, () => ({ x: planX, y: planY }));
  // Fresh hazard phase: the player looks at the room for a moment before grabbing.
  const wait = Math.floor(random() * 8 * 60);
  for (let f = 0; f < wait; f++) stage.frame(null);
  const t0 = sim.elapsed;
  let peakWake = 0;
  let peakSleeper = 0;
  let peakCamera = 0;
  let snag = 0;
  let snagX = 0;
  let snagY = 0;
  let recoveries = 0;
  let minMoisture = 1;
  let approachedObstacle = false;
  const approach = new Contact();
  const hazardAreas = room.interior?.building.hazards.flatMap(hazard => 'area' in hazard ? [solidRect(hazard.area)] : []) ?? [];
  let frames = wait;
  // Grail exits take a still passenger, and the room tells the player to let go in the opening
  // (en.grail.settle, the L10 memo). A person sees the settle bar and lifts the thumb one reaction
  // later, which parks the beam; they take hold again if the body swings back out of the zone.
  let settling = 0;
  while (sim.elapsed - t0 < 180 && !sim.complete) {
    const { body } = sim;
    pilot.pace = sim.elapsed - heard < 2.5 ? Math.min(profile.pace, 1.4) : profile.pace;
    const realX = body.beamX;
    const realY = body.beamY;
    // Plan from where the hand is heading, not where the lagging beam is.
    body.beamX = planX;
    body.beamY = planY;
    const { dx, dy } = sim.delivered || sim.failure
      ? { dx: 0, dy: 0 }
      : detour?.move(sim, pilot.pace, DT) ?? pilot.move(body, sim.elapsed, sim.interior);
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
    settling = sim.grailExit?.inside ? settling + DT : 0;
    stage.frame(settling === 0 || settling < profile.reaction ? touchFinger(sim, hand.x + w.x, hand.y + w.y) : null);
    frames++;
    peakWake = Math.max(peakWake, sim.wake.value);
    for (const s of sim.interior?.sleepers ?? []) peakSleeper = Math.max(peakSleeper, s.wake);
    peakCamera = Math.max(peakCamera, sim.interior?.exposure ?? 0);
    if (sim.wet?.sheathed) minMoisture = Math.min(minMoisture, sim.wet.level);
    if (!approachedObstacle && frames % 6 === 0 && Math.hypot(body.chestX - room.pose.neckX, body.chestY - room.pose.neckY) > 160) {
      approachedObstacle = peakWake > 0 || peakSleeper > 0 || peakCamera > 0 || minMoisture < 0.95 ||
        (sim.interior?.probes?.drones.some(drone => drone.fill > 0 || drone.done) ?? false);
      for (const area of hazardAreas) {
        if (approachedObstacle) break;
        approachedObstacle = approach.find(body.chestX, body.chestY, OBSTACLE_NEAR_PX, area);
      }
      for (let i = sim.wallCount; i < sim.solids.length && !approachedObstacle; i++) {
        approachedObstacle = approach.find(body.chestX, body.chestY, OBSTACLE_NEAR_PX, sim.solids[i]!);
      }
    }
  }
  const result = sim.result();
  return {
    result,
    delivered: result.delivered,
    captured: sim.item.captured,
    failReason: result.failReason ?? (result.delivered ? undefined : 'timeout'),
    failBy: result.failBy,
    timeSec: sim.elapsed - t0,
    clockSec: frames * DT,
    shiftSec: stage.charged,
    bonks: result.bonks,
    peakWake: Math.round(peakWake),
    peakSleeper: Math.round(peakSleeper),
    peakCamera: Math.round(peakCamera * 100) / 100,
    approachedObstacle,
    recoveries,
    minMoisture: Math.round(minMoisture * 100) / 100,
    driedOut: !!sim.wet?.dried,
    stall: { checkpoint: pilot.checkpoint, x: Math.round(sim.body.chestX), y: Math.round(sim.body.chestY) },
  };
}

// ------------------------------------------------------------------ flight

/** Continuous steering lag: people track their own saucer smoothly, a beat behind. */
const MOTOR_LAG = 0.08;

export function humanSteering(profile: HumanProfile, seed: number) {
  const random = rng(seed * 104729 + 3);
  const shake = tremor(random, profile.jitter * 2.5);
  const wander = tremor(random, profile.drift * 2.5, 0.18);
  const lag = Math.round(Math.min(profile.reaction, MOTOR_LAG) / DT);
  const queue = Array.from({ length: lag }, () => ({ down: false, x: 0, y: 0 }));
  let mode = '';
  let frozenUntil = -1;
  const held = { down: false, dx: 0, dy: 0 };
  return (it: FlightAutopilotIntent, t: number, sx: number, sy: number, nextMode: string) => {
    if (nextMode !== mode) {
      if (mode !== '') frozenUntil = t + profile.reaction;
      mode = nextMode;
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
}

/**
 * The flight autopilot's plan, with a person's reaction: when the right move changes (wait →
 * go, go → wait), the thumb keeps doing what it was doing for `reaction` seconds before it
 * follows. Steering itself runs a short motor lag behind, with tremor and drift on top.
 */
export function humanFlightController(profile: HumanProfile, seed: number): (sim: DeepFlightSim) => Controller {
  return (sim) => {
    const ap = new FlightAutopilot(sim);
    const hand = humanSteering(profile, seed);
    const c: Controller = () => {
      const it = ap.intent();
      const sx = sim.saucer.x - sim.camX;
      const sy = sim.saucer.y - sim.camY;
      return hand(it, sim.st.t, sx, sy, ap.last.mode);
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
  const r = runHeadless(map, upgrades, humanFlightController(profile, seed), limitSec, false, start);
  return { ...r, seed };
}
