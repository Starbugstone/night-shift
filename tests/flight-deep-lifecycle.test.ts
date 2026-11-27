// Deep-shift lifecycle edges where the shared deadline used to drop what the player had earned
// (council v0.2 item 11). Each guard walks every deep level in LEVELS.
// - A sighting counts when it happens, not on the respawn tap: a deadline while the Spotted card shows
//   still files it in the failure report.
// - A delivery the room accepted is safe: its exit animation (Grail's exitSettleSec widens it) is not
//   charged, so the deadline cannot expire under it.
// - The 2199 opener holds back flavour lines, never a warning.
import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import type { GameContext } from '../src/contracts';
import { DeepFlightScene, SPOT_SKIP } from '../src/flight/deep-scene';
import { tr } from '../src/i18n';
import { isDeep, LEVELS, workOrderNumber } from '../src/levels/levels';
import { DeepRun, SUNRISE_WARN } from '../src/levels/run';
import type { DeepLevelDef } from '../src/levels/types';
import { DeepAbductScene } from '../src/ui/deep-abduct';

const DT = 1 / 60;
const DEEP = LEVELS.filter(isDeep) as DeepLevelDef[];

function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {}, speak() {}, hush() {} } as never, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0,
  };
}

function flight(lv: DeepLevelDef) {
  const ctx = context();
  const run = new DeepRun(lv, workOrderNumber(lv.id) - 1);
  const onSunrise = vi.fn();
  const scene = new DeepFlightScene({ run, level: lv, ctx, onLocked: vi.fn(), onSunrise, onQuit: vi.fn() });
  return { ctx, run, scene, onSunrise };
}

describe('a sighting counts when it happens', () => {
  it.each(DEEP.map((lv) => [lv.id, lv] as const))('%s', (_id, lv) => {
    const { ctx, run, scene, onSunrise } = flight(lv);
    const finite = Number.isFinite(run.budget);
    scene.update(DT);
    if (finite) run.tick(run.remaining - 0.5);
    scene.sim.phase = 'spotted';
    scene.update(DT);
    expect(scene.state).toBe('spotted');
    expect(run.spotted).toBe(1);
    for (let i = 0; i < 2 * 60; i++) scene.update(DT);
    if (finite) {
      // the deadline came while the card was up: the report still has the sighting
      expect(onSunrise).toHaveBeenCalledOnce();
      expect(run.summary().spotted).toBe(1);
      return;
    }
    expect(scene.st).toBeGreaterThan(SPOT_SKIP);
    Object.assign(ctx.pointer, { down: true, pressed: true });
    scene.update(DT);
    expect(scene.state).toBe('fly');
    expect(run.spotted).toBe(1);
  });

  it('the respawn tap does not count it twice', () => {
    const lv = DEEP.find((l) => l.id === 'level3')!;
    const { ctx, run, scene } = flight(lv);
    scene.update(DT);
    scene.sim.phase = 'spotted';
    scene.update(DT);
    for (let i = 0; i < 60; i++) scene.update(DT);
    Object.assign(ctx.pointer, { down: true, pressed: true });
    scene.update(DT);
    expect(scene.state).toBe('fly');
    expect(run.spotted).toBe(1);
    expect({ ...scene.sim.saucer }).toMatchObject(run.checkpoint);
  });
});

describe('an accepted delivery is safe from the deadline', () => {
  const timed = DEEP.filter((lv) => Number.isFinite(lv.budgetSec));
  it.each(timed.map((lv) => [lv.id, lv] as const))('%s', (_id, lv) => {
    for (const delivered of [true, false]) {
      const run = new DeepRun(lv, workOrderNumber(lv.id) - 1);
      const target = lv.map.targets.findIndex((tg) => tg.entries.length > 0);
      run.startAbduct(target, 0);
      run.tick(run.remaining - 0.5);
      const room = { delivered: false };
      const inner = { view: new Container(), render() {}, update: vi.fn(), debug: room };
      const onSunrise = vi.fn();
      const scene = new DeepAbductScene(inner, run, { get: () => undefined }, () => true, onSunrise);
      scene.update(DT);
      room.delivered = delivered;
      const before = run.elapsed;
      for (let i = 0; i < 3 * 60; i++) scene.update(DT); // an exit animation longer than the time left
      expect(onSunrise.mock.calls.length, `delivered=${delivered}`).toBe(delivered ? 0 : 1);
      if (delivered) {
        expect(run.elapsed).toBe(before);
        expect(inner.update).toHaveBeenCalledTimes(3 * 60 + 1);
      }
    }
  });
});

describe('the 2199 opener', () => {
  it('lets the demolition warning cut in', () => {
    const lv = DEEP.find((l) => l.id === 'level12')!;
    const { run, scene } = flight(lv);
    const opener = tr().humor.deepZib.start12[0];
    scene.sim.place(600, 860, 3); // the west lectern's poet is in view
    for (let i = 0; i < 120 && scene.zibText !== opener; i++) scene.update(DT);
    expect(scene.zibText).toBe(opener);
    // the demolition warning starts while the opener is still up
    run.tick(run.remaining - SUNRISE_WARN - 0.005);
    scene.sim.place(600, 860, 3);
    scene.update(DT);
    expect(scene.zibPanic).toBe(true);
    expect(tr().humor.deepZib.demolition).toContain(scene.zibText);
  });
});
