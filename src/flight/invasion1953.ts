import type { CameraHazard, HazardField } from './hazards';

export const DRIVE_IN_PROJECTOR = {
  type: 'camera', skin: 'invasion_projector_top', x: 900, y: 1460,
  range: 600, half: 0.76, base: Math.PI / 2, amp: 0, rate: 0, phase: 0,
} satisfies CameraHazard;

export const TRIPOD_SNEEZE = {
  type: 'camera', skin: 'invasion_sick_tripod_top', x: 900, y: 1650,
  range: 640, half: 0.47, base: -2.25, amp: 0, rate: 0, phase: 0,
  burst: { period: 5.5, warning: 1.2, live: 1.32 },
} satisfies CameraHazard;

/**
 * The drive-in projector is what sees the saucer (`cause` is the detecting hazard's index, -1 for none). Round 3:
 * found by its skin, so a reordered hazard list can't hand the applause to another detector.
 */
export function projectorSees(field: Pick<HazardField, 'defs'>, cause: number): boolean {
  const def = cause >= 0 ? field.defs[cause] : undefined;
  return def?.type === 'camera' && def.skin === DRIVE_IN_PROJECTOR.skin;
}

export const greetedPilotQueues = new WeakSet<object>();

export const PILOT_QUEUE = { x: 1420, y: 1900 };
export const TRIPOD_LEG = { id: 'tripod_leg', x: 135, y: 1230 } as const;
export const SNEEZE_SHORTCUT = [{ x: 300, y: 1300 }, { x: 800, y: 1300 }, { x: 900, y: 1125 }, { x: 1500, y: 1125 }] as const;

export interface CameraBurst { period: number; warning: number; live: number }

export function burstPhase(burst: CameraBurst, time: number): 'idle' | 'warn' | 'live' {
  const phase = ((time % burst.period) + burst.period) % burst.period;
  if (phase < burst.live) return time >= burst.period ? 'live' : 'idle';
  return phase >= burst.period - burst.warning ? 'warn' : 'idle';
}
