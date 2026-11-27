import { pointInCone } from './geometry';
import type { CameraHazard, HazardDef } from './hazards';

export const RECITAL_LOOKAHEAD = 0.45;
export function cameraHeading(d: CameraHazard, t: number): number {
  return d.spin ? d.base + d.spin * t : d.base + d.amp * Math.sin(t * d.rate + d.phase);
}
export function recitalAt(d: CameraHazard, t: number, x: number, y: number): boolean {
  return pointInCone(x, y, d.x, d.y, cameraHeading(d, t), d.half, d.range);
}

/**
 * Grimsby 2199 set dressing that sits on the L12 map (src/levels/deep-2199.ts). v4 openings: Zib
 * arrives from the north under the west barge, so the DON'T PANIC board greets the launch on the west
 * lane and the big recital stands at the far end of the avenue, in front of Moe's bureau.
 */
export const GRIMSBY_SET = {
  /** DON'T PANIC board centre, on the harbour verge beside the launch, above the start banner. */
  sign: { x: 150, y: 340 },
  /**
   * Listeners that slump when their recital's cone reaches them: one on the avenue, one at the complaints
   * lectern. Each names its recital by the reciter's position, never by its place in the hazard list (v0.2
   * council round 3, Sol P3: an inert hazard put first in the list silenced both).
   */
  listeners: [
    { x: 660, y: 1425, recital: { x: 900, y: 1640 } },
    { x: 831, y: 2092, recital: { x: 900, y: 2260 } },
  ],
  /** Untimed memo practice: on the avenue, outside the recital's reach; it ends at either outer lane. */
  practice: { x: 900, y: 850, laneDx: 552 },
} as const;

/** For each Grimsby listener, the index in `defs` of the reciter camera it listens to, or -1 when the map has none. */
export function listenerRecitals(defs: readonly HazardDef[]): number[] {
  return GRIMSBY_SET.listeners.map(({ recital }) => defs.findIndex(d =>
    d.type === 'camera' && d.skin === 'reciter2199_top' && d.x === recital.x && d.y === recital.y));
}
