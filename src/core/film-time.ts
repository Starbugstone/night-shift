// The clock of a story film (src/ui/film.ts). Pure: no DOM, no Pixi, so tests walk every film.
//
// A film is authored at action speed: each shot's camera keys, effects and sound cues sit on its own
// "authored" clock. Captions must stay up long enough to read (docs/story/rules.md §6): each one is
// fully visible for readSeconds() of its longer language. When the action is shorter than that, the
// calm tail of the caption window (holdAt → capOut) is slowed down until the line has had its time,
// so the camera keeps creeping instead of freezing. The film clock is the authored clock with those
// slow stretches put in.
import { readSeconds } from './read-time';

export type Ease = 'linear' | 'drift' | 'outSine' | 'inOutSine' | 'outCubic' | 'inCubic' | 'inOutCubic';

export const EASE: Readonly<Record<Ease, (p: number) => number>> = {
  linear: (p) => p,
  drift: (p) => p * (0.72 + 0.28 * p),
  outSine: (p) => Math.sin((p * Math.PI) / 2),
  inOutSine: (p) => 0.5 - 0.5 * Math.cos(p * Math.PI),
  outCubic: (p) => 1 - Math.pow(1 - p, 3),
  inCubic: (p) => p * p * p,
  inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
};

/** Camera key: [authored seconds into the shot, focus x, focus y (fractions of the image), scale, roll in degrees, easing into this key]. */
export type CamKey = readonly [t: number, x: number, y: number, scale: number, roll?: number, ease?: Ease];

/** Caption fade-in and fade-out (s). They don't count toward the reading time. */
export const CAP_IN = 0.28;
export const CAP_OUT = 0.22;

/** The timing part of a shot. Times are authored seconds from the shot's start. */
export interface ShotClock {
  /** Authored length of the shot. */
  readonly action: number;
  /** Caption window, when the shot has a line: it fades in at capIn and starts fading out at capOut. */
  readonly capIn?: number;
  readonly capOut?: number;
  /** Calm point inside the caption window where the slow stretch starts (defaults to capIn + CAP_IN). */
  readonly holdAt?: number;
}

export interface TimedShot {
  /** Film-clock start and end (s). */
  readonly start: number;
  readonly end: number;
  /** Authored-clock start (s). */
  readonly aStart: number;
  readonly action: number;
  /** Seconds the caption needs fully visible (0 without a caption). */
  readonly read: number;
  readonly holdAt: number;
  /** Authored length of the slowed stretch and the film time it takes. */
  readonly slowA: number;
  readonly slowF: number;
  /** Film-local caption window (fade-in start, fade-out start), or null. */
  readonly capInF: number | null;
  readonly capOutF: number | null;
}

export interface FilmClock {
  readonly shots: readonly TimedShot[];
  /** Film length (s). */
  readonly length: number;
  /** Authored length (s). */
  readonly authored: number;
}

/**
 * Lays a film out. `lines[i]` are shot i's caption in every language (empty for no caption): the
 * longest one sets the reading time, so the film runs the same in every language.
 */
export function timeFilm(shots: readonly ShotClock[], lines: readonly (readonly string[])[]): FilmClock {
  const out: TimedShot[] = [];
  let film = 0;
  let authored = 0;
  shots.forEach((s, i) => {
    const texts = lines[i] ?? [];
    const captioned = s.capIn !== undefined && s.capOut !== undefined && texts.some((t) => t.length > 0);
    const read = captioned ? Math.max(...texts.map((t) => readSeconds(t))) : 0;
    let holdAt = s.action;
    let slowA = 0;
    let slowF = 0;
    if (captioned) {
      const fullFrom = s.capIn! + CAP_IN;
      holdAt = Math.min(s.capOut!, Math.max(fullFrom, s.holdAt ?? fullFrom));
      slowA = s.capOut! - holdAt;
      slowF = Math.max(slowA, read - (holdAt - fullFrom));
    }
    const shot: Omit<TimedShot, 'capInF' | 'capOutF'> = {
      start: film, end: film + s.action + (slowF - slowA), aStart: authored, action: s.action, read, holdAt, slowA, slowF,
    };
    out.push({
      ...shot,
      capInF: captioned ? filmLocal(shot, s.capIn!) : null,
      capOutF: captioned ? filmLocal(shot, s.capOut!) : null,
    });
    film = shot.end;
    authored += s.action;
  });
  return { shots: out, length: film, authored };
}

type Stretch = Pick<TimedShot, 'holdAt' | 'slowA' | 'slowF'>;

/** Authored shot-local seconds → film shot-local seconds. */
export function filmLocal(s: Stretch, a: number): number {
  if (a <= s.holdAt) return a;
  if (s.slowA > 0 && a <= s.holdAt + s.slowA) return s.holdAt + ((a - s.holdAt) * s.slowF) / s.slowA;
  return a + (s.slowF - s.slowA);
}

/** Film shot-local seconds → authored shot-local seconds. */
export function authoredLocal(s: Stretch, l: number): number {
  if (l <= s.holdAt) return l;
  if (l <= s.holdAt + s.slowF) return s.slowF > 0 ? s.holdAt + ((l - s.holdAt) * s.slowA) / s.slowF : s.holdAt;
  return l - (s.slowF - s.slowA);
}

/** Index of the shot playing at film time t. */
export function shotAt(clock: FilmClock, t: number): number {
  const shots = clock.shots;
  for (let i = shots.length - 1; i > 0; i--) if (t >= shots[i]!.start) return i;
  return 0;
}

/** Caption opacity 0…1 at film shot-local time l. */
export function captionAlpha(s: TimedShot, l: number): number {
  if (s.capInF === null || s.capOutF === null) return 0;
  const fadeIn = clamp01((l - s.capInF) / CAP_IN);
  const fadeOut = clamp01((l - s.capOutF) / CAP_OUT);
  return Math.min(fadeIn, 1 - fadeOut);
}

/** Seconds the caption has been fully visible at film shot-local time l. */
export function captionShown(s: TimedShot, l: number): number {
  if (s.capInF === null) return 0;
  return Math.max(0, l - (s.capInF + CAP_IN));
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Fraction of the way from a to b at t (clamped). */
export function span(t: number, a: number, b: number): number {
  return b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a));
}

export interface Cam {
  x: number;
  y: number;
  s: number;
  r: number;
}

/** Camera at authored shot-local time a (writes into `out`; no allocation). */
export function cameraAt(keys: readonly CamKey[], a: number, out: Cam): Cam {
  if (keys.length === 1) {
    const k = keys[0]!;
    out.x = k[1]; out.y = k[2]; out.s = k[3]; out.r = k[4] ?? 0;
    return out;
  }
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1]![0]) i++;
  const k0 = keys[i]!;
  const k1 = keys[i + 1]!;
  const p = EASE[k1[5] ?? 'linear'](span(a, k0[0], k1[0]));
  out.x = k0[1] + (k1[1] - k0[1]) * p;
  out.y = k0[2] + (k1[2] - k0[2]) * p;
  out.s = k0[3] + (k1[3] - k0[3]) * p;
  out.r = (k0[4] ?? 0) + ((k1[4] ?? 0) - (k0[4] ?? 0)) * p;
  return out;
}
