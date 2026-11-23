// Deep levels (L3, L4): progression, save migration, the shift runner and map layout rules.
import { describe, expect, it } from 'vitest';
import type { AbductResult } from '../src/contracts';
import { ART } from '../src/art-manifest';
import { circleSegment } from '../src/flight/geometry';
import { LOCK, POWER_LINE, RING_R, SAUCER } from '../src/flight/sim';
import { abductFailLine, deepComment, DEEP_ZIB, SPOT_CAPTIONS, sunriseMemo } from '../src/levels/humor';
import { LEVEL3, LEVEL4 } from '../src/levels/deep-levels';
import { LEVELS, ROOM_IDS, deepSlot, isDeep, isRoomId, levelIndexForRoom, levelRooms } from '../src/levels/levels';
import { DEEP_PAY_MULT, MAX_STARS, UPGRADES, applyDeepRun, computeDeepStars, isLevelUnlocked, totalStars } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave, validateSave } from '../src/levels/save';

const LOCK_R = RING_R * LOCK.insideFrac;

function abduct(over: Partial<AbductResult> = {}): AbductResult {
  return { delivered: true, woke: false, timeSec: 40, bonks: 1, dignity: 80, snores: 4, itemsStolen: [], aborted: false, ...over };
}

describe('levels and routes', () => {
  it('has two training levels and two deep levels, 12 stars in all', () => {
    expect(LEVELS.map((l) => l.kind)).toEqual(['tutorial', 'tutorial', 'deep', 'deep']);
    expect(MAX_STARS).toBe(12);
  });

  it('knows every route, and which level each belongs to', () => {
    expect(ROOM_IDS).toHaveLength(16);
    for (const id of ROOM_IDS) expect(isRoomId(id)).toBe(true);
    expect(isRoomId('nope')).toBe(false);
    expect(levelIndexForRoom('farm_chimney')).toBe(0);
    expect(levelIndexForRoom('laundry_loading')).toBe(1);
    expect(levelIndexForRoom('gary_skylight')).toBe(2);
    expect(levelIndexForRoom('mayor_elevator')).toBe(3);
    const all = LEVELS.flatMap(levelRooms);
    expect(new Set(all).size).toBe(16);
    expect(new Set(all)).toEqual(new Set(ROOM_IDS));
    expect(deepSlot(LEVEL3, 'barb_backdoor')).toEqual({ target: 1, entry: 1 });
  });
});

describe('progression', () => {
  it('unlocks L3 after L2 is delivered, and L4 after L3', () => {
    const s = defaultSave();
    expect(isLevelUnlocked(s, 2)).toBe(false);
    s.levels.level2.delivered = true;
    expect(isLevelUnlocked(s, 2)).toBe(true);
    expect(isLevelUnlocked(s, 3)).toBe(false);
    s.levels.level3.delivered = true;
    expect(isLevelUnlocked(s, 3)).toBe(true);
    expect(isLevelUnlocked(s, 4)).toBe(false);
  });

  it('deep stars: all three, ghost, night owl', () => {
    const base = { delivered: 3, elapsedSec: 200, spotted: 0, failedAbductions: 0, sunrise: false };
    expect(computeDeepStars(300, 45, base)).toEqual([true, true, true]);
    expect(computeDeepStars(300, 45, { ...base, spotted: 1 })).toEqual([true, false, true]);
    expect(computeDeepStars(300, 45, { ...base, failedAbductions: 1 })).toEqual([true, false, true]);
    expect(computeDeepStars(300, 45, { ...base, elapsedSec: 270 })).toEqual([true, true, false]);
    expect(computeDeepStars(300, 45, { ...base, delivered: 2 })).toEqual([false, false, false]);
    expect(computeDeepStars(300, 45, { ...base, sunrise: true })).toEqual([false, false, false]);
  });

  it('deep levels pay about twice per star, sunrise pays nothing', () => {
    const s = defaultSave();
    const full = applyDeepRun(s, 'level3', { delivered: 3, elapsedSec: 200, spotted: 0, failedAbductions: 0, sunrise: false });
    expect(DEEP_PAY_MULT).toBe(2);
    expect(full.glorbs).toBe((5 + 3 * 10) * 2);
    expect(full.save.levels.level3.delivered).toBe(true);
    expect(full.unlockedNext).toBe(true); // L4 opens
    const sun = applyDeepRun(s, 'level3', { delivered: 2, elapsedSec: 300, spotted: 3, failedAbductions: 0, sunrise: true });
    expect(sun.glorbs).toBe(0);
    expect(sun.save.levels.level3.attempts).toBe(1);
    expect(totalStars(sun.save)).toBe(0);
  });

  it('sells the afterburner and the snooze ray', () => {
    expect(UPGRADES.map((u) => u.id)).toEqual(['beam_dampener', 'hush_drive', 'afterburner', 'snooze_ray']);
  });

  it('migrates a v1 save (two levels, old upgrades) without losing anything', () => {
    const old = {
      version: 1,
      glorbs: 77,
      levels: { level1: { stars: [true, true, false], delivered: true, bestTimeSec: 40, attempts: 3 }, level2: { stars: 2, attempts: 1 } },
      upgrades: ['hush_drive', 'rocket_boots'],
      muted: true,
      allUnlocked: false,
      reports: 4,
    };
    const s = validateSave(old);
    expect(s.glorbs).toBe(77);
    expect(s.levels.level1.stars).toEqual([true, true, false]);
    expect(s.levels.level2.stars).toEqual([true, true, false]);
    expect(s.levels.level3).toEqual({ stars: [false, false, false], delivered: false, bestTimeSec: null, attempts: 0 });
    expect(s.levels.level4.delivered).toBe(false);
    expect(s.upgrades).toEqual(['hush_drive']);
    expect(validateSave({ upgrades: ['afterburner', 'snooze_ray'] }).upgrades).toEqual(['afterburner', 'snooze_ray']);
  });
});

describe('the shift runner', () => {
  it('delivers specimens, moves the checkpoint and finishes after the third', () => {
    const run = new DeepRun(LEVEL3, 2);
    expect(run.phase).toBe('flight');
    expect(run.checkpoint).toEqual(LEVEL3.map.start);
    run.tick(10);
    expect(run.startAbduct(2, 1)).toBe('gary_garagedoor');
    expect(run.phase).toBe('abduct');
    run.tick(30);
    expect(run.finishAbduct(abduct({ itemsStolen: ['binoculars'] }))).toBe('flight');
    const ring = LEVEL3.map.targets[2].entries[1];
    expect(run.checkpoint).toEqual({ x: ring.x, y: ring.y });
    expect(run.spawn).toEqual({ x: ring.x, y: ring.y });
    expect(run.delivered).toEqual([false, false, true]);
    expect(run.elapsed).toBeCloseTo(40);
    // spotted: back to the checkpoint, deliveries kept
    expect(run.onSpotted()).toEqual({ x: ring.x, y: ring.y });
    expect(run.spotted).toBe(1);
    run.startAbduct(0, 0);
    run.finishAbduct(abduct());
    run.startAbduct(1, 1);
    expect(run.finishAbduct(abduct())).toBe('done');
    expect(run.summary()).toMatchObject({ delivered: 3, spotted: 1, failedAbductions: 0, sunrise: false });
    expect(run.order).toEqual([2, 0, 1]);
    expect(run.totals.items).toEqual(['binoculars']);
  });

  it('a failed abduction offers a retry of the same route, or flight from that ring', () => {
    const run = new DeepRun(LEVEL4, 3);
    run.startAbduct(1, 1);
    expect(run.finishAbduct(abduct({ delivered: false, failReason: 'sleeper', failBy: 'Tiny' }))).toBe('choice');
    expect(run.failedAbductions).toBe(1);
    expect(run.lastFail).toMatchObject({ target: 1, entry: 1, roomId: 'kev_fireescape', reason: 'sleeper', by: 'Tiny' });
    expect(run.retry()).toBe('kev_fireescape');
    expect(run.phase).toBe('abduct');
    run.finishAbduct(abduct({ delivered: false, aborted: true }));
    expect(run.aborts).toBe(1);
    expect(run.failedAbductions).toBe(1);
    const at = run.backToFlight();
    const ring = LEVEL4.map.targets[1].entries[1];
    expect(at).toEqual({ x: ring.x, y: ring.y });
    expect(run.checkpoint).toEqual(LEVEL4.map.start); // a failed building is not a checkpoint
    expect(run.phase).toBe('flight');
  });

  it('the sunrise clock runs in flight and abduction, not on menus, and ends the shift', () => {
    const run = new DeepRun(LEVEL3, 2);
    expect(run.clockText()).toBe('2:00');
    run.tick(150);
    expect(run.clockText()).toBe('4:00');
    expect(run.dawn).toBe(0);
    run.startAbduct(0, 0);
    run.finishAbduct(abduct({ delivered: false, failReason: 'woke', failBy: 'Dave' }));
    expect(run.tick(500)).toBe(false); // choice screen: paused
    run.retry();
    run.tick(130);
    expect(run.dawn).toBeCloseTo(1 / 3, 5); // 20 s of night left of the last 30
    expect(run.tick(30)).toBe(true);
    expect(run.phase).toBe('sunrise');
    expect(run.clockText()).toBe('6:00');
    expect(run.summary().sunrise).toBe(true);
  });
});

describe('deep maps', () => {
  for (const lv of [LEVEL3, LEVEL4]) {
    const m = lv.map;
    const rings = m.targets.flatMap((t) => t.entries);

    it(`${lv.id}: sizes and budgets match the design`, () => {
      expect(isDeep(lv)).toBe(true);
      expect(m.w).toBe(2160);
      expect(m.h).toBe(lv.id === 'level3' ? 2880 : 3840);
      expect(lv.budgetSec).toBe(lv.id === 'level3' ? 300 : 360);
      expect(m.targets).toHaveLength(3);
      expect(new Set(m.targets.map((t) => t.building.key)).size).toBe(3);
    });

    it(`${lv.id}: every ring sits on its building sprite, on a drawn feature`, () => {
      for (const t of m.targets) {
        const spec = ART[t.building.key]!;
        for (const e of t.entries) {
          expect(Math.abs(e.x - t.building.x), e.roomId).toBeLessThanOrEqual(spec.w / 2);
          expect(Math.abs(e.y - t.building.y), e.roomId).toBeLessThanOrEqual(spec.h / 2);
        }
        const [a, b] = t.entries;
        // the two lock circles never overlap
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(LOCK_R * 2);
      }
    });

    it(`${lv.id}: rings are lockable: clear of wires, crane and porch triggers`, () => {
      const hit = { nx: 0, ny: 0, depth: 0 };
      for (const e of rings)
        for (const d of m.hazards) {
          if (d.type === 'wire') expect(circleSegment(e.x, e.y, LOCK_R + SAUCER.radius * POWER_LINE.hitFrac, d.ax, d.ay, d.bx, d.by, hit), e.roomId).toBe(false);
          if (d.type === 'crane') expect(Math.hypot(e.x - d.x, e.y - d.y), e.roomId).toBeGreaterThan(d.len + d.width + LOCK_R + SAUCER.radius);
          // you can always hover on a ring without tripping a motion light yourself
          if (d.type === 'porch') expect(Math.hypot(e.x - d.x, e.y - d.y), `${e.roomId} porch ${d.x},${d.y}`).toBeGreaterThan(d.trigger + LOCK_R);
          if (d.type === 'neon') expect(Math.hypot(e.x - d.x, e.y - d.y), e.roomId).toBeGreaterThan(d.r + LOCK_R);
        }
    });

    it(`${lv.id}: hazards move fast enough that waiting is never the whole answer`, () => {
      for (const d of m.hazards) {
        if (d.type === 'car') expect(d.speed).toBeGreaterThanOrEqual(300);
        if (d.type === 'traffic') expect(d.speed).toBeGreaterThanOrEqual(300);
        if (d.type === 'flock') expect(d.speed).toBeGreaterThanOrEqual(250);
        if (d.type === 'camera') expect(d.rate).toBeGreaterThanOrEqual(0.9);
        if (d.type === 'watcher') expect(d.hold).toBeLessThanOrEqual(2.2);
        if (d.type === 'dog') expect(d.period).toBeLessThanOrEqual(2.2);
        if (d.type === 'heli') expect(Math.abs(d.period)).toBeLessThanOrEqual(26);
      }
    });

    it(`${lv.id}: start is clear of every detector's reach`, () => {
      for (const d of m.hazards) {
        if (d.type === 'porch') expect(Math.hypot(m.start.x - d.x, m.start.y - d.y)).toBeGreaterThan(d.r + 40);
        if (d.type === 'dog') expect(Math.hypot(m.start.x - d.x, m.start.y - d.y)).toBeGreaterThan(d.rMax + 40);
      }
    });
  }

  it('L3 has every listed hazard: cruiser, porch lights, Mrs. Pruitt, two dogs, bats, power lines, sprinkler', () => {
    const types = LEVEL3.map.hazards.map((d) => (d.type === 'car' ? `car:${d.role}` : d.type === 'gag' ? `gag:${d.kind}` : d.type === 'flock' ? `flock:${d.kind}` : d.type));
    for (const want of ['car:police', 'porch', 'watcher', 'flock:bat', 'wire', 'gag:sprinkler', 'gag:tripwire']) expect(types).toContain(want);
    expect(types.filter((t) => t === 'dog')).toHaveLength(2);
    const cruiser = LEVEL3.map.hazards.find((d) => d.type === 'car')!;
    expect(cruiser.type === 'car' && cruiser.loop && cruiser.barR > 0).toBe(true);
  });

  it('L4 has every listed hazard: helicopter, two patrol cars, cameras, traffic, billboards, crane, pigeons, office windows, tram wires', () => {
    const h = LEVEL4.map.hazards;
    expect(h.filter((d) => d.type === 'heli')).toHaveLength(1);
    expect(h.filter((d) => d.type === 'car' && d.role === 'patrol')).toHaveLength(2);
    expect(h.filter((d) => d.type === 'camera').length).toBeGreaterThanOrEqual(3);
    expect(h.filter((d) => d.type === 'traffic').length).toBeGreaterThanOrEqual(2);
    expect(h.filter((d) => d.type === 'neon' && d.billboard).length).toBeGreaterThanOrEqual(1);
    expect(h.filter((d) => d.type === 'crane')).toHaveLength(1);
    expect(h.filter((d) => d.type === 'flock' && d.kind === 'pigeon').length).toBeGreaterThanOrEqual(1);
    expect(h.filter((d) => d.type === 'window').length).toBeGreaterThanOrEqual(3);
    expect(h.filter((d) => d.type === 'wire' && d.kind === 'tram').length).toBeGreaterThanOrEqual(1);
  });
});

describe('deep humour', () => {
  it('has Zib lines for every hazard type and every spot cause', () => {
    for (const k of ['police', 'patrol', 'traffic', 'porch', 'watcher', 'dog', 'heli', 'camera', 'window', 'neon', 'wire', 'tram', 'bat', 'pigeon', 'crane', 'tripwire'] as const) {
      expect(DEEP_ZIB[k].length, k).toBeGreaterThanOrEqual(2);
    }
    for (const k of ['police', 'patrol', 'traffic', 'porch', 'watcher', 'dog', 'heli', 'camera', 'window']) expect(SPOT_CAPTIONS[k]!.length, k).toBeGreaterThanOrEqual(2);
  });

  it('fail lines name what failed you', () => {
    expect(abductFailLine('sleeper', 'Brenda', 'dave_roof', 0)).toContain('Brenda');
    expect(abductFailLine('woke', 'Coach Barb', 'barb_chimney', 1)).toContain('Coach Barb');
    expect(abductFailLine('alarm', "Gary's laser", 'gary_skylight', 0)).toMatch(/Gary/);
    expect(abductFailLine(undefined, undefined, 'kev_vent', 0).length).toBeGreaterThan(10);
    expect(abductFailLine('alarm', undefined, 'nigel_skylight', 0)).toContain('alarm');
  });

  it('rotates sunrise memos and has deep report quips', () => {
    expect(sunriseMemo(0)).not.toBe(sunriseMemo(1));
    const c = deepComment({ levelId: 'level3', stars: 1, spotted: 4, failed: 0, bonks: 3, remaining: 50, order: [0, 1, 2] }, 0);
    expect(c).toContain('4');
  });
});
