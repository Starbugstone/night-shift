import { expect, it } from 'vitest';
import { fmt, TABLES } from '../src/i18n';
import { en } from '../src/i18n/en';
import { LEVEL10 } from '../src/levels/deep-grail';
import { formatOrderNumber, workOrderNumber } from '../src/levels/levels';
import { applyDeepRun, isLevelUnlocked } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave } from '../src/levels/save';
import { deepReport } from '../src/ui/report';
import { tabloidHeadline } from '../src/ui/report-extras';

it('shows order 0012 on the card and memo in both languages', () => {
  const num = formatOrderNumber(workOrderNumber(LEVEL10.id));
  for (const t of Object.values(TABLES)) {
    expect(fmt(t.workOrders.orderNo, { num })).toMatch(/(?:#|°)0012/);
    expect(fmt(t.levels.level10.re, { num })).toMatch(/(?:#|°)0012/);
  }
});

it('dispatches Grimsby after the 1955 delivery and puts the shrubbery cover ahead of Ghost', () => {
  const i = workOrderNumber('level10') - 1;
  const save = defaultSave();
  expect(isLevelUnlocked(save, i)).toBe(false);
  save.levels.level9.delivered = true;
  expect(isLevelUnlocked(save, i)).toBe(true);
  const run = new DeepRun(LEVEL10, i);
  for (let target = 0; target < 3; target++) {
    run.startAbduct(target, 0);
    run.finishAbduct({ delivered: true, woke: false, timeSec: 18, bonks: 0, dignity: 100, snores: 1, itemsStolen: [], aborted: false });
  }
  const report = () => deepReport(run, applyDeepRun(save, 'level10', run.summary()));
  expect(report().comment).toBe(en.humor.storyFirstClear.level10);
  expect(report().cover).toBe(en.grail.ghost);
  run.collectible!.collected = true;
  expect(report().cover).toBe(en.grail.greenery);
  expect(report().archive).toBe(en.grail.archive);
  expect(tabloidHeadline('level10', 1, 0)).toBeNull();
  expect([tabloidHeadline('level10', 2, 0), tabloidHeadline('level10', 2, 1)]).toEqual(en.reportExtras.headlines.level10);
});
