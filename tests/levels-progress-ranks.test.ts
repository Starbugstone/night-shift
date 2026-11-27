// v0.2 ranks: the ladder is spread over every star in LEVELS, and the Work Orders rank panel keeps saying
// something true. Reports behind this guard (council v0.2, Opus P3-1/P3-2, Neon 8):
// - the ladder topped out at 19 of 55 stars: a perfect player was top rank after the 5th order, and the
//   "Next rank at" hint vanished for the other nine orders, the four eras included;
// - the top rank said "Salary pending" after the L8 "Actual salary" payoff;
// - "Parking ring: Zib" (the 2199 payoff) needed L12 delivered *and* exactly Senior Abductor, which no fresh
//   player can hold by then.
// Two journeys walk LEVELS in the order the game offers them (nextDispatchIndex), with the real
// applyRun / applyDeepRun: a perfect one (every star on the first try) and a minimal one (the delivery star only).
import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { LANGS, setLang, tr } from '../src/i18n';
import { isDeep, LEVELS } from '../src/levels/levels';
import { applyDeepRun, applyRun, MAX_STARS, nextDispatchIndex, RANKS, rankFor, totalStars, type RunOutcome } from '../src/levels/progress';
import { defaultSave, validateSave, type LevelId, type SaveData } from '../src/levels/save';
import { deepPar, type LevelDef } from '../src/levels/types';
import { rankCard, type RankCard } from '../src/ui/workorders';

afterEach(() => setLang('en'));

type Play = 'perfect' | 'minimal';

function play(save: SaveData, level: LevelDef, how: Play): RunOutcome {
  const pickup = level.map.collectible?.id;
  if (!isDeep(level)) {
    const roomId = level.map.entries[0]!.roomId;
    const abduct: AbductResult = {
      delivered: true, woke: how === 'minimal', timeSec: how === 'perfect' ? 5 : 999, bonks: 0, dignity: 90, snores: 0,
      itemsStolen: [], aborted: false,
    };
    const flight: FlightResult = { roomId, timeSec: 5, spotted: 0, ...(how === 'perfect' && pickup ? { mapCollectible: pickup } : {}) };
    return applyRun(save, level.id as LevelId, abduct, flight, () => 0);
  }
  const perfect = how === 'perfect';
  return applyDeepRun(save, level.id as LevelId, {
    delivered: level.map.targets.length,
    elapsedSec: perfect ? Math.min(deepPar(level), level.budgetSec) - 1 : Number.isFinite(level.budgetSec) ? level.budgetSec - 1 : deepPar(level) + 60,
    spotted: perfect ? 0 : 1,
    failedAbductions: perfect ? 0 : 1,
    sunrise: false,
    ...(perfect && pickup ? { mapCollectible: pickup } : {}),
  }, () => 0);
}

interface Step {
  level: string;
  stars: number;
  card: RankCard;
  promoted: boolean;
  l8: boolean;
  l12: boolean;
}

/** Every order the game offers, in its order, until none is left. */
function journey(how: Play): Step[] {
  let save = defaultSave();
  const steps: Step[] = [];
  for (let guard = 0; guard < LEVELS.length + 1; guard++) {
    const index = nextDispatchIndex(save);
    if (index < 0) break;
    const level = LEVELS[index]!;
    const out = play(save, level, how);
    expect(out.stars[0], `${how} ${level.id} delivered`).toBe(true);
    save = out.save;
    steps.push({
      level: level.id, stars: totalStars(save), card: rankCard(save), promoted: out.rankAfter !== out.rankBefore,
      l8: save.levels.level8.delivered, l12: save.levels.level12.delivered,
    });
  }
  return steps;
}

const PAY = { en: /salar|payroll|\bpaid\b|\bpays?\b/i, fr: /salari|salaire|la paie|(?<!non )payé/i } as const;

describe('rank ladder over the whole journey', () => {
  for (const lang of LANGS) {
    it(`${lang}: a perfect player is promoted every order or two and keeps a next-rank hint until the last orders`, () => {
      setLang(lang);
      const steps = journey('perfect');
      expect(steps.map((s) => s.level), 'every order is offered once').toEqual([...new Set(steps.map((s) => s.level))]);
      expect(steps).toHaveLength(LEVELS.length);
      expect(steps.at(-1)!.stars).toBe(MAX_STARS);
      // the hint stays up for all but the last two orders, and always points above the stars held
      steps.slice(0, -2).forEach((s) => expect(s.card.nextAt, `${s.level}: next-rank hint`).not.toBeNull());
      for (const s of steps) if (s.card.nextAt !== null) expect(s.card.nextAt).toBeGreaterThan(s.stars);
      // never three orders in a row without a promotion
      let dry = 0;
      for (const s of steps) {
        dry = s.promoted ? 0 : dry + 1;
        expect(dry, `${s.level}: orders since the last promotion`).toBeLessThan(3);
      }
      // the top rank is reached, and every rank's own flavour line is on the panel at some point
      expect(rankFor(steps.at(-1)!.stars)).toBe(RANKS.at(-1));
      const shown = new Set([rankCard(defaultSave()).flavour, ...steps.map((s) => s.card.flavour)]);
      tr().ranks.forEach((r, i) => expect(shown.has(r.flavour), `ranks.${i} flavour is reachable`).toBe(true));
    });

    it(`${lang}: a delivery-only player still climbs and always has a next rank to aim for`, () => {
      setLang(lang);
      const steps = journey('minimal');
      expect(steps).toHaveLength(LEVELS.length);
      for (const s of steps) {
        expect(s.card.nextAt, `${s.level}: next-rank hint`).not.toBeNull();
        expect(s.card.nextAt!).toBeGreaterThan(s.stars);
        expect(s.card.nextAt!).toBeLessThanOrEqual(MAX_STARS);
      }
      expect(steps.filter((s) => s.promoted).length, 'promotions on the way').toBeGreaterThanOrEqual(3);
    });

    it(`${lang}: the panel only talks pay after the L8 salary payoff, and shows the parking ring from L12 on`, () => {
      setLang(lang);
      for (const how of ['perfect', 'minimal'] as const) {
        const steps = journey(how);
        for (const s of steps) {
          if (PAY[lang].test(s.card.flavour)) expect(s.l8, `${how} ${s.level}: "${s.card.flavour}" before L8`).toBe(true);
          expect(s.card.flavour === tr().dispatch2199.parking, `${how} ${s.level}: parking ring line`).toBe(s.l12);
        }
        expect(steps.some((s) => s.l12), `${how}: L12 delivered`).toBe(true);
      }
    });
  }

  it('derives the rank from stars alone, so saves need no rank migration', () => {
    const save = defaultSave();
    expect(JSON.stringify(save)).not.toMatch(/rank/i);
    const old = validateSave({
      version: 2,
      levels: { level1: { stars: [true, true, true], delivered: true }, level2: { stars: [true, true, false], delivered: true } },
    });
    expect(totalStars(old)).toBe(5);
    expect(rankCard(old).title).toBe(tr().ranks[RANKS.indexOf(rankFor(5))]!.title);
    expect(rankCard(old).nextAt).toBe(7);
  });
});
