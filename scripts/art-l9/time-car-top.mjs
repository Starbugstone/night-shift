// flight/pickup_time_car and flight/pickup_time_car_coils (96×172): the time car in plan, nose north,
// both doors shut, drawn from the same dimensions as the three-quarter master (CAR, in cm).
// Body x12–84, y4–162; the receiver hook ends at (48,168); the rear axle sits on y≈131.
import { INK, d2, el, path, r1, rng, write } from './lib.mjs';
import { CAR } from './time-car-display.mjs';

const W = 96;
const H = 172;
const KX = 72 / 186;
const KY = 158 / 427;
const T = ([x, y]) => [48 + x * KX, 4 + y * KY];
const D = (pts, closed = true) => d2(pts.map(T), closed);
const both = (fn) => fn(-1) + fn(1);

function defsFor(list) {
  let n = 0;
  return (x0, y0, x1, y1, stops) => {
    const id = `t${n++}`;
    const a = T([x0, y0]);
    const b = T([x1, y1]);
    list.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}">${stops
        .map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op === undefined ? '' : ` stop-opacity="${op}"`}/>`)
        .join('')}</linearGradient>`,
    );
    return `url(#${id})`;
  };
}

/** The coil runs, shared by the car (as conduit) and the charge overlay (as light). */
const COILS = [
  // flanks, hugging the sills between the arches
  [[-94, 146], [-94.5, 300]],
  [[94, 146], [94.5, 300]],
  // across the nose
  [[-89, 22], [-84, 13.5], [84, 13.5], [89, 22]],
  // over the rear deck, round the reactor
  [[-70, 380], [-70, 436], [70, 436], [70, 380]],
];

export function timeCarTop() {
  const defs = [];
  const grad = defsFor(defs);
  const o = [];
  const rand = rng(88);
  const brush = (x0, x1, y0, y1, n, color, opacity) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i + rand()) / n) * (x1 - x0);
      const a = y0 + rand() * (y1 - y0) * 0.3;
      const b = y1 - rand() * (y1 - y0) * 0.3;
      d += D([[x, a], [x, b]], false);
    }
    o.push(path(d, { fill: 'none', stroke: color, 'stroke-width': 0.3, opacity }));
  };

  // tyres: slivers of rubber beyond the flanks
  for (const [y, r] of [[CAR.frontAxle, CAR.frontR], [CAR.rearAxle, CAR.rearR]]) {
    o.push(both((s) => path(D([[s * 84, y - r], [s * 98, y - r + 3], [s * 98, y + r - 3], [s * 84, y + r]]), { fill: '#1b1b25', stroke: INK, 'stroke-width': 1.6 })));
  }
  // door mirrors
  o.push(both((s) => path(D([[s * 88, 149], [s * 101, 152], [s * 101, 163], [s * 88, 160]]), { fill: '#262933', stroke: INK, 'stroke-width': 1.4 })));

  // body
  const body = [
    [-72, 0], [72, 0], [86, 10], [91, 44], [93, 104], [93, 400], [90, 419], [82, 427], [-82, 427], [-90, 419], [-93, 400], [-93, 104], [-91, 44], [-86, 10],
  ];
  o.push(path(D(body), { fill: grad(-93, 0, 93, 0, [[0, '#8f9ba2'], [0.07, '#c9d0d2'], [0.5, '#d4d9d9'], [0.93, '#a7b0b5'], [1, '#6f7b84']]), stroke: INK, 'stroke-width': 3 }));
  // front fascia: grille band with the four lamps, seen over the leading edge
  o.push(path(D([[-73, 2], [73, 2], [83, 11], [-83, 11]]), { fill: '#1d1f29' }));
  for (const [x0, x1] of [[-72, -55], [-52, -35], [35, 52], [55, 72]]) {
    o.push(path(D([[x0, 2.4], [x1, 2.4], [x1, 10.4], [x0, 10.4]]), { fill: '#fff3cf', stroke: INK, 'stroke-width': 0.7 }));
  }
  o.push(path(D([[-30, 4.5], [30, 4.5]], false) + D([[-30, 8], [30, 8]], false), { fill: 'none', stroke: '#4a5060', 'stroke-width': 0.6 }));
  // wing tops and the flat bonnet
  o.push(path(D([[-80, 13], [80, 13], [82, 138], [-82, 138]]), { fill: grad(0, 13, 0, 138, [[0, '#eef1f0'], [0.35, '#d4d9d9'], [0.75, '#b1babf'], [1, '#98a3aa']]), stroke: INK, 'stroke-width': 1 }));
  // storm sky on the bonnet
  o.push(path(D([[-70, 13], [-44, 13], [-16, 138], [-48, 138]]), { fill: grad(-56, 13, -30, 138, [[0, '#ffffff', 0.6], [0.8, '#ffffff', 0.1], [1, '#ffffff', 0]]) }));
  o.push(path(D([[-30, 13], [-22, 13], [8, 138], [-2, 138]]), { fill: '#ffffff', opacity: 0.22 }));
  o.push(path(D([[-82, 106], [82, 96], [82, 138], [-82, 138]]), { fill: grad(0, 96, 0, 138, [[0, '#4d5a72', 0], [1, '#4d5a72', 0.45]]) }));
  brush(-76, 78, 16, 134, 30, '#ffffff', 0.28);
  brush(-76, 78, 16, 134, 12, '#566068', 0.14);
  o.push(both((s) => path(D([[s * 27, 18], [s * 28, 128]], false), { fill: 'none', stroke: '#5c6770', 'stroke-width': 0.9 })));
  o.push(both((s) => path(D([[s * 27 + 2.4, 18], [s * 28 + 2.4, 128]], false), { fill: 'none', stroke: '#f6f8f7', 'stroke-width': 0.45 })));
  
  // cowl and windscreen
  o.push(path(D([[-82, 138], [82, 138], [82, 148], [-82, 148]]), { fill: '#1a1b24', stroke: INK, 'stroke-width': 0.8 }));
  const ws = [[-80, 148], [80, 148], [57, 208], [-57, 208]];
  o.push(path(D(ws), { fill: grad(0, 148, 0, 208, [[0, '#121a26'], [0.55, '#25334a'], [1, '#465873']]), stroke: INK, 'stroke-width': 1.6 }));
  o.push(path(D([[-76, 150], [-50, 150], [-34, 206], [-54, 206]]), { fill: '#a9bedc', opacity: 0.24 }));
  o.push(path(D([[14, 150], [26, 150], [36, 206], [28, 206]]), { fill: '#cfe0f5', opacity: 0.2 }));
  // time circuits on the dash, through the glass
  o.push(path(D([[-9, 153], [9, 153], [9, 170], [-9, 170]]), { fill: '#0c0f17' }));
  for (const [c, y] of [['#ff635f', 157], ['#7cf59a', 161.5], ['#ffc36a', 166]]) o.push(path(D([[-6, y], [6, y]], false), { fill: 'none', stroke: c, 'stroke-width': 1.1 }));
  // side glass under the gull-wing doors
  o.push(both((s) => path(D([[s * 86, 146], [s * 60, 207], [s * 60, 284], [s * 88, 286]]), { fill: grad(s * 88, 0, s * 60, 0, [[0, '#16202d'], [1, '#3b4b64']]), stroke: INK, 'stroke-width': 1.4 })));
  o.push(both((s) => path(D([[s * 84, 190], [s * 66, 196], [s * 66, 262], [s * 85, 262]]), { fill: 'none', stroke: '#6f83a3', 'stroke-width': 0.6, opacity: 0.8 })));
  // roof: door tops, centre spine and rear hoop
  const roof = grad(0, 208, 0, 298, [[0, '#f1f4f3'], [0.6, '#c6cdd0'], [1, '#a2acb2']]);
  o.push(path(D([[-58, 207], [58, 207], [58, 298], [-58, 298]]), { fill: roof, stroke: INK, 'stroke-width': 1.5 }));
  brush(-55, 55, 210, 294, 20, '#ffffff', 0.3);
  brush(-55, 55, 210, 294, 8, '#566068', 0.14);
  // door seams and the spine
  o.push(both((s) => path(D([[s * 14, 208], [s * 14, 284]], false), { fill: 'none', stroke: INK, 'stroke-width': 1 })));
  o.push(path(D([[-58, 284], [58, 284]], false), { fill: 'none', stroke: '#4d5863', 'stroke-width': 0.7 }));
  o.push(both((s) => path(D([[s * 17, 222], [s * 17, 232]], false) + D([[s * 17, 262], [s * 17, 272]], false), { fill: 'none', stroke: '#454b59', 'stroke-width': 1.6 })));
  // shoulders either side of the glass
  o.push(both((s) => path(D([[s * 88.5, 150], [s * 89.5, 284]], false), { fill: 'none', stroke: '#ffffff', 'stroke-width': 0.7, opacity: 0.85 })));

  // rear: buttresses, quarter glass, louvres
  o.push(both((s) => path(D([[s * 63, 300], [s * 85, 300], [s * 87, 346]]), { fill: '#18212e', stroke: INK, 'stroke-width': 1 })));
  const bay = [[-52, 298], [52, 298], [62, 390], [-62, 390]];
  o.push(path(D(bay), { fill: '#0f1017', stroke: INK, 'stroke-width': 1.4 }));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.08) / n;
    const t1 = (i + 0.78) / n;
    const hw = (t) => 52 + 10 * t - 2.5;
    const y = (t) => 298 + 92 * t;
    o.push(path(D([[-hw(t0), y(t0)], [hw(t0), y(t0)], [hw(t1), y(t1)], [-hw(t1), y(t1)]]), { fill: grad(0, y(t0), 0, y(t1), [[0, '#555b6c'], [0.4, '#30333f'], [1, '#1d1f29']]) }));
    o.push(path(D([[-hw(t0), y(t0)], [hw(t0), y(t0)]], false), { fill: 'none', stroke: '#9aa3b5', 'stroke-width': 0.6 }));
  }
  o.push(both((s) => path(D([[s * 52, 298], [s * 58, 298], [s * 86, 405], [s * 78, 405]]), { fill: '#f1f4f3', stroke: INK, 'stroke-width': 0.8 })));

  // deck plate and the machinery
  o.push(path(D([[-62, 390], [62, 390], [84, 405], [86, 425], [-86, 425], [-84, 405]]), { fill: grad(0, 390, 0, 426, [[0, '#3a3f4c'], [1, '#262933']]), stroke: INK, 'stroke-width': 1 }));
  // tail lamps: a red rim at the very back
  o.push(both((s) => path(D([[s * 40, 423], [s * 82, 423], [s * 80, 427], [s * 40, 427]]), { fill: '#b4474c', stroke: INK, 'stroke-width': 0.6 })));
  // cable loom from the roof box down the louvres
  const cable = (pts, c, w = 1.1) => o.push(path(D(pts, false), { fill: 'none', stroke: INK, 'stroke-width': w + 1.2 }) + path(D(pts, false), { fill: 'none', stroke: c, 'stroke-width': w }));
  cable([[-4, 258], [-5, 300], [-12, 350], [-10, 392]], '#4a5266');
  cable([[4, 258], [6, 300], [14, 350], [10, 392]], '#4a5266');
  cable([[-32, 316], [-36, 352], [-30, 388]], '#b98352', 0.9);
  cable([[34, 316], [39, 352], [31, 388]], '#6f8fb0', 0.9);
  o.push(path(D([[-42, 322], [42, 322], [42, 329], [-42, 329]]), { fill: '#59616f', stroke: INK, 'stroke-width': 0.7 }));
  o.push(path(D([[-46, 356], [46, 356], [46, 363], [-46, 363]]), { fill: '#59616f', stroke: INK, 'stroke-width': 0.7 }));
  o.push(path(D([[-7, 236], [7, 236], [7, 260], [-7, 260]]), { fill: '#4b5262', stroke: INK, 'stroke-width': 1 }));
  o.push(path(D([[-4, 240], [4, 240]], false), { fill: 'none', stroke: '#8d94a1', 'stroke-width': 0.7 }));
  // the two finned vents
  for (const s of [-1, 1]) {
    const x0 = s * 20;
    const x1 = s * 68;
    o.push(path(D([[x0, 384], [x1, 384], [x1, 434], [x0, 434]]), { fill: grad(0, 384, 0, 434, [[0, '#4a5060'], [1, '#2a2d38']]), stroke: INK, 'stroke-width': 1.5 }));
    let fins = '';
    for (let i = 1; i < 7; i++) fins += D([[x0 + s * 4, 384 + i * 7.1], [x1 - s * 4, 384 + i * 7.1]], false);
    o.push(path(fins, { fill: 'none', stroke: '#0f1017', 'stroke-width': 1.3 }));
    o.push(path(fins, { fill: 'none', stroke: '#8a94a6', 'stroke-width': 0.4, transform: 'translate(0 -0.7)' }));
  }
  // reactor drum between them
  const c = T([0, 404]);
  o.push(path(D([[-16, 396], [-22, 392]], false) + D([[16, 396], [22, 392]], false), { fill: 'none', stroke: INK, 'stroke-width': 3 }));
  o.push(path(D([[-16, 396], [-22, 392]], false) + D([[16, 396], [22, 392]], false), { fill: 'none', stroke: '#c3cad0', 'stroke-width': 1.6 }));
  o.push(el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: 6.4, fill: '#e8ecea', stroke: INK, 'stroke-width': 1.4 }));
  o.push(el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: 3.9, fill: '#aeb7bc', stroke: '#59616f', 'stroke-width': 0.6 }));
  o.push(el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: 2, fill: '#353a47' }));
  o.push(el('circle', { cx: r1(c[0] - 4), cy: r1(c[1] - 3.4), r: 1, fill: '#ffc36a' }));
  // receiver pole: out past the tail to the hook at (48,168)
  const pole = [[0, 414], [0, 440]];
  o.push(path(D(pole, false), { fill: 'none', stroke: INK, 'stroke-width': 3.4 }) + path(D(pole, false), { fill: 'none', stroke: '#c9cfd2', 'stroke-width': 1.7 }));
  o.push(path('M48 166.8a3 3 0 1 1 -3 -3', { fill: 'none', stroke: INK, 'stroke-width': 3.2 }) + path('M48 166.8a3 3 0 1 1 -3 -3', { fill: 'none', stroke: '#e6eaea', 'stroke-width': 1.5 }));

  // side coils and the nose band (idle: plain conduit)
  for (const run of COILS.slice(0, 3)) {
    o.push(path(D(run, false), { fill: 'none', stroke: INK, 'stroke-width': 3 }));
    o.push(path(D(run, false), { fill: 'none', stroke: '#7f8b9b', 'stroke-width': 1.5 }));
    o.push(path(D(run, false), { fill: 'none', stroke: '#eef3f6', 'stroke-width': 0.45, opacity: 0.9 }));
  }
  write('flight/pickup_time_car', W, H, o.join(''), defs.join(''));

  // ---- the charge overlay: ice-blue light on the same runs, a narrow white core, glow at the vents
  const g = [];
  const all = COILS.map((run) => D(run, false)).join('');
  g.push(path(all, { fill: 'none', stroke: '#90cdff', 'stroke-width': 6, opacity: 0.5, filter: 'url(#b3)' }));
  g.push(path(all, { fill: 'none', stroke: '#90cdff', 'stroke-width': 3, opacity: 0.95, filter: 'url(#b1)' }));
  g.push(path(all, { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.1 }));
  for (const s of [-1, 1]) {
    let fins = '';
    for (let i = 1; i < 7; i++) fins += D([[s * 24, 384 + i * 7.1], [s * 64, 384 + i * 7.1]], false);
    g.push(path(fins, { fill: 'none', stroke: '#90cdff', 'stroke-width': 2, opacity: 0.8, filter: 'url(#b1)' }));
    g.push(path(fins, { fill: 'none', stroke: '#eaf6ff', 'stroke-width': 0.6 }));
  }
  g.push(el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: 5, fill: '#90cdff', opacity: 0.7, filter: 'url(#b1)' }));
  g.push(el('circle', { cx: r1(c[0]), cy: r1(c[1]), r: 1.8, fill: '#ffffff' }));
  const blur = '<filter id="b1" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter><filter id="b3" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>';
  write('flight/pickup_time_car_coils', W, H, g.join(''), blur);
}

if (import.meta.url === `file://${process.argv[1]}`) timeCarTop();
