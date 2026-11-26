import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AmbientBed, FlightResult } from '../src/contracts';
import { Game } from '../src/core/game';
import { SceneManager } from '../src/core/scenes';
import { FIELD_CHECK, FIELD_CHECK_INDEX } from '../src/levels/field-check';
import { LEVELS } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import { defaultSave, type LevelId } from '../src/levels/save';

const sources = import.meta.glob<string>('../src/**/*.ts', { query: '?raw', import: 'default', eager: true });

it('keeps click out of the sound palette and all call sites', () => {
  for (const [path, source] of Object.entries(sources)) {
    expect(source, path).not.toMatch(/sfx\s*\(\s*['"]click['"]|case\s+['"]click['"]\s*:/);
  }
});

it('keeps alien voices out of flight and abduction scenes', () => {
  for (const [path, source] of Object.entries(sources)) {
    if (/src\/(flight\/|abduct\/|ui\/(deep-abduct|field-check)\.ts)/.test(path)) {
      expect(source, path).not.toMatch(/\baudio\.speak(?:\?\.)?\s*\(/);
    }
  }
});

function shell() {
  const pointer = { x: 0, y: 0, pressed: false, released: false, down: false };
  const audio = { ambient: vi.fn(), sfx: vi.fn(), speak: vi.fn(), hush: vi.fn(), setMuted: vi.fn() };
  const assets = { get: () => undefined, progress: 0, done: false };
  const scenes = new SceneManager(pointer);
  const game: Game = Object.assign(Object.create(Game.prototype), {
    _save: defaultSave(), scenes, audio, assets,
    ctx: { audio, assets, pointer, reducedMotion: true, upgrades: new Set(), tutorial: false, time: 0 },
  });
  return { game, audio, scenes };
}

const flight: FlightResult = { roomId: 'farm_window', timeSec: 0, spotted: 0 };
const fail = { delivered: false, aborted: true, timeSec: 1, bonks: 0, dignity: 100, snores: 0, itemsStolen: [], woke: false };

afterEach(() => vi.unstubAllGlobals());

describe('scene audio routing', () => {
  it('starts silent on the loading screen', () => {
    vi.stubGlobal('window', { location: { search: '' } });
    vi.stubGlobal('document', { documentElement: {}, addEventListener: vi.fn() });
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    const { game, audio, scenes } = shell();
    game.boot();
    expect(scenes.name).toBe('loading');
    expect(audio.ambient).toHaveBeenCalledExactlyOnceWith(null);
  });

  it.each([
    ['title', (game: Game) => game.toTitle()],
    ['workorders', (game: Game) => game.toWorkOrders()],
    ['upgrades', (game: Game) => game.toUpgrades()],
    ['trophies', (game: Game) => game.toTrophies()],
    ['memo', (game: Game) => game.toMemo(0)],
    ['abort', (game: Game) => game.toAbortChoice(0, flight.roomId, flight)],
    ['report', (game: Game) => game.toReport(0, fail, flight, false)],
    ['field-check', (game: Game) => game['toFieldCheck']()],
    ['dispatch-finale', (game: Game) => game['showDispatchFinale'](vi.fn())],
    ['choice', (game: Game) => {
      const run = new DeepRun(FIELD_CHECK, FIELD_CHECK_INDEX);
      run.startAbduct(0, 0);
      expect(run.finishAbduct(fail)).toBe('choice');
      game.toDeepChoice(run);
    }],
  ] as const)('runs the menu bed in %s', (name, open) => {
    const { game, audio, scenes } = shell();
    open(game);
    expect(scenes.name).toBe(name);
    expect(audio.ambient).toHaveBeenCalledExactlyOnceWith('menu');
  });

  const variants: Partial<Record<LevelId, AmbientBed>> = {
    level5: 'night-coast', level7: 'night-coast', level8: 'night-primate', level9: 'night-storm',
    level10: 'night-medieval', level11: 'night-1953', level12: 'night-2199',
  };
  it.each(LEVELS.map(({ id }, index) => [id, index] as const))('chooses the flight bed for %s', (id, index) => {
    const { game, audio, scenes } = shell();
    game.toFlight(index);
    expect(scenes.name).toBe('flight');
    expect(audio.ambient).toHaveBeenCalledExactlyOnceWith(variants[id] ?? 'night');
    expect(audio.speak).not.toHaveBeenCalled();
  });

  it('chooses the same flight bed in 2199 recital practice', () => {
    const { game, audio } = shell();
    game['practiceRecital'](LEVELS.findIndex(({ id }) => id === 'level12'));
    expect(audio.ambient).toHaveBeenCalledExactlyOnceWith('night-2199');
  });

  it('uses the Field Check flight and room beds at their scene swaps', () => {
    const { game, audio, scenes } = shell();
    game['startFieldCheck']();
    const run = new DeepRun(FIELD_CHECK, FIELD_CHECK_INDEX);
    run.startAbduct(0, 0);
    game['fieldCheckRoom'](run);
    expect(audio.ambient.mock.calls).toEqual([['night']]);
    scenes.update(1);
    expect(audio.ambient.mock.calls).toEqual([['night'], ['room']]);
  });

  it.each(['farm_window', 'forester_attic'] as const)('selects the room bed in %s', (room) => {
    const { game, audio, scenes } = shell();
    game.startRoom(room);
    expect(scenes.name).toBe('abduct');
    expect(audio.ambient).toHaveBeenCalledExactlyOnceWith('room');
  });
});
