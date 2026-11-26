// Joke selection. The lines themselves live in src/i18n (en.ts is the source); the exported
// tables below are the English ones, kept for tests and tools. DOM-free so selection is testable.
import type { AbductResult, FlightResult, RoomId } from '../contracts';
import { en } from '../i18n/en';
import { fmt, gt, isSingular, plural, tr } from '../i18n';
import type { LevelId, SaveData } from './save'; // v4 story
// v4 items & recap humour
import { offeredItems, souvenirTurn } from './souvenir-quips';

export const LOADING_TIPS: readonly string[] = en.loading.tips;

export const SPOTTED_CAPTIONS: readonly string[] = en.humor.spottedCaptions;

export const SPOTTED_SHOUTS: readonly string[] = en.humor.spottedShouts;

export type ZibEvent =
  | 'start'
  | 'cone'
  | 'bark'
  | 'neon'
  | 'powerline'
  | 'highSus'
  | 'nearRing'
  | 'locked'
  | 'respawn';

export const ZIB_LINES: Record<ZibEvent, readonly string[]> = en.humor.zib;

/** Zib's line for a flight event, in the current language. */
export function zibLine(evt: ZibEvent, seed: number): string {
  return pick(tr().humor.zib[evt], seed);
}

export type CommentKey =
  | 'rejected'
  | 'woke'
  | 'perfect'
  | 'spotted'
  | 'bonks'
  | 'stole'
  | 'dignity'
  | 'slow'
  | 'clean'
  | 'default';

export const VRELL_COMMENTS: Record<CommentKey, readonly string[]> = en.humor.vrell;

export interface CommentInput {
  abduct: AbductResult;
  flight: FlightResult;
  parSec: number;
  stars: number;
}

export function commentKey(r: CommentInput): CommentKey {
  const a = r.abduct;
  if (!a.delivered) return 'rejected';
  if (a.woke) return 'woke';
  if (r.stars >= 3) return 'perfect';
  if (r.flight.spotted >= 2) return 'spotted';
  if (a.bonks >= 5) return 'bonks';
  if (a.itemsStolen.length > 0) return 'stole';
  if (a.dignity < 40) return 'dignity';
  if (r.flight.timeSec + a.timeSec > r.parSec) return 'slow';
  if (a.bonks === 0) return 'clean';
  return 'default';
}

/** "1 mug, 2 slippers": items are ids (their English names); each is shown in the current language. */
export function itemsPhrase(items: readonly string[]): string {
  const t = tr();
  if (items.length === 0) return t.humor.itemsNone;
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i, (counts.get(i) ?? 0) + 1);
  const forms = t.items as Readonly<Record<string, { one: string; other: string }>>;
  return [...counts]
    .map(([name, n]) => {
      const f = forms[name];
      return f ? plural(n, f) : `${n} ${name}${isSingular(n) ? '' : 's'}`;
    })
    .join(t.report.listSep);
}

/** Pick a comment for the outcome; `rotation` cycles through the lines. */
export function vrellComment(r: CommentInput, rotation: number): string {
  const key = commentKey(r);
  // v4 items & recap humour: two reports in three are about the room's souvenir (not after a failure)
  const fail = key === 'rejected' || key === 'woke';
  const turn = fail ? null : souvenirTurn({ levelId: '', offered: offeredItems([r.flight.roomId]), got: r.abduct.itemsStolen }, rotation);
  if (turn?.line) return turn.line;
  const lines = tr().humor.vrell[key];
  const line = lines[Math.abs(Math.floor(turn ? turn.rest : rotation)) % lines.length]!;
  return fmt(line, {
    bonks: r.abduct.bonks,
    spotted: r.flight.spotted,
    dignity: Math.round(r.abduct.dignity),
    item: itemsPhrase(r.abduct.itemsStolen),
  });
}

export function pick<T>(list: readonly T[], seed: number): T {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

// ====================================================================== v2: deep levels

/** Zib's first-contact panic, one set per hazard / event in the deep levels. */
export type DeepZibEvent =
  | 'start3'
  | 'start4'
  | 'police'
  | 'patrol'
  | 'traffic'
  | 'porch'
  | 'watcher'
  | 'dog'
  | 'heli'
  | 'camera'
  | 'window'
  | 'neon'
  | 'wire'
  | 'tram'
  | 'bat'
  | 'pigeon'
  | 'crane'
  | 'sprinkler'
  | 'tripwire'
  | 'cropcircle'
  | 'checkpoint'
  | 'dawn'
  | 'nearRing'
  | 'locked'
  | 'respawn'
  // L5 pier code: the lighthouse beam sees you, a gull flock bumps you
  | 'lighthouse'
  | 'gull'
  // L6 clinic code: an ambulance sees you / is scrambled
  | 'ambulance'
  | 'scramble'
  // v4 L8
  | 'hum'
  // L7 cruise code: a photographer frames you / is lining up; a steward's torch; the radar
  | 'photographer'
  | 'framed'
  | 'steward'
  // v4 story: per-level shift openers & 2-of-3 banter
  | 'start5'
  | 'start6'
  | 'start7'
  | 'start8'
  // v4 L9 1955
  | 'start10' | 'grailSentry' | 'cow' | 'clop' | 'rabbit'
  | 'start12' | 'demolition' | 'poetry' | 'dozer'
  | 'start9' | 'timeCarWarn' | 'timeCarLaunch' | 'lightning' | 'timeCarMissed' | 'timeCarCaught'
  | 'stormClosing' | 'eraLight' | 'eraWatcher' | 'eraPolice'
  // v4 1953
  | 'start1953' | 'queue1953' | 'projector1953' | 'sneeze1953'
  | 'twoOfThree'
  | 'birchHandprint' | 'birchRetry' | 'birchLaunch' | 'birchBinLid' | 'birchReturned';

export const DEEP_ZIB: Record<DeepZibEvent, readonly string[]> = en.humor.deepZib;

/** Zib's line for a deep-level event, in the current language. */
export function deepZibLine(evt: DeepZibEvent, seed: number): string {
  return pick(tr().humor.deepZib[evt], seed);
}

/** Caption on the SPOTTED! card, by what caught you. */
export const SPOT_CAPTIONS: Record<string, readonly string[]> = en.humor.spotCaptions;

export function spotCaption(cause: string, seed: number): string {
  const h = tr().humor;
  return pick((h.spotCaptions as Record<string, readonly string[]>)[cause] ?? h.spottedCaptions, seed);
}

/** The witness's shout on the SPOTTED! card, by cause. */
export const SPOT_SHOUTS: Record<string, readonly string[]> = en.humor.spotShouts;

export function spotShout(cause: string, seed: number): string {
  const h = tr().humor;
  return pick((h.spotShouts as Record<string, readonly string[]>)[cause] ?? h.spottedShouts, seed);
}

/** Zib's line under the SPOTTED! card in deep levels, by cause. */
export const SPOT_ZIB: Record<string, readonly string[]> = en.humor.spotZib;

/** Zib's line under the SPOTTED! card, in the current language. */
export function spotZibLine(cause: string, seed: number): string {
  const z = tr().humor.spotZib as Record<string, readonly string[]>;
  return pick(z[cause] ?? z.police!, seed);
}

/** Lines for a failed abduction, by fail reason. `{by}` = what caused it (AbductResult.failBy). */
export const ABDUCT_FAIL_LINES: Record<string, readonly string[]> = en.humor.abductFail;

/** Gary-specific fail lines (L3 running joke): his own tripwires. */
export const GARY_FAIL_LINES: readonly string[] = en.humor.garyFail;

export function abductFailLine(reason: string | undefined, by: string | undefined, roomId: string, seed: number): string {
  const h = tr().humor;
  // `by` is an id from the room data (its English name): shown in the current language
  const name = by && by.length > 0 ? gt(by) : reason === 'alarm' ? h.failAlarm : reason === 'sleeper' ? h.failSleeper : h.failSpecimen;
  const gary = roomId.startsWith('gary') && reason === 'alarm';
  const fails = h.abductFail as Record<string, readonly string[]>;
  const list = gary ? h.garyFail : fails[reason ?? 'aborted'] ?? fails.aborted!;
  return fmt(pick(list, seed), { by: name });
}

/** Vrell's sunrise memos (level failed), rotating. */
export const SUNRISE_MEMOS: readonly string[] = en.humor.sunriseMemos;

export function sunriseMemo(rotation: number, levelId?: LevelId): string {
  const words = tr().humor;
  if (levelId === 'level12') return tr().dispatch2199.lost;
  return pick(levelId === 'level9' ? words.deepComments.clocktowerExpired : words.sunriseMemos, rotation);
}

export interface DeepCommentInput {
  levelId: string;
  stars: number;
  spotted: number;
  failed: number;
  bonks: number;
  remaining: number;
  order: readonly number[];
  /** v4 items & recap humour: souvenirs that came back, and the route of each delivered specimen. */
  items?: readonly string[];
  rooms?: readonly RoomId[];
}

/** Vrell on a delivered deep shift. */
export const DEEP_COMMENTS = en.humor.deepComments;

export function deepComment(r: DeepCommentInput, rotation: number): string {
  const c = tr().humor.deepComments;
  // v4 items & recap humour: two reports in three are about the shift's souvenirs
  const turn = r.rooms ? souvenirTurn({ levelId: r.levelId, offered: offeredItems(r.rooms), got: r.items ?? [] }, rotation) : null;
  if (turn?.line) return turn.line;
  if (turn) rotation = turn.rest;
  let list: readonly string[];
  // v4 council: L8 is a time trial (four apes and Echo), so the three-specimen lines don't fit it
  if (r.levelId === 'level8') list = r.spotted > 0 ? c.monolithSpotted : c.monolith;
  else if (r.levelId === 'level9') {
    if (r.spotted > 0) return plural(r.spotted, c.clocktowerSpotted);
    list = c.clocktower;
  }
  else if (r.stars >= 3) list = c.perfect;
  else if (r.spotted === 0 && r.failed === 0) list = c.ghost;
  else if (r.spotted >= 3) list = c.spotted;
  else if (r.failed >= 2) list = c.failed;
  else if (r.remaining < 20) list = c.close;
  else if (r.levelId === 'level3' && rotation % 2 === 0) list = c.gary;
  else if (r.levelId === 'level4' && rotation % 2 === 0) list = c.mayor;
  else if (r.levelId === 'level5' && rotation % 2 === 0) list = c.pier; // L5 pier code
  else if (r.levelId === 'level6' && rotation % 2 === 0) list = c.clinic; // L6 clinic code
  else if (r.levelId === 'level7' && rotation % 2 === 0) list = c.cruise; // L7 cruise code
  else list = c.default;
  return fmt(pick(list, rotation), { spotted: r.spotted, failed: r.failed, remaining: Math.round(r.remaining) });
}

// v4 story
const DEEP_START: Readonly<Record<string, DeepZibEvent>> = {
  birch_neighbours: 'birchLaunch',
  level3: 'start3',
  level4: 'start4',
  level5: 'start5',
  level6: 'start6',
  level7: 'start7',
  level8: 'start8',
  level12: 'start12',
  level9: 'start9',
  level10: 'start10',
  // v4 1953
  level11: 'start1953',
};

/** v4 story: shift-opener Zib event for a deep level id, or null if none. */
export function deepStartEvent(levelId: string): DeepZibEvent | null {
  return DEEP_START[levelId] ?? null;
}

/** v4 story: Vrell's scripted arc line on a level's first delivery, or null if none. */
export function storyFirstClear(levelId: string): string | null {
  return (tr().humor.storyFirstClear as Readonly<Record<string, string>>)[levelId] ?? null;
}

/** v4 story: loading tips available for the player's current progress (base tips + unlocked tiers). */
export function loadingTips(save?: Pick<SaveData, 'levels'>): readonly string[] {
  const { tips, tierTips } = tr().loading;
  if (!save) return tips;
  const out: string[] = [...tips];
  if (save.levels.level2.delivered) out.push(...tierTips.afterL2);
  if (save.levels.birch_neighbours.delivered) out.push(tr().birch.pruittTip);
  if (save.levels.level4.delivered) out.push(...tierTips.afterL4);
  if (save.levels.level5.delivered) out.push(...tierTips.afterL5);
  if (save.levels.level7.delivered) out.push(...tierTips.afterL7);
  if (save.levels.level8.delivered) out.push(...tierTips.afterL8);
  return out;
}
