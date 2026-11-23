// Clip 3: the structure of a deep shift. A whole L3 shift played by the two in-page autopilots
// through the real mouse: three specimens, the sunrise clock across both phases, checkpoints,
// and the Specimen Report. Long stretches are labelled time-lapses; the moments that matter
// (shift start, lock-on, the start of each abduction, each return, the report) are real time.
// Dave's roof-hatch route is being retuned elsewhere, so the flight autopilot is told to avoid
// that ring (ring 0) and takes Dave's patio door instead.
import { Capture, OUT } from './lib.mjs';

const NAME = '03-deep-shift';
const cap = await Capture.open('?unlock=1&flight=3', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('flight');

const C = {
  chapter: '3 · A deep shift',
  title: 'Three specimens before sunrise',
  bullets: [
    'A deep shift is three specimens, in any order. Each house has two entry rings, and each ring leads to a different route inside.',
    'Arrows at the screen edge point to the specimens still to collect. The minimap shows the whole town.',
    'One sunrise clock runs through flight and abduction alike: 420 s on L3, 2:00 to 6:00. The retry card pauses it. Getting spotted doesn\'t.',
    'Every delivery moves your checkpoint to that ring. Get spotted later and you respawn there, not back at the start.',
    'All three aboard: the Specimen Report. Stars for all three, for Ghost (never spotted, no failed abduction) and for Night owl (160 s to spare).',
  ],
  note: 'Both autopilots play through the real mouse. Dave\'s roof-hatch ring is switched off for this film.',
};

await cap.define('ann', {
  shift(g, S) {
    const ns = S.ns(); const run = ns.run; if (!run) return;
    if (ns.scene === 'flight') {
      const d = S.dbg(); if (!d || !d.sim) return;
      const m = d.sim.map; const mh = (m.h * 84) / m.w;
      g.strokeStyle = S.C.amber; g.lineWidth = 2.5; g.setLineDash([6, 4]);
      g.strokeRect(438, 84, 92, mh + 10); g.setLineDash([]);
      S.label(g, 'minimap', 484, 84 + mh + 26, S.C.amber, 13);
      g.strokeRect(368, 14, 164, 66);
      S.label(g, 'sunrise clock', 450, 92, S.C.amber, 13);
      // checkpoint flag (where a spotted saucer respawns)
      const cp = run.checkpoint; const x = cp.x - d.sim.camX, y = cp.y - d.sim.camY;
      if (x > -40 && x < 580 && y > -40 && y < 1000) {
        S.circle(g, x, y, 30, S.C.mint, 3, null, [6, 5]);
        S.label(g, 'checkpoint', x, y + 46, S.C.mint, 13);
      }
    } else if (ns.scene === 'abduct') {
      g.strokeStyle = S.C.amber; g.lineWidth = 2.5; g.setLineDash([6, 4]);
      g.strokeRect(198, 82, 140, 72); g.setLineDash([]);
      S.label(g, 'same sunrise clock', 268, 170, S.C.amber, 13);
    }
  },
});
await cap.define('ro', {
  shift(S) {
    const ns = S.ns(); const run = ns.run;
    if (!run) return ['shift over: Specimen Report'];
    const names = run.level.map.targets.map((t) => t.short);
    const aboard = names.map((n, i) => `${n} ${run.delivered[i] ? '✓' : '·'}`).join('  ');
    const now = ns.scene === 'abduct' && run.current ? `abduction: ${run.current.roomId}` : ns.scene === 'flight' ? `flight, leg ${run.legs + 1}` : ns.scene;
    return [
      `sunrise clock ${run.clockText()}   used ${run.elapsed.toFixed(1).padStart(5)} of ${run.budget} s`,
      `now: ${now}`,
      `aboard: ${aboard}`,
      `checkpoint (${Math.round(run.checkpoint.x)}, ${Math.round(run.checkpoint.y)})   spotted ${run.spotted}   failed ${run.failedAbductions}`,
    ];
  },
});

const info = () => cap.eval(() => {
  const ns = window.__nightShift; const a = ns.active; const run = ns.run;
  window.__ids = window.__ids || 0;
  if (a && !a.__id) a.__id = ++window.__ids;
  const d = a && a.debug;
  const out = { scene: ns.scene, id: a ? a.__id : 0, delivered: run ? run.deliveredCount : 3 };
  if (ns.scene === 'flight' && d && d.sim) {
    out.state = d.state;
    if (window.__c3last !== a) {
      // a fresh flight leg: plan around Dave's roof hatch (ring 0)
      d.sim.rings[0].x = -1e6; d.sim.rings[0].y = -1e6; d.autopilot(); const ap = a.debug.ap; ap.avoid[0] = 1e6; ap.replan();
      window.__c3last = a;
    }
  }
  if (ns.scene === 'abduct' && d && d.body) out.abDelivered = d.delivered;
  return out;
});

let lastKey = '';
let since = 0;
let bulletMax = 0;
let shots = new Set();
let reportFrames = 0;
let n = 0;
let firstAbduct = false;
let backInFlight = false;
const rooms = [];
for (let i = 0; i < 60 * 400; i++) {
  const s = await info();
  const key = s.scene + ':' + s.id;
  if (key !== lastKey) {
    lastKey = key; since = 0;
    await cap.release();
    if (s.scene === 'abduct') {
      firstAbduct = true;
      const room = await cap.eval(() => window.__nightShift.run.current.roomId);
      rooms.push(room);
      if (room === 'dave_roof') throw new Error('locked onto dave_roof: not filming that route');
    }
    if (s.scene === 'flight' && s.delivered > 0) backInFlight = true;
  } else since++;

  // inputs
  if (since > 0) {
    if (s.scene === 'flight') await cap.flightPilot();
    else if (s.scene === 'abduct') await cap.abductPilot();
    else if (s.scene === 'choice') { if (since === 30) await cap.tap(270, 598); }
    else await cap.release();
  }

  // pacing: real time where it matters
  let speed = 1;
  if (s.scene === 'flight') speed = s.state === 'locking' ? 1 : since < (s.delivered > 0 ? 130 : 180) ? 1 : 6;
  else if (s.scene === 'abduct') speed = since < 60 || s.abDelivered ? 1 : 12;
  const step = s.scene === 'report' ? 4 : backInFlight ? 3 : firstAbduct ? 2 : since > 150 || s.delivered > 0 ? 1 : 0;
  bulletMax = Math.max(bulletMax, step);
  const caption = { ...C, step: bulletMax, ann: s.scene === 'report' ? [] : ['shift'], ro: 'shift', badge: speed > 1 ? `${speed}× time-lapse` : null, progress: Math.min(1, cap.frames / 2250) };
  if (speed === 1 || n % speed === speed - 1) {
    await cap.frame(caption, 1);
    if (s.scene === 'flight' && since === 170 && s.delivered === 0 && !shots.has('a')) { shots.add('a'); await cap.still(OUT + NAME + '-a-arrows-minimap.png', caption); }
    if (s.scene === 'abduct' && since === 60 && !shots.has('b')) { shots.add('b'); await cap.still(OUT + NAME + '-b-clock-in-abduction.png', caption); }
    if (s.scene === 'flight' && s.delivered === 1 && since === 70 && !shots.has('c')) { shots.add('c'); await cap.still(OUT + NAME + '-c-checkpoint.png', caption); }
  } else await cap.fastStep(1);
  n++;
  if (s.scene === 'report') {
    reportFrames++;
    if (reportFrames === 280) await cap.still(OUT + NAME + '-d-report.png', caption);
    if (reportFrames > 320) break;
  }
}
await cap.close();
console.log(JSON.stringify({ frames: cap.frames, rooms }));
