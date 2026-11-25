// The SPOTTED card waits for a tap instead of closing on a timer; the sunrise clock charges only
// the first SPOT_HOLD seconds of it, the same penalty as when the card closed by itself.
import { describe, expect, it, vi } from 'vitest';
import type { GameContext } from '../src/contracts';
import { DeepFlightScene, SPOT_HOLD } from '../src/flight/deep-scene';
import { FlightScene } from '../src/flight/scene';
import { tr } from '../src/i18n';
import { LEVEL9 } from '../src/levels/deep-1955';
import { LEVEL3 } from '../src/levels/deep-levels';
import { LEVELS } from '../src/levels/levels';
import type { TutorialLevelDef } from '../src/levels/types';
import { DeepRun, SUNRISE_WARN } from '../src/levels/run';

const DT = 1 / 60;
function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0,
  };
}
function tap(ctx: GameContext, update: () => void): void {
  Object.assign(ctx.pointer, { down: true, pressed: true });
  update();
  Object.assign(ctx.pointer, { down: false, pressed: false, released: true });
  update();
  ctx.pointer.released = false;
}

describe('SPOTTED card', () => {
  it('waits for a tap on a deep shift and charges the clock only for the hold', () => {
    const ctx = context();
    const run = new DeepRun(LEVEL3, 2);
    const scene = new DeepFlightScene({ run, level: LEVEL3, ctx, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn() });
    scene.update(DT);
    scene.sim.phase = 'spotted';
    scene.update(DT);
    expect(scene.state).toBe('spotted');
    const before = run.elapsed;
    for (let i = 0; i < 10 * 60; i++) scene.update(DT);
    expect(scene.state).toBe('spotted');
    expect(run.elapsed - before).toBeCloseTo(SPOT_HOLD, 1);
    tap(ctx, () => scene.update(DT));
    expect(scene.state).toBe('fly');
  });

  it('waits for a tap in a tutorial flight', () => {
    const ctx = context();
    const scene = new FlightScene({ ctx, level: LEVELS[0] as TutorialLevelDef, spotted: 0, onLocked: vi.fn(), onQuit: vi.fn() });
    scene.update(DT);
    scene.state = 'spotted';
    scene.st = 0;
    for (let i = 0; i < 10 * 60; i++) scene.update(DT);
    expect(scene.state).toBe('spotted');
    tap(ctx, () => scene.update(DT));
    expect(scene.state).toBe('fly');
    expect(scene.spotted).toBe(1);
  });
});

it.each([
  [LEVEL3, 'dawn'],
  [LEVEL9, 'stormClosing'],
] as const)('$0.id only announces its deadline when the clock crosses the warning', (level, key) => {
  const base = context();
  const speak = vi.fn();
  const ctx = { ...base, audio: { ...base.audio, speak } };
  const run = new DeepRun(level, LEVELS.findIndex(l => l.id === level.id));
  const start = () => new DeepFlightScene({ run, level, ctx, onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn() });
  const saysWarning = () => speak.mock.calls.filter(([text]) =>
    (tr().humor.deepZib[key] as readonly string[]).includes(text));

  const flight = start();
  run.elapsed = run.budget - SUNRISE_WARN - DT / 2;
  flight.update(DT);
  flight.update(DT);
  expect(saysWarning()).toHaveLength(1);
  run.elapsed = run.budget - 5;
  start().update(DT);
  expect(saysWarning()).toHaveLength(1);
});
