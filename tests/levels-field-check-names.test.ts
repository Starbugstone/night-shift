// Field Check plays before Maple Court (council v0.2, Neon 11): its flight chip and room caption named
// L3's Dave. Nothing in it may name a target the player only meets in a later level.
import { describe, expect, it } from 'vitest';
import { FIELD_CHECK, FIELD_CHECK_INDEX, FIELD_CHECK_ROOM } from '../src/levels/field-check';
import { isDeep, LEVELS } from '../src/levels/levels';
import { gt, setLang } from '../src/i18n';

describe('Field Check names', () => {
  it('names no target from a level that comes after it', () => {
    const later = new Set<string>();
    for (const lv of LEVELS.slice(FIELD_CHECK_INDEX)) {
      if (!isDeep(lv)) continue;
      for (const tg of lv.map.targets) for (const name of [tg.short, ...tg.human.split(/,\s*|\s*&\s*/)]) later.add(name);
    }
    const shown: string[] = [];
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      for (const tg of FIELD_CHECK.map.targets) shown.push(gt(tg.short), gt(tg.human));
      shown.push(gt(FIELD_CHECK_ROOM.interior!.caption));
    }
    setLang('en');
    const leaks = shown.filter((text) => [...later].some((name) => new RegExp(`\\b${name}\\b`).test(text)));
    expect(leaks).toEqual([]);
  });
});
