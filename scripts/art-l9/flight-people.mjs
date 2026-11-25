// L9 map people: layered three-quarter figures facing south, like the town pickup rigs.
// body 66×78 (shadow, legs, torso, arms); head 42×40, drawn so its centre lands on (33,22) of the body
// box (place the head box at x12, y2). The face is left clear: code draws pupils, lids and mouth.
import { C, E, F, INK, R, S, write } from './lib.mjs';

const SKIN = '#ffc9a1';
const SKIN_SHADE = '#ebaa89';
const shadow = E(33, 72, 25, 5.5, INK, 0, { opacity: 0.38 });

function usher() {
  let o = shadow;
  // trousers and shoes
  o += R(21, 54, 11, 18, 4, C.aubergine, 2.8) + R(34, 54, 11, 18, 4, C.aubergine, 2.8) + S('M26.5 57v11M39.5 57v11', '#8f81a3', 1.4);
  o += E(25.5, 72, 7.5, 4.6, '#2a2233', 2.6) + E(40.5, 72, 7.5, 4.6, '#2a2233', 2.6) + S('M21.5 70.6h5M36.5 70.6h5', '#6d6480', 1.4);
  // coat: sloped shoulders, double row of buttons, braid at the cuffs
  o += F('M33 36Q47 36 53 43L51 60Q33 65 15 60L13 43Q19 36 33 36Z', C.oxide, 3) + F('M17 55Q33 61 49 55L51 60Q33 65 15 60Z', '#7d4c52', 0);
  o += S('M33 38V62', '#7d4c52', 2) + S('M19 42Q24 39 30 38M47 42Q42 39 36 38', '#c98a8c', 1.8);
  for (const y of [45, 51, 57]) o += E(29, y, 1.5, 1.5, C.gold, 0) + E(37, y, 1.5, 1.5, C.gold, 0);
  // arms at the sides, white gloves
  o += S('M14.5 44Q10 51 13 59', INK, 9.6) + S('M14.5 44Q10 51 13 59', C.oxide, 4.8) + S('M51.5 44Q56 51 53 59', INK, 9.6) + S('M51.5 44Q56 51 53 59', C.oxide, 4.8);
  o += S('M11.6 55.5h4M51 55.5h4', C.gold, 1.6) + E(13.4, 61, 3.6, 3.6, C.custard, 2.4) + E(52.6, 61, 3.6, 3.6, C.custard, 2.4);
  // ticket wallet on a cross strap
  o += S('M20 40L45 56', INK, 4.6) + S('M20 40L45 56', C.ochre, 2) + R(41, 53, 12, 10, 2, C.ochre, 2.4) + S('M43 56.5h8', C.rust, 1.4) + R(45, 50.5, 5, 4, 1, C.custard, 1.2);
  // collar under the chin
  o += F('M26 37L33 42L40 37L37 34H29Z', C.custard, 2);
  write('flight/usher55_body', 66, 78, o);

  // head: peaked pillbox cap, near ear and cheek; the face is clear
  let h = E(7.6, 23, 3.4, 4.4, SKIN, 2.4) + E(34.4, 23, 3.4, 4.4, SKIN, 2.4);
  h += E(21, 23, 13.6, 13.4, SKIN, 3) + E(11.5, 28, 2.6, 1.7, '#d3827c', 0, { opacity: 0.7 }) + E(30.5, 28, 2.6, 1.7, '#d3827c', 0, { opacity: 0.7 });
  h += F('M8.4 15Q8 3 21 3Q34 3 33.6 15Q21 11 8.4 15Z', C.oxide, 2.8) + S('M9.6 12.4Q21 8.4 32.4 12.4', C.gold, 2.2);
  h += F('M7 16Q21 10.6 35 16Q33 20 21 17.4Q9 20 7 16Z', '#2a2233', 2.4) + S('M12 16.4Q21 13.6 30 16.4', '#6d6480', 1.2) + E(21, 7.6, 2.2, 2.2, C.gold, 1.4);
  write('flight/usher55_head', 42, 40, h);
}

function dancer() {
  let o = shadow;
  // saddle shoes and bobby socks under the hem
  o += E(26, 72, 6.6, 4.2, C.custard, 2.6) + E(40, 72, 6.6, 4.2, C.custard, 2.6) + S('M23 71.4h6M37 71.4h6', '#2a2233', 2.2);
  o += R(23.5, 62, 5, 8, 2, SKIN, 2.2) + R(37.5, 62, 5, 8, 2, SKIN, 2.2);
  // circle skirt: wide hem, petticoat peeping, two folds
  o += F('M25 48H41Q56 54 60 64Q33 72 6 64Q10 54 25 48Z', C.teal, 3) + S('M9 64.6Q33 71.6 57 64.6', C.custard, 2.2);
  o += S('M24 52L18 65M33 52V68M42 52L48 65', '#2e5258', 1.8) + S('M13 60Q17 54 24 50', C.enamel, 2);
  // fitted top, wide belt, scarf at the collar
  o += F('M33 36Q43 36 46 41L42 50H24L20 41Q23 36 33 36Z', C.custard, 2.8) + R(23.5, 47, 19, 4.6, 2, C.oxide, 2.2) + E(33, 49.3, 2, 2, C.gold, 1.2);
  o += F('M28 37L33 41L38 37L36 34.6H30Z', C.oxide, 1.8);
  // arms out a little, pale gloves to the elbow
  o += S('M20.5 41Q14 46 12.5 53', INK, 8.6) + S('M20.5 41Q14 46 12.5 53', SKIN, 4.2) + S('M45.5 41Q52 46 53.5 53', INK, 8.6) + S('M45.5 41Q52 46 53.5 53', SKIN, 4.2);
  o += S('M14.6 47.6Q13 50 12.5 53', C.custard, 4.6) + S('M51.4 47.6Q53 50 53.5 53', C.custard, 4.6) + E(12.4, 55, 3.3, 3.3, C.custard, 2.2) + E(53.6, 55, 3.3, 3.3, C.custard, 2.2);
  write('flight/dancer55_body', 66, 78, o);

  // head: broad rolled fringe and a ponytail ribbon; the face is clear
  let h = F('M30 9Q41 10 39 22Q38 31 33 32L29 20Z', '#7a4a3a', 2.6) + F('M34 8l6 -4l-1 6l4 3l-6 1Z', C.oxide, 1.8);
  h += E(7.6, 24, 3.2, 4.2, SKIN, 2.4) + E(34.4, 24, 3.2, 4.2, SKIN, 2.4);
  h += E(21, 24, 13.4, 13, SKIN, 3) + E(11.6, 29, 2.6, 1.7, '#d3827c', 0, { opacity: 0.75 }) + E(30.4, 29, 2.6, 1.7, '#d3827c', 0, { opacity: 0.75 });
  h += F('M7 19Q5 5 21 4Q37 5 35 19Q31 12 21 13.6Q11 12 7 19Z', '#7a4a3a', 2.8);
  h += F('M9.6 12Q14 5.6 21 9Q28 5.6 32.4 12Q28 16 21 13.4Q14 16 9.6 12Z', '#93604a', 2.2) + S('M13 10.6Q16 8.4 19 10M24 10Q27 8.4 30 10.6', '#c98a6a', 1.5);
  write('flight/dancer55_head', 42, 40, h);
}

export function flightPeople() {
  usher();
  dancer();
}
if (import.meta.url === `file://${process.argv[1]}`) flightPeople();
