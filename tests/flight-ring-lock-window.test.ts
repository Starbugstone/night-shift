// Every entry ring can be timed without an upgrade (docs/REGRESSIONS.md L22; council round 6, Neon P2, Opus F3, Fable).
// v0.2 cut L3's fuse to 0.9 s, under the 1.0 s lock time, while Gary's CCTV cone (half 0.26 > sweep 0.13) never left
// the garage-door ring centre: a hover there locked 0/40 start times without Hush Drive, so "timed door" could not be
// timed, the autopilot held off it and the casual model stalled there (L21).
//
// For every deep level in LEVELS and every entry ring, with no upgrades, the saucer is parked (stopped, fuse empty, no
// spawn shield) at the ring centre or a spot within half the lock radius of it, at start times every STEP s over SPAN s,
// and left to hover on the real DeepFlightSim (its hazards, detection, fuse and LockOn). A start time is lockable when
// some spot holds HOLD s (the lock plus a human margin) before the fuse runs out. The ring passes when its lockable
// start times form windows of at least MIN_WINDOW s that come back at least every MAX_WAIT s. Calibration (7ee9412,
// before the fix): gary_garagedoor 0/160 start times; the next worst healthy rings are L7 greg_cabin (48/160, longest
// wait 3.75 s, widest window 1.5 s; Fable round 6 parks it 32/80) and L4 mayor_clocktower (122/160, longest wait 1.75 s).
import { describe, expect, it } from 'vitest';
import { DeepFlightSim } from '../src/flight/deep-sim';
import type { HazardDef } from '../src/flight/hazards';
import { LOCK, LockOn, RING_R } from '../src/flight/sim';
import { isDeep, LEVELS } from '../src/levels/levels';
import type { DeepLevelDef } from '../src/levels/types';

const DT = 1 / 60;
/** Lock-on radius: the saucer centre must be within this of the ring centre. */
const LOCK_R = RING_R * LOCK.insideFrac;
/**
 * How far from the centre a timed hover may sit: half the lock radius (24 px, about half the saucer's 44 px radius).
 * A thumb aiming at the ring lands there; only a pixel-placed hover reaches the outer rim, which is what kept the
 * shipped garage door "lockable" in the browser (Sol round 6: 22% of the lock disk, its SE/NE rim).
 */
const SPOT_R = LOCK_R / 2;
/** Human margin over the lock time: a quarter second late on the hold, or arriving a beat early. */
const MARGIN = 0.25;
const HOLD = LOCK.time + MARGIN;
const STEP = 0.25;
/** Two sweeps of the slowest cycle on these maps (the L3 cruiser laps in about 19 s). */
const SPAN = 40;
/** A window a hand can hit: three start times in a row. */
const MIN_WINDOW = 0.5;
/** The longest wait outside a ring for its next window; the healthy rings wait at most 3.75 s (see the header). */
const MAX_WAIT = 8;

const SPOTS: { x: number; y: number }[] = [{ x: 0, y: 0 }];
for (const r of [SPOT_R / 2, SPOT_R]) for (let k = 0; k < 8; k++) SPOTS.push({ x: r * Math.cos((k * Math.PI) / 4), y: r * Math.sin((k * Math.PI) / 4) });
const UP = { down: false, pressed: false, released: false, x: 270, y: 480 };

/** Parks the saucer at (x, y) at time t0 and hovers: true when it locks ring (ti, ei) after HOLD s, unspotted. */
function hoverLocks(map: DeepLevelDef['map'], ti: number, ei: number, x: number, y: number, t0: number): boolean {
  const sim = new DeepFlightSim(map, new Set(), t0);
  (sim as unknown as { lock: LockOn }).lock = new LockOn(HOLD);
  sim.place(x, y, 0);
  for (let f = 0; f < (HOLD + 0.5) / DT; f++) {
    sim.update(DT, UP);
    if (sim.phase === 'spotted') return false;
    if (sim.justLocked) {
      const ref = sim.ringRef[sim.lockedRing]!;
      return ref.target === ti && ref.entry === ei;
    }
  }
  return false;
}

interface RingWindow { roomId: string; lockable: number; samples: number; centre: number; longestWait: number; widest: number }

function ringWindow(map: DeepLevelDef['map'], ti: number, ei: number): RingWindow {
  const e = map.targets[ti]!.entries[ei]!;
  const samples = Math.round(SPAN / STEP);
  let lockable = 0;
  let centre = 0;
  let run = 0;
  let widest = 0;
  let wait = 0;
  let longestWait = 0;
  for (let k = 0; k < samples; k++) {
    const t0 = k * STEP;
    let ok = false;
    for (let s = 0; s < SPOTS.length && !ok; s++) {
      ok = hoverLocks(map, ti, ei, e.x + SPOTS[s]!.x, e.y + SPOTS[s]!.y, t0);
      if (ok && s === 0) centre++;
    }
    if (ok) {
      lockable++;
      run++;
      // a window too short to hit does not end the wait
      if (run * STEP >= MIN_WINDOW) wait = 0;
    } else {
      run = 0;
    }
    widest = Math.max(widest, run * STEP);
    if (!ok || run * STEP < MIN_WINDOW) wait += STEP;
    longestWait = Math.max(longestWait, wait);
  }
  return { roomId: e.roomId, lockable, samples, centre, longestWait, widest };
}

const faults = (map: DeepLevelDef['map']): string[] => {
  const out: string[] = [];
  map.targets.forEach((t, ti) => t.entries.forEach((_, ei) => {
    const w = ringWindow(map, ti, ei);
    if (w.widest < MIN_WINDOW || w.longestWait > MAX_WAIT) {
      out.push(`${w.roomId}: lockable at ${w.lockable}/${w.samples} start times (centre ${w.centre}), widest window ${w.widest} s (want ≥ ${MIN_WINDOW}), longest wait ${w.longestWait} s (want ≤ ${MAX_WAIT})`);
    }
  }));
  return out;
};

const deep = LEVELS.filter(isDeep);

describe('every entry ring has a lock window without upgrades', () => {
  it('walks every deep level in LEVELS', () => {
    expect(deep.length).toBeGreaterThan(10);
    expect(deep.every(l => l.map.targets.some(t => t.entries.length > 0))).toBe(true);
  });

  for (const level of deep) {
    it(`${level.id}: every entry ring can be timed (hover ${HOLD} s within ${SPOT_R} px of the centre)`, () => {
      expect(faults(level.map)).toEqual([]);
    }, 120_000);
  }

  // mutation (Opus round 6 F2): a static camera parked over a ring must fail the guard
  it('fails a ring under a static camera', () => {
    const level = deep.find(l => l.id === 'level3')!;
    const e = level.map.targets[0]!.entries[1]!;
    const parked: HazardDef = { type: 'camera', x: e.x - 200, y: e.y, range: 320, half: 0.4, base: 0, amp: 0, rate: 0, phase: 0 };
    expect(faults({ ...level.map, hazards: [...level.map.hazards, parked] }).map(f => f.split(':')[0])).toContain(e.roomId);
  }, 120_000);
});
