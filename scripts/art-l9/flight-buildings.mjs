// L9 flight plates: ground, square, courthouse, Main Street fronts, school, gym, banner, a house roof.
// North is up; south walls show a shallow lit strip. No lettering anywhere: code draws the words.
import { C, E, F, G, INK, R, S, el, lin, path, r1, rng, write } from './lib.mjs';

/** Parallel hatch lines. */
const rows = (x0, x1, y0, y1, step, stroke, sw = 1.5, opacity = 0.4) => {
  let d = '';
  for (let y = y0; y <= y1; y += step) d += `M${x0} ${r1(y)}H${x1}`;
  return S(d, stroke, sw, { opacity });
};
const cols = (x0, x1, y0, y1, step, stroke, sw = 1.5, opacity = 0.4) => {
  let d = '';
  for (let x = x0; x <= x1; x += step) d += `M${r1(x)} ${y0}V${y1}`;
  return S(d, stroke, sw, { opacity });
};
/** A lit window with a mullion. */
const win = (x, y, w, h, lit = C.gold) => R(x, y, w, h, 2, lit, 3) + S(`M${x + w / 2} ${y + 1.5}v${h - 3}`, C.rust, 1.6);
/** Scalloped awning edge along y, from x0 to x1. */
const scallop = (x0, x1, y, r, fill) => {
  const n = Math.round((x1 - x0) / (r * 2));
  const w = (x1 - x0) / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) d += `q${r1(w / 2)} ${r * 1.5} ${r1(w)} 0`;
  return F(d + 'Z', fill, 2.5);
};
/** Awning stripes between two y, clipped by construction. */
const stripes = (x0, x1, y0, y1, w, fill) => {
  let o = '';
  for (let x = x0 + w; x < x1 - 1; x += w * 2) o += R(r1(x), y0, Math.min(w, x1 - x), y1 - y0, 0, fill, 0);
  return o;
};

function ground() {
  const rand = rng(55);
  let o = R(0, 0, 540, 540, 0, C.slate, 0);
  // wet sheen: faint open dashes of reflected light and darker damp patches, kept off the seams
  for (let i = 0; i < 34; i++) {
    const x = 26 + rand() * 488;
    const y = 26 + rand() * 488;
    const k = rand();
    if (k < 0.4) o += S(`M${r1(x)} ${r1(y)}h${r1(8 + rand() * 12)}m${r1(4)} ${r1(3)}h${r1(5 + rand() * 6)}`, '#3c4658', 2, { opacity: 0.9 });
    else if (k < 0.7) o += E(r1(x), r1(y), r1(8 + rand() * 10), r1(3 + rand() * 2), '#283040', 0, { opacity: 0.8 });
    else if (k < 0.9) o += S(`M${r1(x)} ${r1(y)}q6 -2.5 12 0`, '#46526a', 1.6, { opacity: 0.8 });
    else o += E(r1(x), r1(y), 2.4, 1.2, '#55627a', 0, { opacity: 0.8 });
  }
  write('flight/ground_storm55', 540, 540, o);
}

function square() {
  // sepia paving, four clipped lawns, a clear centre and a paler walk to the courthouse steps (north)
  let o = R(4, 4, 392, 292, 14, '#3d3d4c', 3, { stroke: '#232538' });
  o += rows(14, 386, 28, 276, 31, '#4a4857', 1.5, 0.7) + cols(40, 372, 14, 286, 41.5, '#4a4857', 1.5, 0.7);
  o += F('M150 6H250V70H150Z', '#484654', 0) + cols(170, 232, 10, 66, 20, '#565362', 1.4, 0.8) + rows(152, 248, 26, 60, 17, '#565362', 1.4, 0.8);
  const lawn = (d) => F(d, '#2b4046', 2.5, { stroke: '#22303a' });
  o += lawn('M18 18H124Q132 18 132 26V84Q132 92 124 92H58L18 60Z') + lawn('M382 18H276Q268 18 268 26V84Q268 92 276 92H342L382 60Z');
  o += lawn('M18 282H124Q132 282 132 274V208Q132 200 124 200H58L18 232Z') + lawn('M382 282H276Q268 282 268 274V208Q268 200 276 200H342L382 232Z');
  for (const [x, y] of [[62, 44], [338, 44], [62, 252], [338, 252]]) o += S(`M${x - 22} ${y}q8 -5 16 0m10 6q8 -5 16 0m-30 -18q8 -5 16 0`, '#365058', 2);
  // a ring of setts round the open centre
  o += el('ellipse', { cx: 200, cy: 150, rx: 56, ry: 44, fill: 'none', stroke: '#565362', 'stroke-width': 2, 'stroke-dasharray': '7 6', opacity: 0.8 });
  // benches
  for (const [x, y] of [[142, 146], [258, 146]]) o += R(x - 5, y - 16, 10, 32, 3, '#5a4a52', 2, { stroke: '#232538' });
  write('flight/courthouse_square55', 400, 300, o);
}

function courthouse() {
  const stone = C.limestone;
  const stoneLit = '#dcc3a2';
  const stoneShade = '#93705a';
  let o = '';
  // steps and portico floor (south)
  o += R(96, 268, 176, 28, 4, '#a7b7ce', 3.5) + rows(100, 268, 275, 291, 7, '#647899', 2, 1);
  // main block: south wall strip, then the roofs
  o += R(12, 60, 336, 198, 8, stoneShade, 3.5);
  o += R(16, 236, 328, 20, 0, '#7a5b4d', 0);
  for (const x of [28, 62, 290, 324]) o += win(x - 9, 239, 18, 14);
  // pitched wings: north slope darker, south slope lighter, stone parapet
  const wing = (x, w) =>
    R(x, 60, w, 178, 5, stone, 3.5) + R(x + 9, 69, w - 18, 160, 3, '#3d4763', 3) + F(`M${x + 9} 149H${x + w - 9}V229H${x + 9}Z`, C.slateBlue, 0) +
    S(`M${x + 9} 149H${x + w - 9}`, INK, 2.5) + rows(x + 14, x + w - 14, 84, 140, 14, INK, 1.5, 0.3) + rows(x + 14, x + w - 14, 163, 220, 14, INK, 1.5, 0.3) +
    S(`M${x + 16} 153H${x + w - 16}`, C.denim, 2, { opacity: 0.9 });
  o += wing(12, 122) + wing(226, 122);
  // western service portal (56,144): a little dormer with a door, lamp over it
  o += F('M34 126H78V162H34Z', stone, 3) + F('M34 126L56 114L78 126Z', stoneLit, 3) + R(46, 134, 20, 28, 2, C.teal, 2.5) + E(60, 149, 1.8, 1.8, C.gold, 0) + S('M40 162H72', '#7a5b4d', 2.5);
  // eastern stone balcony (270,170): flagged floor inside a balustrade
  o += R(240, 152, 60, 36, 4, stoneLit, 3) + R(246, 158, 48, 24, 2, '#b09478', 2) + cols(252, 288, 159, 181, 12, '#93705a', 1.4, 0.8) + S('M246 170H294', '#93705a', 1.4, { opacity: 0.8 });
  for (let x = 244; x <= 296; x += 8.7) o += E(r1(x), 152.5, 1.8, 1.8, C.custard, 0) + E(r1(x), 187.5, 1.8, 1.8, C.custard, 0);
  // central block with the pediment over the columns
  o += R(120, 44, 128, 216, 6, stone, 3.5);
  o += F('M104 246L184 208L264 246Z', stoneLit, 3.5) + F('M126 242L184 215L242 242Z', '#b09478', 2.5) + R(100, 244, 168, 12, 3, C.custard, 3);
  for (const x of [112, 140, 168, 200, 228, 256]) o += R(x - 6, 256, 12, 20, 2, C.custard, 2.5) + R(x - 8, 273, 16, 5, 1.5, stoneShade, 2);
  // the clock tower, cheated to face the camera: shaft, clock storey, stepped cap and the rod
  o += R(132, 56, 104, 138, 5, stoneLit, 3.5) + F('M132 160H236V194H132Z', '#b09478', 0) + S('M132 160H236', INK, 2.5);
  o += R(126, 150, 116, 12, 3, C.custard, 3);
  for (const x of [150, 172, 196, 218]) o += R(x - 5, 168, 10, 20, 5, C.night, 2.5);
  o += F('M146 60L184 34L222 60Z', C.teal, 3.5) + F('M160 58L184 41L208 58Z', C.enamel, 0) + R(138, 56, 92, 9, 3, C.custard, 3);
  // lightning rod: tip at (186,18)
  o += S('M185 40L186 20', INK, 5) + S('M185 40L186 20', '#d8dde6', 2.2) + E(185, 40, 4, 4, C.gold, 2.5) + F('M186 12l2.4 6h-4.8Z', '#f1f4f3', 1.6);
  // cable anchor on the east shoulder of the tower
  o += E(232, 72, 5, 5, C.custard, 2.5) + E(232, 72, 1.8, 1.8, INK, 0);
  // clock: 82 px disc at (184,112); four principal ticks, eight minor; hands are drawn by code
  o += E(184, 112, 45, 45, '#7a5b4d', 3.5) + E(184, 112, 41, 41, C.gold, 2.5) + E(184, 112, 36, 36, C.custard, 2);
  let ticks = '';
  let minor = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    if (i % 3 === 0) ticks += `M${r1(184 + c * 24)} ${r1(112 + s * 24)}L${r1(184 + c * 33)} ${r1(112 + s * 33)}`;
    else minor += `M${r1(184 + c * 28.5)} ${r1(112 + s * 28.5)}L${r1(184 + c * 33)} ${r1(112 + s * 33)}`;
  }
  o += S(ticks, INK, 4.2) + S(minor, '#7a5b4d', 2.8) + S('M160 96q10 -14 26 -14', '#ffffff', 2.5, { opacity: 0.6 });
  write('flight/courthouse55_top', 360, 300, o);
}

function cafe() {
  let o = '';
  // service yard in the north-east notch: door (216,44) under a tin canopy, bin and crates
  o += R(176, 12, 88, 46, 4, '#2b3442', 3) + R(200, 30, 32, 26, 2, C.teal, 2.5) + R(194, 24, 44, 12, 3, C.enamel, 2.5) + E(226, 46, 2, 2, C.gold, 0);
  o += E(250, 30, 8, 8, C.steel, 2.5) + E(250, 30, 3.5, 3.5, '#647899', 0) + R(180, 18, 14, 12, 2, C.ochre, 2.5) + S('M180 24h14', C.rust, 1.6);
  // main roof with an enamel parapet
  o += F('M8 14H176V56H264V152H8Z', C.teal, 3.5) + F('M18 24H166V66H254V142H18Z', '#3a4558', 3);
  o += rows(22, 250, 78, 136, 14.5, INK, 1.5, 0.28) + rows(22, 162, 34, 64, 14.5, INK, 1.5, 0.28);
  o += R(196, 78, 40, 30, 4, '#4b5870', 3) + E(216, 93, 9, 9, C.night, 2.5) + S('M210 93h12m-6 -6v12', '#647899', 2.4);
  // the giant side-on cup on its roof frame, steam curling north
  o += S('M52 132V118M112 132V118', INK, 5) + S('M52 132V118M112 132V118', '#8792a6', 2.2);
  o += F('M44 60H118Q120 104 104 116H58Q42 104 44 60Z', C.custard, 3.5) + F('M118 68Q142 66 140 84Q138 100 114 100L116 92Q130 92 131 83Q132 75 118 76Z', C.custard, 3);
  o += F('M48 64H114Q115 74 113 82H49Q47 74 48 64Z', '#6b4a3f', 0) + S('M52 90Q54 104 62 110', '#ffffff', 3, { opacity: 0.8 }) + E(81, 120, 34, 5, C.enamel, 3);
  o += S('M64 52q-8 -9 0 -16q8 -8 0 -16M84 50q-8 -9 0 -18q7 -7 1 -14M102 52q-7 -8 0 -15', '#d8dde6', 3.4, { opacity: 0.75 });
  // south wall: transom lights above the awning
  o += R(12, 146, 248, 22, 0, '#5d4a48', 0) + S('M8 152H264', INK, 3);
  for (let x = 22; x < 250; x += 30) o += R(x, 153, 22, 9, 2, C.gold, 2.2);
  // cream awning with a scalloped edge, broken by the bay window at (80,177)
  const awn = (x0, x1) => R(x0, 164, x1 - x0, 26, 3, C.custard, 3) + stripes(x0, x1, 166, 188, 9, '#e5cc9f') + scallop(x0, x1, 189, 4.5, C.custard) + S(`M${x0 + 3} 168H${x1 - 3}`, '#ffffff', 2, { opacity: 0.7 });
  o += awn(10, 44) + awn(116, 262);
  o += F('M44 164H116L108 200H52Z', C.enamel, 3.5) + F('M52 170H108L103 194H57Z', C.gold, 2.5) + S('M70 171L71 193M90 171L89 193', C.rust, 2) + S('M56 176H104', '#ffe49b', 2, { opacity: 0.8 });
  // door mat and step by the bay
  o += R(150, 192, 34, 12, 3, '#3a4558', 2.5);
  write('flight/cafe55_top', 272, 210, o);
}

function pictureHouse() {
  let o = '';
  o += R(8, 10, 220, 128, 6, C.aubergine, 3.5) + R(18, 20, 200, 108, 3, '#3a3550', 3) + rows(22, 214, 34, 122, 14.6, INK, 1.5, 0.28);
  // projection-room hump and the reel pictogram
  o += R(150, 28, 56, 40, 4, '#4f4666', 3) + R(158, 58, 14, 8, 2, C.gold, 2);
  o += E(64, 62, 26, 26, C.custard, 3.5) + E(64, 62, 6, 6, INK, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    o += E(r1(64 + Math.cos(a) * 15), r1(62 + Math.sin(a) * 15), 5.6, 5.6, '#3a3550', 2);
  }
  o += S('M90 62Q112 72 100 96', INK, 5) + S('M90 62Q112 72 100 96', C.oxide, 2.4);
  // south wall strip with poster cases
  o += R(12, 128, 212, 14, 0, '#4a3f5c', 0);
  for (const x of [24, 52, 170, 198]) o += R(x - 8, 130, 16, 10, 1.5, C.gold, 2);
  // wedge marquee thrusting over the kerb: two blank faces, three rows of bulbs
  o += F('M30 134H206L170 182H66Z', C.teal, 3.5) + F('M44 142H192L164 174H72Z', C.custard, 3);
  o += S('M118 142V174', '#c9b58f', 2) + S('M52 150H184M62 160H174', '#e5cc9f', 2, { opacity: 0.9 });
  let bulbs = '';
  for (let i = 0; i <= 10; i++) bulbs += E(r1(38 + i * 16), 138, 2.4, 2.4, C.butter, 1.2);
  for (let i = 0; i <= 6; i++) bulbs += E(r1(70 + i * 16), 178, 2.4, 2.4, C.butter, 1.2);
  for (let i = 0; i < 4; i++) bulbs += E(r1(40 + i * 8.2), r1(148 + i * 10), 2.2, 2.2, C.butter, 1.2) + E(r1(196 - i * 8.2), r1(148 + i * 10), 2.2, 2.2, C.butter, 1.2);
  o += bulbs;
  // stepped vertical fin, cheated flat: teal steps with enamel tubes
  o += F('M104 126V52H110V36H126V52H132V126Z', C.teal, 3.5) + S('M118 44V120', C.enamel, 4) + S('M110 60V118M126 60V118', '#8fb5b5', 2) + E(118, 30, 6, 6, C.gold, 3);
  write('flight/picture_house55_top', 236, 190, o);
}

function dressShop() {
  let o = '';
  o += R(8, 10, 180, 100, 6, C.oxide, 3.5) + R(18, 20, 160, 80, 3, '#5a4250', 3) + rows(22, 174, 33, 94, 14, INK, 1.5, 0.28);
  o += R(34, 30, 34, 24, 3, '#6d5260', 3) + E(51, 42, 7, 7, C.night, 2.2) + R(132, 30, 28, 20, 3, C.steel, 2.5) + S('M136 36h20m-20 7h20', '#647899', 1.8);
  // south wall with the big window: a wire dress form in a broad skirt
  o += R(12, 102, 172, 60, 4, '#7d4c52', 3.5);
  o += R(46, 116, 104, 44, 3, C.gold, 3) + F('M48 118H148V134Q98 126 48 134Z', C.butter, 0, { opacity: 0.7 });
  o += S('M98 152V158M88 159H108', INK, 3) + F('M98 120Q107 120 106 128L103 134Q124 142 128 156H68Q72 142 93 134L90 128Q89 120 98 120Z', C.oxide, 3) + S('M82 148Q98 142 114 148M76 155h44', '#c98a8c', 1.8) + S('M93 134h10', C.custard, 2.4) + E(98, 117.5, 2.6, 2.2, C.custard, 2);
  o += R(22, 122, 16, 36, 2, C.teal, 2.5) + E(34, 141, 1.6, 1.6, C.gold, 0) + R(158, 122, 16, 36, 2, C.gold, 2.5) + S('M166 124v32', C.rust, 1.6);
  // striped canopy over the window
  o += R(10, 98, 176, 22, 3, C.custard, 3.5) + stripes(10, 186, 100, 118, 8, C.oxide) + scallop(10, 186, 119, 4, C.custard) + S('M14 102H182', '#ffffff', 1.8, { opacity: 0.6 });
  write('flight/dress_shop55_top', 196, 168, o);
}

function school() {
  let o = '';
  // broad central steps (south)
  o += R(110, 182, 92, 38, 4, C.steel, 3.5) + rows(114, 198, 191, 213, 7.4, '#647899', 2, 1);
  o += R(8, 12, 296, 176, 6, '#7d4c52', 3.5);
  // south wall with a row of tall windows
  o += R(12, 164, 288, 22, 0, '#6a3f47', 0);
  for (const x of [26, 52, 78, 216, 242, 268]) o += win(x, 167, 18, 16);
  // brick-red roof under a cream cornice
  o += R(8, 12, 296, 154, 6, C.custard, 3.5) + R(18, 22, 276, 134, 3, C.oxide, 3) + F('M18 89H294V156H18Z', '#aa6b6e', 0) + S('M18 89H294', INK, 2.5);
  o += rows(22, 290, 36, 80, 14.6, INK, 1.5, 0.26) + rows(22, 290, 103, 150, 14.6, INK, 1.5, 0.26) + S('M26 93H286', '#c98a8c', 2, { opacity: 0.9 });
  // paired chimneys
  for (const x of [84, 228]) o += R(x - 13, 40, 26, 30, 3, '#7d4c52', 3) + R(x - 8, 45, 7, 8, 1.5, INK, 0) + R(x + 1, 45, 7, 8, 1.5, INK, 0) + R(x - 15, 37, 30, 7, 2, C.custard, 2.5);
  // entrance: pediment, bell cupola and the doors
  o += F('M98 172L156 138L214 172Z', C.custard, 3.5) + F('M118 168L156 146L194 168Z', C.limestone, 2.5) + E(156, 160, 5, 5, C.oxide, 2);
  o += R(138, 100, 36, 32, 4, C.custard, 3) + E(156, 116, 9, 9, C.gold, 2.5) + E(156, 116, 3, 3, C.rust, 0);
  o += R(138, 170, 36, 16, 2, C.teal, 2.5) + S('M156 171v14', INK, 2);
  write('flight/school55_top', 312, 224, o);
}

function gym() {
  let o = '';
  // barrel roof: ribs run north–south, a long highlight along the crown
  o += R(10, 10, 262, 172, 10, '#4a4560', 3.5);
  o += F('M20 18H262V146H20Z', C.aubergine, 3) + F('M20 18H262V52H20Z', '#4f4366', 0) + F('M20 112H262V146H20Z', '#4f4366', 0) + F('M20 70H262V92H20Z', '#77688a', 0);
  o += cols(44, 244, 20, 144, 25, INK, 2.2, 0.5) + cols(47, 247, 20, 144, 25, '#8f81a3', 1.2, 0.6) + S('M26 76H256', '#b3a6c4', 2, { opacity: 0.7 });
  // west bandstand hatch (56,96) and two roof vents
  o += R(38, 80, 36, 32, 3, C.steel, 3) + R(44, 86, 24, 20, 2, C.night, 2.5) + S('M48 90l16 12', '#647899', 2) + E(71, 96, 2, 2, C.gold, 0);
  for (const x of [132, 208]) o += E(x, 44, 10, 10, C.steel, 3) + E(x, 44, 4, 4, '#647899', 0);
  // quiet south wall for the banner, with the double doors at (194,194)
  o += R(12, 148, 258, 66, 5, '#7d4c52', 3.5) + S('M14 164H268', '#6a3f47', 2, { opacity: 0.7 }) + rows(16, 266, 176, 206, 10, '#6a3f47', 1.4, 0.55);
  o += R(170, 172, 48, 42, 3, C.custard, 3) + R(175, 177, 18, 37, 2, C.teal, 2.5) + R(195, 177, 18, 37, 2, C.teal, 2.5);
  o += R(178, 181, 12, 12, 2, C.gold, 2) + R(198, 181, 12, 12, 2, C.gold, 2) + S('M178 200h12M198 200h12', C.custard, 2.4);
  // shell-and-wave emblem over the doors
  o += F('M184 172Q194 156 204 172Z', C.custard, 2.5) + S('M194 171V163M189 171L191 165M199 171L197 165', C.rust, 1.5);
  o += R(162, 214, 64, 14, 3, C.steel, 3) + S('M166 221H222', '#647899', 2);
  // east loading canopy on its own approach: striped tin over a dock door, a hand truck beside it
  o += R(268, 84, 16, 76, 2, '#6a3f47', 3) + R(271, 100, 10, 44, 1.5, C.teal, 2.2);
  o += R(276, 90, 40, 64, 4, C.custard, 3.5) + stripes(276, 316, 92, 152, 6.6, C.teal) + S('M280 94H312', '#ffffff', 1.8, { opacity: 0.6 });
  o += R(284, 160, 24, 16, 2, C.ochre, 2.5) + S('M284 168h24M296 160v16', C.rust, 1.6);
  write('flight/dance_gym55_top', 320, 232, o);
}

function banner() {
  // paper banner: rolled ends with a shell cut-out each; the centre 188×36 stays clear for the words
  let o = F('M14 8Q112 3 210 8V40Q112 45 14 40Z', C.custard, 3) + S('M22 12Q112 8 202 12', '#ffffff', 2, { opacity: 0.8 }) + S('M22 37Q112 41 202 37', '#e5cc9f', 2.4);
  const roll = (x, s) =>
    F(`M${x} 5q${s * 12} 0 ${s * 12} 9v20q0 9 ${-s * 12} 9q${-s * 5} -19 0 -38Z`, '#e5cc9f', 3) + S(`M${x + s * 3} 9q${-s * 3} 15 0 30`, C.ochre, 1.8) +
    F(`M${x + s * 7} 29q${-s * 4.5} -9 0 -12q${s * 4.5} 3 0 12Z`, C.oxide, 1.6) + S(`M${x + s * 7} 28v-8`, C.custard, 1);
  o += roll(4, 1) + roll(220, -1);
  // cords
  o += S('M10 6L4 1M214 6L220 1', INK, 2.2);
  write('flight/dance_banner55', 224, 48, o);
}

function house() {
  // extra to the art doc: a 1955 ranch roof for the residential blocks (same box as flight/house_top)
  let o = R(10, 46, 180, 130, 7, '#7a5b4d', 3.5) + F('M14 147H186V174H14Z', '#5a4338', 0);
  o += win(24, 150, 38, 18) + win(138, 150, 38, 18) + R(88, 148, 24, 26, 2, C.teal, 3) + E(106, 162, 1.8, 1.8, C.gold, 0);
  o += F('M4 44L26 6H174L196 44V138L186 146H14L4 138Z', C.teal, 4) + F('M4 44L26 6H174L196 44L182 76H18Z', C.enamel, 3);
  o += rows(20, 180, 52, 72, 8.4, INK, 1.5, 0.3) + rows(12, 188, 88, 136, 9.6, INK, 1.5, 0.26);
  o += R(138, 18, 26, 24, 3, C.tobacco, 3) + R(143, 22, 16, 9, 2, INK, 0);
  // the new television aerial
  o += S('M58 108V70M40 76H76M44 86H72M48 96H68', INK, 4.2) + S('M58 108V70M40 76H76M44 86H72M48 96H68', '#d8dde6', 1.8) + E(58, 110, 4, 4, C.steel, 2.5);
  write('flight/house55_top', 200, 180, o);
}

export function flightBuildings() {
  ground();
  square();
  courthouse();
  cafe();
  pictureHouse();
  dressShop();
  school();
  gym();
  banner();
  house();
}
if (import.meta.url === `file://${process.argv[1]}`) flightBuildings();
