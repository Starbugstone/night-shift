// flight/time_car_display (320×200): the time car, three-quarter front-left, driver's gull-wing raised.
// The car is a small 3D model (cm; x = across, left negative; y = nose to tail; z = up) projected through
// one perspective camera, so the wedge, the wheel positions and the swung door are in true perspective.
// The plan view (time-car-top.mjs) reads the same dimensions from CAR.
import { INK, d2, el, path, r1, rad, rng, write } from './lib.mjs';

/** Dimensions shared with the plan view (cm). */
export const CAR = {
  length: 427,
  half: 93,
  frontAxle: 104,
  rearAxle: 345,
  frontR: 30,
  rearR: 33,
  cowl: 140,
  screenTop: 208,
  roofRear: 284,
  louvreEnd: 388,
  hinge: { x: -14, z: 113.5 },
};

const STEEL = { hi: '#f1f4f3', light: '#d4d9d9', mid: '#a7b0b5', cool: '#87949b', deep: '#66727c', shade: '#4d5863' };
const RUBBER = '#303440';
const BLACK = '#1f212b';

function camera({ az, elev, dist, target, scale, cx, cy }) {
  const a = rad(az);
  const e = rad(elev);
  const dir = [-Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e)];
  const C = [target[0] + dir[0] * dist, target[1] + dir[1] * dist, target[2] + dir[2] * dist];
  const f = [-dir[0], -dir[1], -dir[2]];
  const r = [-Math.cos(a), Math.sin(a), 0];
  // up = perpendicular to f and r, pointing up
  let u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  if (u[2] < 0) u = [-u[0], -u[1], -u[2]];
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const depth = (p) => (p[0] - C[0]) * f[0] + (p[1] - C[1]) * f[1] + (p[2] - C[2]) * f[2];
  const P = (p) => {
    const v = [p[0] - C[0], p[1] - C[1], p[2] - C[2]];
    const d = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
    const k = (scale * dist) / d;
    const x = cx + (v[0] * r[0] + v[1] * r[1]) * k;
    const y = cy - (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) * k;
    box.x0 = Math.min(box.x0, x);
    box.x1 = Math.max(box.x1, x);
    box.y0 = Math.min(box.y0, y);
    box.y1 = Math.max(box.y1, y);
    return [x, y];
  };
  return { P, depth, box, dir };
}

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
const centroid = (pts) => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);

/** Piecewise-linear lookup. */
function along(table, y) {
  for (let i = 1; i < table.length; i++) {
    if (y <= table[i][0]) {
      const [y0, v0] = table[i - 1];
      const [y1, v1] = table[i];
      return lerp(v0, v1, (y - y0) / (y1 - y0));
    }
  }
  return table[table.length - 1][1];
}

// Body lines of the left flank, by station along the car.
const HALF = [[0, 80], [8, 87], [40, 91.5], [104, 93], [400, 93], [427, 90]];
const SHOULDER_Z = [[0, 54], [6, 55], [140, 79.5], [286, 83], [405, 88.5], [427, 87]];
const RUB_Z = [[0, 47], [140, 56], [427, 59]];
const flank = (y) => along(HALF, y);
const shoulder = (y) => [-(flank(y) - 5), y, along(SHOULDER_Z, y)];
const rub = (y) => [-flank(y), y, along(RUB_Z, y)];
const sillTop = (y) => [-(flank(y) - 1), y, 30];
const sillBottom = (y) => [-(flank(y) - 3), y, 17];
const line = (fn, y0, y1, n = 6) => Array.from({ length: n + 1 }, (_, i) => fn(lerp(y0, y1, i / n)));

function swing(p, th) {
  const dx = p[0] - CAR.hinge.x;
  const dz = p[2] - CAR.hinge.z;
  const c = Math.cos(th);
  const s = Math.sin(th);
  return [CAR.hinge.x + dx * c + dz * s, p[1], CAR.hinge.z - dx * s + dz * c];
}

function build(view) {
  const cam = camera(view);
  const { P } = cam;
  const defs = [];
  const under = [];
  const over = [];
  let ids = 0;
  const D = (pts, closed = true) => d2(pts.map(P), closed);

  function grad(from, to, stops) {
    const id = `g${ids++}`;
    const a = P(from);
    const b = P(to);
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}">${stops
        .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op === undefined ? '' : ` stop-opacity="${op}"`}/>`)
        .join('')}</linearGradient>`,
    );
    return `url(#${id})`;
  }
  function clip(pts) {
    const id = `c${ids++}`;
    defs.push(`<clipPath id="${id}"><path d="${D(pts)}"/></clipPath>`);
    return `url(#${id})`;
  }
  /** A filled panel; `sil` also adds it to the ink silhouette under everything. */
  function panel(pts, fill, { stroke = INK, sw = 0.9, sil = false, opacity, extra = {} } = {}) {
    const d = D(pts);
    if (sil) under.push(d);
    over.push(path(d, { fill, stroke: stroke || undefined, 'stroke-width': stroke ? sw : undefined, opacity, ...extra }));
  }
  function stroke3(pts, color, sw, { opacity, closed = false, dash } = {}) {
    over.push(path(D(pts, closed), { fill: 'none', stroke: color, 'stroke-width': sw, opacity, 'stroke-dasharray': dash }));
  }
  /** Fine brush grain across a quad: lines run from edge q0→q3 to edge q1→q2. */
  const rand = rng(1955);
  function brush(q, n, { color = '#ffffff', opacity = 0.22, sw = 0.3, inset = 0.03 } = {}) {
    let d = '';
    for (let i = 1; i < n; i++) {
      const t = (i + (rand() - 0.5) * 0.6) / n;
      const a0 = mix(q[0], q[3], t);
      const b0 = mix(q[1], q[2], t);
      const s = inset + rand() * 0.25;
      const e = 1 - inset - rand() * 0.25;
      const a = P(mix(a0, b0, s));
      const b = P(mix(a0, b0, e));
      d += `M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}`;
    }
    over.push(path(d, { fill: 'none', stroke: color, 'stroke-width': sw, opacity }));
  }
  /** A circle in the plane x = const (wheels), as a polygon. */
  const ring = (x, yc, zc, r, n = 40, a0 = 0, a1 = Math.PI * 2) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = lerp(a0, a1, i / n);
      return [x, yc + Math.cos(a) * r, zc + Math.sin(a) * r];
    });
  /** A circle in a horizontal plane. */
  const disc = (xc, yc, z, r, n = 28) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [xc + Math.cos(a) * r, yc + Math.sin(a) * r, z];
    });

  defs.push('<filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter>');
  // ------------------------------------------------------------------ ground shadow
  {
    const foot = [
      [-104, -6, 0], [0, -14, 0], [104, -6, 0], [110, 200, 0], [104, 440, 0], [0, 446, 0], [-104, 440, 0], [-112, 200, 0],
    ];
    defs.push('<filter id="soft" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter>');
    over.push(path(D(foot), { fill: '#0b0a18', opacity: 0.5, filter: 'url(#soft)' }));
    const core = [[-88, 10, 0], [88, 10, 0], [90, 420, 0], [-90, 420, 0]];
    over.push(path(D(core), { fill: '#0b0a18', opacity: 0.6, filter: 'url(#soft1)' }));
    defs.push('<filter id="soft1" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>');
  }

  // ------------------------------------------------------------------ wheels
  function wheel(yc, r, x, near) {
    const zc = r;
    const tread = 22;
    const back = ring(x + tread, yc, zc, r);
    const face = ring(x, yc, zc, r);
    // the tyre as a drum: the hull of both rims, shaded from the lit shoulder into the well
    const dh = d2(hull2([...back, ...face].map(P)));
    if (near) under.push(dh);
    over.push(path(dh, { fill: near ? grad([x, yc - r, zc], [x + tread, yc - r * 0.2, zc], [[0, '#4a4d59'], [0.5, '#2b2c36'], [1, '#14141c']]) : '#14141c', stroke: INK, 'stroke-width': 0.8 }));
    if (!near) return;
    // tread grooves across the band, on the side that faces the nose
    let grooves = '';
    for (let i = 0; i < 9; i++) {
      const A = Math.PI * (0.8 + i * 0.075);
      grooves += D([[x + 2, yc + Math.cos(A) * r, zc + Math.sin(A) * r], [x + tread - 2, yc + Math.cos(A) * r, zc + Math.sin(A) * r]], false);
    }
    over.push(path(grooves, { fill: 'none', stroke: '#0d0d14', 'stroke-width': 0.7, opacity: 0.85 }));
    panel(face, grad([x, yc - r, zc + r], [x, yc + r, zc - r], [[0, '#4a4c58'], [0.45, '#2b2c36'], [1, '#17171f']]), { sil: true, sw: 1.1 });
    // sidewall: a lighter shoulder ring and a soft lower shade
    stroke3(ring(x, yc, zc, r * 0.9, 30, Math.PI * 0.62, Math.PI * 1.2), '#6d7080', 0.9, { opacity: 0.75 });
    stroke3(ring(x, yc, zc, r * 0.8, 40), '#111118', 0.7, { opacity: 0.7 });
    // rim lip
    const lip = ring(x, yc, zc, r * 0.68);
    panel(lip, grad([x, yc - r, zc + r], [x, yc + r, zc - r], [[0, '#f1f4f3'], [0.5, '#aeb7bb'], [1, '#6c7780']]), { sw: 0.8 });
    // dished centre: the cast alloy, darker toward the top where the lip shades it
    const dish = ring(x + 1.5, yc, zc, r * 0.6);
    panel(dish, grad([x, yc, zc + r * 0.6], [x, yc, zc - r * 0.6], [[0, '#69747d'], [0.35, '#98a3a9'], [1, '#c3cbce']]), { sw: 0.6 });
    // turbine slots: narrow radial windows between flat spokes
    const slots = 12;
    let d = '';
    for (let i = 0; i < slots; i++) {
      const a = (i / slots) * Math.PI * 2 + 0.2;
      const w0 = 0.085;
      const w1 = 0.15;
      const q = [
        [x + 1.5, yc + Math.cos(a - w0) * r * 0.27, zc + Math.sin(a - w0) * r * 0.27],
        [x + 1.5, yc + Math.cos(a - w1) * r * 0.53, zc + Math.sin(a - w1) * r * 0.53],
        [x + 1.5, yc + Math.cos(a + w1) * r * 0.53, zc + Math.sin(a + w1) * r * 0.53],
        [x + 1.5, yc + Math.cos(a + w0) * r * 0.27, zc + Math.sin(a + w0) * r * 0.27],
      ];
      d += D(q);
    }
    over.push(path(d, { fill: '#2a2f3a', stroke: '#1d2029', 'stroke-width': 0.35 }));
    // hub cap
    panel(ring(x, yc, zc, r * 0.2, 20), '#3a404c', { sw: 0.6 });
    panel(ring(x - 0.5, yc, zc, r * 0.1, 14), '#aeb7bb', { stroke: null });
    // specular glint on the lip
    stroke3(ring(x, yc, zc, r * 0.66, 12, Math.PI * 0.6, Math.PI * 0.95), '#ffffff', 0.8, { opacity: 0.85 });
  }
  // far-side tyres that show under the nose and the tail
  wheel(CAR.frontAxle, CAR.frontR, 70, false);
  wheel(CAR.rearAxle, CAR.rearR, 68, false);

  // ------------------------------------------------------------------ underbody and far flank
  panel([[-88, 6, 19], [88, 6, 19], [90, 424, 19], [-90, 424, 19]], '#11111a', { sil: true, stroke: null });

  // ------------------------------------------------------------------ interior (seen through the open door)
  const ap = [
    [-89, 150, 31], [-91, 147, 56], [-87, 144, 80], [-58, 206, 112], [-14, 208, 113.5], [-14, 283, 113.5], [-58, 284, 112], [-88, 286, 83], [-89, 284, 31],
  ];
  {
    under.push(D(ap));
    const cp = clip(ap);
    const inside = [];
    const push = (pts, fill, a = {}) => inside.push(path(D(pts), { fill, stroke: INK, 'stroke-width': 0.7, ...a }));
    // cabin shell
    inside.push(path(D(ap), { fill: '#141620' }));
    // floor and far door card
    push([[-89, 150, 30], [86, 150, 30], [86, 284, 30], [-89, 284, 30]], '#1b1d28', { stroke: 'none' });
    push([[86, 148, 30], [86, 284, 30], [88, 286, 83], [87, 144, 80]], '#272b38');
    // far window from inside: a slab of storm light
    push([[87, 144, 80], [88, 286, 83], [58, 284, 112], [58, 206, 112]], grad([87, 215, 80], [58, 215, 112], [[0, '#3b4a61'], [1, '#27344a']]), { stroke: '#10121a' });
    // rear bulkhead with the capacitor: three tubes meeting in a hub
    push([[-86, 283, 34], [86, 283, 34], [86, 283, 110], [-86, 283, 110]], '#20232e');
    push([[-6, 282, 66], [30, 282, 66], [30, 282, 104], [-6, 282, 104]], '#3b4250');
    const hub = [12, 281, 82];
    const tubes = [[12, 281, 68], [-1, 281, 99], [25, 281, 99]];
    inside.push(path(tubes.map((t) => D([hub, t], false)).join(''), { fill: 'none', stroke: '#ffe9a8', 'stroke-width': 3.2, opacity: 0.55, filter: 'url(#glow)' }));
    inside.push(path(tubes.map((t) => D([hub, t], false)).join(''), { fill: 'none', stroke: '#fff6d8', 'stroke-width': 1.3 }));
    // dash, binnacle and the time-circuit stack (red, green, amber)
    push([[-84, 148, 62], [84, 148, 62], [84, 172, 62], [-84, 172, 62]], '#1d2029', { stroke: 'none' });
    push([[-84, 172, 40], [84, 172, 40], [84, 172, 80], [-84, 172, 80]], '#2a2e3b');
    push([[-84, 146, 80], [84, 146, 80], [84, 172, 80], [-84, 172, 80]], '#343947');
    push([[-70, 170, 80], [-28, 170, 80], [-30, 176, 90], [-68, 176, 90]], '#262a36');
    // centre tunnel and console
    push([[-13, 172, 30], [13, 172, 30], [13, 283, 30], [13, 283, 54], [13, 172, 58], [-13, 172, 58]], '#262a36', { stroke: 'none' });
    push([[-13, 172, 58], [13, 172, 58], [13, 283, 54], [-13, 283, 54]], '#3a4050');
    push([[-13, 172, 30], [-13, 172, 58], [-13, 283, 54], [-13, 283, 30]], '#2b2f3c');
    // the stack sits on the tunnel against the dash, its faces turned to the driver
    push([[-13, 174, 58], [-13, 200, 58], [-13, 200, 80], [-13, 174, 80]], '#171922');
    const bars = [['#ff635f', 75], ['#7cf59a', 69], ['#ffc36a', 63]];
    inside.push(path(bars.map(([, z]) => D([[-13.5, 178, z], [-13.5, 196, z]], false)).join(''), { fill: 'none', stroke: '#fff', 'stroke-width': 3.4, opacity: 0.35, filter: 'url(#glow)' }));
    for (const [c, z] of bars) inside.push(path(D([[-13.5, 178, z], [-13.5, 196, z]], false), { fill: 'none', stroke: c, 'stroke-width': 1.5 }));
    // passenger seat (far)
    push([[24, 204, 44], [66, 204, 44], [66, 258, 42], [24, 258, 42]], '#5a6170');
    push([[24, 252, 44], [66, 252, 44], [66, 276, 104], [24, 276, 104]], grad([45, 252, 44], [45, 276, 104], [[0, '#4b5261'], [1, '#69707f']]));
    // driver's seat: cushion, bolster and the backrest face
    const seatFill = grad([-44, 250, 44], [-44, 276, 106], [[0, '#565d6c'], [0.6, '#737a88'], [1, '#8a909c']]);
    push([[-68, 204, 32], [-68, 258, 32], [-68, 258, 44], [-68, 204, 45]], '#3d4350');
    push([[-68, 204, 45], [-22, 204, 45], [-22, 258, 43], [-68, 258, 43]], '#69707e');
    push([[-68, 204, 32], [-22, 204, 32], [-22, 204, 45], [-68, 204, 45]], '#4b5260');
    push([[-68, 250, 44], [-68, 276, 106], [-68, 288, 104], [-68, 262, 40]], '#3d4350');
    push([[-68, 250, 44], [-22, 250, 44], [-22, 276, 106], [-68, 276, 106]], seatFill);
    for (const t of [0.22, 0.4, 0.58]) {
      inside.push(path(D([mix([-64, 250, 44], [-64, 276, 106], t), mix([-26, 250, 44], [-26, 276, 106], t)], false), { fill: 'none', stroke: '#3d4350', 'stroke-width': 0.9 }));
    }
    inside.push(path(D([[-62, 268, 88], [-28, 268, 88], [-28, 275, 103], [-62, 275, 103]]), { fill: '#8d94a1', stroke: '#3d4350', 'stroke-width': 0.6 }));
    for (const t of [0.3, 0.6]) inside.push(path(D([mix([-64, 206, 45], [-64, 256, 43], t), mix([-26, 206, 45], [-26, 256, 43], t)], false), { fill: 'none', stroke: '#4b5260', 'stroke-width': 0.8 }));
    // steering wheel
    const sw = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [-46 + Math.cos(a) * 17, 186 - Math.sin(a) * 6, 76 + Math.sin(a) * 16];
    });
    inside.push(path(D(sw), { fill: 'none', stroke: INK, 'stroke-width': 3.2 }));
    inside.push(path(D(sw), { fill: 'none', stroke: '#6a7182', 'stroke-width': 1.7 }));
    inside.push(path(D([[-46, 186, 76], [-46, 176, 72]], false), { fill: 'none', stroke: '#2a2e3b', 'stroke-width': 2.2 }));
    // warm light of the circuits on the cabin
    defs.push('<radialGradient id="cabin" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd9a0" stop-opacity="0.34"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>');
    const gc = P([-30, 205, 62]);
    inside.push(el('ellipse', { cx: r1(gc[0]), cy: r1(gc[1]), rx: 34, ry: 22, fill: 'url(#cabin)' }));
    over.push(el('g', { 'clip-path': cp }, inside.join('')));
  }

  // ------------------------------------------------------------------ left flank
  const Y_DOOR0 = 147;
  const Y_DOOR1 = 285;
  const upperFill = (y0, y1) => grad(shoulder((y0 + y1) / 2), rub((y0 + y1) / 2), [[0, '#dfe4e4'], [0.18, '#c2cacd'], [1, '#98a3a9']]);
  const lowerFill = (y0, y1) => grad(rub((y0 + y1) / 2), sillTop((y0 + y1) / 2), [[0, '#8c989f'], [0.55, '#7b8790'], [1, '#56616c']]);
  function flankBand(y0, y1, n) {
    const top = line(shoulder, y0, y1, n);
    const mid = line(rub, y0, y1, n);
    const low = line(sillTop, y0, y1, n);
    panel([...top, ...mid.slice().reverse()], upperFill(y0, y1), { sil: true });
    panel([...mid, ...low.slice().reverse()], lowerFill(y0, y1), { sil: true });
    brush([top[0], top[top.length - 1], mid[mid.length - 1], mid[0]], 9, { opacity: 0.3 });
    brush([mid[0], mid[mid.length - 1], low[low.length - 1], low[0]], 8, { color: '#dfe6e8', opacity: 0.2 });
  }
  // sill: black lower body, full length
  {
    const top = line(sillTop, 6, 424, 12);
    const bot = line(sillBottom, 8, 422, 12);
    panel([...top, ...bot.slice().reverse()], grad(sillTop(210), sillBottom(210), [[0, '#353846'], [1, '#191a23']]), { sil: true });
  }
  // door sill step (stainless scuff plate) inside the opening
  panel([[-89, 150, 31], [-89, 284, 31], [-72, 284, 34], [-72, 152, 34]], grad([-89, 215, 31], [-72, 215, 34], [[0, '#c8cfd1'], [1, '#7f8a92']]), {});
  stroke3([[-86, 156, 31.5], [-86, 280, 31.5]], '#ffffff', 0.5, { opacity: 0.7 });
  flankBand(4, Y_DOOR0, 8);
  flankBand(Y_DOOR1, 427, 8);
  // door jambs: the cut edges of the body either side of the opening
  panel([shoulder(144), rub(147), [-89, 150, 31], [-80, 152, 31], [-82, 149, 56], [-79, 147, 79]], '#3a3f4c', {});
  panel([[-88, 286, 83], rub(285), [-89, 284, 31], [-84, 281, 31], [-87, 282, 57], [-83, 283, 83]], '#555d6a', { sw: 0.6 });

  // wheel wells, arches and the near wheels
  function arch(yc, r, wheelR) {
    const zc = wheelR - 1;
    const a0 = Math.asin((30 - zc) / r);
    const well = [...ring(-flank(yc) + 0.5, yc, zc, r, 30, Math.PI - a0, a0 - 0), [-(flank(yc) - 3), yc + r * 0.96, 17], [-(flank(yc) - 3), yc - r * 0.96, 17]];
    panel(well, '#0d0d15', { sw: 1 });
    // arch lip catching the light
    stroke3(ring(-flank(yc) - 0.2, yc, zc, r + 1.2, 24, Math.PI * 0.2, Math.PI * 0.96), '#eef2f1', 0.7, { opacity: 0.8 });
  }
  arch(CAR.rearAxle, 40, CAR.rearR);
  wheel(CAR.rearAxle, CAR.rearR, -92, true);
  arch(CAR.frontAxle, 37, CAR.frontR);
  wheel(CAR.frontAxle, CAR.frontR, -92, true);

  // rub strip: the black line along the flank, broken by the arches and the open door
  for (const [y0, y1] of [[8, CAR.frontAxle - 27], [CAR.frontAxle + 27, Y_DOOR0], [Y_DOOR1, CAR.rearAxle - 32], [CAR.rearAxle + 32, 425]]) {
    const pts = line(rub, y0, y1, 5);
    stroke3(pts, INK, 2.1);
    stroke3(pts, '#3a3d4a', 0.8);
  }
  // shoulder crease highlight
  stroke3(line(shoulder, 10, 142, 6), '#ffffff', 0.7, { opacity: 0.9 });
  stroke3(line(shoulder, 290, 420, 6), '#ffffff', 0.6, { opacity: 0.8 });
  // side marker and fuel-side seams
  stroke3([mix(shoulder(60), rub(60), 0.1), mix(shoulder(60), rub(60), 0.95)], '#5a6570', 0.4, { opacity: 0.7 });
  panel([[-91.5, 20, 49.5], [-92.5, 34, 50.5], [-92.5, 34, 46.5], [-91.5, 20, 45.5]], '#c98a52', { sw: 0.5 });
  panel([[-93.5, 398, 62.5], [-93, 416, 62.5], [-93, 416, 66.5], [-93.5, 398, 66.5]], '#b4474c', { sw: 0.5 });

  // side coil: a ribbed conduit strapped along the sill between the arches, with short tails fore and aft
  {
    const coil = (run) => {
      stroke3(run, INK, 3);
      stroke3(run, '#7f8b9b', 1.6);
      stroke3(run, '#eef3f6', 0.45, { opacity: 0.9 });
      stroke3(run, '#2c3140', 1.6, { dash: '0.4 2.2', opacity: 0.32 });
      over.push(path(D(run, false), { fill: 'none', stroke: '#90cdff', 'stroke-width': 2.6, opacity: 0.22, filter: 'url(#glow)' }));
    };
    coil([[-95, 143, 44], [-95.5, 150, 36.5], [-95.5, 215, 35.5], [-95.5, 296, 36.5], [-95, 304, 45]]);
    coil([[-88, 9, 36], [-92.5, 30, 37], [-94, 64, 38.5]]);
    coil([[-94, 388, 43], [-93, 424, 42]]);
    for (const y of [162, 192, 222, 252, 280]) panel([[-96.2, y, 39.5], [-96.2, y + 5, 39.5], [-96.2, y + 5, 32], [-96.2, y, 32]], '#4d5565', { sw: 0.5 });
  }

  // ------------------------------------------------------------------ front fascia
  {
    const fx = 76;
    const face = (x0, x1, z0, z1) => [[x0, 1, z0], [x1, 1, z0], [x1, 2.5, z1], [x0, 2.5, z1]];
    const corner = (z0, z1) => [[-fx, 1, z0], [-(flank(10) - 1), 11, z0], [-(flank(10) - 2), 12, z1], [-fx, 2.5, z1]];
    // air dam
    panel(face(-fx, fx, 17, 25), '#1c1d27', { sil: true });
    panel(corner(17, 25), '#181922', { sil: true });
    // bumper
    panel(face(-fx, fx, 25, 37.5), grad([0, 1, 37.5], [0, 1, 25], [[0, '#a2acb1'], [1, '#6f7a83']]), { sil: true });
    panel(corner(25, 37.5), grad([-80, 6, 37.5], [-80, 6, 25], [[0, '#8a959c'], [1, '#5b6670']]), { sil: true });
    stroke3([[-fx, 0.8, 31], [fx, 0.8, 31]], INK, 1.3);
    panel([[-30, 0.8, 19], [30, 0.8, 19], [30, 0.8, 23.5], [-30, 0.8, 23.5]], '#0c0c13', { sw: 0.5 });
    for (const s of [-1, 1]) panel([[s * 54, 0.6, 26.5], [s * 73, 0.6, 26.5], [s * 73, 0.6, 30], [s * 54, 0.6, 30]], s < 0 ? '#d79a5c' : '#b98352', { sw: 0.5 });
    // grille band with four rectangular headlamps
    panel(face(-fx, fx, 37.5, 50.5), '#14151d', { sil: true });
    panel(corner(37.5, 50.5), grad([-80, 6, 50.5], [-80, 6, 37.5], [[0, '#98a3a9'], [1, '#7b8790']]), { sil: true });
    panel([[-78, 2.8, 41], [-(flank(10) - 2.6), 9.6, 41], [-(flank(10) - 2.8), 9.8, 47.5], [-78, 3, 47.5]], '#d79a5c', { sw: 0.6 });
    let grille = '';
    for (const z of [40.3, 42.9, 45.5, 48.1]) grille += D([[-33, 0.7, z], [33, 0.7, z]], false);
    over.push(path(grille, { fill: 'none', stroke: '#454b5a', 'stroke-width': 0.6 }));
    for (const [x0, x1] of [[-73, -56], [-54, -37], [37, 54], [56, 73]]) {
      const q = [[x0, 0.6, 39.5], [x1, 0.6, 39.5], [x1, 0.6, 49], [x0, 0.6, 49]];
      panel(q, grad([x0, 0.6, 49], [x1, 0.6, 39.5], [[0, '#fffbe6'], [0.55, '#f0e6bd'], [1, '#b9b89f']]), { sw: 0.8 });
      stroke3([[x0 + 2.5, 0.5, 47], [x0 + 9, 0.5, 47]], '#ffffff', 0.7, { opacity: 0.95 });
    }
    // top lip of the fascia
    panel(face(-fx, fx, 50.5, 54.5), '#b3bcc0', { sil: true, sw: 0.7 });
    panel(corner(50.5, 54.5), '#8f9aa1', { sil: true, sw: 0.7 });
    // coil band across the nose
    const band = [[-(flank(10) - 0.5), 11.5, 36], [-fx, 0.4, 36], [fx, 0.4, 36]];
    stroke3(band, INK, 2.6);
    stroke3(band, '#8b97a6', 1.4);
    stroke3(band, INK, 1.4, { dash: '0.7 3.3', opacity: 0.55 });
  }

  // ------------------------------------------------------------------ bonnet and wings
  const hood = [[-78, 3, 55.5], [78, 3, 55.5], [80, 138, 79], [-80, 138, 79]];
  {
    // wing tops
    panel([shoulder(4), [-78, 3, 55.5], [-80, 138, 79], shoulder(142)], grad(shoulder(70), [-79, 70, 67], [[0, '#f4f6f5'], [1, '#c5cdd0']]), { sil: true, sw: 0.7 });
    panel([[78, 3, 55.5], [84, 5, 54.5], [84, 142, 79.5], [80, 138, 79]], '#b9c2c6', { sil: true, sw: 0.7 });
    panel(hood, grad([0, 3, 55.5], [0, 138, 79], [[0, '#e9eded'], [0.3, '#cfd5d6'], [0.62, '#aeb7bc'], [1, '#8e9aa2']]), { sil: true });
    const cp = clip(hood);
    // storm sky on the bonnet: a darker bank toward the screen and two pale breaks
    const sky = [];
    sky.push(path(D([[-80, 104, 73], [80, 92, 71], [80, 138, 79], [-80, 138, 79]]), { fill: grad([0, 92, 71], [0, 138, 79], [[0, '#4d5a72', 0], [1, '#4d5a72', 0.5]]) }));
    sky.push(path(D([[-72, 3, 55.5], [-46, 3, 55.5], [-8, 138, 79], [-40, 138, 79]]), { fill: grad([-60, 3, 55], [-20, 138, 79], [[0, '#ffffff', 0.55], [0.7, '#ffffff', 0.12], [1, '#ffffff', 0]]) }));
    sky.push(path(D([[-34, 3, 55.5], [-26, 3, 55.5], [10, 138, 79], [0, 138, 79]]), { fill: grad([-30, 3, 55], [6, 138, 79], [[0, '#ffffff', 0.4], [0.7, '#ffffff', 0.08], [1, '#ffffff', 0]]) }));
    sky.push(path(D([[30, 3, 55.5], [80, 3, 55.5], [80, 70, 67]]), { fill: '#6d7a8f', opacity: 0.22 }));
    over.push(el('g', { 'clip-path': cp }, sky.join('')));
    brush([hood[0], hood[3], hood[2], hood[1]], 30, { opacity: 0.3, sw: 0.28 });
    brush([hood[0], hood[3], hood[2], hood[1]], 14, { color: '#566068', opacity: 0.22, sw: 0.28 });
    // two bonnet grooves
    for (const x of [-27, 27]) {
      stroke3([[x, 14, 57.5], [x + (x < 0 ? -1 : 1), 128, 77.2]], '#5c6770', 0.9);
      stroke3([[x + 1.4, 14, 57.5], [x + (x < 0 ? -1 : 1) + 1.4, 128, 77.2]], '#f4f7f6', 0.45, { opacity: 0.9 });
    }
    // leading edge and wing crease highlights
    stroke3([[-76, 3.4, 55.6], [76, 3.4, 55.6]], '#ffffff', 0.8, { opacity: 0.9 });
    stroke3([[-78.5, 8, 56.4], [-80.5, 134, 78.4]], '#667079', 0.5);
    // cowl: black vent panel and wipers
    panel([[-82, 138, 79], [82, 138, 79], [82, 147, 80.5], [-82, 147, 80.5]], '#1a1b24', { sil: true, sw: 0.8 });
    stroke3([[-60, 143, 80.5], [-6, 141, 80.5]], '#454b5a', 0.8);
    stroke3([[4, 143, 80.5], [58, 141, 80.5]], '#454b5a', 0.8);
  }

  // ------------------------------------------------------------------ glasshouse
  const ws = [[-80, 147, 80.5], [80, 147, 80.5], [56, 208, 112.5], [-56, 208, 112.5]];
  {
    panel(ws, grad([0, 147, 80.5], [0, 208, 112.5], [[0, '#131b27'], [0.5, '#25334a'], [1, '#42536e']]), { sil: true, sw: 1.2 });
    const cp = clip(ws);
    const inner = [];
    // dash top and the wheel rim seen through the glass
    inner.push(path(D([[-78, 150, 80.6], [78, 150, 80.6], [70, 168, 82], [-70, 168, 82]]), { fill: '#0e131c', opacity: 0.75 }));
    inner.push(path(D([[-62, 176, 90], [-46, 178, 95], [-30, 176, 90]], false), { fill: 'none', stroke: '#566175', 'stroke-width': 1.5, opacity: 0.8 }));
    inner.push(path(D([[-7, 160, 83], [7, 160, 83], [7, 166, 91], [-7, 166, 91]]), { fill: '#0c0f17' }));
    for (const [c, z, y] of [['#ff635f', 89.4, 164.8], ['#7cf59a', 87, 163], ['#ffc36a', 84.6, 161.2]]) {
      inner.push(path(D([[-5, y, z], [5, y, z]], false), { fill: 'none', stroke: c, 'stroke-width': 1 }));
    }
    // reflections: the bright storm break and two streaks
    inner.push(path(D([[-80, 147, 80.5], [-56, 208, 112.5], [-18, 208, 112.5], [-48, 147, 80.5]]), { fill: '#9fb4d3', opacity: 0.2 }));
    inner.push(path(D([[10, 147, 80.5], [26, 147, 80.5], [44, 208, 112.5], [32, 208, 112.5]]), { fill: '#cfe0f5', opacity: 0.16 }));
    inner.push(path(D([[34, 147, 80.5], [40, 147, 80.5], [54, 208, 112.5], [50, 208, 112.5]]), { fill: '#cfe0f5', opacity: 0.12 }));
    inner.push(path(D([[-56, 208, 112.5], [56, 208, 112.5], [60, 198, 107.3], [-60, 198, 107.3]]), { fill: '#7f93b3', opacity: 0.35 }));
    over.push(el('g', { 'clip-path': cp }, inner.join('')));
    stroke3(ws, '#0c0d14', 1.1, { closed: true, opacity: 0.9 });
    // A-pillars
    panel([[-80, 147, 80.5], [-87, 144, 80], [-58, 206, 112], [-56, 208, 112.5]], '#2a2d39', { sil: true, sw: 0.8 });
    panel([[80, 147, 80.5], [86, 145, 80], [58, 206, 112], [56, 208, 112.5]], '#1c1e27', { sil: true, sw: 0.8 });
  }

  // door mirror on the far side
  panel([[86, 150, 82], [97, 152, 83], [97, 160, 90], [86, 158, 89]], '#1f212b', { sil: true, sw: 0.8 });

  // roof: header, the closed passenger door top, the centre spine and the rear hoop
  const roofFill = grad([0, 208, 113], [0, 296, 114], [[0, '#eef1f0'], [0.5, '#c6cdd0'], [1, '#a2acb2']]);
  panel([[14, 208, 113.5], [56, 208, 112.5], [58, 284, 112.5], [14, 284, 114]], grad([14, 245, 114], [58, 245, 112], [[0, '#cfd6d8'], [1, '#98a3aa']]), { sil: true, sw: 0.8 });
  brush([[14, 208, 113.5], [14, 284, 114], [58, 284, 112.5], [56, 208, 112.5]], 9, { opacity: 0.3 });
  panel([[-58, 284, 112.5], [58, 284, 112.5], [56, 297, 110.5], [-56, 297, 110.5]], roofFill, { sil: true, sw: 0.8 });
  panel([[-14, 208, 113.8], [14, 208, 113.8], [14, 284, 114.2], [-14, 284, 114.2]], roofFill, { sil: true, sw: 0.9 });
  brush([[-14, 208, 113.8], [-14, 284, 114.2], [14, 284, 114.2], [14, 208, 113.8]], 7, { opacity: 0.35 });
  stroke3([[-13, 210, 114], [-13, 282, 114.3]], '#ffffff', 0.7, { opacity: 0.9 });
  // hinge knuckles on the spine
  for (const y of [222, 268]) panel([[-15, y, 114.5], [-9, y, 114.5], [-9, y + 9, 114.5], [-15, y + 9, 114.5]], '#454b59', { sw: 0.6 });
  // roof conduit and junction box
  panel([[-5, 236, 114.5], [7, 236, 114.5], [7, 258, 114.5], [-5, 258, 114.5]], '#2d313d', { sw: 0.7 });
  panel([[-5, 236, 119], [7, 236, 119], [7, 258, 119], [-5, 258, 119]], '#4b5262', { sw: 0.7 });
  panel([[-5, 236, 114.5], [7, 236, 114.5], [7, 236, 119], [-5, 236, 119]], '#394050', { sw: 0.6 });
  panel([[-5, 236, 114.5], [-5, 258, 114.5], [-5, 258, 119], [-5, 236, 119]], '#2d313d', { sw: 0.6 });

  // ------------------------------------------------------------------ rear: louvres, buttresses, deck
  {
    // far buttress (its inner face) and the engine bay between
    panel([[52, 297, 110.5], [58, 297, 110.5], [86, 405, 89], [78, 405, 88.5]], '#aeb7bc', { sil: true, sw: 0.7 });
    panel([[52, 297, 110.5], [78, 405, 88.5], [78, 405, 84], [52, 297, 104]], '#5d6873', { sw: 0.6 });
    const bay = [[-52, 297, 108], [52, 297, 108], [62, 390, 88], [-62, 390, 88]];
    panel(bay, '#0f1017', { sil: true, sw: 0.8 });
    // black louvres: slats that step down the slope, each with a lit top edge
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 0.74) / n;
      const a = mix(bay[0], bay[3], t0);
      const b = mix(bay[1], bay[2], t0);
      const c = mix(bay[1], bay[2], t1);
      const dd = mix(bay[0], bay[3], t1);
      const lift = 3.4;
      const q = [[a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], c, dd];
      panel(q, grad(q[0], q[3], [[0, '#4a4f5e'], [0.35, '#30333f'], [1, '#1d1f29']]), { sw: 0.6 });
      stroke3([q[0], q[1]], '#8e97a8', 0.55, { opacity: 0.9 });
    }
    // deck plate
    panel([[-62, 390, 88.5], [62, 390, 88.5], [84, 405, 88.5], [86, 426, 87], [-86, 426, 87], [-84, 405, 88.5]], grad([0, 390, 88], [0, 426, 88], [[0, '#3a3f4c'], [1, '#262933']]), { sil: true, sw: 0.8 });

    // machinery, far to near
    const box = (x0, x1, y0, y1, z0, zf, zr, tone) => {
      // top slopes from zf at the front to zr at the rear
      const top = [[x0, y0, zf], [x1, y0, zf], [x1, y1, zr], [x0, y1, zr]];
      panel([[x0, y0, z0], [x1, y0, z0], [x1, y0, zf], [x0, y0, zf]], tone[1], { sil: true, sw: 0.8 });
      panel([[x0, y0, z0], [x0, y1, z0], [x0, y1, zr], [x0, y0, zf]], tone[2], { sil: true, sw: 0.8 });
      panel(top, tone[0], { sil: true, sw: 0.8 });
      return top;
    };
    const vent = (x0, x1) => {
      const top = box(x0, x1, 384, 432, 88.5, 110, 122, ['#3d4250', '#2a2d38', '#1e2029']);
      // fins across the top and down the front
      let fins = '';
      for (let i = 1; i < 8; i++) fins += D([mix(top[0], top[3], i / 8), mix(top[1], top[2], i / 8)], false);
      over.push(path(fins, { fill: 'none', stroke: '#0f1017', 'stroke-width': 1.5 }));
      over.push(path(fins, { fill: 'none', stroke: '#7d8798', 'stroke-width': 0.45, transform: 'translate(0 -0.8)' }));
      let front = '';
      for (const z of [93, 98, 103]) front += D([[x0 + 3, 383.6, z], [x1 - 3, 383.6, z]], false);
      over.push(path(front, { fill: 'none', stroke: '#596274', 'stroke-width': 0.7 }));
      stroke3([top[0], top[1]], '#aeb7c6', 0.6, { opacity: 0.9 });
    };
    vent(20, 66);
    // lightning pole with its hook, braced to the deck
    {
      const pole = [[2, 426, 90], [2, 430, 150], [2, 432, 186]];
      const hook = [[2, 432, 186], [2, 430, 195], [2, 420, 199], [2, 411, 194], [2, 410, 187]];
      stroke3([[2, 404, 92], [2, 429, 128]], INK, 2.6);
      stroke3([[2, 404, 92], [2, 429, 128]], '#7d8794', 1.2);
      stroke3([...pole, ...hook.slice(1)], INK, 6.2);
      stroke3([...pole, ...hook.slice(1)], '#c9cfd2', 1.9);
      stroke3([...pole], '#ffffff', 0.5, { opacity: 0.8 });
    }
    // reactor: a drum with a pale lid
    {
      const r = 15;
      const base = disc(0, 402, 89, r);
      const lid = disc(0, 402, 114, r);
      // side of the drum: silhouette hull between the two discs
      const b2 = base.map(P);
      const l2 = lid.map(P);
      let left = 0;
      let right = 0;
      b2.forEach((p, i) => {
        if (p[0] < b2[left][0]) left = i;
        if (p[0] > b2[right][0]) right = i;
      });
      const hull = [l2[left], b2[left], ...orderedArc(b2, left, right), b2[right], l2[right]];
      const dh = d2(hull);
      under.push(dh);
      const gid = `g${ids++}`;
      defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${r1(b2[left][0])}" y1="0" x2="${r1(b2[right][0])}" y2="0"><stop offset="0" stop-color="#9aa5ad"/><stop offset="0.35" stop-color="#d9dfe0"/><stop offset="1" stop-color="#5f6a75"/></linearGradient>`);
      over.push(path(dh, { fill: `url(#${gid})`, stroke: INK, 'stroke-width': 0.8 }));
      for (const z of [96, 104]) stroke3(disc(0, 402, z, r + 0.3).filter((_, i) => i > 6 && i < 22), '#3d4452', 0.7, { opacity: 0.8 });
      panel(lid, '#e8ecea', { sil: true, sw: 0.8 });
      panel(disc(0, 402, 114.5, 9.5), '#b4bdc2', { sw: 0.6 });
      panel(disc(0, 402, 115, 5), '#353a47', { sw: 0.5 });
      panel(disc(-9.5, 394, 114.6, 2.2, 10), '#ffc36a', { sw: 0.4 });
    }
    vent(-66, -20);
    // ribbed silver hoses from the drum to the vents, and the cable loom up the louvres
    const hose = (pts) => {
      stroke3(pts, INK, 3.2);
      stroke3(pts, '#c3cad0', 1.8);
      stroke3(pts, '#4d5563', 1.8, { dash: '0.6 1.5', opacity: 0.8 });
    };
    hose([[-13, 396, 100], [-17, 388, 104], [-22, 386, 100]]);
    hose([[13, 396, 100], [17, 388, 104], [22, 386, 100]]);
    const cable = (pts, c) => {
      stroke3(pts, INK, 2.4);
      stroke3(pts, c, 1.1);
    };
    cable([[-10, 388, 94], [-14, 350, 101], [-10, 310, 109], [-4, 290, 113], [-3, 258, 116]], '#3f4658');
    cable([[10, 388, 94], [16, 350, 101], [12, 310, 109], [5, 290, 113], [4, 258, 116]], '#3f4658');
    cable([[-28, 386, 96], [-34, 350, 100], [-30, 316, 107]], '#b98352');
    cable([[30, 386, 96], [38, 350, 100], [34, 316, 107]], '#6f8fb0');
    for (const y of [318, 350]) panel([[-40, y, 104 - (y - 318) * 0.2], [40, y, 104 - (y - 318) * 0.2], [40, y + 6, 102.5 - (y - 318) * 0.2], [-40, y + 6, 102.5 - (y - 318) * 0.2]], '#59616f', { sw: 0.6 });

    // near buttress: outer skin with its quarter window, and the top strip
    const sailTop = (y) => [-(58 + ((y - 297) / 108) * 28), y, 110.5 - ((y - 297) / 108) * 21.5];
    const sail = [[-58, 284, 112], ...line(sailTop, 297, 405, 4), ...line(shoulder, 286, 405, 4).reverse()];
    panel(sail, grad([-60, 297, 110], [-88, 330, 84], [[0, '#e2e7e7'], [0.4, '#bcc5c8'], [1, '#98a3a9']]), { sil: true });
    brush([[-58, 286, 111], sailTop(400), shoulder(400), shoulder(288)], 7, { opacity: 0.28 });
    panel([[-63, 291, 108.5], [-81, 344, 90], [-86.5, 344, 85.8], [-85.5, 291, 85]], grad([-70, 300, 106], [-86, 320, 86], [[0, '#3d4d66'], [1, '#18212e']]), { sw: 1 });
    stroke3([[-68, 296, 104], [-84.5, 296, 87.5]], '#b7c8e0', 0.6, { opacity: 0.5 });
    panel([[-52, 297, 110.5], [-58, 297, 110.5], [-86, 405, 89], [-78, 405, 88.5]], '#f1f4f3', { sil: true, sw: 0.7 });
    // B-pillar edge of the opening
    panel([[-58, 284, 112], [-88, 286, 83], [-85, 290, 83.2], [-58, 289, 111.6]], '#cfd6d8', { sw: 0.6 });
  }

  // ------------------------------------------------------------------ the raised driver's door
  {
    const th = rad(view.door);
    const S = (p) => swing(p, th);
    const H1 = [-14, 208, 113.5];
    const H2 = [-14, 283, 113.5];
    const R1 = [-58, 206, 112];
    const R2 = [-58, 284, 112];
    const B1 = [-87, 144, 80];
    const B2 = [-88, 286, 83];
    const U1 = [-92.5, 147, 56];
    const U2 = [-93, 285, 57.5];
    const L1 = [-91, 150, 31];
    const L2 = [-91, 284, 31];
    const off = (p, v) => [p[0] + v[0], p[1], p[2] + v[2]];
    const tr = [0, 0, -5];
    const tg = [3.4, 0, -3.1];
    const tl = [11, 0, 0];
    const faces = [];
    const add = (pts, draw) => faces.push({ depth: cam.depth(centroid(pts)), pts, draw });
    const slab = (outer, t, drawOuter, drawInner) => {
      const o = outer.map(S);
      const i = outer.map((p) => S(off(p, t)));
      const nearOuter = cam.depth(centroid(o)) < cam.depth(centroid(i));
      add(nearOuter ? o : i, nearOuter ? drawOuter : drawInner);
    };

    // gas strut from the hoop to the door
    const strutA = [-36, 286, 112];
    const strutB = S([-55, 262, 104]);
    stroke3([strutA, strutB], INK, 2.4);
    stroke3([strutA, mix(strutA, strutB, 0.55)], '#3b404d', 1.3);
    stroke3([mix(strutA, strutB, 0.55), strutB], '#dfe4e4', 0.9);

    // roof section
    slab([H1, H2, R2, R1], tr,
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#eef1f0'], [1, '#b4bdc2']]), { sil: true });
        brush([q[0], q[1], q[2], q[3]], 8, { opacity: 0.3 });
      },
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#2c303d'], [1, '#414756']]), { sil: true });
        // headliner panel and frame
        const inset = [mix(mix(q[0], q[3], 0.14), mix(q[1], q[2], 0.14), 0.07), mix(mix(q[0], q[3], 0.14), mix(q[1], q[2], 0.14), 0.93), mix(mix(q[0], q[3], 0.9), mix(q[1], q[2], 0.9), 0.93), mix(mix(q[0], q[3], 0.9), mix(q[1], q[2], 0.9), 0.07)];
        panel(inset, grad(inset[0], inset[3], [[0, '#646b7a'], [1, '#4c5362']]), { sw: 0.6 });
        const g = (u, v) => mix(mix(q[0], q[3], v), mix(q[1], q[2], v), u);
        // pull strap and courtesy lamp
        stroke3([g(0.34, 0.74), g(0.66, 0.74)], INK, 2.4);
        stroke3([g(0.34, 0.74), g(0.66, 0.74)], '#9aa1ad', 1.1);
        stroke3([g(0.07, 0.14), g(0.93, 0.14)], '#8d94a1', 0.5, { opacity: 0.8 });
      });
    // window section: frame, glass and the small inset pane
    const glassDraw = (outerSide) => (q) => {
      // q = R1, R2, B2, B1 (top front, top rear, bottom rear, bottom front)
      panel(q, '#1a1c25', { sil: true, sw: 1 });
      const g = (s, t) => mix(mix(q[0], q[3], t), mix(q[1], q[2], t), s);
      const pane = [g(0.07, 0.1), g(0.94, 0.1), g(0.955, 0.9), g(0.045, 0.9)];
      panel(pane, grad(pane[0], pane[3], outerSide ? [[0, '#5d7191', 0.92], [1, '#22304a', 0.92]] : [[0, '#6b7f9f', 0.9], [0.55, '#465873', 0.9], [1, '#2a3850', 0.9]]), { sw: 0.6 });
      const cp = clip(pane);
      over.push(el('g', { 'clip-path': cp }, path(D([g(0.2, 0), g(0.36, 0), g(0.26, 1), g(0.1, 1)]), { fill: '#d5e4f7', opacity: 0.28 }) + path(D([g(0.42, 0), g(0.47, 0), g(0.37, 1), g(0.32, 1)]), { fill: '#d5e4f7', opacity: 0.2 })));
      // the little opening pane, low in the glass
      const small = [g(0.36, 0.46), g(0.8, 0.46), g(0.81, 0.9), g(0.33, 0.9)];
      stroke3(small, '#0d0e15', 1.5, { closed: true });
      stroke3(small, '#59627a', 0.5, { closed: true });
    };
    slab([R1, R2, B2, B1], tg, glassDraw(true), glassDraw(false));
    // lower door: two facets either side of the rub line
    slab([B1, B2, U2, U1], tl,
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#f4f6f5'], [0.12, '#d4d9d9'], [1, '#aab3b8']]), { sil: true });
        brush([q[0], q[1], q[2], q[3]], 12, { opacity: 0.38 });
        brush([q[0], q[1], q[2], q[3]], 6, { color: '#5c6770', opacity: 0.2 });
        // door handle recess near the rear
        const g = (s, t) => mix(mix(q[0], q[3], t), mix(q[1], q[2], t), s);
        panel([g(0.78, 0.2), g(0.93, 0.2), g(0.93, 0.42), g(0.78, 0.42)], '#2b2e3a', { sw: 0.6 });
        stroke3([q[0], q[1]], '#ffffff', 0.7, { opacity: 0.95 });
      },
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#3a3f4c'], [1, '#575e6d']]), { sil: true });
        const g = (u, v) => mix(mix(q[0], q[3], v), mix(q[1], q[2], v), u);
        panel([g(0.08, 0.3), g(0.92, 0.3), g(0.92, 0.95), g(0.08, 0.95)], '#646b7a', { sw: 0.5 });
      });
    slab([U1, U2, L2, L1], tl,
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#b9c2c6'], [1, '#7f8b93']]), { sil: true });
        brush([q[0], q[1], q[2], q[3]], 9, { opacity: 0.26 });
        // the rub strip carries on across the door
        stroke3([q[0], q[1]], INK, 2.1);
        stroke3([q[0], q[1]], '#3a3d4a', 0.8);
      },
      (q) => {
        panel(q, grad(q[0], q[3], [[0, '#575e6d'], [1, '#737a88']]), { sil: true });
        const g = (s, t) => mix(mix(q[0], q[3], t), mix(q[1], q[2], t), s);
        panel([g(0.1, 0.2), g(0.9, 0.2), g(0.9, 0.8), g(0.1, 0.8)], '#454b59', { sw: 0.6 });
      });
    // end caps: the door's leading edge (its section) and its bottom edge
    {
      const outer = [H1, R1, B1, U1, L1].map(S);
      const inner = [off(L1, tl), off(U1, tl), off(B1, tg), off(R1, tr), off(H1, tr)].map(S);
      add([...outer, ...inner], (q) => {
        panel(q, '#2b2e3a', { sil: true });
        // weather seal line down the middle of the section
        const mid = outer.map((p, i) => mix(p, inner[inner.length - 1 - i], 0.5));
        stroke3(mid, '#6c7484', 0.7);
      });
      const bottom = [S(L1), S(L2), S(off(L2, tl)), S(off(L1, tl))];
      add(bottom, (q) => {
        panel(q, grad(q[0], q[3], [[0, '#4a505e'], [1, '#262933']]), { sil: true });
      });
    }
    faces.sort((a, b) => b.depth - a.depth).forEach((f) => f.draw(f.pts));
    // the stainless skin shows as a bright lip round the door's outer edge
    stroke3([H1, R1, B1, U1, L1, L2].map(S), '#e6eaea', 1, { opacity: 0.95 });
    stroke3([B1, B2].map(S), '#aab3b8', 0.7, { opacity: 0.9 });
  }

  return { cam, defs, under, over };
}

/** Convex hull of 2D points (monotone chain). */
function hull2(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Points of `ring` from index a to index b, going the way that passes nearer the viewer (larger y on screen). */
function orderedArc(pts, a, b) {
  const n = pts.length;
  const fwd = [];
  for (let i = (a + 1) % n; i !== b; i = (i + 1) % n) fwd.push(pts[i]);
  const back = [];
  for (let i = (a - 1 + n) % n; i !== b; i = (i - 1 + n) % n) back.push(pts[i]);
  const avg = (l) => l.reduce((s, p) => s + p[1], 0) / Math.max(1, l.length);
  return avg(fwd) > avg(back) ? fwd : back;
}

export function timeCarDisplay() {
  const W = 320;
  const H = 200;
  const base = { az: Number(process.env.AZ ?? 50), elev: Number(process.env.EL ?? 12), dist: Number(process.env.DIST ?? 620), target: [0, 213, 60], scale: 1, cx: 0, cy: 0, door: Number(process.env.DOOR ?? 88) };
  // first pass measures, second pass fits the car into the box
  const probe = build(base).cam.box;
  const pad = 5;
  const scale = Math.min((W - pad * 2) / (probe.x1 - probe.x0), (H - pad * 2) / (probe.y1 - probe.y0));
  const cx = W / 2 - ((probe.x0 + probe.x1) / 2) * scale;
  const cy = H - pad - probe.y1 * scale;
  const { defs, under, over } = build({ ...base, scale, cx, cy });
  const sil = path(under.join(''), { fill: INK, stroke: INK, 'stroke-width': 3.6 });
  return write('flight/time_car_display', W, H, sil + over.join(''), defs.join(''));
}

if (import.meta.url === `file://${process.argv[1]}`) timeCarDisplay();
