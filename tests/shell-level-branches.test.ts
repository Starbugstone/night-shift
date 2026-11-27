// Views don't pick behaviour by level id (council v0.2, items 6 and 10): the 2199 launch said "before dawn" under
// a DEMOLITION clock and its retry bar showed a sun, because views chose the deadline words, clock look and sun
// icon with `level.id === 'level9'` / `'level12'` lists that the new level fell through.
//
// Rule: in the flight views, the UI and the deep flight scene, a level id literal ('level8', 'birch_bakery'…, any
// id in LEVELS) appears only where ALLOWED lists it, with the story reason. ALLOWED only shrinks. Anything about
// the deadline, the clock or the HUD comes from level data (`clockMode`, `endsAtSunrise`, `clockLook` in
// src/ui/deadline.ts, `map.targets[].troop`…), so a new level gets it without editing a view. A level-specific
// joke or prop that truly belongs to one story may still name its level: add it to ALLOWED only with the user's
// OK, and say why.
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels/levels';

const SOURCES = import.meta.glob(['../src/flight/views/**/*.ts', '../src/ui/**/*.ts', '../src/flight/deep-scene.ts'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

type Allowed = Readonly<Record<string, Readonly<Record<string, { n: number; why: string }>>>>;

/** Today's level-id literals, per file and id, with why each one belongs to that level's story. */
const ALLOWED: Allowed = {
  'flight/deep-scene.ts': {
    birch_bakery: { n: 3, why: 'Birch Lane on-ramp: its own banner line, the handprint bark and the retry bark' },
    birch_neighbours: { n: 3, why: 'Birch Lane on-ramp: banner line, the returned-gnome bark and the bin-lid gag' },
    level2: { n: 1, why: 'Field Check practice borrows the L2 work-order number' },
    level8: { n: 2, why: 'L8 troops: no "two of three" bark for apes; its banner names the troops and Echo' },
    level9: { n: 2, why: '1955: banner "by 10:10" and its era work-order heading' },
    level11: { n: 1, why: '1953: Zib recognises the pilot queue' },
    level12: { n: 5, why: '2199: practice fork placement and lane check, its heading, practice heading, the poetry guards' },
  },
  'flight/views/birch.ts': { birch_bakery: { n: 1, why: 'the bakery gate lamp and flour props' } },
  'flight/views/deep.ts': {
    birch_bakery: { n: 1, why: 'Birch Lane decor' },
    birch_neighbours: { n: 1, why: 'Birch Lane decor' },
  },
  'flight/views/deep-hud.ts': {
    level8: { n: 2, why: 'L8 troops: the hover rule instead of the fuse rule, no delivered banner for apes' },
    level12: { n: 1, why: '2199 practice badge "Try the fork"' },
  },
  'flight/views/hazards.ts': { birch_neighbours: { n: 1, why: "Mrs. Pruitt's binoculars art" } },
  'flight/views/tutorial.ts': { level2: { n: 2, why: 'L2 tutorial: the power-line crossing band and its wire-gap lesson' } },
  'ui/deep-abduct.ts': {
    birch_bakery: { n: 1, why: 'Birch Lane on-ramp: the shared shift clock replaces the room timer' },
    birch_neighbours: { n: 1, why: 'Birch Lane on-ramp: the shared shift clock replaces the room timer' },
  },
  'ui/field-check.ts': { level2: { n: 1, why: 'Field Check runs inside the L2 work order' } },
  'ui/memo.ts': {
    birch_bakery: { n: 1, why: 'Birch goals line names Mabel and the pie' },
    birch_neighbours: { n: 1, why: 'Birch goals line names Nora and Len' },
    level8: { n: 1, why: 'L8 goals: all 5 apes, the Ghost line' },
    level9: { n: 3, why: '1955 goals: by 10:10, the time-car bonus line, and its staff memo' },
    level10: { n: 1, why: 'era staff memo' },
    level11: { n: 1, why: 'era staff memo' },
    level12: { n: 3, why: '2199: practice button, demolition goals, staff memo' },
  },
  'ui/report-extras.ts': {
    birch_bakery: { n: 2, why: 'Birch first-clear cover and its single headline' },
    birch_neighbours: { n: 2, why: 'Birch first-clear cover and its single headline' },
    level9: { n: 1, why: '1955 cover: "closed the file at 10:10"' },
    level10: { n: 1, why: 'Grail headlines rotate' },
    level11: { n: 1, why: '1953 keeps its one headline' },
  },
  'ui/report.ts': {
    birch_bakery: { n: 1, why: 'the bakery sign on a delivered report' },
    level8: { n: 2, why: 'L8 troops: dignity over rooms, "n/5 apes" delivered row' },
    level9: { n: 2, why: '1955: "pass expired at 10:10" and its archive stamp' },
    level10: { n: 3, why: 'Grail: archive stamp, shrubbery and Ghost covers' },
    level11: { n: 3, why: '1953: archive stamp, first-clear and tripod-leg covers' },
    level12: { n: 2, why: '2199: demolition covers and the Gazette headline' },
  },
  'ui/star-labels.ts': { level8: { n: 1, why: 'L8 star captions: quota met' } },
  'ui/workorders.ts': {
    birch_neighbours: { n: 1, why: 'two mugshots on the Birch Neighbours card' },
    level8: { n: 1, why: 'L8 badge "TIME TRIAL ×5"' },
  },
};

const IDS = LEVELS.map((l) => l.id as string);
const LITERAL = new RegExp(`['"\`](${IDS.join('|')})['"\`]`, 'g');

/** Level-id literals per file (path under src/) and id, comments left out. */
function inventory(sources: Readonly<Record<string, string>>): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const [path, src] of Object.entries(sources)) {
    const file = path.replace('../src/', '');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const m of code.matchAll(LITERAL)) {
      const per = out.get(file) ?? new Map<string, number>();
      out.set(file, per);
      per.set(m[1]!, (per.get(m[1]!) ?? 0) + 1);
    }
  }
  return out;
}

function problems(found: Map<string, Map<string, number>>, allowed: Allowed): { added: string[]; stale: string[] } {
  const added: string[] = [];
  const stale: string[] = [];
  for (const [file, per] of found) {
    for (const [id, n] of per) {
      const ok = allowed[file]?.[id]?.n ?? 0;
      if (n > ok) added.push(`${file}: '${id}' ×${n} (allowed ${ok})`);
    }
  }
  for (const [file, per] of Object.entries(allowed)) {
    for (const [id, { n }] of Object.entries(per)) {
      const now = found.get(file)?.get(id) ?? 0;
      if (now < n) stale.push(`${file}: '${id}' is down to ×${now}: lower ALLOWED to ${now}`);
    }
  }
  return { added, stale };
}

describe('views pick behaviour from level data, not level ids', () => {
  const found = inventory(SOURCES);

  it('scans the views, the UI and the deep flight scene', () => {
    expect(Object.keys(SOURCES)).toContain('../src/flight/deep-scene.ts');
    expect(Object.keys(SOURCES)).toContain('../src/ui/deadline.ts');
    expect(Object.keys(SOURCES).some((p) => p.startsWith('../src/flight/views/'))).toBe(true);
  });

  it('no new level-id branch (use clockMode, clockLook, endsAtSunrise or a level data field)', () => {
    expect(problems(found, ALLOWED).added).toEqual([]);
  });

  it('ALLOWED only shrinks: lower an entry when a branch is gone', () => {
    expect(problems(found, ALLOWED).stale).toEqual([]);
  });

  it('every allowed entry gives its story reason', () => {
    for (const [file, per] of Object.entries(ALLOWED)) {
      for (const [id, { why }] of Object.entries(per)) {
        expect(IDS, `${file}: unknown level ${id}`).toContain(id);
        expect(why.length, `${file} ${id}`).toBeGreaterThan(8);
      }
    }
  });

  it('the deadline module has no level ids at all', () => {
    expect(found.get('ui/deadline.ts')).toBeUndefined();
  });

  it('catches a new branch (mutation check)', () => {
    const mutated = { ...SOURCES, '../src/ui/deadline.ts': `${SOURCES['../src/ui/deadline.ts']}\nconst x = lv.id === 'level11' ? 1 : 0;` };
    expect(problems(inventory(mutated), ALLOWED).added).toContain("ui/deadline.ts: 'level11' ×1 (allowed 0)");
  });
});
