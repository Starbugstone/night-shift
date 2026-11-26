import { describe, expect, it } from 'vitest';
import { DeepFlightSim, stepFlight } from '../src/flight/deep-sim';
import { COW, GrailSpeech, RABBIT } from '../src/flight/grail';
import { en } from '../src/i18n/en';
import { LEVEL10 } from '../src/levels/deep-grail';
import { BEELINE_DELAYS } from './difficulty/beeline';
import { evaluateShrubbery } from './difficulty/stars';
import { playAbduction, PROFILES } from './difficulty/human';
import { autopilotController, runHeadless } from './flight-deep-harness';

const map = LEVEL10.map;
const dt = 1 / 60;
function drive(sim: DeepFlightSim, dx: number, dy: number) {
  stepFlight(sim.field, map, sim.st, !!(dx || dy), dx, dy, dt, sim.mult);
}

describe('Grimsby Keep', () => {
  it.each(BEELINE_DELAYS)('at %s seconds the fixed lookout catches every direct first approach', delay => {
    for (const { entries } of map.targets) for (const ring of entries) {
      const sim = new DeepFlightSim(map, new Set(), delay);
      for (let frame = 0; frame < 360 && sim.st.sus < 1; frame++) {
        const { x, y } = sim.saucer, dx = ring.x - x, dy = ring.y - y;
        const d = Math.hypot(dx, dy);
        drive(sim, dx / d * 180, dy / d * 180);
      }
      expect(sim.st.sus, ring.roomId).toBe(1);
      expect(sim.field.spotCause(sim.st.cause)).toBe('grailSentry');
    }
    const planned = runHeadless(map, [], autopilotController(), 150, true, delay);
    expect(planned.spots).toEqual([]);
    expect(planned.done).toBe(true);
  });

  it('warns before either cow lands and removes its bump with its impact patch', () => {
    for (const [x, y, offset] of [[460,1125,0],[1010,1090,3.8]] as const) {
      const sim = new DeepFlightSim(map, new Set());
      const i = offset ? 2 : 1;
      for (const [age, warning, active] of [[0.3,1,0],[COW.warning + 0.01,0,1],[2.42,0,0]]) {
        sim.place(x + 12, y, 0);
        sim.st.t = offset + age!;
        drive(sim, 0, 0);
        expect(sim.field.tell[i]).toBe(warning);
        expect(sim.field.on[i]).toBe(active);
        expect(sim.st.bump === i).toBe(!!active);
        expect(sim.st.cause === i).toBe(!!active);
      }
    }
  });

  it('cruises through the cave cut and can steer away after a committed lunge', () => {
    const sim = new DeepFlightSim(map, new Set());
    sim.place(1020, 1010, 0);
    sim.st.t = 2.45;
    sim.saucer.vx = 430;
    while (sim.saucer.x < 1370) {
      drive(sim, 180, 0);
      expect(sim.st.rabbitStart).toBe(-Infinity);
    }
    sim.place(1190, 1010, 0);
    for (let frame = 0; frame < 18; frame++) drive(sim, 0, 0);
    expect(sim.field.tell[sim.field.rabbitIndex]).toBe(1);
    for (let frame = 0; frame < 10; frame++) drive(sim, 180, 0);
    expect(sim.st.rabbitStart).toBe(-Infinity);
    sim.place(1190, 1010, 0);
    for (let frame = 0; frame < 47; frame++) drive(sim, 0, 0);
    expect(sim.field.on[sim.field.rabbitIndex]).toBe(1);
    for (let frame = 0; frame < 28; frame++) drive(sim, 0, 180);
    expect(sim.saucer.y).toBeGreaterThan(970 + RABBIT.radius);
    expect(sim.st.cause).toBe(-1);
    expect(sim.st.sus).toBeLessThan(1);
    expect(sim.field.on[sim.field.rabbitIndex]).toBe(1);
  });

  it('takes the west-bank shrubbery and files three witnesses without upgrades', () => {
    expect(evaluateShrubbery(LEVEL10, PROFILES.bot, 1, playAbduction).fourthStars).toBe(1);
  });
});

it('plays the lookout’s taunts in order across approaches and gives Zib a separate reply', () => {
  const cue = new GrailSpeech();
  cue.update(1, 900, 1630, false, false, false);
  expect(cue.text).toBe('');
  cue.update(2, 900, 1630, true, false, false);
  expect(cue.text).toBe(en.grail.taunts[0]);
  for (const [beat, t] of [[1, 12], [2, 22]] as const) {
    cue.update(t - 1, 200, 2100, false, false, false);
    cue.update(t, 900, 1800, false, false, false);
    expect(cue.text).toBe(en.grail.taunts[beat]);
  }
  cue.update(cue.until + 0.1, 900, 1800, false, false, false);
  expect(cue.text).toBe(en.grail.taunts[3]);
});
