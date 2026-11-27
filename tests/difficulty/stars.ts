// Drive the flight scenes without a view, then score their full attempts with the game's star rules.
import type { FlightAutopilotIntent, FlightResult, GameContext, PointerState, RoomId, Vec2 } from '../../src/contracts';
import { FlightAutopilot } from '../../src/flight/autopilot';
import { DeepFlightScene, SPOT_HOLD } from '../../src/flight/deep-scene';
import { FlightScene } from '../../src/flight/scene';
import { computeDeepStars, computeStars } from '../../src/levels/progress';
import { LEVELS } from '../../src/levels/levels';
import { DeepRun } from '../../src/levels/run';
import type { Stars } from '../../src/levels/save';
import type { DeepLevelDef, LevelDef, TutorialLevelDef } from '../../src/levels/types';
import { BakeryFirstRead, BirchPickupFirst, isBirch, NeighboursCut } from './birch';
import { shrubberyDetour } from './grail';
import { towelDetour } from './towel';
import { LegFirst } from './drive-in';
import { CarFirst, type CarAttempt } from './time-car';
import { humanFlightController, humanSteering, playAbduction, rng, type AbductRun, type HumanProfile } from './human';

const DT = 1 / 60;
const TUTORIAL_RULES = { wakeFails: false, hard: false };

interface Sighting {
  leg: number;
  hazard: number;
  cause: string;
  x: number;
  y: number;
  t: number;
  /** Seconds contributed by each detector since the fuse was last empty. */
  exposure: Record<number, number>;
}

export interface StarRun {
  seed: number;
  stars: Stars;
  seconds: number;
  rooms: RoomId[];
  sightings: Sighting[];
  roomFailures: string[];
  tutorialSpots?: number;
  tutorialObstacle?: boolean;
  peakSuspicion: number;
  car?: CarAttempt;
  legs?: readonly { seconds: number; room: RoomId }[];
  tripodLeg?: boolean;
}

type FirstAbduction = (room: RoomId, profile: HumanProfile, seed: number) => AbductRun;

function flightContext(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined },
    audio: { sfx() {} },
    upgrades: new Set(),
    tutorial: false,
    time: 0,
    reducedMotion: false,
  };
}

const RETRY_TAP: FlightAutopilotIntent = { down: true, x: 270, y: 480 };
const TUTORIAL_RETRY_TAP_SEC = 3.4;

function steer(pointer: PointerState, hand?: FlightAutopilotIntent): void {
  const down = hand?.down ?? false;
  pointer.pressed = down && !pointer.down;
  pointer.released = !down && pointer.down;
  pointer.down = down;
  if (hand) {
    pointer.x = hand.x;
    pointer.y = hand.y;
  }
}

function deepShift(level: DeepLevelDef, profile: HumanProfile, seed: number, firstAbduction: FirstAbduction, detour?: 'birch' | 'shrubbery' | 'car' | 'towel' | 'tripod', order?: number[]): StarRun {
  const ctx = flightContext();
  const shift = new DeepRun(level, LEVELS.findIndex(l => l.id === level.id));
  shift.tick(rng(seed)() * 9);
  const sightings: Sighting[] = [];
  const rooms: RoomId[] = [];
  const roomFailures: string[] = [];
  let peakSuspicion = 0;
  let car: CarFirst | undefined;
  let tripod: LegFirst | undefined;
  let birch: BirchPickupFirst | undefined;
  const legs: { seconds: number; room: RoomId }[] = [];
  const limit = level.clockMode === 'elapsed' ? 180 : Infinity;
  while (shift.phase === 'flight' && shift.elapsed < limit) {
    const flight = new DeepFlightScene({
      ctx, level, run: shift,
      onLocked: (target, entry) => { shift.startAbduct(target, entry); },
      onSunrise() {},
      onQuit() { throw new Error('Difficulty player quit flight'); },
    });
    const { sim } = flight;
    const orderedPilot = order && new FlightAutopilot(sim, order);
    const controller = orderedPilot ? () => orderedPilot.intent() : humanFlightController(profile, seed + shift.legs * 1009)(sim);
    if (detour === 'car' && !car && sim.collectible?.timeCar) car = new CarFirst(sim, profile, seed);
    if (detour === 'birch' && !birch && isBirch(level.id)) birch = new BirchPickupFirst(sim, profile, seed);
    if (detour === 'tripod' && !tripod) tripod = new LegFirst(sim, profile, seed);
    // a person reads the opening first; the autopilots (the bot, the honest hand) fly the plan
    const firstLeg = !detour && shift.legs === 0 && profile.reaction > 0;
    const read = firstLeg && level.id === 'birch_bakery' ? new BakeryFirstRead(sim, profile, seed)
      : firstLeg && level.id === 'birch_neighbours' ? new NeighboursCut(sim, profile, seed) : undefined;
    const legStart = shift.elapsed;
    const hedge = detour === 'shrubbery' && level.id === 'level10' && shift.legs > 0 && sim.collectible?.available ? shrubberyDetour(sim, profile, seed) : undefined;
    const towel = detour === 'towel' && !sim.collectible!.collected ? towelDetour(sim, profile, seed) : undefined;
    let exposure: Record<number, number> | undefined;
    while (shift.phase === 'flight' && shift.elapsed < limit) {
      const wasFlying = flight.state === 'fly';
      // the SPOTTED card waits for a tap: the player taps when it used to close by itself
      const pursuit = car ?? tripod;
      const chase = wasFlying && pursuit?.active ? pursuit : undefined;
      steer(ctx.pointer, wasFlying ? (hedge && sim.collectible?.available ? hedge() : chase?.steer() ?? (towel && !sim.collectible!.collected ? towel() : birch?.active ? birch.steer() : read?.active ? read.steer() : controller(sim))) : flight.state === 'spotted' && flight.st >= SPOT_HOLD ? RETRY_TAP : undefined);
      ctx.time += DT;
      flight.update(DT);
      chase?.record();
      peakSuspicion = Math.max(peakSuspicion, sim.suspicion);
      if (sim.suspicion === 0) exposure = undefined;
      if (wasFlying && sim.st.cause >= 0) {
        const h = sim.st.cause;
        exposure ??= {};
        exposure[h] = (exposure[h] ?? 0) + DT;
      }
      if (wasFlying && sim.phase === 'spotted') {
        const h = sim.spottedBy;
        sightings.push({
          leg: shift.legs + 1, hazard: h, cause: sim.field.spotCause(h),
          x: Math.round(sim.saucer.x), y: Math.round(sim.saucer.y),
          t: shift.elapsed, exposure: exposure ?? {},
        });
      }
    }

    if (shift.current) legs.push({ seconds: shift.elapsed - legStart, room: shift.current.roomId });
    let attempt = 0;
    while (shift.current && shift.remaining > 0 && shift.elapsed < limit) {
      const { roomId } = shift.current;
      rooms.push(roomId);
      const run = attempt === 0 ? firstAbduction(roomId, profile, seed) : playAbduction(roomId, profile, seed + attempt * 1013);
      // A room that never reaches an outcome still spends the simulated time. Leave it
      // undelivered if the hand gives up at the model's timeout. The shift clock stops when the
      // room accepts the specimen, as in the game (roomChargesShift).
      if (shift.tick(run.shiftSec)) break;
      if (!run.delivered) roomFailures.push(`${roomId}: ${run.failReason}${run.failBy ? ` (${run.failBy})` : ''}`);
      if (run.failReason === 'timeout') break;
      if (shift.finishAbduct(run.result) !== 'choice') break;
      shift.retry();
      attempt++;
    }
  }
  return {
    seed,
    stars: computeDeepStars(level.budgetSec, level.parMarginSec, shift.summary(), level.id),
    seconds: shift.elapsed,
    rooms,
    sightings,
    roomFailures,
    peakSuspicion,
    ...(car ? { car: car.result() } : {}),
    ...(isBirch(level.id) || level.id === 'level3' ? { legs } : {}),
    ...(tripod ? { tripodLeg: tripod.caught } : {}),
  };
}

/** One whole deep shift with no detour (tests/difficulty/honest-pace.ts). */
export function deepShiftRun(level: DeepLevelDef, profile: HumanProfile, seed: number, play: FirstAbduction): StarRun {
  return deepShift(level, profile, seed, play);
}

// The safe approach waypoints used by scripts/e2e-playthrough.cjs, one route per entry.
const APPROACHES: Partial<Record<RoomId, Vec2[]>> = {
  farm_chimney: [{ x: 150, y: 1500 }, { x: 150, y: 450 }],
  farm_window: [{ x: 150, y: 1400 }, { x: 150, y: 590 }],
  // L2 from the Route 9 launch: up the west side, through the gap by the diner, east under the EAT neon
  laundry_skylight: [{ x: 300, y: 1400 }, { x: 300, y: 785 }, { x: 640, y: 785 }],
  laundry_loading: [{ x: 300, y: 1500 }, { x: 300, y: 785 }, { x: 640, y: 785 }, { x: 640, y: 330 }],
};

function tutorialAttempt(level: TutorialLevelDef, entry: TutorialLevelDef['map']['entries'][number], profile: HumanProfile, seed: number): StarRun {
  const approach = APPROACHES[entry.roomId];
  if (!approach) throw new Error(`Missing tutorial approach to ${entry.roomId}`);
  const route = [...approach, entry];
  const ctx = flightContext();
  const completed: FlightResult[] = [];
  const hand = humanSteering(profile, seed);
  const scene = new FlightScene({
    ctx, level, spotted: 0,
    onLocked: (result) => completed.push(result),
    onQuit() { throw new Error('Difficulty player quit tutorial flight'); },
  });
  for (let f = Math.floor(rng(seed)() * 9 / DT); f > 0; f--) scene.update(DT);
  scene.time = 0;
  let waypoint = 0;
  let t = 0;
  let peakSuspicion = 0;
  while (!completed.length && t < 120) {
    if (scene.state === 'fly') {
      const s = scene.saucer;
      const aim = route[waypoint]!;
      const sx = s.x - scene.camX;
      const sy = s.y - scene.camY;
      const dx = aim.x - s.x;
      const dy = aim.y - s.y;
      const d = Math.hypot(dx, dy);
      const last = waypoint === route.length - 1;
      const lead = last ? Math.min(170, d * 0.9) : 170;
      const damp = last ? 0.35 : 0.1;
      const down = !last || d >= 22;
      steer(ctx.pointer, hand({
        down,
        x: sx + dx / Math.max(1, d) * lead - s.vx * damp,
        y: sy + dy / Math.max(1, d) * lead - s.vy * damp,
      }, t, sx, sy, down ? String(waypoint) : 'hover'));
      if (!last && d < 50) waypoint++;
    } else {
      // the SPOTTED card waits for a tap: the player taps when it used to close by itself (3.4 s)
      steer(ctx.pointer, scene.state === 'spotted' && scene.st >= TUTORIAL_RETRY_TAP_SEC ? RETRY_TAP : undefined);
      if (scene.state === 'spotted') waypoint = 0;
    }
    t += DT;
    scene.update(DT);
    peakSuspicion = Math.max(peakSuspicion, scene.suspicion);
  }
  const flight = completed[0];
  const room = flight && playAbduction(flight.roomId, profile, seed, TUTORIAL_RULES);
  return {
    seed,
    stars: room && flight ? computeStars(level.parSec, room.result, flight, level.map.collectible?.id) : [false, false, false, false],
    seconds: flight ? flight.timeSec + (room ? room.result.timeSec : 0) : t,
    rooms: flight ? [flight.roomId] : [],
    sightings: [],
    roomFailures: room && !room.delivered ? [`${flight.roomId}: ${room.failReason}`] : [],
    tutorialSpots: scene.spotted,
    tutorialObstacle: room?.approachedObstacle,
    peakSuspicion,
  };
}

export function evaluateBirchDetours(level: DeepLevelDef, profile: HumanProfile, seeds: number, play: FirstAbduction) {
  const runs = Array.from({ length: seeds }, (_, i) => deepShift(level, profile, i + 1, play, 'birch'));
  return {
    profile: profile.name,
    attempts: runs.length,
    fourth: runs.filter(run => run.stars[3]).length,
    allFour: runs.filter(run => run.stars.every(Boolean)).length,
    runs,
  };
}

export interface StarReport {
  profile: string;
  /** Earned counts in the game's star order. */
  earned: [number, number, number];
  attempts: number;
  runs: StarRun[];
}

export function evaluateStars(level: LevelDef, profile: HumanProfile, seeds: number, firstAbduction: FirstAbduction, order?: number[]): StarReport {
  const runs: StarRun[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    if (level.kind === 'deep') runs.push(deepShift(level, profile, seed, firstAbduction, undefined, order));
    else for (const entry of level.map.entries) runs.push(tutorialAttempt(level, entry, profile, seed));
  }
  const earned: StarReport['earned'] = [0, 0, 0];
  for (const run of runs) {
    if (run.stars[0]) earned[0]++;
    if (run.stars[1]) earned[1]++;
    if (run.stars[2]) earned[2]++;
  }
  return { profile: profile.name, earned, attempts: runs.length, runs };
}

export function evaluateShrubbery(level: DeepLevelDef, profile: HumanProfile, seeds: number, play: FirstAbduction) {
  const runs = Array.from({ length: seeds }, (_, i) => deepShift(level, profile, i + 1, play, 'shrubbery'));
  return { profile: profile.name, fourthStars: runs.filter(run => run.stars[3]).length, attempts: seeds };
}

export interface CarReport {
  profile: string;
  attempts: number;
  catches: number;
  delivered: number;
  fourthStars: number;
  allFour: number;
  runs: StarRun[];
}

export function evaluateCarFirst(level: DeepLevelDef, profile: HumanProfile, seeds: number, play: FirstAbduction): CarReport {
  const runs = Array.from({ length: seeds }, (_, i) => deepShift(level, profile, i + 1, play, 'car'));
  return {
    profile: profile.name,
    attempts: seeds,
    catches: runs.filter(r => r.car?.caughtAt !== undefined).length,
    delivered: runs.filter(r => r.stars[0]).length,
    fourthStars: runs.filter(r => r.stars[3]).length,
    allFour: runs.filter(r => r.stars.every(Boolean)).length,
    runs,
  };
}

export function evaluateTowelFirst(level: DeepLevelDef, profile: HumanProfile, seeds: number, play: FirstAbduction) {
  const runs = Array.from({ length: seeds }, (_, i) => deepShift(level, profile, i + 1, play, 'towel'));
  return { profile: profile.name, attempts: seeds, fourthStars: runs.filter(r => r.stars[3]).length, runs };
}

export interface TripodReport {
  profile: string;
  attempts: number;
  catches: number;
  fourthStars: number;
  runs: StarRun[];
}

export function evaluateTripodFirst(level: DeepLevelDef, profile: HumanProfile, seeds: number, play: FirstAbduction): TripodReport {
  const runs = Array.from({ length: seeds }, (_, i) => deepShift(level, profile, i + 301, play, 'tripod'));
  return {
    profile: profile.name,
    attempts: seeds,
    catches: runs.filter(run => run.tripodLeg).length,
    fourthStars: runs.filter(run => run.stars[3]).length,
    runs,
  };
}
