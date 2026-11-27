// The slowest honest hand finishes every deep shift (v0.2 council round 2, Opus F1). The perfect-hand
// autopilot (no reaction lag, no wobble) plays the whole shift, flight and rooms, dragging at
// SLOWEST_HONEST_PACE; it must deliver all three before the clock runs out, with at least
// HONEST_MARGIN of the budget left, on every seed the evaluator tests. A clock tuned to the fast
// human-model hands alone (casual drags at 3×) would fail the player who takes the beam slowly.
import { SLOWEST_HONEST_PACE } from '../../src/abduct/autopilot';
import type { RoomId } from '../../src/contracts';
import type { DeepLevelDef } from '../../src/levels/types';
import type { AbductRun, HumanProfile } from './human';
import { deepShiftRun } from './stars';

/** Share of the budget the slowest honest hand must have left at delivery. */
export const HONEST_MARGIN = 0.05;

/** The perfect-hand autopilot at the slowest honest pace. */
export const HONEST_HAND: HumanProfile = { name: 'honest', pace: SLOWEST_HONEST_PACE, reaction: 0, jitter: 0, drift: 0 };

export interface HonestPaceReport {
  budgetSec: number;
  /** Latest finish allowed: the budget less the margin. */
  limitSec: number;
  runs: { seed: number; delivered: boolean; seconds: number; sightings: number; roomFailures: string[] }[];
  /** Slowest run's shift seconds (Infinity when a run failed to deliver). */
  worstSec: number;
}

export function evaluateHonestPace(level: DeepLevelDef, seeds: number, play: (room: RoomId, profile: HumanProfile, seed: number) => AbductRun): HonestPaceReport {
  const runs = Array.from({ length: seeds }, (_, i) => {
    const run = deepShiftRun(level, HONEST_HAND, i + 1, play);
    return { seed: i + 1, delivered: run.stars[0], seconds: Math.round(run.seconds * 10) / 10, sightings: run.sightings.length, roomFailures: run.roomFailures };
  });
  return {
    budgetSec: level.budgetSec,
    limitSec: level.budgetSec * (1 - HONEST_MARGIN),
    runs,
    worstSec: Math.max(...runs.map(run => run.delivered ? run.seconds : Infinity)),
  };
}

export function honestPaceViolations(report: HonestPaceReport): string[] {
  const late = report.runs.filter(run => !run.delivered || run.seconds > report.limitSec);
  if (!late.length) return [];
  return [`slowest honest hand (pace ${SLOWEST_HONEST_PACE}) misses the clock: ${late.map(run => `seed ${run.seed} ${run.delivered ? `${run.seconds} s` : `not delivered (${run.seconds} s${run.roomFailures.length ? `; ${run.roomFailures.join(', ')}` : ''})`}`).join(', ')}; it must finish by ${Math.round(report.limitSec * 10) / 10} s (${report.budgetSec} s less ${HONEST_MARGIN * 100}%)`];
}
