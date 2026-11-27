// Difficulty evaluator: scores each level with human-model players (./human.ts) and checks
// the star and deep-level bands. Used by tests/levels-difficulty.test.ts and the
// evaluate-difficulty skill (.claude/skills/evaluate-difficulty/SKILL.md).
import { GRAIL_TARGETS } from './grail';
import type { RoomId } from '../../src/contracts';
import { deepPar, type LevelDef } from '../../src/levels/types';
import { FIELD_CHECK_ROOM, FIELD_CHECK_RULES } from '../../src/levels/field-check';
import { ROOMS } from '../../src/abduct/rooms';
import { workOrderNumber } from '../../src/levels/levels';
import { starLabels } from '../../src/levels/progress';
import { isBirch } from './birch';
import { BEELINE_DELAYS, beelineFlight, directApproaches, directViolations, naiveRoomWins, type DirectApproach } from './beeline';
import { HARD_RULES, OBSTACLE_NEAR_PX, PROFILES, playAbduction, playFlight, type AbductRun, type HumanProfile } from './human';
import { evaluateBirchDetours, evaluateShrubbery, evaluateCarFirst, evaluateTowelFirst, evaluateTripodFirst, evaluateStars, type CarReport, type StarReport, type TripodReport } from './stars';
import { checkDispatchFinale } from './dispatch2199';
import { naiveCarCatches } from './time-car';
import { RateLedger, bandText, tolerated, type RateCheck } from './rates';

// Minimum shares of full attempts, in the game's star order. The beeline and wake
// checks below still enforce challenge when the route-aware player earns many stars.
const STAR_FLOORS = {
  tutorial: { skilled: [5 / 6, 0.75, 2 / 3], casual: [2 / 3, 0.60, 1 / 2] },
  birch_bakery: { skilled: [1, 1, 5 / 6], casual: [1, 5 / 6, 5 / 6] },
  birch_neighbours: { skilled: [5 / 6, 5 / 6, 5 / 6], casual: [5 / 6, 4 / 6, 5 / 6] },
  early: { skilled: [5 / 6, 2 / 3, 2 / 3], casual: [2 / 3, 0.60, 1 / 2] },
  middle: { skilled: [5 / 6, 0.60, 2 / 3], casual: [2 / 3, 0.45, 1 / 2] },
  late: { skilled: [5 / 6, 0.50, 2 / 3], casual: [2 / 3, 0.33, 1 / 2] },
} as const;

const CASUAL_GHOST_CAP = 0.9;
const MIN_CASUAL_PAR_SHARE = 0.30;
const MIN_CASUAL_PEAK_SUSPICION = 0.05;
const L9_OWL_CAP = 0.9;
const L9_SHIFT_SEC = { min: 90, max: 110 } as const;
const L11_SHIFT_SEC = { min: 110, max: 125 } as const;

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
  /** Not trivial: mean over routes of the casual median peak wake (0..100) is at least this. */
  tension: number;
}

/** Difficulty targets for the deep levels. */
export const BANDS: Record<string, Band | undefined> = {
  birch_bakery: {
    skilledRoute: 0.95, casualRoute: 0.85, casualBuilding: 0.95, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.95, casualBudgetShare: 0.8, tension: 20,
  },
  birch_neighbours: {
    skilledRoute: 0.90, casualRoute: 0.80, casualBuilding: 0.90, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.90, casualBudgetShare: 0.8, tension: 20,
  },
  level3: {
    skilledRoute: 0.8,
    casualRoute: 0.5,
    casualBuilding: 0.8,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    tension: 20,
  },
  level4: {
    skilledRoute: 0.75,
    casualRoute: 0.5,
    casualBuilding: 0.8,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    tension: 20,
  },
  // L5 pier code: docs/GDD-3-new-shifts.md "Feel targets" (skilled >= 75 %, casual >= 40 % per
  // route; median sightings skilled <= 1, casual <= 2), plus the L3 "not trivial" checks.
  level5: {
    skilledRoute: 0.75,
    casualRoute: 0.4,
    casualBuilding: 0.6,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    tension: 20,
  },
  // L6 clinic code: docs/GDD-3-new-shifts.md "Feel targets" (skilled >= 75 %, casual >= 40 % per
  // route; median sightings skilled <= 1, casual <= 2), plus the L3 "not trivial" checks.
  level6: {
    skilledRoute: 0.75,
    casualRoute: 0.4,
    casualBuilding: 0.6,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    tension: 20,
  },
  // L7 cruise code: docs/GDD-3-new-shifts.md "Feel targets" (skilled >= 75 %, casual >= 40 % per
  // route; median sightings skilled <= 1, casual <= 2), plus the L3 "not trivial" checks.
  level7: {
    skilledRoute: 0.75,
    casualRoute: 0.4,
    casualBuilding: 0.6,
    skilledSpots: 1,
    casualSpots: 2,
    flightDone: 0.8,
    casualBudgetShare: 0.8,
    tension: 20,
  },

  // v4 L8 · docs/GDD-4-monolith.md
  level8: {
    skilledRoute: 0.75, casualRoute: 0.4, casualBuilding: 0.6, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.8, casualBudgetShare: 0.8, tension: 20,
  },
  // v4 1953: the two timed crossings sit one tier above the 1955 introductions.
  level11: {
    skilledRoute: 0.75, casualRoute: 0.4, casualBuilding: 0.65, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.8, casualBudgetShare: L11_SHIFT_SEC.max / 292, tension: 20,
  },
  // v4 L9 1955: late-tier stars and a tighter standard-shift estimate.
  // v4 1122
  level10: {
    skilledRoute: 0.75, casualRoute: 0.4, casualBuilding: 0.65, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.8, casualBudgetShare: 120 / 172, tension: 20, // GDD-12: the casual estimate stays within 105–120 s of the 172 s dawn
  },
  level12: { skilledRoute: 0.75, casualRoute: 0.4, casualBuilding: 0.65, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.8, casualBudgetShare: 0.8, tension: 20 },
  level9: {
    skilledRoute: 0.8, casualRoute: 0.5, casualBuilding: 0.8, skilledSpots: 1, casualSpots: 2,
    flightDone: 0.8, casualBudgetShare: L9_SHIFT_SEC.max / 380, tension: 20,
  },
};

export interface RouteReport {
  roomId: RoomId;
  building: string;
  route: string;
  profile: string;
  success: number;
  /** Delivered attempts out of `attempts` (one per seed). */
  delivered: number;
  attempts: number;
  /** Median seconds of a delivered attempt (NaN when none). */
  medianSec: number;
  medianPeakWake: number;
  medianPeakSleeper: number;
  obstacleShare: number;
  fails: Record<string, number>;
}

export interface FlightReport {
  profile: string;
  done: number;
  /** Runs that reached all three rings, out of `runs` (one per seed). */
  finished: number;
  runs: number;
  medianSpots: number;
  medianSec: number;
  causes: Record<string, number>;
}

interface StarLevelReport {
  levelId: string;
  title: string;
  seeds: number;
  starLabels: readonly string[];
  stars: StarReport[];
  beelineCaught: number;
  /** Deep shifts: the straight hold from the launch to every entry ring at every start delay. */
  directApproaches: DirectApproach[];
  roomBeelines: { roomId: RoomId; clean: number }[];
  souvenirs: { roomId: RoomId | 'field_check'; grabbed: number; delivered: number; medianSec: number }[];
  casualMedianParShare: number;
  casualMedianPeakSuspicion: number;
  /** Every rate band judged, exact from EXACT_FROM attempts and a binomial sanity check below (./rates.ts). */
  rates: RateCheck[];
  violations: string[];
}

export interface LevelReport extends StarLevelReport {
  routes: RouteReport[];
  flight: FlightReport[];
  /** Seconds, per profile: flight median + per building (best route median / success). */
  shiftEstimate: Record<string, number>;
  budgetSec: number;
  parSec: number;
  tension: number;
  birchDetours?: ReturnType<typeof evaluateBirchDetours>[];
  shrubbery?: ReturnType<typeof evaluateShrubbery>[];
  towelFirst?: ReturnType<typeof evaluateTowelFirst>[];
  carFirst?: CarReport[];
  tripodFirst?: TripodReport[];
  carBeelines?: ReturnType<typeof naiveCarCatches>;
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

function routeReport(roomId: RoomId, building: string, route: string, profile: HumanProfile, seeds: number, play: (id: RoomId, profile: HumanProfile, seed: number) => AbductRun): RouteReport {
  const runs: AbductRun[] = [];
  for (let s = 1; s <= seeds; s++) runs.push(play(roomId, profile, s));
  const ok = runs.filter((r) => r.delivered);
  return {
    roomId,
    building,
    route,
    profile: profile.name,
    success: ok.length / runs.length,
    delivered: ok.length,
    attempts: runs.length,
    medianSec: median(ok.map((r) => r.timeSec)),
    medianPeakWake: median(runs.map((r) => r.peakWake)),
    medianPeakSleeper: median(runs.map((r) => r.peakSleeper)),
    obstacleShare: runs.filter(run => run.approachedObstacle).length / runs.length,
    fails: tally(runs.filter((r) => !r.delivered).map((r) => `${r.failReason}${r.failBy ? `: ${r.failBy}` : ''}`)),
  };
}

export function evaluateLevel(level: LevelDef, seeds = 6, profiles: HumanProfile[] = [PROFILES.skilled, PROFILES.casual]): StarLevelReport | LevelReport {
  if (!Number.isSafeInteger(seeds) || seeds <= 0) throw new Error('DIFFICULTY_SEEDS must be a positive integer');
  const rooms = new Map<string, AbductRun>();
  const play = (room: RoomId, profile: HumanProfile, seed: number): AbductRun => {
    const key = `${room}/${profile.name}/${seed}`;
    const cached = rooms.get(key);
    if (cached) return cached;
    const run = playAbduction(room, profile, seed);
    rooms.set(key, run);
    return run;
  };
  const stars = profiles.map((p) => evaluateStars(level, p, seeds, play));
  const skilledStars = stars.find((row) => row.profile === 'skilled');
  const casualStars = stars.find((row) => row.profile === 'casual');
  const casualRuns = casualStars?.runs ?? [];
  const par = level.kind === 'tutorial' ? level.parSec : deepPar(level);
  const entries = level.kind === 'tutorial' ? level.map.entries : level.map.targets.flatMap(target => target.entries);
  const roomRules = level.kind === 'tutorial' ? { hard: false, wakeFails: false } : HARD_RULES;
  const survey = entries.map(entry => ({
    id: entry.roomId as RoomId | 'field_check', room: ROOMS[entry.roomId], rules: roomRules,
  }));
  if (level.id === 'level2') survey.push({ id: 'field_check', room: FIELD_CHECK_ROOM, rules: FIELD_CHECK_RULES });
  const souvenirs = survey.map(({ id, room, rules }) => {
    let grabbed = 0;
    let delivered = 0;
    const times: number[] = [];
    for (let seed = 1; seed <= seeds; seed++) {
      const plain = level.kind === 'deep' && id !== 'field_check' ? play(id, PROFILES.casual, seed)
        : playAbduction(room, PROFILES.casual, seed, rules);
      if (plain.delivered) times.push(plain.timeSec);
      const attempt = playAbduction(room, PROFILES.casual, seed, rules, [], 'souvenir');
      if (attempt.captured) grabbed++;
      if (attempt.result.itemsStolen.includes(room.item.name)) delivered++;
    }
    return { roomId: id, grabbed, delivered, medianSec: median(times) };
  });
  const direct = level.kind === 'deep' ? directApproaches(level) : [];
  const base: StarLevelReport = {
    levelId: level.id,
    title: level.title,
    seeds,
    starLabels: starLabels(level),
    stars,
    souvenirs,
    beelineCaught: beelineFlight(level, direct),
    directApproaches: direct,
    roomBeelines: entries.map(entry => ({ roomId: entry.roomId, clean: naiveRoomWins(entry.roomId, level.kind === 'deep') })),
    casualMedianParShare: median(casualRuns.filter(run => run.stars[0]).map(run => run.seconds / par)),
    casualMedianPeakSuspicion: median(casualRuns.map(run => run.peakSuspicion)),
    rates: [],
    violations: [],
  };
  const ledger = new RateLedger(base.violations);
  base.rates = ledger.checks;
  for (const row of souvenirs) {
    const floor = row.roomId === 'inventor_balcony' ? 0.75 : 0.4;
    ledger.rate(`${row.roomId}: souvenir taken home`, row.delivered, seeds, { min: floor });
  }
  const num = workOrderNumber(level.id);
  const floors = STAR_FLOORS[level.id === 'birch_bakery' || level.id === 'birch_neighbours' ? level.id : level.kind === 'tutorial' ? 'tutorial' : num <= workOrderNumber('level4') ? 'early' : num <= workOrderNumber('level6') ? 'middle' : 'late'];
  for (const row of base.stars) {
    const want = row.profile === 'skilled' ? floors.skilled : row.profile === 'casual' ? floors.casual : [];
    for (const [i, floor] of want.entries()) {
      const ceiling = level.kind === 'deep' && row.profile === 'casual' && i === 1 ? CASUAL_GHOST_CAP : undefined;
      ledger.rate(`${base.starLabels[i]} (${row.profile})`, row.earned[i]!, row.attempts, { min: floor, ...(ceiling === undefined ? {} : { max: ceiling }) });
    }
  }
  if (level.kind === 'deep' && skilledStars && casualStars) {
    ledger.order('Ghost must reward skilled play (skilled above casual)', skilledStars.earned[1], skilledStars.attempts, casualStars.earned[1], casualStars.attempts);
  }
  if (base.beelineCaught !== BEELINE_DELAYS.length) {
    base.violations.push(`too open: a naive flight is stopped at ${base.beelineCaught}/${BEELINE_DELAYS.length} start times`);
  }
  if (level.kind === 'deep') base.violations.push(...directViolations(level, direct));
  for (const room of base.roomBeelines) {
    if (room.clean > 0) base.violations.push(`too open: ${room.roomId} delivers asleep on a direct drag at ${room.clean}/${BEELINE_DELAYS.length} start times`);
  }
  if (base.casualMedianParShare < MIN_CASUAL_PAR_SHARE) {
    base.violations.push(`too easy: the median casual delivery spends ${pct(base.casualMedianParShare)} of par, band wants ≥ ${pct(MIN_CASUAL_PAR_SHARE)}`);
  }
  if (level.kind === 'deep' && base.casualMedianPeakSuspicion < MIN_CASUAL_PEAK_SUSPICION) {
    base.violations.push(`too easy: median casual peak suspicion is ${pct(base.casualMedianPeakSuspicion)}, band wants ≥ ${pct(MIN_CASUAL_PEAK_SUSPICION)}`);
  }
  if (level.kind === 'tutorial') {
    for (const entry of level.map.entries) {
      const runs = casualRuns.filter(run => run.rooms.includes(entry.roomId));
      if (runs.length > 0 && !runs.some(run => run.tutorialObstacle)) {
        base.violations.push(noObstacle(entry.roomId));
      }
    }
    return base;
  }
  const band = BANDS[level.id];
  if (!band) throw new Error(`Missing difficulty band for ${level.id}`);
  const routes: RouteReport[] = [];
  for (const target of level.map.targets)
    for (const e of target.entries)
      for (const p of profiles) routes.push(routeReport(e.roomId, target.short, e.route, p, seeds, play));

  const flightLimit = Math.min(300, level.budgetSec);
  const flight: FlightReport[] = profiles.map((p) => {
    const runs = Array.from({ length: seeds }, (_, i) => playFlight(level.map, p, i + 1, [], flightLimit));
    return {
      profile: p.name,
      done: runs.filter((r) => r.done).length / runs.length,
      finished: runs.filter((r) => r.done).length,
      runs: runs.length,
      medianSpots: median(runs.map((r) => r.spots.length)),
      medianSec: median(runs.map((r) => r.totalSec)),
      causes: tally(runs.flatMap((r) => r.spots.map((s) => s.cause))),
    };
  });

  const shiftEstimate: Record<string, number> = {};
  for (const p of profiles) {
    let total = flight.find((f) => f.profile === p.name)!.medianSec;
    for (const target of level.map.targets) {
      if (target.troop) continue; // Outdoor locks already count in flight time.
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
    ...base,
    routes,
    flight,
    shiftEstimate,
    budgetSec: level.budgetSec,
    parSec: deepPar(level),
    tension: Math.round(tension),
  };
  report.violations.push(...check(report, band, ledger));
  if (isBirch(level.id)) {
    report.birchDetours = [...profiles, PROFILES.bot].map(profile => evaluateBirchDetours(level, profile, profile.name === 'bot' ? 1 : seeds, play));
    for (const row of report.birchDetours) {
      const bakery = level.id === 'birch_bakery';
      const floor = row.profile === 'bot' ? 1 : row.profile === 'skilled' ? (bakery ? 0.95 : 0.90) : bakery ? 0.90 : 0.80;
      ledger.rate(`Pickup detour (${row.profile})`, row.fourth, row.attempts, { min: floor });
      if ((row.profile === 'bot' || seeds >= 20) && row.allFour === 0) report.violations.push(`Pickup (${row.profile}): no four-star shift`);
    }
  }
  if (level.id === 'level10') {
    report.shrubbery = profiles.map(profile => evaluateShrubbery(level, profile, seeds, play));
    if (seeds === 20 && shiftEstimate.casual !== undefined && shiftEstimate.casual < 105)
      report.violations.push(`casual shift estimate ${shiftEstimate.casual} s, band wants ≥ 105 s`);
    for (const row of report.shrubbery) {
      const floor = row.profile === 'skilled' ? 0.9 : row.profile === 'casual' ? 0.75 : 1;
      if (seeds === 20 && (row.profile === 'skilled' || row.profile === 'casual')) {
        const counts = [...stars.find(star => star.profile === row.profile)!.earned, row.fourthStars];
        GRAIL_TARGETS[row.profile].forEach(([min, max], index) => {
          ledger.rate(`Grail target: ${report.starLabels[index]} (${row.profile})`, counts[index]!, seeds, { min: min / 100, max: max / 100 });
        });
      }
      ledger.rate(`Shrubbery detour (${row.profile})`, row.fourthStars, row.attempts, { min: floor });
    }
  }
  if (level.id === 'level12') {
    report.towelFirst = profiles.map(p => evaluateTowelFirst(level, p, seeds, play));
    report.violations.push(...checkDispatchFinale(report, ledger));
  }
  if (level.id === 'level11') {
    if (seeds >= 20 && shiftEstimate.casual !== undefined && shiftEstimate.casual < L11_SHIFT_SEC.min)
      report.violations.push(`casual shift estimate ${shiftEstimate.casual} s, band wants ≥ ${L11_SHIFT_SEC.min} s`);
    report.tripodFirst = profiles.map(profile => evaluateTripodFirst(level, profile, seeds, play));
    for (const row of report.tripodFirst) {
      if (row.profile !== 'skilled' && row.profile !== 'casual') continue;
      const floor = row.profile === 'skilled' ? 5 / 6 : 4 / 6;
      if (seeds >= 6) ledger.rate(`Tripod leg detour (${row.profile})`, row.fourthStars, row.attempts, { min: floor });
    }
  }
  if (level.id === 'level9') {
    if (seeds >= 6) {
      for (const row of stars) {
        if (row.profile !== 'skilled' && row.profile !== 'casual') continue;
        ledger.rate(`Night owl cap (${row.profile})`, row.earned[2], row.attempts, { max: L9_OWL_CAP });
      }
      if (shiftEstimate.casual !== undefined && shiftEstimate.casual < L9_SHIFT_SEC.min)
        report.violations.push(`casual shift estimate ${shiftEstimate.casual} s, band wants ≥ ${L9_SHIFT_SEC.min} s`);
      // The six-seed gate allows a second either way around the 20-seed room medians.
      const [min, max] = seeds >= 20 ? [19, 27] : [18, 28];
      for (const room of casual) {
        if (room.medianSec < min || room.medianSec > max)
          report.violations.push(`${room.roomId} (casual) median ${room.medianSec.toFixed(1)} s, band wants ${min}–${max} s`);
        if ((room.roomId === 'bully_kitchen' || room.roomId === 'band_canopy') && room.medianPeakSleeper <= 0)
          report.violations.push(`${room.roomId} (casual) median second-sleeper wake is zero`);
      }
    }
    report.carFirst = profiles.map(profile => evaluateCarFirst(level, profile, seeds, play));
    report.carBeelines = naiveCarCatches(level);
    if (report.carBeelines.some(attempt => attempt.caught)) report.violations.push('A naive time-car approach catches the car');
    for (const row of report.carFirst) {
      const floor = row.profile === 'skilled' ? 0.9 : row.profile === 'casual' ? 0.6 : 0;
      const ceiling = row.profile === 'casual' ? 0.85 : 1;
      ledger.rate(`Time car catches (${row.profile})`, row.catches, row.attempts, { min: floor, max: ceiling });
      if (seeds >= 20 && row.allFour === 0) report.violations.push(`Time car (${row.profile}): no four-star shift`);
    }
  }
  for (const room of casual) if (room.obstacleShare === 0) report.violations.push(noObstacle(room.roomId));
  return report;
}

/** Entry rings a straight hold from the launch locks, with the start delays that let it. */
function cleanDirect(direct: readonly DirectApproach[]): Map<RoomId, number[]> {
  const clean = new Map<RoomId, number[]>();
  for (const run of direct) if (!run.caught) clean.set(run.roomId, [...clean.get(run.roomId) ?? [], run.delay]);
  return clean;
}

function noObstacle(room: RoomId): string {
  return `too open: no casual ${room} run approached within ${OBSTACLE_NEAR_PX} px of an obstacle or engaged a hazard`;
}

/** Every way the report misses its band, as readable sentences. */
export function check(r: LevelReport, band: Band, ledger = new RateLedger([])): string[] {
  const v: string[] = [];
  const rates = new RateLedger(v);
  const judge = (...args: Parameters<RateLedger['rate']>): void => {
    ledger.checks.push(rates.rate(...args));
  };
  for (const x of r.routes) {
    const want = x.profile === 'skilled' ? band.skilledRoute : x.profile === 'casual' ? band.casualRoute : 0;
    judge(`${x.roomId} (${x.profile}) delivers`, x.delivered, x.attempts, { min: want }, `fails: ${JSON.stringify(x.fails)}`);
  }
  const buildings = new Set(r.routes.map((x) => x.building));
  for (const b of buildings) {
    const casual = r.routes.filter((x) => x.building === b && x.profile === 'casual');
    if (!casual.length) continue;
    const best = casual.reduce((a, x) => (x.delivered / x.attempts > a.delivered / a.attempts ? x : a), casual[0]!);
    judge(`${b}: easiest casual route (${best.roomId}) delivers`, best.delivered, best.attempts, { min: band.casualBuilding });
  }
  for (const f of r.flight) {
    const want = f.profile === 'skilled' ? band.skilledSpots : band.casualSpots;
    if (f.medianSpots > want) v.push(`flight (${f.profile}) median ${f.medianSpots} sightings, band wants ≤ ${want}; causes ${JSON.stringify(f.causes)}`);
    judge(`flight (${f.profile}) finishes`, f.finished, f.runs, { min: band.flightDone });
  }
  const casual = r.shiftEstimate.casual;
  if (casual !== undefined && casual > r.budgetSec * band.casualBudgetShare)
    v.push(`casual shift estimate ${casual} s exceeds ${pct(band.casualBudgetShare)} of the ${r.budgetSec} s sunrise budget`);
  if (r.tension < band.tension) v.push(`too easy: casual median peak wake averages ${r.tension}, band wants ≥ ${band.tension}`);
  return v;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

export function formatReport(r: StarLevelReport | LevelReport): string {
  const lines: string[] = [];
  lines.push(`## ${r.levelId} ${r.title} — ${r.seeds} seeds per cell`);
  lines.push('');
  lines.push(`| Profile | ${r.starLabels.join(' | ')} | Attempts spotted | Attempts with room failures |`);
  lines.push(`| ${Array(r.starLabels.length + 3).fill('---').join(' | ')} |`);
  for (const x of r.stars) {
    const earned = r.starLabels.map((_, i) => {
      const n = i === 3 ? x.runs.filter(run => run.stars[3]).length : x.earned[i]!;
      return `${pct(n / x.attempts)} (${n}/${x.attempts})`;
    });
    const spotted = x.runs.filter((run) => run.sightings.length || run.tutorialSpots).length;
    const failures = x.runs.filter((run) => run.roomFailures.length).length;
    lines.push(`| ${x.profile} | ${earned.join(' | ')} | ${spotted} | ${failures} |`);
  }
  for (const x of r.stars) {
    const firstSpots = x.runs.flatMap((run) => run.sightings.slice(0, 1));
    const firstByDetector = tally(firstSpots.map((s) => `${s.cause} #${s.hazard}`));
    if (firstSpots.length) {
      const detectors = Object.entries(firstByDetector).map(([name, count]) => {
        const spot = firstSpots.find((s) => name === `${s.cause} #${s.hazard}`)!;
        return `${count}× ${name} (e.g. ${spot.x}, ${spot.y})`;
      });
      lines.push(`\n${x.profile} first sightings: ${detectors.join(', ')}.`);
    }
  }
  lines.push('');
  lines.push(`Naive flight stopped: ${r.beelineCaught}/${BEELINE_DELAYS.length} start times. Casual median par used: ${pct(r.casualMedianParShare)}. Casual median peak suspicion: ${pct(r.casualMedianPeakSuspicion)}.`);
  if (r.directApproaches.length) {
    const clean = cleanDirect(r.directApproaches);
    const caught = r.directApproaches.filter(run => run.caught).length;
    const pending = r.directApproaches.filter(run => run.pending).length;
    lines.push(`Straight holds from the launch caught: ${caught}/${r.directApproaches.length} (every entry ring × ${BEELINE_DELAYS.join('/')} s)${clean.size ? `; clean: ${[...clean].map(([id, delays]) => `${id} at ${delays.join('/')} s`).join(', ')}${pending ? ` (${pending} in PENDING_DIRECT)` : ''}` : ''}.`);
  }
  const directWins = r.roomBeelines.filter(room => room.clean > 0);
  if (directWins.length) lines.push(`Clean direct room drags: ${directWins.map(room => `${room.roomId} ${room.clean}/${BEELINE_DELAYS.length}`).join(', ')}.`);
  lines.push('');
  lines.push('| Room | Casual median exit (s) | Souvenir grabbed | Taken home |', '| --- | ---: | ---: | ---: |');
  for (const row of r.souvenirs) {
    lines.push(`| ${row.roomId} | ${Number.isFinite(row.medianSec) ? row.medianSec.toFixed(1) : '–'} | ${row.grabbed}/${r.seeds} | ${row.delivered}/${r.seeds} |`);
  }
  lines.push('');
  if ('routes' in r) appendDeepReport(lines, r);
  const lenient = tolerated(r.rates);
  if (lenient.length) {
    lines.push(`Outside the exact band but inside the ${r.seeds}-seed tolerance (judge at 20 seeds: \`npm run difficulty:release\`):`);
    for (const c of lenient) lines.push(`- ${c.label}: ${c.k}/${c.n}, band ${bandText(c)}, p = ${c.p!.toFixed(2)}`);
    lines.push('');
  }
  lines.push(r.violations.length ? `**Out of band:**\n${r.violations.map((v) => `- ${v}`).join('\n')}` : '**In band.**');
  return lines.join('\n');
}

function appendDeepReport(lines: string[], r: LevelReport): void {
  lines.push('| Building | Route | Profile | Delivers | Median s | Peak wake | Peak 2nd sleeper | Obstacle approached | Fails |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const x of r.routes)
    lines.push(`| ${x.building} | ${x.route} (${x.roomId}) | ${x.profile} | ${pct(x.success)} | ${Number.isNaN(x.medianSec) ? '–' : x.medianSec.toFixed(0)} | ${x.medianPeakWake} | ${x.medianPeakSleeper} | ${pct(x.obstacleShare)} | ${Object.entries(x.fails).map(([k, n]) => `${n}× ${k}`).join(', ') || '–'} |`);
  lines.push('');
  lines.push('| Flight | Finishes | Median sightings | Median s | Causes |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const f of r.flight)
    lines.push(`| ${f.profile} | ${pct(f.done)} | ${f.medianSpots} | ${f.medianSec.toFixed(0)} | ${Object.entries(f.causes).map(([k, n]) => `${n}× ${k}`).join(', ') || '–'} |`);
  lines.push('');
  lines.push(`Tension (casual mean peak wake): ${r.tension}.`);
  const deadline = r.levelId === 'level9' ? 'storm passes at' : r.levelId === 'level12' ? 'demolition' : 'sunrise';
  lines.push(`Shift estimate: ${Object.entries(r.shiftEstimate).map(([k, s]) => `${k} ${s} s`).join(', ')}${Number.isFinite(r.budgetSec) ? ` · ${deadline} ${r.budgetSec} s` : ''} · Night owl by ${r.parSec} s.`);
  if (r.birchDetours) for (const row of r.birchDetours) {
    lines.push(`${row.profile} pickup detour: ${row.fourth}/${row.attempts} fourth stars, ${row.allFour}/${row.attempts} four-star shifts.`);
  }
  if (r.shrubbery) {
    for (const row of r.shrubbery) lines.push(`Shrubbery detour (${row.profile}): ${row.fourthStars}/${row.attempts} fourth stars.`);
    if (r.seeds === 20) {
      lines.push('', '| Proposed target | Delivered | Ghost | Night owl | Shrubbery detour |', '| --- | --- | --- | --- | --- |');
      for (const [profile, ranges] of Object.entries(GRAIL_TARGETS))
        lines.push(`| ${profile} | ${ranges.map(([min, max]) => `${min}–${max}%`).join(' | ')} |`);
    }
  }
  if (r.towelFirst) {
    lines.push('', '| West harbour detour | Filed with towel |', '| --- | --- |');
    for (const row of r.towelFirst) lines.push(`| ${row.profile} | ${row.fourthStars}/${row.attempts} |`);
  }
  if (r.tripodFirst) {
    lines.push('', '| Tripod-leg detour | Catches | Pickup star |', '| --- | --- | --- |');
    for (const row of r.tripodFirst) {
      lines.push(`| ${row.profile} | ${row.catches}/${row.attempts} | ${row.fourthStars}/${row.attempts} |`);
    }
  }
  if (r.carFirst && r.carBeelines) {
    lines.push('', '| Car-first | Catches | Delivered | Pickup star | All four |', '| --- | --- | --- | --- | --- |');
    for (const row of r.carFirst)
      lines.push(`| ${row.profile} | ${row.catches}/${row.attempts} | ${row.delivered}/${row.attempts} | ${row.fourthStars}/${row.attempts} | ${row.allFour}/${row.attempts} |`);
    lines.push(`Naive car catches: ${r.carBeelines.filter(attempt => attempt.caught).length}/${r.carBeelines.length}.`);
  }
  lines.push('');
}
