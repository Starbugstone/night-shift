import { expect, it } from 'vitest';
import { createAbductScene } from '../src/abduct';
import type { AbductResult, GameContext } from '../src/contracts';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { FIELD_CHECK, FIELD_CHECK_INDEX, FIELD_CHECK_ROOM, FIELD_CHECK_RULES } from '../src/levels/field-check';
import { DeepRun } from '../src/levels/run';
import { FieldCheckAbduction } from '../src/ui/field-check';
import { playAbduction, PROFILES } from './difficulty/human';
import { BEELINE_DELAYS } from './difficulty/beeline';
import { beelineController, runHeadless } from './flight-deep-harness';
import { humanFlightController } from './difficulty/human';

const DT = 1 / 60;

it('locks onto the single practice ring without starting a sunrise clock', () => {
  const ctx: GameContext = {
    pointer: { down: false, x: 270, y: 480, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), reducedMotion: true, time: 0, tutorial: false,
  };
  const run = new DeepRun(FIELD_CHECK, FIELD_CHECK_INDEX);
  const flight = new DeepFlightScene({
    level: FIELD_CHECK, run, ctx, practice: true,
    onLocked: (target, entry) => { run.startAbduct(target, entry); },
    onSunrise: () => { throw new Error('The practice shutter has no deadline'); },
    onQuit: () => { throw new Error('Practice pilot quit'); },
  });
  for (let i = 0; i < 60 * 45 && run.phase === 'flight'; i++) {
    Object.assign(ctx.pointer, flight.autopilotIntent());
    flight.update(DT);
  }
  expect(flight.sim.rings).toHaveLength(1);
  expect(run.phase).toBe('abduct');
  expect(run.spotted).toBe(0);
  expect(run.elapsed).toBe(0);
  const results: AbductResult[] = [];
  const inner = createAbductScene(ctx, { levelId: 'level3', roomId: 'dave_patio', rules: FIELD_CHECK_RULES }, (result) => results.push(result), FIELD_CHECK_ROOM);
  ctx.reducedMotion = false; // the clipboard falls, then clatters (reduced motion: below)
  const room = new FieldCheckAbduction(inner, ctx);
  Object.assign(ctx.pointer, { down: true, pressed: true, x: 270, y: 480 });
  room.update(DT);
  expect(room.debug.wake.value).toBe(0);
  Object.assign(ctx.pointer, { pressed: false, y: 466 });
  room.update(DT);
  ctx.pointer.down = false;
  // the clipboard is falling: the clatter (both meters) comes when it lands, 0.42 s later
  expect(room.clatterT).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < 20; i++) room.update(DT);
  expect(room.debug.wake.value).toBe(0);
  expect(room.debug.interior!.sleepers[0]!.wake).toBe(0);
  for (let i = 0; i < 10; i++) room.update(DT);
  expect(room.debug.wake.value).toBeGreaterThan(0);
  expect(room.debug.interior!.sleepers[0]!.wake).toBeGreaterThan(0);
  for (let i = 0; i < 60 * 60 && results.length === 0; i++) {
    const hand = room.debug.autopilot();
    room.debug.moveBeam(room.debug.body.beamX + hand.dx, room.debug.body.beamY + hand.dy);
    room.update(DT);
  }
  expect(results[0]).toMatchObject({ delivered: true, woke: false });
  expect(run.finishAbduct(results[0]!)).toBe('done');
  expect(run.checkpoint).toEqual({ x: 658, y: 499 });
  expect(run.delivered).toEqual([true]);
});

it.each([PROFILES.skilled, PROFILES.casual])('$name completes the practice approach and room', (profile) => {
  for (let seed = 1; seed <= 6; seed++) {
    const flight = runHeadless(FIELD_CHECK.map, [], humanFlightController(profile, seed), 60);
    expect(flight.done, `flight seed ${seed}`).toBe(true);
    const room = playAbduction(FIELD_CHECK_ROOM, profile, seed, FIELD_CHECK_RULES);
    expect(room.delivered, `room seed ${seed}`).toBe(true);
  }
});

it.each(BEELINE_DELAYS)('the porch catches the straight approach starting at %s s', delay => {
  const flight = runHeadless(FIELD_CHECK.map, [], beelineController, 60, true, delay);
  expect(flight.spots[0]?.cause).toBe('porch');
  expect(flight.done).toBe(false);
});

it('clatters as soon as the beam moves under reduced motion (the clipboard is drawn already down)', () => {
  const ctx: GameContext = {
    pointer: { down: false, pressed: false, released: false, x: 270, y: 480 },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), reducedMotion: true, time: 0, tutorial: false,
  };
  const inner = createAbductScene(ctx, { levelId: 'level3', roomId: 'dave_patio', rules: FIELD_CHECK_RULES }, () => {}, FIELD_CHECK_ROOM);
  const room = new FieldCheckAbduction(inner, ctx);
  Object.assign(ctx.pointer, { down: true, pressed: true });
  room.update(DT);
  Object.assign(ctx.pointer, { pressed: false, y: 466 });
  room.update(DT);
  expect(room.debug.wake.value).toBeGreaterThan(0);
  expect(room.debug.interior!.sleepers[0]!.wake).toBeGreaterThan(0);
});
