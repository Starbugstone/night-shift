// Clip 1: flight steering and the 1-second detection fuse (L3, real mouse input).
// The L3 police cruiser loops its 7200 px route at 380 px/s (one lap = 18.95 s), so it comes
// back along Birch Lane at a known time: we park in its lane and let its headlights find us.
import { Capture, OUT, stepAt } from './lib.mjs';

const NAME = '01-flight-detection';
const cap = await Capture.open('?unlock=1&flight=3', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('flight');

const C = {
  chapter: '1 · Flight',
  title: 'Steering, and the 1-second fuse',
  bullets: [
    'Hold a finger anywhere: the saucer accelerates toward it (1500 px/s², top speed 430). Let go and it brakes into a hover.',
    'Every detector has one hard edge, and the hit test is a single point: the centre of the saucer.',
    'Inside any detector the fuse fills at 1.0 per second: 60 frames to SPOTTED. Two detectors at once don\'t fill it faster.',
    'SPOTTED. The witness\'s own camera develops Exhibit A.',
    '1.35 s later you beam back in at the last checkpoint, invisible for 1.6 s. The sunrise clock kept running.',
  ],
  note: 'Same physics step for the live game, the autopilot\'s look-ahead and the vitest proofs.',
};

await cap.define('ann', {
  steer(g, S) {
    const d = S.dbg(); if (!d || !d.sim) return;
    const cam = S.flightCam(); const s = d.sim.saucer; const p = S.ns().pointer;
    const x = s.x - cam.x, y = s.y - cam.y;
    if (d.state === 'spotted') return;
    S.circle(g, x, y, 16, 'rgba(255,255,255,0.7)', 1.5, null, [3, 3]);
    S.circle(g, x, y, 186, 'rgba(124,255,203,0.35)', 1.5, null, [8, 8]);
    S.label(g, 'full thrust', x, y + 186, 'rgba(124,255,203,0.9)', 12);
    if (p.down) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(p.x, p.y); S.stroke(g, S.C.white, 2, [6, 5]); g.stroke(); g.setLineDash([]);
      S.circle(g, p.x, p.y, 13, S.C.white, 3, 'rgba(255,255,255,0.25)');
      S.label(g, 'finger', p.x, p.y - 26, S.C.white, 13);
    }
    const vx = s.vx * 0.35, vy = s.vy * 0.35;
    if (Math.hypot(vx, vy) > 6) {
      const a = Math.atan2(vy, vx);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + vx, y + vy);
      g.lineTo(x + vx - 14 * Math.cos(a - 0.45), y + vy - 14 * Math.sin(a - 0.45)); g.moveTo(x + vx, y + vy);
      g.lineTo(x + vx - 14 * Math.cos(a + 0.45), y + vy - 14 * Math.sin(a + 0.45));
      S.stroke(g, S.C.blue, 4); g.stroke();
      S.label(g, 'velocity', x + vx, y + vy + 18, S.C.blue, 12);
    }
  },
  cruiser(g, S) {
    const d = S.dbg(); if (!d || !d.sim) return;
    const cam = S.flightCam(); const f = d.sim.field; const st = d.sim.st;
    const def = f.defs[0]; const car = f.cars[0][0];
    const hot = st.cause === 0 || d.state === 'spotted';
    const col = hot ? S.C.red : S.C.amber;
    g.translate(-cam.x, -cam.y);
    S.cone(g, car.ox, car.oy, car.cone, def.coneHalf, def.coneRange, col, 3, hot ? 'rgba(255,77,109,0.12)' : null);
    S.circle(g, car.x, car.y, def.barR, col, 2.5, null, [7, 5]);
    S.label(g, 'cone: 340 px, ±0.38 rad', car.ox + Math.cos(car.cone) * 200, car.oy + Math.sin(car.cone) * 200 - 34, col, 12);
    S.label(g, 'light bar r 110', car.x, car.y - 124, col, 12);
    const s = d.sim.saucer;
    S.dot(g, s.x, s.y, 6, hot ? S.C.red : S.C.mint);
    g.beginPath(); g.moveTo(s.x - 14, s.y); g.lineTo(s.x + 14, s.y); g.moveTo(s.x, s.y - 14); g.lineTo(s.x, s.y + 14); S.stroke(g, S.C.white, 2); g.stroke();
    if (d.state !== 'spotted') S.label(g, 'hit point', s.x + 64, s.y + 2, S.C.white, 12);
  },
});

await cap.define('ro', {
  r1(S, st) {
    const d = S.dbg(); if (!d || !d.sim) return [];
    const w = (window.__c1 ??= { last: -1, run: 0, first: -1, peak: 0 });
    const vf = window.__vt.frames;
    const sim = d.sim; const s = sim.saucer; const p = S.ns().pointer;
    if (vf !== w.last) {
      w.last = vf;
      if (sim.st.cause >= 0 && (d.state === 'fly' || w.first < 0)) w.run++;
      else if (d.state === 'fly') w.run = 0;
      if (d.state === 'spotted' && w.first < 0) w.first = w.run;
    }
    const cx = s.x - sim.camX, cy = s.y - sim.camY;
    const dx = p.x - cx, dy = p.y - cy, dd = Math.hypot(dx, dy);
    const k = p.down && dd > 16 ? Math.min(1, (dd - 16) / 170) : 0;
    const sp = Math.hypot(s.vx, s.vy);
    const lines = [
      `frame ${String(vf - st.f0).padStart(5)}    game t ${sim.t.toFixed(2).padStart(6)} s`,
      p.down ? `finger Δ (${dx.toFixed(0).padStart(4)}, ${dy.toFixed(0).padStart(4)})  thrust ${(k * 100).toFixed(0).padStart(3)}%` : 'finger up: braking (drag 4.2/s)',
      `speed ${sp.toFixed(0).padStart(4)} px/s  (cap 430)`,
    ];
    const sus = sim.st.sus;
    const tag = sim.st.cause >= 0 ? '!' : sus > 0 ? '~' : '';
    lines.push(`${tag}fuse ${S.bar(sus, 20)} ${sus.toFixed(2)}`);
    if (d.state === 'spotted') lines.push(`!SPOTTED after ${w.first} frames in sight`);
    else lines.push(sim.st.cause >= 0 ? `!in sight for ${w.run} frames (${(w.run / 60).toFixed(2)} s)` : sim.st.safe > 0 ? `~ghost: ${sim.st.safe.toFixed(2)} s of invisibility` : 'in sight: nothing');
    return lines;
  },
});

const f0 = await cap.eval(() => window.__vt.frames);
const st = async () => cap.eval(() => {
  const d = window.__nightShift.active.debug; const s = d.sim.saucer;
  return { t: d.sim.t, state: d.state, x: s.x, y: s.y, vx: s.vx, vy: s.vy, cx: d.sim.camX, cy: d.sim.camY, sus: d.sim.st.sus, cause: d.sim.st.cause, safe: d.sim.st.safe, spotted: window.__nightShift.run.spotted };
});

const AMBUSH = { x: 800, y: 2462 };
let phaseT = { exposed: -1, spotted: -1, respawn: -1 };
let shots = { steer: false, fuse: false, photo: false, respawn: false };
let frames = 0;
let endAt = Infinity;
while (frames < 60 * 40) {
  const s = await st();
  // ---- choreography (finger offsets are relative to the saucer on screen)
  const sx = s.x - s.cx, sy = s.y - s.cy;
  if (s.state === 'spotted') await cap.release();
  else if (phaseT.spotted >= 0) await cap.release();
  else if (s.t < 1.5) await cap.release();
  else if (s.t < 5.2) await cap.press(sx - 175, sy - 30);
  else if (s.t < 8.4) await cap.press(sx + 175, sy + 10);
  else if (s.t < 9.6) await cap.release();
  else {
    const dx = AMBUSH.x - s.x, dy = AMBUSH.y - s.y, dd = Math.hypot(dx, dy);
    if (dd < 18 && Math.hypot(s.vx, s.vy) < 40) await cap.release();
    else if (dd < 18) await cap.release();
    else {
      const lead = Math.min(170, dd * 0.9 + 20);
      await cap.press(sx + (dx / dd) * lead - s.vx * 0.35, sy + (dy / dd) * lead - s.vy * 0.35);
    }
  }
  if (s.cause >= 0 && phaseT.exposed < 0) phaseT.exposed = frames;
  if (s.state === 'spotted' && phaseT.spotted < 0) phaseT.spotted = frames;
  if (phaseT.spotted >= 0 && s.state === 'fly' && phaseT.respawn < 0) { phaseT.respawn = frames; endAt = frames + 60 * 3.2; }
  const t = frames / 60;
  const step = phaseT.respawn >= 0 ? 4 : phaseT.spotted >= 0 ? 3 : phaseT.exposed >= 0 ? 2 : s.t >= 9.6 ? 1 : 0;
  const ann = phaseT.spotted >= 0 && phaseT.respawn < 0 ? [] : s.t >= 9.6 ? ['cruiser', 'steer'] : ['steer', 'cruiser'];
  const caption = { ...C, step, ann, ro: 'r1', state: { f0 }, progress: Math.min(1, frames / 1650) };
  await cap.frame(caption);
  frames++;
  if (!shots.steer && s.t >= 6.6) { shots.steer = true; await cap.still(OUT + NAME + '-a-steering.png', caption); }
  if (!shots.fuse && phaseT.exposed >= 0 && frames - phaseT.exposed === 36) { shots.fuse = true; await cap.still(OUT + NAME + '-b-fuse.png', caption); }
  if (!shots.photo && phaseT.spotted >= 0 && frames - phaseT.spotted === 50) { shots.photo = true; await cap.still(OUT + NAME + '-c-exhibit-a.png', caption); }
  if (frames >= endAt) break;
}
await cap.close();
console.log(JSON.stringify({ phaseT, frames }));
