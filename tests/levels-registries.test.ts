// Every level in LEVELS has its entry in each per-level registry, and the shared comment pools never
// claim a specimen count the level doesn't have. Player reports this guards against:
// - humor.ts had no level8 branch, so L8 replays said "three specimens";
// - '#000{num}' printed #00010;
// - retired L8 rooms were still registered (and preloaded).
// Already covered elsewhere (not repeated here): memo signoffs and first-clear lines for every level
// (ui-story), three distinct Work Orders faces on three-sleeper levels (ui-workorders), retired L8
// rooms and their art (levels-monolith-retired), memo/collectible hints (flight-collectible*),
// trophy slots (ui-trophies*), FR has every EN key (ui-i18n), order numbers of L8-L12 (levels-dispatch).
//
// PENDING_* name today's gaps (bugs). They only shrink: a pending entry that passes fails.
import { afterAll, describe, expect, it, vi } from 'vitest';
import type { GameContext } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { fmt, LANGS, setLang, TABLES, type Lang } from '../src/i18n';
import { deepComment, deepStartEvent, deepZibLine, vrellComment } from '../src/levels/humor';
import { formatOrderNumber, isDeep, LEVELS, levelRooms, workOrderNumber } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef, LevelDef } from '../src/levels/types';
import { shownStarLabels } from '../src/ui/star-labels';

afterAll(() => setLang('en'));

/** How many specimens a level asks for. L8 is a time trial: four apes (two per troop) and Echo. */
function specimens(l: LevelDef): number {
  if (l.id === 'level8') return 5;
  return isDeep(l) ? l.map.targets.length : 1;
}

/** The specimen counts a line claims ("Three specimens", "All three", "both"...). */
function claims(text: string, lang: Lang): Set<number> {
  const out = new Set<number>();
  const three = lang === 'en'
    ? /\bthree\b(?!\s+(?:million|stars?)\b)|\ball 3\b|\b3 specimens\b/i
    : /\btrois\b(?!\s+(?:millions|étoiles?)\b)|\btous les 3\b|\b3 spécimens\b/i;
  const two = lang === 'en' ? /\bboth\b/i : /\b(?:tous|toutes) les deux\b|\bles deux spécimens\b/i;
  if (three.test(text)) out.add(3);
  if (two.test(text)) out.add(2);
  return out;
}

function wrongCounts(l: LevelDef, lines: Iterable<string>, lang: Lang): string[] {
  const n = specimens(l);
  return [...lines].filter(line => [...claims(line, lang)].some(c => c !== n));
}

/** Every Vrell line a delivered deep shift can end on, over a grid of outcomes. */
function deepComments(l: DeepLevelDef): Set<string> {
  const seen = new Set<string>();
  for (const stars of [1, 2, 3]) for (const spotted of [0, 1, 2, 3, 5]) for (const failed of [0, 1, 2, 4])
    for (const remaining of [1, 5, 60]) for (let rotation = 0; rotation < 8; rotation++) {
      seen.add(deepComment({ levelId: l.id, stars, spotted, failed, bonks: 0, remaining, order: [0, 1, 2] }, rotation));
    }
  return seen;
}

function tutorialComments(l: LevelDef): Set<string> {
  const seen = new Set<string>();
  const roomId = levelRooms(l)[0]!;
  for (const delivered of [true, false]) for (const woke of [false, true]) for (const bonks of [0, 2, 6]) for (const spotted of [0, 1, 3])
    for (const stars of [1, 2, 3]) for (let rotation = 0; rotation < 8; rotation++) {
      seen.add(vrellComment({
        abduct: { delivered, aborted: false, woke, bonks, timeSec: 20, snores: 0, dignity: 80, itemsStolen: [] },
        flight: { roomId, timeSec: 20, spotted }, parSec: 30, stars,
      }, rotation));
    }
  return seen;
}

function context(): GameContext {
  return {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0,
  };
}
function flight(l: DeepLevelDef): DeepFlightScene {
  return new DeepFlightScene({ ctx: context(), level: l, run: new DeepRun(l, workOrderNumber(l.id) - 1), onLocked: vi.fn(), onSunrise: vi.fn(), onQuit: vi.fn() });
}

// ------------------------------------------------------------------ pending gaps (bugs)

/** Levels whose Vrell report lines claim the wrong number of specimens. */
const PENDING_COMMENT_COUNT = new Set<string>([]);
/** humor.deepComments pools whose `{n} sightings` style lines can print "1 sightings" / "1 seconds". */
const PENDING_SINGULAR = new Set<string>([]);
/** Levels whose report cover story has no line of its own (falls back to "swamp gas, a weather balloon, Venus"). */
const PENDING_COVER_CAUSES = new Set<string>([]);
/** Levels with no tabloid headline of their own (fall back to the generic headlines). */
const PENDING_HEADLINES = new Set<string>([]);
/** Deep levels with no shift opener (Zib's first line after the banner). Possibly deliberate: then give it a reason here. */
const PENDING_OPENER = new Set<string>([]);

function pendingCheck(name: string, pending: ReadonlySet<string>, failing: readonly string[]): void {
  expect(failing.filter(id => !pending.has(id)), `${name}: new gap`).toEqual([]);
  expect([...pending].filter(id => !failing.includes(id)), `${name}: fixed, remove from the pending list`).toEqual([]);
}

// ------------------------------------------------------------------ tests

describe('per-level registries', () => {
  it('never has Vrell claim the wrong number of specimens on a report', () => {
    const failing = new Map<string, string[]>();
    for (const lang of LANGS) {
      setLang(lang);
      for (const l of LEVELS) {
        const bad = wrongCounts(l, isDeep(l) ? deepComments(l) : tutorialComments(l), lang);
        if (bad.length > 0) failing.set(l.id, [...(failing.get(l.id) ?? []), ...bad.map(b => `${lang}: ${b}`)]);
      }
    }
    pendingCheck('report comment counts', PENDING_COMMENT_COUNT, [...failing.keys()]);
  });

  it('never prints "1 sightings" or "1 seconds" in a report line', () => {
    const singular: Record<Lang, RegExp> = {
      en: /\b1 (?:sightings|times|retries|witnesses|failed attempts|seconds)\b/,
      fr: /\b1 (?:observations|tentatives|témoins|repérages|secondes|apparitions)\b/,
    };
    const failing = new Set<string>();
    for (const lang of LANGS) {
      setLang(lang);
      // which pool of humor.deepComments a line came from
      const pools = Object.entries(TABLES[lang].humor.deepComments).flatMap(([pool, lines]) => Array.isArray(lines)
        ? (lines as readonly string[]).map(line => ({ pool, re: new RegExp(`^${line.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{\w+\\?\}/g, '-?\\d+')}$`) }))
        : []);
      for (const l of LEVELS.filter(isDeep)) {
        for (const c of deepComments(l)) {
          if (singular[lang].test(c)) failing.add(pools.find(p => p.re.test(c))?.pool ?? `${l.id}: ${c}`);
        }
      }
    }
    pendingCheck('singular counts', PENDING_SINGULAR, [...failing]);
  });

  it('labels the stars, the work-order banner and its objective with the level\'s own count and clock', () => {
    for (const lang of LANGS) {
      setLang(lang);
      for (const l of LEVELS) {
        expect(wrongCounts(l, shownStarLabels(l), lang), `${lang} ${l.id} star labels`).toEqual([]);
        if (!isDeep(l)) continue;
        const scene = flight(l);
        expect(wrongCounts(l, [scene.bannerBody], lang), `${lang} ${l.id} banner objective`).toEqual([]);
        // no sunrise on an elapsed-time shift
        if (l.clockMode === 'elapsed') {
          expect(`${scene.bannerHeading} ${scene.bannerBody}`, `${lang} ${l.id} banner`).not.toMatch(/sunrise|dawn|aube|lever du soleil/i);
        }
      }
    }
  });

  it('gives every level its own report cover story and tabloid headline in EN and FR', () => {
    const causes: string[] = [];
    const headlines: string[] = [];
    for (const l of LEVELS) {
      for (const lang of LANGS) {
        const x = TABLES[lang].reportExtras as unknown as Record<'causes' | 'headlines', Record<string, readonly string[] | undefined>>;
        if (!(x.causes[l.id]?.length) && !causes.includes(l.id)) causes.push(l.id);
        if (!(x.headlines[l.id]?.length) && !headlines.includes(l.id)) headlines.push(l.id);
      }
    }
    pendingCheck('cover story causes', PENDING_COVER_CAUSES, causes);
    pendingCheck('tabloid headlines', PENDING_HEADLINES, headlines);
  });

  it('opens every deep shift with a Zib line in EN and FR', () => {
    const missing: string[] = [];
    for (const l of LEVELS.filter(isDeep)) {
      const evt = deepStartEvent(l.id);
      if (!evt) {
        missing.push(l.id);
        continue;
      }
      for (const lang of LANGS) {
        setLang(lang);
        expect(deepZibLine(evt, 0)?.trim().length, `${lang} ${l.id} ${evt}`).toBeGreaterThan(5);
      }
    }
    pendingCheck('shift openers', PENDING_OPENER, missing);
  });

  it('registers exactly the rooms the levels use, each with a route name in EN and FR', () => {
    const used = new Set(LEVELS.flatMap(levelRooms));
    expect(new Set(Object.keys(ROOMS)), 'ROOMS vs the rooms LEVELS uses').toEqual(used);
    for (const lang of LANGS) {
      const routes = TABLES[lang].routes as unknown as Record<string, { route?: string } | undefined>;
      for (const id of used) expect(routes[id]?.route?.trim(), `${lang} routes.${id}`).toBeTruthy();
      expect(Object.keys(routes).filter(id => !used.has(id as never)), `${lang}: route strings for unregistered rooms`).toEqual([]);
    }
  });

  it('prints every work order number with four digits and no hard-coded zeros', () => {
    for (const lang of LANGS) {
      const t = TABLES[lang];
      JSON.stringify(t, (_k, v) => {
        if (typeof v === 'string') expect(v, `${lang}: pad with formatOrderNumber, not in the string`).not.toMatch(/[#°]\s*0+\{num\}/);
        return v;
      });
      for (const l of LEVELS) {
        const num = formatOrderNumber(workOrderNumber(l.id));
        expect(num).toMatch(/^\d{4}$/);
        const levels = t.levels as unknown as Record<string, { re: string }>;
        for (const template of [levels[l.id]!.re, t.workOrders.orderNo]) {
          expect(fmt(template, { num }), `${lang} ${l.id}`).toMatch(new RegExp(`[#°]\\s?${num}(?!\\d)`));
        }
      }
    }
  });
});
