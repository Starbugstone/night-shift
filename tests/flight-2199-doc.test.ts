// GDD-14 states the shipped 2199 clock once (v0.2 council round 3, Sol P3): the memo section still called the old
// 2:55 / 0:26 clock shipped after the clock section moved to 3:25 / 0:52. The memo section now points at the clock
// section; both must name LEVEL12's own budgetSec and parMarginSec, and the memo section no other time.
import { describe, expect, it } from 'vitest';
import gdd from '../docs/GDD-14-2199-hitchhiker.md?raw';
import { LEVEL12 } from '../src/levels/deep-2199';
import { LEVELS } from '../src/levels/levels';
import featureMap from '../.claude/skills/verify-night-shift/features/README.md?raw';

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

// Round 5 (Fable): GDD-11, GDD-12, GDD-13 (and the older GDDs) give their clocks in prose with their tuning history,
// which the field check above does not parse. Each deep level's clock is stated once in machine-readable form beside
// the prose that states it: `<!-- shipped clock: levelN budgetSec=… parMarginSec=… -->` (or `elapsedParSec=…` for an
// elapsed-clock level). Every deep level in LEVELS has exactly one, each matches the level data, and the paragraph it
// sits in still states that clock in words: the budget (or the elapsed par) and the Night owl margin or elapsed time.
type ClockLevel = { id: string; kind: string; budgetSec?: number; parMarginSec?: number; elapsedParSec?: number };
const CLOCK_FIELDS = ['budgetSec', 'parMarginSec', 'elapsedParSec'] as const;

/** Seconds a paragraph states in words: `183 s`, `25 seconds`, `**1:07**` (not a time of day like 10:05:42). */
function proseSeconds(text: string): Set<number> {
  const out = new Set<number>();
  for (const m of text.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\b(\d+)(?:\*\*)? ?(?:s|seconds?)\b/g)) out.add(Number(m[1]));
  for (const m of text.matchAll(/(?<![:\d])(\d{1,2}):(\d\d)(?![:\d])/g)) out.add(Number(m[1]) * 60 + Number(m[2]));
  return out;
}

/** Seconds of play a paragraph states in words, in order (`183 s`, `25 seconds`, `210 real seconds`), skipping
 * clock-face times (`2:00`, `10:03:40`), decimals and the upper end of a range. */
function clockSeconds(text: string): { n: number; at: number }[] {
  return [...text.matchAll(/(?<![\d.–-])(\d+)(?:\*\*)? ?(?:real )?(?:s|seconds?)\b/g)].map(m => ({ n: Number(m[1]), at: m.index! }));
}

function shippedClocks(docs: Record<string, string>, levels: readonly ClockLevel[]): { lines: number; wrong: string[] } {
  const wrong: string[] = [];
  const seen = new Map<string, string[]>();
  let lines = 0;
  for (const [file, text] of Object.entries(docs)) {
    for (const para of text.split(/\n\s*\n/)) {
      for (const m of para.matchAll(/<!-- shipped clock: ([a-z0-9_]+) ((?:\w+=\d+ ?)+)-->/g)) {
        lines++;
        const id = m[1]!;
        seen.set(id, [...seen.get(id) ?? [], file]);
        const level = levels.find(l => l.id === id);
        if (!level || level.kind !== 'deep') { wrong.push(`${file}: shipped clock for ${id}, which is not a deep level in LEVELS`); continue; }
        const stated = Object.fromEntries([...m[2]!.matchAll(/(\w+)=(\d+)/g)].map(f => [f[1]!, Number(f[2])]));
        const elapsed = level.elapsedParSec !== undefined;
        const want = elapsed ? ['elapsedParSec'] : ['budgetSec', 'parMarginSec'];
        if (Object.keys(stated).sort().join() !== [...want].sort().join()) wrong.push(`${file}: ${id} states ${Object.keys(stated).join(', ')}, not ${want.join(', ')}`);
        for (const key of CLOCK_FIELDS) {
          if (key in stated && stated[key] !== level[key]) wrong.push(`${file}: ${id} ${key}=${stated[key]}, but ${id} ships ${level[key]}`);
        }
        // the prose beside it says the same clock
        const words = proseSeconds(para);
        if (elapsed) {
          if (!words.has(level.elapsedParSec!)) wrong.push(`${file}: the paragraph with ${id}'s clock does not say its ${level.elapsedParSec} s elapsed par`);
        } else {
          const budget = level.budgetSec!, margin = level.parMarginSec!;
          if (!words.has(budget) && !(words.has(margin) && words.has(budget - margin))) wrong.push(`${file}: the paragraph with ${id}'s clock does not say its ${budget} s budget`);
          if (!words.has(margin) && !words.has(budget - margin)) wrong.push(`${file}: the paragraph with ${id}'s clock does not say its Night owl (${margin} s left, ${budget - margin} s elapsed)`);
        }
        // Round 6 (Sol P3): a historical value later in the paragraph used to satisfy the checks above, so a stale
        // headline ("Dawn gives **172 s**") passed. The first clock the paragraph states is the shipped one, and so is
        // the first one after it names Night owl (or the par margin).
        const prose = para.replace(/<!--[\s\S]*?-->/g, '');
        const said = clockSeconds(prose);
        const head = elapsed ? level.elapsedParSec! : level.budgetSec!;
        if (said[0]?.n !== head) wrong.push(`${file}: the paragraph with ${id}'s clock opens with ${said[0]?.n ?? 'no'} s, not its shipped ${head} s ${elapsed ? 'elapsed par' : 'budget'}`);
        const owlAt = prose.search(/Night owl|par margin/i);
        const owl = owlAt < 0 ? undefined : said.find(w => w.at > owlAt)?.n;
        const owlWant = elapsed ? [level.elapsedParSec!] : [level.parMarginSec!, level.budgetSec! - level.parMarginSec!];
        if (owl === undefined || !owlWant.includes(owl)) wrong.push(`${file}: the paragraph with ${id}'s clock gives Night owl ${owl ?? 'no'} s, not its shipped ${owlWant.join(' s / ')} s`);
      }
    }
  }
  for (const level of levels) {
    if (level.kind !== 'deep') continue;
    const files = seen.get(level.id) ?? [];
    if (files.length !== 1) wrong.push(`${level.id}: ${files.length} shipped clock lines (${files.join(', ') || 'none'}); its GDD states it once`);
  }
  return { lines, wrong };
}

describe('every deep level\'s GDD states its shipped clock (round 5, Fable)', () => {
  const levels = LEVELS as readonly ClockLevel[];

  it('walks every deep level in LEVELS', () => {
    const { lines, wrong } = shippedClocks(GDDS, levels);
    expect(lines).toBe(levels.filter(l => l.kind === 'deep').length);
    expect(wrong).toEqual([]);
  });

  it('catches a level retuned without its GDD (mutation check)', () => {
    const retuned = levels.map(l => l.id === 'level10' ? { ...l, budgetSec: 172 } : l.id === 'birch_bakery' ? { ...l, elapsedParSec: 60 } : l);
    const { wrong } = shippedClocks(GDDS, retuned);
    expect(wrong.join('\n')).toMatch(/level10 budgetSec=183, but level10 ships 172/);
    expect(wrong.join('\n')).toMatch(/birch_bakery elapsedParSec=56, but birch_bakery ships 60/);
  });

  it('catches stale prose beside a right line, a missing line and a new level (mutation check)', () => {
    const edit = (file: string, from: string, to: string) => Object.fromEntries(Object.entries(GDDS).map(([f, t]) => [f, f.endsWith(file) ? t.replace(from, to) : t]));
    const stale = shippedClocks(edit('GDD-2-deeper.md', 'Sunrise budget 420 s (Night owl: done by 260 s)', 'Sunrise budget 400 s (Night owl: done by 240 s)'), levels).wrong.join('\n');
    expect(stale).toMatch(/level3's clock does not say its 420 s budget/);
    expect(stale).toMatch(/level3's clock does not say its Night owl \(160 s left, 260 s elapsed\)/);
    expect(shippedClocks(edit('GDD-13-1953-tripods.md', '**118 s** left (**174 s** elapsed)', '**100 s** left'), levels).wrong.join()).toMatch(/level11's clock does not say its Night owl/);
    expect(shippedClocks(edit('GDD-11-onramp.md', '<!-- shipped clock: birch_neighbours budgetSec=210 parMarginSec=110 -->', ''), levels).wrong.join()).toMatch(/birch_neighbours: 0 shipped clock lines/);
    const added = [...levels, { id: 'level13', kind: 'deep', budgetSec: 300, parMarginSec: 100 }];
    expect(shippedClocks(GDDS, added).wrong.join()).toMatch(/level13: 0 shipped clock lines/);
  });

  // round 6 (Sol P3): the historical 183 later in GDD-12's paragraph ("172 → 183 s") kept a stale headline green
  it('catches a stale headline or Night owl beside a historical match (mutation check)', () => {
    const edit = (file: string, from: string, to: string) => Object.fromEntries(Object.entries(GDDS).map(([f, t]) => [f, f.endsWith(file) ? t.replace(from, to) : t]));
    const cases: [string, string, string, RegExp][] = [
      ['GDD-12-1122-grail.md', 'Dawn gives **183 s**', 'Dawn gives **172 s**', /level10's clock opens with 172 s, not its shipped 183 s budget/],
      ['GDD-12-1122-grail.md', '**Night owl** requires **42 s** left', '**Night owl** requires **50 s** left', /level10's clock gives Night owl 50 s/],
      ['GDD-14-2199-hitchhiker.md', 'starts at **3:40** (**220 s**;', 'starts at **3:25** (**205 s**;', /level12's clock opens with 205 s, not its shipped 220 s budget/],
      ['GDD-11-onramp.md', '**Night owl by 56 s**', '**Night owl by 60 s**', /birch_bakery's clock opens with 60 s, not its shipped 56 s elapsed par/],
      ['GDD-2-deeper.md', 'Sunrise budget 480 s (Night owl: done by 310 s)', 'Sunrise budget 480 s (Night owl: done by 300 s)', /level4's clock gives Night owl 300 s/],
    ];
    for (const [file, from, to, want] of cases) {
      const docs = edit(file, from, to);
      expect(docs, from).not.toEqual(GDDS);
      expect(shippedClocks(docs, levels).wrong.join('\n'), from).toMatch(want);
    }
  });
});

// Round 6 (Sol P3): the verify skill's feature map kept L10 at 330 s and L12 at 175 s after both were retuned. Its level
// table states each deep level's clock: the elapsed-clock level says so, every other one opens its kind column with
// the shipped budgetSec.
function featureMapClocks(map: string, levels: readonly ClockLevel[]): string[] {
  const wrong: string[] = [];
  const rows = new Map([...map.matchAll(/^\| \d+ \| `([a-z0-9_]+)` \| [^|]+ \| ([^|]+) \|/gm)].map(m => [m[1]!, m[2]!.trim()]));
  for (const level of levels) {
    const kind = rows.get(level.id);
    if (kind === undefined) { wrong.push(`${level.id}: no row in the feature map`); continue; }
    if (level.kind !== 'deep') continue;
    const said = clockSeconds(kind)[0]?.n;
    if (level.elapsedParSec !== undefined) {
      if (!/elapsed clock/.test(kind) || said !== undefined) wrong.push(`${level.id}: the feature map says "${kind}", not an elapsed clock`);
    } else if (said !== level.budgetSec) wrong.push(`${level.id}: the feature map says ${said ?? 'no'} s, but ${level.id} ships ${level.budgetSec} s`);
  }
  return wrong;
}

describe('the verify skill\'s feature map states every shipped clock (round 6, Sol P3)', () => {
  const levels = LEVELS as readonly ClockLevel[];
  it('walks every level in LEVELS', () => {
    expect(featureMapClocks(featureMap, levels)).toEqual([]);
  });

  it('catches a stale clock, a missing row and a new level (mutation check)', () => {
    expect(featureMapClocks(featureMap.replace('| deep, 183 s, needs `level9` |', '| deep, 330 s, needs `level9` |'), levels).join()).toMatch(/level10: the feature map says 330 s, but level10 ships 183 s/);
    expect(featureMapClocks(featureMap.replace('| deep, 220 s demolition clock,', '| deep, 175 s demolition clock,'), levels).join()).toMatch(/level12: the feature map says 175 s, but level12 ships 220 s/);
    expect(featureMapClocks(featureMap, [...levels, { id: 'level13', kind: 'deep', budgetSec: 300, parMarginSec: 100 }]).join()).toMatch(/level13: no row/);
  });
});
