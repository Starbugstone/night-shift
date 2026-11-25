// L9 sleepers: doc, buff and marvin on the doyle/larry rig (side view, facing right).
// Seven parts each: head, head_awake (70×80, neck at bottom centre), torso (80×120), upper_arm (26×60),
// lower_arm (24×60, hand included), upper_leg (32×70), lower_leg (30×72, shoe included).
import { C, E, F, G, INK, R, S, path, write } from './lib.mjs';

const HEAD = 'M24 77L23 64Q12 61 11 50L8 30Q8 12 28 7Q50 4 56 22L58 36L66 42Q68 47 58 48L58 58Q54 68 45 68L44 77Z';
const JAW = 'M22 77L21 65Q10 61 10 50L8 30Q8 12 28 7Q50 4 56 22L58 36L66 42Q68 47 59 48L61 60Q58 72 44 72L43 77Z';
const TORSO = 'M28 5Q42 1 55 9Q72 10 76 29L69 51Q77 69 74 88L70 111Q49 120 24 116L6 111L12 75L13 52L4 32Q5 16 20 11Z';
const UPPER_ARM = 'M13 2Q23 1 24 14L24 44Q25 58 14 58Q3 59 3 47L2 16Q1 4 13 2Z';
const SLEEVE = 'M12 2Q21 2 21 14L20 40Q11 45 3 40L2 15Q2 3 12 2Z';
const HAND = 'M12 2Q21 2 21 14L19 36Q18 41 21 44Q25 51 19 53Q18 59 11 58Q3 57 3 51L4 40L3 14Q2 3 12 2Z';
const UPPER_LEG = 'M16 2Q28 2 29 15L30 48Q31 67 18 68Q4 69 3 52L2 18Q1 4 16 2Z';
const SHIN = 'M15 2Q26 2 25 17L22 53Q15 59 4 52L3 16Q2 4 15 2Z';
const SHOE = 'M5 50l13 1l4 7l5 3q3 3 1 8q-12 4 -25 -1l-1 -8Z';

const ear = (skin, shade) => E(19, 44, 6, 8, skin, 2.5) + S('M16 45q2 -7 7 -3l-3 4', shade, 2.3);
const neckShade = (shade) => path('M24 62Q32 70 46 65L42 75H28Z', { fill: shade });
/** Sleeping face: one shut eye, a slack snoring mouth. */
const asleep = (brow, browD = 'M37 33q6 -4 12 -1m5 -1l4 -1') =>
  S('M35 39Q42 46 50 38M52 38q4 4 8 -1', INK, 2.8) + S(browD, brow, 2.8) + E(51, 57, 3.5, 4.1, INK, 0) + E(52, 59, 1.7, 1, '#d3827c', 0);
/** Startled face: two wide eyes; `far`/`near` set how wide each one snaps. */
const awake = (brow, browD, near = [10, 11], far = [7, 9], mouth = [5.7, 8]) =>
  E(55, 37, far[0], far[1], C.custard, 2) + E(43, 39, near[0], near[1], C.custard, 2.6) + E(46, 38, 2.6, 3, INK, 0) + E(57, 36, 1.9, 2.3, INK, 0) +
  S(browD, brow, 2.8) + E(51, 58, mouth[0], mouth[1], INK, 0) + E(52, 58 + mouth[1] * 0.5, mouth[0] * 0.5, mouth[1] * 0.22, '#d3827c', 0);

function doc() {
  const skin = '#ffc9a1';
  const shade = '#ebaa89';
  const coat = '#d9cdb4';
  const coatShade = '#b3a58c';
  const hairD = 'M20 48Q8 51 1 40Q9 37 7 28Q-2 17 7 6Q11 15 17 12Q20 -1 35 1Q34 9 41 8Q50 -1 64 6Q57 12 58 22L44 21Q30 18 25 30L21 41Z';
  const head = (face) =>
    F(HEAD, skin, 3.5) + neckShade(shade) + S('M58 36L66 42', shade, 2) +
    F(hairD, '#f6f7f5', 3) + S('M6 39q6 -3 8 -9M8 13q4 6 3 12M22 6q4 4 3 10M40 11q8 -4 16 -2M14 25q6 -4 8 2', C.steel, 2.2) + S('M30 5q2 4 0 9M50 8q3 3 2 8', '#d0d8e2', 2) +
    ear(skin, shade) + face + S('M40 66q5 2 9 -1', shade, 2);
  write('human/doc_head', 70, 80, head(asleep('#8792a6', 'M35 32q7 -5 13 -1m4 -2l5 -1')));
  // brows lift separately under the tufts
  write('human/doc_head_awake', 70, 80, head(awake('#8792a6', 'M33 25q7 -8 14 -3m5 -4l7 -1', [10.5, 11.5], [7.5, 9.5], [6.2, 8.4])));

  // torso: long oatmeal lab coat, shirt and a loose tie, pens in the pocket
  let t = F(TORSO, coat, 3.5) + S('M15 44l6 13l-4 25', coatShade, 3) + S('M13 103q23 9 52 1', coatShade, 2.8);
  t += F('M25 10l15 5l13 -6l9 12l-15 52l-13 10l-12 -48Z', '#8fb0b8', 3) + F('M39 20l8 -1l-1 8l9 31l-7 11l-8 -8l3 -31Z', C.oxide, 2);
  t += F('M22 10l-8 18l9 6l-4 8l20 40l-10 -61ZM56 10l9 10l-3 9l5 4l-19 44l7 -51Z', coat, 2.2) + S('M40 74V112', coatShade, 2.4);
  t += R(51, 66, 15, 16, 2, coat, 2.2) + S('M55 62v8M59 61v9M63 63v7', INK, 2) + S('M55 62v2M59 61v2', C.red, 2) + S('M63 63v2', '#7cf59a', 2);
  t += E(45, 86, 2.2, 2.2, C.tobacco, 1.4) + E(45, 100, 2.2, 2.2, C.tobacco, 1.4) + S('M12 84l16 3', '#f1ead8', 2.4);
  write('human/doc_torso', 80, 120, t);
  write('human/doc_upper_arm', 26, 60, F(UPPER_ARM, coat, 3) + S('M6 42q6 5 14 1', coatShade, 2) + S('M8 9l-1 12', '#f1ead8', 2.5));
  // rolled sleeve with a dark cuff, bare forearm and hand
  write('human/doc_lower_arm', 24, 60, F(HAND, skin, 3) + F('M12 2Q21 2 21 14L21 26Q11 31 3 26L2 15Q2 3 12 2Z', coat, 3) + F('M2.6 22Q11 27 21.4 22L21 30Q11 35 3 30Z', '#5a4d68', 2) + S('M17 47l2 5m-10 2v-3', shade, 1.8) + S('M7 8v10', '#f1ead8', 2.2));
  write('human/doc_upper_leg', 32, 70, F(UPPER_LEG, '#6f5243', 3) + S('M7 53q9 6 19 0', '#4a362e', 2.5) + S('M8 11l1 16', C.tobacco, 2) + S('M13 10l3 42', '#5a4338', 2));
  write('human/doc_lower_leg', 30, 72, F(SHIN, '#6f5243', 3) + S('M6 47q6 4 15 0', '#4a362e', 3) + F(SHOE, '#3a2b25', 3) + S('M4 66q12 5 23 0', INK, 2) + S('M16 57l5 2', C.tobacco, 1.6) + S('M5 52h14', C.custard, 2.6));
}

function buff() {
  const skin = '#f5bd97';
  const shade = '#d99a78';
  const leather = C.aubergine;
  const leatherShade = '#453a52';
  const leatherLit = '#8f81a3';
  const hairD = 'M12 46Q4 32 8 19Q13 6 30 4Q48 -2 64 9Q68 18 59 21Q52 13 43 20Q31 18 26 30L22 43Z';
  const head = (face) =>
    F(JAW, skin, 3.5) + path('M22 63Q32 72 46 68L42 76H26Z', { fill: shade }) + S('M58 36L66 42', shade, 2) +
    // low black quiff with a pale plane along it
    F(hairD, '#2a2233', 3) + S('M16 20Q22 9 38 8Q50 6 58 11', C.steel, 2.6) + S('M30 14q10 -3 18 0', '#6d6480', 2) + F('M22 40l4 0l-1 12l-4 -2Z', '#2a2233', 1.6) +
    ear(skin, shade) + face + S('M44 68q7 3 13 -3', shade, 2.4);
  write('human/buff_head', 70, 80, head(asleep('#2a2233', 'M36 33q6 -3 12 0m5 -1l5 0') + S('M53 61q1 4 0 7', '#b9d6e8', 2)));
  // one eye snaps wider than the other
  write('human/buff_head_awake', 70, 80, head(awake('#2a2233', 'M33 26q7 -6 14 -1m4 3l7 1', [11, 12], [5.6, 6], [6.4, 6])));

  // torso: leather jacket, collar turned up, cream T-shirt
  let t = F(TORSO, leather, 3.5) + S('M15 44l6 13l-4 25', leatherShade, 3);
  t += F('M30 8Q42 4 54 10L60 26L52 96Q44 104 34 98L26 24Z', C.custard, 3) + S('M32 14Q42 22 53 14', '#e5cc9f', 2.4) + S('M36 60q7 3 13 0', '#e5cc9f', 2);
  t += F('M22 8L12 22L22 34L26 96L36 112L24 116L6 111L12 75L13 52L4 32Q5 16 20 11Z', leather, 2.6) + F('M56 8L66 16L60 30L58 96L48 114L70 111L74 88Q77 69 69 51L76 29Q72 10 55 9Z', leather, 2.6);
  // turned-up collar and zip
  t += F('M22 8L10 4L8 24L22 34L28 18Z', leatherLit, 2.6) + F('M56 8L68 6L66 26L58 32L52 18Z', leatherLit, 2.6) + S('M57 34V104', C.steel, 2) + S('M57 40h0M57 52h0M57 64h0M57 76h0M57 88h0', '#eef1f4', 3);
  t += S('M10 100q8 5 18 5M52 108q10 0 18 -3', leatherShade, 3) + S('M9 60q2 -6 6 -8M68 56q3 4 3 10', leatherLit, 2.4) + R(60, 60, 9, 4, 1.5, C.steel, 1.4);
  write('human/buff_torso', 80, 120, t);
  write('human/buff_upper_arm', 26, 60, F(UPPER_ARM, leather, 3) + S('M6 42q6 5 14 1', leatherShade, 2.4) + S('M8 9l-1 14', leatherLit, 2.5) + S('M5 20q7 4 15 0', leatherShade, 2));
  write('human/buff_lower_arm', 24, 60, F(HAND, skin, 3) + F(SLEEVE, leather, 3) + F('M2.6 31Q11 36 21 31L20.4 40Q11 45 3 40Z', leatherShade, 2) + S('M11 33v9', C.steel, 1.6) + S('M17 47l2 5m-10 2v-3m4 4v-4', shade, 1.8) + S('M7 8v14', leatherLit, 2.2));
  // rolled-cuff denims and engineer boots
  write('human/buff_upper_leg', 32, 70, F(UPPER_LEG, C.slateBlue, 3) + S('M7 53q9 6 19 0', '#343756', 2.5) + S('M8 11l1 16', C.denim, 2.2) + S('M22 8l2 44', '#343756', 2));
  write('human/buff_lower_leg', 30, 72, F(SHIN, C.slateBlue, 3) + F('M3.4 34Q14 40 24 34L22.6 46Q14 52 4 46Z', C.denim, 2.4) + S('M6 40q8 4 15 0', '#a7b7ce', 1.6) +
    F('M3.6 46L22.4 46l0 10l5 3q4 3 2 9q-13 5 -27 0Z', '#2a2233', 3) + S('M3 66q13 5 27 0', INK, 2.4) + S('M5 53h17', C.steel, 2.6) + R(11, 51.2, 5, 4, 1, C.gold, 1.2));
}

function marvin() {
  const skin = '#9a6548';
  const shade = '#7a4d3a';
  const lit = '#b87f5e';
  const jacket = C.plum;
  const jacketShade = '#463352';
  const jacketLit = '#8a6b94';
  // swept wave with a shaved part
  const hairD = 'M12 44Q5 30 9 19Q13 7 28 6Q36 -2 50 2Q62 4 62 14Q56 11 52 14Q57 18 56 23L44 22Q30 19 26 30L22 42Z';
  const head = (face) =>
    F(HEAD, skin, 3.5) + neckShade(shade) + path('M40 44Q48 40 56 46Q52 56 42 56Z', { fill: lit, opacity: 0.55 }) +
    F(hairD, '#2a2233', 3) + S('M30 9Q40 2 52 6', '#6d6480', 2.4) + S('M16 22Q20 12 30 10', '#6d6480', 2) + S('M27 29Q32 20 44 22', skin, 1.8) +
    ear(skin, shade) + face + S('M47 51q5 -2 9 0', '#2a2233', 2.2);
  write('human/marvin_head', 70, 80, head(asleep('#2a2233')));
  // raised brow and a little O mouth
  write('human/marvin_head_awake', 70, 80, head(awake('#2a2233', 'M34 26q7 -7 14 -2m5 1l5 -1', [10, 11], [7, 9], [4, 4.8])));

  // torso: plum band jacket, satin cream lapels, bow tie, a guitar pick for a pocket square
  let t = F(TORSO, jacket, 3.5) + S('M15 44l6 13l-4 25', jacketShade, 3) + S('M13 103q23 9 52 1', jacketShade, 2.8);
  t += F('M27 8l13 6l13 -6l5 10l-14 60l-8 4l-12 -62Z', '#fff7e6', 3) + S('M41 30v40', '#e5cc9f', 2) + E(41, 38, 1.6, 1.6, INK, 0) + E(41, 50, 1.6, 1.6, INK, 0) + E(41, 62, 1.6, 1.6, INK, 0);
  t += F('M22 10l-9 16l8 8l-3 8l22 44l-10 -66ZM56 10l10 10l-4 10l5 5l-21 51l5 -66Z', C.custard, 2.4) + S('M24 20l10 44M58 20l-8 44', '#e5cc9f', 2.2);
  t += F('M40 16L28 9v15ZM40 16L52 9v15Z', C.oxide, 2.4) + E(40, 16, 3.4, 3.4, '#7d4c52', 1.8);
  t += F('M56 50l10 -2l-4 11Q59 61 57 58Z', C.custard, 2) + S('M54 62h14', jacketShade, 2.4);
  t += E(42, 92, 2.6, 2.6, C.gold, 1.4) + E(42, 104, 2.6, 2.6, C.gold, 1.4) + S('M12 84l15 4m32 -24l12 -3', jacketLit, 2.4);
  write('human/marvin_torso', 80, 120, t);
  write('human/marvin_upper_arm', 26, 60, F(UPPER_ARM, jacket, 3) + S('M6 42q6 5 14 1', jacketShade, 2.4) + S('M8 9l-1 14', jacketLit, 2.5));
  // loose wrist: fingers still curled round an imaginary guitar neck
  write('human/marvin_lower_arm', 24, 60, F('M12 2Q21 2 21 14L19 36Q18 41 21 44Q25 49 21 53Q23 57 18 58Q10 60 6 56Q2 52 4 46L4 40L3 14Q2 3 12 2Z', skin, 3) + S('M8 49q4 -4 9 -2M9 54q4 -3 9 -1', shade, 2) + S('M16 46q4 1 4 5', lit, 1.8) +
    F(SLEEVE, jacket, 3) + F('M2.6 32Q11 37 21 32L20.4 40Q11 45 3 40Z', '#fff7e6', 2) + E(12, 39, 1.8, 1.8, C.gold, 1) + S('M7 8v14', jacketLit, 2.2));
  write('human/marvin_upper_leg', 32, 70, F(UPPER_LEG, '#463352', 3) + S('M7 53q9 6 19 0', '#2a2233', 2.5) + S('M22 6l3 50', C.custard, 2.4) + S('M8 11l1 16', jacket, 2.2));
  write('human/marvin_lower_leg', 30, 72, F(SHIN, '#463352', 3) + S('M6 47q6 4 15 0', '#2a2233', 3) + S('M19 6l-1 44', C.custard, 2.4) +
    F(SHOE, '#2a2233', 3) + F('M4 55l8 2l7 -3l3 6l-7 5l-11 -1Z', C.custard, 1.6) + S('M4 66q12 5 23 0', INK, 2) + S('M21 61q3 1 5 3', '#8792a6', 1.6));
}

export function humans() {
  doc();
  buff();
  marvin();
}
if (import.meta.url === `file://${process.argv[1]}`) humans();
