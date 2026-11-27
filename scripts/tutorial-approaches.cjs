// World-space flight approaches for the four tutorial routes: fly through `via`, then hover on the
// ring. Shared by scripts/e2e-playthrough.cjs and .claude/skills/verify-night-shift/scripts/verify.mjs.
// Last proven in the browser on 2026-11-27 (all four delivered, e2e-playthrough ONLY=tutorial).
module.exports = [
  { room: 'farm_chimney', level: 1, ring: 1, via: [{ x: 150, y: 1500 }, { x: 150, y: 450 }], name: 'L1-chimney' },
  { room: 'farm_window', level: 1, ring: 0, via: [{ x: 150, y: 1400 }, { x: 150, y: 590 }], name: 'L1-window' },
  { room: 'laundry_skylight', level: 2, ring: 0, via: [{ x: 300, y: 1400 }, { x: 300, y: 785 }, { x: 640, y: 785 }], name: 'L2-skylight' },
  { room: 'laundry_loading', level: 2, ring: 1, via: [{ x: 300, y: 1500 }, { x: 300, y: 785 }, { x: 640, y: 785 }, { x: 640, y: 330 }], name: 'L2-loading' },
];
