// Clip 2: flight hazards on L3 and L4, each with its true hit shape from src/flight/hazards.ts
// drawn over the game (sampled from the live HazardField, so drawn = hit).
// To keep each hazard on screen, the saucer is placed next to it (a labelled debug jump) and,
// where we only want to watch, given a long safe window ("ghost": detection off). Porch arming,
// flock and crane bumps and the dash are real interactions through the real mouse.
import { Capture, OUT } from './lib.mjs';

const NAME = '02-flight-hazards';
const SAVE = { glorbs: 999, allUnlocked: true, upgrades: ['afterburner'], levels: {} };
const cap = await Capture.open('?flight=3', { out: process.env.DRY ? null : OUT + NAME + '.mp4', save: SAVE });
await cap.waitScene('flight');

const C = {
  chapter: '2 · Flight hazards',
  title: 'The drawn shape is the hit shape',
  bullets: [
    'L3, the suburbs: the police cruiser\'s headlight cone and light bar, porch lights that click on after 0.4 s, and Mrs. Pruitt\'s binoculars.',
    'Every hazard is a pure function of the clock (porch lights excepted), so the renderer, the hit test and the autopilot\'s look-ahead all sample the same shapes.',
    'L4, downtown: a helicopter spotlight circling its loop, rooftop cameras, office windows that flicker for 0.6 s before they light.',
    'Solid hazards shove and stun you for 0.35 s: the crane boom (counterweight included) and the pigeons.',
    'The Afterburner upgrade: flick at 900 px/s or more and you dash at 2.2× top speed for 0.35 s, then it recharges for 2.5 s.',
  ],
  note: 'Mrs. Pruitt has never missed a night. Her binoculars glint 0.45 s before every snap.',
};

await cap.define('ann', {
  hz(g, S, st) {
    const d = S.dbg(); if (!d || !d.sim) return;
    const sim = d.sim; const f = sim.field; const F = sim.st;
    const R = 44;
    g.translate(-sim.camX, -sim.camY);
    const vx = sim.camX, vy = sim.camY;
    const near = (x, y, r) => x + r > vx - 20 && x - r < vx + 560 && y + r > vy - 20 && y - r < vy + 980;
    const IDLE = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < f.defs.length; i++) {
      const h = f.defs[i];
      const on = F.cause === i || F.bump === i;
      const col = on ? S.C.red : f.tell[i] ? S.C.amber : IDLE;
      const fill = on ? 'rgba(255,77,109,0.16)' : null;
      if (h.type === 'car') {
        const c = f.cars[i][0]; if (!near(c.x, c.y, h.coneRange + 80)) continue;
        S.cone(g, c.ox, c.oy, c.cone, h.coneHalf, h.coneRange, col, 2.5, fill);
        if (h.barR > 0) S.circle(g, c.x, c.y, h.barR, col, 2, null, [7, 5]);
      } else if (h.type === 'traffic') {
        for (const c of f.cars[i]) if (c.live && near(c.x, c.y, h.coneRange)) S.cone(g, c.ox, c.oy, c.cone, h.coneHalf, h.coneRange, col, 2, fill);
      } else if (h.type === 'porch') {
        if (!near(h.x, h.y, h.r)) continue;
        const slot = f.porchSlot[i]; const lit = F.porchLit[slot] > 0; const arm = F.porchArm[slot];
        S.circle(g, h.x, h.y, h.trigger, arm > 0 ? S.C.amber : 'rgba(255,255,255,0.5)', 2, null, [4, 5]);
        if (arm > 0 && !lit) { g.beginPath(); g.arc(h.x, h.y, h.trigger + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, arm / 0.4)); S.stroke(g, S.C.amber, 6); g.stroke(); }
        S.circle(g, h.x, h.y, h.r, lit ? (on ? S.C.red : S.C.amber) : 'rgba(255,255,255,0.25)', lit ? 3 : 1.5, lit ? 'rgba(255,194,77,0.10)' : null, lit ? null : [3, 8]);
      } else if (h.type === 'watcher') {
        if (!near(h.x, h.y, h.range)) continue;
        if (f.tell[i]) S.cone(g, h.x, h.y, f.b[i], h.half, h.range, S.C.amber, 2, 'rgba(255,194,77,0.10)');
        S.cone(g, h.x, h.y, f.a[i], h.half, h.range, on ? S.C.red : IDLE, 2.5, fill);
      } else if (h.type === 'dog') {
        if (near(h.x, h.y, h.rMax)) S.circle(g, h.x, h.y, f.a[i], col, 2.5, fill);
      } else if (h.type === 'heli') {
        if (!near(f.x[i], f.y[i], h.spotDist + h.spotR)) continue;
        S.circle(g, f.x2[i], f.y2[i], h.spotR, col, 3, fill || 'rgba(255,255,255,0.06)');
        g.beginPath(); g.moveTo(f.x[i], f.y[i]); g.lineTo(f.x2[i], f.y2[i]); S.stroke(g, 'rgba(255,255,255,0.5)', 1.5, [4, 4]); g.stroke(); g.setLineDash([]);
        S.circle(g, f.x[i], f.y[i], h.spotDist, 'rgba(255,255,255,0.25)', 1, null, [3, 7]);
      } else if (h.type === 'camera') {
        if (near(h.x, h.y, h.range)) S.cone(g, h.x, h.y, f.a[i], h.half, h.range, col, 2.5, fill);
      } else if (h.type === 'window') {
        if (!near(h.x, h.y, h.r)) continue;
        const lit = f.on[i] === 1;
        S.circle(g, h.x, h.y, h.r, lit ? (on ? S.C.red : IDLE) : f.tell[i] ? S.C.amber : 'rgba(255,255,255,0.3)', lit ? 3 : 2, lit ? 'rgba(255,255,255,0.06)' : null, lit ? null : [5, 6]);
      } else if (h.type === 'crane') {
        if (!near(h.x, h.y, h.len)) continue;
        const a = f.a[i]; const tail = h.len * (60 / 460);
        S.capsule(g, h.x - Math.cos(a) * tail, h.y - Math.sin(a) * tail, f.x2[i], f.y2[i], h.width / 2 + R * 0.8, col, 2.5, fill);
      } else if (h.type === 'flock') {
        if (near(f.x[i], f.y[i], h.r + 40)) S.circle(g, f.x[i], f.y[i], h.r + R * 0.7, col, 2.5, fill);
      } else if (h.type === 'wire') {
        if (near((h.ax + h.bx) / 2, (h.ay + h.by) / 2, Math.hypot(h.bx - h.ax, h.by - h.ay) / 2 + 40)) S.capsule(g, h.ax, h.ay, h.bx, h.by, R * 0.8, on ? S.C.red : 'rgba(255,255,255,0.45)', 1.5, fill);
      } else if (h.type === 'neon') {
        if (near(h.x, h.y, h.r)) S.circle(g, h.x, h.y, h.r, f.on[i] ? 'rgba(124,255,203,0.8)' : 'rgba(124,255,203,0.3)', 2, null, [8, 6]);
      }
    }
    const s = sim.saucer;
    S.dot(g, s.x, s.y, 6, F.cause >= 0 ? S.C.red : S.C.mint);
    g.beginPath(); g.moveTo(s.x - 14, s.y); g.lineTo(s.x + 14, s.y); g.moveTo(s.x, s.y - 14); g.lineTo(s.x, s.y + 14); S.stroke(g, S.C.white, 2); g.stroke();
    if (st.label) for (const [text, wx, wy, c] of st.label) S.label(g, text, wx, wy, c || S.C.white, 13);
  },
});

await cap.define('ro', {
  hz(S, st) {
    const d = S.dbg(); if (!d || !d.sim) return [];
    const sim = d.sim; const f = sim.field; const F = sim.st; const s = sim.saucer;
    const lines = [];
    const h = st.i >= 0 ? f.defs[st.i] : null;
    const sl = h && h.type === 'porch' ? f.porchSlot[st.i] : -1;
    switch (st.seg) {
      case 'cruiser': lines.push('police cruiser: cone 340 px, ±0.38 rad', 'light bar: circle r 110 round the car', 'speed 380 px/s, one lap = 18.9 s'); break;
      case 'porch': lines.push(`porch light: trigger r ${h.trigger}, light r ${h.r}`, `${F.porchArm[sl] > 0 && F.porchLit[sl] <= 0 ? '~' : ''}arming ${Math.min(0.4, F.porchArm[sl]).toFixed(2)} / 0.40 s`, `${F.porchLit[sl] > 0 ? '~' : ''}lit ${F.porchLit[sl].toFixed(2)} s left (of 3)`); break;
      case 'pruitt': lines.push('binocular cone 640 px, ±0.22 rad', `holds each angle 1.8 s · now ${(f.t % 1.8).toFixed(2)} s`, `${f.tell[st.i] ? '~glint: snapping next!' : 'next snap in ' + (1.8 - (f.t % 1.8)).toFixed(2) + ' s'}`); break;
      case 'heli': lines.push('spotlight: circle r 150, 210 px from the heli', 'spot turns at 1.6 rad/s, the heli laps in 22 s', `heli (${f.x[st.i].toFixed(0)}, ${f.y[st.i].toFixed(0)})`); break;
      case 'cams': {
        const w = f.defs[st.w];
        const tau = (((f.t + w.phase) % w.period) + w.period) % w.period;
        lines.push('rooftop camera: cone 300 px, ±0.32 rad', `office window: lit ${w.on.toFixed(1)} s of every ${w.period.toFixed(1)} s`, `${f.tell[st.w] ? '~flickering: lights in ' + (w.period - w.on - tau).toFixed(2) + ' s' : f.on[st.w] ? '!window lit' : 'window dark, phase ' + tau.toFixed(1) + ' s'}`);
        break;
      }
      case 'crane': lines.push('boom 430 px + counterweight tail, 0.6 rad/s', 'hit capsule: half width 13 + 0.8 × saucer r', `${F.bump >= 0 || s.stun > 0 ? '!' : ''}stun ${s.stun.toFixed(2)} s`); break;
      case 'flock': lines.push('pigeons: circle r 50 + 0.7 × saucer r', 'solid: pushes you out, +160 px/s shove', `${s.stun > 0 ? '!' : ''}stun ${s.stun.toFixed(2)} s`); break;
      case 'dash': {
        const D = F.dash;
        lines.push(`${D.active > 0 ? '!' : ''}dash ${D.active > 0 ? 'ACTIVE ' + D.active.toFixed(2) + ' s' : 'ready'}`, `${D.cool > 0 ? '~' : ''}recharge ${Math.max(0, D.cool - D.active).toFixed(2)} s`, `speed ${Math.hypot(s.vx, s.vy).toFixed(0)} px/s (cap 430, dash 946)`);
        break;
      }
    }
    const sus = F.sus;
    lines.push(`${F.cause >= 0 ? '!' : sus > 0 ? '~' : ''}fuse ${S.bar(sus, 16)} ${sus.toFixed(2)}${F.safe > 50 ? '   (ghost: detection off)' : ''}`);
    return lines;
  },
});

// ---------------------------------------------------------------- helpers
const TOTAL = 60 * 46;
let fx = 270, fy = 520;
const sim = () => cap.eval(() => { const d = window.__nightShift.active.debug; const s = d.sim.saucer; return { t: d.sim.t, x: s.x, y: s.y, vx: s.vx, vy: s.vy, cx: d.sim.camX, cy: d.sim.camY, state: d.state, cause: d.sim.st.cause, bump: d.sim.st.bump }; });
/** Debug jump: put the saucer at (x, y); ghost = long safe window (detection off). */
const place = (x, y, ghost) => cap.eval(([x, y, gh]) => { const d = window.__nightShift.active.debug; d.sim.place(x, y, gh ? 999 : 0); }, [x, y, ghost]);
const ghostOff = () => cap.eval(() => { window.__nightShift.active.debug.sim.st.safe = 0; });
let stills = 0;
async function rec(n, step, state, ctl, still) {
  for (let i = 0; i < n; i++) {
    if (ctl) await ctl(i);
    const c = { ...C, step, ann: 'hz', ro: 'hz', state, badge: i < 45 && state.jump ? 'debug jump' : null, progress: cap.frames / TOTAL };
    await cap.frame(c, 1);
    if (still && still(i)) { stills++; await cap.still(`${OUT}${NAME}-${['a', 'b', 'c', 'd', 'e'][stills - 1]}-${state.seg}.png`, { ...c, badge: null }); }
  }
}
/** Steer toward world point (tx, ty) with braking; releases when there. */
async function steerTo(tx, ty) {
  const s = await sim();
  const dx = tx - s.x, dy = ty - s.y, dd = Math.hypot(dx, dy);
  if (dd < 12) { await cap.release(); return; }
  const lead = Math.min(170, dd * 0.9 + 20);
  await cap.press(s.x - s.cx + (dx / dd) * lead - s.vx * 0.3, s.y - s.cy + (dy / dd) * lead - s.vy * 0.3);
}

// ---------------------------------------------------------------- L3
await cap.eval(() => { window.__nightShift.active.debug.sim.st.safe = 999; });
await rec(210, 0, { seg: 'cruiser', i: 0, label: [] });

// porch light on the east house (2000, 1815): drift into the trigger, hover until it clicks, flee
// (the cruiser is on the far side of town for this stretch of its lap)
await place(2000, 2090, false);
await cap.step(1);
let t0 = cap.frames;
await rec(300, 0, { seg: 'porch', i: 10, jump: true }, async (i) => {
  if (i < 20) return cap.release();
  if (i < 95) return steerTo(2000, 1878);
  if (i < 125) return cap.release();
  return steerTo(2000, 2110);
}, (i) => i === 140);

// Mrs. Pruitt's binoculars (ghosted saucer just south of her window)
await place(860, 1500, true);
await cap.release();
await rec(420, 1, { seg: 'pruitt', i: 1, jump: true }, null, (i) => i === 0 ? false : false);
// still on a glint frame
for (let k = 0; k < 120; k++) {
  const tell = await cap.eval(() => window.__nightShift.active.debug.sim.field.tell[1] === 1);
  if (tell) { stills++; await cap.still(`${OUT}${NAME}-b-pruitt.png`, { ...C, step: 1, ann: 'hz', ro: 'hz', state: { seg: 'pruitt', i: 1 } }); break; }
  await cap.frame({ ...C, step: 1, ann: 'hz', ro: 'hz', state: { seg: 'pruitt', i: 1 }, progress: cap.frames / TOTAL }, 1);
}

// ---------------------------------------------------------------- L4
await cap.nav('?flight=4', 'flight');
await cap.step(30);
// helicopter: chase it, ghosted
await cap.eval(() => { const d = window.__nightShift.active.debug; const f = d.sim.field; d.sim.place(f.x[0] - 120, f.y[0] + 260, 999); });
await rec(330, 2, { seg: 'heli', i: 0, jump: true }, async () => {
  const p = await cap.eval(() => { const f = window.__nightShift.active.debug.sim.field; return { x: f.x[0], y: f.y[0] }; });
  await steerTo(p.x - 60, p.y + 230);
});
await cap.release();
// rooftop camera (1285, 1955) beside office window 21 (1295, 2092)
await place(1160, 2140, true);
await rec(420, 2, { seg: 'cams', i: 9, w: 21, jump: true }, null);
// crane: park 0.9 rad ahead of the boom, 300 px out (real bump; detection off)
await cap.eval(() => { const d = window.__nightShift.active.debug; const f = d.sim.field; const i = f.defs.findIndex((h) => h.type === 'crane'); const h = f.defs[i]; const a = f.a[i] + 0.9; d.sim.place(h.x + Math.cos(a) * 300, h.y + Math.sin(a) * 300, 999); });
await cap.release();
await rec(270, 3, { seg: 'crane', jump: true }, null, (i) => i === 110);
// pigeons: wait on their loop 1.4 s ahead of the flock
await cap.eval(() => { const d = window.__nightShift.active.debug; const f = d.sim.field; const i = f.defs.findIndex((h) => h.type === 'flock'); const h = f.defs[i]; const out = { x: 0, y: 0 }; f.routes[i].at(h.phase + h.speed * (f.t + 1.4), out); d.sim.place(out.x, out.y, 999); });
await rec(200, 3, { seg: 'flock', jump: true }, null);
// afterburner: hold, then flick left fast (6 frames x 32 px = 1920 px/s)
await place(1080, 3560, true);
fx = 400; fy = 600;
await rec(300, 4, { seg: 'dash', jump: true }, async (i) => {
  if (i === 40) { fx = 380; fy = 560; return cap.press(fx, fy); }
  if (i > 40 && i <= 46) { fx -= 32; return cap.move(fx, fy); }
  if (i === 60) return cap.release();
  if (i === 230) { fx = 160; fy = 560; return cap.press(fx, fy); }
  if (i > 230 && i <= 236) { fx += 34; return cap.move(fx, fy); }
  if (i === 250) return cap.release();
}, (i) => i === 49);
await cap.close();
console.log(JSON.stringify({ frames: cap.frames, stills }));
