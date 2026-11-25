// Town pickup art that is easier to generate than to write by hand:
//   - the two people (L3 astronomer, L8 Krix): one whole still figure `flight/pickup_<id>.svg` plus
//     the layers that move, cut from the same drawing with the boxes in src/flight/pickup-rig.ts
//   - the L7 shrimp tower (rows of shrimp round three tiers)
// The other pickups (flyer, photo board, crate, defibrillator) are hand-written SVGs.
//   node scripts/art-pickups.mjs
import { writeFileSync } from 'node:fs';
import { PERSON_RIGS, PICKUP_SIZE } from '../src/flight/pickup-rig.ts';

const INK = '#1b1433';
const out = (name) => new URL(`../public/art/flight/${name}.svg`, import.meta.url);
const n = (v) => String(Math.round(v * 100) / 100);
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
/** A line with an ink outline: the same path stroked twice. */
const pipe = (d, color, w, edge = 3.8) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${n(w + edge)}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${n(w)}"/>`;
const el = (cx, cy, rx, ry, fill, stroke = 0, extra = '') => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${stroke ? ` stroke="${INK}" stroke-width="${n(stroke)}"` : ''}${extra}/>`;
const rect = (x, y, w, h, r, fill, stroke = 0, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="${fill}"${stroke ? ` stroke="${INK}" stroke-width="${n(stroke)}"` : ''}${extra}/>`;
const path = (d, fill, stroke = 0, extra = '') => `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${INK}" stroke-width="${n(stroke)}"` : ''}${extra}/>`;
const line = (d, color, w, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n(w)}"${extra}/>`;

/** Write the whole figure and one SVG per rig layer. `layers[key suffix]` is drawn in figure px. */
function person(id, layers, face) {
  const rig = PERSON_RIGS[id];
  const [w, h] = PICKUP_SIZE[id];
  let whole = '';
  for (const part of rig.parts) {
    const suffix = part.key.slice(`flight/pickup_${id}_`.length);
    const art = layers[suffix];
    if (!art) throw new Error(`${id}: no drawing for layer ${suffix}`);
    whole += art + (part.face ? face : '');
    writeFileSync(out(`pickup_${id}_${suffix}`), svg(part.w, part.h, `<g transform="translate(${n(-part.x)} ${n(-part.y)})">${art}</g>`));
  }
  writeFileSync(out(`pickup_${id}`), svg(w, h, whole));
}

// ---------------------------------------------------------------- L3 volunteer astronomer
{
  const PARKA = '#ffbd68';
  const SKIN = '#ffc9a1';
  const body = [
    el(64, 100, 58, 10, INK, 0, ' opacity="0.38"'),
    // tripod and its mount (the dish layer sits on it)
    pipe('M38 60L20 100M38 60L38 104M38 60L56 100', '#a7b7ce', 2.8),
    rect(32, 54, 12, 11, 3, '#495374', 2.5),
    // camping chair: crossed legs, canvas back, seat
    pipe('M79 76L117 106M117 76L79 106', '#a7b7ce', 2.8),
    rect(76, 38, 44, 40, 7, '#468c89', 3),
    line('M80 45Q80 42 84 42H98', '#64c5a1', 2.4),
    path('M74 76H122L119 86H77Z', '#28575c', 3),
    // boots, jeans
    el(88, 101, 8, 5.5, '#594050', 2.6),
    el(108, 101, 8, 5.5, '#594050', 2.6),
    rect(82, 74, 13, 24, 5, '#495374', 2.8),
    rect(101, 74, 13, 24, 5, '#495374', 2.8),
    // parka
    path('M80 57Q82 53 98 53Q114 53 116 57L114 80Q98 84 82 80Z', PARKA, 3),
    line('M98 55V81', '#b56b49', 2),
    path('M83 75Q98 79 113 75L114 80Q98 84 82 80Z', '#b56b49', 0, ' opacity="0.55"'),
    // far arm, hand on the knee
    pipe('M113 60Q120 68 113 76', PARKA, 6.5, 5.5),
    el(111.5, 78.5, 4.8, 4.6, SKIN, 2.2),
    // near upper arm (the forearm and cup are their own layer)
    pipe('M84 60Q79 64 80 70', PARKA, 6.5, 5.5),
    // thermos on the grass
    rect(59, 82, 12, 22, 3.5, '#dc6866', 2.6),
    rect(60, 75, 10, 9, 2.5, '#a7b7ce', 2.4),
    line('M62.5 88V99', '#ebaa89', 2),
  ].join('');
  const dish = [
    `<g transform="rotate(-24 36 36)">${el(36, 38, 31, 25, '#a7b7ce', 3.2)}${el(36, 35, 30, 23, '#ffedc9', 3)}${el(37, 36, 22, 16, '#e5cc9f')}<ellipse cx="38" cy="37" rx="12" ry="8.5" fill="none" stroke="#bb9161" stroke-width="1.8"/></g>`,
    line('M22 22L58 12M48 54L58 12M24 46L58 12', INK, 2),
    pipe('M38 38L58 12', '#a7b7ce', 2.4, 3.1),
    el(58.5, 11.5, 6, 6, '#dc6866', 2.6),
    el(57, 10, 1.8, 1.8, '#ffedc9'),
    // the signal he is sure he is getting
    line('M68 6q5 3 4 9M74 2q8 5 6 15', '#7CFFCB', 2.2),
  ].join('');
  const head = [
    el(98, 40, 15.5, 15, SKIN, 3),
    // teal beanie, headphones over it, pom-pom
    path('M82.5 40Q82 24 98 24Q114 24 113.5 40Q98 33 82.5 40Z', '#468c89', 2.8),
    line('M84 38Q98 31 112 38', '#64c5a1', 2.6),
    pipe('M82 40Q81 19 98 19Q115 19 114 40', '#647899', 2, 3),
    el(98, 17.5, 5.5, 5, '#ffedc9', 2.4),
    rect(77.5, 35, 8, 14, 3.5, '#495374', 2.4),
    rect(110.5, 35, 8, 14, 3.5, '#495374', 2.4),
    el(88.5, 48, 2.6, 1.7, '#d3827c', 0, ' opacity="0.7"'),
    el(107.5, 48, 2.6, 1.7, '#d3827c', 0, ' opacity="0.7"'),
  ].join('');
  const arm = [
    // thermos cup with a wisp of steam, forearm, hand
    line('M91 59q-2 -3 0 -5M97 59q2 -3 0 -6', '#a7b7ce', 1.7),
    rect(88, 62, 12, 13, 2.5, '#ffedc9', 2.4),
    line('M90.5 66H97.5', '#e5cc9f', 1.8),
    pipe('M80 70Q84 77 90 77', PARKA, 6, 5),
    el(92, 76, 4.8, 4.6, SKIN, 2.2),
  ].join('');
  const face = [
    el(92.5, 43.5, 1.9, 2.4, INK),
    el(103.5, 43.5, 1.9, 2.4, INK),
    line('M93 49.5Q98 53.5 103 49.5', INK, 2.2),
  ].join('');
  person('astronomer', { body, dish, head, arm }, face);
}

// ---------------------------------------------------------------- L8 Krix and his toaster
{
  const JADE = '#64c5a1';
  const KNIT = '#262640';
  const body = [
    el(46, 110, 32, 5.5, INK, 0, ' opacity="0.42"'),
    // black turtleneck, a slate rim so it reads on dark ground
    path('M23 105Q21 78 33 69H59Q71 78 69 105Q46 110 23 105Z', KNIT, 3.2),
    line('M27.5 101Q26.5 82 35 73.5', '#495374', 2.6),
    rect(32, 60, 28, 13, 6, KNIT, 2.8),
    line('M36 64.5H50', '#495374', 2.2),
    el(35, 108.5, 9, 4.8, '#468c89', 2.5),
    el(57, 108.5, 9, 4.8, '#468c89', 2.5),
  ].join('');
  const head = [
    // swept antennae with mint bobbles
    pipe('M33 24Q26 8 14 11', JADE, 2.8, 3.4),
    pipe('M59 23Q66 6 78 9', JADE, 2.8, 3.4),
    el(13.5, 11, 4.8, 4.8, '#7CFFCB', 2.5),
    el(78.5, 9, 4.8, 4.8, '#7CFFCB', 2.5),
    // wide lumpy head
    path('M17 41Q16 19 46 17Q76 19 76 40Q76 53 66 59Q57 64 46 64Q35 64 26 59Q17 53 17 41Z', JADE, 3.4),
    path('M22 36Q24 23 43 21Q28 26 26.5 37Z', '#7CFFCB'),
    path('M27 57Q46 65 65 57Q57 61.5 46 61.5Q35 61.5 27 57Z', '#468c89'),
    el(24, 50, 4.2, 2.4, '#d3827c', 0, ' opacity="0.55"'),
    el(68, 50, 4.2, 2.4, '#d3827c', 0, ' opacity="0.55"'),
    // eye whites and round spectacles
    el(35, 40, 9.5, 11, '#ffedc9', 2.8),
    el(57, 39, 9, 11, '#ffedc9', 2.8),
    '<ellipse cx="35" cy="40" rx="12.4" ry="13.4" fill="none" stroke="#1b1433" stroke-width="3.4"/><ellipse cx="57" cy="39" rx="11.9" ry="13.4" fill="none" stroke="#1b1433" stroke-width="3.4"/>',
    '<ellipse cx="35" cy="40" rx="12.4" ry="13.4" fill="none" stroke="#ffbd68" stroke-width="1.5"/><ellipse cx="57" cy="39" rx="11.9" ry="13.4" fill="none" stroke="#ffbd68" stroke-width="1.5"/>',
    pipe('M22.6 39L18 37.5M69 38L74 36.5', '#ffbd68', 1.4, 1.8),
  ].join('');
  const toast = [
    path('M31 78Q31 73.5 37.5 73.5Q44 73.5 44 78V98H31Z', '#ffbd68', 2.6),
    path('M48 77Q48 72.5 54.5 72.5Q61 72.5 61 77V98H48Z', '#ffbd68', 2.6),
    line('M33.5 78.5Q33.5 76 37.5 76Q41.5 76 41.5 78.5M50.5 77.5Q50.5 75 54.5 75Q58.5 75 58.5 77.5', '#b56b49', 1.8),
    line('M35.5 83h4M52.5 82h4', '#b56b49', 1.6),
  ].join('');
  const front = [
    // chrome two-slot toaster
    rect(26, 80, 40, 24, 6, '#c3cfdf', 3.2),
    path('M28.5 98H63.5V99Q63.5 101.8 60 101.8H32Q28.5 101.8 28.5 99Z', '#647899', 0, ' opacity="0.5"'),
    line('M31 85Q31 83.5 33 83.5H48', '#fff7e1', 2.4),
    rect(30, 78.5, 32, 4.5, 2, '#222440', 2),
    rect(56.5, 87.5, 4.5, 9, 2, '#dc6866', 2),
    el(34.5, 96, 2.6, 2.6, '#495374', 1.6),
    // sleeves and both hands clamped on
    pipe('M27 76Q18 83 23 93', KNIT, 5.5, 4.6),
    pipe('M65 76Q74 83 69 93', KNIT, 5.5, 4.6),
    el(24.5, 94, 6.2, 5.6, JADE, 2.6),
    el(67.5, 94, 6.2, 5.6, JADE, 2.6),
    line('M22 92.5q2.5 -1.5 5 0M65 92.5q2.5 -1.5 5 0', '#468c89', 1.6),
  ].join('');
  const face = [
    el(37, 42, 4.4, 5.8, INK),
    el(58.5, 41, 4.4, 5.8, INK),
    el(35.6, 39.6, 1.5, 1.5, '#d8ffdf'),
    el(57.1, 38.6, 1.5, 1.5, '#d8ffdf'),
    line('M40 56Q46 60 52 56', INK, 2.2),
  ].join('');
  person('krix', { body, head, toast, front }, face);
}

// ---------------------------------------------------------------- L7 shrimp tower on its buffet cart
{
  const [w, h] = PICKUP_SIZE.shrimp_tower;
  const SHRIMP = 'M-5.5 -1Q-6 -8 0.5 -8Q7 -8 6.5 -1Q6 5 0.5 6.5';
  /** One curled shrimp hooked over a rim, tail out. */
  const shrimp = (x, y, turn) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(turn)})">`
    + `<path d="${SHRIMP}" fill="none" stroke="${INK}" stroke-width="6.6"/><path d="M-1 6L-4.5 10.5L2.5 10Z" fill="#dc6866" stroke="${INK}" stroke-width="1.8"/>`
    + `<path d="${SHRIMP}" fill="none" stroke="#ff9478" stroke-width="3.6"/><path d="M-3.6 -5.6L-1.6 -3.2M1 -6.8L1 -3.6M5 -4.6L3 -2.6" fill="none" stroke="#dc6866" stroke-width="1.3"/></g>`;
  /** A silver tier with crushed ice and a row of shrimp over its front rim. */
  const tier = (cy, rx, ry, count) => {
    let s = el(52, cy + 3, rx, ry, '#647899', 2.8) + el(52, cy, rx, ry, '#c3cfdf', 3) + el(52, cy - 0.5, rx - 5, ry - 2.6, '#d8ffdf');
    s += line(`M${n(52 - rx + 7)} ${n(cy - 1)}q4 -3 9 -3`, '#fff7e1', 1.8);
    for (let i = 0; i < count; i++) {
      const a = Math.PI * (0.1 + (0.8 * i) / (count - 1));
      s += shrimp(52 + Math.cos(a) * (rx - 3), cy + Math.sin(a) * (ry - 1) + 3, (Math.PI / 2 - a) * 28);
    }
    return s;
  };
  const art = [
    el(52, 108, 46, 6.5, INK, 0, ' opacity="0.42"'),
    el(22, 106, 5, 5, '#222440', 2.4),
    el(82, 106, 5, 5, '#222440', 2.4),
    // plum tablecloth with a brass hem
    path('M8 80L11 101Q52 110 93 101L96 80Z', '#604569', 3.2),
    line('M12.5 97.5Q52 106 91.5 97.5', '#ffbd68', 2.2),
    line('M24 86V95M40 88V98M64 88V98M80 86V95', '#4a3352', 2),
    el(52, 80, 44, 11, '#a387b1', 3.2),
    el(52, 79.5, 37, 8, '#d3b9d1', 0, ' opacity="0.45"'),
    // centre pole, three tiers, sauce bowl and lemon on top
    pipe('M52 18V76', '#a7b7ce', 2.8),
    tier(71, 35, 9.5, 6),
    tier(48, 26, 7.5, 5),
    tier(28, 17, 5.5, 3),
    path('M43.5 16H60.5Q60 23.5 52 23.5Q44 23.5 43.5 16Z', '#c3cfdf', 2.6),
    el(52, 16, 8.5, 3.6, '#dc6866', 2.4),
    el(50, 15.2, 3, 1.1, '#ebaa89'),
    path('M57 13.5Q60 5 67.5 7.5Q66 14.5 57 13.5Z', '#ffe49b', 2.2),
    el(52, 8, 3, 3, '#ffbd68', 2.2),
  ].join('');
  writeFileSync(out('pickup_shrimp_tower'), svg(w, h, art));
}

console.log('wrote the astronomer, Krix (whole + layers) and the shrimp tower to public/art/flight/');
