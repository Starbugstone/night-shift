import { expect, it } from 'vitest';
import { GrailExit, GrailReaction } from '../src/abduct/grail';
import { Ragdoll, STEP } from '../src/abduct/ragdoll';
import { GRAIL_ROOMS } from '../src/abduct/rooms/deep-grail';
import { en } from '../src/i18n/en';

it('sheds one plate per registered bonk and keeps the latest unheard Knight line', () => {
  const knight = new GrailReaction(true);
  const body = new Ragdoll(GRAIL_ROOMS.black_knight_arch.pose, []);
  for (let i = 0; i < 3; i++) {
    knight.impact(body, knight.position(body.x, i), i);
    expect(knight.dropped[i]).toBe(i);
    expect(knight.step(body, true, 25, false)).toBe(en.grail.knight[i]);
  }
  knight.impact(body, body.chestX, 4);
  expect(knight.step(body, true, 25, true)).toBe('');
  knight.impact(body, body.chestX, 5);
  expect(knight.step(body, true, 25, false)).toBe(en.grail.knight[2]);
});

it('warns in silence, steps about 55 px with the beam attached, then needs a cooler wake meter to rearm', () => {
  const r = new GrailReaction(false);
  const body = new Ragdoll(GRAIL_ROOMS.rodney_flap.pose, [{ kind: 'rect', x: 0, y: 588, w: 1400, h: 180, vx: 0, vy: 0 }]);
  for (let frame = 0; frame < 240; frame++) body.step();
  const before = body.chestX;
  for (let frame = 0; frame < 59; frame++) {
    body.step();
    expect(r.step(body, true, 55, false)).toBe('');
  }
  expect(body.chestX).toBeCloseTo(before, 0);
  const lines = [];
  for (let frame = 0; frame < 50; frame++) {
    body.step();
    const line = r.step(body, true, 55, false);
    if (line) lines.push(line);
  }
  expect(lines).toEqual([en.grail.retreat]);
  expect(before - body.chestX).toBeGreaterThan(48);
  expect(before - body.chestX).toBeLessThan(62);
  expect(r.retreat).toBe(0);
  r.step(body, true, 34, false);
  r.step(body, true, 55, false);
  expect(r.retreat).toBeGreaterThan(0.8);
  r.cancel();
  expect(r.retreat).toBe(0);
});

it('lets the torso settle inside the exit and clears partial progress when it leaves', () => {
  const exit = new GrailExit(0, 0, 1);
  for (let frame = 1; frame <= 240; frame++)
    expect(exit.step(frame, 0, true)).toBe(false);
  for (let frame = 0; frame < 1 / STEP; frame++) exit.step(240, 0, true);
  expect(exit.progress).toBeGreaterThan(0);
  expect(exit.progress).toBeLessThan(1);
  expect(exit.step(240, 0, false)).toBe(false);
  expect(exit.progress).toBe(0);
  for (let frame = 0; frame <= 1 / STEP; frame++) exit.step(240, 0, true);
  expect(exit.progress).toBe(1);
});
