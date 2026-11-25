// Shared helpers for the L9 1955 art generators (scripts/art-l9/*.mjs).
// Each generator writes hand-composed SVG to public/art/<key>.svg; run `node scripts/art-l9/build.mjs`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const INK = '#1b1433';
export const ART_DIR = fileURLToPath(new URL('../../public/art/', import.meta.url));
export const written = [];

export const r1 = (n) => {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? 0 : v;
};
export const rad = (d) => (d * Math.PI) / 180;

/** Path data from 2D points. */
export function d2(points, closed = true) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('') + (closed ? 'Z' : '');
}

export function attrs(a) {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
}
export const el = (tag, a, inner) => (inner === undefined ? `<${tag}${attrs(a)}/>` : `<${tag}${attrs(a)}>${inner}</${tag}>`);
export const path = (d, a = {}) => el('path', { d, ...a });

/** Writes public/art/<key>.svg with the exact manifest size. */
export function write(key, w, h, body, defs = '') {
  const file = `${ART_DIR}${key}.svg`;
  mkdirSync(dirname(file), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}<g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;
  writeFileSync(file, svg);
  written.push({ key, w, h, bytes: svg.length });
  return svg;
}

/** Deterministic pseudo-random numbers, so a rebuild gives the same file. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- shorthand for hand-composed sprites
/** The L9 palette (docs/l9/art-direction.md) plus the house swatches it leans on. */
export const C = {
  ink: INK, slate: '#303849', asphalt: '#263441', teal: '#456f73', enamel: '#719898', tobacco: '#93705a', limestone: '#c4a788',
  custard: '#ffedc9', oxide: '#995c61', aubergine: '#60516f', steel: '#a7b7ce', mint: '#7cffcb', amber: '#ffc36a', red: '#ff635f',
  night: '#222440', blue: '#343756', slateBlue: '#495374', denim: '#647899', cream: '#e5cc9f', ochre: '#bb9161', wood: '#895e55',
  umber: '#594050', gold: '#ffbd68', butter: '#ffe49b', rust: '#b56b49', brick: '#a64e5e', pine: '#28575c', plum: '#604569',
};
/** Filled shape with the ink outline. */
export const F = (d, fill, sw = 3, a = {}) => path(d, { fill, stroke: sw ? INK : undefined, 'stroke-width': sw || undefined, ...a });
/** Open stroke. */
export const S = (d, stroke, sw = 2, a = {}) => path(d, { fill: 'none', stroke, 'stroke-width': sw, ...a });
export const R = (x, y, w, h, rx, fill, sw = 3, a = {}) => el('rect', { x, y, width: w, height: h, rx: rx || undefined, fill, stroke: sw ? INK : undefined, 'stroke-width': sw || undefined, ...a });
export const E = (cx, cy, rx, ry, fill, sw = 3, a = {}) => el('ellipse', { cx, cy, rx, ry, fill, stroke: sw ? INK : undefined, 'stroke-width': sw || undefined, ...a });
export const G = (inner, a = {}) => el('g', a, inner);
export const lin = (id, x1, y1, x2, y2, stops, user = true) =>
  `<linearGradient id="${id}"${user ? ' gradientUnits="userSpaceOnUse"' : ''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op === undefined ? '' : ` stop-opacity="${op}"`}/>`).join('')}</linearGradient>`;
export const radial = (id, stops, a = '') => `<radialGradient id="${id}" ${a}>${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op === undefined ? '' : ` stop-opacity="${op}"`}/>`).join('')}</radialGradient>`;
