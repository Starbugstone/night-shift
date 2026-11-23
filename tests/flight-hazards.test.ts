// The deep-level hazard library: closed-form motion, honest shapes, porch-light timing, bumps.
import { describe, expect, it } from 'vitest';
import { HazardField, PORCH, Route, WATCHER_TELL, WINDOW_TELL, type HazardDef } from '../src/flight/hazards';
import { DeepFlightSim, copyFlightState, newFlightState, stepFlight } from '../src/flight/deep-sim';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';

const none = new Float64Array(0);

describe('routes', () => {
  it('loops wrap and blend headings at corners', () => {
    const r = new Route(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      true,
    );
    expect(r.total).toBeCloseTo(200 + Math.SQRT2 * 100);
    const p = { x: 0, y: 0 };
    expect(r.at(50, p)).toBeCloseTo(0);
    expect(p).toEqual({ x: 50, y: 0 });
    r.at(r.total + 50, p);
    expect(p.x).toBeCloseTo(50);
    // right at the corner the heading is half way between east and south
    expect(r.at(100, p, 40)).toBeCloseTo(Math.PI / 4, 1);
  });
});

describe('hazards', () => {
  it('police car loops at its speed and its light bar is a circle round it', () => {
    const d: HazardDef = {
      type: 'car', key: 'flight/police_top', role: 'police', path: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
      loop: true, speed: 400, dwell: 0, phase: 0, coneRange: 300, coneHalf: 0.3, sweepAmp: 0, sweepRate: 0, barR: 100,
    };
    const f = new HazardField([d]);
    f.sample(1);
    expect(f.cars[0]![0]!.x).toBeCloseTo(400);
    f.sample(10); // 4000 px = one full lap
    expect(f.cars[0]![0]!.x).toBeCloseTo(0);
    f.sample(1);
    expect(f.detect(400, 90, none)).toBe(0); // inside the bar radius
    expect(f.detect(400, 120, none)).toBe(-1);
    expect(f.detect(600, 0, none)).toBe(0); // in the headlights ahead
    expect(f.detect(200, 0, none)).toBe(-1); // behind the car, outside the bar
  });

  it('patrol cars go back and forth, turning round at the ends', () => {
    const d: HazardDef = {
      type: 'car', key: 'flight/police_top', role: 'patrol', path: [{ x: 0, y: 0 }, { x: 0, y: 1000 }],
      loop: false, speed: 500, dwell: 1, phase: 0, coneRange: 300, coneHalf: 0.3, sweepAmp: 0, sweepRate: 0, barR: 0,
    };
    const f = new HazardField([d]);
    f.sample(1);
    expect(f.cars[0]![0]!.y).toBeCloseTo(500);
    f.sample(2.5); // dwelling at the far end
    expect(f.cars[0]![0]!.y).toBeCloseTo(1000);
    f.sample(3.6);
    expect(f.cars[0]![0]!.y).toBeCloseTo(700);
    expect(Math.cos(f.cars[0]![0]!.heading - -Math.PI / 2)).toBeCloseTo(1); // heading back north
  });

  it('traffic keeps its spacing and only live cars see', () => {
    const d: HazardDef = { type: 'traffic', dir: 'h', at: 500, from: 0, to: 2000, sign: 1, speed: 400, gap: 500, offset: 0, coneRange: 200, coneHalf: 0.3, keys: ['flight/taxi_top'] };
    const f = new HazardField([d]);
    f.sample(0.7);
    const xs = f.cars[0]!.map((c) => c.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeCloseTo(500);
    const lead = f.cars[0]!.find((c) => c.live && c.x > 300 && c.x < 1700)!;
    expect(f.detect(lead.ox + 100, 500, none)).toBe(0);
    expect(f.detect(lead.ox + 100, 500 + 120, none)).toBe(-1);
  });

  it('porch lights arm after 0.4 s in range, then stay lit for 3 s', () => {
    const d: HazardDef = { type: 'porch', x: 0, y: 0, trigger: 100, r: 200 };
    const f = new HazardField([d]);
    const arm = new Float64Array(1);
    const lit = new Float64Array(1);
    let clicked = -1;
    for (let i = 0; i < 23; i++) clicked = Math.max(clicked, f.stepPorches(50, 0, 1 / 60, arm, lit));
    expect(lit[0]).toBe(0);
    for (let i = 0; i < 2; i++) clicked = Math.max(clicked, f.stepPorches(50, 0, 1 / 60, arm, lit));
    expect(clicked).toBe(0);
    expect(lit[0]).toBe(PORCH.lit);
    expect(f.detect(180, 0, lit)).toBe(0); // the lit circle reaches beyond the trigger
    for (let i = 0; i < 179; i++) f.stepPorches(500, 0, 1 / 60, arm, lit);
    expect(lit[0]).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) f.stepPorches(500, 0, 1 / 60, arm, lit);
    expect(lit[0]).toBe(0);
    expect(f.detect(180, 0, lit)).toBe(-1);
    // a fast pass through the edge never arms it
    arm[0] = 0;
    for (let i = 0; i < 20; i++) f.stepPorches(-100 + i * 10, 90, 1 / 60, arm, lit);
    expect(lit[0]).toBe(0);
  });

  it("Mrs. Pruitt snaps between angles and glints just before each snap", () => {
    const d: HazardDef = { type: 'watcher', name: 'Mrs. Pruitt', x: 0, y: 0, range: 500, half: 0.2, angles: [0, Math.PI / 2], hold: 2, sweepAmp: 0, sweepRate: 0 };
    const f = new HazardField([d]);
    f.sample(0.5);
    expect(f.detect(300, 0, none)).toBe(0);
    expect(f.detect(0, 300, none)).toBe(-1);
    expect(f.tell[0]).toBe(0);
    f.sample(2 - WATCHER_TELL / 2);
    expect(f.tell[0]).toBe(1);
    expect(f.b[0]).toBeCloseTo(Math.PI / 2);
    f.sample(2.1);
    expect(f.detect(0, 300, none)).toBe(0);
    expect(f.detect(300, 0, none)).toBe(-1);
  });

  it('office windows flicker as a tell before they light', () => {
    const d: HazardDef = { type: 'window', wx: 0, wy: 0, x: 0, y: 100, r: 100, period: 5, on: 2, phase: 0 };
    const f = new HazardField([d]);
    f.sample(1);
    expect(f.on[0]).toBe(0);
    expect(f.tell[0]).toBe(0);
    f.sample(3 - WINDOW_TELL / 2);
    expect(f.tell[0]).toBe(1);
    expect(f.detect(0, 100, none)).toBe(-1); // the tell is harmless
    f.sample(3.5);
    expect(f.detect(0, 100, none)).toBe(0);
  });

  it('the crane boom sweeps round and shoves the saucer', () => {
    const d: HazardDef = { type: 'crane', x: 0, y: 0, len: 400, rate: 1, a0: 0, width: 20 };
    const f = new HazardField([d]);
    f.sample(0);
    expect(f.x2[0]).toBeCloseTo(400);
    f.sample(Math.PI / 2);
    expect(f.y2[0]).toBeCloseTo(400);
    const s = { x: 10, y: 200, vx: 0, vy: 0, stun: 0 };
    const hit = { nx: 0, ny: 0, depth: 0 };
    expect(f.collide(s, hit)).toBe(0);
    expect(Math.abs(s.x)).toBeGreaterThan(40);
  });

  it('the helicopter searchlight circles the helicopter', () => {
    const d: HazardDef = { type: 'heli', cx: 1000, cy: 1000, rx: 500, ry: 500, period: 20, phase: 0, spotR: 100, spotDist: 200, spotRate: 1 };
    const f = new HazardField([d]);
    f.sample(0);
    expect(f.x[0]).toBeCloseTo(1500);
    expect(f.x2[0]).toBeCloseTo(1700);
    expect(f.detect(1700, 1000, none)).toBe(0);
    expect(f.detect(1500, 1000, none)).toBe(-1); // under the heli but outside the light
  });

  it('flocks bump the saucer away and stun it briefly', () => {
    const map = { ...LEVEL3.map, hazards: [{ type: 'flock', kind: 'bat', path: [{ x: 500, y: 500 }, { x: 501, y: 500 }], speed: 0.0001, r: 50, phase: 0 } as HazardDef] };
    const field = new HazardField(map.hazards);
    const st = newFlightState(0);
    st.s.x = 520;
    st.s.y = 500;
    stepFlight(field, map, st, false, 0, 0, false, 0, 0, 1 / 60, 1, false);
    expect(st.bump).toBe(0);
    expect(st.s.stun).toBeGreaterThan(0);
    expect(st.s.x).toBeGreaterThan(540);
  });
});

describe('deep flight sim', () => {
  it('rollouts on a copied state predict the live sim exactly', () => {
    const sim = new DeepFlightSim(LEVEL4.map, new Set());
    const copy = newFlightState(sim.field.porchCount);
    copyFlightState(copy, sim.st);
    const field2 = new HazardField(LEVEL4.map.hazards);
    const p = { down: true, x: 270, y: 200, pressed: true, released: false };
    for (let i = 0; i < 120; i++) {
      const fdx = p.x - (sim.saucer.x - sim.camX);
      const fdy = p.y - (sim.saucer.y - sim.camY);
      stepFlight(field2, LEVEL4.map, copy, true, fdx, fdy, false, 0, 0, 1 / 60, 1, false);
      sim.update(1 / 60, p);
      p.pressed = false;
    }
    expect(copy.s.x).toBeCloseTo(sim.saucer.x, 6);
    expect(copy.s.y).toBeCloseTo(sim.saucer.y, 6);
    expect(copy.sus).toBeCloseTo(sim.st.sus, 6);
  });

  it('delivered targets lose their rings; the safe window hides you', () => {
    const sim = new DeepFlightSim(LEVEL3.map, new Set());
    sim.markDelivered(1);
    expect(sim.rings[2]!.x).toBeLessThan(-1e5);
    expect(sim.rings[3]!.x).toBeLessThan(-1e5);
    expect(sim.ringPos(1, 0).x).toBe(LEVEL3.map.targets[1].entries[0].x);
    const ring = sim.ringPos(1, 0);
    sim.place(ring.x, ring.y);
    expect(sim.st.safe).toBeGreaterThan(1);
  });
});
