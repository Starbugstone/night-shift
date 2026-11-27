// Redraws an existing sprite at another shape: every coordinate is rescaled, but outlines keep one even
// width and round details (wheels, knobs, rivets) stay round. That is the difference from stretching the
// sprite in the game, which fattens the strokes along one axis and turns circles into ovals
// (tests/abduct-sprite-aspect.test.ts). Used by scripts/art-shapes/build.mjs.
import { readFileSync } from 'node:fs';
import { ART_DIR, r1, write } from '../art-l9/lib.mjs';

const ARITY = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

/** Path data with every coordinate scaled; relative commands stay relative. */
export function scalePath(d, sx, sy) {
  let i = 0;
  const out = [];
  const number = () => {
    const m = /^[\s,]*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/i.exec(d.slice(i));
    if (!m) throw new Error(`bad path number at ${i}: ${d.slice(i, i + 20)}`);
    i += m[0].length;
    return Number(m[1]);
  };
  const flag = () => {
    const m = /^[\s,]*([01])/.exec(d.slice(i));
    if (!m) throw new Error(`bad arc flag at ${i}`);
    i += m[0].length;
    return m[1];
  };
  const more = () => /^[\s,]*[+-.\d]/.test(d.slice(i));
  while (i < d.length) {
    const m = /^[\s,]*([a-z])/i.exec(d.slice(i));
    if (!m) break;
    i += m[0].length;
    const cmd = m[1];
    const kind = cmd.toLowerCase();
    if (kind === 'z') {
      out.push(cmd);
      continue;
    }
    let first = true;
    do {
      let args;
      if (kind === 'h') args = [r1(number() * sx)];
      else if (kind === 'v') args = [r1(number() * sy)];
      else if (kind === 'a') {
        const rx = number() * sx;
        const ry = number() * sy;
        const rot = number();
        args = [r1(rx), r1(ry), rot, flag(), flag(), r1(number() * sx), r1(number() * sy)];
      } else {
        args = [];
        for (let k = 0; k < ARITY[kind]; k += 2) args.push(r1(number() * sx), r1(number() * sy));
      }
      out.push((first ? cmd : ' ') + args.join(' '));
      first = false;
    } while (more());
  }
  return out.join('');
}

/**
 * Writes public/art/<key>.svg: the art of `from` redrawn in a w x h box.
 * `stroke` scales every outline (default 1: same weight as the source).
 */
export function reshape(from, key, w, h, { stroke = 1 } = {}) {
  const svg = readFileSync(`${ART_DIR}${from}.svg`, 'utf8');
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const sx = w / Number(box[1]);
  const sy = h / Number(box[2]);
  const round = Math.sqrt(sx * sy);
  const X = new Set(['x', 'cx', 'x1', 'x2', 'width']);
  const Y = new Set(['y', 'cy', 'y1', 'y2', 'height']);
  // Shapes inside a translate+scale group (stars, repeated shields) are drawn in the group's own units:
  // the group moves and grows as a whole and its inner markup stays as drawn.
  const kept = [];
  const source = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim()
    .replace(/(<g transform="translate\([^)]*\) scale\([-\d.]+\)">)([\s\S]*?)<\/g>/g, (_, open, inner) => {
      kept.push(inner);
      return `${open}@@${kept.length - 1}@@</g>`;
    })
    // A rotated group (the fireplace logs) keeps its drawing too: it only moves with its pivot.
    .replace(/<g transform="rotate\(\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)\s*\)">([\s\S]*?)<\/g>/g, (_, turn, px, py, inner) => {
      kept.push(inner);
      return `<g transform="translate(${r1(px * sx - px)} ${r1(py * sy - py)}) @rot(${turn} ${px} ${py})">@@${kept.length - 1}@@</g>`;
    });
  const body = source.replace(/<(\w+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, (_, tag, attrs, close) => {
    const a = new Map([...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const circle = tag === 'circle' || (tag === 'ellipse' && a.get('rx') === a.get('ry'));
    for (const [k, v] of a) {
      if (k === 'd') a.set(k, scalePath(v, sx, sy));
      else if (X.has(k)) a.set(k, r1(Number(v) * sx));
      else if (Y.has(k)) a.set(k, r1(Number(v) * sy));
      else if (k === 'r' || ((k === 'rx' || k === 'ry') && (circle || tag === 'rect'))) a.set(k, r1(Number(v) * (tag === 'rect' ? Math.min(sx, sy, 1) : round)));
      else if (k === 'rx') a.set(k, r1(Number(v) * sx));
      else if (k === 'ry') a.set(k, r1(Number(v) * sy));
      else if (k === 'stroke-width') a.set(k, r1(Number(v) * stroke));
      else if (k === 'points') a.set(k, v.trim().split(/[\s,]+/).map((n, j) => r1(Number(n) * (j % 2 ? sy : sx))).join(' '));
      else if (k === 'transform') {
        if (/(^|[^@])rotate|matrix|skew/.test(v)) throw new Error(`${from}: cannot reshape transform ${v}`);
        a.set(k, v.replace(/translate\(\s*([-\d.]+)[\s,]+([-\d.]+)\s*\)/g, (__, tx, ty) => (v.includes('@rot') ? __ : `translate(${r1(tx * sx)} ${r1(ty * sy)})`))
          .replace('@rot', 'rotate')
          .replace(/scale\(\s*([-\d.]+)\s*\)/g, (__, s) => `scale(${Math.round(s * round * 100) / 100})`));
      }
    }
    return `<${tag}${[...a].map(([k, v]) => ` ${k}="${v}"`).join('')}${close}>`;
  }).replace(/@@(\d+)@@/g, (_, n) => kept[Number(n)]);
  return write(key, w, h, body.replace(/^<g stroke-linecap="round" stroke-linejoin="round">([\s\S]*)<\/g>$/, '$1'));
}
