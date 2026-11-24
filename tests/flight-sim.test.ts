import { describe, expect, it } from 'vitest';
import { circleSegment, pointInCircle, pointInCone, wrapAngle } from '../src/flight/geometry';
import { LOCK, LockOn, PathFollower, SAUCER, SUSPICION, SuspicionMeter, barkRadius,  ringUnder, steerSaucer, suspicionMultiplier } from '../src/flight/sim';
import { LEVELS, isTutorial } from '../src/levels/levels';

const TUTORIALS = LEVELS.filter(isTutorial);

const step = (n: number, fn: (dt: number) => void, dt = 1 / 60): void => {
  for (let i = 0; i < n; i++) fn(dt);
};

describe('geometry', () => {
  it('point in cone respects range and half-angle', () => {
    // cone at origin facing east, 30° half-angle, 100 long
    const h = Math.PI / 6;
    expect(pointInCone(50, 0, 0, 0, 0, h, 100)).toBe(true);
    expect(pointInCone(50, 20, 0, 0, 0, h, 100)).toBe(true);
    expect(pointInCone(50, 40, 0, 0, 0, h, 100)).toBe(false);
    expect(pointInCone(120, 0, 0, 0, 0, h, 100)).toBe(false);
    expect(pointInCone(-50, 0, 0, 0, 0, h, 100)).toBe(false);
    // facing west across the ±PI seam
    expect(pointInCone(-50, 5, 0, 0, Math.PI, h, 100)).toBe(true);
    expect(pointInCone(-50, -5, 0, 0, -Math.PI, h, 100)).toBe(true);
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it('circle vs segment gives a push-out normal', () => {
    const hit = { nx: 0, ny: 0, depth: 0 };
    expect(circleSegment(50, 10, 20, 0, 0, 100, 0, hit)).toBe(true);
    expect(hit.ny).toBeCloseTo(1);
    expect(hit.depth).toBeCloseTo(10);
    expect(circleSegment(50, 30, 20, 0, 0, 100, 0, hit)).toBe(false);
    expect(circleSegment(-15, 0, 20, 0, 0, 100, 0, hit)).toBe(true); // past the end cap
    expect(hit.nx).toBeCloseTo(-1);
    expect(pointInCircle(3, 4, 0, 0, 5)).toBe(true);
    expect(pointInCircle(3, 4.1, 0, 0, 5)).toBe(false);
  });
});

describe('suspicion', () => {
  it('is a 1-second fuse: full after exactly 1 s of exposure, never sooner', () => {
    const m = new SuspicionMeter();
    step(59, (dt) => m.update(dt, SUSPICION.rate));
    expect(m.full).toBe(false);
    step(1, (dt) => m.update(dt, SUSPICION.rate));
    expect(m.value).toBeCloseTo(1, 5);
    expect(m.full).toBe(true);
  });

  it('Hush Drive stretches the fuse to 1.25 s', () => {
    const mult = suspicionMultiplier(new Set(['hush_drive']));
    const m = new SuspicionMeter();
    step(74, (dt) => m.update(dt, SUSPICION.rate, mult));
    expect(m.full).toBe(false);
    step(2, (dt) => m.update(dt, SUSPICION.rate, mult));
    expect(m.full).toBe(true);
    expect(suspicionMultiplier(new Set())).toBe(1);
  });

  it('after a 0.25 s grace it empties at 1.5 per second', () => {
    const m = new SuspicionMeter();
    step(30, (dt) => m.update(dt, SUSPICION.rate));
    expect(m.value).toBeCloseTo(0.5, 5);
    step(14, (dt) => m.update(dt, 0));
    expect(m.value).toBeCloseTo(0.5, 5); // still inside the 0.25 s grace
    step(1, (dt) => m.update(dt, 0));
    const start = m.value;
    step(10, (dt) => m.update(dt, 0));
    expect(start - m.value).toBeCloseTo(1.5 * (10 / 60), 1);
    step(30, (dt) => m.update(dt, 0));
    expect(m.value).toBe(0);
  });

  it('rises while exposed, waits out the grace period, then decays', () => {
    const m = new SuspicionMeter();
    step(30, (dt) => m.update(dt, SUSPICION.rate));
    expect(m.value).toBeCloseTo(0.5, 2);
    const peak = m.value;
    step(Math.floor(SUSPICION.grace * 60) - 2, (dt) => m.update(dt, 0));
    expect(m.value).toBe(peak);
    step(60, (dt) => m.update(dt, 0));
    expect(m.value).toBeLessThan(peak);
    step(600, (dt) => m.update(dt, 0));
    expect(m.value).toBe(0);
  });

  it('fills up and clamps; hush drive slows it', () => {
    const a = new SuspicionMeter();
    const b = new SuspicionMeter();
    step(60, (dt) => {
      a.update(dt, 1);
      b.update(dt, 1, 0.75);
    });
    expect(b.value).toBeCloseTo(a.value * 0.75, 2);
    step(120, (dt) => a.update(dt, 1));
    expect(a.value).toBe(1);
    expect(a.full).toBe(true);
  });

  it('bark radius pulses between min and max', () => {
    expect(barkRadius(0, 70, 160, 3)).toBeCloseTo(70);
    expect(barkRadius(1.5, 70, 160, 3)).toBeCloseTo(160);
  });
});

describe('lock-on', () => {
  const rings = [
    { x: 0, y: 0 },
    { x: 500, y: 0 },
  ];
  it('requires being inside a ring and slow', () => {
    expect(ringUnder(10, 10, 20, rings, 60)).toBe(0);
    expect(ringUnder(510, 0, 20, rings, 60)).toBe(1);
    expect(ringUnder(10, 10, LOCK.maxSpeed + 1, rings, 60)).toBe(-1);
    expect(ringUnder(59, 0, 0, rings, 60)).toBe(-1); // outside the inner 80%
  });

  it('locks after hovering one second, resets when switching rings', () => {
    const l = new LockOn();
    let locked = false;
    step(30, (dt) => (locked = l.update(dt, 0) || locked));
    expect(locked).toBe(false);
    expect(l.fraction).toBeCloseTo(0.5, 1);
    l.update(1 / 60, 1);
    expect(l.ring).toBe(1);
    expect(l.fraction).toBeLessThan(0.05);
    step(62, (dt) => (locked = l.update(dt, 1) || locked));
    expect(locked).toBe(true);
  });

  it('drains when leaving the ring', () => {
    const l = new LockOn();
    step(30, (dt) => l.update(dt, 0));
    step(60, (dt) => l.update(dt, -1));
    expect(l.fraction).toBe(0);
    expect(l.ring).toBe(-1);
  });
});

describe('saucer', () => {
  it('accelerates toward the finger, caps speed, and brakes to a hover', () => {
    const s = { x: 0, y: 0, vx: 0, vy: 0, stun: 0 };
    step(120, (dt) => steerSaucer(s, true, 0, -300, dt));
    expect(s.vy).toBeLessThan(0);
    expect(Math.abs(s.vx)).toBeLessThan(1e-6);
    expect(Math.hypot(s.vx, s.vy)).toBeLessThanOrEqual(SAUCER.maxSpeed + 1e-6);
    step(120, (dt) => steerSaucer(s, false, 0, 0, dt));
    expect(Math.hypot(s.vx, s.vy)).toBeLessThan(5);
  });

  it('ignores the finger while stunned', () => {
    const s = { x: 0, y: 0, vx: 0, vy: 0, stun: 0.5 };
    steerSaucer(s, true, 300, 0, 1 / 60);
    expect(s.vx).toBe(0);
  });
});

describe('vehicle paths', () => {
  it('drives to the end, dwells, turns round and comes back', () => {
    const f = new PathFollower(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: -100 },
      ],
      100,
      0.5,
    );
    expect(f.total).toBeCloseTo(200);
    step(60, (dt) => f.update(dt));
    expect(f.x).toBeCloseTo(100, 0);
    step(40, (dt) => f.update(dt));
    expect(f.heading).toBeCloseTo(-Math.PI / 2, 1); // turned the corner, heading north
    step(20, (dt) => f.update(dt));
    expect(f.y).toBeCloseTo(-100, 0);
    step(30, (dt) => f.update(dt)); // dwell: turning round in place
    expect(f.y).toBeCloseTo(-100, 0);
    step(60, (dt) => f.update(dt));
    expect(f.y).toBeGreaterThan(-60);
  });
});

describe('level layouts', () => {
  it('each level has two rings on its target building and sensible hazards', () => {
    for (const lv of TUTORIALS) {
      const m = lv.map;
      expect(m.entries).toHaveLength(2);
      const t = m.target;
      for (const e of m.entries) {
        // ring centre within ~70px of the building box
        const dx = Math.max(Math.abs(e.x - t.x) - 150, 0);
        const dy = Math.max(Math.abs(e.y - t.y) - 130, 0);
        expect(Math.hypot(dx, dy)).toBeLessThan(70);
      }
      const [a, b] = m.entries;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(150);
      expect(m.start.y).toBeGreaterThan(m.h * 0.75);
      expect(m.vehicles.length).toBeGreaterThan(0);
    }
    expect(TUTORIALS[0]!.map.entries.map((e) => e.roomId)).toEqual(['farm_window', 'farm_chimney']);
    expect(TUTORIALS[1]!.map.entries.map((e) => e.roomId)).toEqual(['laundry_skylight', 'laundry_loading']);
  });
});

