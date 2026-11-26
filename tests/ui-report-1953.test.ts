import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult } from '../src/contracts';
import { setLang, tr } from '../src/i18n';
import { LEVEL11 } from '../src/levels/deep-1953';
import { LEVELS } from '../src/levels/levels';
import { applyDeepRun } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, validateSave } from '../src/levels/save';
import { deepReport } from '../src/ui/report';
import { coverStory } from '../src/ui/report-extras';

const rescued: AbductResult = {
  delivered: true, woke: false, timeSec: 12, bonks: 1, dignity: 92, snores: 1, itemsStolen: [], aborted: false,
};
function delivered(leg: boolean, spots = 0) {
  const run = new DeepRun(LEVEL11, LEVELS.indexOf(LEVEL11));
  if (leg) run.collectible!.collected = true;
  run.spotted = spots;
  for (const i of [0, 1, 2]) {
    run.startAbduct(i, 0);
    run.finishAbduct(rescued);
  }
  return run;
}
afterEach(() => setLang('en'));

describe.each(['en', 'fr'] as const)('1953 report in %s', lang => {
  it('prints the first-clear reveal once and keeps the two-sighting archive headline', () => {
    setLang(lang);
    const run = delivered(true, 2);
    const outcome = applyDeepRun(defaultSave(), LEVEL11.id, run.summary());
    const model = deepReport(run, outcome);
    expect(model.archive).toBe(tr().invasion1953.archive);
    expect(model.comment).toBe(tr().humor.storyFirstClear.level11);
    expect(model.comment.length).toBeLessThanOrEqual(135);
    expect(model.cover).toBe(tr().invasion1953.firstCover);
    expect(model.headline).toBe(tr().reportExtras.headlines.level11![0]);
    const save = validateSave(outcome.save);
    expect(save.levels.level11.mapCollectible).toBe('tripod_leg');
    expect(save.levels.level11.stars).toEqual([true, false, true, true]);
    expect(Object.keys(save.specimens)).toEqual(['forester', 'van_bell', 'collier']);
  });

  it('gives the tall-fox cover only for a repeat delivery with the leg on that flight', () => {
    setLang(lang);
    const save = defaultSave();
    save.levels.level11.delivered = true;
    save.levels.level11.stars = [true, true, true, true];
    save.levels.level11.mapCollectible = 'tripod_leg';
    for (const leg of [true, false]) {
      const run = delivered(leg);
      const outcome = applyDeepRun(save, LEVEL11.id, run.summary());
      const model = deepReport(run, outcome);
      expect(model.comment).not.toBe(tr().humor.storyFirstClear.level11);
      expect(model.headline).toBeNull();
      expect(model.cover).toBe(leg ? tr().invasion1953.legCover :
        coverStory({ levelId: LEVEL11.id, items: [], spotted: 0, sunrise: false, seed: outcome.save.reports }));
    }
  });
});
