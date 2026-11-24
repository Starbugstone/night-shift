import type { HazardField } from './hazards';
import { PhotoPhase, photoPhase } from './photographer';

/** Index of a photographer that half-pressed since last frame (`prev` = last frame's phase per hazard), or -1. */
export function photoHalfPressed(f: HazardField, prev: Uint8Array): number {
  let first = -1;
  for (let i = 0; i < f.defs.length; i++) {
    if (f.defs[i]!.type !== 'photographer') continue;
    const phase = photoPhase(f.b[i]!);
    if (phase === PhotoPhase.Iris && prev[i] !== PhotoPhase.Iris && first < 0) first = i;
    prev[i] = phase;
  }
  return first;
}
