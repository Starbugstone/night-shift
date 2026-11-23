#!/usr/bin/env node
// French variants of the art that has English lettering in it: the four report/flight stamps and
// the title logo. Writes public/art/ui/<key>_fr.svg in the same stroked-glyph lettering as the
// English art (letters are 10x14 units, advance 14, a space adds 7). Re-run after changing a word:
//   node scripts/art-fr.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UI = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art', 'ui');

/** Stroke paths in the English art's style, 0..10 wide, 1..14 tall. */
const GLYPHS = {
  A: 'M1 14L5.5 1L10 14M2.8 9H8.2',
  B: 'M1 14V1H6Q9.5 1 9.5 4Q9.5 7 6 7H1M6 7Q10 7 10 10.5Q10 14 6 14H1',
  C: 'M10 3Q8.5 1 5.5 1Q1 1 1 6V9Q1 14 5.5 14Q8.5 14 10 12',
  D: 'M1 14V1H5Q10 1 10 7Q10 14 5 14Z',
  E: 'M9 1H1V14H9M1 7H7',
  F: 'M1 14V1H9M1 7H7',
  I: 'M2 1H8M5 1V14M2 14H8',
  L: 'M1 1V14H9',
  N: 'M1 14V1L10 14V1',
  O: 'M5.5 1Q1 1 1 6V9Q1 14 5.5 14Q10 14 10 9V6Q10 1 5.5 1Z',
  P: 'M1 14V1H6Q10 1 10 5Q10 8 6 8H1',
  Q: 'M5.5 1Q1 1 1 6V9Q1 14 5.5 14Q10 14 10 9V6Q10 1 5.5 1ZM6.5 10.5L10.5 15',
  R: 'M1 14V1H6Q10 1 10 5Q10 8 6 8H1M6 8L10 14',
  S: 'M9 2Q6 -1 2 2Q-1 6 5 7Q12 8 9 12Q6 16 1 13',
  T: 'M0 1H10M5 1V14',
  U: 'M1 1V9Q1 15 6 14Q10 14 10 9V1',
  V: 'M1 1L5.5 14L10 1',
};
/** Accented capitals: base letter plus a mark above the cap height. */
const ACCENTS = { É: ['E', 'M4 -1.5L7 -4.5'] };

function glyph(ch) {
  if (GLYPHS[ch]) return GLYPHS[ch];
  const accent = ACCENTS[ch];
  if (accent) return `${GLYPHS[accent[0]]}${accent[1]}`;
  throw new Error(`No glyph for ${ch}`);
}

/** Width of a word in glyph units. */
function units(word, advance = 14) {
  let x = 0;
  let last = 0;
  for (const ch of word) {
    if (ch === ' ') {
      x += 7;
      continue;
    }
    last = x + 10;
    x += advance;
  }
  return last;
}

/** The glyph groups of a word: `<g transform="translate(x)"><path …/></g>` per letter. */
function letters(word, stroke, width, advance = 14) {
  let x = 0;
  let out = '';
  for (const ch of word) {
    if (ch === ' ') {
      x += 7;
      continue;
    }
    out += `<g transform="translate(${x})"><path d="${glyph(ch)}" fill="none" stroke="${stroke}" stroke-width="${width}"/></g>`;
    x += advance;
  }
  return out;
}

const round = (n) => Math.round(n * 10000) / 10000;

/** A stamp: the English frame (border, rules, ornament) with French lettering centred in it. */
function stamp(source, word, title) {
  const svg = readFileSync(join(UI, `${source}.svg`), 'utf8');
  const color = /stroke="(#[0-9A-Fa-f]{6})" stroke-width="4"/.exec(svg)[1];
  // The English word is the one group with a non-uniform scale; replace it whole.
  const start = svg.search(/<g transform="translate\([\d.]+ [\d.]+\) scale\([\d.]+ [\d.]+\)">/);
  let depth = 0;
  let end = start;
  for (const m of svg.slice(start).matchAll(/<g\b|<\/g>/g)) {
    depth += m[0] === '</g>' ? -1 : 1;
    if (depth === 0) {
      end = start + m.index + 4;
      break;
    }
  }
  const accented = /[ÉÈÊÀÇ]/.test(word);
  const sy = accented ? 2.05 : 2.27;
  // Short words hit the size cap: close the letter spacing up so they don't look gappy.
  const advance = 204 / units(word) > 2.6 ? 12.5 : 14;
  const sx = Math.min(2.6, 204 / units(word, advance));
  const x = 120 - (sx * units(word, advance)) / 2;
  const y = accented ? 48 : 45;
  const group = `<g transform="translate(${round(x)} ${y}) scale(${round(sx)} ${sy})">${letters(word, color, 2.7, advance)}</g>`;
  let out = svg.slice(0, start) + group + svg.slice(end);
  // The little sparkle over the middle of the delivered/failed stamps would sit on an accent.
  if (accented) out = out.replace(/<g transform="translate\(120 32\) scale\(0\.47\)">.*?<\/g>/, '');
  out = out.replace(/<title>.*?<\/title>/, '');
  return out.replace(/(<svg[^>]*>)/, `$1<title>${title}</title>`);
}

/** The logo: the English art with the wordmark and the ribbon text swapped. */
function logo(word, ribbon) {
  let svg = readFileSync(join(UI, 'logo.svg'), 'utf8');
  const width = units('NIGHT SHIFT') * 3.1538;
  const sx = round(width / units(word));
  // Three stacked copies of the wordmark (shadow, body, highlight): swap each one's letters.
  svg = svg.replace(
    /<g transform="translate\(([\d.]+) ([\d.]+)\) scale\(3\.1538 4\.4667\)">((?:<g transform="translate\(\d+\)"><path [^>]*\/><\/g>)+)<\/g>/g,
    (_, x, y, body) => {
      const [, stroke, sw] = /stroke="([^"]+)" stroke-width="([^"]+)"/.exec(body);
      return `<g transform="translate(${x} ${y}) scale(${sx} 4.4667)">${letters(word, stroke, sw)}</g>`;
    },
  );
  svg = svg.replace(/font-size="25" fill="#1b1433">[^<]*<\/text>/, `font-size="${ribbon.length > 17 ? 21 : 25}" fill="#1b1433">${ribbon}</text>`);
  return svg.replace(/(<svg[^>]*>)/, `$1<title>${word}</title>`);
}

const files = {
  stamp_delivered_fr: stamp('stamp_delivered', 'LIVRÉ', 'LIVRÉ'),
  stamp_failed_fr: stamp('stamp_failed', 'REFUSÉ', 'REFUSÉ'),
  stamp_sunrise_fr: stamp('stamp_sunrise', 'AUBE', 'AUBE'),
  stamp_spotted_fr: stamp('stamp_spotted', 'REPÉRÉ', 'REPÉRÉ'),
  logo_fr: logo('ÉQUIPE DE NUIT', 'Service Enlèvements'),
};
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(UI, `${name}.svg`), svg);
  console.log(`wrote public/art/ui/${name}.svg`);
}
