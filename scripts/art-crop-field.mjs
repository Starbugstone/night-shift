#!/usr/bin/env node
// public/art/flight/crop_field_top.svg: a fenced wheat field on the edge of Maple Court (L3), seen
// from above at night, with a crop circle pressed into it. Jokes: someone left a deck chair and a
// cool box in the middle (waiting for their lift), three-toed footprints walk out of the circle to
// the gate, and the scarecrow wears a tinfoil hat. Re-run after editing: node scripts/art-crop-field.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art', 'flight', 'crop_field_top.svg');
const W = 480;
const H = 340;
const INK = '#1b1433';
const WHEAT = '#a07a4a';
const WHEAT_DARK = '#7d5c3c';
const WHEAT_LIGHT = '#cfa66a';
const FLAT = '#e5cc9f';
const FLAT_LINE = '#c9a874';
const WOOD = '#895e55';
const WOOD_LIGHT = '#bb9161';
const MINT = '#64c5a1';
const TEAL = '#468c89';
const RED = '#dc6866';
const FOIL = '#c9d3e3';

const r1 = (n) => Math.round(n * 10) / 10;
const parts = [];
const add = (s) => parts.push(s);

// ---- wheat texture: rows of tufts, as a pattern tile (two staggered tufts per tile)
const tuft = (x, y) =>
  `<path d="M${x} ${y}q-3 -6 -7 -7M${x} ${y}q0 -7 1 -9M${x} ${y}q3 -6 7 -6" fill="none" stroke="${WHEAT_LIGHT}" stroke-width="1.8"/>`;
const defs = `<defs>
<pattern id="wheat" width="30" height="14" patternUnits="userSpaceOnUse">
<rect width="30" height="14" fill="${WHEAT}"/>
<path d="M0 12.5H30" stroke="${WHEAT_DARK}" stroke-width="3"/>
${tuft(8, 11)}${tuft(23, 11)}
</pattern>
<clipPath id="field"><rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="16"/></clipPath>
</defs>`;

// ---- ground round the field, fence shadow
add(`<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="26" fill="#28575c" stroke="${INK}" stroke-width="4"/>`);
add(`<rect x="18" y="18" width="${W - 36}" height="${H - 36}" rx="16" fill="url(#wheat)" stroke="${INK}" stroke-width="3"/>`);

// ---- the crop circle (flattened crop is pale, swept in rings), clipped to the field
const cx = 236;
const cy = 162;
const circle = [];
const flat = (s) => circle.push(s);
// connecting lines first, so the circles sit on top of them
flat(`<path d="M${cx + 96} ${cy}H404" stroke="${WHEAT_DARK}" stroke-width="13" fill="none"/>`);
flat(`<path d="M${cx + 96} ${cy}H404" stroke="${FLAT}" stroke-width="8" fill="none"/>`);
// the big ring
flat(`<circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${WHEAT_DARK}" stroke-width="20"/>`);
flat(`<circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${FLAT}" stroke-width="15"/>`);
flat(`<circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${FLAT_LINE}" stroke-width="1.6" stroke-dasharray="9 6"/>`);
// the centre disc, swept in a spiral
flat(`<circle cx="${cx}" cy="${cy}" r="46" fill="${FLAT}" stroke="${WHEAT_DARK}" stroke-width="3"/>`);
let spiral = `M${cx} ${cy}`;
for (let a = 0.4; a < Math.PI * 7; a += 0.35) {
  const r = 2 + a * 2.0;
  spiral += `L${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`;
}
flat(`<path d="${spiral}" fill="none" stroke="${FLAT_LINE}" stroke-width="1.8"/>`);
// three satellites on the ring
for (const deg of [-90, 30, 150]) {
  const a = (deg * Math.PI) / 180;
  const x = cx + Math.cos(a) * 96;
  const y = cy + Math.sin(a) * 96;
  flat(`<circle cx="${r1(x)}" cy="${r1(y)}" r="19" fill="${FLAT}" stroke="${WHEAT_DARK}" stroke-width="3"/>`);
  flat(`<circle cx="${r1(x)}" cy="${r1(y)}" r="10" fill="none" stroke="${FLAT_LINE}" stroke-width="1.6"/>`);
}
// the trailing chain: shrinking dots heading east
for (const [x, r] of [[372, 15], [404, 10], [428, 6]]) {
  flat(`<circle cx="${x}" cy="${cy}" r="${r}" fill="${FLAT}" stroke="${WHEAT_DARK}" stroke-width="3"/>`);
}
add(`<g clip-path="url(#field)">${circle.join('')}</g>`);

// ---- in the middle: someone's deck chair and cool box, facing the sky
add(`<g transform="translate(${cx - 12} ${cy - 3}) rotate(-12)">
<rect x="-11" y="-15" width="22" height="30" rx="3" fill="${MINT}" stroke="${INK}" stroke-width="2.5"/>
<path d="M-11 -6H11M-11 3H11" stroke="${FLAT}" stroke-width="3"/>
<path d="M-13 -15V15M13 -15V15" stroke="${WOOD}" stroke-width="2.5"/>
</g>`);
add(`<g transform="translate(${cx + 18} ${cy + 10}) rotate(8)">
<rect x="-8" y="-6" width="16" height="12" rx="2" fill="${RED}" stroke="${INK}" stroke-width="2.5"/>
<path d="M-8 -1H8" stroke="#ffffff" stroke-width="2"/>
</g>`);

// ---- three-toed footprints from the circle to the gate (south-east)
const foot = (x, y, rot) =>
  `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})"><ellipse cx="0" cy="2" rx="3" ry="4" fill="${WHEAT_DARK}"/><path d="M0 -1L-4 -7M0 -1L0 -8M0 -1L4 -7" stroke="${WHEAT_DARK}" stroke-width="2"/></g>`;
const from = { x: cx + 40, y: cy + 32 };
const to = { x: 412, y: 306 };
const steps = 11;
const heading = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
for (let i = 0; i < steps; i++) {
  const t = (i + 0.5) / steps;
  const side = i % 2 ? 6 : -6;
  const nx = -(to.y - from.y);
  const ny = to.x - from.x;
  const n = Math.hypot(nx, ny);
  add(foot(from.x + (to.x - from.x) * t + (nx / n) * side, from.y + (to.y - from.y) * t + (ny / n) * side, heading));
}

// ---- scarecrow in the north-west corner, tinfoil hat on, staring up
add(`<g transform="translate(78 76)">
<path d="M-30 4H30" stroke="${INK}" stroke-width="7"/><path d="M-30 4H30" stroke="${WOOD}" stroke-width="4"/>
<rect x="-12" y="-6" width="24" height="24" rx="5" fill="${TEAL}" stroke="${INK}" stroke-width="2.5"/>
<path d="M-12 6H12" stroke="#28575c" stroke-width="2"/>
<path d="M-34 0l4 4-4 4M34 0l-4 4 4 4" fill="none" stroke="${WHEAT_LIGHT}" stroke-width="2"/>
<circle cx="0" cy="-2" r="11" fill="${FOIL}" stroke="${INK}" stroke-width="2.5"/>
<path d="M0 -13L-6 6M0 -13L7 5M0 -13L-10 -5M0 -13L10 -6" stroke="#8d97ab" stroke-width="1.4"/>
<circle cx="0" cy="-2" r="2.5" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>
</g>`);

// ---- fence: rails round the field with a gap for the gate, posts, and the gate swung open
const fenceY0 = 11;
const fenceY1 = H - 11;
const fenceX0 = 11;
const fenceX1 = W - 11;
const gateA = 392;
const gateB = 432;
const rail = `M${gateA} ${fenceY1}H${fenceX0 + 10}Q${fenceX0} ${fenceY1} ${fenceX0} ${fenceY1 - 10}V${fenceY0 + 10}Q${fenceX0} ${fenceY0} ${fenceX0 + 10} ${fenceY0}H${fenceX1 - 10}Q${fenceX1} ${fenceY0} ${fenceX1} ${fenceY0 + 10}V${fenceY1 - 10}Q${fenceX1} ${fenceY1} ${fenceX1 - 10} ${fenceY1}H${gateB}`;
add(`<path d="${rail}" fill="none" stroke="${INK}" stroke-width="8"/>`);
add(`<path d="${rail}" fill="none" stroke="${WOOD}" stroke-width="4"/>`);
const posts = [];
for (let x = fenceX0 + 34; x < fenceX1 - 20; x += 46) {
  posts.push([x, fenceY0]);
  if (x < gateA - 10 || x > gateB + 10) posts.push([x, fenceY1]);
}
for (let y = fenceY0 + 40; y < fenceY1 - 20; y += 46) posts.push([fenceX0, y], [fenceX1, y]);
posts.push([gateA, fenceY1], [gateB, fenceY1]);
for (const [x, y] of posts) add(`<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" rx="2" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.5"/>`);
// the gate, swung outward
add(`<path d="M${gateA} ${fenceY1}l-22 9" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M${gateA} ${fenceY1}l-22 9" stroke="${WOOD_LIGHT}" stroke-width="4" stroke-linecap="round"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>Crop field with a crop circle</title>${defs}<g stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g></svg>\n`;
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${svg.length} bytes)`);
