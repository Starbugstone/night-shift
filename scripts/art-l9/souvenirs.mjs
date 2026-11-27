// L9 souvenirs: small loose props, side view, resting on their bottom edge, top clear for a grasp.
import { C, E, F, G, INK, R, S, path, r1, radial, write } from './lib.mjs';

export function souvenirs() {
  // retro skateboard (58×26): upswept purple deck, wide yellow diagonal stripe, two cream wheels
  let o = '';
  o += R(11, 15, 8, 5, 1.5, '#8792a6', 2) + R(39, 15, 8, 5, 1.5, '#8792a6', 2);
  o += E(15, 21, 4.2, 4.2, C.custard, 2.4) + E(43, 21, 4.2, 4.2, C.custard, 2.4) + E(15, 21, 1.4, 1.4, C.rust, 0) + E(43, 21, 1.4, 1.4, C.rust, 0);
  o += F('M2 6Q2 2 6 3Q10 9 16 9H42Q48 9 52 3Q56 2 56 6Q54 16 44 16H14Q4 16 2 6Z', '#7a4fa0', 2.6);
  o += path('M22 9.4H36L28 15.6H14Z', { fill: '#ffd24a' }) + S('M5 6Q9 11.5 16 11.5H24', '#b08ad0', 1.8) + S('M14 16H44', '#4f2f70', 1.6);
  write('room/retro_skateboard', 58, 26, o);

  // cherry electric guitar (62×34): double-cutaway body, black pickguard, long neck at a low diagonal
  o = S('M30 20L56 6', INK, 6.4) + S('M30 20L56 6', '#6f5243', 3) + S('M33 18.6L55 6.8', '#93705a', 1);
  o += F('M52 5l6 -4q3 0 3 3l-4 7q-3 1 -5 -1Z', C.custard, 2.2) + E(56.6, 4.4, 0.9, 0.9, INK, 0) + E(54.8, 7.6, 0.9, 0.9, INK, 0);
  o += F('M4 22Q2 13 10 12Q13 6 19 9Q22 11 22 14Q26 9 31 11Q35 14 33 19Q38 24 34 29Q30 33 20 32Q6 33 4 22Z', '#b8323f', 2.6);
  o += S('M7 22Q6 16 11 15', '#e0646b', 2) + F('M17 17Q23 14 28 17L27 24Q22 27 17 24Z', '#1f212b', 1.6) + S('M19.6 18.4V24M23.6 17.6V24.6', '#d8dde6', 1.5);
  o += S('M11 20q-2 3 1 6', INK, 1.5) + E(29.6, 26.6, 1.3, 1.3, C.gold, 0.8) + E(26, 28.6, 1.3, 1.3, C.gold, 0.8) + R(13.4, 26.4, 5.6, 2.4, 1, C.gold, 1);
  write('room/cherry_guitar', 62, 34, o);

  // spare flex capacitor (42×38): a thick lunchbox frame round three bright tubes that meet in one hub
  const fd = radial('fg', [[0, '#fff6d8', 0.9], [1, '#ffe49b', 0]]);
  o = S('M15 5Q21 -1 27 5', INK, 5) + S('M15 5Q21 -1 27 5', '#8792a6', 2);
  o += R(2, 5, 38, 31, 5, '#8792a6', 2.8) + S('M6 9H36', '#d8dde6', 2) + R(7, 10, 28, 22, 3, '#1f212b', 2.2);
  o += E(21, 21, 13, 10, 'url(#fg)', 0);
  const y = 'M21 22V30M21 22L12.6 13.6M21 22L29.4 13.6';
  o += S(y, '#ffbd68', 4.6) + S(y, '#fff6d8', 2.2) + E(21, 22, 2.6, 2.6, '#fff6d8', 1.2, { stroke: '#ffbd68' });
  o += E(5, 33, 1.2, 1.2, INK, 0) + E(37, 33, 1.2, 1.2, INK, 0) + R(30, 33.4, 6, 2, 1, C.red, 0) + S('M9 12.6l3 -1', '#59627a', 1.4);
  write('room/flex_capacitor', 42, 38, o, fd);

  // yellow hazmat suit (46×40): folded coverall, big dark hood window, two loose glove ends
  o = F('M3 36Q2 20 10 17L12 9Q14 3 23 3Q32 3 34 9L36 17Q44 20 43 36Q23 40 3 36Z', '#f2c531', 2.8);
  o += S('M6 28Q23 33 40 28', '#c9981f', 2.2) + S('M5 22Q23 27 41 22', '#c9981f', 1.8) + S('M8 33Q12 34.6 17 35', '#fff0a8', 1.8);
  o += F('M15 9Q15 6 23 6Q31 6 31 9V14Q31 17 23 17Q15 17 15 14Z', '#1f2733', 2.4) + S('M18 9.4q3 -1.6 7 -1.4', '#7f93b3', 1.8);
  o += F('M2 26Q-1 31 3 36Q6 38.6 8 36L10 27Z', '#3a4558', 2.4) + F('M44 26Q47 31 43 36Q40 38.6 38 36L36 27Z', '#3a4558', 2.4) + S('M4 31v3M42 31v3', '#647899', 1.4);
  o += S('M23 18V36', '#c9981f', 1.8) + R(20, 20, 6, 4, 1, '#1f2733', 1.2);
  write('room/hazmat_suit', 46, 40, o);

  // red puffy vest (46×38): two open armholes and three bold horizontal baffles
  o = F('M10 3Q14 1 18 3Q23 8 28 3Q32 1 36 3L43 9Q40 14 39 20L42 34Q23 39 4 34L7 20Q6 14 3 9Z', '#d5483b', 2.8);
  o += F('M18 3Q23 8 28 3L26 12Q23 14 20 12Z', '#8a2a2a', 2) + S('M23 13V36', '#8a2a2a', 2);
  o += S('M7.4 18Q23 23 38.6 18M6 25.6Q23 31 40 25.6', '#8a2a2a', 2.6) + S('M9 13Q14 15.4 20 15.6M9 21Q14 24 20 24.4M8 28.6Q13 31.6 19 32', '#f08a78', 1.8);
  o += F('M3 9Q7 12 7 20Q5 14 3 12Z', '#8a2a2a', 0) + F('M43 9Q39 12 39 20Q41 14 43 12Z', '#8a2a2a', 0);
  o += E(25.4, 17, 1.1, 1.1, C.custard, 0) + E(25.4, 24, 1.1, 1.1, C.custard, 0) + E(25.4, 31, 1.1, 1.1, C.custard, 0);
  write('room/puffy_vest', 46, 38, o);

  // clock-tower flyer (40×44): cream sheet, a clock woodcut over two thirds, a torn tab; no words
  o = F('M4 3H33L37 8V33L34 42H27L26 38L24 42H5Z', C.custard, 2.6) + F('M33 3V8H37Z', '#e5cc9f', 1.6);
  // headline bars: abstract marks, the real words are drawn by code on the trophy card
  o += R(8, 6, 20, 3.6, 1, '#7d4c52', 0) + S('M8 12.6H30', '#93705a', 1.6);
  // woodcut: tower shoulders, a big dial, bolt
  o += F('M10 39V25L13 22V18H29V22L32 25V39Z', '#3a2b3f', 0) + E(21, 26, 8.6, 8.6, C.custard, 2) + S('M21 19.6v2.2M21 30.2v2.2M14.6 26h2.2M25.2 26h2.2', '#3a2b3f', 1.4) + S('M21 26V21.4M21 26L24.6 27.6', INK, 1.7);
  o += F('M31 13l-4 6h3l-3 6l7 -8h-3l2 -4Z', '#e0a43a', 1.2);
  o += S('M26 38V41', '#c9b58f', 1.2);
  write('room/clock_flyer', 40, 44, o);
}
if (import.meta.url === `file://${process.argv[1]}`) souvenirs();
