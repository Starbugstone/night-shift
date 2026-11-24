// Joke selection. The lines themselves live in src/i18n (en.ts is the source); the exported
// tables below are the English ones, kept for tests and tools. DOM-free so selection is testable.
import type { AbductResult, FlightResult } from '../contracts';
import { en } from '../i18n/en';
import { fmt, gt, isSingular, plural, tr } from '../i18n';

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
  const lines = tr().humor.vrell[key];
  const line = lines[Math.abs(Math.floor(rotation)) % lines.length]!;
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
  // L7 cruise code: a photographer frames you / is lining up; a steward's torch; the radar
  | 'photographer'
  | 'framed'
  | 'steward';

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

export function sunriseMemo(rotation: number): string {
  return pick(tr().humor.sunriseMemos, rotation);
}

export interface DeepCommentInput {
  levelId: string;
  stars: number;
  spotted: number;
  failed: number;
  bonks: number;
  remaining: number;
  order: readonly number[];
}

/** Vrell on a delivered deep shift. */
export const DEEP_COMMENTS = en.humor.deepComments;

export function deepComment(r: DeepCommentInput, rotation: number): string {
  const c = tr().humor.deepComments;
  let list: readonly string[];
  if (r.stars >= 3) list = c.perfect;
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
