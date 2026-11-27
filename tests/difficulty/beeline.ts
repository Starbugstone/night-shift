import type { GameContext, RoomId } from '../../src/contracts';
import { ROOMS } from '../../src/abduct/rooms';
import { AbductSimulation } from '../../src/abduct/simulation';
import { steerTo } from './birch';
import { FlightScene } from '../../src/flight/scene';
import type { DeepLevelDef, LevelDef, TutorialLevelDef } from '../../src/levels/types';
import { beelineController, runHeadless } from '../flight-deep-harness';

export const BEELINE_DELAYS = [0, 2.5, 5, 8] as const;
const DT = 1 / 60;

function cleanTutorialBeeline(level: TutorialLevelDef, entry: TutorialLevelDef['map']['entries'][number], delay: number): boolean {
  const ctx: GameContext = {
    pointer: { down: false, x: 0, y: 0, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: false,
  };
  let delivered = false;
  const scene = new FlightScene({
    ctx, level, spotted: 0,
    onLocked: () => { delivered = true; },
    onQuit: () => { throw new Error('Beeline quit instead of steering'); },
  });
  for (let f = 0; f < delay * 60; f++) scene.update(DT);
  for (let f = 0; f < 60 * 60 && !delivered && scene.state !== 'spotted'; f++) {
    const { x, y, vx, vy } = scene.saucer;
    const dx = entry.x - x;
    const dy = entry.y - y;
    const d = Math.hypot(dx, dy);
    const lead = Math.min(180, d * 1.4);
    ctx.pointer.down = d > 14 || Math.hypot(vx, vy) > 65;
    ctx.pointer.x = x - scene.camX + dx * lead / Math.max(1, d) - vx * (d < 130 ? 0.35 : 0.1);
    ctx.pointer.y = y - scene.camY + dy * lead / Math.max(1, d) - vy * (d < 130 ? 0.35 : 0.1);
    scene.update(DT);
  }
  return delivered;
}

/** One straight hold from the launch to one entry ring at one start delay. */
export interface DirectApproach {
  roomId: RoomId;
  delay: number;
  /** Spotted, or no ring locked within the minute: the straight line does not win. */
  caught: boolean;
  /** Still clean and listed in PENDING_DIRECT: known, waiting for its level's rework. */
  pending?: boolean;
}

/**
 * Straight holds that still lock cleanly, by level, as `roomId@delay`, waiting for a rework of their
 * level. The list may only shrink: a listed hold that is caught fails the gate until it is removed,
 * and any other clean hold fails. Empty since the v0.2 openings rework (2026-11-27): L5's regatta
 * bunting and L12's bypass cordon stop the 32 holds the every-ring matrix first found there.
 */
export const PENDING_DIRECT: Readonly<Record<string, readonly string[]>> = {};

/**
 * The every-ring matrix: a thumb held straight from the launch at each entry ring of a deep shift,
 * at every tested start delay, ignoring detectors, timing and walls. Each must be spotted or fail
 * to lock within 60 s (AGENTS.md "no straight-line win").
 */
export function directApproaches(level: DeepLevelDef): DirectApproach[] {
  const pending = new Set(PENDING_DIRECT[level.id] ?? []);
  return level.map.targets.flatMap(target => target.entries).flatMap(entry => BEELINE_DELAYS.map(delay => {
    const run = runHeadless(level.map, [], sim => () => steerTo(sim, entry, true), 60, true, delay);
    const caught = run.legs.length === 0;
    return { roomId: entry.roomId, delay, caught, ...(!caught && pending.has(`${entry.roomId}@${delay}`) ? { pending: true } : {}) };
  }));
}

/** Ratchet on PENDING_DIRECT: clean holds that are not listed, and listed holds that are now caught. */
export function directViolations(level: DeepLevelDef, direct: readonly DirectApproach[]): string[] {
  const out: string[] = [];
  for (const run of direct) {
    if (!run.caught && !run.pending) out.push(`too open: a straight hold from the launch locks ${run.roomId} at ${run.delay} s`);
  }
  for (const key of PENDING_DIRECT[level.id] ?? []) {
    const [roomId, delay] = key.split('@');
    const run = direct.find(r => r.roomId === roomId && r.delay === Number(delay));
    if (!run) out.push(`PENDING_DIRECT names ${key}, which ${level.id} does not test`);
    else if (run.caught) out.push(`${key} is caught now: remove it from PENDING_DIRECT`);
  }
  return out;
}

/**
 * Start delays at which no naive flight wins. Tutorials: a straight hold at either ring. Deep
 * shifts: the planner's nearest-ring itinerary and the straight hold at every entry ring
 * (PENDING_DIRECT holds aside, which directViolations ratchets).
 */
export function beelineFlight(level: LevelDef, direct = level.kind === 'deep' ? directApproaches(level) : []): number {
  let stopped = 0;
  for (const delay of BEELINE_DELAYS) {
    if (level.kind === 'tutorial') {
      if (level.map.entries.every(entry => !cleanTutorialBeeline(level, entry, delay))) stopped++;
    } else {
      const route = runHeadless(level.map, [], beelineController, level.clockMode === 'elapsed' ? 60 : level.budgetSec, true, delay);
      if (!route.done && direct.every(run => run.delay !== delay || run.caught || run.pending)) stopped++;
    }
  }
  return stopped;
}

export function naiveRoomWins(id: RoomId, hard: boolean): number {
  const room = ROOMS[id];
  let wins = 0;
  for (const delay of BEELINE_DELAYS) {
    const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, { hard, wakeFails: hard });
    for (let f = 0; f < delay * 60; f++) sim.update(DT);
    for (let f = 0; f < 60 * 45 && !sim.delivered && !sim.failure && !sim.wake.woke; f++) {
      const { beamX, beamY } = sim.body;
      const dx = sim.exitX - beamX;
      const dy = sim.exitY - beamY;
      const fraction = Math.min(1, 270 * DT / Math.max(1, Math.hypot(dx, dy)));
      sim.moveBeam(beamX + dx * fraction, beamY + dy * fraction);
      sim.update(DT);
    }
    if (sim.delivered && !sim.wake.woke) wins++;
  }
  return wins;
}
