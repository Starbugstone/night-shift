// L9 flight props: lamps, 1955 cars, the cruiser, the trunk car, light fixtures, storm, bolt and tyre fire.
import { C, E, F, G, INK, R, S, el, lin, path, r1, rng, write } from './lib.mjs';

/** A 1950s car in plan (80×150, nose north): pontoon wings, chrome, whitewalls peeking out. */
function car55({ body, roof, twoTone, fins = true, wagon = false, key, extra = '', w = 80, h = 150 }) {
  let o = '';
  const cx = w / 2;
  // whitewall tyres peeking sideways
  for (const y of [34, h - 44]) for (const s of [-1, 1]) o += R(cx + s * (w / 2 - 9) - 4, y, 8, 22, 3.5, INK, 0) + R(cx + s * (w / 2 - 5.6) - 1.6, y + 4, 3.2, 14, 1.6, C.custard, 0);
  // body: rounded pontoon nose, tail fins flaring at the back
  const tail = fins && !wagon
    ? `L${w - 6} ${h - 26}L${w - 4} ${h - 5}Q${w - 5} ${h - 2.5} ${w - 12} ${h - 3}H12Q5 ${h - 2.5} 4 ${h - 5}L6 ${h - 26}`
    : `L${w - 6} ${h - 14}Q${w - 7} ${h - 3} ${w - 16} ${h - 3}H16Q7 ${h - 3} 6 ${h - 14}`;
  o += F(`M8 28Q8 6 24 4Q${cx} 0 ${w - 24} 4Q${w - 8} 6 ${w - 8} 28${tail}Z`, body, 3.5);
  // two-tone sweep: the lower flanks in the second colour
  if (twoTone) o += F(`M9.5 50V${h - 24}Q${cx} ${h - 12} ${w - 9.5} ${h - 24}V50Q${cx} 62 9.5 50Z`, twoTone, 0);
  // bonnet crease, chrome spear and the split grille
  o += S(`M${cx} 9V44`, INK, 1.6, { opacity: 0.5 }) + S(`M${cx} 8V20`, '#eef1f4', 2.6) + S(`M18 12Q${cx} 5 ${w - 18} 12`, '#eef1f4', 2.4);
  o += S(`M15 30Q16 14 26 10`, '#ffffff', 2.2, { opacity: 0.5 });
  // headlamps
  o += E(15.5, 12, 5, 4.4, C.butter, 2.2) + E(w - 15.5, 12, 5, 4.4, C.butter, 2.2);
  // glasshouse
  const y0 = wagon ? 46 : 50;
  const y1 = wagon ? h - 18 : h - 44;
  o += F(`M12 ${y0 + 6}Q${cx} ${y0 - 8} ${w - 12} ${y0 + 6}L${w - 14} ${y1}Q${cx} ${y1 + 8} 14 ${y1}Z`, C.pine, 3);
  o += F(`M16 ${y0 + 7}Q${cx} ${y0 - 3} ${w - 16} ${y0 + 7}L${w - 19} ${y0 + 19}Q${cx} ${y0 + 12} 19 ${y0 + 19}Z`, '#3d7a7a', 0) + S(`M19 ${y0 + 9}l8 -3`, '#d8ffdf', 2, { opacity: 0.7 });
  o += F(`M18.5 ${y0 + 21}Q${cx} ${y0 + 14} ${w - 18.5} ${y0 + 21}L${w - 19} ${y1 - 12}Q${cx} ${y1 - 6} 19 ${y1 - 12}Z`, roof, 3);
  o += S(`M24 ${y0 + 27}Q26 ${y0 + 23} 32 ${y0 + 22}`, '#ffffff', 2.2, { opacity: 0.55 });
  if (wagon) {
    // long roof with rack rails, wood flanks and a square tailgate
    o += S(`M26 ${y0 + 30}V${y1 - 20}M${w - 26} ${y0 + 30}V${y1 - 20}`, '#eef1f4', 2.2) + S(`M26 ${y0 + 44}H${w - 26}M26 ${y1 - 34}H${w - 26}`, '#eef1f4', 1.8);
    o += S(`M9.5 58V${h - 22}M${w - 9.5} 58V${h - 22}`, C.ochre, 4.5) + S(`M9.5 78h0M9.5 100h0M${w - 9.5} 78h0M${w - 9.5} 100h0`, C.rust, 4.5);
    o += R(14, h - 15, w - 28, 9, 2.5, '#eef1f4', 2.5) + R(16, h - 9.5, 9, 5, 1.5, C.red, 1.5) + R(w - 25, h - 9.5, 9, 5, 1.5, C.red, 1.5);
  } else {
    // boot lid, chrome bumper and round tail lamps in the fins
    o += S(`M20 ${h - 38}Q${cx} ${h - 32} ${w - 20} ${h - 38}`, INK, 1.6, { opacity: 0.5 }) + S(`M14 ${h - 6.5}H${w - 14}`, '#eef1f4', 3);
    if (fins) o += F(`M7.5 ${h - 26}L5.8 ${h - 7}L12 ${h - 8}Z`, C.red, 1.6) + F(`M${w - 7.5} ${h - 26}L${w - 5.8} ${h - 7}L${w - 12} ${h - 8}Z`, C.red, 1.6);
  }
  o += extra;
  write(key, w, h, o);
}

function cars() {
  car55({ key: 'flight/sedan55_top', body: C.enamel, roof: C.custard, twoTone: C.custard });
  car55({ key: 'flight/wagon55_top', body: '#b98f6c', roof: C.oxide, wagon: true });
  // patrol saloon: black over white, one glass beacon, ivory door shields
  const beacon = E(40, 78, 7.5, 7.5, '#3a2b3f', 3) + E(40, 78, 5, 5, '#c94f58', 1.5) + E(38.4, 76.2, 1.7, 1.4, '#ffd9d2', 0);
  const shields = [-1, 1].map((s) => F(`M${40 + s * 27} 66l${s * 4} 1.5v6q0 4 ${-s * 4} 6Z`, C.custard, 1.6)).join('');
  car55({ key: 'flight/police55_top', body: '#2a2c40', roof: C.custard, twoTone: C.custard, fins: false, extra: beacon + shields });
}

function trunkSedan() {
  // dance-lot saloon (92×160): lid raised at the south end, pale lining; latch (46,137), side door (76,79)
  const w = 92;
  const h = 160;
  let o = '';
  for (const y of [34, 100]) for (const s of [-1, 1]) o += R(46 + s * 37 - 4, y, 8, 22, 3.5, INK, 0) + R(46 + s * 40.4 - 1.6, y + 4, 3.2, 14, 1.6, C.custard, 0);
  o += F(`M8 30Q8 6 26 4Q46 0 66 4Q84 6 84 30L86 124L88 150Q87 156 78 156H14Q5 156 4 150L6 124Z`, C.oxide, 3.5);
  o += F(`M9.5 52V122Q46 132 82.5 122V52Q46 64 9.5 52Z`, C.custard, 0);
  o += S('M46 9V46', INK, 1.6, { opacity: 0.5 }) + S('M46 8V20', '#eef1f4', 2.6) + S('M20 12Q46 5 72 12', '#eef1f4', 2.4) + E(17, 12, 5.4, 4.6, C.butter, 2.2) + E(75, 12, 5.4, 4.6, C.butter, 2.2);
  o += F('M13 56Q46 42 79 56L77 108Q46 116 15 108Z', C.pine, 3) + F('M17 57Q46 47 75 57L72 69Q46 62 20 69Z', '#3d7a7a', 0) + F('M20 71Q46 64 72 71L71 96Q46 102 21 96Z', C.oxide, 3) + S('M26 78Q28 73 34 72', '#ffffff', 2.2, { opacity: 0.55 });
  // near-side door handle, the route's alignment mark at (76,79)
  o += S('M80.5 76v7', '#eef1f4', 2.6);
  // open boot: the well with its pale lining, the lid standing up at the back edge of the cabin
  o += F('M13 114H79L81 148Q46 153 11 148Z', '#2a2233', 3) + F('M18 119H74L75.5 144Q46 148 16.5 144Z', '#d9c7b8', 2.2) + S('M22 124H70M21 131H71', '#b9a290', 1.6);
  o += F('M12 106Q46 98 80 106L79 118Q46 111 13 118Z', '#b3767a', 3) + S('M18 108Q46 102 74 108', '#d9a3a3', 2);
  // loose latch on the lip (46,137), fins and tail lamps
  o += R(41, 148, 10, 6, 2, '#eef1f4', 2) + E(46, 137, 3.4, 3.4, C.gold, 2) + E(46, 137, 1.2, 1.2, INK, 0);
  o += F('M7.5 126L5.5 150L12 150Z', C.red, 1.6) + F('M84.5 126L86.5 150L80 150Z', C.red, 1.6) + S('M16 154.5H38M54 154.5H76', '#eef1f4', 2.6);
  write('flight/trunk_sedan55_top', w, h, o);
}

function lamps() {
  // gooseneck contact lamp (64×80): the doubled ceramic spool is centred on (42,22)
  let o = E(26, 66, 11, 11, C.teal, 3.5) + E(26, 66, 6.5, 6.5, C.enamel, 2) + S('M26 55v22M15 66h22M18.5 58.5l15 15M33.5 58.5l-15 15', INK, 1.3, { opacity: 0.6 });
  o += S('M26 60Q26 34 20 24', INK, 7) + S('M26 60Q26 34 20 24', C.enamel, 3.4);
  o += E(19, 20, 13, 12, C.teal, 3.5) + E(19, 20, 8, 7.2, C.butter, 2.2) + E(17, 18, 3, 2.4, '#ffffff', 0, { opacity: 0.8 });
  // bracket arm out to the spool
  o += S('M30 20H40', INK, 6) + S('M30 20H40', '#8792a6', 2.6);
  // two porcelain sheaves on one steel pin: ribbed cream drums, waisted in the middle
  o += S('M42 9V35', INK, 5) + S('M42 9V35', '#8792a6', 2);
  o += F('M33 13Q42 10 51 13V20Q42 22.5 33 20Z', C.custard, 2.6) + F('M33 24Q42 21.5 51 24V31Q42 34 33 31Z', C.custard, 2.6);
  o += S('M35 16.5Q42 14.5 49 16.5M35 27.5Q42 25.5 49 27.5', '#c9b58f', 1.5) + S('M36 14.2Q39 13.2 41 13.2M36 25.2Q39 24.2 41 24.2', '#ffffff', 1.4);
  o += E(42, 9, 2.6, 2.6, '#d8dde6', 2) + E(42, 35, 2.6, 2.6, '#d8dde6', 2);
  write('flight/contact_lamp55_top', 64, 80, o);

  // ordinary street lamp (38×52): short shepherd's crook, fluted base, custard bulb
  o = E(19, 42, 8.5, 8.5, C.teal, 3) + E(19, 42, 4.6, 4.6, C.enamel, 1.8) + S('M19 34v16M11 42h16', INK, 1.2, { opacity: 0.6 });
  o += S('M19 38Q20 24 19 18', INK, 6) + S('M19 38Q20 24 19 18', C.enamel, 2.8);
  o += E(19, 13, 10.5, 9.5, C.teal, 3) + E(19, 13, 6.4, 5.6, C.custard, 2) + E(17.4, 11.6, 2.2, 1.8, '#ffffff', 0, { opacity: 0.8 });
  write('flight/streetlamp55_top', 38, 52, o);

  // marshal's torch (32×24), lens to the right
  o = R(2, 8, 17, 8, 3.5, C.oxide, 2.5) + S('M6 10.5h9', '#c98a8c', 1.6) + F('M18 7L26 3.5V20.5L18 17Z', '#8792a6', 2.5) + R(25, 2.5, 5, 19, 2, C.butter, 2.5) + S('M27.4 6v6', '#ffffff', 1.4);
  write('flight/marshal55_torch', 32, 24, o);

  // dance spot (52×60): barn-door hood, lens north
  o = S('M26 56V40', INK, 6) + S('M26 56V40', '#8792a6', 2.6) + R(16, 52, 20, 6, 2.5, '#4b5870', 2.5);
  o += S('M10 36Q10 46 26 46Q42 46 42 36', INK, 5.5) + S('M10 36Q10 46 26 46Q42 46 42 36', '#8792a6', 2.2);
  o += R(11, 16, 30, 24, 5, C.aubergine, 3.5) + S('M15 34H37', '#7d6e90', 2);
  o += F('M11 18L3 6H14L17 16Z', '#4a4560', 2.8) + F('M41 18L49 6H38L35 16Z', '#4a4560', 2.8) + F('M15 16L14 4H38L37 16Z', '#3a3550', 2.8);
  o += R(15, 10, 22, 9, 3, C.butter, 2.5) + S('M18 13h8', '#ffffff', 1.8);
  write('flight/dance_spot55', 52, 60, o);

  // work lamp (52×60): bulb in a wire guard on a tripod foot, lens north
  o = S('M26 44L12 57M26 44L40 57M26 44V58', INK, 5.5) + S('M26 44L12 57M26 44L40 57M26 44V58', '#b98f6c', 2.2);
  o += R(21, 34, 10, 12, 3, C.tobacco, 2.8);
  o += E(26, 20, 17, 16, '#3a4558', 3.5) + E(26, 20, 11, 10.4, C.butter, 2.5) + E(23, 17, 3.6, 3, '#ffffff', 0, { opacity: 0.85 });
  o += S('M26 4V36M15 8Q26 20 15 32M37 8Q26 20 37 32M9.5 20H42.5', INK, 1.7) + el('ellipse', { cx: 26, cy: 20, rx: 17, ry: 16, fill: 'none', stroke: '#8792a6', 'stroke-width': 1.3 });
  write('flight/worklamp55', 52, 60, o);
}

function weather() {
  // storm cloud (540×200): broad low banks and soft wisps; every edge is soft, nothing reads as a cone
  const defs = '<filter id="f" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="9"/></filter><filter id="g" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>';
  let o = G(
    E(120, 70, 150, 42, '#1a2030', 0) + E(330, 58, 190, 46, '#1a2030', 0) + E(470, 86, 110, 36, '#1a2030', 0) + E(230, 104, 170, 34, '#232b3d', 0) + E(60, 110, 90, 26, '#232b3d', 0),
    { filter: 'url(#f)', opacity: 0.82 },
  );
  o += G(E(180, 62, 90, 16, '#3a4660', 0) + E(390, 50, 110, 16, '#3a4660', 0) + E(300, 96, 80, 12, '#33405a', 0) + E(84, 92, 60, 10, '#33405a', 0), { filter: 'url(#g)', opacity: 0.6 });
  o += G(S('M40 150q40 -10 84 0M210 158q60 -12 130 0M410 146q40 -8 84 2', '#2b3448', 7, { opacity: 0.55 }), { filter: 'url(#g)' });
  write('flight/storm_cloud55', 540, 200, o, defs);

  // rain (144×144): sparse clusters of short diagonal dashes; gaps on every side so it tiles and scrolls
  const rand = rng(1004);
  let d = '';
  let d2 = '';
  for (let i = 0; i < 16; i++) {
    const x = 14 + ((i * 37) % 116) + rand() * 6;
    const y = 12 + ((i * 53) % 112) + rand() * 6;
    const len = 7 + rand() * 6;
    const seg = `M${r1(x)} ${r1(y)}l${r1(-len * 0.34)} ${r1(len)}`;
    if (i % 3 === 0) d2 += seg;
    else d += seg;
  }
  o = S(d, '#8fa3bf', 1.6, { opacity: 0.55 }) + S(d2, '#c3d2e6', 1.4, { opacity: 0.7 });
  write('flight/rain_stitch55', 144, 144, o);

  // bolt (96×224): a cold ivory fork; the main branch ends at (48,224)
  const main = 'M58 0L40 46L56 50L30 104L50 108L38 160L52 164L48 224L62 150L48 146L66 98L46 94L72 40L54 36L70 0Z';
  const forkA = 'M40 46L14 78L24 80L6 112L30 84L22 81Z';
  const forkB = 'M66 98L84 124L76 126L90 156L70 128L77 126Z';
  const bdefs = '<filter id="h" x="-60%" y="-10%" width="220%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>';
  o = G(path(main + forkA + forkB, { fill: '#b9d8ff' }), { filter: 'url(#h)', opacity: 0.55 });
  o += path(main + forkA + forkB, { fill: '#fff8e6', stroke: '#b9d8ff', 'stroke-width': 2 }) + S('M60 6L46 44M60 52L38 102M56 110L46 158', '#ffffff', 2.2);
  write('flight/tower_bolt55', 96, 224, o, bdefs);

  // tyre fire (24×96): one wheel's tile along the long axis; broken char, copper tongues, cream tips.
  // The top and bottom edges match (char at x 7–17), flames lean south-west the same way all down the tile.
  o = '';
  o += S('M12 0V14M12 22V40M11 48V62M12 70V86M12 92V96', '#3a2740', 9, { opacity: 0.9 }) + S('M9 6v6M15 30v8M9 54v6M15 76v8', '#241828', 4);
  const tongue = (x, y, s, k = 1) =>
    F(`M${x} ${y}q${s * 7 * k} ${-5 * k} ${s * 5 * k} ${-15 * k}q${-s * 1.5 * k} ${5 * k} ${-s * 5.5 * k} ${6 * k}q${s * 1 * k} ${-5 * k} ${-s * 2.5 * k} ${-8 * k}q${-s * 5 * k} ${9 * k} ${s * 3 * k} ${17 * k}Z`, '#d9703f', 1.6, { stroke: '#7a3a3a' }) +
    path(`M${x + s * 1} ${y - 2}q${s * 3.5 * k} ${-3 * k} ${s * 3 * k} ${-8 * k}q${-s * 3 * k} ${4 * k} ${-s * 3 * k} ${8 * k}Z`, { fill: C.amber }) +
    E(r1(x + s * 3.4 * k), r1(y - 9.5 * k), 1, 1.6, C.custard, 0);
  o += tongue(8, 20, -1) + tongue(15, 36, 1, 0.85) + tongue(9, 52, 1, 0.7) + tongue(16, 66, -1, 1) + tongue(8, 84, -1, 0.8) + tongue(15, 94, 1, 0.6);
  o += E(5, 30, 1.2, 1.2, C.amber, 0) + E(19, 12, 1, 1, C.amber, 0) + E(20, 56, 1.2, 1.2, C.amber, 0) + E(4, 72, 1, 1, C.amber, 0);
  write('flight/tyre_fire55', 24, 96, o);
}

export function flightProps() {
  cars();
  trunkSedan();
  lamps();
  weather();
}
if (import.meta.url === `file://${process.argv[1]}`) flightProps();
