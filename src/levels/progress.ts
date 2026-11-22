// Stars, Glorbs, ranks, unlocks and upgrades. Pure functions over SaveData.
import type { AbductResult, FlightResult, UpgradeId } from '../contracts';
import { LEVELS } from './levels';
import { cloneSave, type LevelId, type SaveData, type Stars } from './save';

export const STAR_LABELS = ['Delivered', 'Still asleep', 'Night owl'] as const;

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

export const RANKS: readonly Rank[] = [
  { title: 'Intern', minStars: 0, flavour: 'Unpaid. Mostly.' },
  { title: 'Probationary Abductor', minStars: 3, flavour: 'Promising, if bonky.' },
  { title: 'Abductor', minStars: 5, flavour: 'Lanyard privileges unlocked.' },
  { title: 'Senior Abductor', minStars: 6, flavour: 'Has own parking ring.' },
];

export function rankFor(stars: number): Rank {
  let r = RANKS[0]!;
  for (const k of RANKS) if (stars >= k.minStars) r = k;
  return r;
}

export function nextRank(stars: number): Rank | null {
  for (const k of RANKS) if (k.minStars > stars) return k;
  return null;
}

export function runReward(prev: Stars, earned: Stars): { glorbs: number; newStars: number } {
  if (!earned[0]) return { glorbs: 0, newStars: 0 };
  let glorbs = DELIVERY_PAY;
  let newStars = 0;
  for (let i = 0; i < 3; i++) {
    if (!earned[i]) continue;
    if (prev[i]) glorbs += REPEAT_STAR_PAY;
    else {
      glorbs += NEW_STAR_PAY;
      newStars++;
    }
  }
  return { glorbs, newStars };
}

export function isLevelUnlocked(save: SaveData, index: number): boolean {
  if (index <= 0) return index === 0;
  if (index >= LEVELS.length) return false;
  if (save.allUnlocked) return true;
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

/** Apply a finished (non-aborted) attempt to a copy of the save. */
export function applyRun(save: SaveData, levelId: LevelId, abduct: AbductResult, flight: FlightResult): RunOutcome {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  const level = LEVELS[idx]!;
  const next = cloneSave(save);
  const lv = next.levels[levelId];
  const prev: Stars = [...lv.stars];
  const stars = computeStars(level.parSec, abduct, flight);
  const before = rankFor(totalStars(save));
  const nextWasUnlocked = isLevelUnlocked(save, idx + 1);
  const reward = runReward(prev, stars);
  lv.stars = [prev[0] || stars[0], prev[1] || stars[1], prev[2] || stars[2]];
  lv.attempts += 1;
  if (stars[0]) {
    lv.delivered = true;
    const t = flight.timeSec + abduct.timeSec;
    lv.bestTimeSec = lv.bestTimeSec === null ? t : Math.min(lv.bestTimeSec, t);
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
    name: 'Beam Dampener',
    effect: 'Less limb swing',
    desc: 'Specimens arrive 30% less noodly. Warranty void if used on actual noodles.',
    price: 25,
    icon: 'ui/upgrade_dampener',
  },
  {
    id: 'hush_drive',
    name: 'Hush Drive',
    effect: 'Suspicion & Wake fill 25% slower',
    desc: 'A tiny muffler for your anti-gravity. Dogs now hear only a faint, polite hum.',
    price: 35,
    icon: 'ui/upgrade_hush',
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

/** Hush Drive: meters fill this much slower. */
export function meterMultiplier(upgrades: ReadonlySet<UpgradeId>): number {
  return upgrades.has('hush_drive') ? 0.75 : 1;
}
