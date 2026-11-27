// No orphan art (council v0.2 follow-up): after the stretched-art fix gave each shape its own key, sixteen room
// keys and one flight key were placed nowhere but still sat in ART, so every phone downloaded them at boot.
//
// Rule: every key in ART (everything the loader may request) is drawn by something: a room or level definition
// (walked at run time: ROOMS placements, every string in LEVELS and ROOMS, each sleeper's body parts), or code that
// names the key as a value (a literal, a bare name passed to a `'room/' + key` helper, or a template such as
// `human/${id}_head`). A lookup *by* key does not count: `case 'room/x':` in a fallback painter and `'room/x': …`
// in a table only say how to draw it if someone does. A key nothing draws leaves ART: delete it, or, if a build
// script reads its SVG (scripts/art-shapes/build.mjs reshapes), move it to SOURCE_ART.
import { describe, expect, it } from 'vitest';
import { ART, PRELOAD_ART, SOURCE_ART } from '../src/art-manifest';
import { LEVELS } from '../src/levels/levels';
import { ROOMS } from '../src/abduct/rooms/index';
import { placements, ROOM_ENTRIES } from './abduct-guard-helpers';

const CODE = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const FOLDERS = ['room', 'flight', 'human', 'ui'] as const;
const SCRIPTS = import.meta.glob('../scripts/**/*.mjs', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const stripComments = (src: string): string => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

/** Names and key patterns that code uses as values (not as `case` labels or table keys). */
function codeRefs(sources: Readonly<Record<string, string>>): { names: Set<string>; patterns: RegExp[]; suffixes: Set<string> } {
  const names = new Set<string>();
  const suffixes = new Set<string>();
  const patterns: RegExp[] = [];
  const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [path, raw] of Object.entries(sources)) {
    if (path.endsWith('/art-manifest.ts')) continue;
    const src = stripComments(raw);
    for (const m of src.matchAll(/(['"])([a-z0-9_/]+)\1/g)) {
      const before = src.slice(Math.max(0, m.index! - 12), m.index!);
      const after = src.slice(m.index! + m[0].length, m.index! + m[0].length + 3);
      const label = /case\s+$/.test(before) || (/[{,]\s*$/.test(before) && /^\s*:/.test(after));
      if (!label) names.add(m[2]!);
    }
    // `human/${id}_head`: a template with a fixed part past its folder
    for (const m of src.matchAll(/`([a-z]+\/[^`]*\$\{[^`]*)`/g)) {
      const parts = m[1]!.split(/\$\{[^}]*\}/);
      if (parts.join('').replace(/^[a-z]+\//, '').length > 0) patterns.push(new RegExp(`^${parts.map(esc).join('.+')}$`));
    }
    // key + '_body', where key holds a name used above ('flight/usher55')
    for (const m of src.matchAll(/[\w\])]\s*\+\s*'(_[a-z0-9_]+)'/g)) suffixes.add(m[1]!);
    // 'human/' + photo.human + '_head' and 'flight/grail_' + d.type + '_top'
    for (const m of src.matchAll(/'([a-z]+\/[a-z0-9_]*)'\s*\+\s*[\w.!?[\]()]+(?:\s*\+\s*'([a-z0-9_]*)')?/g)) {
      const [prefix, suffix = ''] = [m[1]!, m[2]];
      if (prefix.replace(/^[a-z]+\//, '').length + suffix.length > 0) patterns.push(new RegExp(`^${esc(prefix)}.+${esc(suffix)}${suffix ? '$' : ''}`));
    }
  }
  return { names, patterns, suffixes };
}

/** Strings anywhere in a value (level and room definitions). */
function strings(v: unknown, out: Set<string>, seen = new Set<unknown>()): Set<string> {
  if (typeof v === 'string') out.add(v);
  else if (v && typeof v === 'object' && !seen.has(v)) {
    seen.add(v);
    for (const x of Object.values(v)) strings(x, out, seen);
  }
  return out;
}

/** Keys of `keys` that nothing draws. */
function orphans(keys: readonly string[], sources: Readonly<Record<string, string>>): string[] {
  const { names, patterns, suffixes } = codeRefs(sources);
  const used = new Set<string>(placements().map((p) => p.sprite.key));
  const data = strings(ROOMS, strings(LEVELS, new Set()));
  for (const s of [...data, ...names]) {
    used.add(s);
    for (const f of FOLDERS) used.add(`${f}/${s}`);
  }
  // a sleeper's body is drawn by part: human/<id>_head, _torso, _upper_arm…
  const bodies = ROOM_ENTRIES.map(([, r]) => `human/${r.human}_`);
  const named = (k: string): boolean => used.has(k) || [...suffixes].some((x) => k.endsWith(x) && used.has(k.slice(0, -x.length)));
  const drawn = (k: string): boolean => named(k) || patterns.some((p) => p.test(k)) || bodies.some((b) => k.startsWith(b));
  // localArt(key) draws `${key}_fr` in French
  return keys.filter((k) => !drawn(k) && !(k.endsWith('_fr') && drawn(k.slice(0, -3))));
}

describe('every art key is drawn by something', () => {
  it('ART has no orphan keys (nothing downloads art nobody draws)', () => {
    expect(orphans(Object.keys(ART), CODE)).toEqual([]);
  });

  it('SOURCE_ART keys stay out of ART and the preload, and a build script still reads each one', () => {
    const scripts = Object.values(SCRIPTS).join('\n');
    for (const key of Object.keys(SOURCE_ART)) {
      expect(key in ART, `${key} is in ART and SOURCE_ART`).toBe(false);
      expect(PRELOAD_ART, key).not.toContain(key);
      expect(scripts, `no build script reads ${key}: delete it and its SVG`).toContain(`'${key}'`);
      expect(orphans([key], CODE), `${key} is drawn again: move it back into ART`).toEqual([key]);
    }
  });

  it('catches a key that is only a fallback-painter case or a table entry (mutation check)', () => {
    const fake = 'room/never_placed_prop';
    const painter = { '../src/fake.ts': `switch (key) {\n  case '${fake}':\n    return true;\n}\nconst T = {\n  '${fake}': [1, 2],\n};` };
    expect(orphans([fake], painter)).toEqual([fake]);
    const used = { '../src/fake.ts': `const s = sprite('${fake}', 0, 0);` };
    expect(orphans([fake], used)).toEqual([]);
    const bare = { '../src/fake.ts': `const s = flag ? art('never_placed_prop', 0, 0) : null;` };
    expect(orphans([fake], bare)).toEqual([]);
  });
});
