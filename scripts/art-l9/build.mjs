// Rebuilds every L9 1955 SVG under public/art/. Run: node scripts/art-l9/build.mjs
import { written } from './lib.mjs';
import { timeCarDisplay } from './time-car-display.mjs';
import { timeCarTop } from './time-car-top.mjs';
import { flightBuildings } from './flight-buildings.mjs';
import { flightProps } from './flight-props.mjs';
import { flightPeople } from './flight-people.mjs';
import { rooms } from './rooms.mjs';
import { humans } from './humans.mjs';
import { souvenirs } from './souvenirs.mjs';

timeCarDisplay();
timeCarTop();
flightBuildings();
flightProps();
flightPeople();
rooms();
humans();
souvenirs();
for (const f of written) console.log(`${f.key}\t${f.w}x${f.h}\t${(f.bytes / 1024).toFixed(1)} KB`);
console.log(`${written.length} files`);
