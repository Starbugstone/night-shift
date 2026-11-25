// L9 side-view sets: three 540×720 backdrops (atmosphere only) and the furniture for the clock ledge,
// the café and the dance lot. Sizes and registration follow docs/l9/art-direction.md.
import { C, E, F, G, INK, R, S, el, lin, path, r1, radial, write } from './lib.mjs';

const shafts = (o = 0.05) => G(path('M-140 0H33L490 613H309ZM68 0h30l452 603v10h-25Z', { fill: '#fff7e1' }), { opacity: o });

function backdrops() {
  // ---- clock tower: wet limestone banding, a string course, dark flags underfoot
  let defs =
    '<pattern id="ashlar" patternUnits="userSpaceOnUse" width="132" height="96"><path d="M0 0H132M0 48H132M66 0v48M0 48v48" fill="none" stroke="#2c2740" stroke-width="3"/><path d="M8 5h44M74 53h46M8 53h30" fill="none" stroke="#c4a788" stroke-width="1.2"/></pattern>' +
    '<pattern id="flag" patternUnits="userSpaceOnUse" width="150" height="54"><path d="M0 0H150M0 54H150M0 0v27M75 27v27" fill="none" stroke="#1b1433" stroke-width="2.6"/><path d="M0 27H150" fill="none" stroke="#1b1433" stroke-width="2.6"/><path d="M20 10q14 -3 28 0M96 37q14 -3 28 0" fill="none" stroke="#647899" stroke-width="1.3"/></pattern>';
  let o = R(0, 0, 540, 720, 0, '#5a4f5c', 0);
  o += G(R(0, 0, 540, 612, 0, 'url(#ashlar)', 0), { opacity: 0.5 });
  // alternate courses a shade warmer, like banded stone
  for (const y of [96, 288, 480]) o += R(0, y, 540, 48, 0, '#93705a', 0, { opacity: 0.14 });
  // string course and rain-dark streaks under it
  o += R(0, 206, 540, 20, 0, '#6d6068', 0) + S('M0 206H540M0 226H540', '#2c2740', 2.6) + S('M0 210H540', '#c4a788', 1.4, { opacity: 0.45 });
  let streaks = '';
  for (const [x, h] of [[38, 90], [112, 150], [176, 60], [262, 120], [330, 80], [404, 170], [470, 70], [512, 130]]) streaks += `M${x} 228v${h}`;
  o += S(streaks, '#2c2740', 5, { opacity: 0.22 });
  o += R(0, 612, 540, 108, 0, '#33334a', 0) + G(R(0, 612, 540, 108, 0, 'url(#flag)', 0), { opacity: 0.8 }) + S('M0 612H540', '#1b1433', 4) + S('M0 618H540', '#647899', 1.4, { opacity: 0.5 });
  o += shafts(0.05);
  write('room/bg_tower55', 540, 720, o, defs);

  // ---- café: cream tile over a teal dado, checker lino
  defs =
    '<pattern id="tile" patternUnits="userSpaceOnUse" width="45" height="45"><path d="M0 0H45M0 0V45" fill="none" stroke="#5b5360" stroke-width="2.2"/><path d="M5 5h14" fill="none" stroke="#ffedc9" stroke-width="1.3"/></pattern>' +
    '<pattern id="lino" patternUnits="userSpaceOnUse" width="90" height="54"><path d="M0 0H45V27H0ZM45 27H90V54H45Z" fill="#3a4a58"/></pattern>';
  o = R(0, 0, 540, 720, 0, '#7d7371', 0);
  o += G(R(0, 0, 540, 432, 0, 'url(#tile)', 0), { opacity: 0.55 });
  // enamel trim, then the teal dado with a chrome strip
  o += R(0, 432, 540, 16, 0, '#719898', 0) + S('M0 432H540M0 448H540', '#263441', 2.6) + S('M0 436H540', '#d8ffdf', 1.3, { opacity: 0.45 });
  o += R(0, 448, 540, 164, 0, '#3f6266', 0) + S('M0 500H540', '#2e4b50', 3) + S('M0 506H540', '#719898', 1.6, { opacity: 0.6 });
  let panels = '';
  for (let x = 30; x < 540; x += 90) panels += `M${x} 520V600`;
  o += S(panels, '#2e4b50', 2.6, { opacity: 0.8 });
  o += R(0, 612, 540, 108, 0, '#2b3442', 0) + G(R(0, 612, 540, 108, 0, 'url(#lino)', 0), { opacity: 0.9 }) + S('M0 612H540', '#1b1433', 4) + S('M0 618H540', '#719898', 1.4, { opacity: 0.5 });
  o += shafts(0.045);
  write('room/bg_cafe55', 540, 720, o, defs);

  // ---- dance lot: gym brick above a wet kerb and asphalt
  defs =
    '<pattern id="brick" patternUnits="userSpaceOnUse" width="72" height="44"><path d="M0 0H72M0 22H72M36 0v22M0 22v22" fill="none" stroke="#2c2233" stroke-width="2.6"/><path d="M6 4h20M42 26h22" fill="none" stroke="#c98a8c" stroke-width="1.1"/></pattern>';
  o = R(0, 0, 540, 720, 0, '#6a4650', 0);
  o += G(R(0, 0, 540, 600, 0, 'url(#brick)', 0), { opacity: 0.55 });
  // soldier course, a cream band and rain streaks
  o += R(0, 150, 540, 22, 0, '#7d4c52', 0) + S('M0 150H540M0 172H540', '#2c2233', 2.6);
  let soldiers = '';
  for (let x = 14; x < 540; x += 22) soldiers += `M${x} 151v20`;
  o += S(soldiers, '#2c2233', 1.8, { opacity: 0.5 });
  o += R(0, 392, 540, 12, 0, '#93705a', 0, { opacity: 0.5 });
  let streaks2 = '';
  for (const [x, y, h] of [[60, 174, 120], [150, 174, 70], [236, 174, 150], [318, 174, 90], [420, 174, 130], [496, 174, 60]]) streaks2 += `M${x} ${y}v${h}`;
  o += S(streaks2, '#2c2233', 5, { opacity: 0.2 });
  // kerb and wet asphalt with broken reflections
  o += R(0, 600, 540, 18, 0, '#8792a6', 0) + S('M0 600H540M0 618H540', '#1b1433', 3) + S('M0 604H540', '#d8dde6', 1.4, { opacity: 0.5 });
  let joints = '';
  for (let x = 54; x < 540; x += 108) joints += `M${x} 601v16`;
  o += S(joints, '#1b1433', 2, { opacity: 0.6 });
  o += R(0, 618, 540, 102, 0, '#263441', 0);
  o += S('M30 650h60m18 0h26M210 668h80m14 0h20M380 646h70m12 0h30M90 696h50M300 700h90m16 0h30', '#3c4a60', 3, { opacity: 0.8 });
  o += S('M250 640h40M440 676h36M40 676h30', '#ffedc9', 2, { opacity: 0.16 });
  o += shafts(0.04);
  write('room/bg_dance_lot55', 540, 720, o, defs);
}

function tower() {
  // ledge (322×72): flat pale lip (the collision top) over dark corbel blocks
  let o = '';
  for (const x of [16, 86, 156, 226, 296]) o += F(`M${x - 12} 22H${x + 12}V46Q${x + 10} 62 ${x - 2} 66H${x - 12}Z`, '#6d6068', 3) + S(`M${x - 7} 28V52`, '#93838a', 2);
  o += R(6, 18, 310, 24, 3, '#7a6c72', 3) + S('M12 34H310', '#5a4f5c', 2.4) + S('M70 20v20M150 20v20M232 20v20', '#5a4f5c', 2, { opacity: 0.8 });
  o += R(2, 2, 318, 18, 4, '#dcc3a2', 3.5) + S('M8 7H314', '#fff2dc', 2.4) + S('M8 16H314', '#b09478', 2) + S('M52 9v8M168 9v8M258 9v8', '#b09478', 1.6, { opacity: 0.8 });
  // rain beading on the lip
  o += S('M30 20v5M120 20v7M206 20v4M284 20v6', '#a7b7ce', 2, { opacity: 0.7 });
  write('room/tower_ledge55', 322, 72, o);

  // cable (426×56): ink cord drooping between porcelain pads at (10,10) and (416,47); a strip of tape lifts in the wind
  const cord = 'M10 10Q200 76 416 47';
  o = S(cord, INK, 7) + S(cord, '#4b5870', 3) + S('M30 16Q200 71 398 46', '#8792a6', 1.2, { opacity: 0.7 });
  o += R(196, 45, 12, 8, 2, C.oxide, 2.4) + F('M206 47q10 -10 22 -6q-8 3 -10 9Z', C.custard, 2.2) + S('M210 47q6 -5 12 -4', '#c9b58f', 1.2);
  const pad = (x, y) => R(x - 9, y - 9, 18, 18, 4, '#8792a6', 3) + E(x, y, 6.4, 6.4, C.custard, 2.6) + E(x, y, 2.2, 2.2, INK, 0) + S(`M${x - 4} ${y - 3}q2 -2 4 -2`, '#ffffff', 1.4);
  o += pad(10, 10) + pad(416, 47);
  write('room/tower_cable55', 426, 56, o);
}

function cafe() {
  // booth (300×192): scalloped high back at the head end, flat vinyl cushion whose top is y=88
  let o = '';
  o += R(52, 122, 244, 64, 5, '#3f6266', 3.5) + S('M58 140H290', '#719898', 2.4) + S('M58 176H290', '#2e4b50', 3) + R(52, 180, 244, 9, 3, '#8792a6', 3);
  let flutes = '';
  for (let x = 84; x < 290; x += 34) flutes += `M${x} 146V172`;
  o += S(flutes, '#2e4b50', 2.4);
  // cushion with piping
  o += F('M58 88H284Q296 88 296 100V118Q296 126 286 126H58Z', C.custard, 3.5) + S('M64 94H282', '#ffffff', 2.6, { opacity: 0.8 }) + S('M60 118H292', C.oxide, 2.6) + S('M120 96V116M186 96V116M250 96V116', '#e5cc9f', 2.2);
  // high back: three fat channels under a scalloped top, chrome cap
  o += F('M4 188V30Q4 6 18 6Q27 6 28 16Q30 6 40 6Q50 6 52 16Q54 6 62 6Q74 8 74 30V188Z', C.custard, 3.5);
  o += S('M28 18V178M52 18V178', '#e5cc9f', 2.6) + S('M12 26Q12 14 20 12M36 20Q37 13 42 12M60 20Q61 13 66 13', '#ffffff', 2.4, { opacity: 0.85 });
  o += S('M6 150H72', C.oxide, 2.6) + E(16, 60, 2.2, 2.2, C.oxide, 0) + E(40, 60, 2.2, 2.2, C.oxide, 0) + E(63, 60, 2.2, 2.2, C.oxide, 0) + E(16, 108, 2.2, 2.2, C.oxide, 0) + E(40, 108, 2.2, 2.2, C.oxide, 0) + E(63, 108, 2.2, 2.2, C.oxide, 0);
  o += R(2, 180, 76, 9, 3, '#8792a6', 3);
  write('room/booth55', 300, 192, o);

  // counter (178×120): steel edge over a teal front, fluted panels and a foot rail
  o = R(8, 16, 162, 100, 4, '#3f6266', 3.5) + R(14, 28, 150, 56, 3, '#4c7377', 2.6);
  let fl = '';
  for (let x = 26; x < 160; x += 14) fl += `M${x} 32V80`;
  o += S(fl, '#2e4b50', 2.4) + S('M18 32H160', '#719898', 2);
  o += R(8, 86, 162, 30, 3, '#2b3442', 3) + S('M14 100H164', INK, 5) + S('M14 100H164', '#d8dde6', 2.2) + S('M30 92v16M148 92v16', INK, 3.4);
  o += R(2, 2, 174, 16, 5, '#d8dde6', 3.5) + S('M8 7H170', '#ffffff', 2.4) + S('M6 14H172', '#8792a6', 2.2);
  write('room/counter55', 178, 120, o);

  // stool (56×80): a disc of vinyl on one bright pedestal
  o = F('M10 78Q12 66 22 64H34Q44 66 46 78Z', '#8792a6', 3) + S('M16 74H40', '#d8dde6', 2);
  o += R(24, 20, 8, 46, 3, '#d8dde6', 3) + S('M26.6 24V62', '#ffffff', 1.8) + E(28, 44, 9, 3.4, '#8792a6', 2.6);
  o += R(4, 12, 48, 10, 4, '#8792a6', 3) + F('M6 14Q6 3 28 3Q50 3 50 14Z', C.oxide, 3.2) + S('M12 9Q18 6 28 6', '#d9a3a3', 2.4) + S('M8 14H48', C.custard, 1.8);
  write('room/stool55', 56, 80, o);

  // jukebox (92×160): lit horseshoe and three grille bars
  const jd = radial('jg', [[0, '#ffe49b', 0.55], [1, '#ffe49b', 0]], 'cx="0.5" cy="0.36" r="0.6"');
  o = E(46, 80, 46, 78, 'url(#jg)', 0);
  o += F('M8 156V56Q8 6 46 6Q84 6 84 56V156Z', C.tobacco, 3.5) + F('M8 132H84V156H8Z', '#6f5243', 0) + S('M8 132H84', INK, 3);
  // the horseshoe: two glowing tubes round the arch
  o += S('M17 126V56Q17 15 46 15Q75 15 75 56V126', INK, 11) + S('M17 126V56Q17 15 46 15Q75 15 75 56V126', C.gold, 6) + S('M17 122V56Q17 17.5 46 17.5Q75 17.5 75 56V122', '#fff2c8', 2);
  o += S('M17 70h0M17 96h0M75 70h0M75 96h0M30 22h0M62 22h0', C.oxide, 6);
  // record window and selector keys
  o += F('M26 60Q26 26 46 26Q66 26 66 60Z', C.night, 3) + E(46, 54, 15, 6, INK, 0) + E(46, 53, 12, 4.6, '#3a3550', 1.5) + E(46, 53, 3.4, 1.6, C.oxide, 0) + S('M33 40q5 -8 13 -8', C.steel, 2, { opacity: 0.7 });
  o += R(24, 62, 44, 9, 2, C.custard, 2.5) + S('M30 64v5M36 64v5M42 64v5M48 64v5M54 64v5M60 64v5', C.oxide, 2);
  // grille cloth behind three chrome bars
  o += R(26, 76, 40, 50, 6, '#93454f', 3) + S('M34 82L58 120M58 82L34 120', '#7a3540', 2) + S('M36 78V124M46 78V124M56 78V124', INK, 5.5) + S('M36 79V123M46 79V123M56 79V123', '#d8dde6', 2.4);
  o += R(4, 150, 84, 8, 3, '#4a362e', 3);
  write('room/jukebox55', 92, 160, o, jd);

  // pie case (84×64): a glass trapezoid round one large wedge of pie
  o = R(4, 52, 76, 10, 3, '#8792a6', 3) + S('M10 56H74', '#d8dde6', 2);
  o += F('M10 52L18 8H66L74 52Z', '#b9d6d8', 3, { 'fill-opacity': 0.42 }) + R(14, 4, 56, 8, 3, '#d8dde6', 3);
  o += R(24, 44, 36, 5, 2, C.custard, 2.4) + S('M42 49v3', INK, 3);
  o += F('M22 44L52 22Q62 26 62 44Z', C.ochre, 3) + F('M26 44L52 27Q58 30 58 44Z', '#a64e5e', 0) + S('M52 22Q62 26 62 44', C.custard, 3.4) + S('M32 41l4 -3m4 3l5 -4m4 4l4 -4', '#7d2f40', 1.8);
  o += S('M22 14L16 46', '#ffffff', 2.6, { opacity: 0.75 }) + S('M28 14l-2 10', '#ffffff', 2, { opacity: 0.5 });
  write('room/pie_case55', 84, 64, o);
}

function danceLot() {
  // trunk body (336×194): side cutaway of the back of a long saloon. The cabin is off to the left, the
  // tail to the right. Luggage floor runs x19–325 with its top at y=54; the lining stands behind the
  // sleeper and the near rim stays below him.
  let o = '';
  // far wall of the boot (dark lining) and the back of the rear seat
  o += F('M14 6H300Q322 8 328 30V58H14Z', '#3a2f44', 3.5) + S('M40 14V54M96 14V54M152 14V54M208 14V54M264 14V54', '#2a2233', 2.4) + S('M22 12H296', '#5a4d68', 2);
  o += F('M2 2H22V60H2Z', '#6f5243', 3) + S('M8 8V54', '#93705a', 2.4);
  // luggage floor: a pale mat with a lip
  o += R(14, 54, 316, 12, 3, '#d9c7b8', 3) + S('M22 58H322', '#fff2dc', 2);
  // near flank of the car below the floor: two-tone with a chrome spear, the fin rising at the tail
  o += F('M2 64H330Q336 66 334 76L330 138Q328 150 316 150H2Z', C.oxide, 3.5);
  o += F('M2 104H332L330 138Q328 150 316 150H2Z', C.custard, 0) + S('M2 104H332', INK, 2.6) + S('M2 98H332', INK, 5) + S('M2 98H332', '#eef1f4', 2.2);
  o += S('M10 72H300', '#c98a8c', 2.4);
  // fin and tail lamp
  o += F('M286 64L330 26Q336 26 335 34L334 76H286Z', C.oxide, 3.5) + F('M322 40L332 32V58H322Z', C.red, 2.4) + S('M294 62L324 36', '#c98a8c', 2.2);
  // rear arch and whitewall wheel
  o += F('M66 150Q66 104 112 104Q158 104 158 150Z', '#2a2233', 3) + E(112, 152, 38, 38, '#1b1b25', 3.5) + E(112, 152, 28, 28, C.custard, 2.4) + E(112, 152, 19, 19, '#8792a6', 2.6) + E(112, 152, 8, 8, '#d8dde6', 2.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    o += S(`M${r1(112 + Math.cos(a) * 10)} ${r1(152 + Math.sin(a) * 10)}L${r1(112 + Math.cos(a) * 17)} ${r1(152 + Math.sin(a) * 17)}`, '#4b5870', 2.2);
  }
  o += S('M86 132Q94 122 108 120', '#ffffff', 2.4, { opacity: 0.6 });
  // chrome bumper and the loose lock hanging off the lip
  o += F('M300 134H334Q336 146 334 158H296Q292 146 300 134Z', '#eef1f4', 3.5) + S('M304 140H330', '#ffffff', 2.4) + S('M300 152H330', '#8792a6', 2.4);
  o += S('M312 64q6 8 2 16', INK, 4.4) + S('M312 64q6 8 2 16', '#d8dde6', 1.8) + R(306, 78, 14, 12, 3, C.gold, 2.6) + E(313, 84, 1.8, 1.8, INK, 0);
  // ground shadow under the sill
  o += E(170, 188, 150, 5, INK, 0, { opacity: 0.35 });
  write('room/trunk_body55', 336, 194, o);

  // trunk lid (88×160): standing on its hinge at local (28,158), pale lining inside, a stay rod
  o = S('M40 150L66 58', INK, 5) + S('M40 150L66 58', '#8792a6', 2);
  // the lid in profile: a deep pressed panel, skin outside (left), pale lining inside (right)
  o += F('M16 158L6 62Q2 18 30 8L72 3Q86 4 85 16L80 27Q56 24 49 38L46 64L44 158Z', C.oxide, 3.5);
  o += F('M34 156L34 64Q34 34 50 26L78 20L80 27Q56 24 49 38L46 64L44 158Z', '#d9c7b8', 2.4);
  o += S('M13 150L12 62Q10 26 32 15L70 9', '#c98a8c', 2.6) + S('M39 150V66Q40 40 52 32', '#b9a290', 1.8);
  o += E(28, 156, 6, 4, '#eef1f4', 2.6) + R(74, 14, 10, 12, 3, '#eef1f4', 2.6) + S('M77 17v6', '#8792a6', 1.6);
  write('room/trunk_lid55', 88, 160, o);

  // gym doors (180×196): two tall panes with push bars; dance light behind the glass, no spill shape
  const gd = lin('gp', 0, 40, 0, 120, [[0, '#ffedc9'], [0.5, '#e7d1e0'], [1, '#c9b3d6']]);
  o = R(4, 4, 172, 188, 5, C.custard, 3.5) + R(12, 30, 156, 162, 3, '#2e4b50', 3);
  // transom with the shell-and-wave emblem and a ribbon swag
  o += R(12, 10, 156, 20, 3, '#7d4c52', 3) + F('M76 28Q90 6 104 28Z', C.custard, 2.6) + S('M90 27V14M83 27L86 17M97 27L94 17', C.rust, 1.6) + S('M22 22q10 6 20 0t20 0M118 22q10 6 20 0t20 0', C.custard, 2.4);
  const door = (x) =>
    R(x, 34, 72, 156, 3, C.teal, 3) + R(x + 9, 44, 54, 78, 3, 'url(#gp)', 3) + S(`M${x + 36} 46V120M${x + 11} 84H${x + 61}`, INK, 2.6) +
    R(x + 12, 48, 20, 30, 1, '#ffffff', 0, { opacity: 0.22 }) + R(x + 9, 150, 54, 30, 3, '#3a5f63', 2.6) + S(`M${x + 6} 136H${x + 66}`, INK, 6.4) + S(`M${x + 6} 136H${x + 66}`, '#d8dde6', 2.8);
  o += door(16) + door(92) + S('M90 34V190', INK, 3.4);
  // painted treble clef and a paper ribbon
  o += S('M58 176q-8 -2 -6 -9q3 -7 9 -3q4 4 -1 8q-8 4 -9 -6q0 -9 8 -14q4 -4 0 -7q-4 2 -3 8l4 30q0 5 -5 4', C.custard, 2.4);
  o += F('M118 150q8 6 16 0q8 -6 16 0l-2 8q-7 -5 -14 0q-8 6 -16 0Z', C.oxide, 2.2);
  write('room/gym_doors55', 180, 196, o, gd);

  // amp case (122×84): squat speaker case, two bright corners, handle and a strip of knobs
  o = S('M44 10Q61 -2 78 10', INK, 6.4) + S('M44 10Q61 -2 78 10', C.tobacco, 2.6);
  o += R(4, 10, 114, 72, 7, '#b98f6c', 3.5) + S('M10 16H112', '#d9b892', 2.4) + R(4, 72, 114, 10, 4, '#93705a', 3);
  o += R(12, 30, 98, 42, 4, '#5a4338', 3) + S('M18 36L104 66M18 51L74 71M48 31L104 51M18 66L104 36M18 51L74 31M48 71L104 51', '#7a5b4d', 1.6);
  o += E(61, 51, 17, 17, '#3a2b25', 2.6) + E(61, 51, 6, 6, '#7a5b4d', 2);
  o += R(12, 16, 98, 11, 3, '#eef1f4', 2.6);
  for (const x of [24, 38, 52, 66]) o += E(x, 21.5, 3.4, 3.4, '#2a2233', 1.6) + S(`M${x} 21.5v-2.4`, C.custard, 1.4);
  o += E(98, 21.5, 2.6, 2.6, C.red, 1.4);
  o += F('M4 22V17Q4 10 11 10H18Z', '#eef1f4', 2.6) + F('M118 22V17Q118 10 111 10H104Z', '#eef1f4', 2.6);
  write('room/amp_case55', 122, 84, o);
}

export function rooms() {
  backdrops();
  tower();
  cafe();
  danceLot();
}
if (import.meta.url === `file://${process.argv[1]}`) rooms();
