// v4 story: per-level memo sign-offs, Vrell first-clear arc lines, Zib shift openers & 2/3 banter,
// progress-gated loading tips, and Field Check copy — in English and French.
import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { VIEW_W } from '../src/contracts';
import { setLang, tr, type Lang } from '../src/i18n';
import { deepStartEvent, deepZibLine, loadingTips, storyFirstClear } from '../src/levels/humor';
import { LEVELS } from '../src/levels/levels';
import { RANKS, type RunOutcome } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, LEVEL_IDS } from '../src/levels/save';
import type { DeepLevelDef } from '../src/levels/types';
import { deepReport, tutorialReport } from '../src/ui/report';
import { wrapWith, type Measure } from '../src/ui/report-layout';

afterEach(() => setLang('en'));

const LANGS: Lang[] = ['en', 'fr'];

const measure: Measure = (s, size, weight) => {
  let w = 0;
  for (const ch of s) {
    const caps = (ch >= 'A' && ch <= 'Z') || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
    w += size * (ch === ' ' ? 0.28 : caps ? 0.7 : "il.,:;'’!|".includes(ch) ? 0.3 : 0.56);
  }
  return w * (weight >= 800 ? 1.08 : 1);
};

function makeOutcome(firstClear: boolean): RunOutcome {
  return {
    save: defaultSave(),
    stars: [true, true, false],
    newStarFlags: [firstClear, firstClear, false],
    glorbs: 25,
    rankBefore: RANKS[0]!,
    rankAfter: RANKS[0]!,
    unlockedNext: firstClear,
  };
}

describe('v4 story copy & hooks', () => {
  it('every level L1–L8 has a per-level memo signoff in EN and FR', () => {
    for (const lang of LANGS) {
      setLang(lang);
      for (const id of LEVEL_IDS) {
        const s = tr().levels[id].signoff;
        expect(s.length, `${lang}:${id}`).toBeGreaterThan(5);
        expect(s, `${lang}:${id}`).toContain('Vrell');
      }
    }
  });

  it('first-clear arc lines trigger once on newStarFlags[0], fall back on replay, and fit Vrell’s bubble', () => {
    const abduct: AbductResult = { delivered: true, woke: false, timeSec: 20, bonks: 1, dignity: 85, snores: 3, itemsStolen: ['slipper'], aborted: false };
    const flight: FlightResult = { roomId: 'farm_window', timeSec: 12, spotted: 0 };
    const bubbleW = VIEW_W - 48 - 154;

    for (const lang of LANGS) {
      setLang(lang);
      for (const id of LEVEL_IDS) {
        const line = storyFirstClear(id);
        expect(line, `${lang}:${id}`).toBeTruthy();
        expect(wrapWith(measure, line!, bubbleW, 14, 600, true).length, `${lang}:${id}`).toBeLessThanOrEqual(5);
      }

      const firstTut = tutorialReport(0, abduct, flight, makeOutcome(true));
      expect(firstTut.comment).toBe(storyFirstClear('level1'));

      const replayTut = tutorialReport(0, abduct, flight, makeOutcome(false));
      expect(replayTut.comment).not.toBe(storyFirstClear('level1'));

      const failedTut = tutorialReport(0, { ...abduct, delivered: false }, flight, makeOutcome(true));
      expect(failedTut.comment).not.toBe(storyFirstClear('level1'));

      const l3 = LEVELS.find((l) => l.id === 'level3') as DeepLevelDef;
      const run = new DeepRun(l3, 2);
      for (let t = 0; t < 3; t++) {
        run.startAbduct(t, 0);
        run.finishAbduct(abduct);
      }
      const firstDeep = deepReport(run, makeOutcome(true));
      expect(firstDeep.comment).toBe(storyFirstClear('level3'));

      const replayDeep = deepReport(run, makeOutcome(false));
      expect(replayDeep.comment).not.toBe(storyFirstClear('level3'));
    }
  });

  it('deep shift openers map L3–L8 and twoOfThree has lines in EN and FR', () => {
    expect(deepStartEvent('level1')).toBeNull();
    expect(deepStartEvent('level2')).toBeNull();
    expect(deepStartEvent('level3')).toBe('start3');
    expect(deepStartEvent('level4')).toBe('start4');
    expect(deepStartEvent('level5')).toBe('start5');
    expect(deepStartEvent('level6')).toBe('start6');
    expect(deepStartEvent('level7')).toBe('start7');
    expect(deepStartEvent('level8')).toBe('start8');

    for (const lang of LANGS) {
      setLang(lang);
      for (const evt of ['start3', 'start4', 'start5', 'start6', 'start7', 'start8', 'twoOfThree'] as const) {
        const line = deepZibLine(evt, 0);
        expect(line.length, `${lang}:${evt}`).toBeGreaterThan(10);
        expect(line.length, `${lang}:${evt}`).toBeLessThanOrEqual(96);
      }
    }
  });

  it('loading tips gate progressively by delivered milestones without spoilers on a fresh save', () => {
    for (const lang of LANGS) {
      setLang(lang);
      const base = tr().loading.tips;
      const tiers = tr().loading.tierTips;
      const fresh = defaultSave();
      expect(loadingTips(fresh)).toEqual(base);

      fresh.levels.level2.delivered = true;
      expect(loadingTips(fresh).length).toBe(base.length + tiers.afterL2.length);
      expect(loadingTips(fresh)).toContain(tiers.afterL2[0]);
      expect(loadingTips(fresh)).not.toContain(tiers.afterL4[0]);

      fresh.levels.level4.delivered = true;
      fresh.levels.level5.delivered = true;
      fresh.levels.level7.delivered = true;
      expect(loadingTips(fresh).length).toBe(
        base.length + tiers.afterL2.length + tiers.afterL4.length + tiers.afterL5.length + tiers.afterL7.length,
      );
      expect(loadingTips(fresh)).toContain(tiers.afterL7[0]);
    }
  });

  it('Field Check copy is complete in EN and FR', () => {
    for (const lang of LANGS) {
      setLang(lang);
      const fc = tr().fieldCheck;
      expect(fc.re.length).toBeGreaterThan(5);
      expect(fc.body.length).toBeGreaterThan(20);
      expect(fc.joke.length).toBeGreaterThan(10);
      expect(fc.signoff).toContain('Vrell');
      expect(Object.keys(fc.prompts)).toEqual(['porch', 'ring', 'doorLip', 'clatter', 'retry', 'complete']);
    }
  });
});
