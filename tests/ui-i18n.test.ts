// Localisation: both tables complete and consistent, French typeset and not left in English,
// every name the game data shows has a translation, language choice resolves and persists.
import { afterEach, describe, expect, it } from 'vitest';
import { ROOMS } from '../src/abduct/rooms';
import { en } from '../src/i18n/en';
import { fmt, getLang, gt, isSingular, langFromLocale, localArt, placeholders, plural, resolveLang, setLang, TABLES, tr } from '../src/i18n';
import { ART } from '../src/art-manifest';
import { abductFailLine, deepComment, itemsPhrase, sunriseMemo, vrellComment } from '../src/levels/humor';
import { LEVELS, isDeep } from '../src/levels/levels';
import { RANKS, UPGRADES } from '../src/levels/progress';
import { defaultSave, loadSave, validateSave, writeSave, type KeyValueStore } from '../src/levels/save';
import simulationSource from '../src/abduct/simulation.ts?raw';

/** `keys` is the path into the table (some keys contain dots, e.g. "Mrs. Pruitt"). */
type Leaf = { keys: readonly (string | number)[]; path: string; value: string };

function leaves(v: unknown, keys: readonly (string | number)[] = []): Leaf[] {
  if (typeof v === 'string') return [{ keys, path: keys.join(' › '), value: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, [...keys, i]));
  if (typeof v === 'object' && v !== null) return Object.entries(v).flatMap(([k, x]) => leaves(x, [...keys, k]));
  return [];
}

/** Object keys at every level (array indices excluded: line lists may differ in length). */
function shape(v: unknown, path = ''): string[] {
  if (Array.isArray(v)) return [`${path}[]`, ...(v.length && typeof v[0] === 'object' ? shape(v[0], `${path}[]`) : [])];
  if (typeof v === 'object' && v !== null) return Object.entries(v).flatMap(([k, x]) => [path ? `${path}.${k}` : k, ...shape(x, path ? `${path}.${k}` : k)]);
  return [];
}

function at(root: unknown, keys: readonly (string | number)[]): unknown {
  let cur: unknown = root;
  for (const k of keys) cur = (cur as Record<string | number, unknown> | undefined)?.[k];
  return cur;
}

/** Strings that read the same in French: names, brands, symbols, loan words. */
const SAME_IN_FRENCH = new Set([
  '‹', '—', ' — ', ', ', 'Zzz', 'Zz', 'Glorbs', 'SPIN CITY', 'CAM 03', 'BURGERS', 'Zib', 'Vrell',
  'Larry', 'Gary', 'Dave', 'Barb', 'Nigel', 'Brenda', 'Biscuit', 'Coach Barb', 'Aquarium', 'lasers',
  'Ptérodactyle', 'Pterodactyl', '{n}/3', '{n}/3  ({names})', '{name} · {route}', '★ {n}/{max}', '+{n} Glorbs', 's',
  '{total}  (fly {fly} · beam {beam})', 'long, Biscuit',
  // L5 pier code
  'Pete', 'Sal', 'Kipper',
  // L6 clinic code
  'Hank', 'Osei', 'Pemberton', 'Gladys', 'Roland',
  // L7 cruise code
  'Greg', 'Marco', 'CASINO', 'Doris',
]);

afterEach(() => setLang('en'));

describe('string tables', () => {
  it('French has every key English has, and nothing else', () => {
    expect(shape(TABLES.fr).sort()).toEqual(shape(en).sort());
  });

  it('no empty strings or empty line lists', () => {
    for (const lang of ['en', 'fr'] as const) {
      for (const { path, value } of leaves(TABLES[lang])) expect(value.trim().length, `${lang}:${path}`).toBeGreaterThan(0);
      const lists = (v: unknown, p: string): void => {
        if (Array.isArray(v)) expect(v.length, `${lang}:${p}`).toBeGreaterThan(0);
        if (typeof v === 'object' && v !== null) for (const [k, x] of Object.entries(v)) lists(x, `${p}.${k}`);
      };
      lists(TABLES[lang], '');
    }
  });

  it('placeholders match between English and French', () => {
    const fr = TABLES.fr;
    for (const { keys, path, value } of leaves(en)) {
      const parent = keys.slice(0, -1);
      if (typeof keys[keys.length - 1] === 'number') {
        // a list of alternative lines: French uses the same set of placeholders overall
        const union = (arr: unknown) => [...new Set((arr as string[]).flatMap(placeholders))].sort();
        expect(union(at(fr, parent)), path).toEqual(union(at(en, parent)));
        continue;
      }
      const other = at(fr, keys);
      expect(typeof other, path).toBe('string');
      expect([...new Set(placeholders(other as string))].sort(), path).toEqual([...new Set(placeholders(value))].sort());
    }
  });

  it('French is not left in English (apart from names and symbols)', () => {
    const fr = TABLES.fr;
    const leftovers: string[] = [];
    for (const { keys, path, value } of leaves(en)) {
      const other = at(fr, keys);
      if (typeof other !== 'string') continue;
      // the French table is typeset on load, so compare against the typeset English too
      if ((other === value || other === value.replace(/'/g, '’')) && !SAME_IN_FRENCH.has(value) && keys[0] !== 'meta') leftovers.push(`${path}: ${value}`);
    }
    expect(leftovers).toEqual([]);
  });

  it('French is typeset: no-break spaces before ? ! : ; and %, inside « », curly apostrophes', () => {
    for (const { path, value } of leaves(TABLES.fr)) {
      expect(value, path).not.toMatch(/ [?!:;%»]/);
      expect(value, path).not.toMatch(/« /);
      expect(value, path).not.toContain("'");
      expect(value, path).not.toMatch(/[A-Za-zÀ-ÿ0-9}][?!;%]/);
    }
    expect(TABLES.fr.memo.to).toBe('À : Stagiaire Zib');
  });

  it('line lists that are picked by index have the same length', () => {
    expect(TABLES.fr.mumbles.length).toBe(en.mumbles.length);
    expect(TABLES.fr.ranks.length).toBe(en.ranks.length);
    expect(TABLES.fr.missionConcepts.length).toBe(en.missionConcepts.length);
    expect(TABLES.fr.memo.deepGoals.length).toBe(3);
    expect(TABLES.fr.memo.tutorialGoals.length).toBe(3);
    expect(TABLES.fr.starLabels.tutorial.length).toBe(3);
    expect(TABLES.fr.starLabels.deep.length).toBe(3);
  });
});

describe('game data is covered', () => {
  it('every name, room, hazard, exit, caption and mumble the rooms show has a translation', () => {
    const data = en.data as Record<string, string>;
    const missing = new Set<string>();
    const need = (s: string) => {
      if (!(s in data)) missing.add(s);
    };
    for (const room of Object.values(ROOMS)) {
      expect(room.item.name in en.items, room.item.name).toBe(true);
      const it = room.interior;
      if (!it) continue;
      need(it.caption);
      need(it.exitName);
      for (const m of it.mumbles) need(m);
      for (const r of it.building.rooms) need(r.name);
      for (const h of it.building.hazards) need(h.name);
      for (const s of it.building.sleepers) need(s.name);
    }
    expect([...missing]).toEqual([]);
  });

  it('every target, watcher and sign on the flight maps has a translation', () => {
    const data = en.data as Record<string, string>;
    const missing: string[] = [];
    const walk = (v: unknown, key = ''): void => {
      if (typeof v === 'string') {
        if ((key === 'short' || key === 'human' || key === 'name' || key === 'text') && !(v in data)) missing.push(`${key}: ${v}`);
        return;
      }
      if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (typeof v === 'object' && v !== null) for (const [k, x] of Object.entries(v)) walk(x, k);
    };
    for (const lv of LEVELS) walk(lv.map);
    expect(missing).toEqual([]);
  });

  it('the English table matches the English left in level data (no drift)', () => {
    for (const lv of LEVELS) {
      const t = en.levels[lv.id];
      expect(lv.title, lv.id).toBe(t.title);
      expect(lv.location, lv.id).toBe(t.location);
      expect(lv.human, lv.id).toBe(t.human);
      expect(lv.memo, lv.id).toEqual({ re: t.re, body: t.body, joke: t.joke });
      const entries = isDeep(lv) ? lv.map.targets.flatMap((tg) => tg.entries) : lv.map.entries;
      for (const e of entries) expect({ route: e.route, difficulty: e.difficulty }, e.roomId).toEqual(en.routes[e.roomId]);
    }
    expect(RANKS.map((r) => r.title)).toEqual(en.ranks.map((r) => r.title));
    for (const u of UPGRADES) expect(u.name).toBe(en.shop.upgrades[u.id].name);
  });

  it('the tutorial sleep-talk in the simulation is the English list', () => {
    const src = simulationSource;
    const block = src.slice(src.indexOf('const MUMBLES = ['), src.indexOf('] as const;', src.indexOf('const MUMBLES = [')));
    const lines = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(lines).toEqual(en.mumbles);
  });
});

describe('lookups', () => {
  it('fills placeholders and picks plurals (French: 0 and 1 are singular)', () => {
    expect(fmt('{a} and {b} and {a}', { a: 1, b: 'x' })).toBe('1 and x and 1');
    expect(fmt('{missing}', {})).toBe('{missing}');
    const forms = { one: '{n} chausson', other: '{n} chaussons' };
    expect(plural(0, forms, {}, 'fr')).toBe('0 chausson');
    expect(plural(1, forms, {}, 'fr')).toBe('1 chausson');
    expect(plural(2, forms, {}, 'fr')).toBe('2 chaussons');
    expect(isSingular(0, 'en')).toBe(false);
    expect(isSingular(1, 'en')).toBe(true);
  });

  it('data strings show in the current language and fall back to their source', () => {
    setLang('fr');
    expect(gt('Grandfather clock')).toBe('Horloge comtoise');
    expect(gt('Five more minutes…')).toBe(TABLES.fr.mumbles[0]);
    expect(gt('Not in any table')).toBe('Not in any table');
    setLang('en');
    expect(gt('Grandfather clock')).toBe('Grandfather clock');
  });

  it('jokes come out in French with their numbers and names filled', () => {
    setLang('fr');
    expect(itemsPhrase(['slipper', 'slipper', 'coffee mug'])).toBe('2 chaussons, 1 tasse à café');
    expect(itemsPhrase([])).toBe('aucun');
    const line = abductFailLine('alarm', "Gary's laser", 'gary_skylight', 0);
    expect(line).toContain('Laser de Gary');
    expect(line).not.toMatch(/\{|\}/);
    expect(abductFailLine('woke', 'Dentist Dave', 'dave_roof', 0)).toContain('Dave le dentiste');
    const comment = vrellComment(
      {
        abduct: { delivered: true, woke: false, timeSec: 20, bonks: 6, dignity: 60, snores: 3, itemsStolen: [], aborted: false },
        flight: { timeSec: 10, spotted: 0, roomId: 'farm_window' },
        parSec: 99,
        stars: 2,
      },
      0,
    );
    expect(comment).toContain('6 gnons');
    expect(deepComment({ levelId: 'level3', stars: 1, spotted: 4, failed: 0, bonks: 3, remaining: 50, order: [0, 1, 2] }, 0)).toContain('4');
    expect(TABLES.fr.humor.sunriseMemos).toContain(sunriseMemo(1));
  });
});

describe('language choice', () => {
  it('follows the browser by default, the save when chosen, the URL above both', () => {
    expect(langFromLocale('fr-FR')).toBe('fr');
    expect(langFromLocale('fr_CA')).toBe('fr');
    expect(langFromLocale('FR')).toBe('fr');
    expect(langFromLocale('en-GB')).toBe('en');
    expect(langFromLocale('frisian')).toBe('en');
    expect(langFromLocale(undefined)).toBe('en');
    expect(resolveLang('auto', 'fr-BE')).toBe('fr');
    expect(resolveLang('en', 'fr-BE')).toBe('en');
    expect(resolveLang('fr', 'en-US')).toBe('fr');
    expect(resolveLang('fr', 'en-US', 'en')).toBe('en');
    expect(resolveLang('auto', 'en-US', 'nonsense')).toBe('en');
  });

  it('is saved, and old saves without it load as auto', () => {
    expect(defaultSave().lang).toBe('auto');
    expect(validateSave({ glorbs: 3 }).lang).toBe('auto');
    expect(validateSave({ lang: 'fr' }).lang).toBe('fr');
    expect(validateSave({ lang: 'de' }).lang).toBe('auto');
    const mem = new Map<string, string>();
    const store: KeyValueStore = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
    writeSave(store, { ...defaultSave(), lang: 'fr' });
    expect(loadSave(store).lang).toBe('fr');
  });

  it('has French art for every lettered sprite, and the manifest lists it', () => {
    for (const key of ['ui/logo', 'ui/stamp_delivered', 'ui/stamp_failed', 'ui/stamp_sunrise', 'ui/stamp_spotted']) {
      expect(ART[`${key}_fr`], key).toEqual(ART[key]);
      setLang('fr');
      expect(localArt(key)).toBe(`${key}_fr`);
      setLang('en');
      expect(localArt(key)).toBe(key);
    }
  });

  it('switches the table everything reads', () => {
    expect(getLang()).toBe('en');
    expect(tr().title.clockIn).toBe('Clock in');
    setLang('fr');
    expect(tr().title.clockIn).toBe('Pointer');
    expect(tr().meta.docTitle).toContain('Équipe de nuit');
    expect(tr().title.logo).toBe('ÉQUIPE DE NUIT');
  });
});
