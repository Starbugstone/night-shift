// Every shift memo's body and joke box must clear the goals block at the 16 px font floor, in EN and FR.
// v0.2: Neon found the L4 and L7 memos (EN and FR) overflowing after new teaching lines; nothing checked it.
import { afterEach, describe, expect, it } from 'vitest';
import { setLang, tr, type Lang } from '../src/i18n';
import { LEVELS } from '../src/levels/levels';
import { MEMO_BODY_FLOOR, memoBodyLayout } from '../src/ui/memo';

const LANGS: Lang[] = ['en', 'fr'];

afterEach(() => setLang('en'));

describe('memo fit', () => {
  it('every level memo fits above the goals block at or above the font floor, EN and FR', () => {
    const over: string[] = [];
    for (const lang of LANGS) {
      setLang(lang);
      for (const lv of LEVELS) {
        const lt = tr().levels[lv.id];
        const entries = lv.kind === 'deep' ? lv.map.targets.flatMap((t) => t.entries) : lv.map.entries;
        const offset = entries.some((e) => e.recommended) ? 24 : 0;
        const fit = memoBodyLayout(lt.body, lt.joke, offset);
        expect(fit.bodySize).toBeGreaterThanOrEqual(MEMO_BODY_FLOOR);
        if (fit.overflow > 0) over.push(`${lang} ${lv.id}: ${fit.overflow} px over at ${fit.bodySize} px`);
      }
    }
    expect(over).toEqual([]);
  });
});
