// v0.2 sound repeats (council item 5, 2026-11-27): no cue may repeat like an ambient loop. Every room in ROOMS
// (an autopilot run and an idle run) and every flight level in LEVELS (parked at the launch, then flown along a
// route) is played headlessly with a recording audio. Each sfx name is capped per 60 s window.
import { describe, expect, it } from 'vitest';
import type { Audio, GameContext, PointerState, RoomId, SfxName } from '../src/contracts';
import { GEIGER, WitnessReactions } from '../src/abduct/invasion1953';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { FlightScene } from '../src/flight/scene';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef, TutorialLevelDef } from '../src/levels/types';

declare const process: { stdout: { write(s: string): void } };
const DT = 1 / 60;
const WINDOW = 60;

class Recorder implements Audio {
  t = 0;
  readonly plays = new Map<SfxName, number[]>();
  sfx(name: SfxName, volume = 1): void {
    if (volume <= 0) return;
    let list = this.plays.get(name);
    if (!list) this.plays.set(name, list = []);
    list.push(this.t);
  }
  /** The most plays of each name inside any WINDOW-second span. */
  peaks(): Map<SfxName, number> {
    const out = new Map<SfxName, number>();
    for (const [name, times] of this.plays) {
      let best = 0;
      for (let i = 0, j = 0; j < times.length; j++) {
        while (times[j]! - times[i]! >= WINDOW) i++;
        best = Math.max(best, j - i + 1);
      }
      out.set(name, best);
    }
    return out;
  }
}

function roomRun(id: RoomId, drive: boolean, limit: number): Recorder {
  const room = ROOMS[id]!;
  const deep = Boolean(room.interior);
  const audio = new Recorder();
  const sim = new AbductSimulation(room, new Set(), audio, () => 0.5, { hard: deep, wakeFails: deep });
  let x = sim.body.beamX;
  let y = sim.body.beamY;
  for (let f = 0; f < limit / DT && !sim.complete && !sim.failure; f++) {
    audio.t = f * DT;
    if (drive) {
      const { dx, dy } = sim.autopilot();
      x += dx;
      y += dy;
      sim.moveBeam(x, y);
    }
    sim.update(DT);
  }
  return audio;
}

function context(audio: Audio): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio, upgrades: new Set(), reducedMotion: true, tutorial: false, time: 0,
  };
}

function press(p: PointerState, down: boolean, x: number, y: number): void {
  p.pressed = down && !p.down;
  p.released = !down && p.down;
  p.down = down;
  p.x = x;
  p.y = y;
}

/** Fly a deep shift: parked at the launch for `park` s, then on the scene's own autopilot, rooms passed as delivered. */
function deepFlight(level: DeepLevelDef, park: number, limit: number): Recorder {
  const audio = new Recorder();
  const ctx = context(audio);
  const run = new DeepRun(level, workOrderNumber(level.id) - 1);
  let locked: [number, number] | null = null;
  let over = false;
  const make = (): DeepFlightScene => new DeepFlightScene({
    ctx, level, run, onLocked: (t, e) => { locked = [t, e]; }, onSunrise: () => { over = true; }, onQuotaMet: () => { over = true; }, onQuit: () => { over = true; },
  });
  let scene = make();
  for (let f = 0; f < limit / DT && !over; f++) {
    audio.t = f * DT;
    ctx.time += DT;
    if (locked) {
      run.startAbduct(locked[0], locked[1]);
      locked = null;
      const next = run.finishAbduct({ delivered: true, woke: false, timeSec: 30, bonks: 0, dignity: 100, snores: 0, itemsStolen: [], aborted: false });
      if (next !== 'flight') break;
      scene = make();
    }
    if (scene.state === 'spotted') press(ctx.pointer, Math.floor(f / 6) % 2 === 0, 270, 480);
    else if (audio.t < park) press(ctx.pointer, false, 270, 480);
    else {
      const hand = scene.debug.autopilot();
      press(ctx.pointer, hand.down, hand.x, hand.y);
    }
    scene.update(DT);
  }
  return audio;
}

/** A tutorial flight: parked for `park` s, then a finger held toward each ring in turn (it may be spotted). */
function tutorialFlight(level: TutorialLevelDef, park: number, limit: number): Recorder {
  const audio = new Recorder();
  const ctx = context(audio);
  let locked = false;
  const scene = new FlightScene({ ctx, level, spotted: 0, onLocked: () => { locked = true; }, onQuit: () => { locked = true; } });
  const rings = level.map.entries;
  for (let f = 0; f < limit / DT && !locked; f++) {
    audio.t = f * DT;
    ctx.time += DT;
    if (scene.state === 'spotted') press(ctx.pointer, Math.floor(f / 6) % 2 === 0, 270, 480);
    else if (audio.t < park) press(ctx.pointer, false, 270, 480);
    else {
      const ring = rings[Math.floor((audio.t - park) / 30) % rings.length]!;
      const dx = ring.x - scene.saucer.x;
      const dy = ring.y - scene.saucer.y;
      const d = Math.hypot(dx, dy) || 1;
      press(ctx.pointer, true, 270 + (dx / d) * 120, 480 + (dy / d) * 120);
    }
    scene.update(DT);
  }
  return audio;
}

function flight(id: string, park: number, limit: number): Recorder {
  const level = LEVELS.find(l => l.id === id)!;
  return isDeep(level) ? deepFlight(level, park, limit) : tutorialFlight(level as TutorialLevelDef, park, limit);
}

const fmt = (m: Map<SfxName, number>): string => [...m].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}×${c}`).join(' ') || 'silent';

/**
 * Most plays of one cue in any minute. Before the v0.2 fix the Forester rooms ticked 41 (kitchen) and 38 (attic)
 * times a minute, the bell clapper 28, and L10's cows mooed and creaked 18 times a minute while the saucer sat
 * at the launch, 976 and 1277 px away. The busiest cue a sleeper makes on their own (snores, mumbles) is 10.
 */
const CAP = 16;
/**
 * Tutorial flights have no autopilot, so their route holds a finger straight at each ring and is caught on the
 * way (no straight-line win). The cues of being seen or bumping then answer that bad driving, not a clock.
 */
const EXPOSURE: ReadonlySet<SfxName> = new Set(['alert', 'bark', 'spotted', 'bonk']);

function over(peaks: Map<SfxName, number>, skip: ReadonlySet<SfxName> = new Set()): string[] {
  return [...peaks].filter(([n, c]) => c > CAP && !skip.has(n)).map(([n, c]) => `${n}×${c}/min`);
}

describe('no cue repeats like an ambient loop', () => {
  it.each(Object.keys(ROOMS) as RoomId[])('room %s: autopilot run and 120 s idle', (id) => {
    const auto = roomRun(id, true, 120);
    const idle = roomRun(id, false, 120);
    process.stdout.write(`[room ${id}] auto ${fmt(auto.peaks())} | idle ${fmt(idle.peaks())}\n`);
    expect({ auto: over(auto.peaks()), idle: over(idle.peaks()) }).toEqual({ auto: [], idle: [] });
  }, 60_000);

  it.each(LEVELS.map(l => l.id))('flight %s: parked at the launch for 60 s, then flown', (id) => {
    const level = LEVELS.find(l => l.id === id)!;
    const parked = flight(id, 60, 60);
    const route = flight(id, 0, 300);
    process.stdout.write(`[flight ${id}] parked ${fmt(parked.peaks())} | route ${fmt(route.peaks())}\n`);
    expect({ parked: over(parked.peaks()), route: over(route.peaks(), isDeep(level) ? undefined : EXPOSURE) })
      .toEqual({ parked: [], route: [] });
  }, 120_000);

  it('keeps the hazard-timing cues audible where they matter', () => {
    // the clapper clicks while Matt is carried past the bell, the cows moo on the way past the catapults
    expect(roomRun('collier_bell', true, 120).plays.get('clapper')?.length ?? 0).toBeGreaterThan(2);
    expect(flight('level10', 0, 300).plays.get('moo')?.length ?? 0).toBeGreaterThan(1);
  }, 120_000);
});

describe('the Geiger counter (forester rooms)', () => {
  const tick = (wake: number): number[] => {
    const volumes: number[] = [];
    const audio: Audio = { sfx: (name, v = 1) => { if (name === 'clock_tick') volumes.push(v); } };
    const geiger = new WitnessReactions('forester', audio);
    for (let f = 0; f < 10 / DT; f++) geiger.step(f * DT, wake, wake, false, 0, 0);
    return volumes;
  };

  it('stays silent until Clive is half awake, then quickens and grows louder as he wakes', () => {
    expect(tick(0)).toEqual([]);
    expect(tick(GEIGER.from - 1)).toEqual([]);
    const half = tick(GEIGER.from);
    const nearly = tick(95);
    expect(half.length).toBeGreaterThan(5);
    expect(nearly.length).toBeGreaterThan(half.length * 2);
    expect(Math.max(...nearly)).toBeGreaterThan(Math.max(...half));
    expect(Math.max(...nearly)).toBeLessThanOrEqual(GEIGER.loud);
  });
});
