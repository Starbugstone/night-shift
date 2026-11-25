import { existsSync, writeFileSync } from 'node:fs';
import { ART, RETIRED_ART } from '../src/art-manifest.ts';

const directory = new URL('../public/art/', import.meta.url);
const specs = new Map(Object.entries({ ...ART, ...RETIRED_ART }).map(([key, { w, h }]) => [key, { width: w, height: h }]));

const styles = `
* { box-sizing:border-box }
html { scroll-behavior:smooth }
body { margin:0; background:#17192d; color:#ffedc9; font:16px/1.4 system-ui,sans-serif }
.wrap { width:min(1160px,calc(100% - 64px)); margin:auto }
.mast { background:#222440; overflow:hidden; border-top:5px solid #7CFFCB }
.topline,.headline,.topline span,.dept,nav .wrap,header,figcaption,footer { display:flex; align-items:center }
.topline,header,footer { justify-content:space-between }
.topline { height:53px; border-bottom:1px solid #495374; color:#a7b7ce; font:12px/1.2 ui-monospace,monospace }
.dept { gap:12px; color:#d8ffdf }
.dept i { width:13px; height:13px; border:3px double #7CFFCB; border-radius:50%; outline:1px solid #468c89; outline-offset:2px }
.headline { justify-content:space-between; min-height:239px }
.headline h1 { color:#ffedc9; font:19px/1.15 Georgia,serif; margin:0 0 24px 18px }
.logo { width:370px; max-width:100%; display:block }
.cast { align-self:end; display:flex; align-items:end; gap:18px; padding-right:28px }
.cast img:first-child { width:152px }
.cast img:last-child { width:190px }
nav { border-block:1px solid #495374; background:#222440 }
nav .wrap { gap:32px; overflow:auto; min-height:44px }
a { color:#7CFFCB; text-decoration:none }
a:hover { text-decoration:underline }
nav a { color:#e5cc9f; font:13px ui-monospace,monospace; white-space:nowrap }
section { margin-top:42px; scroll-margin-top:18px }
header { margin-bottom:17px; border-bottom:1px solid #495374; padding-bottom:13px; gap:12px }
h2 { font:normal clamp(29px,3vw,38px)/1.1 Georgia,serif; letter-spacing:-.025em; margin:0 }
header span,figcaption span,footer { color:#a7b7ce; font:12px ui-monospace,monospace }
figure { margin:0; min-width:0 }
figcaption { padding:12px 0 3px; gap:8px; justify-content:space-between }
figcaption b { font-weight:550 }
.scenes,.tiles { display:grid; grid-template-columns:1fr 1fr; gap:20px }
.stage { position:relative; overflow:hidden; aspect-ratio:540/800; container-type:inline-size; background:#222440; border-radius:8px }
.world { position:absolute; left:0; top:50%; width:540px; height:960px; transform-origin:0 50%; transform:translateY(-50%) scale(calc(100cqw / 540px)) }
.world img,.rig img { position:absolute; display:block }
.rig,.joint { width:0; height:0; position:absolute; transform-origin:0 0 }
.poses { display:grid; grid-template-columns:repeat(4,1fr); gap:12px }
.pose { background:#343756; border-radius:6px; height:300px; overflow:hidden; position:relative; container-type:inline-size }
.posedrawing { width:272px; height:300px; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(min(1,calc(100cqw / 272px))) }
.poses figcaption { align-items:start; flex-direction:column }
.repeat { border-radius:6px; aspect-ratio:1; background-size:calc(100% / 3) calc(100% / 3); background-repeat:repeat }
.gallery { display:flex; flex-wrap:wrap; align-items:end; gap:16px 14px }
.spec { flex:1 1 var(--card); max-width:100%; min-width:min(var(--card),100%); overflow:auto }
.art { display:grid; place-items:center; width:100%; min-width:max-content; min-height:93px; border-radius:4px; background-color:#40435a; background-image:conic-gradient(#393d52 25%,transparent 0 50%,#393d52 0 75%,transparent 0); background-size:18px 18px }
.art img { display:block; max-width:none }
.spec figcaption { display:block; padding:7px 1px 1px }
.spec b { display:block; color:#ffedc9; font:12px/1.4 ui-monospace,monospace }
.spec span { font-size:11px }
.tiles figcaption { font-family:ui-monospace,monospace; font-size:13px }
footer { border-top:1px solid #495374; margin:40px 0; padding:19px 0 }
@media(max-width:720px) {
  .wrap { width:calc(100% - 28px) }
  .headline { min-height:160px }
  .logo { width:255px }
  .cast { gap:0; padding:0 }
  .cast img:first-child { width:70px }
  .cast img:last-child { width:85px }
  .headline h1 { font-size:16px; margin-left:8px }
  .topline { font-size:10px }
  .scenes,.tiles { gap:10px }
  nav .wrap { gap:21px }
  .poses { grid-template-columns:1fr 1fr }
  figcaption { align-items:start; flex-direction:column }
  .pose { height:240px }
  .scenes figcaption b { font-size:14px }
  .gallery { gap:12px }
  .spec figcaption { display:block }
}
@media(max-width:440px) {
  .cast img:first-child { display:none }
  .topline span:last-child { max-width:120px; text-align:right }
  .headline { min-height:135px }
  header span { max-width:125px; text-align:right }
  .pose { height:190px }
  .scenes .stage { aspect-ratio:540/900 }
  .spec { flex-basis:min(var(--card),100%) }
}
.missing {  color:#ffbd68;  font:600 14px system-ui,sans-serif;  padding:10px }
.art {  width:max(100%,var(--image-width));  min-width:0; }
.spec figcaption {  position:sticky;  left:0; }
`;

const masthead = `<div class="mast"><div class="wrap topline"><span class="dept"><i></i> Galactic Census Bureau</span><span>Abductions Dept. &nbsp; / &nbsp; Art reference</span></div><div class="wrap headline"><div><img class="logo" src="ui/logo.svg" alt="Night Shift — Abductions Dept."><h1>Field art catalogue</h1></div><div class="cast"><img src="ui/zib_portrait.svg" alt="Zib"><img src="ui/vrell_portrait.svg" alt="Vrell"></div></div></div>`;

const approach = [
  ['flight/field_rows', -42, 92, 258, 255],
  ['flight/field_rows', -40, 377, 215, 220],
  ['flight/road_v', 345, 0, 120, 540],
  ['flight/road_v', 345, 540, 120, 540],
  ['flight/barn_top', 145, -24, 182, 192],
  ['flight/tree_top', 468, 27, 103, 101],
  ['flight/haybale_top', 277, 168, 42, 42],
  ['flight/haybale_top', 245, 201, 39, 39],
  ['flight/tractor_top', 121, 285, 58, 83.7778],
  ['flight/pickup_top', 371, 274, 64, 120],
  ['flight/streetlight_top', 431, 458, 30, 30],
  ['flight/tree_top', 462, 464, 114, 114],
  ['flight/farmhouse_top', 64, 542, 259, 219.154],
  ['flight/entry_ring', 154, 577, 92, 92],
  ['flight/dog_top', 244, 762, 50, 50],
  ['flight/tree_top', -43, 746, 142, 142],
  ['flight/tree_top', 431, 808, 162, 162],
  ['flight/saucer_top', 190, 348, 135, 135],
];
const bedroom = [
  ['room/bg_bedroom', 0, 0, 540, 960],
  ['room/exit_window', 311, 188, 160, 200],
  ['room/hanging_plant', 28, 9, 90, 157.5],
  ['room/portrait_cow', 87, 405, 123, 102, -4],
  ['room/shelf', 301, 520, 160, 24],
  ['room/cat_sleeping', 338, 472, 90, 50],
  ['room/nightstand', 335, 698, 90, 110],
  ['room/lamp', 351, 612, 60, 90],
  ['room/bed', 21, 675, 300, 140],
];

function sprite(key, x, y, width, height, angle = 0) {
  return `<img alt="" src="${key}.svg" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px;transform:rotate(${angle}deg)">`;
}

function rig(name, x, y, tilt, scale, angles) {
  function part(which, x, y) {
    const key = `human/${name}_${which}`;
    const { width, height } = specs.get(key);
    return sprite(key, x ?? -width / 2, y, width, height);
  }
  function limb(kind, x, y, index) {
    const offset = kind === 'arm' ? 49 : 57;
    return `<span class="joint" style="left:${x}px;top:${y}px;transform:rotate(${angles[index]}deg)">
      ${part('upper_' + kind, null, -4)}
      <span class="joint" style="top:${offset}px;transform:rotate(${angles[index + 1]}deg)">
        ${part('lower_' + kind, null, -4)}
      </span></span>`;
  }
  const back = limb('arm', name === 'doyle' ? -25 : -24, 25, 0);
  const legs = limb('leg', -12, 102, 2) + limb('leg', 11, 103, 4);
  const front = limb('arm', name === 'doyle' ? 21 : 20, 24, 6);
  return `<div class="rig" style="left:${x}px;top:${y}px;transform:rotate(${tilt}deg) scale(${scale})">
    ${back}${legs}${part('torso', -40, -5)}${part('head', -35, -74)}${front}</div>`;
}

function caption(label, detail) {
  return `<figcaption><b>${label}</b><span>${detail}</span></figcaption>`;
}

function section(id, heading, detail, layout, contents) {
  return `<section id="${id}"><header><h2>${heading}</h2><span>${detail}</span></header>
    <div class="${layout}">${contents}</div></section>`;
}

function scene(label, detail, contents) {
  return `<figure class="scene"><div class="stage"><div class="world">${contents}</div></div>
    ${caption(label, detail)}</figure>`;
}

const farm = '<div style="position:absolute;inset:0;background:url(flight/ground_farm.svg) repeat"></div>'
  + approach.map(args => sprite(...args)).join('');
const bed = bedroom.map(args => sprite(...args)).join('')
  + rig('doyle', 111, 721, -86, 0.73, [17, -46, 21, -24, -5, 25, -15, 49])
  + sprite('room/slipper', 163, 815, 40, 20, -7) + sprite('ui/zzz', 48, 653, 29, 29);
const scenes = section('scenes', 'Scene studies', 'Farm work order', 'scenes',
  scene('Approach to Doyle Farm', 'Overhead flight', farm) + scene('Doyle’s bedroom', 'Window entry', bed));

const poses = [];
for (const [name, label] of [['doyle', 'Farmer Doyle'], ['larry', 'Laundromat Larry']]) {
  for (const [pose, drawing] of [
    ['T-pose', rig(name, 136, 78, 0, .9, [90, 0, 10, 0, -9, 0, -90, 0])],
    ['Flopped', rig(name, 80, 100, -47, .9, [53, -66, 38, 54, -41, 77, -73, -61])],
  ]) {
    poses.push(`<figure><div class="pose"><div class="posedrawing">${drawing}</div></div>${caption(label, pose)}</figure>`);
  }
}
const tiles = [...specs.keys()].filter(key => key.startsWith('flight/ground_')).map(key =>
  `<figure><div class="repeat" style="background-image:url(${key}.svg)"></div><figcaption><b>${key.slice(7)}</b></figcaption></figure>`);

const groups = new Map();
let missing = 0;
for (const [key, { width, height }] of specs) {
  const group = key.split('/')[0];
  if (!groups.has(group)) groups.set(group, []);
  const present = existsSync(new URL(key + '.svg', directory));
  if (!present) missing++;
  const sample = present
    ? `<img src="${key}.svg" alt="${key}" loading="lazy" width="${width}" height="${height}">`
    : '<strong class="missing">Missing SVG</strong>';
  groups.get(group).push(`<figure class="spec" style="--card:${Math.max(165, width)}px;--image-width:${width}px">
    <div class="art" style="min-height:${Math.max(93, height)}px">${sample}</div>${caption(key, `${width} × ${height}`)}</figure>`);
}
const titles = { flight: 'Flight', room: 'Rooms', human: 'Human parts', ui: 'Interface' };
const galleries = [...groups].map(([id, figures]) =>
  section(id, titles[id] ?? id, `${figures.length} sprites · Native size`, 'gallery', figures.join('\n')));
const nav = [['scenes', 'Scenes'], ['poses', 'Poses'], ['tiles', 'Tiles'],
  ...[...groups.keys()].map(id => [id, titles[id] ?? id])];
const document = `<!doctype html>
<html lang="en" id="top"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Field art catalogue · Night Shift</title><style>${styles}</style></head><body>
${masthead}<nav><div class="wrap">${nav.map(([id, title]) => `<a href="#${id}">${title}</a>`).join('')}</div></nav>
<main class="wrap">${scenes}${section('poses', 'Articulation', 'Top-centre limb pivots', 'poses', poses.join(''))}
${section('tiles', 'Ground repeats', '3 × 3 tiles per sample', 'tiles', tiles.join(''))}
${galleries.join('\n')}<footer><a href="PALETTE.md">Palette and assembly notes ↗</a><span>${specs.size} sprites · ${missing} missing</span><a href="#top">Back to top ↑</a></footer></main></body></html>\n`;
writeFileSync(new URL('contact-sheet.html', directory), document);
console.log(`Catalogued ${specs.size} sprites (${missing} missing).`);
