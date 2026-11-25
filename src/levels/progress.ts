// Stars, Glorbs, ranks, unlocks and upgrades. Pure functions over SaveData.
import type { AbductResult, FlightResult, MapCollectibleId, RoomId, UpgradeId } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { LEVELS, isDeep, isRoomId } from './levels';
import { LEGACY_DISPATCH_IDS, cloneSave, isSpecimenId, type LevelId, type SaveData, type Stars } from './save';
import type { DeepTarget, EntryDef, LevelDef } from './types';
import { en } from '../i18n/en';

/** English labels (the shown ones come from src/i18n: starLabels). */
export const STAR_LABELS: readonly string[] = en.starLabels.tutorial;
export const DEEP_STAR_LABELS: readonly string[] = en.starLabels.deep;

/** English star labels of a level, the town pickup star (named after the pickup) included when it has one. */
export function starLabels(l: LevelDef): readonly string[] {
  const base = l.id === 'level8' ? en.timeTrial.stars : isDeep(l) ? DEEP_STAR_LABELS : STAR_LABELS;
  const id = l.map.collectible?.id;
  return id ? [...base, en.mapCollectibles.items[id].name] : base;
}

/** Stars a level can award: three, plus the town pickup star where the map has a pickup. */
export function levelStarCount(l: LevelDef): number {
  return l.map.collectible ? 4 : 3;
}

/** Deep levels pay this many times the tutorial rates. */
export const DEEP_PAY_MULT = 2;

/** Glorbs paid for a delivered run, before stars. */
export const DELIVERY_PAY = 5;
/** Paid once, the first time a star is earned on a level. */
export const NEW_STAR_PAY = 10;
/** Paid for re-earning a star you already had. */
export const REPEAT_STAR_PAY = 2;

/** `pickup`: the level's town pickup; its star needs it taken on a delivered run. */
export function computeStars(parSec: number, abduct: AbductResult, flight: FlightResult, pickup?: MapCollectibleId): Stars {
  const delivered = abduct.delivered && !abduct.aborted;
  return [delivered, delivered && !abduct.woke, delivered && flight.timeSec + abduct.timeSec <= parSec,
    delivered && pickup !== undefined && flight.mapCollectible === pickup];
}

export function countStars(s: Stars): number {
  return s.reduce((n, on) => n + (on ? 1 : 0), 0);
}

export function totalStars(save: SaveData): number {
  let n = 0;
  for (const l of LEVELS) n += countStars(save.levels[l.id].stars);
  return n;
}

export const MAX_STARS = LEVELS.reduce((n, l) => n + levelStarCount(l), 0);

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
  for (let i = 0; i < earned.length; i++) {
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
  /** Completed targets. A time-trial troop counts when it reaches its quota. */
  delivered: number;
  /** Seconds of shift used (= sunrise budget when the sun came up). */
  elapsedSec: number;
  spotted: number;
  failedAbductions: number;
  sunrise: boolean;
  mapCollectible?: MapCollectibleId;
  /** v4 trophy room: souvenirs taken home this shift. */
  trophies?: readonly TrophyFind[];
  /** v4 specimens: specimens delivered this shift. */
  specimens?: readonly SpecimenFind[];
}

/** A souvenir taken home: the item id (its English name) and the route it came from. */
export interface TrophyFind {
  item: string;
  room: RoomId;
}

/** v4 specimens: a delivered specimen id (`Human`) and the route it came from (omitted for outdoor troop pickups). */
export interface SpecimenFind {
  id: string;
  room?: RoomId;
}

export function computeDeepStars(budgetSec: number, parMarginSec: number, r: DeepSummary, levelId?: LevelId): Stars {
  const all = r.delivered >= 3 && !r.sunrise;
  const pickup = LEVELS.find((l) => l.id === levelId)?.map.collectible?.id;
  return [all, all && r.spotted === 0 && (levelId === 'level8' || r.failedAbductions === 0), all && budgetSec - r.elapsedSec >= parMarginSec,
    all && pickup !== undefined && r.mapCollectible === pickup];
}

/** v4 trophy room: put this run's souvenirs on the shelf (first find keeps its route and report number). */
export function recordTrophies(save: SaveData, finds: readonly TrophyFind[]): void {
  for (const { item, room } of finds) {
    if (!Object.hasOwn(en.items, item)) continue;
    const entry = save.trophies[item];
    if (entry) entry.count += 1;
    else save.trophies[item] = { count: 1, room, first: save.reports };
  }
}

/** v4 specimens: log each delivered specimen; roll a cosmetic Bureau probe (~50%) on every delivery. */
export function recordSpecimens(
  save: SaveData,
  finds: readonly SpecimenFind[],
  rng: () => number = Math.random,
): void {
  for (const { id, room } of finds) {
    if (!isSpecimenId(id)) continue;
    if (room !== undefined && !isRoomId(room)) continue;
    const hit = rng() < 0.5 ? 1 : 0;
    const entry = save.specimens[id];
    if (entry) {
      entry.count += 1;
      entry.probes += hit;
      entry.probed = entry.probes > 0;
    } else {
      save.specimens[id] = {
        count: 1,
        ...(room ? { room } : {}),
        first: save.reports,
        probed: hit > 0,
        probes: hit,
      };
    }
  }
}

/** v4 specimens: the specimen a deep target delivers (its route's `human`, or its head art for outdoor pickups). */
export function specimenForTarget(target: DeepTarget<EntryDef[]>): string | null {
  for (const e of target.entries) {
    const room = ROOMS[e.roomId];
    if (room) return room.human;
  }
  const head = target.head ?? `human/${target.short.toLowerCase()}_head`;
  const m = /^human\/(.+)_head$/.exec(head);
  return m ? m[1]! : null;
}

/**
 * v4 specimens: saves from before the Specimen Archive hold no specimens, though their trophies and
 * delivered levels prove who was abducted. Fill the archive once from that evidence (only while it is
 * empty, so it never touches a live archive). The probe stamp is fixed per specimen so reloads agree.
 */
export function backfillSpecimens(save: SaveData): void {
  if (Object.keys(save.specimens).length > 0) return;
  const add = (id: string | null, room: RoomId | undefined, first: number): void => {
    if (!id || !isSpecimenId(id) || save.specimens[id]) return;
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const probed = h % 2 === 0;
    save.specimens[id] = { count: 1, ...(room ? { room } : {}), first, probed, probes: probed ? 1 : 0 };
  };
  for (const { room, first } of Object.values(save.trophies)) add(ROOMS[room]?.human ?? null, room, first);
  for (const lv of LEVELS) {
    if (!save.levels[lv.id].delivered) continue;
    if (isDeep(lv)) {
      for (const t of lv.map.targets) add(specimenForTarget(t), t.entries[0]?.roomId, 0);
    } else {
      const room = lv.map.entries[0]?.roomId;
      if (room) add(ROOMS[room]?.human ?? null, room, 0);
    }
  }
}

/**
 * Preprod testing: every level playable. A runtime switch, never stored in the save, so a
 * production build (which never sets it) sees the player's own unlocks.
 */
let unlockEverything = false;
export function setUnlockEverything(on: boolean): void {
  unlockEverything = on;
}

interface DispatchOrder {
  id: string;
  requires?: readonly string[];
}

const BRIDGE_ORDERS = new Set(['birch_bakery', 'birch_neighbours']);
const legacyDispatchIds: ReadonlySet<string> = new Set(LEGACY_DISPATCH_IDS);

export function dispatchRequirements<Id extends string>(
  order: readonly { id: Id; requires?: readonly Id[] }[], index: number,
): readonly Id[] {
  return order[index]?.requires ?? (index > 0 ? [order[index - 1]!.id] : []);
}

export function isLevelUnlocked(save: SaveData, index: number, order: readonly DispatchOrder[] = LEVELS): boolean {
  const level = order[index];
  if (!level) return false;
  if (unlockEverything || save.allUnlocked || save.levels[level.id]?.delivered) return true;
  if (save.legacyDispatch && legacyDispatchIds.has(level.id)) return true;
  if (save.bridgeAccess && (BRIDGE_ORDERS.has(level.id) || level.id === 'level3')) return true;
  return dispatchRequirements(order, index).every(id => save.levels[id]?.delivered);
}

export function nextDispatchIndex(save: SaveData, order: readonly DispatchOrder[] = LEVELS): number {
  const available = (level: DispatchOrder, i: number) => !save.levels[level.id]?.delivered && isLevelUnlocked(save, i, order);
  // Keep a veteran's forward dispatch ahead of optional catch-up shifts.
  if (save.bridgeAccess && order.some(level => BRIDGE_ORDERS.has(level.id))) {
    const lastClear = order.reduce((last, level, i) => save.levels[level.id]?.delivered ? i : last, -1);
    const maple = order.findIndex(level => level.id === 'level3');
    if (maple >= 0 && lastClear >= maple) {
      const forward = order.findIndex((level, i) => i > lastClear && available(level, i));
      if (forward >= 0) return forward;
      const branch = order.findIndex((level, i) => level.requires && available(level, i));
      if (branch >= 0) return branch;
    }
  }
  return order.findIndex(available);
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
export function applyRun(save: SaveData, levelId: LevelId, abduct: AbductResult, flight: FlightResult, rng: () => number = Math.random): RunOutcome {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const par = isDeep(level) ? level.budgetSec : level.parSec;
  const ok = abduct.delivered && !abduct.aborted;
  const finds = ok ? abduct.itemsStolen.map(item => ({ item, room: flight.roomId })) : [];
  const human = ok ? ROOMS[flight.roomId]?.human : undefined;
  const specimens: SpecimenFind[] = human ? [{ id: human, room: flight.roomId }] : [];
  return applyStars(save, levelId, computeStars(par, abduct, flight, level.map.collectible?.id), flight.timeSec + abduct.timeSec, 1, flight.mapCollectible, finds, specimens, rng);
}

/** Apply a finished deep shift (delivered all, or sunrise) to a copy of the save. */
export function applyDeepRun(save: SaveData, levelId: LevelId, r: DeepSummary, rng: () => number = Math.random): RunOutcome {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const budget = isDeep(level) ? level.budgetSec : 300;
  const margin = isDeep(level) ? level.parMarginSec : 0;
  return applyStars(save, levelId, computeDeepStars(budget, margin, r, levelId), r.elapsedSec, DEEP_PAY_MULT, r.mapCollectible, r.trophies ?? [], r.specimens ?? [], rng);
}

function applyStars(
  save: SaveData,
  levelId: LevelId,
  stars: Stars,
  timeSec: number,
  payMult: number,
  mapCollectible?: MapCollectibleId,
  finds: readonly TrophyFind[] = [],
  specimens: readonly SpecimenFind[] = [],
  rng: () => number = Math.random,
): RunOutcome {
  const idx = LEVELS.findIndex((l) => l.id === levelId);
  const next = cloneSave(save);
  recordTrophies(next, finds);
  recordSpecimens(next, specimens, rng);
  const lv = next.levels[levelId];
  if (mapCollectible && LEVELS[idx]?.map.collectible?.id === mapCollectible) lv.mapCollectible = mapCollectible;
  const prev: Stars = [...lv.stars];
  const before = rankFor(totalStars(save));
  const reward = runReward(prev, stars, payMult);
  lv.stars = [prev[0] || stars[0], prev[1] || stars[1], prev[2] || stars[2], prev[3] || stars[3]];
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
    newStarFlags: [stars[0] && !prev[0], stars[1] && !prev[1], stars[2] && !prev[2], stars[3] && !prev[3]],
    glorbs: reward.glorbs,
    rankBefore: before,
    rankAfter: rankFor(totalStars(next)),
    unlockedNext: stars[0] && LEVELS.some((_, i) => !isLevelUnlocked(save, i) && isLevelUnlocked(next, i)),
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
