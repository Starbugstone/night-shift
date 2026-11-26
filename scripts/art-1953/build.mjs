import { E, F, G, R, S, lin, write } from '../art-l9/lib.mjs';

const copper = '#c77b51';
const lit = '#edb386';
const dark = '#593749';
const ink = '#201a33';
const cream = '#ede4c4';
const blue = '#a4b7d3';
const cloth = '#6b6091';
const copperDef = lin('copper', 0, 0, 55, 100, [[0, '#ffe2ae'], [0.45, copper], [1, '#7b4850']]);
const metal = 'url(#copper)';

function hull() {
  return F('M5 52Q34 24 71 24Q105 12 138 24Q178 28 213 56Q194 74 150 79Q84 95 22 73Z', metal, 4) +
    F('M8 53Q57 66 108 62Q161 63 210 55L203 63Q153 78 108 76Q49 78 14 63Z', dark, 3) +
    S('M37 47Q106 22 167 43M32 69Q100 90 188 66', lit, 3) +
    [-44, -22, 0, 22, 44].map(dx => E(107 + dx, 69, 4, 2, '#ffd9a0', 0)).join('');
}
const hood = F('M99 115Q82 95 84 72L91 39Q93 20 81 17Q71 12 65 22L51 35Q46 43 28 53L13 42Q30 20 47 10Q75 -3 92 8Q110 15 110 38L101 70Q96 89 118 98Z', copper, 4) +
  S('M20 40Q49 3 75 12Q103 7 101 37L92 71', lit, 5) +
  F('M13 42l15 11 13 -8 -15 -13Z', '#452739', 3) + E(26, 43, 7, 4, '#eee0f4', 2);
write('flight/invasion_sick_tripod_top', 276, 236,
  E(138, 145, 113, 70, '#261b32', 0, { opacity: .74 }) +
  F('M71 135L43 174L18 180L10 193L45 198L68 189L109 150Z', copper, 4) +
  F('M183 141L219 165L226 198L258 213L267 203L243 189L238 155L204 115Z', copper, 4) +
  S('M45 181l36 -37m151 13 8 34', lit, 5) +
  G(hull(), { transform: 'translate(25 72)' }) + G(hood, { transform: 'translate(92 39)' }) +
  E(139, 170, 18, 12, '#372337', 4) + S('M125 174q20 14 31 -2', lit, 4), copperDef);
write('flight/invasion_screen_top', 540, 112,
  R(4, 13, 532, 94, 10, '#303450', 5) + R(14, 17, 512, 77, 6, '#aab4c9', 3) +
  F('M15 67L99 51L194 66L284 55L425 62L525 44L525 92H15Z', '#8993ad', 0) +
  G(hull() + E(108, 105, 70, 4, '#66708a', 0), { transform: 'translate(177 5) scale(.82 .73)' }) +
  S('M21 23H516M24 102H509', '#e3ddc7', 3) + R(18, 101, 48, 9, 2, '#64566a', 2) + R(473, 101, 48, 9, 2, '#64566a', 2), copperDef);
write('flight/invasion_projector_top', 84, 78,
  R(4, 7, 76, 60, 11, '#393951', 4) + R(12, 13, 60, 42, 8, '#786a7c', 3) +
  E(24, 29, 10, 10, '#aa9a9c', 2) + E(54, 29, 13, 13, '#aa9a9c', 2) +
  S('M24 22v14m-6 -7h12m24 -10v20m-10 -10h20', '#5a4c66', 3) +
  R(30, 45, 24, 29, 6, '#41344a', 3) + R(32, 62, 20, 11, 4, '#e0e6f8', 2));
write('flight/invasion_ice_pack', 56, 35,
  F('M6 20Q2 13 13 9L28 4Q38 2 42 12L53 19Q58 29 45 32L15 32Q5 31 6 20Z', '#b1badc', 3) +
  R(21, 2, 15, 9, 3, '#d9d8ea', 2) + S('M11 23q16 5 34 -3m-23 -3 13 -3', '#e3e8fa', 3));
write('flight/invasion_scarf', 96, 34,
  F('M3 5Q21 1 46 13Q70 23 92 13L93 28Q67 35 42 23Q18 14 4 22Z', '#7676b2', 3) +
  S('M11 9l3 10m11 -7 2 9m10 -5 2 9m39 -4 2 7m4 -8 2 6', '#bcb1dd', 3));
write('flight/invasion_3d_glasses', 32, 14,
  F('M1 3h30v9H20l-3 -4h-2l-3 4H1Z', '#eee4d2', 1) +
  R(3, 5, 9, 5, 1, '#b3848c', 0) + R(20, 5, 9, 5, 1, '#7cabbf', 0));
write('flight/invasion_crowd_top', 78, 68,
  G(E(19, 37, 16, 12, '#696388', 3) + E(19, 22, 10, 10, '#c49583', 3) +
    E(41, 51, 15, 13, '#b87a71', 3) + E(41, 39, 9, 10, '#9e6f63', 3) +
    E(58, 34, 16, 14, '#6b879b', 3) + E(58, 19, 10, 11, '#d0a788', 3) +
    S('M62 32L74 20M14 38L4 31', '#d0a788', 6) + E(74, 19, 3, 4, '#d0a788', 1), { transform: 'rotate(90 39 34)' }));
write('flight/invasion_child_clap_top', 42, 40,
  E(21, 12, 10, 10, '#bc826e', 2) + E(21, 28, 17, 11, '#7775a6', 3) +
  S('M10 25l9 -8m13 8 -9 -8', '#e1ad8c', 5) + E(21, 17, 3, 3, '#f8c199', 1));
write('flight/pickup_tripod_leg', 104, 124,
  F('M13 11l13 -6 4 8 9 1 4 11 32 21q4 6 0 16L64 93L47 93l5 -38L16 32l3 -7Z', metal, 4) +
  E(63, 54, 15, 12, copper, 3) + E(63, 54, 7, 7, lit, 2) + E(22, 20, 9, 7, '#493145', 2) +
  S('M38 29l17 13m4 24 -5 19', lit, 4) +
  F('M48 82q13 -1 22 10l14 6 12 13 -8 6 -21 -7 4 9 -12 2 -16 -13 -15 5 -10 -6 9 -11Z', metal, 4) +
  S('M33 104l21 -9 23 9m-24 -7 6 12', lit, 3), copperDef);
write('flight/doyle_coop_top', 130, 94,
  F('M14 47h103v36l-21 8H23L8 78Z', '#684751', 4) +
  F('M4 52L23 12L84 4L126 41L116 66L57 73Z', '#887574', 4) +
  F('M23 12L57 56L116 66L57 73L4 52Z', '#54495d', 2) +
  S('M33 16l35 39m-25 -42 37 40m-26 -41 37 39m-23 -42 34 37', '#aa9184', 2.5) +
  R(70, 70, 24, 19, 4, '#332537', 2) + S('M29 81h22m53 0 10 -3', '#a87961', 3));
write('flight/doyle_coop_block_top', 72, 38,
  F('M3 12L57 3 69 12 66 29 17 35 4 28Z', '#7e6059', 3) +
  F('M3 12L57 3 69 12 14 23Z', '#9f8b75', 2) +
  S('M19 17l38 -7m-35 16 20 -3m6 -1 14 -3', '#c0a68a', 2));
write('flight/doyle_coop_print_top', 58, 50,
  F('M21 41Q11 34 21 24L7 18Q3 9 13 11L26 18L28 5Q34 0 39 7L37 22L48 16Q56 16 55 24L40 34Q34 47 21 41Z', '#34283b', 2) +
  S('M12 17l16 7m5 -14 -2 18m16 -5 -14 12', '#765b60', 2));
write('flight/invasion_crater_top', 322, 184,
  F('M8 101Q9 47 70 26Q186 -13 277 35Q323 65 312 102Q297 149 219 175Q149 188 69 156Z', '#534051', 4) +
  F('M24 91Q45 48 99 36Q193 12 266 45Q304 66 294 108Q260 147 186 155Q106 171 46 135Z', '#2c243b', 3) +
  G(F('M3 26Q-3 12 13 4L117 4L145 14 150 34 133 62H12Q-2 57 3 26Z', metal, 4) +
    F('M55 6l28 45 36 -5 13 16H19q-18 -6 -16 -23z', '#8f5457', 3) +
    F('M145 14L123 21l16 17 -9 9 3 15 17 -28Z', '#432b42', 3) + S('M16 11h49m20 0h37M10 55h20m50 0h22', lit, 3),
  { transform: 'translate(120 37) rotate(21)' }), copperDef);
write('flight/invasion_farm_top', 260, 220,
  F('M15 82L38 182L157 213L239 177L247 87L136 51Z', '#9d7e7b', 5) +
  F('M10 92L112 9L249 49L250 130L146 170Z', '#60485e', 5) +
  F('M10 92L112 9L148 90L146 170Z', '#a47374', 4) + S('M149 91L249 49M29 89l100 50m-84 -65 94 48m-74 -62 70 34', '#c18a83', 3) +
  R(155, 28, 33, 42, 4, '#746171', 3) + R(162, 34, 18, 16, 2, '#302b42', 2) +
  R(27, 124, 32, 34, 4, '#eace9d', 3) + R(198, 142, 31, 35, 3, '#c2c8e0', 3) + S('M43 128v24m-12 -13h23m160 7v24', '#684c61', 3));
write('flight/invasion_booth_top', 222, 152,
  R(13, 49, 195, 95, 8, '#a68380', 5) +
  F('M4 52L54 10H177L216 54V99H5Z', '#64688d', 5) +
  S('M9 53h204M32 34h163m-145 48h141', '#929cba', 3) +
  R(78, 101, 65, 28, 4, '#e3b78f', 4) + S('M110 104v20m-27 -9h52', '#6c5570', 3) +
  R(177, 102, 28, 39, 4, '#382f4b', 3) + R(103, 26, 33, 18, 3, '#3a3450', 3) + S('M111 33h17m-17 5h17', '#9792b4', 2));
write('flight/invasion_church_top', 320, 226,
  F('M11 109L99 67H283L312 106V183L275 218H79L17 182Z', '#82798f', 5) +
  F('M15 101L103 34H281L309 101L268 164H91Z', '#4e4a70', 5) +
  F('M15 101L103 34L281 34L309 101Z', '#727093', 3) +
  S('M40 100h241m-230 -11h231m-211 -12h205m-188 -12h176m-160 -12h149', '#9794ae', 2.6) +
  F('M180 113V52L207 8L231 54V111L207 125Z', '#9e96a7', 4) +
  F('M174 59L207 5L239 59L208 78Z', '#545476', 4) + S('M207 7v-5m-8 3h16', '#e4dabd', 3) +
  R(195, 85, 22, 31, 7, "#372c44", 3) + R(67, 173, 20, 34, 7, "#dcc5aa", 3) + R(244, 172, 20, 34, 7, "#c7adbf", 3));

const wallPatterns = {
  farm: { wall: '#55576f', base: '#3d374f', trim: '#898295',
    design: Array.from({ length: 9 }, (_, i) => S(`M${i * 66} 0v540`, '#6b6c80', 2) + E(i * 66 + 30, 230, 7, 11, '#72738a', 0)).join('') },
  booth: { wall: '#444863', base: '#31324c', trim: '#797e9c',
    design: Array.from({ length: 16 }, (_, i) => R((i % 4) * 135 + 6, Math.floor(i / 4) * 136 + 8, 122, 121, 3, '#505773', 1)).join('') },
  church: { wall: '#464258', base: '#342e45', trim: '#70617b',
    design: Array.from({ length: 7 }, (_, i) => S(`M0 ${i * 78}H540m-501 0v78m115 -78v78m115 -78v78m115 -78v78m115 -78v78`, '#5b5168', 2)).join('') },
};
for (const [name, { wall, base, trim, design }] of Object.entries(wallPatterns)) {
  write('room/bg_invasion_' + name, 540, 720, R(0, 0, 540, 720, 0, wall, 0) + design +
    R(0, 543, 540, 177, 0, base, 0) + S('M0 539H540M0 555H540M0 687H540', trim, 4));
}
write('room/invasion_probe_eye', 76, 72,
  F('M7 24L23 10L53 7L68 27L64 56L37 67L11 55Z', dark, 4) +
  E(34, 36, 21, 25, copper, 4) + E(32, 25, 9, 8, '#e99978', 3) +
  E(24, 46, 8, 8, '#9495d0', 3) + E(42, 44, 8, 8, '#b0bd92', 3) +
  S('M59 30v16M29 21l4 -2m-13 23h2m17 -2 3 -1', cream, 3));
const clapper = F('M15 4H28L28 88Q49 96 36 115Q22 128 8 114Q-2 102 13 87Z', '#a87968', 3) +
  S('M19 12v79m-5 13q2 -8 8 -8', '#e4b58a', 3) + E(22, 8, 3, 3, dark, 1);
write('room/invasion_bell_clapper', 42, 124, clapper);
write('room/invasion_geiger_counter', 52, 32,
  R(2, 3, 48, 26, 4, '#5d646f', 2) + R(8, 7, 23, 14, 3, cream, 2) +
  S('M13 16q8 -7 12 0m-6 2 4 -5', ink, 1.4) + E(40, 12, 4, 4, copper, 2) + S('M37 23h7', blue, 2));
write('room/invasion_biscuit', 22, 16,
  R(1, 2, 20, 12, 4, '#d7a369', 2) + S('M6 6h0m5 3h0m5 -3h0', '#916954', 2));
write('room/invasion_meteor_fragment', 60, 48,
  F('M3 34L13 17L25 5L41 10L56 24L53 40L31 46L14 43Z', '#7e6174', 3) +
  F('M13 17l15 8-4 12-10 6-11-9ZM25 5l3 20 28-1L41 10Z', '#aa7980', 2) +
  S('M29 26l8 8 12 -5m-36 -7 6 -1', '#efad94', 2));
write('room/invasion_martian_lens', 51, 52,
  F('M27 3L47 14L48 38L28 49L7 39L4 16Z', '#8f655e', 3) +
  E(24, 18, 8, 8, '#e9978b', 2) + E(15, 32, 7, 7, '#8a9ac8', 2) + E(32, 32, 7, 7, '#acbc98', 2));
write('room/invasion_programme', 49, 63,
  F('M5 8L43 3L46 53L8 60Z', '#dfcbab', 3) +
  F('M9 15l32 -5 1 30 -30 4Z', '#6a5f85', 0) +
  E(25, 28, 11, 5, copper, 2) + E(24, 24, 5, 4, lit, 2) + S('M15 47l23 -3m-24 9 17 -3', '#856d76', 2));
write('room/invasion_reel', 62, 56,
  E(29, 25, 23, 22, '#ab9eb3', 3) +
  [[29, 12], [41, 22], [36, 34], [22, 35], [16, 24]].map(([x, y]) => E(x, y, 5, 5, '#54445d', 2)).join('') +
  E(29, 25, 3, 3, '#704e67', 1) + F('M42 41q10 8 17 0l2 8q-11 9 -28 -3Z', '#936f87', 2));
write('room/invasion_truce_flag', 60, 59,
  F('M17 5Q34 1 52 9L46 32Q31 24 15 35Z', '#f2e9d9', 3) +
  S('M13 56l5 -52', '#ab806d', 4) + S('M22 14q12 -2 19 1m-18 9 17 -2', '#bcafba', 2));
write('room/invasion_clapper_souvenir', 26, 63, G(clapper, { transform: 'translate(2 0) scale(.52 .5)' }));
write('room/invasion_daybed', 334, 81,
  R(5, 32, 323, 36, 8, '#6d5466', 4) + R(6, 15, 322, 29, 14, '#a8889c', 4) +
  R(35, 8, 83, 24, 12, '#ddc3ad', 3) +
  S('M20 66v11m295 -11v11m-182 -44h176', '#5a465e', 5));
write('room/invasion_bench', 330, 91,
  R(5, 9, 320, 28, 9, '#786289', 4) + R(4, 22, 322, 36, 6, '#9b7690', 4) +
  S('M22 57v26m286 -26v26m-211 -55v15m94 -15v15m67 -15v15', '#523c58', 5));
write('room/invasion_pew', 333, 142,
  R(9, 11, 316, 74, 10, '#705363', 4) + R(12, 61, 309, 32, 6, '#ab7f78', 4) +
  S('M17 86v44m290 -44v44m-277 -97h273m-273 15h273', '#9a746f', 5));
write('room/invasion_pew_end', 125, 294,
  F('M17 286V56Q25 19 61 10Q104 12 108 58V285Z', '#735163', 4) +
  F('M34 268V63Q39 42 61 35Q85 41 90 63V268Z', '#a07a79', 4) +
  S('M62 75v41m-15 -28h30m-37 155h44', '#d2a795', 4));
write('room/invasion_attic_shelf', 232, 98,
  R(4, 12, 224, 76, 5, '#695471', 4) + R(5, 19, 220, 24, 3, '#a08086', 3) +
  R(5, 65, 220, 21, 3, '#98767d', 3) + S('M12 88h208m-186 -39h91m24 0h52', '#c3a599', 3));
write('room/invasion_queue_rail', 157, 307,
  F('M7 295L19 25H34L32 80L124 54L125 13L140 9L148 293L132 298L126 85L32 111L22 298Z', '#a391a2', 4) +
  S('M24 96l107 -30m9 15 5 189M26 115L17 268', '#e0c2ae', 5));

const sleeperSpecs = [
  ['forester', '#e4b091', '#313043', '#e1dcd1', '#a0a3ae', '#594f69', F('M19 28l10 -23 21 2 5 14 -11 -4 -20 14Z', '#493a49', 2)],
  ['van_bell', '#a97560', '#432e3e', '#776b9b', '#534663', '#3f415f', F('M10 32Q4 9 29 6Q48 -3 56 17L48 22L23 20L19 41Z', '#342738', 3)],
  ['collier', '#cd9b81', '#aaa1af', '#474253', '#726b80', '#463e55', F('M10 36Q5 20 16 10Q33 1 48 13L49 19L29 17L22 40Z', '#a79da5', 3)],
];
for (const [id, skin, brow, jacket, shade, pants, hair] of sleeperSpecs) {
  const head = F('M26 76L22 61Q10 55 10 37Q5 17 28 10Q51 2 57 27L60 40L67 46L59 51Q60 64 46 67L43 77Z', skin, 3.5) +
    hair + E(19, 44, 6, 8, skin, 2) + S('M17 44q2 -4 4 -1M36 32q8 -5 15 0', brow, 2.5);
  write('human/' + id + '_head', 70, 80, head + S('M35 39q8 7 16 -1m-6 18 9 0', ink, 3));
  write('human/' + id + '_head_awake', 70, 80, head +
    E(43, 39, 9, 9, cream, 2) + E(56, 38, 5, 7, cream, 2) + E(46, 39, 2.5, 3, ink, 0) + E(58, 38, 2, 2, ink, 0) + E(50, 57, 5, 7, ink, 1));
  const collar = id === 'forester' ? F('M21 10l19 12 17 -12 8 11-24 60-19-49Z', blue, 2) + S('M43 24v35m9 12h12v13H51', shade, 3)
    : id === 'van_bell' ? F('M23 10Q40 19 58 8L62 26L50 29L66 58L55 68L39 28L23 27Z', '#c88083', 3)
      : R(32, 12, 17, 13, 3, cream, 2);
  write('human/' + id + '_torso', 80, 120,
    F('M26 5q15 -6 31 4l16 13 2 22-9 17 7 48q-35 15-67 2l9 -49-9 -23 5-20Z', jacket, 3.5) +
    collar + S('M13 99q29 15 54 0m-49 -56v30m40 16h5', shade, 3));
  const arm = F('M12 2Q23 1 24 14L23 49Q22 58 13 58Q3 57 3 49L3 16Q3 4 12 2Z', jacket, 3);
  write('human/' + id + '_upper_arm', 26, 60, arm + S('M8 12l1 22m0 11 10 2', shade, 2.6));
  write('human/' + id + '_lower_arm', 24, 60,
    F('M10 4Q19 2 20 15L17 39L22 48Q23 57 15 58Q5 59 4 49L4 15Z', skin, 3) +
    F('M10 3Q20 0 21 14L19 34Q12 38 3 33L3 15Z', jacket, 2) + S('M7 29l10 2', shade, 2));
  write('human/' + id + '_upper_leg', 32, 70, F('M15 2Q28 2 29 16L28 57Q26 68 17 68Q4 67 3 53L4 14Q5 4 15 2Z', pants, 3) + S('M9 13v28m14 13 -14 2', shade, 2));
  write('human/' + id + '_lower_leg', 30, 72, F('M14 3Q25 2 25 15L22 52L27 59L28 68Q15 72 3 67L4 55L4 16Q4 5 14 3Z', pants, 3) +
    F('M5 52l15 -2 5 8 4 4-1 7Q15 72 3 67Z', dark, 2) + S('M7 59l10 -1m-10 6h16', shade, 2));
}

const soil = '#2e2946';
write('flight/ground_invasion53', 540, 540,
  R(0, 0, 540, 540, 0, soil, 0) +
  Array.from({ length: 84 }, (_, i) => {
    const x = (i * 89 + i * i * 7) % 528;
    const y = (i * 41 + i * i * 13) % 533;
    return R(x, y, 4 + i % 9, 1 + i % 3, 1, i % 4 ? '#37314e' : '#403751', 0);
  }).join(''));
write('flight/invasion_field_rows', 330, 360,
  R(4, 3, 322, 354, 13, '#3c3552', 0) +
  Array.from({ length: 12 }, (_, i) =>
    R(12, 14 + i * 28, 306, 12, 6, i % 2 ? '#585064' : '#443951', 0) +
    S(`M18 ${20 + i * 28}h289`, '#695766', 1.3, { 'stroke-dasharray': '11 13' }),
  ).join(''));
