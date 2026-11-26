import { pointInCone } from './geometry';
import type { CameraHazard } from './hazards';

export const RECITAL_LOOKAHEAD = 0.45;
export function cameraHeading(d: CameraHazard, t: number): number {
  return d.spin ? d.base + d.spin * t : d.base + d.amp * Math.sin(t * d.rate + d.phase);
}
export function recitalAt(d: CameraHazard, t: number, x: number, y: number): boolean {
  return pointInCone(x, y, d.x, d.y, cameraHeading(d, t), d.half, d.range);
}
