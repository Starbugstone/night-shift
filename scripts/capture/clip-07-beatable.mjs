// Clip 7: proving the deep levels are beatable, and not trivially. The flight autopilot's
// exposure map and plan versus a beeline that gets spotted; the abduction pilot with its finger
// moves landing 3 frames late, versus a straight-line beeline that fails; then the
// vitest numbers. Real mouse input throughout.
import { readFileSync } from 'node:fs';
import { Capture, OUT } from './lib.mjs';
import { ABDUCT_ANN, ABDUCT_RO } from './overlays.mjs';
import { abductInfo } from './drive.mjs';

const NAME = '07-beatable';
const cap = await Capture.open('?unlock=1&flight=3', { out: process.env.DRY ? null : OUT + NAME + '.mp4' });
await cap.waitScene('flight');
await cap.define('ann', ABDUCT_ANN);
await cap.define('ro', ABDUCT_RO);

// Lines from a real run of the headless proofs (npx vitest run tests/abduct-deep.test.ts
// tests/flight-autopilot.test.ts), passed in by run-all or read from VITEST_LOG.
const VLOG = process.env.VITEST_LOG ? readFileSync(process.env.VITEST_LOG, 'utf8') : '';
const pick = (re) => (VLOG.split('\n').find((l) => re.test(l)) || '').trim();

const C = {
  chapter: '7 · Beatable, not trivial',
  title: 'Bots that prove every level can be beaten',
  bullets: [
    'The flight autopilot samples 90 s of hazard time on a 40 px grid to see how often each cell is watched, then runs A* across that map.',
    'Every 0.1 s it simulates the real physics ahead for "go", "dash" and "wait here", and commits only to a plan whose fuse stays under 0.45.',
    'A beeline to the nearest ring gets spotted, whatever time it starts. The tests try starts at 0, 2.5, 5 and 8 s.',
    'The abduction pilot follows hand-placed checkpoints. At a laser it waits until the crossing can finish 0.62 s before the next firing. Here its finger lands 3 frames late.',
    'Vitest runs all 12 deep routes from 4 start delays with jittered input, then again with mouse input 1 to 3 frames late. A straight beeline never delivers.',
  ],
  note: 'If a level can\'t be beaten by the bot, the build is red. If it can be beaten by a beeline, also red.',
};

await cap.define('ann', {
  plan(g, S) {
    const d = S.dbg(); if (!d || !d.sim || !d.ap) return;
    const sim = d.sim; const ap = d.ap; const G = ap.grid; const CELL = 40;
    g.translate(-sim.camX, -sim.camY);
    const c0 = Math.max(0, Math.floor(sim.camX / CELL)), c1 = Math.min(G.cols - 1, Math.ceil((sim.camX + 540) / CELL));
    const r0 = Math.max(0, Math.floor(sim.camY / CELL)), r1 = Math.min(G.rows - 1, Math.ceil((sim.camY + 960) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const k = c + r * G.cols; const e = G.exposure[k];
      if (G.blocked[k]) { g.fillStyle = 'rgba(184,169,255,0.45)'; g.fillRect(c * CELL, r * CELL, CELL, CELL); continue; }
      if (e > 0.001) { g.fillStyle = `rgba(255,77,109,${Math.min(0.55, 0.12 + e * 0.9)})`; g.fillRect(c * CELL, r * CELL, CELL, CELL); }
      else if (G.hold[k]) { g.fillStyle = 'rgba(124,255,203,0.10)'; g.fillRect(c * CELL, r * CELL, CELL, CELL); }
    }
    const P = ap.plan;
    if (P.length > 1) {
      g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      S.stroke(g, S.C.mint, 4); g.stroke();
      for (const h of ap.holdPoints) { const p = P[h]; if (p) { S.circle(g, p.x, p.y, 12, S.C.white, 3, 'rgba(124,255,203,0.6)'); } }
    }
    const s = sim.saucer; S.dot(g, s.x, s.y, 6, S.C.white);
    S.label(g, 'mode: ' + ap.currentMode, s.x, s.y - 70, S.C.mint, 14);
  },
  beeline(g, S, st) {
    const d = S.dbg(); if (!d || !d.sim) return;
    const sim = d.sim; g.translate(-sim.camX, -sim.camY);
    const s = sim.saucer;
    if (st.goal) {
      g.beginPath(); g.moveTo(s.x, s.y); for (const p of st.goal) g.lineTo(p[0], p[1]);
      S.stroke(g, S.C.red, 4, [12, 8]); g.stroke(); g.setLineDash([]);
      S.label(g, 'beeline', s.x + 50, s.y - 60, S.C.red, 14);
    }
    S.dot(g, s.x, s.y, 6, sim.st.cause >= 0 ? S.C.red : S.C.white);
  },
});
await cap.define('ro', {
  plan(S) {
    const d = S.dbg(); if (!d || !d.ap) return [];
    const L = d.ap.last; const st = d.ap.stats;
    return [
      `mode ${d.ap.currentMode.padEnd(5)} decisions ${st.decisions}  replans ${st.replans}`,
      `predicted fuse peak: go ${L.go.toFixed(2)}  wait ${L.hold.toFixed(2)}`,
      `plan ${d.ap.plan.length} pts, ${d.ap.holdPoints.length} hold points`,
      `${d.sim.st.sus > 0 ? '~' : ''}fuse ${S.bar(d.sim.st.sus, 16)} ${d.sim.st.sus.toFixed(2)}`,
    ];
  },
  beeline(S) {
    const d = S.dbg(); if (!d || !d.sim) return [];
    const F = d.sim.st;
    return [
      'naive: straight for Dave\'s ring, never waits',
      `game t ${d.sim.t.toFixed(2)} s`,
      `${F.cause >= 0 ? '!' : F.sus > 0 ? '~' : ''}fuse ${S.bar(F.sus, 16)} ${F.sus.toFixed(2)}`,
      d.state === 'spotted' ? '!SPOTTED' : F.cause >= 0 ? '!in sight' : 'unseen (so far)',
    ];
  },
  lag(S, st) {
    const d = S.dbg(); if (!d || !d.body) return [];
    const cps = d.room.interior.checkpoints; const i = d.pilot.index; const cp = cps[i];
    let wait = '';
    if (cp && cp.cross && !d.pilot.committed) {
      const ok = d.interior.canCross(cps[i - 1], cp, d.elapsed, cp.speed || 41);
      wait = ok ? 'canCross(laser): yes, go' : '~canCross(laser): no, waiting';
    } else if (cp && cp.cross) wait = 'committed: crossing';
    return [
      `input latency: ${st.lag} frames (${(st.lag * 1000 / 60).toFixed(0)} ms)`,
      `checkpoint ${i + 1} of ${cps.length}`,
      wait || 'cruising at 41 px/s',
      `t ${d.elapsed.toFixed(2)} s   bonks ${d.wake.bonks}`,
    ];
  },
  proofs(S, st) { return st.lines; },
});

const TOTAL = 60 * 44;
const prog = () => cap.frames / TOTAL;

// ---- A. flight autopilot with its exposure map and plan (real time)
let shotA = false;
for (let i = 0; i < 60 * 9; i++) {
  await cap.flightPilot();
  const c = { ...C, step: i < 300 ? 0 : 1, ann: 'plan', ro: 'plan', progress: prog() };
  await cap.frame(c, 1);
  if (!shotA && i === 280) { shotA = true; await cap.still(`${OUT}${NAME}-a-autopilot-plan.png`, c); }
}
await cap.release();

// ---- B. beeline from the start: through the gap in the power lines, straight for Dave's patio ring
await cap.nav('?unlock=1&flight=3', 'flight');
await cap.step(2);
const GOAL = [[1080, 2420], [678, 899]];
let k = 0;
let spottedAt = -1;
let shotB = false;
for (let i = 0; i < 60 * 15; i++) {
  const s = await cap.eval(() => { const d = window.__nightShift.active.debug; const s = d.sim.saucer; return { x: s.x, y: s.y, vx: s.vx, vy: s.vy, cx: d.sim.camX, cy: d.sim.camY, state: d.state }; });
  if (s.state === 'spotted' && spottedAt < 0) spottedAt = i;
  if (s.state !== 'fly' || spottedAt >= 0) await cap.release();
  else {
    while (k < GOAL.length - 1 && Math.hypot(GOAL[k][0] - s.x, GOAL[k][1] - s.y) < 70) k++;
    const [qx, qy] = GOAL[k]; const dx = qx - s.x, dy = qy - s.y, dd = Math.hypot(dx, dy) || 1;
    await cap.press(s.x - s.cx + (dx / dd) * 190 - s.vx * 0.1, s.y - s.cy + (dy / dd) * 190 - s.vy * 0.1);
  }
  const c = { ...C, step: 2, ann: 'beeline', ro: 'beeline', state: { goal: GOAL.slice(k) }, progress: prog() };
  await cap.frame(c, 1);
  if (!shotB && spottedAt >= 0 && i - spottedAt === 40) { shotB = true; await cap.still(`${OUT}${NAME}-b-beeline-spotted.png`, c); }
  if (spottedAt >= 0 && i - spottedAt > 85) break;
}
await cap.release();

// ---- C. Gary's skylight with the pilot's finger arriving 3 frames late (real time to the laser)
await cap.nav('?unlock=1&room=gary_skylight', 'abduct');
await cap.step(2);
const LAG = 3;
const queue = [];
let fx = 140, fy = 600;
await cap.press(fx, fy);
await cap.step(1);
let shotC = false;
let crossedAt = -1;
for (let i = 0; i < 60 * 40; i++) {
  // the pilot sees where the beam will be once the moves still in flight land
  const t = await cap.eval(([fx, fy]) => {
    const d = window.__nightShift.active.debug; const p = window.__nightShift.pointer; const b = d.body;
    const bx = b.beamX, by = b.beamY;
    b.beamX = bx + (fx - p.x); b.beamY = by + (fy - p.y);
    let it; try { it = d.autopilot(); } finally { b.beamX = bx; b.beamY = by; }
    return { dx: it.dx, dy: it.dy, idx: d.pilot.index, x: b.chestX, t: d.elapsed, committed: d.pilot.committed };
  }, [fx, fy]);
  fx += t.dx; fy += t.dy;
  if (fx > 480 || fx < 40 || fy < 180 || fy > 880) {
    // re-grip: land the moves still in flight, lift, press again at the anchor next frame
    await cap.move(fx, fy); queue.length = 0;
    await cap.release(); await cap.step(1);
    fx = 140; fy = 600; await cap.press(fx, fy);
    for (let q = 0; q < LAG; q++) queue.push([fx, fy]);
  } else {
    queue.push([fx, fy]);
    if (queue.length > LAG) { const [mx, my] = queue.shift(); await cap.move(mx, my); }
  }
  if (t.idx >= 3 && crossedAt < 0) crossedAt = i;
  // Gary's laser: period 6.4 s, off for its first 3.35 s, phase 0.4. 3x while the pilot walks
  // up and waits; real time for the charge-up, the firing and the crossing.
  const p = (t.t + 0.4) % 6.4;
  const fast = !(t.committed || (p >= 2.85 && p < 3.75) || crossedAt >= 0);
  const c = { ...C, step: 3, ann: ['route', 'timers', 'body'], ro: 'lag', state: { lag: LAG }, badge: fast ? '3× time-lapse' : null, progress: prog() };
  if (!fast || i % 3 === 2) await cap.frame(c, 1); else await cap.fastStep(1);
  if (!shotC && t.idx === 2 && !t.committed && p >= 3.45 && p < 4) {
    const waiting = await cap.eval(() => { const d = window.__nightShift.active.debug; return !d.pilot.committed; });
    if (waiting) { shotC = true; await cap.still(`${OUT}${NAME}-c-pilot-waits.png`, c); }
  }
  if (crossedAt >= 0 && i - crossedAt > 120) break;
}
await cap.release();

// ---- D. the abduction beeline: drag straight for the skylight at 9 px a frame (it bonks Gary awake)
await cap.nav('?unlock=1&room=gary_skylight', 'abduct');
await cap.step(2);
fx = 270; fy = 700;
await cap.press(fx, fy);
await cap.step(1);
let failAt = -1;
let regrip = false;
for (let i = 0; i < 60 * 12; i++) {
  const s = await abductInfo(cap);
  if (s.scene !== 'abduct') break;
  if (s.failure && failAt < 0) failAt = i;
  if (!s.failure) {
    if (regrip) { regrip = false; fx = 270; fy = 700; await cap.press(fx, fy); }
    else {
      const ex = await cap.eval(() => { const d = window.__nightShift.active.debug; return [d.exitX, d.exitY]; });
      const dx = ex[0] - s.bx, dy = ex[1] - s.by, dd = Math.hypot(dx, dy);
      const sc = 1 / Math.max(1, dd / 9);
      fx += dx * sc; fy += dy * sc;
      if (fy < 180 || fx < 40 || fx > 500) { await cap.release(); regrip = true; }
      else await cap.move(fx, fy);
    }
  }
  const c = { ...C, step: 3, ann: ['timers', 'body'], ro: 'abduct', state: { sleepers: false }, note: 'Beeline: drag straight at the exit, 9 px a frame.', progress: prog() };
  await cap.frame(c, 1);
  if (failAt >= 0 && i - failAt === 30) await cap.still(`${OUT}${NAME}-d-beeline-fails.png`, c);
  if (failAt >= 0 && i - failAt > 100) break;
}
await cap.release();

// ---- E. the numbers from the headless proofs
const lines = [
  pick(/\[autopilot level3 no-dash\]/).replace(/ · legs.*· spotted/, ' · spotted').replace(/ · bumps.*/, '').replace('[autopilot level3 no-dash]', 'L3 flight autopilot:'),
  pick(/\[beeline level3 \+0s\]/).replace(/.*first spot:/, 'L3 beeline: first spot:'),
  pick(/\[abduction gary_skylight\]/).replace('[abduction gary_skylight]', 'gary_skylight x4:').replace(/ \(\d+ bonks\)/g, ''),
  pick(/\[abduction mouse latency gary_skylight\]/).replace('[abduction mouse latency gary_skylight]', '1–3 frames late:'),
  pick(/\[abduction beeline\]/).replace(/failures: ([^·]*)·\s*blocked: (.*)/, (m, a, b) => `beeline: ${a.split(',').length} fail, ${b.split(',').length} stuck`).replace('[abduction beeline] ', ''),
].filter(Boolean);
for (let i = 0; i < 60 * 6; i++) {
  await cap.frame({ ...C, step: 4, ann: [], ro: 'proofs', state: { lines }, progress: prog() }, 1);
  if (i === 120) await cap.still(`${OUT}${NAME}-e-proofs.png`, { ...C, step: 4, ann: [], ro: 'proofs', state: { lines } });
}
await cap.close();
console.log(JSON.stringify({ frames: cap.frames, lines }));
