// Vrell's "{seconds} to spare" line and the report's time row read the same clock the same way (floor), so the
// comment never says "11 seconds" over a "0:10 to spare" row, or "0 seconds" when it rounded down. v0.2 council R2 (Neon).
import { afterEach, describe, expect, it } from 'vitest';
import { setLang, tr, type Lang } from '../src/i18n';
import { deepComment } from '../src/levels/humor';
import { isDeep, LEVELS } from '../src/levels/levels';

afterEach(() => setLang('en'));

describe('report seconds', () => {
  it('the close-call comment floors the remaining time like the report row, on every deep level', () => {
    for (const lang of ['en', 'fr'] as Lang[]) {
      setLang(lang);
      const unit = tr().humor.deepComments.units.seconds;
      for (const lv of LEVELS.filter(isDeep)) {
        for (const remaining of [10.7, 3.5, 1.9]) {
          const seen = new Set<string>();
          for (let rotation = 0; rotation < 24; rotation++) {
            const line = deepComment({ levelId: lv.id, stars: 1, spotted: 1, failed: 1, bonks: 0, remaining, order: [] }, rotation);
            if (/\d/.test(line)) seen.add(line);
          }
          const want = Math.floor(remaining);
          for (const line of seen) {
            const nums = [...line.matchAll(/\d+/g)].map(m => Number(m[0]));
            if (nums.includes(Math.round(remaining)) && Math.round(remaining) !== want) {
              expect.fail(`${lang} ${lv.id} at ${remaining}s: "${line}" rounds instead of flooring (${unit.other})`);
            }
          }
        }
      }
    }
  });
});
