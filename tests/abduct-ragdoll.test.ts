import { describe, expect, it } from 'vitest';
import { Contact, Joint, Ragdoll, STEP, type Blade, type Circle, type Rect, type SwingingRect } from '../src/abduct/ragdoll';
import { CHAIR_POSE } from '../src/abduct/rooms/layout';

const floor: Rect = { kind: 'rect', x: -1000, y: 846, w: 2000, h: 150, vx: 0, vy: 0 };

describe('abduction ragdoll', () => {
  it.each([true, false])('holds together for ten seconds with beam active = %s', (active) => {
    const body = new Ragdoll(CHAIR_POSE, [floor]);
    body.beamActive = active;
    let maxError = 0;
    for (let i = 0; i < 10 / STEP; i++) {
      body.beamX = 270 + 120 * Math.cos(i * STEP * 2);
      body.beamY = 450 + 110 * Math.sin(i * STEP);
      body.step();
      maxError = Math.max(maxError, body.maxBoneError());
      expect(body.y[Joint.Head]).toBeLessThan(floor.y);
    }
    expect([...body.x, ...body.y].every(Number.isFinite)).toBe(true);
    expect(maxError).toBeLessThan(14);
  });

  it('keeps the head and feet outside a rectangular floor', () => {
    const body = new Ragdoll(CHAIR_POSE, [floor]);
    body.beamActive = false;
    let impact = 0;
    for (let i = 0; i < 3 / STEP; i++) {
      body.step();
      impact = Math.max(impact, body.impacts[0]!);
      expect(body.y[Joint.Head]!).toBeLessThanOrEqual(floor.y - 32 + 0.001);
      expect(body.y[Joint.NearFoot]!).toBeLessThanOrEqual(floor.y - 14 + 0.001);
    }
    expect(impact).toBeGreaterThan(105);
  });

  it('separates circular and blade contacts and uses the velocity of the contact surface', () => {
    const c = new Contact();
    const circle: Circle = { kind: 'circle', x: 100, y: 200, r: 30, vx: 0, vy: 0 };
    const blade: Blade = { kind: 'blade', x: 100, y: 200, angle: 0, from: 10, to: 120, r: 9, omega: 2 };
    expect(c.find(135, 200, 10, circle)).toBe(true);
    expect(c.nx).toBe(1);
    expect(c.depth).toBe(5);
    expect(c.find(170, 216, 10, blade)).toBe(true);
    expect(c.ny).toBe(1);
    expect(c.depth).toBe(3);
    expect(c.vy).toBe(140);

    const movingCart: Rect = { kind: 'rect', x: 91, y: 592, w: 107, h: 140, vx: 190, vy: 0 };
    const body = new Ragdoll({ ...CHAIR_POSE, neckX: 205 }, [movingCart]);
    body.beamActive = false;
    body.step();
    expect(body.impacts[0]).toBeGreaterThan(170);
  });

  it('rotates a hanging sign about the top centre, including its contact velocity', () => {
    const contact = new Contact();
    const sign: SwingingRect = {
      kind: 'swingingRect', x: 300, y: 200, w: 200, h: 70, angle: Math.PI / 2, omega: 2,
    };
    expect(contact.find(225, 245, 10, sign)).toBe(true);
    expect(contact.nx).toBeCloseTo(-1);
    expect(contact.ny).toBeCloseTo(0);
    expect(contact.depth).toBeCloseTo(5);
    expect(contact.vx).toBeCloseTo(-90);
    expect(contact.vy).toBeCloseTo(-140);
    expect(contact.find(375, 245, 10, sign)).toBe(false);
  });
});
