import { expect, it } from 'vitest';
import { FlightAutopilot } from '../src/flight/autopilot';
import { DeepFlightSim } from '../src/flight/deep-sim';
import { LEVEL7 } from '../src/levels/deep-ship';

it('locks onto the captain after returning through Marco’s skylight with delayed pointer input', () => {
  const sim = new DeepFlightSim(LEVEL7.map, new Set(), 111.54);
  sim.markDelivered(1);
  sim.markDelivered(2);
  const checkpoint = sim.ringPos(1, 0);
  sim.place(checkpoint.x, checkpoint.y);
  const pilot = new FlightAutopilot(sim);
  const pointer = { down: false, x: 0, y: 0, pressed: false, released: false };

  for (let frame = 0; frame < 60 * 40 && sim.phase === 'fly'; frame++) {
    const intent = pilot.intent();
    // Scene-entry capture delays the first gesture, then the mouse samples the latest intent.
    if (frame > 60 && frame % 3 === 0) Object.assign(pointer, intent);
    sim.update(1 / 60, pointer);
  }

  expect(sim.phase).toBe('locking');
  expect(sim.ringRef[sim.lockedRing]?.target).toBe(0);
});
