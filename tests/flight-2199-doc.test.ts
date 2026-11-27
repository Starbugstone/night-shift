// GDD-14 states the shipped 2199 clock once (v0.2 council round 3, Sol P3): the memo section still called the old
// 2:55 / 0:26 clock shipped after the clock section moved to 3:25 / 0:52. The memo section now points at the clock
// section; both must name LEVEL12's own budgetSec and parMarginSec, and the memo section no other time.
import { describe, expect, it } from 'vitest';
import gdd from '../docs/GDD-14-2199-hitchhiker.md?raw';
import { LEVEL12 } from '../src/levels/deep-2199';

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const section = (title: string) => {
  const at = gdd.indexOf(`\n## ${title}\n`);
  if (at < 0) throw new Error(`no section ${title}`);
  const end = gdd.indexOf('\n## ', at + 4);
  return gdd.slice(at, end < 0 ? undefined : end);
};

describe('GDD-14 names the shipped 2199 clock', () => {
  const budget = mmss(LEVEL12.budgetSec!);
  const margin = mmss(LEVEL12.parMarginSec!);

  it('the clock section states the demolition timer and the Night owl margin', () => {
    const clock = section('The clock and the stars');
    expect(clock).toContain(`**${budget}**`);
    expect(clock).toContain(`**${LEVEL12.parMarginSec} s** left`);
  });

  it('the memo goals point at the clock section, with the same times and no stale ones', () => {
    const memo = section('Copy').split('\n').find(line => line.startsWith('Override the memo’s Delivered and Night owl goals'));
    expect(memo).toBeDefined();
    expect(memo).toContain('(#the-clock-and-the-stars)');
    expect(memo).toContain(`**${budget}**`);
    expect(memo).toContain(`**${margin}**`);
    expect(memo).toMatch(/clock cutoff/);
    const times = [...memo!.matchAll(/\b\d+:\d\d\b/g)].map(m => m[0]);
    expect(new Set(times)).toEqual(new Set([budget, margin]));
  });
});
