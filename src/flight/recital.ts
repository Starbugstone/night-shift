import { pointInCone } from './geometry';
import type { CameraHazard } from './hazards';

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
  /** Listeners that slump when hazard 0 (avenue recital) and hazard 2 (complaints lectern) reach them. */
  listeners: [[660, 1425], [831, 2092]] as const,
  /** Untimed memo practice: on the avenue, outside the recital's reach; it ends at either outer lane. */
  practice: { x: 900, y: 850, laneDx: 552 },
} as const;
