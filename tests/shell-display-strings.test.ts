// Runtime code never picks behaviour by comparing against a translated display string (v0.2 council round 2,
// Opus F4): the 1953 bell clapper clicked only when `route.exitName === 'Bell hatch'`, the English exit label that
// is also the key its French text is looked up by, so renaming the label (or a new route sharing the text) would
// silently change the room's sound. Find things by data instead: an id, an art key, a shared constant.
//
// Rule: in src/ (outside src/i18n), no `===`, `!==` or `case` compares with a string literal that is an English
// display string, i.e. any text in src/i18n/en.ts (a value or a table key) with a capital letter or a space.
// PENDING lists the matches from before the rule; it only shrinks, and an entry that stops matching fails until
// it is removed (docs/REGRESSIONS.md P1).
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';

const SOURCES = import.meta.glob(['../src/**/*.ts', '!../src/i18n/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Matches from before the rule, by file and literal, with the count. Only shrinks. */
const PENDING: Readonly<Record<string, Readonly<Record<string, number>>>> = {};

/** Text a player reads: a capital letter or a space, and not a camelCase code key like `timeCarCaught`. */
const isDisplay = (s: string): boolean => s.length >= 3 && /[A-Z ]/.test(s) && !/^[a-z][A-Za-z0-9_]*$/.test(s);

function displayStrings(): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      if (isDisplay(v)) out.add(v);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (isDisplay(k)) out.add(k);
        walk(x);
      }
    }
  };
  walk(en);
  return out;
}

/** Every comparison with a display-string literal: file → literal → count. */
export function displayComparisons(sources: Record<string, string>, strings: ReadonlySet<string>): Record<string, Record<string, number>> {
  const found: Record<string, Record<string, number>> = {};
  for (const [path, text] of Object.entries(sources)) {
    const file = path.replace(/^\.\.\/src\//, '');
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const literals = [
      ...[...code.matchAll(/(?:[!=]==\s*|\bcase\s+)(['"])([^'"\n]+)\1/g)].map(m => m[2]!),
      ...[...code.matchAll(/(['"])([^'"\n]+)\1\s*[!=]==/g)].map(m => m[2]!),
    ];
    for (const literal of literals) {
      if (!strings.has(literal)) continue;
      (found[file] ??= {})[literal] = (found[file]![literal] ?? 0) + 1;
    }
  }
  return found;
}

describe('runtime code does not match on translated display strings', () => {
  const strings = displayStrings();
  const found = displayComparisons(SOURCES, strings);

  it('reads the English strings and the sources', () => {
    expect(strings.size).toBeGreaterThan(500);
    expect(strings.has('Bell hatch')).toBe(true);
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('no new comparison with a display string', () => {
    const fresh: string[] = [];
    for (const [file, literals] of Object.entries(found)) {
      for (const [literal, n] of Object.entries(literals)) {
        const allowed = PENDING[file]?.[literal] ?? 0;
        if (n > allowed) fresh.push(`${file}: compares with the display string '${literal}' (${n}×, ${allowed} pending); compare an id, an art key or a shared constant`);
      }
    }
    expect(fresh).toEqual([]);
  });

  it('PENDING only shrinks: every entry still matches', () => {
    const stale: string[] = [];
    for (const [file, literals] of Object.entries(PENDING)) {
      for (const [literal, n] of Object.entries(literals)) {
        const now = found[file]?.[literal] ?? 0;
        if (now < n) stale.push(`${file} '${literal}': ${now} left of ${n}; lower or remove the PENDING entry`);
      }
    }
    expect(stale).toEqual([]);
  });

  it('catches the old bell-hatch match (mutation check)', () => {
    const old = { '../src/abduct/invasion1953.ts': "    this.clapper = route?.exitName === 'Bell hatch'\n" };
    expect(displayComparisons(old, strings)).toEqual({ 'abduct/invasion1953.ts': { 'Bell hatch': 1 } });
    expect(displayComparisons({ '../src/x.ts': "if (spec.name === 'Baggage cart') {}\ncase 'Shower rail':" }, strings))
      .toEqual({ 'x.ts': { 'Baggage cart': 1, 'Shower rail': 1 } });
  });
});
