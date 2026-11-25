// v4 items & recap humour: each route's souvenir, and Vrell's recap line about it. The line depends
// on the level, the route's item and whether it came back; replays rotate through the lines; every
// line fits Vrell's speech bubble in both languages.
import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult, RoomId } from '../src/contracts';
import { ART } from '../src/art-manifest';
import { ROOMS } from '../src/abduct/rooms';
import { SOUVENIR_ART } from '../src/abduct/souvenir-art';
import { SOUVENIR_SWAPS } from '../src/abduct/souvenir-items';
import { deepComment, vrellComment, type DeepCommentInput } from '../src/levels/humor';
import { LEVELS } from '../src/levels/levels';
import { offeredItems, souvenirQuip, souvenirTurn } from '../src/levels/souvenir-quips';
import { setLang, tr, type Lang } from '../src/i18n';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { wrapWith, type Measure } from '../src/ui/report-layout';
import { VIEW_W } from '../src/contracts';

afterEach(() => setLang('en'));

const LANGS: Lang[] = ['en', 'fr'];
/** Levels 1–7: the ones this table covers (later levels bring their own items). */
const COVERED = LEVELS.filter((lv) => /^level[1-7]$/.test(lv.id));
/** The two routes into each building of level `i`. */
const routesOf = (i: number): RoomId[][] => {
  const lv = COVERED[i]!;
  return lv.kind === 'deep' ? lv.map.targets.map((t) => t.entries.map((e) => e.roomId)) : [lv.map.entries.map((e) => e.roomId)];
};
const COVERED_ROOMS = COVERED.flatMap((_, i) => routesOf(i).flat());

const abduct = (o: Partial<AbductResult> = {}): AbductResult =>
  ({ delivered: true, woke: false, timeSec: 20, bonks: 2, dignity: 80, snores: 3, itemsStolen: [], aborted: false, ...o });
const flight = (roomId: RoomId): FlightResult => ({ roomId, timeSec: 15, spotted: 0 });
const deep = (o: Partial<DeepCommentInput>): DeepCommentInput =>
  ({ levelId: 'level6', stars: 1, spotted: 1, failed: 1, bonks: 3, remaining: 120, order: [0, 1, 2], ...o });

describe('souvenirs per route', () => {
  it('the clinic rear route (Internal Affairs corridor) carries the silver butt plug', () => {
    expect(ROOMS.hank_rear.item.name).toBe('silver butt plug');
    expect(ROOMS.hank_rear.item.sprite.key).toBe('room/silver_plug');
    expect(ROOMS.hank_front.item.name).toBe('jug of prep drink');
  });

  it('the two routes into each building carry different items', () => {
    for (let i = 0; i < COVERED.length; i++) {
      for (const [a, b] of routesOf(i)) expect(ROOMS[a!].item.name, `${a} vs ${b}`).not.toBe(ROOMS[b!].item.name);
    }
  });

  it('a swapped item rests where the old one did: same centre, same bottom, manifest size', () => {
    for (const [id, s] of Object.entries(SOUVENIR_SWAPS)) {
      const sprite = ROOMS[id as RoomId].item.sprite;
      expect(sprite.key).toBe(s!.key);
      // The loading-door pair rests on the top washer. Other swaps keep their original support.
      if (id === 'laundry_loading') {
        const top = ROOMS.laundry_loading.furniture.find(f => f.sprite.key === 'room/washer')!.colliders![0]!;
        const centre = sprite.x + sprite.w / 2;
        expect(centre).toBeGreaterThan(top.x);
        expect(centre).toBeLessThan(top.x + top.w);
        expect(sprite.y + sprite.h).toBe(top.y);
      } else expect(s!.dy ?? 0, id).toBe(0);
      expect({ w: sprite.w, h: sprite.h }).toEqual(ART[s!.key]);
      expect(SOUVENIR_ART[s!.key], `${s!.key} has a fallback drawing`).toBeTypeOf('function');
    }
    // hank_rear: the jug sat at 470,626 (40×60) on the waiting-room floor
    const plug = ROOMS.hank_rear.item.sprite;
    expect(plug.x + plug.w / 2).toBeCloseTo(490, 0);
    expect(plug.y + plug.h).toBe(686);
  });

  it('every item on a covered route has got and missed lines, in both languages', () => {
    for (const id of COVERED_ROOMS) {
      const name = ROOMS[id].item.name;
      for (const table of [en, fr]) {
        const lines = (table.souvenirs.items as Record<string, { got: readonly string[]; missed: readonly string[] }>)[name];
        expect(lines?.got.length, `${name} got`).toBeGreaterThanOrEqual(2);
        expect(lines?.missed.length, `${name} missed`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('tutorial recap (one room)', () => {
  const got = en.souvenirs.items['prize marrow'].got;
  const missed = en.souvenirs.items['prize marrow'].missed;

  it('talks about the souvenir on two reports in three, by whether it came back', () => {
    const c = (rot: number, items: string[]) => vrellComment({ abduct: abduct({ itemsStolen: items }), flight: flight('farm_chimney'), parSec: 99, stars: 2 }, rot);
    expect(got).toContain(c(1, ['prize marrow']));
    expect(got).toContain(c(2, ['prize marrow']));
    expect(missed).toContain(c(1, []));
    expect(missed).toContain(c(2, []));
    // the first of every three stays the outcome line
    expect([...got, ...missed]).not.toContain(c(0, ['prize marrow']));
    expect([...got, ...missed]).not.toContain(c(3, []));
  });

  it('cycles through every line of the item over replays', () => {
    const seen = new Set<string>();
    for (let rot = 0; rot < 30; rot++) seen.add(vrellComment({ abduct: abduct({ itemsStolen: ['odd sock'] }), flight: flight('laundry_skylight'), parSec: 99, stars: 2 }, rot));
    for (const line of en.souvenirs.items['odd sock'].got) expect(seen).toContain(line);
  });

  it('keeps the failure lines after a failed delivery', () => {
    for (let rot = 0; rot < 6; rot++) {
      const line = vrellComment({ abduct: abduct({ delivered: false }), flight: flight('farm_chimney'), parSec: 99, stars: 0 }, rot);
      expect(en.humor.vrell.rejected).toContain(line);
    }
  });

  it('uses the room the player picked: the farm window is about the slipper', () => {
    expect(en.souvenirs.items.slipper.missed).toContain(vrellComment({ abduct: abduct(), flight: flight('farm_window'), parSec: 99, stars: 2 }, 1));
  });
});

describe('deep-shift recap (three rooms)', () => {
  const clinic: RoomId[] = ['hank_rear', 'osei_helipad', 'pemberton_window'];
  const items = en.souvenirs.items;

  it('the plug came back: Vrell points out it is not a very good probe', () => {
    const lines = new Set<string>();
    for (let rot = 0; rot < 24; rot++) lines.add(deepComment(deep({ rooms: clinic, items: ['silver butt plug'] }), rot));
    for (const l of items['silver butt plug'].got) expect(lines).toContain(l);
    expect([...lines].some((l) => l.includes('not a very good probe'))).toBe(true);
    // the rooms whose item stayed behind get their say too
    expect([...lines].some((l) => items['on-call coffee'].missed.includes(l) || items['hospital sock'].missed.includes(l))).toBe(true);
  });

  it('the plug stayed behind on the rear route: a missed line, never a got line', () => {
    const lines = new Set<string>();
    for (let rot = 0; rot < 24; rot++) lines.add(deepComment(deep({ rooms: clinic, items: [] }), rot));
    expect([...lines].some((l) => items['silver butt plug'].missed.includes(l))).toBe(true);
    expect([...lines].some((l) => en.souvenirs.levels.level6.none.includes(l))).toBe(true);
    expect([...lines].some((l) => items['silver butt plug'].got.includes(l))).toBe(false);
  });

  it('front route instead: the plug is never mentioned', () => {
    const rooms: RoomId[] = ['hank_front', 'osei_helipad', 'pemberton_window'];
    for (let rot = 0; rot < 24; rot++) {
      const l = deepComment(deep({ rooms, items: ['jug of prep drink'] }), rot);
      expect(l.toLowerCase()).not.toContain('plug');
    }
  });

  it('all three came back: the level line or a got line', () => {
    const all = ['silver butt plug', 'on-call coffee', 'hospital sock'];
    const ok = [...en.souvenirs.levels.level6.all, ...all.flatMap((i) => items[i as keyof typeof items].got)];
    for (let rot = 1; rot < 12; rot += rot % 3 === 2 ? 2 : 1) expect(ok).toContain(deepComment(deep({ rooms: clinic, items: all }), rot));
  });

  it('every deep level has its own all / none lines, and they match the level', () => {
    for (const lv of COVERED.filter((l) => l.kind === 'deep')) {
      const rooms = routesOf(COVERED.indexOf(lv)).map((pair) => pair[0]!);
      const none = souvenirQuip({ levelId: lv.id, offered: offeredItems(rooms), got: [] }, 0);
      expect(en.souvenirs.levels[lv.id as 'level3'].none, lv.id).toContain(none);
      const got = offeredItems(rooms);
      expect(en.souvenirs.levels[lv.id as 'level3'].all, lv.id).toContain(souvenirQuip({ levelId: lv.id, offered: got, got }, 0));
    }
  });

  it('falls back to the outcome lines when nobody knows the rooms or the items have no lines', () => {
    expect(souvenirTurn({ levelId: 'level8', offered: ['mystery thing'], got: [] }, 1)).toBeNull();
    expect(en.humor.deepComments.default).toContain(deepComment(deep({ levelId: 'level9', stars: 1, spotted: 1, failed: 1 }), 1));
  });

  it('reads in French with the same choice', () => {
    setLang('fr');
    const l = deepComment(deep({ rooms: clinic, items: ['silver butt plug'] }), 1);
    expect(tr().souvenirs.items['silver butt plug'].got).toContain(l);
    expect(tr().souvenirs.items['silver butt plug'].got.some((x) => x.includes('pas une très bonne sonde'))).toBe(true);
  });
});

// v4 easter eggs
describe('easter-egg souvenirs', () => {
  const items = en.souvenirs.items;
  const ship = (captain: RoomId): RoomId[] => [captain, 'marco_skylight', 'greg_awning'];
  const recap = (rooms: RoomId[], got: string[], levelId = 'level7'): Set<string> => {
    const lines = new Set<string>();
    for (let rot = 0; rot < 36; rot++) lines.add(deepComment(deep({ levelId, rooms, items: got }), rot));
    return lines;
  };

  it("the Captain's mast route carries the blue heart pendant, resting where his mug did", () => {
    expect(ROOMS.captain_mast.item.name).toBe('blue heart pendant');
    const pendant = ROOMS.captain_mast.item.sprite;
    expect(pendant.key).toBe('room/blue_heart_pendant');
    expect({ w: pendant.w, h: pendant.h }).toEqual({ w: 40, h: 40 });
    expect(ROOMS.captain_funnel.item.name).toBe("captain's log");
    for (const table of [en, fr]) expect(table.items['blue heart pendant']).toBeDefined();
  });

  it('the pendant came back: a Titanic line, never a stayed-behind one', () => {
    const lines = recap(ship('captain_mast'), ['blue heart pendant']);
    for (const l of items['blue heart pendant'].got) expect(lines).toContain(l);
    expect([...lines].some((l) => l.includes('never, ever let go'))).toBe(true);
    expect([...lines].some((l) => items['blue heart pendant'].missed.includes(l))).toBe(false);
  });

  it('the pendant stayed on the mast: a stayed-behind line, never a came-back one', () => {
    const lines = recap(ship('captain_mast'), []);
    expect([...lines].some((l) => items['blue heart pendant'].missed.includes(l))).toBe(true);
    expect([...lines].some((l) => items['blue heart pendant'].got.includes(l))).toBe(false);
  });

  it('the funnel route never mentions the pendant', () => {
    for (const l of recap(ship('captain_funnel'), ["captain's log"])) expect(l.toLowerCase()).not.toContain('pendant');
  });

  it('L8: the first-edition bone has filing-deadline and OBELISK™ lines both ways', () => {
    const bone = items['first-edition bone'];
    expect(bone.got.length).toBeGreaterThanOrEqual(4);
    expect(bone.missed.length).toBeGreaterThanOrEqual(3);
    expect(bone.got.some((l) => l.includes('OBELISK™'))).toBe(true);
    expect(bone.missed.some((l) => l.includes('OBELISK™'))).toBe(true);
    expect(offeredItems(['echo_appeal'])).toEqual(['first-edition bone']);
    const got = recap(['echo_appeal'], ['first-edition bone'], 'level8');
    for (const l of bone.got) expect(got).toContain(l);
    const missed = recap(['echo_appeal'], [], 'level8');
    for (const l of bone.missed) expect(missed).toContain(l);
    expect([...missed].some((l) => bone.got.includes(l))).toBe(false);
  });

  it('reads in French, with its Titanic nod', () => {
    setLang('fr');
    const lines = new Set<string>();
    for (let rot = 0; rot < 36; rot++) lines.add(deepComment(deep({ levelId: 'level7', rooms: ship('captain_mast'), items: ['blue heart pendant'] }), rot));
    expect([...lines].some((l) => l.includes('jamais, jamais le lâcher'))).toBe(true);
    expect(tr().souvenirs.items['first-edition bone'].got.some((l) => l.includes('OBELISK™'))).toBe(true);
  });
});

describe('fits Vrell’s bubble', () => {
  /** Same generous width estimate as tests/ui-report-extras.test.ts. */
  const measure: Measure = (s, size, weight) => {
    let w = 0;
    for (const ch of s) {
      const caps = (ch >= 'A' && ch <= 'Z') || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
      w += size * (ch === ' ' ? 0.28 : caps ? 0.7 : 'il.,:;\'’!|'.includes(ch) ? 0.3 : 0.56);
    }
    return w * (weight >= 800 ? 1.08 : 1);
  };
  // src/ui/report.ts ReportComment: text width CW - 154; 5 lines at 14 px or 6 at 13 px fill the bubble
  const width = VIEW_W - 48 - 154;

  it('every souvenir line wraps to at most five lines at 14 px', () => {
    for (const lang of LANGS) {
      setLang(lang);
      const s = tr().souvenirs;
      const all = [
        ...Object.values(s.items).flatMap((x) => [...x.got, ...x.missed]),
        ...Object.values(s.levels).flatMap((x) => [...x.all, ...x.none]),
      ];
      for (const line of all) expect(wrapWith(measure, line, width, 14, 600, true).length, `${lang}: ${line}`).toBeLessThanOrEqual(5);
    }
  });
});

// v4 easter eggs: a nudged souvenir is still in its room at spawn, resting where the player can see it
describe('nudged souvenirs stay put', () => {
  it('after two seconds each nudged item has settled near its spot, not fallen through a hatch', async () => {
    const { AbductSimulation } = await import('../src/abduct/simulation');
    const { STEP } = await import('../src/abduct/ragdoll');
    for (const [id, s] of Object.entries(SOUVENIR_SWAPS)) {
      if (!s!.dx && !s!.dy) continue;
      const room = ROOMS[id as RoomId];
      const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, { hard: !!room.interior, wakeFails: !!room.interior });
      for (let t = 0; t < 2 / STEP; t++) sim.update(STEP);
      const sp = room.item.sprite;
      expect(Math.abs(sim.item.x - (sp.x + sp.w / 2)), id).toBeLessThan(40);
      expect(sim.item.y - (sp.y + sp.h / 2), id).toBeLessThan(160);
    }
  });
});
