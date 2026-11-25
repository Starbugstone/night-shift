import type { HazardDef } from './hazards';

/** The standing wave leaves a quiet pocket around the slab throughout its cycle. */
export interface HumSlab {
  type: 'hum';
  x: number;
  y: number;
  inner: number;
  outer: number;
  period: number;
  sounding: number;
  phase: number;
}

export const HUM_WARNING = 0.55;

export function humPhase(slab: HumSlab, time: number): number {
  return (time + slab.phase) % slab.period;
}

export function inHumBelt(slab: HumSlab, x: number, y: number): boolean {
  const dx = x - slab.x;
  const dy = y - slab.y;
  const r2 = dx * dx + dy * dy;
  return r2 >= slab.inner ** 2 && r2 <= slab.outer ** 2;
}

/** A newly sounding slab within earshot, once at the start of each note. */
export function nearHumOnset(hazards: readonly HazardDef[], x: number, y: number, from: number, to: number): boolean {
  for (const d of hazards) {
    if (d.type !== 'hum' || Math.hypot(x - d.x, y - d.y) > d.outer + 160) continue;
    if (humPhase(d, to) < humPhase(d, from)) return true;
  }
  return false;
}
