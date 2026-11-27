// GDD-14 states the shipped 2199 clock once (v0.2 council round 3, Sol P3): the memo section still called the old
// 2:55 / 0:26 clock shipped after the clock section moved to 3:25 / 0:52. The memo section now points at the clock
// section; both must name LEVEL12's own budgetSec and parMarginSec, and the memo section no other time.
import { describe, expect, it } from 'vitest';
import gdd from '../docs/GDD-14-2199-hitchhiker.md?raw';
import { LEVEL12 } from '../src/levels/deep-2199';
import { LEVELS } from '../src/levels/levels';

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

  // round 4 (Sol P5): the clock section still said the third result had to reach the runner before zero, while the
  // game (and the memo section) decide Delivered when the third room accepts its specimen
  it('the clock section decides Delivered at the acceptance, like the memo section and the game', () => {
    const clock = section('The clock and the stars');
    expect(clock).toMatch(/clock cutoff: the shift counts as delivered when the third room accepts its specimen before the timer reaches zero/);
    for (const [file, text] of Object.entries(GDDS)) {
      expect(text, file).not.toMatch(/(result|specimen)s? (to )?reach(es)? the runner before/);
    }
  });
});

const GDDS = import.meta.glob('../docs/GDD*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

// round 4 (Fable F6): every GDD that names a level (`Stable ID \`levelN\``) and states its clock by field name
// (`budgetSec` 220, `parMarginSec` is 67) states that level's shipped values. Today only GDD-14 names the fields; the
// other date GDDs (GDD-12, GDD-13) give their clocks in prose with their tuning history, which this does not parse.
/** Each `budgetSec` / `parMarginSec` a GDD states that differs from its level's data, and how many it states. */
function clockFields(docs: Record<string, string>): { stated: number; wrong: string[] } {
  const wrong: string[] = [];
  let stated = 0;
  for (const [file, text] of Object.entries(docs)) {
    const id = /Stable ID `([a-z0-9_]+)`/.exec(text)?.[1];
    const level = id ? LEVELS.find(l => l.id === id) : undefined;
    for (const m of text.matchAll(/`(budgetSec|parMarginSec)`(?: is)? (\d+)/g)) {
      stated++;
      if (!level || level.kind !== 'deep') { wrong.push(`${file}: ${m[0]} without a deep level's Stable ID`); continue; }
      const shipped = level[m[1] as 'budgetSec' | 'parMarginSec'];
      if (Number(m[2]) !== shipped) wrong.push(`${file}: ${m[0]}, but ${id} ships ${shipped}`);
    }
  }
  return { stated, wrong };
}

describe('every GDD that names a clock field states the shipped value', () => {
  it('matches each level\'s budgetSec and parMarginSec', () => {
    const { stated, wrong } = clockFields(GDDS);
    expect(stated).toBeGreaterThanOrEqual(4);
    expect(wrong).toEqual([]);
  });

  it('catches a stale value (mutation check)', () => {
    const stale = Object.fromEntries(Object.entries(GDDS).map(([f, t]) => [f, t.replace('(`budgetSec` 220)', '(`budgetSec` 205)')]));
    expect(clockFields(stale).wrong.join()).toMatch(/budgetSec` 205, but level12 ships 220/);
  });
});
