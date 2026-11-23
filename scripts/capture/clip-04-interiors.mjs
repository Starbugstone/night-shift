// Clip 4: multi-room interiors. Coach Barb's back-door route (living room -> kitchen -> utility),
// a hand-driven start to show the relative beam drag, then the in-page pilot through real input.
import { Capture, OUT } from './lib.mjs';
import { ABDUCT_ANN, ABDUCT_RO } from './overlays.mjs';

const NAME = '04-interiors';
const cap = await Capture.open('?unlock=1&room=barb_backdoor', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('abduct');
await cap.define('ann', ABDUCT_ANN);
await cap.define('ro', ABDUCT_RO);

const C = {
  chapter: '4 · Inside the building',
  title: 'One ragdoll, many rooms',
  bullets: [
    'The specimen is a verlet ragdoll: 11 joints, 10 bones, 8 constraint passes per 1/120 s physics step, with joint angle limits.',
    'You never grab the body. Dragging moves the beam point by your finger\'s change in position, and a spring pulls the neck and hips toward it.',
    'Rooms are rectangles. The walls are 14 px slabs built round each room, with a gap cut for every door, hatch and flue.',
    'The camera eases after the chest from room to room. Each backdrop is one 540×720 bitmap, tiled with every other copy mirrored, plus a separate floor strip.',
    'The collider outlines are what the body actually hits this frame: furniture boxes, the robot vacuum, the swinging back door.',
  ],
  note: 'Coach Barb sleeps through all of this. Biscuit the dog is less reliable.',
};

let frames = 0;
let seg = 'manual';
let shots = 0;
const total = 60 * 38;
const rec = async (cap2, adv) => { await cap.frame(cap2, adv); frames++; };
const info = () => cap.eval(() => {
  const d = window.__nightShift.active && window.__nightShift.active.debug;
  if (!d || !d.body) return null;
  return { t: d.elapsed, x: d.body.chestX, y: d.body.chestY, idx: d.pilot ? d.pilot.index : 0, delivered: d.delivered, failure: d.failure || null, complete: d.complete, scene: window.__nightShift.scene };
});

// --- A: by hand (real time). Drag from the lower right of the screen, far from the body.
const manual = [
  // [frames, dx per frame, dy per frame]
  [30, 0, 0], [60, 0, -2.4], [45, 2.2, -0.4], [50, -2.6, 0.5], [45, 1.6, -0.8], [40, 0, 0],
];
let fx = 430, fy = 780;
await cap.press(fx, fy);
await cap.step(1);
let k = 0;
for (const [n, dx, dy] of manual) {
  for (let i = 0; i < n; i++, k++) {
    fx += dx; fy += dy;
    await cap.move(fx, fy);
    const step = k < 80 ? 0 : 1;
    await rec({ ...C, step, ann: k < 80 ? ['body', 'finger'] : ['body', 'finger'], ro: 'abduct', state: { sleepers: false }, progress: frames / total });
    if (k === 150 && shots === 0) { shots++; await cap.still(OUT + NAME + '-a-ragdoll-beam.png', { ...C, step: 1, ann: ['body', 'finger'], ro: 'abduct', state: { sleepers: false } }); }
  }
}
await cap.release();
await cap.step(2);

// --- B: the pilot takes the route. Real time through the living room, then a labelled 3x
// time-lapse through the kitchen, back to real time in the utility room.
let stillB = false;
let stillC = false;
for (let i = 0; i < 60 * 200; i++) {
  const s = await info();
  if (!s || s.scene !== 'abduct') break;
  if (s.complete) break;
  await cap.abductPilot();
  const fast = s.x > 700 && s.x < 1560 && !s.delivered;
  const step = s.x < 700 ? (s.t < 6 ? 2 : 3) : 4;
  const ann = step === 2 ? ['walls', 'rooms', 'body'] : step === 3 ? ['tiles', 'walls', 'body'] : ['solids', 'walls', 'body'];
  const caption = { ...C, step, ann, ro: 'abduct', state: {}, badge: fast ? '3× time-lapse' : null, progress: frames / total };
  if (fast) {
    if (i % 3 === 2) await rec(caption, 1); else await cap.step(1);
  } else await rec(caption, 1);
  if (!stillB && s.x > 760 && s.x < 900) { stillB = true; await cap.still(OUT + NAME + '-b-walls-tiles.png', { ...caption, ann: ['tiles', 'walls', 'rooms', 'body'], badge: null }); }
  if (!stillC && s.x > 1980) { stillC = true; await cap.still(OUT + NAME + '-c-colliders.png', { ...caption, ann: ['solids', 'walls', 'body'], badge: null }); }
}
// hold on the delivery for a moment
for (let i = 0; i < 90; i++) await rec({ ...C, step: 4, ann: [], ro: 'abduct', progress: frames / total }, 1);
const end = await info();
await cap.close();
console.log(JSON.stringify({ frames, end }));
