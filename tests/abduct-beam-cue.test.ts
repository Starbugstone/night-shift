// "The repeated beam noise is horrible" (2026-11-26): every press played beam_on and every release
// beam_off, so steering with short drags droned. See docs/REGRESSIONS.md (E8).
import { describe, expect, it } from 'vitest';
import type { AbductResult, GameContext, PointerState, RoomId, SfxName } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { BEAM_CUE, BeamCue } from '../src/abduct/beam-cue';
import { ROOMS } from '../src/abduct/rooms';
import { SNORE_AUDIO_EVERY } from '../src/abduct/snore-cue';
import type { AbductSimulation } from '../src/abduct/simulation';

describe('BeamCue', () => {
  it('sounds a grab after a rest and stays quiet on quick re-grabs', () => {
    const cue = new BeamCue();
    expect(cue.grab(0)).toBe(true);
    expect(cue.release(0.2)).toBe(false); // too short for the fade-out
    expect(cue.grab(0.5)).toBe(false);
    expect(cue.release(2)).toBe(false); // that grab never sounded
    expect(cue.grab(2 + BEAM_CUE.rest)).toBe(true);
    expect(cue.release(2 + BEAM_CUE.rest + BEAM_CUE.hold)).toBe(true);
  });
});

const CLOSED: PointerState = { x: 270, y: 480, down: false, pressed: false, released: false };

describe.each(Object.keys(ROOMS) as RoomId[])('beam cue in %s', roomId => {
  it('plays the beam at most once per rest during rapid drags', () => {
    const played: SfxName[] = [];
    const ctx: GameContext = {
      pointer: { ...CLOSED }, assets: { get: () => undefined }, audio: { sfx: n => { played.push(n); }, speak() {}, hush() {} },
      upgrades: new Set(), reducedMotion: true, tutorial: false, time: 0,
    };
    const scene = createAbductScene(ctx, { roomId, levelId: 'headless', rules: { wakeFails: false, hard: false } }, (_r: AbductResult) => {});
    const sim = (scene as unknown as { debug: AbductSimulation }).debug;
    const p = ctx.pointer;
    const frame = (): void => { ctx.time += 1 / 60; scene.update(1 / 60); p.pressed = p.released = false; };
    frame();
    // 20 drags of 0.25 s with 0.15 s gaps: 8 seconds of frantic steering
    let drags = 0;
    for (let i = 0; i < 20 && !sim.delivered && !sim.failure; i++) {
      Object.assign(p, { x: sim.body.chestX, y: sim.body.chestY, down: true, pressed: true });
      for (let f = 0; f < 15; f++) { p.x += 2; frame(); }
      Object.assign(p, { down: false, released: true });
      frame();
      for (let f = 0; f < 9; f++) frame();
      drags++;
    }
    expect(drags).toBeGreaterThan(3);
    const beams = played.filter(n => n === 'beam_on' || n === 'beam_off');
    expect(beams, `${drags} drags`).toEqual(['beam_on']);
  });
});

// "The snoring is even worse" (2026-11-26): every on-screen snore (~2 s) was voiced. See E8.
describe.each(Object.keys(ROOMS) as RoomId[])('snore audio in %s', roomId => {
  it('voices at most one snore in five while the sleeper lies still', () => {
    let heard = 0;
    const ctx: GameContext = {
      pointer: { ...CLOSED }, assets: { get: () => undefined }, audio: { sfx: n => { if (n === 'snore') heard++; }, speak() {}, hush() {} },
      upgrades: new Set(), reducedMotion: true, tutorial: false, time: 0,
    };
    const scene = createAbductScene(ctx, { roomId, levelId: 'headless', rules: { wakeFails: false, hard: false } }, (_r: AbductResult) => {});
    const sim = (scene as unknown as { debug: AbductSimulation }).debug;
    for (let f = 0; f < 20 * 60; f++) { ctx.time += 1 / 60; scene.update(1 / 60); }
    if (ROOMS[roomId].human === 'tom_enchanter') return; // its snore marks the spark charge: always heard
    expect(sim.snores).toBeGreaterThan(3);
    expect(heard, `${sim.snores} snores`).toBeLessThanOrEqual(Math.ceil(sim.snores / SNORE_AUDIO_EVERY));
  });
});
