// A new mechanic is taught before it is needed (player report, thread "Explain Knight Steadying
// Requirement": the Ni! level made the specimen hang still in the exit, `exitSettleSec`, and nothing
// introduced it. Commit 46ef6be fixed it with a shift-memo line that gives the reason, plus room prompts).
//
// Rule: every room-level mechanic (a Room field, an interior route field, a building's sleepers or a
// hazard kind that changes what the player must do) is registered below with the level that introduces
// it and the strings that teach it: a memo line, a route label or route advice the player reads before
// choosing, or an in-room prompt. The test checks that
//   (a) every field and hazard kind found on any room is classified, as a mechanic or in NOT_A_MECHANIC,
//       so a new field fails until someone decides whether it needs teaching;
//   (b) the first level in LEVELS order that uses a mechanic is its registered teaching level;
//   (c) the teaching strings exist in EN and FR, are not empty, and still say the thing (`cue`).
//
// PENDING lists the mechanics that shipped before this rule with nothing that teaches them. It shrinks to
// empty: move an entry to MECHANICS once its strings exist (an id may not sit in both).
//
// v0.2 teaching (council item 11): a behaviour keyed on one sleeper or one room in the abduction runtime
// (Rodney's retreat at half wake, `src/abduct/grail.ts`) hid behind `room.human`, which is not a mechanic.
// The runtime sources are now scanned for comparisons with a human or room id (`=== 'rodney'`,
// `case 'gary_skylight':`); each id found becomes a feature `human.<id>` / `roomid.<id>` of the rooms it
// names, and must be classified like any other field. Room builders (`src/abduct/rooms/`) only shape room
// data, which the fields above already cover; views and art only draw.
import { describe, expect, it } from 'vitest';
import type { Room } from '../src/abduct/rooms/layout';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { LEVELS, levelRooms } from '../src/levels/levels';
import { ROOMS } from '../src/abduct/rooms/index';
import { ROOM_ENTRIES } from './abduct-guard-helpers';

/** A teaching string: a dotted path into `en` / `fr`, and words it must still contain. */
interface Teach {
  key: string;
  cue?: { en: string; fr: string };
}

interface Taught {
  level: string;
  teach: readonly Teach[];
}

const MECHANICS: Readonly<Record<string, Taught>> = {
  'room.flue': { level: 'level1', teach: [{ key: 'routeAdvice.farm_chimney', cue: { en: 'flue', fr: 'conduit' } }] },
  'room.fan': { level: 'level2', teach: [{ key: 'routeAdvice.laundry_skylight', cue: { en: 'fan', fr: 'ventilateur' } }] },
  'room.cart': { level: 'level2', teach: [{ key: 'routeAdvice.laundry_loading', cue: { en: 'cart', fr: 'chariot' } }] },
  // A second sleeper with its own wake meter (Crumb the cat first).
  'building.sleepers': {
    level: 'birch_bakery',
    teach: [
      { key: 'levels.birch_bakery.joke', cue: { en: 'Crumb', fr: 'Miettes' } },
      { key: 'routes.mabel_stockroom.difficulty', cue: { en: 'Crumb', fr: 'Miettes' } },
    ],
  },
  'hazard.laser': {
    level: 'birch_neighbours',
    teach: [{ key: 'birch.crossLaser' }, { key: 'routes.nora_side.difficulty', cue: { en: 'laser', fr: 'laser' } }],
  },
  'hazard.swing': { level: 'level3', teach: [{ key: 'routes.dave_roof.difficulty', cue: { en: 'swingy', fr: 'balance' } }] },
  'hazard.gate': { level: 'level3', teach: [{ key: 'routes.gary_garagedoor.difficulty', cue: { en: 'timed', fr: 'minutée' } }] },
  'hazard.creak': { level: 'level3', teach: [{ key: 'routes.dave_patio.difficulty', cue: { en: 'creaky', fr: 'grince' } }] },
  // The L2 skylight's ceiling fan taught it; L3 puts the same fan in a building.
  'hazard.fan': { level: 'level3', teach: [{ key: 'routeAdvice.laundry_skylight', cue: { en: 'fan', fr: 'ventilateur' } }] },
  'hazard.speaker': { level: 'level4', teach: [{ key: 'routes.kev_vent.difficulty', cue: { en: 'bass', fr: 'basses' } }] },
  'hazard.gear': { level: 'level4', teach: [{ key: 'routes.mayor_clocktower.difficulty', cue: { en: 'gears', fr: 'engrenages' } }] },
  'interior.wet': {
    level: 'level5',
    teach: [{ key: 'levels.level5.body', cue: { en: 'damp', fr: 'humide' } }, { key: 'lessons.refill' }],
  },
  'interior.probes': {
    level: 'level6',
    teach: [{ key: 'levels.level6.body', cue: { en: 'Form 7-B', fr: '7-B' } }, { key: 'lessons.probe' }],
  },
  'hazard.swell': {
    level: 'level7',
    teach: [{ key: 'levels.level7.body', cue: { en: 'swell', fr: 'houle' } }, { key: 'lessons.roll' }],
  },
  // Trolleys on castors slide with the roll.
  'hazard.castor': {
    level: 'level7',
    teach: [{ key: 'routes.marco_promenade.difficulty', cue: { en: 'trolley', fr: 'chariot' } }, { key: 'lessons.roll' }],
  },
  'hazard.toss': { level: 'level8', teach: [{ key: 'levels.level8.joke', cue: { en: 'bone', fr: 'os' } }] },
  // v0.2 teaching: Sir Rodney flees a step at half wake (src/abduct/grail.ts); the memo warns, his mumble cues it.
  'human.rodney': {
    level: 'level10',
    teach: [{ key: 'levels.level10.body', cue: { en: 'runs away', fr: 's’enfuit' } }, { key: 'grail.retreat' }],
  },
  // A dolphin body plan (no arms to grab, flukes): the memo names her.
  'human.bubbles': { level: 'level5', teach: [{ key: 'levels.level5.body', cue: { en: 'dolphin', fr: 'dauphin' } }] },
  // v0.2 teaching: route advice and first-encounter room prompts (src/abduct/room-lessons.ts)
  'room.cat': { level: 'level1', teach: [{ key: 'routeAdvice.farm_chimney', cue: { en: 'cat', fr: 'chat' } }] },
  'hazard.patrol': { level: 'level3', teach: [{ key: 'lessons.patrol', cue: { en: 'rounds', fr: 'ronde' } }] },
  'hazard.fragile': { level: 'level3', teach: [{ key: 'lessons.fragile', cue: { en: 'crash', fr: 'fracas' } }] },
  'hazard.draft': { level: 'level3', teach: [{ key: 'lessons.draft', cue: { en: 'Ride it', fr: 'porter' } }] },
  'hazard.camera': { level: 'level3', teach: [{ key: 'lessons.camera', cue: { en: 'camera', fr: 'caméra' } }] },
  'hazard.pop': { level: 'level4', teach: [{ key: 'lessons.pop', cue: { en: 'cuckoo', fr: 'coucou' } }] },
  'room.exitSettleSec': {
    level: 'level10',
    teach: [
      { key: 'levels.level10.body', cue: { en: 'only takes still passengers', fr: 'passagers immobiles' } },
      { key: 'grail.settle' },
      { key: 'grail.steady' },
      { key: 'grail.wobble' },
    ],
  },
};

/** Mechanics that shipped untaught: the level that introduces them, and what is missing. */
const PENDING: Readonly<Record<string, { level: string; note: string }>> = {};

/** Fields and kinds that do not change what the player must do, with why. */
const NOT_A_MECHANIC: Readonly<Record<string, string>> = {
  'room.backdrop': 'art', 'room.human': 'who sleeps here', 'room.pose': 'spawn pose', 'room.furniture': 'props (roles: tests/abduct-prop-roles.test.ts)',
  'room.exit': 'exit art', 'room.exitZone': 'exit area, drawn with mint dashes', 'room.item': 'the souvenir, with its own hint',
  'room.par': 'star time', 'room.route': 'autopilot waypoints',
  'room.masonry': 'extra wall blocks, drawn as masonry',
  'room.roofExit': 'the exit is in the ceiling and the beam pulls from above: visible layout',
  'room.exitMouthY': 'where in the exit the body is taken in',
  'room.sign': 'a hanging solid that swings when bumped, like any prop',
  'room.wrapperLessons': 'the Field Check wrapper owns the prompts',
  'room.spawnLookAhead': 'camera framing at spawn',
  'room.interior': 'the building format itself; its parts are classified below',
  'interior.building': 'container', 'interior.checkpoints': 'autopilot checkpoints', 'interior.caption': 'name card',
  'interior.mumbles': 'sleep talk', 'interior.exitName': 'exit label',
  'building.rooms': 'sections', 'building.openings': 'doors and hatches, drawn', 'building.walls': 'walls, drawn',
  'building.bounds': 'derived', 'building.hazards': 'expanded into hazard kinds',
  'section.name': 'label', 'section.backdrop': 'art', 'section.x': 'geometry', 'section.y': 'geometry', 'section.w': 'geometry',
  'section.h': 'geometry', 'section.decor': 'decor', 'section.furniture': 'solid props', 'section.supports': 'solid props',
  'section.mounts': 'hung props', 'section.wallOnly': 'draws the backdrop without a floor strip',
  // v0.2 teaching: sleeper-keyed runtime behaviour that changes nothing the player must do
  'human.black_knight': 'armour plates drop off on bonks and he quips; wake and bonks work as for anyone',
  'human.tom_enchanter': "snores on the spark's charge: a sound cue for the spark hazard, classified on its own",
  'human.forester': 'his clock ticks faster as wake rises: a sound cue on the wake meter',
  'human.van_bell': 'screams one line at half wake: speech only',
  'human.collier': 'bonk lines: speech only',
  'human.doyle': 'a quieter snore: sound only',
  'human.moe': 'sulks after bonks: speech only',
};

/** Abduction runtime sources: everything under src/abduct except room builders, views and art. */
const SOURCES = import.meta.glob('../src/abduct/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const RUNTIME = Object.keys(SOURCES).map(p => p.replace('../src/', ''))
  .filter(p => !p.startsWith('abduct/rooms/') && !p.startsWith('abduct/views/') && !/(^|[-/])(draw|view|art)\.ts$/.test(p));

const HUMANS = new Set(ROOM_ENTRIES.map(([, r]) => r.human as string));
const ROOM_IDS = new Set(ROOM_ENTRIES.map(([id]) => id as string));
const ROOM_ID_OF = new Map<Room, string>(ROOM_ENTRIES.map(([id, r]) => [r, id]));

/** Human and room ids the runtime compares against, with the files that do. */
const KEYED = (() => {
  const out = new Map<string, Set<string>>();
  const re = /(?:===|!==)\s*'([a-z][a-z0-9_]*)'|'([a-z][a-z0-9_]*)'\s*(?:===|!==)|case\s+'([a-z][a-z0-9_]*)'\s*:/g;
  for (const file of RUNTIME) {
    for (const m of SOURCES[`../src/${file}`]!.matchAll(re)) {
      const id = m[1] ?? m[2] ?? m[3]!;
      const feature = HUMANS.has(id) ? `human.${id}` : ROOM_IDS.has(id) ? `roomid.${id}` : '';
      if (feature) out.set(feature, (out.get(feature) ?? new Set()).add(file));
    }
  }
  return out;
})();

function present(v: unknown): boolean {
  return v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0);
}

function keysOf(prefix: string, o: object): string[] {
  return Object.entries(o).filter(([, v]) => present(v)).map(([k]) => `${prefix}.${k}`);
}

/** Every classified field and hazard kind a room uses. */
function featuresOf(room: Room): Set<string> {
  const out = new Set(keysOf('room', room));
  if (KEYED.has(`human.${room.human}`)) out.add(`human.${room.human}`);
  const id = ROOM_ID_OF.get(room);
  if (id && KEYED.has(`roomid.${id}`)) out.add(`roomid.${id}`);
  const route = room.interior;
  if (route) {
    for (const k of keysOf('interior', route)) out.add(k);
    for (const k of keysOf('building', route.building)) out.add(k);
    for (const s of route.building.rooms) for (const k of keysOf('section', s)) out.add(k);
    for (const h of route.building.hazards) out.add(`hazard.${h.kind}`);
  }
  return out;
}

function lookup(table: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), table);
}

const registered = (id: string): { level: string } | undefined => MECHANICS[id] ?? PENDING[id];

describe('a new mechanic is taught before it is needed', () => {
  it('classifies every room field and hazard kind', () => {
    const found = new Set(ROOM_ENTRIES.flatMap(([, r]) => [...featuresOf(r)]));
    const open = [...found].filter(f => !registered(f) && !(f in NOT_A_MECHANIC)).sort();
    expect(open, 'add each to MECHANICS (with its teaching level and strings) or NOT_A_MECHANIC').toEqual([]);
  });

  it('finds the sleeper-keyed runtime behaviour (the scan still works)', () => {
    expect(RUNTIME, 'the runtime is scanned').toContain('abduct/simulation.ts');
    expect([...(KEYED.get('human.rodney') ?? [])], "Rodney's retreat is keyed in the runtime").toContain('abduct/simulation.ts');
  });

  it('keeps the lists apart and every mechanic in use', () => {
    const levels = new Set(LEVELS.map(l => l.id as string));
    const used = new Set(LEVELS.flatMap(l => levelRooms(l).flatMap(id => [...featuresOf(ROOMS[id])])));
    for (const id of Object.keys(MECHANICS)) {
      expect(id in PENDING, `${id} is taught now: drop it from PENDING`).toBe(false);
      expect(id in NOT_A_MECHANIC, id).toBe(false);
    }
    for (const id of Object.keys(PENDING)) expect(id in NOT_A_MECHANIC, id).toBe(false);
    for (const [id, { level }] of [...Object.entries(MECHANICS), ...Object.entries(PENDING)]) {
      expect(levels.has(level), `${id}: unknown level ${level}`).toBe(true);
      expect(used.has(id), `${id} is not used by any level any more`).toBe(true);
    }
  });

  it('introduces each mechanic first on its teaching level', () => {
    const first = new Map<string, string>();
    for (const l of LEVELS) {
      for (const id of levelRooms(l)) for (const f of featuresOf(ROOMS[id])) if (!first.has(f)) first.set(f, l.id);
    }
    const bad: string[] = [];
    for (const [id, f] of first) {
      const r = registered(id);
      if (r && r.level !== f) bad.push(`${id} first appears in ${f}, but is taught in ${r.level}`);
    }
    expect(bad).toEqual([]);
  });

  for (const [id, { level, teach }] of Object.entries(MECHANICS)) {
    it(`${id} (${level}) is taught in EN and FR`, () => {
      expect(teach.length, `${id} needs at least one teaching string`).toBeGreaterThan(0);
      for (const { key, cue } of teach) {
        for (const [lang, table] of [['en', en], ['fr', fr]] as const) {
          const s = lookup(table, key);
          expect(typeof s === 'string' && s.trim().length > 0, `${lang}.${key} must be a non-empty string`).toBe(true);
          if (cue) expect(s as string, `${lang}.${key} no longer mentions "${cue[lang]}"`).toContain(cue[lang]);
        }
      }
    });
  }

  for (const [id, { level, note }] of Object.entries(PENDING)) {
    it(`${id} (${level}) still waits for its teaching: ${note}`, () => {
      expect(note.length).toBeGreaterThan(20);
    });
  }
});
