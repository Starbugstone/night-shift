// Stars, Glorbs, ranks, unlocks and upgrades. Pure functions over SaveData.
import type { AbductResult, FlightResult, UpgradeId } from '../contracts';
import { LEVELS, isDeep } from './levels';
import { cloneSave, type LevelId, type SaveData, type Stars } from './save';
import type { LevelDef } from './types';
import { en } from '../i18n/en';

/** English labels (the shown ones come from src/i18n: starLabels). */
export const STAR_LABELS: readonly string[] = en.starLabels.tutorial;
export const DEEP_STAR_LABELS: readonly string[] = en.starLabels.deep;

export function starLabels(l: LevelDef): readonly string[] {
  return isDeep(l) ? DEEP_STAR_LABELS : STAR_LABELS;
}

/** Deep levels pay this many times the tutorial rates. */
export const DEEP_PAY_MULT = 2;

/** Glorbs paid for a delivered run, before stars. */
export const DELIVERY_PAY = 5;
/** Paid once, the first time a star is earned on a level. */
export const NEW_STAR_PAY = 10;
/** Paid for re-earning a star you already had. */
export const REPEAT_STAR_PAY = 2;

export function computeStars(parSec: number, abduct: AbductResult, flight: FlightResult): Stars {
  const delivered = abduct.delivered && !abduct.aborted;
  return [delivered, delivered && !abduct.woke, delivered && flight.timeSec + abduct.timeSec <= parSec];
}

export function countStars(s: Stars): number {
  return (s[0] ? 1 : 0) + (s[1] ? 1 : 0) + (s[2] ? 1 : 0);
}

export function totalStars(save: SaveData): number {
  let n = 0;
  for (const l of LEVELS) n += countStars(save.levels[l.id].stars);
  return n;
}

export const MAX_STARS = LEVELS.length * 3;

export interface Rank {
  title: string;
  minStars: number;
  flavour: string;
}

/** Thresholds; titles and flavour are the English ones from src/i18n (shown via tr().ranks[i]). */
const RANK_STARS = [0, 3, 5, 8, 11, 15, 19] as const;
export const RANKS: readonly Rank[] = RANK_STARS.map((minStars, i) => ({ ...en.ranks[i]!, minStars }));

export function rankFor(stars: number): Rank {
  let r = RANKS[0]!;
  for (const k of RANKS) if (stars >= k.minStars) r = k;
  return r;
}

export function nextRank(stars: number): Rank | null {
  for (const k of RANKS) if (k.minStars > stars) return k;
  return null;
}

export function runReward(prev: Stars, earned: Stars, mult = 1): { glorbs: number; newStars: number } {
  if (!earned[0]) return { glorbs: 0, newStars: 0 };
  let glorbs = DELIVERY_PAY * mult;
  let newStars = 0;
  for (let i = 0; i < 3; i++) {
    if (!earned[i]) continue;
    if (prev[i]) glorbs += REPEAT_STAR_PAY * mult;
    else {
      glorbs += NEW_STAR_PAY * mult;
      newStars++;
    }
  }
  return { glorbs, newStars };
}

/** What a finished deep shift looked like (from the runner). */
export interface DeepSummary {
  /** Specimens delivered (0..3). */
  delivered: number;
  /** Seconds of shift used (= sunrise budget when the sun came up). */
  elapsedSec: number;
  spotted: number;
  failedAbductions: number;
  sunrise: boolean;
}

export function computeDeepStars(budgetSec: number, parMarginSec: number, r: DeepSummary): Stars {
  const all = r.delivered >= 3 && !r.sunrise;
  return [all, all && r.spotted === 0 && r.failedAbductions === 0, all && budgetSec - r.elapsedSec >= parMarginSec];
}

export function isLevelUnlocked(save: SaveData, index: number): boolean {
  const level = LEVELS[index];
  if (!level) return false;
  if (index === 0 || isDeep(level) || save.allUnlocked) return true;
  const prev = LEVELS[index - 1]!;
  return save.levels[prev.id].delivered;
}

export interface RunOutcome {
  save: SaveData;
  stars: Stars;
  /** Stars on this level that were new this run. */
  newStarFlags: Stars;
  glorbs: number;
  rankBefore: Rank;
  rankAfter: Rank;
  /** Next level became playable because of this run. */
  unlockedNext: boolean;
}

/** Apply a finished (non-aborted) tutorial attempt to a copy of the save. */
export function applyRun(save: SaveData, levelId: LevelId, abduct: AbductResult, flight: FlightResult): RunOutcome {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const par = isDeep(level) ? level.budgetSec : level.parSec;
  return applyStars(save, levelId, computeStars(par, abduct, flight), flight.timeSec + abduct.timeSec, 1);
}

/** Apply a finished deep shift (delivered all, or sunrise) to a copy of the save. */
export function applyDeepRun(save: SaveData, levelId: LevelId, r: DeepSummary): RunOutcome {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const budget = isDeep(level) ? level.budgetSec : 300;
  const margin = isDeep(level) ? level.parMarginSec : 0;
  return applyStars(save, levelId, computeDeepStars(budget, margin, r), r.elapsedSec, DEEP_PAY_MULT);
}

function applyStars(save: SaveData, levelId: LevelId, stars: Stars, timeSec: number, payMult: number): RunOutcome {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  const next = cloneSave(save);
  const lv = next.levels[levelId];
  const prev: Stars = [...lv.stars];
  const before = rankFor(totalStars(save));
  const nextWasUnlocked = isLevelUnlocked(save, idx + 1);
  const reward = runReward(prev, stars, payMult);
  lv.stars = [prev[0] || stars[0], prev[1] || stars[1], prev[2] || stars[2]];
  lv.attempts += 1;
  if (stars[0]) {
    lv.delivered = true;
    lv.bestTimeSec = lv.bestTimeSec === null ? timeSec : Math.min(lv.bestTimeSec, timeSec);
  }
  next.glorbs += reward.glorbs;
  next.reports += 1;
  return {
    save: next,
    stars,
    newStarFlags: [stars[0] && !prev[0], stars[1] && !prev[1], stars[2] && !prev[2]],
    glorbs: reward.glorbs,
    rankBefore: before,
    rankAfter: rankFor(totalStars(next)),
    unlockedNext: !nextWasUnlocked && isLevelUnlocked(next, idx + 1),
  };
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  desc: string;
  effect: string;
  price: number;
  icon: string;
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'beam_dampener',
    ...en.shop.upgrades.beam_dampener,
    price: 25,
    icon: 'ui/upgrade_dampener',
  },
  {
    id: 'hush_drive',
    ...en.shop.upgrades.hush_drive,
    price: 35,
    icon: 'ui/upgrade_hush',
  },
  {
    id: 'afterburner',
    ...en.shop.upgrades.afterburner,
    price: 60,
    icon: 'ui/upgrade_afterburner',
  },
  {
    id: 'snooze_ray',
    ...en.shop.upgrades.snooze_ray,
    price: 80,
    icon: 'ui/upgrade_snooze',
  },
];

export function canBuy(save: SaveData, id: UpgradeId): boolean {
  const u = UPGRADES.find((x) => x.id === id);
  return !!u && !save.upgrades.includes(id) && save.glorbs >= u.price;
}

export function buyUpgrade(save: SaveData, id: UpgradeId): SaveData | null {
  if (!canBuy(save, id)) return null;
  const u = UPGRADES.find((x) => x.id === id)!;
  const next = cloneSave(save);
  next.glorbs -= u.price;
  next.upgrades.push(id);
  return next;
}

/** Hush Drive: wake meters fill this much slower (flight suspicion: see suspicionMultiplier). */
export function meterMultiplier(upgrades: ReadonlySet<UpgradeId>): number {
  return upgrades.has('hush_drive') ? 0.75 : 1;
}
