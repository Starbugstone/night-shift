import { Capture } from './lib.mjs';
const path = process.argv[2] || '?unlock=1&flight=3';
const cap = await Capture.open(path, { out: null });
const info = await cap.eval(() => {
  const ns = window.__nightShift; const d = ns.active && ns.active.debug;
  const out = { scene: ns.scene, vt: window.__vt.frames, run: ns.run ? { elapsed: ns.run.elapsed, clock: ns.run.clockText() } : null };
  if (d && d.sim && d.sim.field) {
    const f = d.sim.field;
    out.defs = f.defs.map((h, i) => [i, h.type, Math.round(f.x[i]), Math.round(f.y[i]), h.name || h.kind || h.role || h.text || '', h.r || h.range || h.coneRange || h.spotR || h.len || ''].join(' '));
    out.rings = d.sim.rings.map(r => [r.x, r.y]); out.map = { w: d.sim.map.w, h: d.sim.map.h, start: d.sim.map.start };
    out.t = d.sim.t; out.state = d.state;
  }
  if (d && d.room) { out.room = { human: d.room.human, bounds: d.interior && d.interior.building.bounds, hazards: d.interior && d.interior.hazards.map(h => h.spec.kind + ':' + h.spec.name), sleepers: d.interior && d.interior.sleepers.map(s => s.spec.name + ' r' + s.spec.radius + ' @' + Math.round(s.x) + ',' + Math.round(s.y)), cps: d.room.interior && d.room.interior.checkpoints.length }; out.elapsed = d.elapsed; }
  return out;
});
console.log(JSON.stringify(info, null, 0).replace(/","/g, '",\n"'));
await cap.close();
