// L7 "A Whole Cruise Ship": the deck photographer, the stewards and the radar mast (src/flight/photographer.ts).
import { describe, expect, it } from 'vitest';
import { HazardField, type HazardDef } from '../src/flight/hazards';
import { DeepFlightSim, copyFlightState, newFlightState, stepFlight } from '../src/flight/deep-sim';
import { PHOTO, PhotoPhase, photoPhase } from '../src/flight/photographer';
import { LEVEL7 } from '../src/levels/deep-ship';
import type { DeepMap } from '../src/levels/types';

const PHOTOGRAPHER: HazardDef = { type: 'photographer', x: 500, y: 500, range: 300, halfW: 100, halfH: 80, facing: 0 };

function mapWith(hazards: HazardDef[]): DeepMap {
  const t = LEVEL7.map.targets;
  return { ...LEVEL7.map, hazards, start: { x: 500, y: 700 }, targets: t };
}

/** Hold the saucer still at (x, y) for `sec` seconds; returns the hazard index that saw it each step. */
function hover(sim: DeepFlightSim, x: number, y: number, sec: number): number[] {
  const seen: number[] = [];
  const s = sim.st.s;
  for (let k = 0; k < Math.round(sec * 60); k++) {
    s.x = x;
    s.y = y;
    s.vx = s.vy = 0;
    stepFlight(sim.field, sim.map, sim.st, false, 0, 0, 1 / 60, sim.mult);
    seen.push(sim.st.cause);
  }
  return seen;
}

describe('the deck photographer', () => {
  it('phases: iris, then exposure, then winding on, then idle', () => {
    expect(photoPhase(-Infinity)).toBe(PhotoPhase.Idle);
    expect(photoPhase(0)).toBe(PhotoPhase.Iris);
    expect(photoPhase(PHOTO.iris - 0.01)).toBe(PhotoPhase.Iris);
    expect(photoPhase(PHOTO.iris + 0.01)).toBe(PhotoPhase.Expose);
    expect(photoPhase(PHOTO.iris + PHOTO.expose + 0.01)).toBe(PhotoPhase.Rest);
    expect(photoPhase(PHOTO.iris + PHOTO.expose + PHOTO.rest + 0.01)).toBe(PhotoPhase.Idle);
  });

  it('frames a saucer that stops in range: the amber iris sees nothing, then the fixed frame exposes', () => {
    const sim = new DeepFlightSim(mapWith([PHOTOGRAPHER]), new Set(), 0);
    sim.st.safe = 0;
    // sitting still in range: half-press now, nothing sees you during the iris
    const iris = hover(sim, 560, 560, PHOTO.iris - 0.05);
    expect(iris.every((c) => c === -1)).toBe(true);
    const k = sim.field.photoSlot[0]! * PHOTO.stride;
    expect(sim.st.photo[k + 1]).toBe(560);
    expect(sim.st.photo[k + 2]).toBe(560);
    // staying put: the exposure sees you
    const expose = hover(sim, 560, 560, 0.2);
    expect(expose.slice(-3)).toEqual([0, 0, 0]);
    expect(sim.st.sus).toBeGreaterThan(0.1);
  });

  it('the frame stays where it locked: break sideways and the exposure misses you', () => {
    const sim = new DeepFlightSim(mapWith([PHOTOGRAPHER]), new Set(), 0);
    sim.st.safe = 0;
    hover(sim, 560, 560, 0.3);
    // move 110 px sideways (outside halfW 100) before the iris closes
    const seen = hover(sim, 670, 560, PHOTO.iris + PHOTO.expose);
    expect(seen.every((c) => c === -1)).toBe(true);
    // the frame never moved
    const k = sim.field.photoSlot[0]! * PHOTO.stride;
    expect(sim.st.photo[k + 1]).toBe(560);
  });

  it('does not frame a saucer flying past at speed, or one out of range', () => {
    const field = new HazardField([PHOTOGRAPHER]);
    const photo = field.photo;
    expect(field.stepPhotographers(550, 550, PHOTO.still + 50, 1)).toBe(-1);
    expect(field.stepPhotographers(900, 900, 0, 1)).toBe(-1);
    expect(photo[0]).toBe(-Infinity);
    expect(field.stepPhotographers(550, 550, 30, 1)).toBe(0);
    expect(photo[0]).toBe(1);
  });

  it('gives a full lock-on interval after a dodge: no second frame until it has wound on', () => {
    const sim = new DeepFlightSim(mapWith([PHOTOGRAPHER]), new Set(), 0);
    sim.st.safe = 0;
    hover(sim, 560, 560, 0.1);
    hover(sim, 700, 560, PHOTO.iris + PHOTO.expose); // dodge out of the frame until the exposure ends
    // come straight back and sit: nothing can see you for the rest of the wind-on plus a whole iris
    const back = hover(sim, 560, 560, PHOTO.rest + PHOTO.iris - 0.15);
    expect(back.every((c) => c === -1)).toBe(true);
    expect(PHOTO.rest + PHOTO.iris).toBeGreaterThan(1 + 0.5); // a 1 s lock-on plus a return trip
  });

  it('its state is copied for the autopilot look-ahead', () => {
    const sim = new DeepFlightSim(mapWith([PHOTOGRAPHER]), new Set(), 0);
    sim.st.safe = 0;
    hover(sim, 560, 560, 0.4);
    const copy = newFlightState(sim.field.porchCount, sim.field.ambCount, sim.field.photoCount);
    copyFlightState(copy, sim.st);
    expect([...copy.photo]).toEqual([...sim.st.photo]);
  });
});

describe('stewards and the radar mast', () => {
  it('a steward walks its path both ways and its torch is the detector', () => {
    const steward: HazardDef = {
      type: 'steward', path: [{ x: 100, y: 100 }, { x: 100, y: 500 }], speed: 100, dwell: 1, phase: 0,
      coneRange: 200, coneHalf: 0.4, sweepAmp: 0, sweepRate: 0,
    };
    const f = new HazardField([steward]);
    f.sample(2);
    expect(f.x[0]).toBeCloseTo(100);
    expect(f.y[0]).toBeCloseTo(300);
    expect(f.a[0]).toBeCloseTo(Math.PI / 2); // walking south, torch ahead
    expect(f.detect(100, 450, new Float64Array(0))).toBe(0);
    expect(f.detect(100, 200, new Float64Array(0))).toBe(-1);
    f.sample(4 + 1 + 1); // at the far end, turned round, walking back north
    expect(f.y[0]).toBeLessThan(500);
    expect(Math.cos(f.a[0]! + Math.PI / 2)).toBeCloseTo(1, 1);
  });

  it('the radar cones turn steadily and stay opposite', () => {
    const cams = LEVEL7.map.hazards.filter((h) => h.type === 'camera' && h.mount === 'radar');
    expect(cams.length).toBe(2);
    const f = new HazardField(cams);
    for (const t of [0, 1.3, 5, 11.7]) {
      f.sample(t);
      const d = Math.atan2(Math.sin(f.a[1]! - f.a[0]!), Math.cos(f.a[1]! - f.a[0]!));
      expect(Math.abs(d)).toBeCloseTo(Math.PI, 6);
    }
    f.sample(0);
    const a0 = f.a[0]!;
    f.sample(2);
    expect(f.a[0]! - a0).toBeCloseTo(1, 6);
  });

  it('the map has the GDD-3 numbers', () => {
    expect(LEVEL7.map.theme).toBe('ship');
    expect(LEVEL7.map.w).toBe(2160);
    expect(LEVEL7.map.h).toBe(3600);
    expect(LEVEL7.budgetSec).toBe(480);
    expect(LEVEL7.parMarginSec).toBe(134);
    expect(LEVEL7.map.hazards.filter((h) => h.type === 'photographer').length).toBe(3);
  });
});
