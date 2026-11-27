// v0.2 follow-up: the Work Orders rank panel never squeezes its text sideways. For every rank and the
// 2199 parking-ring payoff, in English and French, the title, the flavour line and the next-rank line fit
// their boxes (RANK_BOX, the same geometry the view draws with) at their normal font, beside a purse that
// holds a four-digit Glorb balance. Widths are the larger of the view's own measure() and the generous
// per-character estimate the other fit tests use, so a system font a little wider than ours still fits.
import { afterEach, describe, expect, it } from 'vitest';
import { measure } from '../src/core/gfx/text';
import { setLang, fmt, tr, type Lang } from '../src/i18n';
import { RANKS } from '../src/levels/progress';
import { RANK_BOX } from '../src/ui/workorders';

const LANGS: Lang[] = ['en', 'fr'];

afterEach(() => setLang('en'));

/** Generous width estimate for the system sans (bold caps are the widest). */
function generous(s: string, size: number, weight: number): number {
  let w = 0;
  for (const ch of s) {
    const caps = (ch >= 'A' && ch <= 'Z') || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
    w += size * (ch === ' ' || ch === ' ' || ch === ' ' ? 0.28 : caps ? 0.7 : "il.,:;'’!|".includes(ch) ? 0.3 : 0.56);
  }
  return w * (weight >= 800 ? 1.08 : 1);
}

function width(s: string, size: number, weight: number, italic = false): number {
  return Math.max(measure(s, size, weight, italic), generous(s, size, weight));
}

describe('rank panel fit (v0.2 follow-up)', () => {
  for (const lang of LANGS) {
    it(`every rank title, flavour and payoff fits its box without a squeeze (${lang})`, () => {
      setLang(lang);
      const bad: string[] = [];
      const check = (what: string, s: string, size: number, weight: number, w: number, italic = false) => {
        const got = width(s, size, weight, italic);
        if (got > w) bad.push(`${what}: "${s}" is ${got.toFixed(0)} px wide at ${size} px, box ${w} px`);
      };
      const { title, flavour, glorbs, purse } = RANK_BOX;
      const top = RANKS.length - 1;
      tr().ranks.forEach((r, i) => {
        check(`ranks.${i}.title`, r.title, title.size(r.title), title.weight, title.w);
        check(`ranks.${i}.flavour`, r.flavour, flavour.size(i === top), flavour.weight, flavour.w, true);
      });
      // the payoff replaces the flavour at every rank once L12 is delivered, the top one included
      for (const topRank of [false, true]) {
        check(`dispatch2199.parking (top rank ${topRank})`, tr().dispatch2199.parking, flavour.size(topRank), flavour.weight, flavour.w, true);
      }
      for (const r of RANKS) check(`nextRank ${r.minStars}`, fmt(tr().workOrders.nextRank, { n: r.minStars }), 15, 700, flavour.w);
      // the title box ends before the purse, and a four-digit balance fits it
      expect(title.x + title.w, 'title box stops short of the purse').toBeLessThanOrEqual(purse.x - 8);
      expect(glorbs.x + glorbs.w, 'Glorb count stays inside the purse').toBeLessThanOrEqual(purse.x + purse.w - 4);
      check('glorbs 9999', '9999', glorbs.size, glorbs.weight, glorbs.w);
      expect(bad, `${lang}: rank panel lines that would be squeezed`).toEqual([]);
    });
  }

  it('French calls the parking ring "anneau de parking" everywhere, never "anneau de stationnement"', () => {
    setLang('fr');
    const all: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === 'string') all.push(v);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(tr());
    expect(all.filter(s => /anneaux? de stationnement/i.test(s))).toEqual([]);
    expect(tr().dispatch2199.parking).toMatch(/anneau de parking/i);
  });
});
