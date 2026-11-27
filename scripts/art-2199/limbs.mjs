// Limbs for the 2199 residents (Artie, Penny, Moe) on the house rig: side view, facing right, each limb
// vertical with its joint at top-centre. They match the residents' own torso and head art: the 2199 ink
// (#211e35) at 2 px, flat fills, one highlight and one shade. Run: node scripts/art-2199/limbs.mjs
//
// upper_arm 26×60 · lower_arm 24×60 (hand included) · upper_leg 32×70 · lower_leg 30×72 (foot included)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const INK = '#211e35';
const ART_DIR = fileURLToPath(new URL('../../public/art/', import.meta.url));

/** Filled shape with the ink outline. */
const F = (d, fill, sw = 2) => `<path d="${d}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}"` : ''}/>`;
/** Open stroke. */
const S = (d, stroke, sw = 2) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
const E = (cx, cy, rx, ry, fill, sw = 2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${sw ? ` stroke="${INK}" stroke-width="${sw}"` : ''}/>`;

function write(key, w, h, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
  writeFileSync(`${ART_DIR}${key}.svg`, svg);
  console.log(`${key}\t${w}x${h}\t${svg.length} B`);
}

// The rig's limb silhouettes (rounded ends overlap the neighbour at each joint).
const UPPER_ARM = 'M13 1.5Q23.5 1 24.5 14L24.5 44Q25.5 58.5 14 58.5Q2.5 59.5 2.5 47L1.5 16Q.5 3.5 13 1.5Z';
const FOREARM = 'M12 1.5Q21.5 1.5 21.5 14L20 36Q19 41 21.5 44Q25 51 19.5 53.5Q18 59 11 58.5Q2.5 57.5 2.5 51L3.5 40L2.5 14Q1.5 2.5 12 1.5Z';
const UPPER_LEG = 'M16 1.5Q28.5 1.5 29.5 15L30.5 48Q31.5 67.5 18 68.5Q3.5 69.5 2.5 52L1.5 18Q.5 3.5 16 1.5Z';
const SHIN = 'M15 1.5Q26.5 1.5 25.5 17L22.5 53Q15 59 3.5 52L2.5 16Q1.5 3.5 15 1.5Z';

/** Artie Duvet: the mauve dressing gown from his torso, striped pyjamas under it, slippers. */
function artie() {
  const gown = '#83567b';
  const gownShade = '#5d445e';
  const gownLit = '#a5749a';
  const trim = '#d1a2a4';
  const skin = '#deaf8c';
  const skinShade = '#c08c6c';
  const pyjama = '#c3cbdd';
  const stripe = '#7b88ad';

  write('human/artie_upper_arm', 26, 60, F(UPPER_ARM, gown) + S('M6 43q7 5 15 1', gownShade, 2.4) + S('M8 9l-1 14', gownLit, 2.6));

  // wide gown sleeve with the pink turn-back cuff of his lapels, bare hand
  write('human/artie_lower_arm', 24, 60,
    F(FOREARM, skin) + S('M17 47l2 5m-10 2.5v-3', skinShade, 1.8) +
    F('M12 1.5Q21.5 1.5 21.5 14L22.5 34Q12 40 1.5 34L2.5 14Q1.5 2.5 12 1.5Z', gown) + S('M7 8v14', gownLit, 2.4) +
    F('M1.2 29Q12 35.5 22.8 29L22.5 39Q12 45.5 1.5 39Z', trim));

  // the gown's skirt down to the knee, pink hem, a sliver of pyjama below it
  write('human/artie_upper_leg', 32, 70,
    F(UPPER_LEG, pyjama) + S('M11 60v6m8 -6v6', stripe, 2.2) +
    F('M16 1.5Q28.5 1.5 29.5 15L30.5 50Q16 58 2.5 50L1.5 18Q.5 3.5 16 1.5Z', gown) + S('M8 11l1 20', gownLit, 2.6) + S('M21 7l2 36', gownShade, 2.4) +
    F('M2.2 43Q16 51 30.6 43L30.6 52Q16 60 2.6 52Z', trim));

  // striped pyjama leg, a soft slipper with a fleece collar
  write('human/artie_lower_leg', 30, 72,
    F(SHIN, pyjama) + S('M9 7l.5 40m7.5 -43l-.5 45', stripe, 2.6) + S('M5 46q9 5 17 0', stripe, 2) +
    F('M4 51l14 0l4.5 6.5l5 3q3 3 1 8.5q-12.5 4 -25.5 -1l-1 -8Z', trim) + S('M4 66.5q12 4.5 23.5 0', gownShade, 2.4) +
    F('M3 49Q13 54 23 49L23 55Q13 60 3.5 55Z', '#f1ddd3'));
}

/** Penny Thumb: the khaki travel suit from her torso, sleeves rolled, the hitchhiker's thumb, walking boots. */
function penny() {
  const suit = '#978151';
  const suitShade = '#7d6a43';
  const suitLit = '#b9aa76';
  const strap = '#514457';
  const skin = '#ad775f';
  const skinShade = '#8c5c4b';
  const skinLit = '#c78e70';

  // sleeve with a buttoned shoulder tab
  write('human/penny_upper_arm', 26, 60,
    F(UPPER_ARM, suit) + S('M6 43q7 5 15 1', suitShade, 2.4) +
    F('M8 6h10l1 15q-6 3 -12 0Z', suitLit, 1.6) + E(13, 18, 1.6, 1.6, strap, 0));

  // rolled cuff, bare forearm, a travel wristband, and the thumb standing clear of the fist
  write('human/penny_lower_arm', 24, 60,
    F('M12 1.5Q21.5 1.5 21.5 14L19.5 33Q19.5 37 21.5 37.5Q24.5 38.5 23 44L21 48.5Q22.5 52 19 54Q17.5 59 11 58.5Q2.5 57.5 2.5 51L3.5 40L2.5 14Q1.5 2.5 12 1.5Z', skin) +
    S('M7 24v12', skinLit, 2.2) + S('M17 45q-1 4 -4 5m-4 4.5v-3', skinShade, 1.8) +
    F('M12 1.5Q21.5 1.5 21.5 14L21 18Q12 23 2.7 18L2.5 14Q1.5 2.5 12 1.5Z', suit) +
    F('M2 13Q12 18.5 22 13L21.7 21Q12 26.5 2.4 21Z', suitLit) +
    F('M3.2 38.5Q11 42 19.7 38.5L19.7 43Q11 46.5 3.3 43Z', strap, 1.6));

  // cargo pocket with a flap
  write('human/penny_upper_leg', 32, 70,
    F(UPPER_LEG, suit) + S('M7 55q9 6 20 0', suitShade, 2.4) + S('M7 9l1 12', suitLit, 2.4) +
    F('M10 26h15l-1 20q-6.5 3 -13 0Z', suitLit, 1.8) + F('M9 24h17v7q-8.5 3 -17 0Z', suit, 1.8) + E(17.5, 29, 1.5, 1.5, strap, 0));

  // trouser leg bloused into a tall walking boot, cream sole
  write('human/penny_lower_leg', 30, 72,
    F(SHIN, suit) + S('M8 9v16', suitLit, 2.4) +
    F('M3.1 37L24.3 37L23 56.5l5 3q3.5 3 1.5 9q-13 4.5 -27 0Z', strap) +
    F('M2 31Q14 37.5 25.5 31L25 40Q14 46 2.5 40Z', suitShade) +
    S('M9 47h9m-9 5h9', '#b9aa76', 2) + S('M3.5 67q13 4.5 25.5 0', '#e5d6ad', 2.6) + S('M22 60l4 2.5', '#7c6c85', 1.8));
}

/** Moe Dread: complaint-bureau robot. Brushed steel tubes, brass ball joints, mint status lights, a two-jaw grip. */
function moe() {
  const steel = '#8999ab';
  const seam = '#6e7d8f';
  const steelLit = '#c2ced6';
  const dark = '#43465e';
  const brass = '#dfaa55';
  const brassLit = '#f3d08e';
  const mint = '#9bd8c4';

  // brass shoulder ball over a steel tube
  write('human/moe_upper_arm', 26, 60,
    F('M4 12h18v37q0 9.5 -9 9.5t-9 -9.5Z', steel) + S('M8 22v20', steelLit, 2.4) + S('M4.5 46h17', seam, 2.2) +
    E(13, 11, 10.5, 9.5, brass) + S('M8 7q3 -3 7 -2', brassLit, 2.2));

  // dark elbow hinge with a brass pin, mint status band, wrist collar and a two-jaw grip
  write('human/moe_lower_arm', 24, 60,
    F('M4.5 40h15l2.5 8q1 9 -4.5 10.5l-2 -8h-7l-2 8q-5.5 -1.5 -4.5 -10.5Z', steelLit) +
    F('M4 10h16l-.5 30h-15Z', steel) + S('M8 20v10', steelLit, 2.2) + S('M5 33.5h14', mint, 3) +
    F('M2.5 37.5h19v6.5h-19Z', dark) +
    E(12, 10, 9.5, 8.5, dark) + E(12, 10, 3, 3, brass, 1.4));

  // brass hip ball, steel thigh, dark knee cap
  write('human/moe_upper_leg', 32, 70,
    F('M5 13h22l.5 44q0 11.5 -11.5 11.5t-11.5 -11.5Z', steel) + S('M10 24v22', steelLit, 2.6) + S('M5.5 34h21', seam, 2.2) +
    F('M3.5 52Q16 46 28.5 52L28.5 59Q16 65 3.5 59Z', dark) +
    E(16, 12, 12.5, 10.5, brass) + S('M9 8q4 -4 9 -3', brassLit, 2.4));

  // steel shin with a mint level gauge, dark ankle ring, a heavy flat foot with a brass toe
  write('human/moe_lower_leg', 30, 72,
    F('M4 9h21l-1.5 44h-18.5Z', steel) + E(14.5, 9, 10.5, 7.5, steel) + S('M8 12q5 -4 11 -2', steelLit, 2.2) +
    F('M10.5 19h8v20h-8Z', dark, 1.6) + S('M14.5 33v3m0 -9v2.5', mint, 3.4) +
    F('M2 51l26.5 7q3 3.5 1 10.5q-14 4 -27.5 0Z', dark) + F('M19 55.5l9.5 2.5q3 3.5 1 10.5q-5 1.5 -10.5 2Z', brass) +
    F('M2.5 46h22v8h-22Z', seam) + S('M3.5 66.5h14', steelLit, 2));
}

artie();
penny();
moe();
