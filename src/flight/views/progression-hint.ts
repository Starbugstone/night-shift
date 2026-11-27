import { tr } from '../../i18n';
import { FRESH_LINE_SECONDS, readSeconds } from '../../core/read-time';
import type { AmbulanceHazard } from '../ambulance';
import type { DeepFlightScene } from '../deep-scene';
import { wrapAngle } from '../geometry';
import type { HazardDef, HazardType, PorchHazard, TrafficHazard, WatcherHazard } from '../hazards';
import { RABBIT, inRabbitRun } from '../grail'; // v0.2 follow-up: the L10 rabbit
import { inLighthouseShadow, type LighthouseHazard } from '../lighthouse';
import type { HumSlab } from '../monolith';
import type { PhotographerHazard } from '../photographer';

/** How far past its entry edge a lesson that is already showing stays up (same as the room lessons). */
export const LESSON_EXIT_PAD = 12;

/**
 * A first-encounter flight lesson: the hazard kind it is about, where its tip shows and where the
 * saucer has met that hazard. Every trigger comes from the hazard definitions on the map, so a moved
 * hazard moves its lesson with it (tests/flight-lesson-route.test.ts plays every level's route).
 */
export interface FlightLesson {
  hazard: HazardType;
  tip(): string;
  /** The tip shows here: near or inside one hazard of this kind. `pad` widens it (hysteresis). */
  zone(def: HazardDef, x: number, y: number, pad: number): boolean;
  /** The saucer is inside this hazard's danger at hazard time `t`: the encounter the tip prepares. */
  meets(def: HazardDef, x: number, y: number, t: number): boolean;
  /** Hidden while the saucer hovers in a delivery ring. */
  quietInRing?: boolean;
  /** First leg only: while suspicious, the cool-off tip takes over near the hazard, or anywhere. */
  coolOff?: 'near' | 'anywhere';
}

/** One lesson from a distance to the hazard's danger edge (≤ 0 inside): the tip shows from `band` px out. */
function near<T extends HazardDef>(
  hazard: T['type'], tip: () => string, reach: (def: T, x: number, y: number) => number, band: number | ((def: T) => number),
  extra: Pick<FlightLesson, 'quietInRing' | 'coolOff'> = {},
): FlightLesson {
  const bandOf = typeof band === 'number' ? () => band : band;
  return {
    hazard, tip, ...extra,
    zone: (def, x, y, pad) => reach(def as T, x, y) < bandOf(def as T) + pad,
    meets: (def, x, y) => reach(def as T, x, y) <= 0,
  };
}

/** A traffic lane: its headlight band across the road, and the cones' reach past each end. */
function laneReach(d: TrafficHazard, x: number, y: number): number {
  const across = Math.abs((d.dir === 'h' ? y : x) - d.at) - d.coneRange * Math.sin(d.coneHalf);
  const along = d.dir === 'h' ? x : y;
  const lo = Math.min(d.from, d.to) - d.coneRange;
  const hi = Math.max(d.from, d.to) + d.coneRange;
  return Math.max(across, lo - along, along - hi);
}

/** A porch is met at its sensor (it arms there); its tip shows from `out` px beyond the light it throws. */
const porchReach = (d: PorchHazard, x: number, y: number): number => Math.hypot(x - d.x, y - d.y) - d.trigger;
const pastLight = (out: number) => (d: PorchHazard): number => Math.max(0, d.r - d.trigger) + out;

/** The beam sweeps over (x, y) at time t, shadow or not: the moment the lesson is about. */
function beamOver(d: LighthouseHazard, x: number, y: number, t: number): boolean {
  const dx = x - d.x;
  const dy = y - d.y;
  if (dx * dx + dy * dy > d.range * d.range) return false;
  const beam = d.phase + (Math.PI * 2 * t) / d.period;
  return Math.abs(wrapAngle(Math.atan2(dy, dx) - beam)) <= d.half;
}

/** The lesson each level teaches in flight, keyed by level id. */
export const FLIGHT_LESSONS: Readonly<Record<string, FlightLesson>> = {
  // v4 openings: from the bend where the gate light comes into view
  birch_bakery: near<PorchHazard>('porch', () => tr().birch.goAround, porchReach, pastLight(300), { coolOff: 'anywhere' }),
  // v4 openings: as Mrs. Pruitt's binoculars come within reach
  birch_neighbours: near<WatcherHazard>('watcher', () => tr().birch.crossWatcher, (d, x, y) => Math.hypot(x - d.x, y - d.y) - d.range, 220),
  level3: near<PorchHazard>('porch', () => tr().lessons.porch, porchReach, pastLight(85), { quietInRing: true, coolOff: 'near' }),
  level4: near<TrafficHazard>('traffic', () => tr().lessons.traffic, laneReach, 140),
  level5: {
    hazard: 'lighthouse',
    tip: () => tr().lessons.lighthouse,
    zone: (def, x, y) => inLighthouseShadow(def as LighthouseHazard, x, y),
    meets: (def, x, y, t) => beamOver(def as LighthouseHazard, x, y, t),
  },
  level6: near<AmbulanceHazard>('ambulance', () => tr().lessons.ambulance, (d, x, y) => Math.hypot(x - d.bayX, y - d.bayY) - d.trigger, 200),
  level7: near<PhotographerHazard>('photographer', () => tr().lessons.shutter, (d, x, y) => Math.hypot(x - d.x, y - d.y) - d.range, 200, { quietInRing: true }),
  level8: near<HumSlab>('hum', () => tr().lessons.hum, (d, x, y) => Math.hypot(x - d.x, y - d.y) - d.outer, 135, { quietInRing: true }),
  // v0.2 follow-up: the killer rabbit lunges at a saucer that dawdles in its run; the tip shows as its circle nears
  level10: {
    hazard: 'rabbit',
    tip: () => tr().lessons.rabbit,
    zone: (def, x, y, pad) => Math.hypot(x - (def as { x: number }).x, y - (def as { y: number }).y) - RABBIT.radius < 320 + pad, // R3 (Fable F3): 170 px left the tip up 1.3 s
    meets: (def, x, y) => inRabbitRun((def as { x: number }).x, (def as { y: number }).y, x, y),
    quietInRing: true,
  },
};

const FRESH = 0;
const MET = 1;
const SPENT = 2;
/**
 * Per run (a new flight scene starts each leg): has the saucer met the lesson's hazard, and has it left the
 * zone since with the tip seen? Until then the lesson keeps its place on later legs.
 */
const encounters = new WeakMap<object, LessonRun>();

/**
 * v0.2 council R2: the lesson retires only once its tip has been on screen for its reading time in total.
 * R3 (Fable F3): `upSince` is when the tip on screen came up (`lastT >= 0` while it is up).
 */
interface LessonRun { stage: number; shownSec: number; lastT: number; upSince: number }

/** Once up, a tip stays at least this long (its read time when shorter) after the saucer leaves its zone (Fable F3). */
export function lessonHoldSeconds(tip: string): number {
  return Math.min(FRESH_LINE_SECONDS, readSeconds(tip));
}

/**
 * For tests: whether this run's lesson has retired, whether the saucer has met its hazard (v0.2 council round 5), and
 * how long its tip has been on screen.
 */
export function flightLessonState(run: object): { spent: boolean; met: boolean; shownSec: number } | null {
  const seen = encounters.get(run);
  return seen ? { spent: seen.stage === SPENT, met: seen.stage !== FRESH, shownSec: seen.shownSec } : null;
}

/**
 * The flight lesson for this frame, or ''. `active` is the lesson shown last frame: it keeps its
 * zone LESSON_EXIT_PAD px wider, so a saucer drifting along a zone edge doesn't make it flicker.
 * A hazard lesson shows on any leg until the saucer has met that hazard and flown clear of it. It also
 * shows over the dispatch banner (they never overlap): several shifts meet their hazard within 2 s.
 */
export function flightLesson(scene: DeepFlightScene, active = ''): string {
  const { sim, run, level } = scene;
  if (scene.state !== 'fly') {
    // spotted, or the leg ends: the tip comes down and its hold with it
    const s = encounters.get(run);
    if (s) s.lastT = -1;
    return '';
  }
  const { x, y } = sim.saucer;
  const { lessons } = tr();
  if (scene.practice) {
    if (scene.bannerT > 0 || run.legs > 0) return '';
    if (sim.suspicion > 0) return lessons.coolOff;
    const { ring, porch } = tr().fieldCheck.prompts;
    return sim.inRing >= 0 || y < 575 + padFor(ring, active) - padFor(porch, active) ? ring : porch;
  }
  const lesson = FLIGHT_LESSONS[level.id];
  if (!lesson) return '';
  let seen = encounters.get(run);
  if (!seen) encounters.set(run, (seen = { stage: FRESH, shownSec: 0, lastT: -1, upSince: 0 }));
  const tip = lesson.tip();
  const p = padFor(tip, active);
  const cool = lesson.coolOff !== undefined && run.legs === 0 && sim.suspicion > 0;
  let cooling = cool && lesson.coolOff === 'anywhere';
  let inZone = false;
  for (const def of sim.field.defs) {
    if (def.type !== lesson.hazard) continue;
    if (seen.stage === FRESH && lesson.meets(def, x, y, sim.t)) seen.stage = MET;
    if (lesson.zone(def, x, y, p)) inZone = true;
    if (cool && !cooling && lesson.zone(def, x, y, padFor(lessons.coolOff, active))) cooling = true;
  }
  // v0.2 council R3 (Fable F3): a tip that is up stays for its hold even once the saucer leaves the zone or hovers
  // into a ring (the leg ends at the lock, which takes the tip down)
  const held = seen.lastT >= 0 && sim.t >= seen.upSince && sim.t - seen.upSince < lessonHoldSeconds(tip);
  const read = metAndRead(seen, tip);
  // v0.2 council R2: a tip flashed for a frame (L5 spawns in a lighthouse shadow) used to retire the lesson.
  // Round 4 (Fable F3): it never retires in the middle of a showing's hold either
  if (!inZone && !held && read) seen.stage = SPENT;
  if (cooling) {
    seen.lastT = -1;
    return lessons.coolOff;
  }
  // round 4 (Fable F3): a lesson already met and read is not raised again (a leg starting in its zone flashed it)
  if ((!inZone && !held) || seen.stage === SPENT || (read && seen.lastT < 0) || (lesson.quietInRing && sim.inRing >= 0 && !held)) {
    seen.lastT = -1;
    return '';
  }
  if (seen.lastT < 0) seen.upSince = sim.t;
  if (seen.lastT >= 0 && sim.t > seen.lastT) seen.shownSec += Math.min(sim.t - seen.lastT, 0.1);
  seen.lastT = sim.t;
  return tip;
}

/** The lesson's hazard was met and its tip has been on screen for its read time (it may retire). */
function metAndRead(seen: LessonRun, tip: string): boolean {
  return seen.stage === MET && seen.shownSec >= readSeconds(tip);
}

/** The zone of the tip already on screen is LESSON_EXIT_PAD px wider (no per-frame closure). */
function padFor(tip: string, active: string): number {
  return tip === active ? LESSON_EXIT_PAD : 0;
}
