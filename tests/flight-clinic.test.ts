// L6 flight: the ambulance scramble (src/flight/ambulance.ts) and the St. Mildred's map rules.
import { describe, expect, it } from 'vitest';
import { AMBULANCE, AmbPhase, ambulancePose, ambulanceTrip, type AmbulanceHazard, type AmbulancePose } from '../src/flight/ambulance';
import { copyFlightState, DeepFlightSim, newFlightState, stepFlight } from '../src/flight/deep-sim';
import { HazardField, Route } from '../src/flight/hazards';
import { LOCK, RING_R } from '../src/flight/sim';
import { LEVEL6 } from '../src/levels/deep-clinic';

const DT = 1 / 60;
const AMB: AmbulanceHazard = {
  type: 'ambulance',
  bayX: 0,
  bayY: 0,
  path: [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
    { x: 600, y: 100 },
  ],
  trigger: 200,
  speed: 400,
  dwell: 1,
  rest: 3,
  coneRange: 300,
  coneHalf: 0.36,
  beaconR: 100,
};

describe('ambulance scramble', () => {
  it('waits dark in its bay until something comes near, whatever the time', () => {
    const f = new HazardField([AMB]);
    for (const t of [0, 3, 17, 60]) {
      f.sample(t);
      expect(f.on[0]).toBe(0);
      expect(f.tell[0]).toBe(0);
      expect(f.detect(0, 100, new Float64Array(0))).toBe(-1);
    }
  });

  it('a saucer within the trigger scrambles it: 1.2 s amber tell that sees nothing, then it drives out lit', () => {
    const f = new HazardField([AMB]);
    expect(f.stepAmbulances(500, 500, 2)).toBe(-1); // too far
    expect(f.stepAmbulances(150, 50, 2)).toBe(0);
    expect(f.ambT[0]).toBe(2);
    f.sample(2 + AMBULANCE.tell - 0.01);
    expect(f.tell[0]).toBe(1);
    expect(f.on[0]).toBe(0);
    // even right in front of the door, the tell is not a detector
    expect(f.detect(0, 120, new Float64Array(0))).toBe(-1);
    f.sample(2 + AMBULANCE.tell + 0.01);
    expect(f.tell[0]).toBe(0);
    expect(f.on[0]).toBe(1);
    // the beacon is a hard-edged circle round the ambulance
    expect(f.detect(f.x[0]! + 99, f.y[0]!, new Float64Array(0))).toBe(0);
    expect(f.detect(f.x[0]! - 101, f.y[0]! - 50, new Float64Array(0))).toBe(-1);
  });

  it('runs the access road, turns, comes back and parks; re-arms only after its rest', () => {
    const route = new Route(AMB.path, false);
    const pose: AmbulancePose = { x: 0, y: 0, heading: 0, ox: 0, oy: 0, phase: AmbPhase.Parked };
    const trip = ambulanceTrip(AMB, route);
    expect(trip).toBeCloseTo(AMBULANCE.tell + (2 * 700) / 400 + 1);
    expect(ambulancePose(AMB, route, AMBULANCE.tell + 700 / 400 + 0.5, pose)).toBe(AmbPhase.Driving);
    expect(pose.x).toBeCloseTo(600);
    expect(ambulancePose(AMB, route, trip + 0.01, pose)).toBe(AmbPhase.Parked);
    expect(pose.x).toBeCloseTo(0);
    expect(pose.y).toBeCloseTo(0);
    const f = new HazardField([AMB]);
    f.stepAmbulances(0, 50, 10);
    expect(f.stepAmbulances(0, 50, 10 + trip + 1)).toBe(-1);
    expect(f.ambT[0]).toBe(10);
    expect(f.stepAmbulances(0, 50, 10 + trip + AMB.rest + 0.01)).toBe(0);
  });

  it('the headlight cone points where it drives', () => {
    const f = new HazardField([AMB]);
    f.stepAmbulances(0, 50, 0);
    f.sample(AMBULANCE.tell + 0.5 + 100 / 400);
    // on the road heading east (+x): ahead is seen, behind is not
    expect(f.a[0]).toBeCloseTo(0, 1);
    const ahead = f.detect(f.x2[0]! + 250, f.y2[0]!, new Float64Array(0));
    const behind = f.detect(f.x[0]! - 250, f.y[0]!, new Float64Array(0));
    expect(ahead).toBe(0);
    expect(behind).toBe(-1);
  });

  it('the flight state carries the scramble, so look-ahead rollouts match the live sim', () => {
    const sim = new DeepFlightSim({ ...LEVEL6.map, start: { x: 950, y: 2850 } }, new Set());
    for (let i = 0; i < 40; i++) sim.update(DT, { down: true, x: 270, y: 200, pressed: i === 0, released: false });
    const live = sim.st.ambT.slice();
    const copy = newFlightState(sim.field.porchCount, sim.field.ambCount);
    copyFlightState(copy, sim.st);
    expect(Array.from(copy.ambT)).toEqual(Array.from(live));
    // two fields stepped from the same state agree exactly
    const a = new HazardField(LEVEL6.map.hazards);
    const b = new HazardField(LEVEL6.map.hazards);
    const sa = newFlightState(a.porchCount, a.ambCount);
    const sb = newFlightState(b.porchCount, b.ambCount);
    copyFlightState(sa, sim.st);
    copyFlightState(sb, sim.st);
    for (let k = 0; k < 180; k++) {
      stepFlight(a, LEVEL6.map, sa, true, 0, -120, DT, 1);
      stepFlight(b, LEVEL6.map, sb, true, 0, -120, DT, 1);
    }
    expect(Array.from(sa.ambT)).toEqual(Array.from(sb.ambT));
    expect(sa.sus).toBe(sb.sus);
    expect(Array.from(a.x)).toEqual(Array.from(b.x));
  });
});

describe('L6 St. Mildred’s map', () => {
  const m = LEVEL6.map;
  const ambulances = m.hazards.filter((h): h is AmbulanceHazard => h.type === 'ambulance');

  it('has the GDD-3 frame: clinic theme, 2160x3120, 450 s to sunrise, Night owl margin 140 s', () => {
    expect(m.theme).toBe('clinic');
    expect([m.w, m.h]).toEqual([2160, 3120]);
    expect(LEVEL6.budgetSec).toBe(450);
    expect(LEVEL6.parMarginSec).toBe(140);
    expect(ambulances.length).toBeGreaterThanOrEqual(3);
    expect(m.hazards.some((h) => h.type === 'heli')).toBe(true);
    expect(m.hazards.some((h) => h.type === 'neon' && h.text === 'NOW SERVING 12')).toBe(true);
  });

  it('every ring can be reached and locked without scrambling an ambulance', () => {
    for (const t of m.targets)
      for (const e of t.entries)
        for (const a of ambulances) expect(Math.hypot(e.x - a.bayX, e.y - a.bayY), `${e.roomId} vs bay ${a.bayX},${a.bayY}`).toBeGreaterThan(a.trigger + RING_R * LOCK.insideFrac);
  });

  it('every ambulance starts in its bay and leaves through the door it faces', () => {
    for (const a of ambulances) {
      expect(Math.hypot(a.path[0]!.x - a.bayX, a.path[0]!.y - a.bayY)).toBeLessThan(80);
      expect(a.path.length).toBeGreaterThanOrEqual(3);
      expect(a.speed).toBeGreaterThan(0);
      for (const p of a.path) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(m.w);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(m.h);
      }
    }
  });

  it('the start is clear of every bay sensor', () => {
    for (const a of ambulances) expect(Math.hypot(m.start.x - a.bayX, m.start.y - a.bayY)).toBeGreaterThan(a.trigger + 60);
  });
});
