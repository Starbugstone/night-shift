import { tr } from '../../i18n';
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
    zone: (def, x, y, pad) => Math.hypot(x - (def as { x: number }).x, y - (def as { y: number }).y) - RABBIT.radius < 170 + pad,
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
const encounters = new WeakMap<object, { stage: number; shown: boolean }>();

/**
 * The flight lesson for this frame, or ''. `active` is the lesson shown last frame: it keeps its
 * zone LESSON_EXIT_PAD px wider, so a saucer drifting along a zone edge doesn't make it flicker.
 * A hazard lesson shows on any leg until the saucer has met that hazard and flown clear of it. It also
 * shows over the dispatch banner (they never overlap): several shifts meet their hazard within 2 s.
 */
export function flightLesson(scene: DeepFlightScene, active = ''): string {
  const { sim, run, level } = scene;
  if (scene.state !== 'fly') return '';
  const { x, y } = sim.saucer;
  const { lessons } = tr();
  const pad = (tip: string): number => (tip === active ? LESSON_EXIT_PAD : 0);
  if (scene.practice) {
    if (scene.bannerT > 0 || run.legs > 0) return '';
    if (sim.suspicion > 0) return lessons.coolOff;
    const { ring, porch } = tr().fieldCheck.prompts;
    return sim.inRing >= 0 || y < 575 + pad(ring) - pad(porch) ? ring : porch;
  }
  const lesson = FLIGHT_LESSONS[level.id];
  if (!lesson) return '';
  let seen = encounters.get(run);
  if (!seen) encounters.set(run, (seen = { stage: FRESH, shown: false }));
  const tip = lesson.tip();
  const p = pad(tip);
  const cool = lesson.coolOff !== undefined && run.legs === 0 && sim.suspicion > 0;
  let cooling = cool && lesson.coolOff === 'anywhere';
  let inZone = false;
  for (const def of sim.field.defs) {
    if (def.type !== lesson.hazard) continue;
    if (seen.stage === FRESH && lesson.meets(def, x, y, sim.t)) seen.stage = MET;
    if (lesson.zone(def, x, y, p)) inZone = true;
    if (cool && !cooling && lesson.zone(def, x, y, pad(lessons.coolOff))) cooling = true;
  }
  if (!inZone && seen.stage === MET && seen.shown) seen.stage = SPENT;
  if (cooling) return lessons.coolOff;
  if (!inZone || seen.stage === SPENT || (lesson.quietInRing && sim.inRing >= 0)) return '';
  seen.shown = true;
  return tip;
}
