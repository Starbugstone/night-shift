// L9 room sleepers (the light sleepers of the side routes, not the ragdoll rigs in humans.mjs).
// Run: node scripts/art-l9/sleepers.mjs
//   room/lyle55_asleep       90×122  Lyle, waist-up behind his counter, cheek on fist. The counter top is at y = 114.
//   room/lyle55_awake        90×130  Lyle bolt upright, spatula up, fist on the counter. The counter top is at y = 122.
//   room/chaperone55_asleep  90×122  Miss Finch nodded off on a folding chair, ruler in her lap. Chair feet at y = 120.
//   room/chaperone55_awake   90×130  Miss Finch on her feet, ruler raised. Feet at y = 128.
//   room/dock55             320×104  timber loading dock for the chaperone's chair (decor, optional).
// Both poses are bottom-aligned: the awake sprite is 8 px taller and sits on the same line.
// The game hangs the Zzz and the "!" above the right third of the sprite, so the heads lean that way.
import { C, E, F, G, INK, R, S, path, write } from './lib.mjs';

const WHITE = '#f6f7f5';
const SHIRT = C.custard;
const DARK = '#2a2233';
const TONGUE = '#d3827c';
const BLUSH = '#f09a86';
/** A tube with the ink outline: steel chair legs, apron straps, pencils. */
const tube = (d, fill, w = 3, ink = 3) => S(d, INK, w + ink) + S(d, fill, w);

// ---------------------------------------------------------------- Lyle

const LYLE = { skin: '#f5bd97', shade: '#d99a78', lit: '#ffd9bb', nose: '#eeaa8c', hair: C.umber };
/** Lyle's head, three-quarter view facing right, in a 52×52 box: ear at the left, nose bump at the right, chin at (24,52). */
const LYLE_HEAD = 'M8 22Q6 4 24 3Q42 2 44 20L44 26Q51 32 45 35L43 43Q38 52 24 52Q11 52 8 41L7 35Q1 35 1 28Q1 22 8 24Z';
/** The paper soda-jerk cap, sitting on the bald crown. */
const lyleCap = (a) => G(
  F('M6 13L11 -5Q25 -11 41 -5L45 10Q26 3 6 13Z', WHITE, 3) + S('M9 8.5Q26 0 43 5.5', C.oxide, 2.8) + S('M14 -2Q26 -7 39 -2.5', C.steel, 1.8),
  a,
);

function lyleHead(awake) {
  const { skin, shade, lit, nose, hair } = LYLE;
  let h = F(LYLE_HEAD, skin, 3.2);
  // double chin, bald shine, the two tufts that are left
  h += path('M11 43Q22 55 41 46L39 49Q30 54 21 52Q13 50 11 43Z', { fill: shade });
  h += S('M15 13Q20 7 30 6.5', lit, 2.6);
  h += F('M8 27Q1 15 9 8Q13 13 13 21L11 29Z', hair, 2.4) + F('M41 9Q47 13 45 22L41 18Z', hair, 2);
  h += S('M4 27q3 1 2 5', shade, 1.8);
  h += E(19, 37, 4.2, 2.6, BLUSH, 0, { opacity: 0.55 });
  if (awake) {
    h += E(22, 27, 5.6, 6.2, C.custard, 2.2) + E(36.5, 26, 4.8, 5.6, C.custard, 2.2) + E(23.6, 27.6, 2, 2.3, INK, 0) + E(37.6, 26.6, 1.8, 2.1, INK, 0);
    h += S('M14 18l11 4.5M43 17l-9 4.5', hair, 3.4);
    // shouting: teeth, tongue
    h += F('M25 42Q34 37 43 41Q44 51 35 51Q26 51 25 42Z', INK, 0) + R(29, 41.4, 11, 3, 1.2, '#fff7e6', 0) + E(35, 48.2, 3.6, 1.7, TONGUE, 0);
    h += E(34, 33, 4.6, 4, nose, 2.2);
    h += F('M22 40Q29 33 34 37Q39 33 46 39Q41 42 34 40Q28 43 22 40Z', hair, 2);
  } else {
    h += S('M16 22q5 -3 10 0M32 21q4 -2.5 7 -0.5', hair, 3.2);
    h += S('M16 28q5 4 10 0M32 27q3.5 3.5 7 0', INK, 2.6);
    h += E(34, 46, 3.8, 3.2, INK, 0) + E(34.4, 47.5, 1.9, 1, TONGUE, 0);
    h += E(34, 33.5, 4.6, 4, nose, 2.2);
    h += F('M23 40Q30 35 34 38Q39 35 45 39Q40 44 34 41.5Q29 44 23 40Z', hair, 2);
  }
  return h;
}

/** White apron bib with its straps and an order-pad pocket; `y` is the counter line. */
function lyleApron(y, top, strapL, strapR) {
  return tube(`M30 ${top + 1}L${strapL}M60 ${top}L${strapR}`, WHITE, 3.4, 2.6) +
    F(`M26 ${top + 1}L64 ${top}L65 ${y}L25 ${y}Z`, WHITE, 2.8) +
    R(38, top + 12, 16, 12, 2, WHITE, 2) + tube(`M43 ${top + 7}v8`, C.oxide, 1.6, 1.8) +
    S(`M29 ${y - 8}q16 4 33 0`, '#d0d8e2', 2.2) + S(`M28 ${top + 5}h7M56 ${top + 4.5}h6`, '#d0d8e2', 2);
}
const bowTie = (x, y, a) => G(F(`M${x} ${y}l-8 -5v10ZM${x} ${y}l8 -5v10Z`, DARK, 2.2) + E(x, y, 2.5, 2.5, DARK, 1.6), a);
/** Dish towel over the shoulder. */
const towel = (x, y) => F(`M${x} ${y}q6 -5 12 0l1 25l-12 1Z`, WHITE, 2.4) + S(`M${x + 1.2} ${y + 18.5}h11M${x + 1.3} ${y + 22}h11`, C.oxide, 1.8);

function lyleAsleep() {
  const { skin, shade } = LYLE;
  const y = 114;
  // slumped shoulders, the far arm tucked down to the elbow on the counter
  let s = F(`M9 ${y}L10 88Q11 69 28 66L60 63Q77 63 81 82L86 ${y}Z`, SHIRT, 3.2);
  s += S('M72 80q4 12 3 26', C.cream, 2.2);
  s += lyleApron(y, 82, '34 67', '57 64');
  // near arm: short sleeve, forearm flat along the counter
  s += F('M13 71Q3 74 3 90L5 103L19 104L21 84Z', SHIRT, 3) + S('M5 97q7 3 14 1', C.cream, 2.2);
  s += towel(11, 70);
  s += F('M7 100Q1 107 7 113L47 114Q57 114 57 107.5Q57 101.5 48 101.5L30 101L16 99Z', skin, 3);
  s += S('M49 104.5q3 2.5 2 6.5M22 105l2 3M30 105.5l2 3M38 106l2 3', shade, 1.7);
  s += bowTie(46, 73, { transform: 'rotate(10 46 73)' });
  s += G(lyleHead(false) + lyleCap({ transform: 'translate(5 4) rotate(13 25 5)' }), { transform: 'translate(24 12) rotate(12 24 52)' });
  // elbow on the counter, fist propping the cheek
  s += F('M71 111Q70 114 76 114L84 114Q89 113 88 108L82 70L68 71Z', skin, 3) + S('M76 96l2 3M77 86l2 3', shade, 1.7);
  s += F('M65 62Q63 51 73 50Q84 49 85 59Q86 69 76 70Q66 71 65 62Z', skin, 3) + S('M70 53.5v6M75 52.5v6M80 53.5v6', shade, 1.7);
  // a bead of drool: he has been out a while
  s += S('M60 63q1 4 0 7', '#b9d6e8', 2);
  write('room/lyle55_asleep', 90, 122, s);
}

function lyleAwake() {
  const { skin, shade } = LYLE;
  const y = 122;
  let s = F(`M11 ${y}L11 90Q11 73 28 71L62 71Q79 73 79 90L80 ${y}Z`, SHIRT, 3.2);
  s += lyleApron(y, 88, '35 72', '56 72');
  s += towel(60, 73);
  // one arm up with the spatula
  s += F('M13 76Q2 76 2 64L3 52Q10 47 17 52L18 66L24 76Z', SHIRT, 3) + S('M4 57q6 -3 12 0', C.cream, 2.2);
  s += tube('M10 40L9 27', C.wood, 3.4, 3) + R(2, 5, 15, 20, 2.5, C.steel, 2.6) + S('M6.5 10v10M9.5 10v10M12.5 10v10', INK, 1.5) + S('M4.5 8h10', '#eef1f4', 1.6);
  s += F('M4 52L5 43Q5 36 11 36Q17 36 17 43L16 52Q10 55 4 52Z', skin, 3) + S('M6 42.5h9M6 46.5h9', shade, 1.6);
  s += bowTie(44, 80, { transform: 'rotate(-12 44 80)' });
  s += G(lyleHead(true), { transform: 'translate(70 21) scale(-1 1)' });
  // the cap leaves his head
  s += lyleCap({ transform: 'translate(25 13) rotate(-9 25 5) scale(0.9)' });
  // the other fist comes down on the counter
  s += F('M68 78Q84 76 86 92L88 104L72 106L70 92Z', SHIRT, 3) + S('M72 99q8 3 15 0', C.cream, 2.2);
  s += F(`M72 104L88 103L89 113Q90 ${y} 80 ${y}Q70 ${y} 71 113Z`, skin, 3) + S(`M75 ${y - 6}v4M80 ${y - 6}v4M85 ${y - 6}v4`, shade, 1.6);
  write('room/lyle55_awake', 90, 130, s);
}

// ---------------------------------------------------------------- the chaperone (Miss Finch)

const FINCH = { skin: '#ffc9a1', shade: '#ebaa89', hair: '#b9b3c9', hairShade: '#8a84a0', cardigan: C.teal, cardiganShade: '#345558', cardiganLit: C.enamel, tweed: C.tobacco, shoe: '#3a2b25' };
/** Her head, three-quarter view facing right, in a 40×42 box: neck at (20,41). */
const FINCH_HEAD = 'M7 17Q7 2 20 2Q33 2 34 16L34 21Q40 26 35 28.5L34 33Q31 41 20 41Q10 41 8 32L7 27Q3 27 3 22Q3 18 7 19Z';

function finchHead(awake) {
  const { skin, shade, hair, hairShade } = FINCH;
  // the bun, with the pencil she keeps in it
  let h = awake
    ? tube('M-6 -1L3 -8', C.butter, 2.4, 2.4) + S('M-9 4l-3 2', C.steel, 1.8)
    : tube('M1 9L25 -5', C.butter, 2.4, 2.4) + S('M1 9l2.5 -1.5', TONGUE, 2.4);
  h += E(11, 3, 8.5, 7.5, hair, 2.6) + S('M7 3q4 -5 8 -1q1 4 -3 4', hairShade, 1.6);
  h += F(FINCH_HEAD, skin, 3);
  h += F('M6 22Q2 5 20 1Q36 0 35 15Q28 7 18 9Q11 11 10 21L8 25Z', hair, 2.6) + S('M12 11Q18 5 28 5', '#dedbe8', 2) + S('M9 17q1 -4 4 -6', hairShade, 1.6);
  h += E(5.2, 28.5, 1.9, 1.9, '#fff7e6', 1.2);
  h += E(14, 31, 3.6, 2.2, BLUSH, 0, { opacity: 0.6 });
  h += S('M26 25q-1 4.5 3 4.5', shade, 1.8);
  const lens = awake ? '#fff7e6' : '#dfe9ee';
  // horn rims: two upswept frames, a bridge, and the chain that keeps them on
  h += S('M8 24Q3 36 12 43', C.butter, 1.6);
  h += F('M10 19Q16 14.5 23 17.5Q24 26.5 17 26.5Q10 26.5 10 19Z', lens, 0, { opacity: awake ? 1 : 0.6 }) + F('M26 17.5Q30.5 14.8 35 17.5Q35 25 30.5 25Q26 25 26 17.5Z', lens, 0, { opacity: awake ? 1 : 0.6 });
  if (awake) {
    h += E(18, 21.5, 1.7, 2, INK, 0) + E(32, 21, 1.5, 1.8, INK, 0);
    h += S('M11 12.5l10 3.5M36 11.5l-8 3.5', hairShade, 2.2);
    h += F('M21 33Q27 30 32 33Q33 40 27 40Q21 40 21 33Z', INK, 0) + S('M21.5 33Q27 30 31.5 33', C.oxide, 2) + E(27, 37.6, 2.6, 1.3, TONGUE, 0);
  } else {
    h += S('M13 21.5q3.5 2.5 7 0M28.5 21q2.5 2.3 5 0', INK, 2);
    h += E(27, 35, 3.1, 3.3, C.oxide, 0) + E(27, 35.3, 1.6, 1.9, INK, 0);
  }
  h += S('M10 19Q16 14.5 23 17.5Q24 26.5 17 26.5Q10 26.5 10 19ZM26 17.5Q30.5 14.8 35 17.5Q35 25 30.5 25Q26 25 26 17.5Z', DARK, 2.6);
  h += F('M10.5 19.5L5.5 14.5L13 16.5Z', DARK, 1.4) + F('M34.5 18L38.5 13.5L32 16Z', DARK, 1.4) + S('M23 18.5q1.5 -1.5 3 0', DARK, 2.2);
  return h;
}

/** Steel folding chair seen from the front; `f` is the floor line. */
function foldingChair(f) {
  const back = f - 74;
  let s = tube(`M21 ${back + 12}L19 ${f - 34}M69 ${back + 12}L71 ${f - 34}`, C.steel, 3, 3);
  s += R(19, back, 52, 17, 4.5, C.limestone, 3) + S(`M24 ${back + 5}h42`, '#dcc3a4', 2.2);
  s += tube(`M26 ${f - 30}L30 ${f - 3}M64 ${f - 30}L60 ${f - 3}`, '#7f8da6', 2.6, 2.6);
  s += tube(`M17 ${f - 12}H73`, C.steel, 2.6, 2.6);
  s += tube(`M19 ${f - 30}L13 ${f - 2}M71 ${f - 30}L77 ${f - 2}`, C.steel, 3, 3);
  s += R(14, f - 37, 62, 8, 3.5, C.steel, 3) + S(`M18 ${f - 34.5}h54`, '#eef1f4', 1.6);
  s += E(13, f - 1.2, 3.4, 2, INK, 0) + E(77, f - 1.2, 3.4, 2, INK, 0);
  return s;
}
/** Tweed skirt between the waist `top` and the hem `hem`, with its check. */
function tweedSkirt(top, hem, d) {
  const { tweed } = FINCH;
  const mid = (top + hem) / 2;
  return F(d, tweed, 3) +
    S(`M33 ${top + 3}L35 ${hem - 2}M45 ${top + 3}V${hem - 2}M57 ${top + 3}L55 ${hem - 2}`, C.umber, 1.4, { opacity: 0.75 }) +
    S(`M27 ${mid - 5}H63M28 ${mid + 5}H62`, C.umber, 1.4, { opacity: 0.75 }) + S(`M39 ${top + 3}L40 ${hem - 2}M51 ${top + 3}L50 ${hem - 2}`, C.limestone, 1.2, { opacity: 0.7 });
}
const shoes = (f) => {
  const { skin, shoe } = FINCH;
  return F(`M35 ${f - 20}L34 ${f - 6}L44 ${f - 6}L45 ${f - 20}ZM46 ${f - 20}L46 ${f - 6}L56 ${f - 6}L55 ${f - 20}Z`, skin, 2.4) +
    F(`M29 ${f - 1}L29 ${f - 5}Q30 ${f - 10} 37 ${f - 9}L45 ${f - 8}L45 ${f - 1}Z`, shoe, 2.4) + F(`M46 ${f - 1}L46 ${f - 8}L54 ${f - 9}Q61 ${f - 10} 62 ${f - 5}L62 ${f - 1}Z`, shoe, 2.4) +
    S(`M38 ${f - 7.5}l4 0.6M49 ${f - 7}l4 -0.6`, C.limestone, 1.5);
};
/** The wooden ruler, drawn from the origin along +x. */
const ruler = (length, a) => {
  let ticks = '';
  for (let x = 6, i = 0; x < length - 3; x += 6, i++) ticks += `M${x} -3.2v${i % 2 ? 2.2 : 3.4}`;
  return G(R(0, -3.4, length, 6.8, 1.2, '#e5cc9f', 2.2) + S(ticks, INK, 1.2), a);
};
const cardiganFront = (top, bottom) => {
  const { cardiganShade } = FINCH;
  let s = S(`M45 ${top + 8}V${bottom}`, cardiganShade, 2.2);
  for (let y = top + 13; y < bottom - 3; y += 9) s += E(45, y, 1.9, 1.9, C.butter, 1.2);
  return s;
};
const collar = (y) => F(`M36 ${y}Q40 ${y - 3} 45 ${y + 7}Q50 ${y - 3} 54 ${y}L52 ${y + 6}Q48 ${y + 8} 45 ${y + 8}Q42 ${y + 8} 38 ${y + 6}Z`, '#fff7e6', 2.2) + E(45, y + 8, 2.6, 3, C.oxide, 1.5) + E(45, y + 8, 0.9, 1.1, C.butter, 0);

function chaperoneAsleep() {
  const { skin, shade, cardigan, cardiganShade, cardiganLit } = FINCH;
  const f = 120;
  let s = foldingChair(f);
  s += shoes(f);
  s += tweedSkirt(82, 106, 'M24 80Q21 96 28 106L62 106Q69 96 66 80Z');
  // neck, cardigan
  s += R(40, 42, 10, 10, 3, skin, 2.6);
  s += F('M27 56Q29 49 39 48L52 48Q62 49 64 56L67 85L23 85Z', cardigan, 3) + S('M25 80q20 4 40 0', cardiganShade, 2.2);
  s += cardiganFront(48, 84) + collar(48);
  // arms down to hands folded over the ruler in her lap
  s += F('M27 55Q18 57 18 69L20 79Q22 85 31 84L43 80L41 72L30 72L31 59Z', cardigan, 3) + F('M63 55Q72 57 72 69L70 79Q68 85 59 84L47 80L49 72L60 72L59 59Z', cardigan, 3);
  s += S('M22 62q1 -3 4 -4M68 62q-1 -3 -4 -4', cardiganLit, 2);
  s += ruler(70, { transform: 'translate(10 83.5) rotate(-6)' });
  s += F('M37 73Q45 69.5 53 73Q55.5 78 51 81.5Q45 84.5 39 81.5Q34.5 78 37 73Z', skin, 2.6) + S('M41 75.5q4 2 8 0M41.5 79q3.5 1.5 7 0', shade, 1.6);
  s += G(finchHead(false), { transform: 'translate(26 9) rotate(16 20 41)' });
  write('room/chaperone55_asleep', 90, 122, s);
}

function chaperoneAwake() {
  const { skin, shade, cardigan, cardiganShade, cardiganLit } = FINCH;
  const f = 128;
  let s = foldingChair(f);
  s += shoes(f);
  s += tweedSkirt(84, 114, 'M27 82Q22 100 26 114L64 114Q68 100 63 82Z');
  s += R(40, 46, 10, 10, 3, skin, 2.6);
  s += F('M28 60Q30 53 40 52L51 52Q61 53 63 60L64 87L26 87Z', cardigan, 3) + S('M27 82q18 4 37 0', cardiganShade, 2.2);
  s += cardiganFront(52, 86) + collar(52);
  // fist on hip
  s += F('M62 58Q72 59 76 68Q79 76 71 80L62 82L60 74L66 71L60 64Z', cardigan, 3) + S('M70 65q3 3 3 7', cardiganLit, 2);
  s += F('M56 74Q62 72 64 77Q65 83 59 84Q54 84 55 79Z', skin, 2.4);
  // the ruler arm: straight out at the intruder
  s += ruler(46, { transform: 'translate(13 54) rotate(-101)' });
  s += F('M30 58Q24 52 16 55L10 58L13 66L21 65L30 70Z', cardigan, 3) + S('M17 58q4 -2 8 0', cardiganLit, 2);
  s += F('M8 53Q14 50 17 55Q18 62 12 63Q6 63 7 57Z', skin, 2.4) + S('M10 55.5l5 1.5M9.5 59l5 1.5', shade, 1.5);
  
  s += G(finchHead(true), { transform: 'translate(63 11) scale(-1 1) rotate(-5 20 41)' });
  write('room/chaperone55_awake', 90, 130, s);
}

// ---------------------------------------------------------------- loading dock (decor under the chaperone's chair)

function dock() {
  const W = 320;
  const H = 104;
  const wood = C.wood;
  const dark = '#3d2c3a';
  // the shadowed void under the deck, posts and cross braces, then the plank deck on top
  let s = R(6, 12, W - 12, H - 13, 0, '#241d33', 0, { opacity: 0.82 });
  for (const x of [34, 126, 218]) s += tube(`M${x} 18L${x + 68} ${H - 4}M${x + 68} 18L${x} ${H - 4}`, '#6e4c4c', 5, 3);
  for (const x of [8, 100, 192, 284]) s += R(x, 12, 14, H - 13.5, 1.5, wood, 3) + S(`M${x + 4} 20V${H - 6}`, '#a67868', 2) + S(`M${x + 10.5} 20V${H - 6}`, dark, 1.6, { opacity: 0.6 });
  s += R(1.5, 1.5, W - 3, 13, 3, C.ochre, 3) + S(`M6 5.2H${W - 6}`, C.cream, 2);
  for (let x = 42; x < W - 10; x += 40) s += S(`M${x} 3V13`, INK, 1.8);
  for (let x = 22; x < W; x += 40) s += E(x, 10.5, 1.2, 1.2, INK, 0);
  write('room/dock55', W, H, s);
}

export function sleepers() {
  lyleAsleep();
  lyleAwake();
  chaperoneAsleep();
  chaperoneAwake();
  dock();
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { written } = await import('./lib.mjs');
  sleepers();
  for (const f of written) console.log(`${f.key}\t${f.w}x${f.h}\t${(f.bytes / 1024).toFixed(1)} KB`);
}
