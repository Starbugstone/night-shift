// Room props redrawn at the shape each room places them (tests/abduct-sprite-aspect.test.ts: art is never
// stretched). Two kinds: `reshape` redraws an existing sprite in a new box with even outlines and round
// wheels; the rest are new props for places that used another prop's art (a shelf as a post, a counter as
// an icebox). Keys and sizes: the "v0.2 unstretched room art" section of src/art-manifest.ts.
// Run: node scripts/art-shapes/build.mjs
import { readFileSync } from 'node:fs';
import { ART_DIR, C, E, F, G, R, S, d2, write, written } from '../art-l9/lib.mjs';
import { reshape } from './reshape.mjs';

// ---- existing props at the shape their room needs
reshape('room/booth55', 'room/bakery_bench', 296, 158);
reshape('room/booth55', 'room/transit_bench2199', 332, 140);
reshape('room/exit_vent', 'room/exit_vent_wide', 245, 82);
reshape('room/door_frame', 'room/door_frame_tall', 110, 268);
reshape('room/workbench', 'room/workbench_tall', 222, 126);
reshape('room/workbench', 'room/garage_workbench', 232, 110);
reshape('room/counter55', 'room/counter_tall55', 192, 194);
reshape('room/counter55', 'room/counter_kiosk2199', 195, 240);
reshape('room/trunk_body55', 'room/trunk_body_low55', 336, 158);
reshape('room/exit_window', 'room/exit_window_narrow', 117, 207);
reshape('room/luggage_shutter2199', 'room/luggage_shutter_short2199', 136, 30);
reshape('room/robe_sofa2199', 'room/robe_sofa_wide2199', 280, 110);
reshape('room/voice_cabinet2199', 'room/voice_cabinet_tall2199', 115, 330);
reshape('room/wardrobe', 'room/robe_wardrobe2199', 115, 330);
reshape('room/dino_legs', 'room/dino_legs_squat', 160, 215);
reshape('room/fireplace', 'room/fireplace_narrow', 192, 220);
reshape('room/show_pool', 'room/show_pool_wide', 872, 160);
reshape('room/stairs', 'room/stairs_tall', 584, 686, { stroke: 2.1 });
reshape('room/stone_plinth', 'room/stone_plinth_low', 186, 70);
reshape('room/towel_cart', 'room/towel_cart_narrow', 95, 130);
reshape('room/tunnel_divider', 'room/tunnel_divider_short', 60, 266);
reshape('room/exit_skylight', 'room/exit_skylight_wide', 280, 90);
reshape('room/invasion_attic_shelf', 'room/invasion_attic_shelf_deep', 200, 90);
reshape('room/invasion_attic_shelf', 'room/invasion_attic_shelf_low', 226, 85);


// ---- new props
const row = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
/** A stroke with an ink edge: tubes, rails, chains. */
const tube = (d, color, sw, a = {}) => S(d, C.ink, sw + 4, a) + S(d, color, sw, a);
const dots = (d, color, sw, gap) => S(d, color, sw, { 'stroke-dasharray': `0.1 ${gap}` });

// The shelf family: the same plank and brackets as room/shelf (160x24), at three more lengths, so a room
// can hang a shelf of any width without stretching one (shelfFit in src/abduct/rooms/layout.ts picks).
function shelf(key, w, h) {
  const t = Math.round(h * 0.55);
  const inset = Math.round(w * 0.1) + 2;
  const bracket = (x, dir) => F(`M${x} ${t}h${dir * 16}l${-dir * 12} ${h - t - 2}h${-dir * 4}Z`, C.wood, 2.5);
  write(key, w, h, bracket(inset, 1) + bracket(w - inset, -1) + R(2, 2.5, w - 4, t, 3, C.ochre, 3.5) + S(`M8 5.5H${w - 9}`, C.cream, 2.1));
}
shelf('room/shelf_stub', 64, 20);
shelf('room/shelf_short', 90, 20);
shelf('room/shelf_long', 190, 20);

// Birch Lane: the uprights that used a shelf turned on its end.
write('room/bakery_flue', 35, 386,
  R(6, 2, 23, 382, 4, '#d9cdb8', 3.5) + S('M12 10V376', '#fff4dc', 3, { opacity: 0.85 }) + S('M24 10V376', '#a89a8c', 3) +
  row(3, i => R(3, 74 + i * 104, 29, 12, 3, '#8792a6', 3) + S(`M7 ${78 + i * 104}h20`, '#d8dde6', 1.8)) +
  tube('M17 132h13', C.ochre, 2.5) + E(30, 132, 3.5, 3.5, C.gold, 2) +
  R(2, 366, 31, 18, 4, C.denim, 3.5) + S('M7 372h21', C.steel, 2));
write('room/garage_post', 40, 390,
  R(8, 2, 24, 386, 3, C.wood, 3.5) + S('M14 20V370', C.ochre, 3) + S('M25 40v70m0 44v96m0 46v76', '#6f4a45', 2) +
  R(3, 2, 34, 14, 3, C.slateBlue, 3) + E(9, 9, 2, 2, C.steel, 0) + E(31, 9, 2, 2, C.steel, 0) +
  R(3, 374, 34, 14, 3, C.slateBlue, 3) + E(9, 381, 2, 2, C.steel, 0) + E(31, 381, 2, 2, C.steel, 0) +
  S('M20 150v14', C.steel, 4) + E(20, 186, 12, 18, 'none', 0, { stroke: C.ink, 'stroke-width': 8 }) +
  E(20, 186, 12, 18, 'none', 0, { stroke: C.cream, 'stroke-width': 4 }) + S('M11 180q9 6 18 0', C.ochre, 2));
write('room/bike_hoist', 32, 250,
  R(11, 2, 10, 246, 3, C.steel, 3) + S('M14.5 16V240', '#eef1f4', 2) +
  R(3, 2, 26, 12, 3, C.slateBlue, 3) + E(16, 38, 9, 9, C.denim, 3) + E(16, 38, 3, 3, C.cream, 0) +
  dots('M26.5 46V214', C.ink, 5, 7) + dots('M26.5 46V214', C.steel, 2.6, 7) +
  R(4, 224, 24, 23, 4, C.rust, 3.5) + S('M9 235h14', C.cream, 2.5));
write('room/bike_on_stand', 173, 153,
  tube('M80 56v88m-27 4h54', '#9ba9be', 6) + R(62, 104, 36, 12, 3, C.slateBlue, 3) + S('M70 104v-9m9 9v-13m9 13v-7', C.cream, 3) +
  E(37, 39, 31, 31, 'none', 5) + E(136, 37, 31, 31, 'none', 5) +
  E(37, 39, 28, 28, 'none', 0, { stroke: '#b0c2ce', 'stroke-width': 2 }) +
  E(136, 37, 28, 28, 'none', 0, { stroke: '#b0c2ce', 'stroke-width': 2 }) +
  S('M8 40h58m-29-30v58m70-31h58m-29-30v60', '#879eaf', 1.6) +
  S('M37 39l28 26 31-29H37m28 26-5-33m36 7 21 26 19-25m-18 25-4 14h20m-74-47-3-14m-9-1h21', '#e3aa6b', 4));
write('room/tool_cabinet', 67, 114,
  E(15, 106, 5.5, 5.5, C.slateBlue, 2.5) + E(52, 106, 5.5, 5.5, C.slateBlue, 2.5) +
  R(3, 3, 61, 99, 5, C.brick, 3.5) + S('M9 8H58', '#d98a94', 2) +
  row(4, i => R(9, 13 + i * 22, 49, 17, 3, '#c0606e', 2.5) + S(`M23 ${21.5 + i * 22}h21`, C.steel, 3)));

// 1955: Crest Valley
const cab = (y, h) => R(4, y, 132, h, 5, '#6f5243', 3.5) + R(11, y + 7, 118, h - 14, 3, '#3a2f44', 2.5) +
  row(2, i => E(42 + i * 56, y + h / 2, 16, 16, '#2a2233', 2.5) + E(42 + i * 56, y + h / 2, 6, 6, '#5a4d68', 0)) +
  S(`M14 ${y + 10}h112`, '#5a4d68', 2);
write('room/amp_stack55', 140, 159,
  cab(98, 58) + cab(40, 58) +
  R(8, 3, 124, 37, 5, '#3a2f44', 3.5) + R(14, 10, 112, 15, 3, C.custard, 2.5) +
  row(6, i => E(24 + i * 15, 17.5, 3.6, 3.6, C.ink, 0)) + E(117, 17.5, 3.5, 3.5, C.red, 1.5) + S('M16 33h108', '#5a4d68', 2));
write('room/gingham_table55', 178, 134,
  R(28, 60, 12, 72, 3, C.wood, 3) + R(138, 60, 12, 72, 3, C.wood, 3) + S('M41 110H137', C.wood, 6) +
  F(`M8 30H170V76${row(12, () => 'q-6.75 12 -13.5 0')}Z`, C.custard, 3) +
  row(9, i => S(`M${22 + i * 16.7} 34V74`, '#dc6866', 5, { opacity: 0.75 })) + S('M11 46H167M11 62H167', '#dc6866', 5, { opacity: 0.5 }) +
  R(4, 22, 170, 14, 5, C.custard, 3.5) + S('M12 27H166', '#ffffff', 2, { opacity: 0.8 }) +
  R(52, 4, 11, 19, 4, '#dc6866', 2.5) + R(54.5, 1.5, 6, 5, 2, C.custard, 2) + R(108, 8, 26, 15, 3, C.steel, 2.5) + S('M113 8v-4h16v4', C.custard, 3));
write('room/counterweight_block55', 65, 68,
  E(32.5, 12, 8, 8, 'none', 0, { stroke: C.ink, 'stroke-width': 7 }) + E(32.5, 12, 8, 8, 'none', 0, { stroke: C.steel, 'stroke-width': 3 }) +
  F('M13 21H52L62 59Q62 66 55 66H10Q3 66 3 59Z', C.slateBlue, 3.5) + S('M10 38H55M8 52H57', C.denim, 4) + S('M17 27H44', C.steel, 2.5));

// 1953: The War of the Colds
const mauve = '#695471', rose = '#a08086', dust = '#98767d', blush = '#c3a599', oak = '#735163', oakLit = '#a07a79';
write('room/invasion_icebox', 127, 309,
  R(14, 290, 18, 16, 3, C.slate, 3) + R(95, 290, 18, 16, 3, C.slate, 3) +
  R(5, 4, 117, 292, 24, '#c8d2cf', 4) + S('M7 100H120', C.ink, 3.5) + R(8, 274, 111, 18, 6, '#8fa39f', 3) +
  S('M22 30V84M22 118V258', '#ffffff', 5, { opacity: 0.7 }) + S('M110 122V262', '#a2b1ad', 4) +
  R(94, 50, 10, 36, 5, C.steel, 3) + R(94, 112, 10, 62, 5, C.steel, 3) +
  F('M34 22h32l6 8-6 8H34Z', '#c77670', 2.5) + S('M40 30h20', C.custard, 2.5) +
  G(R(40, 150, 30, 36, 2, C.custard, 2) + S('M46 162h18m-18 7h18m-18 7h11', '#8792a6', 2) + E(55, 152, 4, 4, C.red, 1.5), { transform: 'rotate(-5 55 168)' }));
write('room/invasion_hutch', 150, 310,
  R(12, 294, 16, 13, 3, '#523c58', 3) + R(122, 294, 16, 13, 3, '#523c58', 3) +
  R(5, 5, 140, 293, 6, oak, 4) + R(14, 24, 122, 130, 3, '#4a3550', 3) +
  row(3, i => E(40 + i * 35, 46, 13, 13, '#e5d6c4', 2.5) + E(40 + i * 35, 46, 6, 6, 'none', 0, { stroke: '#b9a3a6', 'stroke-width': 2 })) +
  R(26, 82, 16, 24, 4, '#c77670', 2.5) + R(48, 88, 14, 18, 4, '#81a49b', 2.5) + R(92, 78, 30, 28, 4, blush, 2.5) + S('M98 88h18', oak, 2.5) +
  F('M30 150q-4-22 10-22h60q14 0 10 22Z', '#8792a6', 2.5) + S('M40 136h60', '#d8dde6', 2) +
  R(11, 62, 128, 8, 2, oakLit, 2.5) + R(11, 106, 128, 8, 2, oakLit, 2.5) +
  R(2, 2, 146, 16, 4, oakLit, 3.5) + S('M10 8H140', '#d2a795', 2.2) + R(2, 152, 146, 15, 4, blush, 3.5) +
  row(2, i => R(14 + i * 66, 176, 56, 108, 4, oakLit, 3) + R(22 + i * 66, 184, 40, 92, 3, 'none', 0, { stroke: oak, 'stroke-width': 2.5 })) +
  E(63, 230, 4, 4, '#e0c2ae', 2) + E(87, 230, 4, 4, '#e0c2ae', 2));
function cupboard(key, w, h, doors) {
  const top = 26, gap = 10, dh = (h - top - 14 - gap * (doors - 1)) / doors;
  write(key, w, h,
    R(4, 4, w - 8, h - 8, 6, mauve, 4) +
    row(doors, i => {
      const y = top + i * (dh + gap);
      return R(14, y, w - 28, dh, 4, rose, 3) + R(23, y + 10, w - 46, dh - 20, 3, 'none', 0, { stroke: dust, 'stroke-width': 3 }) +
        S(`M27 ${y + 15}H${w - 28}`, blush, 2, { opacity: 0.7 }) + E(w - 24, y + dh / 2, 4, 4, blush, 2);
    }) +
    R(2, 2, w - 4, 16, 4, rose, 3.5) + S(`M10 8H${w - 10}`, blush, 2.2) + S(`M12 ${h - 9}H${w - 12}`, blush, 3));
}
cupboard('room/invasion_cupboard', 126, 293, 2);
cupboard('room/invasion_cupboard_tall', 128, 415, 3);
write('room/invasion_confessional', 150, 310,
  R(2, 292, 146, 16, 3, oakLit, 3.5) +
  F('M8 296V62Q8 8 75 6Q142 8 142 62V296Z', oak, 4) + F('M28 294V72Q30 32 75 30Q120 32 122 72V294Z', '#3d2a45', 3.5) +
  F('M32 292V100Q53 88 75 100Q97 88 118 100V292Z', '#8c4a5e', 3) + S('M50 104V288M75 104V288M100 104V288', '#6d3449', 3) +
  tube('M30 96H120', '#d2a795', 3) + S('M75 44v30m-10-21h20', '#d2a795', 4) + S('M18 70V280', oakLit, 3));
write('room/invasion_rafter_crate', 178, 91,
  R(4, 8, 170, 79, 4, dust, 4) + S('M22 34H156M22 61H156', mauve, 3) +
  R(4, 8, 18, 79, 3, rose, 3) + R(156, 8, 18, 79, 3, rose, 3) + row(4, i => E(13 + (i % 2) * 152, 20 + (i >> 1) * 55, 2.5, 2.5, blush, 0)) +
  E(89, 50, 26, 7, mauve, 0) + F('M76 46q13-17 26 0Z', mauve, 0) + S('M70 8q19-9 38 0', '#e0c2ae', 4));
write('room/invasion_rafter_beam', 243, 67,
  R(3, 6, 237, 55, 5, oak, 4) + S('M60 22H176M70 44H186', oakLit, 3) + S('M12 14V52', oakLit, 3) +
  row(2, i => R(34 + i * 157, 2, 18, 63, 3, '#4a4458', 3) + E(43 + i * 157, 16, 3, 3, blush, 0) + E(43 + i * 157, 50, 3, 3, blush, 0)));
function cart(key, w, h, frame, shelfFill, load) {
  const shelves = [44, Math.round(h * 0.52), h - 40];
  write(key, w, h,
    E(19, h - 10, 8, 8, C.slate, 3) + E(w - 19, h - 10, 8, 8, C.slate, 3) + E(19, h - 10, 2.5, 2.5, C.steel, 0) + E(w - 19, h - 10, 2.5, 2.5, C.steel, 0) +
    load(shelves) + tube(`M14 ${h - 20}V22q0-14 14-14M${w - 14} ${h - 20}V30`, frame, 4) +
    shelves.map(y => R(5, y, w - 10, 13, 4, shelfFill, 3) + S(`M12 ${y + 4.5}H${w - 12}`, '#ffffff', 2, { opacity: 0.45 })).join(''));
}
cart('room/invasion_lab_cart', 111, 194, '#8792a6', '#648b82', ([a, b, c]) =>
  F(`M34 ${a}l9-20v-13h9v13l9 20Z`, '#e7a66e', 2.5) + S(`M41 ${a - 9}h13`, '#ffe2ae', 2) +
  R(70, a - 30, 14, 30, 5, '#c77670', 2.5) + R(72, a - 36, 10, 8, 2, blush, 2) +
  R(30, b - 30, 50, 30, 3, blush, 3) + S(`M38 ${b - 20}h34m-34 9h22`, mauve, 2.5) +
  row(3, i => R(26 + i * 21, c - 26, 15, 26, 4, i === 1 ? '#81a49b' : '#d9cdb8', 2.5) + R(28 + i * 21, c - 31, 11, 7, 2, mauve, 2)));
cart('room/baggage_cart2199', 110, 195, '#a6a6ad', '#707789', ([a, b, c]) =>
  R(28, a - 30, 54, 30, 5, '#c68b92', 3) + S(`M46 ${a - 30}v-6h18v6`, C.ink, 3) + S(`M34 ${a - 14}h42`, '#875870', 3) +
  R(24, b - 40, 38, 40, 5, '#dbbb83', 3) + S(`M34 ${b - 40}v-6h18v6`, C.ink, 3) + S(`M43 ${b - 34}v28`, '#918b87', 3) +
  R(66, b - 26, 24, 26, 4, '#81a49b', 3) + R(26, c - 34, 60, 34, 5, '#875870', 3) + S(`M46 ${c - 34}v-6h20v6`, C.ink, 3) +
  E(40, c - 17, 5, 5, '#dbbb83', 2) + E(72, c - 17, 5, 5, '#dbbb83', 2));
write('room/invasion_wire_ledge', 96, 18,
  tube('M5 4H91', '#8b8296', 2) + tube('M16 6q0 9 9 9M80 6q0 9-9 9', '#8b8296', 1.6) + S('M28 4v3m10-3v3m10-3v3m10-3v3m10-3v3', '#8b8296', 1.6));

// 1122: Grimsby Keep
const timber = '#945e43', timberLit = '#be8656', stone = '#817a80', stoneLit = '#999096', iron = '#454353', gilt = '#edbb67', red = '#ad5458';
function bench(key, w, h, fill, lit, dark) {
  write(key, w, h,
    R(20, 22, 22, h - 25, 3, fill, 3.5) + R(w - 42, 22, 22, h - 25, 3, fill, 3.5) + R(40, 56, w - 80, 13, 3, dark, 3) +
    R(4, 4, w - 8, 22, 4, fill, 3.5) + S(`M12 10H${w - 12}`, lit, 2.6) + S(`M26 34v${h - 44}m${w - 52} 0v${-(h - 44)}`, lit, 2.4, { opacity: 0.7 }));
}
bench('room/grail_long_bench', 270, 98, timber, timberLit, '#7a4a37');
bench('room/grail_stone_bench', 270, 98, stone, stoneLit, '#615867');
write('room/grail_guard_seat', 176, 170,
  R(36, 114, 16, 53, 3, timberLit, 3.5) + R(146, 114, 16, 53, 3, timberLit, 3.5) + R(50, 136, 98, 11, 3, timber, 3) +
  R(4, 4, 24, 163, 3, iron, 3.5) + S('M12 12V158', '#858c9b', 4) + row(3, i => R(2, 30 + i * 52, 28, 9, 2, '#6d6f80', 2.5)) +
  R(6, 95, 166, 22, 4, timber, 3.5) + S('M32 101H164', timberLit, 2.6));
const block = (x, y, w, h, fill = stone) => R(x, y, w, h, 4, fill, 3.5) + S(`M${x + 8} ${y + 7}H${x + w - 10}`, stoneLit, 2.4, { opacity: 0.8 });
write('room/grail_stockpile', 285, 175,
  block(3, 118, 96, 54) + block(99, 118, 92, 54, '#8b848a') + block(191, 118, 91, 54) +
  block(3, 62, 142, 56, '#8b848a') + block(145, 62, 137, 56) +
  block(3, 3, 88, 59) + block(91, 3, 104, 59, '#8b848a') + block(195, 3, 87, 59) +
  S('M118 140l8 9 12-16M222 28h34m-17-12v24', '#615867', 3) + tube('M3 90H282', '#c9a66b', 3) + E(146, 90, 7, 7, '#c9a66b', 2.5));
const kite = 'M5 8L28 2 52 8 49 33Q43 48 28 58Q11 47 7 32Z';
const shield = (x, y, k, face = red) => G(F(kite, '#615867', 3 / k) + F('M12 12l16-4 16 4-3 18q-4 12-13 19q-12-8-14-21Z', face, 2 / k) +
  F('M27 14h4v10h9v4h-9v12h-4V28h-9v-4h9Z', gilt, 1 / k), { transform: `translate(${x} ${y}) scale(${k})` });
write('room/grail_shield_rack', 200, 256,
  R(20, 20, 160, 222, 2, '#6b4334', 3) + S('M24 76H176M24 186H176', '#55342a', 3) +
  R(5, 6, 18, 247, 3, timber, 3.5) + R(177, 6, 18, 247, 3, timber, 3.5) +
  R(2, 3, 196, 20, 4, timberLit, 3.5) + S('M10 9H190', '#e0b082', 2.4) + R(6, 126, 188, 13, 3, timberLit, 3) + R(2, 236, 196, 17, 4, timberLit, 3.5) +
  shield(32, 30, 1.25) + shield(106, 30, 1.25, '#5f7f8c') + shield(32, 146, 1.25, '#7d8f58') + shield(106, 146, 1.25));
write('room/grail_toll_desk', 200, 256,
  R(6, 40, 188, 213, 5, timber, 3.5) + row(2, i => R(20 + i * 86, 62, 74, 172, 4, '#a86d4d', 3) + S(`M30 ${72}v152`.replace('30', 30 + i * 86), timberLit, 2.6)) +
  R(88, 40, 24, 213, 0, iron, 3) + row(4, i => E(100, 62 + i * 56, 3.5, 3.5, '#858c9b', 0)) +
  E(100, 146, 24, 24, gilt, 3.5) + E(100, 146, 16, 16, 'none', 0, { stroke: '#b98a3c', 'stroke-width': 2.5 }) + S('M100 136v20m-8-12h16', '#8a5f24', 3.5) +
  R(2, 24, 196, 20, 4, timberLit, 3.5) + S('M10 30H190', '#e0b082', 2.4) +
  R(58, 3, 84, 23, 4, iron, 3.5) + R(88, 9, 24, 6, 3, '#1f1a2b', 0) + S('M64 21H136', '#858c9b', 2.4));
write('room/grail_book_stand', 200, 256,
  R(10, 60, 180, 193, 5, timber, 3.5) + R(24, 78, 152, 76, 4, '#a86d4d', 3) + R(24, 166, 152, 74, 4, '#a86d4d', 3) +
  row(4, i => R(36 + i * 34, 176, 26, 64, 2, [red, '#5f7f8c', gilt, '#7d8f58'][i], 2.5) + S(`M${42 + i * 34} 190h14`, '#f1e2bd', 2.4)) +
  S('M36 92H164M36 106H138M36 120H154M36 134H120', timberLit, 3) +
  F('M3 62L22 20H178L197 62Z', timberLit, 3.5) + S('M30 28H170', '#e0b082', 2.4) +
  F('M40 54Q70 40 100 52Q130 40 160 54L152 10Q126 2 100 12Q74 2 48 10Z', '#f1e2bd', 3) + S('M100 12V52M58 22q20-6 34 0m16 0q16-6 34 0M56 34q20-6 36 0m16 0q18-6 36 0', '#a08a78', 2));
write('room/grail_strongbox', 200, 290,
  R(5, 40, 190, 247, 6, timber, 3.5) + S('M10 110H190M10 170H190M10 230H190', '#7a4a37', 3) +
  R(2, 3, 196, 46, 10, timberLit, 3.5) + S('M14 12H186', '#e0b082', 2.6) +
  row(2, i => R(32 + i * 118, 3, 18, 284, 2, iron, 3) + row(5, j => E(41 + i * 118, 24 + j * 60, 3.5, 3.5, '#858c9b', 0))) +
  R(84, 38, 32, 42, 5, gilt, 3.5) + E(100, 54, 5, 5, C.ink, 0) + F('M97 56h6l3 14h-12Z', C.ink, 0));
const cog = (cx, cy, r, teeth) => d2(Array.from({ length: teeth * 4 }, (_, i) => {
  const a = (i - 0.5) / (teeth * 4) * Math.PI * 2;
  const rr = i % 4 < 2 ? r : r * 0.8;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}));
write('room/grail_winch', 200, 290,
  R(34, 222, 132, 50, 8, iron, 3.5) + row(5, i => S(`M${48 + i * 26} 226v42`, '#6d6f80', 3)) +
  dots('M100 150V226', C.ink, 9, 11) + dots('M100 150V226', '#858c9b', 5, 11) +
  F(cog(100, 112, 78, 12), timberLit, 3.5) + E(100, 112, 50, 50, timber, 3) + E(100, 112, 16, 16, gilt, 3) +
  S('M100 66v30m0 32v30M54 112h30m32 0h30M68 80l21 21m22 22 21 21M132 80l-21 21m-22 22-21 21', '#e0b082', 5) +
  tube('M100 112L154 174', '#858c9b', 5) + E(156, 176, 8, 8, timberLit, 3) +
  R(6, 6, 22, 280, 3, timber, 3.5) + R(172, 6, 22, 280, 3, timber, 3.5) + R(2, 3, 196, 22, 4, timberLit, 3.5) + S('M10 9H190', '#e0b082', 2.4) +
  R(2, 268, 196, 19, 4, timberLit, 3.5));
write('room/grail_chimney', 200, 290,
  R(6, 4, 188, 283, 4, stone, 3.5) + S('M8 52H192M8 150H192M8 198H50m100 0h42M8 244H50m100 0h42M64 22v30m76-30v30M100 52v48M40 116v34m120-34v34', '#615867', 3) +
  F('M50 287V196Q50 152 100 152Q150 152 150 196V287Z', '#2b2234', 3.5) +
  F('M70 286q4-26 16-34q0 16 10 20q4-22 14-30q2 20 12 26q6-8 4-16q12 14 6 34Z', '#e7884f', 2.5) + F('M88 286q4-14 12-20q4 10 10 20Z', gilt, 0) +
  R(2, 98, 196, 20, 3, stoneLit, 3.5) + S('M10 104H190', '#c4bcc2', 2.4) + R(2, 2, 196, 20, 3, stoneLit, 3.5) +
  S('M30 60q10 10 4 26M168 64q-8 12-2 22', '#4a4458', 3, { opacity: 0.6 }));
write('room/grail_flue_hood', 515, 166,
  R(4, 12, 507, 150, 5, stone, 4) +
  S('M6 70H508M6 116H508M90 34v36m120-36v36m108-36v36m110-36v36M150 70v46m214-46v46M60 116v44m130-44v44m136-44v44m120-44v44', '#615867', 3.5) +
  S('M16 44H80m24 0h96m24 0h80m30 0h80m30 0h60M16 82h120m30 0h180m30 0h120', stoneLit, 2.6, { opacity: 0.75 }) +
  R(2, 2, 511, 30, 4, stoneLit, 3.5) + S('M12 10H502', '#c4bcc2', 2.6) +
  E(240, 92, 5, 6, '#3b3446', 0) + E(274, 92, 5, 6, '#3b3446', 0) + S('M232 82l14 5m36-5-14 5M244 106q13-8 26 0', '#3b3446', 3));
write('room/grail_hanging_shield', 79, 96,
  E(39.5, 8, 5, 5, 'none', 0, { stroke: C.ink, 'stroke-width': 5.5 }) + E(39.5, 8, 5, 5, 'none', 0, { stroke: '#858c9b', 'stroke-width': 2.5 }) +
  F('M7 18L39.5 10 72 18 68 54Q61 78 39.5 93Q18 78 11 54Z', '#615867', 3.5) + F('M16 24l23.5-6 23.5 6-4 28q-6 18-19.5 29q-13.5-11-19.5-29Z', red, 2.5) +
  F('M36 28h7v15h13v7h-13v20h-7V50H23v-7h13Z', gilt, 1.5) + S('M22 62l6 5-3 6', '#3b3446', 2.4));

// 2199
write('room/stamp_weight2199', 83, 99,
  R(34, 22, 15, 26, 3, '#875870', 3) + E(41.5, 15, 14, 12.5, '#875870', 3.5) + S('M33 10q8-6 16 0', '#c68b92', 2.6) +
  F('M11 44H72Q79 44 79 52V80H4V52Q4 44 11 44Z', '#707789', 3.5) + S('M12 52H70', '#a6a6ad', 2.6) + S('M10 66H73', '#565c6e', 3) +
  R(2, 78, 79, 19, 4, '#c68b92', 3.5) + S('M9 91H74', '#dc6866', 4));
write('room/shower_rail2199', 56, 115,
  tube('M28 3V72', C.steel, 5) + R(18, 2, 20, 10, 3, '#707789', 3) + E(28, 40, 6, 6, '#dbbb83', 2.5) +
  F('M9 80Q28 62 47 80L53 97H3Z', '#a6a6ad', 3.5) + S('M15 82q13-9 26 0', '#e5e7ea', 2.4) + R(2, 94, 52, 8, 3, '#707789', 3) +
  S('M11 106v5m11-5v7m12-7v7m11-7v5', '#a7c8e0', 3));

// Grimsby pier and the suburbs
const crate = (x, y, w, h) => R(x, y, w, h, 3, C.ochre, 3.5) + S(`M${x + 4} ${y + h * 0.36}h${w - 8}m${-(w - 8)} ${h * 0.3}h${w - 8}`, C.wood, 2.4) +
  R(x + 6, y + 2, 8, h - 4, 1, C.wood, 0) + R(x + w - 14, y + 2, 8, h - 4, 1, C.wood, 0) + S(`M${x + 22} ${y + 6}h${w - 44}`, C.cream, 2, { opacity: 0.8 }) +
  R(x + w / 2 - 12, y + h * 0.46, 24, 6, 3, C.umber, 0);
const fish = (x, y) => F(`M${x} ${y}q4-15 17-13q9 2 9 13Z`, C.denim, 2.4) + E(x + 18, y - 6, 1.6, 1.6, C.ink, 0);
const tail = (x, y) => F(`M${x} ${y}l6-15 7 9 8-9v15Z`, C.denim, 2.4);
write('room/fish_crate_tower', 190, 256,
  fish(40, 20) + tail(118, 20) + fish(86, 20) +
  crate(10, 18, 172, 58) + crate(3, 76, 176, 60) + crate(12, 136, 175, 58) + crate(3, 194, 184, 59));
write('room/fish_crate_box', 100, 100,
  F('M12 32q6-9 14-4q6-8 16-3q8-7 16-1q8-6 16 0q8-5 16 8Z', '#d8ffdf', 2.4) + fish(22, 30) + tail(62, 30) + crate(3, 28, 94, 69));
write('room/bulb_crate', 90, 90,
  row(3, i => R(17 + i * 22, 22, 12, 12, 3, C.slateBlue, 2.5) + E(23 + i * 22, 14, 10, 11.5, C.butter, 2.5) + S(`M${19 + i * 22} 12q0-5 4-7`, '#ffffff', 2)) +
  S('M8 36l8-8m6 8 5-9m8 9 2-9m10 9 6-9m8 9 8-8m4 8 4-7', C.gold, 2.6) + crate(3, 34, 84, 53));
write('room/storm_lantern', 30, 150,
  S('M15 0v98', C.ink, 5) + S('M15 1v97', C.ochre, 1.8) +
  S('M7 110q8-16 16 0', C.ink, 5) + S('M7 110q8-16 16 0', C.steel, 2) +
  R(6, 108, 18, 30, 5, C.butter, 2.6) + S('M12 114v18m6-18v18', C.slateBlue, 2) + F('M12 130l3-8 3 8Z', C.gold, 0) +
  R(4, 104, 22, 8, 3, C.slateBlue, 2.6) + R(3, 136, 24, 11, 3, C.slateBlue, 2.6) + S('M8 141h14', C.steel, 1.8));

// The prize cow again, as a paper print: decor in Dave's rooms, so the framed portrait stays a solid prop.
const cowSvg = readFileSync(`${ART_DIR}room/portrait_cow.svg`, 'utf8');
const cow = cowSvg.slice(cowSvg.indexOf('<path d="M16 73'), cowSvg.indexOf('<path d="M13 11H103'));
write('room/cow_pinup', 120, 100,
  G(F('M9 9H110L113 78L100 93H8Z', '#e8dcc3', 3) + F('M100 93l2-13 11-2Z', '#b9ab95', 2.5) + R(15, 15, 90, 70, 2, C.slateBlue, 0) + cow +
    R(48, 3, 22, 10, 2, '#f3e9c9', 1.5, { opacity: 0.9, transform: 'rotate(-4 59 8)' }), { transform: 'rotate(-3 60 50)' }));

// 1953 flight map: the ploughed strips, each drawn at its own size with the same row pitch.
function fieldRows(key, w, h) {
  write(key, w, h, R(4, 3, w - 8, h - 6, 13, '#3c3552', 0) + row(Math.floor((h - 22) / 28), i =>
    R(12, 14 + i * 28, w - 24, 12, 6, i % 2 ? '#585064' : '#443951', 0) +
    S(`M18 ${20 + i * 28}h${w - 41}`, '#695766', 1.3, { 'stroke-dasharray': '11 13' })));
}
fieldRows('flight/invasion_field_rows_wide', 300, 360);
fieldRows('flight/invasion_field_rows_strip', 210, 325);
fieldRows('flight/invasion_field_rows_patch', 230, 200);

for (const f of written) console.log(`${f.key}\t${f.w}x${f.h}\t${(f.bytes / 1024).toFixed(1)} KB`);
console.log(`${written.length} files`);
