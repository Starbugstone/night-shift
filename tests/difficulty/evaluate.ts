// Difficulty evaluator: plays a deep level with human-model players (./human.ts) and checks the
// results against the level's target band. Used by tests/levels-difficulty.test.ts and the
// evaluate-difficulty skill (.claude/skills/evaluate-difficulty/SKILL.md).
import type { RoomId } from '../../src/contracts';
import type { DeepLevelDef } from '../../src/levels/types';
import { beelineController, runHeadless } from '../flight-deep-harness';
import { PROFILES, playAbduction, playFlight, type AbductRun, type HumanProfile } from './human';

/** What "fair but not trivial" means for one level. Rates are 0..1. */
export interface Band {
  /** Each route: share of skilled attempts that deliver the specimen asleep. */
  skilledRoute: number;
  /** Each route: share of casual attempts that deliver. */
  casualRoute: number;
  /** Each building: its easier route must reach this casual success rate. */
  casualBuilding: number;
  /** Flight: median sightings per full run (3 legs), skilled and casual. */
  skilledSpots: number;
  casualSpots: number;
  /** Flight: share of human runs that reach all three rings in the time limit. */
  flightDone: number;
  /** Casual whole-shift estimate (flight + abductions with expected retries) must fit in this share of the sunrise budget. */
  casualBudgetShare: number;
  /** Not trivial: a naive straight-line flight is spotted in at least this many of 4 start times. */
  beelineCaught: number;
  /** Not trivial: mean over routes of the casual median peak wake (0..100) is at least this. */
  tension: number;
}

/** L3 is the first deep level: firm but fair. L4 is not tuned yet, so it is reported, not enforced. */
export const BANDS: Record<string, Band | undefined> = {
  level3: {
    skilledRoute: 0.8,
    casualRoute: 0.5,
    casualBuilding: 0.8,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    beelineCaught: 2,
    tension: 20,
  },
};

export interface RouteReport {
  roomId: RoomId;
  building: string;
  route: string;
  profile: string;
  success: number;
  /** Median seconds of a delivered attempt (NaN when none). */
  medianSec: number;
  medianPeakWake: number;
  medianPeakSleeper: number;
  fails: Record<string, number>;
}

export interface FlightReport {
  profile: string;
  done: number;
  medianSpots: number;
  medianSec: number;
  causes: Record<string, number>;
}

export interface LevelReport {
  levelId: string;
  title: string;
  seeds: number;
  routes: RouteReport[];
  flight: FlightReport[];
  beelineCaught: number;
  /** Seconds, per profile: flight median + per building (best route median / success). */
  shiftEstimate: Record<string, number>;
  budgetSec: number;
  parSec: number;
  tension: number;
  violations: string[];
}

const median = (xs: number[]): number => {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

const tally = (keys: string[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = (out[k] ?? 0) + 1;
  return out;
};

function routeReport(roomId: RoomId, building: string, route: string, profile: HumanProfile, seeds: number): RouteReport {
  const runs: AbductRun[] = [];
  for (let s = 1; s <= seeds; s++) runs.push(playAbduction(roomId, profile, s));
  const ok = runs.filter((r) => r.delivered);
  return {
    roomId,
    building,
    route,
    profile: profile.name,
    success: ok.length / runs.length,
    medianSec: median(ok.map((r) => r.timeSec)),
    medianPeakWake: median(runs.map((r) => r.peakWake)),
    medianPeakSleeper: median(runs.map((r) => r.peakSleeper)),
    fails: tally(runs.filter((r) => !r.delivered).map((r) => `${r.failReason}${r.failBy ? `: ${r.failBy}` : ''}`)),
  };
}

export function evaluateLevel(level: DeepLevelDef, seeds = 6, profiles: HumanProfile[] = [PROFILES.skilled, PROFILES.casual]): LevelReport {
  const routes: RouteReport[] = [];
  for (const target of level.map.targets)
    for (const e of target.entries)
      for (const p of profiles) routes.push(routeReport(e.roomId, target.short, e.route, p, seeds));

  const flightLimit = Math.min(300, level.budgetSec);
  const flight: FlightReport[] = profiles.map((p) => {
    const runs = Array.from({ length: seeds }, (_, i) => playFlight(level.map, p, i + 1, [], flightLimit));
    return {
      profile: p.name,
      done: runs.filter((r) => r.done).length / runs.length,
      medianSpots: median(runs.map((r) => r.spots.length)),
      medianSec: median(runs.map((r) => r.totalSec)),
      causes: tally(runs.flatMap((r) => r.spots.map((s) => s.cause))),
    };
  });

  let beelineCaught = 0;
  for (const delay of [0, 2.5, 5, 8]) if (runHeadless(level.map, [], beelineController, 240, false, delay).spots.length > 0) beelineCaught++;

  const shiftEstimate: Record<string, number> = {};
  for (const p of profiles) {
    let total = flight.find((f) => f.profile === p.name)!.medianSec;
    for (const target of level.map.targets) {
      // A player retries until it works: expected time = attempt time / success rate.
      const costs = target.entries.map((e) => {
        const r = routes.find((x) => x.roomId === e.roomId && x.profile === p.name)!;
        return r.success > 0 ? r.medianSec / r.success : Infinity;
      });
      total += Math.min(...costs);
    }
    shiftEstimate[p.name] = Math.round(total);
  }

  const casual = routes.filter((r) => r.profile === 'casual');
  const tension = casual.length ? casual.reduce((a, r) => a + r.medianPeakWake, 0) / casual.length : 0;
  const report: LevelReport = {
    levelId: level.id,
    title: level.title,
    seeds,
    routes,
    flight,
    beelineCaught,
    shiftEstimate,
    budgetSec: level.budgetSec,
    parSec: level.budgetSec - level.parMarginSec,
    tension: Math.round(tension),
    violations: [],
  };
  report.violations = check(report, BANDS[level.id]);
  return report;
}

/** Every way the report misses its band, as readable sentences. Empty = in band (or no band). */
export function check(r: LevelReport, band: Band | undefined): string[] {
  if (!band) return [];
  const v: string[] = [];
  for (const x of r.routes) {
    const want = x.profile === 'skilled' ? band.skilledRoute : x.profile === 'casual' ? band.casualRoute : 0;
    if (x.success < want) v.push(`${x.roomId} (${x.profile}) delivers ${pct(x.success)}, band wants ≥ ${pct(want)}; fails: ${JSON.stringify(x.fails)}`);
  }
  const buildings = new Set(r.routes.map((x) => x.building));
  for (const b of buildings) {
    const best = Math.max(...r.routes.filter((x) => x.building === b && x.profile === 'casual').map((x) => x.success));
    if (best < band.casualBuilding) v.push(`${b}: easiest route delivers ${pct(best)} for casual, band wants ≥ ${pct(band.casualBuilding)}`);
  }
  for (const f of r.flight) {
    const want = f.profile === 'skilled' ? band.skilledSpots : band.casualSpots;
    if (f.medianSpots > want) v.push(`flight (${f.profile}) median ${f.medianSpots} sightings, band wants ≤ ${want}; causes ${JSON.stringify(f.causes)}`);
    if (f.done < band.flightDone) v.push(`flight (${f.profile}) finishes ${pct(f.done)} of runs, band wants ≥ ${pct(band.flightDone)}`);
  }
  const casual = r.shiftEstimate.casual;
  if (casual !== undefined && casual > r.budgetSec * band.casualBudgetShare)
    v.push(`casual shift estimate ${casual} s exceeds ${pct(band.casualBudgetShare)} of the ${r.budgetSec} s sunrise budget`);
  if (r.beelineCaught < band.beelineCaught) v.push(`too open: a naive beeline is caught in only ${r.beelineCaught}/4 start times (band ≥ ${band.beelineCaught})`);
  if (r.tension < band.tension) v.push(`too easy: casual median peak wake averages ${r.tension}, band wants ≥ ${band.tension}`);
  return v;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

export function formatReport(r: LevelReport): string {
  const lines: string[] = [];
  lines.push(`## ${r.levelId} ${r.title} — ${r.seeds} seeds per cell`);
  lines.push('');
  lines.push('| Building | Route | Profile | Delivers | Median s | Peak wake | Peak 2nd sleeper | Fails |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const x of r.routes)
    lines.push(`| ${x.building} | ${x.route} (${x.roomId}) | ${x.profile} | ${pct(x.success)} | ${Number.isNaN(x.medianSec) ? '–' : x.medianSec.toFixed(0)} | ${x.medianPeakWake} | ${x.medianPeakSleeper} | ${Object.entries(x.fails).map(([k, n]) => `${n}× ${k}`).join(', ') || '–'} |`);
  lines.push('');
  lines.push('| Flight | Finishes | Median sightings | Median s | Causes |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const f of r.flight)
    lines.push(`| ${f.profile} | ${pct(f.done)} | ${f.medianSpots} | ${f.medianSec.toFixed(0)} | ${Object.entries(f.causes).map(([k, n]) => `${n}× ${k}`).join(', ') || '–'} |`);
  lines.push('');
  lines.push(`Naive beeline caught: ${r.beelineCaught}/4 start times. Tension (casual mean peak wake): ${r.tension}.`);
  lines.push(`Shift estimate: ${Object.entries(r.shiftEstimate).map(([k, s]) => `${k} ${s} s`).join(', ')} · sunrise ${r.budgetSec} s · Night owl by ${r.parSec} s.`);
  lines.push('');
  lines.push(r.violations.length ? `**Out of band:**\n${r.violations.map((v) => `- ${v}`).join('\n')}` : BANDS[r.levelId] ? '**In band.**' : '_No band set for this level: report only._');
  return lines.join('\n');
}
