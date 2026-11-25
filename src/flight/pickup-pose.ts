// What a person on the map is doing at time `t`: blinking, glancing sideways, yawning or one of
// their own two beats. A pure function of the clock and a per-pickup seed (no state, no DOM, no
// Pixi), so it is testable and the trophy room shows the same person doing the same things.

export type FigureBeat = 'look' | 'yawn' | 'actA' | 'actB';

export interface FigurePose {
  /** The beat playing now, or null between beats. */
  beat: FigureBeat | null;
  /** Eyelids: 0 open, 1 shut. */
  lid: number;
  /** Glance: -1 left … 1 right, and -1 up … 1 down. */
  lookX: number;
  lookY: number;
  /** 0 … 1 envelopes of the yawn and of the figure's own two beats. */
  yawn: number;
  actA: number;
  actB: number;
  /** A damped shake (-1 … 1) at the start of the second beat: the toast popping, the dish settling. */
  wobble: number;
}

/** One beat starts in every slot, up to `BEAT_JITTER` s into it: beats come 2–4 s apart. */
export const BEAT_SLOT = 3;
export const BEAT_JITTER = 1;
/** Blinks come 1.4–3 s apart. */
export const BLINK_SLOT = 2.2;
const BLINK_JITTER = 0.8;
const BLINK_SEC = 0.17;
/** Reduced motion: one slow blink every `CALM_SLOT` s and nothing else. */
const CALM_SLOT = 5;
const CALM_BLINK_SEC = 0.6;

const BEAT_SEC: Record<FigureBeat, number> = { look: 1.5, yawn: 1.9, actA: 1.9, actB: 1.8 };
const DEFAULT_PATTERN: readonly FigureBeat[] = ['look', 'actA', 'look', 'yawn', 'actB'];

export function newFigurePose(): FigurePose {
  return { beat: null, lid: 0, lookX: 0, lookY: 0, yawn: 0, actA: 0, actB: 0, wobble: 0 };
}

/** A stable seed from a pickup id, so two people on screen never move in step. */
export function figureSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) % 9973;
}

/** 0 … 1 from two integers, the same on every machine. */
function hash01(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

function smooth(x: number): number {
  const k = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return k * k * (3 - 2 * k);
}

/** Up over the first `rise` of the beat, held, down over the last `fall`. */
function envelope(u: number, rise: number, fall: number): number {
  return Math.min(smooth(u / rise), smooth((1 - u) / fall));
}

/** When slot `k`'s beat starts, in seconds from the start of the slot. */
export function beatStart(k: number, seed: number): number {
  return hash01(k, seed) * BEAT_JITTER;
}

/**
 * Fill `out` with the pose at time `t` (seconds, any clock that only goes forward). `pattern` is
 * the order of the beats. With `reduced` there is no idle motion: only a slow blink.
 */
export function figurePose(t: number, seed: number, reduced: boolean, out: FigurePose, pattern: readonly FigureBeat[] = DEFAULT_PATTERN): FigurePose {
  out.beat = null;
  out.lid = out.lookX = out.lookY = out.yawn = out.actA = out.actB = out.wobble = 0;
  const clock = Math.max(0, t) + seed * 0.37;
  if (reduced) {
    const u = (clock % CALM_SLOT) / CALM_BLINK_SEC;
    if (u < 1) out.lid = Math.sin(u * Math.PI);
    return out;
  }
  const k = Math.floor(clock / BEAT_SLOT);
  const into = clock - k * BEAT_SLOT - beatStart(k, seed);
  const beat = pattern[(k + seed) % pattern.length]!;
  const u = into / BEAT_SEC[beat];
  if (u >= 0 && u < 1) {
    out.beat = beat;
    if (beat === 'look') {
      out.lookX = (hash01(k, seed + 11) < 0.5 ? -1 : 1) * envelope(u, 0.16, 0.2);
    } else if (beat === 'yawn') {
      out.yawn = envelope(u, 0.3, 0.3);
    } else if (beat === 'actA') {
      out.actA = envelope(u, 0.24, 0.24);
    } else {
      out.actB = envelope(u, 0.07, 0.42);
      out.wobble = Math.cos(u * 26) * Math.exp(-u * 7) * smooth(u * 14);
    }
  }
  // blinks keep their own rhythm; a yawn squeezes the eyes shut by itself
  const b = Math.floor(clock / BLINK_SLOT);
  const blink = (clock - b * BLINK_SLOT - hash01(b, seed + 5) * BLINK_JITTER) / BLINK_SEC;
  if (blink >= 0 && blink < 1) out.lid = Math.sin(blink * Math.PI);
  out.lid = Math.max(out.lid, smooth(out.yawn * 1.6));
  return out;
}
