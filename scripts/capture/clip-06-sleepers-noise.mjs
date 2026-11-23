// Clip 6: second sleepers and noise. Brenda beside Dentist Dave (patio route), Tiny in the
// club's green room past the bass stack, then Biscuit: we drop Coach Barb on the utility-room
// floor beside the dog until Biscuit wakes and the failure card comes up. Real mouse input.
import { Capture, OUT } from './lib.mjs';
import { ABDUCT_ANN, ABDUCT_RO } from './overlays.mjs';
import { abductInfo, pilot } from './drive.mjs';

const NAME = '06-sleepers-noise';
const cap = await Capture.open('?unlock=1&room=dave_patio', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('abduct');
await cap.define('ann', ABDUCT_ANN);
await cap.define('ro', ABDUCT_RO);

const C = {
  chapter: '6 · Second sleepers & noise',
  title: 'Someone else is asleep in here',
  bullets: [
    'Some buildings have a second sleeper: Brenda right beside Dentist Dave, Tiny in the club\'s green room, Biscuit by Coach Barb\'s back door.',
    'Every sound has a position. A sleeper hears power × (1 − distance ÷ hearing radius): the same bump is quieter across the room and silent beyond the radius.',
    'Bonks get louder the harder you hit. The bass stack, creaky stairs, breaking things and a barking dog make noise too. Sleeper meters drain at 2.1 per second.',
    'On a deep shift, anyone waking is an instant failure. The scene freezes and the card says who woke.',
  ],
  note: 'Brenda was promised one night off.',
};
const TOTAL = 60 * 36;
const prog = () => cap.frames / TOTAL;
const capOf = (step, extra = {}) => ({ ...C, step, ann: ['sleepers', 'body'], ro: 'abduct', state: {}, progress: prog(), ...extra });

// ---- A. Brenda, at the start of Dave's patio route (real time)
let shotA = false;
await pilot(cap, {
  until: () => cap.frames >= 60 * 6,
  caption: () => capOf(0),
  onFrame: async (s, c) => { if (!shotA && cap.frames === 200) { shotA = true; await cap.still(`${OUT}${NAME}-a-brenda.png`, c); } },
});

// ---- B. Kev's fire escape: the bass stack, then Tiny
await cap.nav('?unlock=1&room=kev_fireescape', 'abduct');
const tB = { tiny: -1 };
await pilot(cap, {
  until: (s) => s.delivered || s.failure || s.x > 2200 || (tB.tiny >= 0 && cap.frames - tB.tiny > 60 * 9),
  // skip the DJ booth, 4x past the bass stack, skip the doorway, real time near Tiny
  speed: (s) => (s.x < 620 ? 0 : s.x < 1000 ? 4 : s.x < 1500 ? 0 : 1),
  caption: (s) => {
    if (s.x >= 1500 && tB.tiny < 0) tB.tiny = cap.frames;
    return capOf(1);
  },
});

// ---- C. Biscuit: pilot to the utility room, then drop Barb on the floor beside the dog
await cap.nav('?unlock=1&room=barb_backdoor', 'abduct');
await pilot(cap, {
  until: (s) => s.idx >= 7 && Math.hypot(s.x - 1795, s.y - 511) < 25,
  speed: () => 10,
  caption: () => capOf(2),
});
let fy = (await cap.eval(() => window.__nightShift.pointer)).y;
let fx = (await cap.eval(() => window.__nightShift.pointer)).x;
const shove = async (dy) => {
  fy += dy;
  if (fy > 900 || fy < 170) {
    await cap.release(); await cap.frame(capOf(2), 1);
    fy = dy > 0 ? 300 : 800; fx = 270; await cap.press(fx, fy); return;
  }
  await cap.move(fx, fy);
};
let failAt = -1;
let shotC = false;
// Gentle drops favour the dog: Biscuit hears 0.29 x (speed - 40) x falloff per bonk, while
// Barb's own meter gains 0.208 x (speed - 81) under deep rules. Start small, grow until a drop
// registers a bonk, back off if Barb's meter jumps.
let D = Number(process.env.DROP || 90);
const log = [];
for (let cyc = 0; cyc < 16 && failAt < 0; cyc++) {
  const before = await abductInfo(cap);
  for (let i = 0; i < 6; i++) { await shove(D / 6); await cap.frame(capOf(2), 1); }
  for (let i = 0; i < 30; i++) {
    const s = await abductInfo(cap);
    if (s.failure) { failAt = cap.frames; break; }
    await cap.frame(capOf(2), 1);
    if (!shotC && s.sleepers[0] > 45) { shotC = true; await cap.still(`${OUT}${NAME}-b-biscuit-noise.png`, capOf(2)); }
  }
  if (failAt >= 0) break;
  for (let i = 0; i < 40; i++) {
    const s = await abductInfo(cap);
    if (s.failure) { failAt = cap.frames; break; }
    await shove(-D / 40);
    await cap.frame(capOf(2), 1);
  }
  const after = await abductInfo(cap);
  log.push(`D${D} bonks+${after.bonks - before.bonks} barb ${after.wake.toFixed(0)} biscuit ${after.sleepers[0].toFixed(0)}`);
  if (after.bonks === before.bonks) D += 40;
  else if (after.wake - before.wake > 22) D = Math.max(60, D - 30);
}
console.error(log.join('\n'));
await cap.release();
const end = await abductInfo(cap);
for (let i = 0; i < 60 * 4; i++) {
  const c = capOf(3, { ann: i < 50 ? ['sleepers'] : [] });
  await cap.frame(c, 1);
  if (i === 70) await cap.still(`${OUT}${NAME}-c-failure-card.png`, c);
}
await cap.close();
console.log(JSON.stringify({ frames: cap.frames, failure: end.failure, sleepers: end.sleepers, wake: end.wake }));
