// Season flow (user, 2026-11-28, hard rule): "We need consistency and a direct continue to the next level as in the
// earlier levels." After the L8 film the game went to Work Orders while every Grimsby shift before it went straight
// to the next memo. Every delivered shift, with or without a story film after it, continues to the next order's memo
// through continueIndex; only the end of the season returns to Work Orders. REGRESSIONS C24.
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels/levels';
import { continueIndex, isLevelUnlocked } from '../src/levels/progress';
import { defaultSave, type SaveData } from '../src/levels/save';

const gameSource = import.meta.glob('../src/core/game.ts', { query: '?raw', import: 'default', eager: true })['../src/core/game.ts'] as string;
const reportSource = import.meta.glob('../src/ui/report.ts', { query: '?raw', import: 'default', eager: true })['../src/ui/report.ts'] as string;

function deliver(save: SaveData, i: number): SaveData {
  const id = LEVELS[i]!.id;
  return { ...save, levels: { ...save.levels, [id]: { ...save.levels[id as keyof SaveData['levels']]!, delivered: true, attempts: 1 } } };
}

/** Plays the season from order 1, picking `pick(i)` wherever the player could choose, and follows Next each time. */
function walk(first: (open: number[]) => number = (open) => open[0]!): { path: number[]; end: number | null } {
  let save = defaultSave();
  let at = 0;
  const path: number[] = [];
  for (let guard = 0; guard < LEVELS.length * 2; guard++) {
    expect(isLevelUnlocked(save, at), `${LEVELS[at]!.id} is open when the season reaches it`).toBe(true);
    path.push(at);
    save = deliver(save, at);
    const next = continueIndex(save, at);
    if (next === null) return { path, end: null };
    // where two orders are open and fresh, the player may take either from Work Orders: try the other one too
    const open = LEVELS.map((_, i) => i).filter((i) => isLevelUnlocked(save, i) && !save.levels[LEVELS[i]!.id as keyof SaveData['levels']]?.delivered);
    at = open.length > 1 && open.includes(next) ? first(open) : next;
  }
  throw new Error('the season never ends');
}

describe('season flow: a delivered shift goes straight on to the next order', () => {
  it('Next walks the whole season in LEVELS order and ends at Work Orders after the finale', () => {
    const { path, end } = walk();
    expect(path).toEqual(LEVELS.map((_, i) => i));
    expect(end).toBeNull();
  });

  it('the eras in the other order still reach every order and the finale', () => {
    const { path, end } = walk((open) => open[open.length - 1]!);
    expect([...path].sort((a, b) => a - b)).toEqual(LEVELS.map((_, i) => i));
    expect(path.at(-1)).toBe(LEVELS.length - 1);
    expect(end).toBeNull();
  });

  it('every order but the last continues somewhere open on a first delivery', () => {
    let save = defaultSave();
    for (let i = 0; i < LEVELS.length; i++) {
      save = deliver(save, i);
      const next = continueIndex(save, i);
      if (i === LEVELS.length - 1) expect(next, LEVELS[i]!.id).toBeNull();
      else {
        expect(next, `${LEVELS[i]!.id} continues`).not.toBeNull();
        expect(isLevelUnlocked(save, next!), `${LEVELS[i]!.id} -> ${LEVELS[next!]!.id} is open`).toBe(true);
      }
    }
  });

  it('the report and every after-level film continue through the same rule (no film ends on Work Orders)', () => {
    expect(reportSource).toMatch(/continueIndex\(outcome\.save, levelIndex\)/);
    expect(reportSource).toMatch(/if \(this\.nextIndex !== null\) return this\.shell\.toMemo\(this\.nextIndex\);/);
    expect(gameSource).not.toMatch(/playFilm\([^;]*toWorkOrders/);
    expect(gameSource).toMatch(/private continueAfter\(levelIndex: number\): void \{\s*const next = continueIndex\(this\.save, levelIndex\);/);
    expect(gameSource.match(/this\.continueAfter\(/g)?.length, 'tutorial and deep films').toBeGreaterThanOrEqual(2);
  });
});
