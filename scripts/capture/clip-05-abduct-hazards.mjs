// Clip 5: abduction hazards, four buildings. Barb's kitchen vacuum, Gary's laser and camera
// (we deliberately hold Gary's head in the camera's view until it trips), the Mayor's clock tower
// gears and pendulum, and the elevator shaft. Real mouse input throughout.
import { Capture, OUT } from './lib.mjs';
import { ABDUCT_ANN, ABDUCT_RO } from './overlays.mjs';
import { abductInfo, pilot } from './drive.mjs';

const NAME = '05-abduct-hazards';
const cap = await Capture.open('?unlock=1&room=barb_backdoor', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('abduct');
await cap.define('ann', ABDUCT_ANN);
await cap.define('ro', ABDUCT_RO);

const C = {
  chapter: '5 · Abduction hazards',
  title: 'Everything in the building is on a clock',
  bullets: [
    'The robot vacuum is a moving box. It passes its own velocity to whatever it touches, so it shoves the body instead of just blocking it.',
    'Lasers glow amber for the last 0.35 s, then fire. If any of the body\'s 21 contact circles touches a lit beam, the alarm goes off.',
    'A camera\'s cone is clipped by the walls. It tests every body circle, so a head or a foot counts. 1 s in view (with a 0.25 s grace) trips the alarm.',
    'Gears, pendulums and lamps are solids whose angle is a pure function of time. The pose you see drawn is the pose that collides.',
    'Doors, hatches and shutters open on fixed cycles, and the dial beside each one counts down. The elevator car and its counterweight run on separate tracks.',
  ],
  note: 'Gary installed the laser himself. It has caught Gary eleven times.',
};
const TOTAL = 60 * 44;
let frames0 = 0;
const progress = () => cap.frames / TOTAL;
let stills = 0;
const still = async (tag, c) => { stills++; await cap.still(`${OUT}${NAME}-${tag}.png`, { ...c, badge: null }); };

// ---- 1. Barb's kitchen vacuum
let shotVac = false;
await pilot(cap, {
  until: (s) => s.x > 1150 || cap.frames > 60 * 5,
  speed: (s) => (s.x < 800 ? 0 : 1),
  caption: () => ({ ...C, step: 0, ann: ['solids', 'body'], ro: 'abduct', state: { sleepers: false }, progress: progress() }),
  onFrame: async (s, c) => { if (!shotVac && s.x > 860) { shotVac = true; await still('a-vacuum', c); } },
});

// ---- 2. Gary's garage: the laser, then the camera
await cap.nav('?unlock=1&room=gary_garagedoor', 'abduct');
let shotLaser = false;
await pilot(cap, {
  until: (s) => s.idx >= 5 && Math.hypot(s.x - 945, s.y - 440) < 20,
  // Gary's laser: period 6.4 s, off for its first 3.35 s, phase 0.4 (src/abduct/rooms/deep.ts).
  // Real time for the charge-up, the firing and the crossing; 3x while the pilot waits it out.
  speed: (s) => {
    if (s.x > 760) return 4;
    const p = (s.t + 0.4) % 6.4;
    return (p >= 2.85 && p < 3.75) || (s.x > 420 && s.idx >= 2) ? 1 : 6;
  },
  caption: () => ({ ...C, step: 1, ann: ['timers', 'solids', 'body'], ro: 'abduct', state: { sleepers: false }, progress: progress() }),
  onFrame: async (s, c) => {
    if (!shotLaser) {
      const lit = await cap.eval(() => { const d = window.__nightShift.active.debug; const h = d.interior.hazards.find((x) => x.spec.kind === 'laser'); const sx = h.spec.area.x - d.camera.x; return h.level === 1 && sx > 60 && sx < 480; });
      if (lit) { shotLaser = true; await still('b-laser', c); }
    }
  },
});
// The pilot is waiting for the camera. Take over: carry Gary right, under the camera's
// left-most sweep, and hold still.
const dipCap = () => ({ ...C, step: 2, ann: ['cones', 'body'], ro: 'abduct', state: { sleepers: false, camera: true }, progress: progress() });
let shotCam = false;
let held = 0;
let after = 0;
for (let i = 0; i < 60 * 12; i++) {
  const s = await abductInfo(cap);
  if (s.scene !== 'abduct') break;
  if (s.failure) { after++; if (after > 75) break; }
  const tx = 1092 - s.bx, ty = 440 - s.by;
  const d = Math.hypot(tx, ty);
  const p = await cap.eval(() => window.__nightShift.pointer);
  if (!s.failure && d > 0.5) {
    const v = Math.min(d, 80 / 60);
    if (p.x > 495 || !p.down) {
      // re-grip near the middle: lift this frame, press again next frame
      if (cap.down) await cap.release();
      else await cap.press(270, 520);
    } else await cap.move(p.x + (tx / d) * v, p.y + (ty / d) * v);
  } else held++;
  const c = dipCap();
  await cap.frame(c, 1);
  if (!shotCam && s.watching && s.exposure > 0.6) { shotCam = true; await still('c-camera-body', c); }
}
await cap.release();

// ---- 3. The Mayor's clock tower: gears, pendulum, cuckoo, the service hatch
await cap.nav('?unlock=1&room=mayor_clocktower', 'abduct');
let shotGear = false;
const tClock = { real: -1 };
await pilot(cap, {
  until: (s) => s.y < -880 || s.delivered || (tClock.real >= 0 && cap.frames - tClock.real > 60 * 7),
  speed: (s) => (s.y > 120 ? 0 : 1),
  caption: (s) => (s.y <= 120 && tClock.real < 0 && (tClock.real = cap.frames), { ...C, step: 3, ann: ['solids', 'timers', 'body'], ro: 'abduct', state: { sleepers: false, camera: s.y > 120 }, progress: progress() }),
  onFrame: async (s, c) => { if (!shotGear && s.y < -330) { shotGear = true; await still('d-gears', c); } },
});

// ---- 4. The elevator shaft: car, counterweight, safety shutter
await cap.nav('?unlock=1&room=mayor_elevator', 'abduct');
const tLift = { start: -1 };
let shotLift = false;
await pilot(cap, {
  until: (s) => s.delivered || (tLift.start >= 0 && cap.frames - tLift.start > 60 * 7),
  speed: (s) => (s.x > 1680 ? 1 : 0),
  caption: (s) => {
    if (s.x > 1680 && tLift.start < 0) tLift.start = cap.frames;
    return { ...C, step: 4, ann: ['solids', 'timers', 'body'], ro: 'abduct', state: { sleepers: false }, progress: progress() };
  },
  onFrame: async (s, c) => { if (!shotLift && s.y < -150) { shotLift = true; await still('e-elevator', c); } },
});
await cap.close();
console.log(JSON.stringify({ frames: cap.frames, stills }));
