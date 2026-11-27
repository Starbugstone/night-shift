// The slowest honest hand finishes every deep shift (v0.2 council round 2, Opus F1). The perfect-hand
// autopilot (no reaction lag, no wobble) plays the whole shift, flight and rooms, dragging at
// SLOWEST_HONEST_PACE; it must deliver all three before the clock runs out, with at least
// HONEST_MARGIN of the budget left, on every seed the evaluator tests. A clock tuned to the fast
// human-model hands alone (casual drags at 3×) would fail the player who takes the beam slowly.
// Round 3 (Opus O1): the clocks fell off a cliff just below that hand (L12 at pace 1.4 delivered 5 of 6, at 1.3 1 of 6;
// pace 1.5 with a 0.18 s reaction lag missed L10 by 3 s), because a timed room costs a slow hand a whole cycle. Two
// more hands play every shift and must deliver inside the budget: the same pace with the skilled profile's reaction
// lag (perfect otherwise), and pace 1.4 with perfect timing.
import { SLOWEST_HONEST_PACE } from '../../src/abduct/autopilot';
import type { RoomId } from '../../src/contracts';
import type { DeepLevelDef } from '../../src/levels/types';
import { PROFILES, type AbductRun, type HumanProfile } from './human';
import { deepShiftRun } from './stars';

/** Share of the budget the slowest honest hand must have left at delivery. */
export const HONEST_MARGIN = 0.05;

/** The perfect-hand autopilot at the slowest honest pace. */
export const HONEST_HAND: HumanProfile = { name: 'honest', pace: SLOWEST_HONEST_PACE, reaction: 0, jitter: 0, drift: 0 };

/** Round 3 (Opus O1): the honest pace with a practised player's reaction lag, and a slightly slower perfect hand. */
export const SLOW_HANDS: readonly HumanProfile[] = [
  { name: 'honest+lag', pace: SLOWEST_HONEST_PACE, reaction: PROFILES.skilled.reaction, jitter: 0, drift: 0 },
  { name: 'honest-1.4', pace: 1.4, reaction: 0, jitter: 0, drift: 0 },
];

type HonestRun = { seed: number; delivered: boolean; seconds: number; sightings: number; roomFailures: string[] };

export interface SlowHandReport {
  hand: HumanProfile;
  /** Latest finish allowed: the whole budget (no margin for these hands). */
  limitSec: number;
  runs: HonestRun[];
  worstSec: number;
}

export interface HonestPaceReport {
  budgetSec: number;
  /** Latest finish allowed: the budget less the margin. */
  limitSec: number;
  runs: HonestRun[];
  /** Slowest run's shift seconds (Infinity when a run failed to deliver). */
  worstSec: number;
  /** SLOW_HANDS, each against the whole budget. */
  slow: SlowHandReport[];
}

function playAll(level: DeepLevelDef, hand: HumanProfile, seeds: number, play: (room: RoomId, profile: HumanProfile, seed: number) => AbductRun): HonestRun[] {
  return Array.from({ length: seeds }, (_, i) => {
    const run = deepShiftRun(level, hand, i + 1, play);
    return { seed: i + 1, delivered: run.stars[0], seconds: Math.round(run.seconds * 10) / 10, sightings: run.sightings.length, roomFailures: run.roomFailures };
  });
}

const worst = (runs: HonestRun[]): number => Math.max(...runs.map(run => run.delivered ? run.seconds : Infinity));

export function evaluateHonestPace(level: DeepLevelDef, seeds: number, play: (room: RoomId, profile: HumanProfile, seed: number) => AbductRun): HonestPaceReport {
  const runs = playAll(level, HONEST_HAND, seeds, play);
  return {
    budgetSec: level.budgetSec,
    limitSec: level.budgetSec * (1 - HONEST_MARGIN),
    runs,
    worstSec: worst(runs),
    slow: SLOW_HANDS.map(hand => {
      const r = playAll(level, hand, seeds, play);
      return { hand, limitSec: level.budgetSec, runs: r, worstSec: worst(r) };
    }),
  };
}

function lateText(late: HonestRun[]): string {
  return late.map(run => `seed ${run.seed} ${run.delivered ? `${run.seconds} s` : `not delivered (${run.seconds} s${run.roomFailures.length ? `; ${run.roomFailures.join(', ')}` : ''})`}`).join(', ');
}

export function honestPaceViolations(report: HonestPaceReport): string[] {
  const out: string[] = [];
  const late = report.runs.filter(run => !run.delivered || run.seconds > report.limitSec);
  if (late.length) out.push(`slowest honest hand (pace ${SLOWEST_HONEST_PACE}) misses the clock: ${lateText(late)}; it must finish by ${Math.round(report.limitSec * 10) / 10} s (${report.budgetSec} s less ${HONEST_MARGIN * 100}%)`);
  for (const s of report.slow) {
    const slowLate = s.runs.filter(run => !run.delivered || run.seconds > s.limitSec);
    if (slowLate.length) out.push(`slow hand ${s.hand.name} (pace ${s.hand.pace}, reaction ${s.hand.reaction} s) misses the clock: ${lateText(slowLate)}; it must deliver within ${s.limitSec} s`);
  }
  return out;
}
