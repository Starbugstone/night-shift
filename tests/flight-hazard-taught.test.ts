// A flight hazard is taught where the player first meets it (council v0.2, item 3 follow-up: the flight lessons
// in src/flight/views/progression-hint.ts are keyed by level id, so a new level that brings a new hazard kind,
// or that moves ahead of the level that used to teach one, could ship with nothing that explains it). This is
// the flight-side twin of tests/abduct-mechanic-taught.test.ts.
//
// Rule: walking LEVELS in play order, every flight hazard kind (and every optional behaviour field of a kind,
// such as a camera's `burst`) is classified. A mechanic is taught on the first level that uses it, by that
// level's FLIGHT_LESSONS entry for the same hazard, or by registered EN+FR strings (a memo line or a flight
// prompt) that still say the thing (`cue`). A variant that plays like a kind taught earlier names that kind.
//
// PENDING lists the hazards that shipped before this rule with nothing that teaches them. It only shrinks: move
// an entry to TAUGHT once its memo line or lesson exists (an id may not sit in both).
import { describe, expect, it } from 'vitest';
import { FLIGHT_LESSONS } from '../src/flight/views/progression-hint';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { setLang } from '../src/i18n';
import { LEVELS, isDeep } from '../src/levels/levels';
import type { LevelDef } from '../src/levels/types';

interface Teach {
  key: string;
  cue?: { en: string; fr: string };
}

/** Taught by strings on its first level (a FLIGHT_LESSONS entry for the same hazard counts on its own). */
const TAUGHT: Readonly<Record<string, { level: string; teach: readonly Teach[] }>> = {
  'hazard.car': {
    level: 'level1',
    teach: [{ key: 'levels.level1.body', cue: { en: 'headlights', fr: 'phares' } }, { key: 'lessons.farmVerge' }],
  },
  'hazard.dog': { level: 'level1', teach: [{ key: 'levels.level1.body', cue: { en: 'yard dog', fr: 'chien' } }] },
  'hazard.neon': { level: 'level2', teach: [{ key: 'levels.level2.body', cue: { en: 'neon', fr: 'néon' } }] },
  'hazard.wire': {
    level: 'level2',
    teach: [{ key: 'levels.level2.joke', cue: { en: 'Power lines are solid', fr: 'lignes électriques sont solides' } }, { key: 'lessons.wireGap' }],
  },
  'hazard.heli': { level: 'level4', teach: [{ key: 'levels.level4.body', cue: { en: 'police chopper', fr: 'hélico' } }] },
  'hazard.cow': { level: 'level10', teach: [{ key: 'levels.level10.joke', cue: { en: 'moos, move', fr: 'meugle' } }] },
};

/** Plays like a kind taught earlier: the variant is taught by that kind. */
const VARIANT_OF: Readonly<Record<string, { of: string; why: string }>> = {
  'hazard.squire': { of: 'hazard.steward', why: 'a steward in armour: same patrol path and torch cone (src/flight/grail.ts)' },
  'hazard.camera.spin': { of: 'hazard.camera', why: 'a radar: the same cone turning one way instead of sweeping' },
};

/** Hazards that shipped untaught: the level that introduces them, and what is missing. Only shrinks. */
const PENDING: Readonly<Record<string, { level: string; note: string }>> = {
  'hazard.camera': { level: 'level3', note: 'rooftop CCTV cones: the L3 memo only says "Gary’s been shopping"' },
  'hazard.flock': { level: 'level3', note: 'solid bat flocks that stun the saucer: no memo line or lesson' },
  'hazard.crane': { level: 'level4', note: 'a rotating solid crane boom: the L4 memo names chopper, traffic and neon only' },
  'hazard.window': { level: 'level4', note: 'office windows that flicker, then light a pool: nothing names them' },
  'hazard.steward': { level: 'level7', note: 'deck stewards with torches: the L7 memo names the photographer and the swell' },
  'hazard.rabbit': { level: 'level10', note: 'the rabbit lunges at a saucer hovering slowly nearby: nothing warns of it' },
  'hazard.camera.burst': { level: 'level11', note: 'the 1953 projector: amber warning then timed exposure; the memo does not explain it' },
};

/** Kinds and fields that change nothing the player must do, with why. */
const NOT_A_MECHANIC: Readonly<Record<string, string>> = {
  'hazard.gag': 'jokes only: Zib comments when you fly close (src/flight/hazards.ts GagHazard)',
  'hazard.porch.mount': 'wall lamp or garden post: art only',
  'hazard.camera.mount': 'roof, pole or radar mast: art only',
  'hazard.camera.skin': 'era fixture at the cone origin: art only',
  'hazard.watcher.skin': 'era art for the watcher',
  'hazard.steward.skin': 'era art for the steward',
  'hazard.traffic.cruise': 'L9 Saturday-night cruisers: their own SPOTTED card, same lane rules',
};

/** Tutorial maps list their hazards by field instead of `hazards`. */
const TUTORIAL_KINDS = { vehicles: 'car', dogs: 'dog', neons: 'neon', powerLines: 'wire' } as const;

/** Every hazard kind a level's map uses, and the optional fields some defs of a kind carry and others don't. */
const OPTIONAL = (() => {
  const count = new Map<string, number>();
  const fields = new Map<string, Map<string, number>>();
  for (const l of LEVELS) {
    if (!isDeep(l)) continue;
    for (const h of l.map.hazards) {
      count.set(h.type, (count.get(h.type) ?? 0) + 1);
      const m = fields.get(h.type) ?? new Map<string, number>();
      fields.set(h.type, m);
      for (const [k, v] of Object.entries(h)) if (v !== undefined) m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  const out = new Set<string>();
  for (const [type, m] of fields) for (const [k, n] of m) if (n < count.get(type)!) out.add(`${type}.${k}`);
  return out;
})();

function featuresOf(level: LevelDef): Set<string> {
  const out = new Set<string>();
  if (!isDeep(level)) {
    for (const [field, kind] of Object.entries(TUTORIAL_KINDS)) {
      if ((level.map[field as keyof typeof TUTORIAL_KINDS] as readonly unknown[]).length > 0) out.add(`hazard.${kind}`);
    }
    return out;
  }
  for (const h of level.map.hazards) {
    out.add(`hazard.${h.type}`);
    for (const [k, v] of Object.entries(h)) if (v !== undefined && OPTIONAL.has(`${h.type}.${k}`)) out.add(`hazard.${h.type}.${k}`);
  }
  return out;
}

/** The level that first uses each feature, in play order. */
function firstUse(levels: readonly LevelDef[]): Map<string, string> {
  const first = new Map<string, string>();
  for (const l of levels) for (const f of featuresOf(l)) if (!first.has(f)) first.set(f, l.id);
  return first;
}

function lookup(table: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), table);
}

/** Does the level's flight lesson teach this hazard kind? */
const lessonTeaches = (feature: string, level: string): boolean => `hazard.${FLIGHT_LESSONS[level]?.hazard}` === feature;

/** Why a feature first used on `level` is fine, or an error. */
function verdict(feature: string, level: string, first: ReadonlyMap<string, string>): string {
  if (feature in NOT_A_MECHANIC) return '';
  const v = VARIANT_OF[feature];
  if (v) {
    const base = first.get(v.of);
    if (!base) return `${feature} is a variant of ${v.of}, which no level uses`;
    const order = LEVELS.map(l => l.id as string);
    return order.indexOf(base) <= order.indexOf(level) ? '' : `${feature} (${level}) comes before ${v.of} is met (${base})`;
  }
  if (lessonTeaches(feature, level)) return '';
  const r = TAUGHT[feature] ?? PENDING[feature];
  if (!r) return `${feature} first appears in ${level} with nothing that teaches it: add a FLIGHT_LESSONS entry for ${level}, or register its EN+FR memo line in TAUGHT`;
  return r.level === level ? '' : `${feature} first appears in ${level}, but is taught in ${r.level}`;
}

describe('a flight hazard is taught where it is first met', () => {
  const first = firstUse(LEVELS);

  it('classifies every hazard kind and optional hazard field, and teaches each on its first level', () => {
    const bad = [...first].map(([f, l]) => verdict(f, l, first)).filter(Boolean);
    expect(bad).toEqual([]);
  });

  it('finds the hazards (the walk still works)', () => {
    expect(first.get('hazard.porch')).toBe('birch_bakery');
    expect(first.get('hazard.camera.burst'), 'optional fields are found').toBe('level11');
    expect(first.get('hazard.car'), 'tutorial maps are walked').toBe('level1');
  });

  it('keeps the lists apart and every entry in use', () => {
    const lists = [TAUGHT, PENDING, VARIANT_OF, NOT_A_MECHANIC] as const;
    for (const [i, a] of lists.entries()) {
      for (const id of Object.keys(a)) {
        for (const b of lists.slice(i + 1)) expect(id in b, `${id} sits in two lists`).toBe(false);
        expect(first.has(id), `${id} is not used by any level any more: drop it`).toBe(true);
      }
    }
    for (const [id, { level }] of Object.entries(PENDING)) {
      expect(lessonTeaches(id, level), `${id} is taught by the ${level} flight lesson now: drop it from PENDING`).toBe(false);
    }
  });

  for (const [id, { level, teach }] of Object.entries(TAUGHT)) {
    it(`${id} (${level}) is taught in EN and FR`, () => {
      expect(teach.length).toBeGreaterThan(0);
      for (const { key, cue } of teach) {
        for (const [lang, table] of [['en', en], ['fr', fr]] as const) {
          const s = lookup(table, key);
          expect(typeof s === 'string' && s.trim().length > 0, `${lang}.${key} must be a non-empty string`).toBe(true);
          if (cue) expect(s as string, `${lang}.${key} no longer mentions "${cue[lang]}"`).toContain(cue[lang]);
        }
      }
    });
  }

  it('every flight lesson has its tip in EN and FR', () => {
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      for (const [id, lesson] of Object.entries(FLIGHT_LESSONS)) expect(lesson.tip().trim().length, `${lang} ${id}`).toBeGreaterThan(0);
    }
    setLang('en');
  });

  for (const [id, { level, note }] of Object.entries(PENDING)) {
    it(`${id} (${level}) still waits for its teaching: ${note}`, () => {
      expect(note.length).toBeGreaterThan(20);
    });
  }

  it('fails a new level that brings an untaught hazard (mutation check)', () => {
    // A copy of a deep level with a hazard kind nothing teaches, played first.
    const deep = LEVELS.find(isDeep)!;
    const fake = { ...deep, id: 'new_level', map: { ...deep.map, hazards: [...deep.map.hazards, { type: 'crane', x: 0, y: 0, len: 1, rate: 1, a0: 0, width: 1 }] } };
    const f = firstUse([fake as LevelDef, ...LEVELS]);
    expect(verdict('hazard.crane', f.get('hazard.crane')!, f)).toMatch(/first appears in new_level, but is taught in level4/);
    const novel = { ...fake, map: { ...fake.map, hazards: [{ type: 'laser_fence' }] } } as unknown as LevelDef;
    const g = firstUse([...LEVELS, novel]);
    expect(verdict('hazard.laser_fence', g.get('hazard.laser_fence')!, g)).toMatch(/nothing that teaches it/);
  });
});
