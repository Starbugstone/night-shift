// Clip 8: progression and humour. Work Orders (Training and deep cards, rank), the Beam Shop
// (buying the Snooze Ray), Supervisor Vrell's memo, and a real Specimen Report from a tutorial
// abduction played by the pilot. Real taps and drags; the save is a fixture mid-way through.
import { Capture, OUT } from './lib.mjs';

const NAME = '08-progression';
const lv = (stars, best) => ({ stars, delivered: stars[0], bestTimeSec: best, attempts: 3 });
const SAVE = {
  glorbs: 150, muted: true, reports: 4, upgrades: ['beam_dampener'],
  levels: { level1: lv([true, true, true], 38.4), level2: lv([true, true, false], 61.2), level3: lv([true, false, false], 301.5), level4: lv([false, false, false], null) },
};
const cap = await Capture.open('', { out: process.env.DRY ? null : OUT + NAME + '.mp4', save: SAVE });
await cap.waitScene('title');

const C = {
  chapter: '8 · Progression & humour',
  title: 'Work orders, a shop, a boss and a report',
  bullets: [
    'Work Orders: the two tutorial shifts are tagged TRAINING. A deep shift is one card with three mugshots and its sunrise time.',
    'Your rank comes from total stars, from Intern up to Abduction Lead (12 stars in all). Deep shifts pay twice per star.',
    'The Beam Shop sells four upgrades. Afterburner (60 Glorbs) adds the flick dash. Snooze Ray (80) calms every sleeper once per building.',
    'Every shift starts with a memo from Supervisor Vrell.',
    'Every abduction ends with a Specimen Report: stars, Glorbs, the run\'s stats and a verdict from Vrell.',
  ],
  note: 'Beam Dampener: "Warranty void if used on actual noodles."',
};
await cap.define('ro', {
  save(S) {
    const s = S.ns().save;
    const stars = Object.values(s.levels).reduce((n, l) => n + l.stars.filter(Boolean).length, 0);
    return [
      `scene: ${S.ns().scene}`,
      `save: ${stars} of 12 stars · ${s.glorbs} Glorbs`,
      `upgrades: ${s.upgrades.join(', ') || 'none'}`,
    ];
  },
});
const TOTAL = 60 * 36;
let step = 0;
const rec = async (n) => { for (let i = 0; i < n; i++) await cap.frame({ ...C, step, ro: 'save', progress: cap.frames / TOTAL }, 1); };
const tap = async (x, y) => { await cap.press(x, y); await rec(3); await cap.release(); await rec(2); };
const still = (tag) => cap.still(`${OUT}${NAME}-${tag}.png`, { ...C, step, ro: 'save' });

await rec(70);
await tap(270, 686); // Clock in
await rec(90);
await still('a-work-orders');
// scroll down through the cards and back up
let y = 790;
await cap.press(270, y);
for (let i = 0; i < 40; i++) { y -= 9; await cap.move(270, y); await rec(1); }
await cap.release();
await rec(100);
step = 1;
await rec(60);
y = 300;
await cap.press(270, y);
for (let i = 0; i < 40; i++) { y += 10; await cap.move(270, y); await rec(1); }
await cap.release();
await rec(70);
// the Beam Shop
step = 2;
await tap(426, 216);
await rec(110);
await tap(416, 878); // buy the Snooze Ray
await rec(80);
await still('b-beam-shop');
await rec(40);
await tap(48, 48); // back to Work Orders
await rec(40);
// Vrell's memo for L3
step = 3;
await tap(270, 762);
await rec(50);
await tap(270, 420); // finish the typewriter
await rec(130);
await still('c-vrell-memo');
await rec(40);
// a real Specimen Report: Farmer Doyle's window, flown by the pilot off camera
await cap.nav('?room=farm_window', 'abduct');
for (let i = 0; i < 60 * 80; i++) {
  if ((await cap.scene()) !== 'abduct') break;
  await cap.abductPilot();
  await cap.fastStep(1);
}
await cap.release();
step = 4;
for (let i = 0; i < 60 * 9; i++) {
  await cap.frame({ ...C, step, ro: 'save', badge: i < 50 ? 'pilot delivered Doyle off camera' : null, progress: cap.frames / TOTAL }, 1);
  if (i === 420) await still('d-specimen-report');
}
await cap.close();
console.log(JSON.stringify({ frames: cap.frames }));
