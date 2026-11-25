// Each house's pop-culture prop sets off its matching sleep-talk line, once, as the specimen floats
// past it on a normal route (the autopilot's line through the room).
import { expect, it } from 'vitest';
import type { RoomId } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';

const CUES: [RoomId, string][] = [
  ['dave_patio', 'The mash needs more altitude.'],
  ['dave_roof', 'The mash needs more altitude.'],
  ['barb_backdoor', 'Go Saucers! Defence!'],
  ['barb_chimney', 'Go Saucers! Defence!'],
  ['gary_skylight', 'The truth is out there. Lock the back door.'],
  ['gary_garagedoor', 'The truth is out there. Lock the back door.'],
  ['nigel_skylight', "Lost property. One umbrella. Still wet."],
  ['nigel_loading', "Lost property. One umbrella. Still wet."],
  ['kev_vent', 'This one goes out to the Martians.'],
  ['kev_fireescape', 'This one goes out to the Martians.'],
  ['mayor_clocktower', 'July 4th speech first. Then upload the virus.'],
  ['mayor_elevator', 'July 4th speech first. Then upload the virus.'],
];

it.each(CUES)('%s: passing the prop says "%s", once', (id, line) => {
  const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx() {} }, () => 0, { wakeFails: true, hard: true });
  let said = 0;
  let last = '';
  while (sim.elapsed < 100 && !sim.complete) {
    const { dx, dy } = sim.autopilot();
    sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
    sim.update(1 / 60);
    if (sim.mumble !== last && sim.mumbleFx > 1.5) {
      last = sim.mumble;
      if (sim.mumble === line) said++;
    }
  }
  expect(said, `${id}: cue heard`).toBe(1);
});
