// The in-game HUD layout and the state types its pieces take. The pieces themselves are Pixi
// components in src/ui/views/hud.ts (HudPanel, HudMeter, HudTimer, HudButton, HudPrompt, HudFuse,
// HudSunClock).

export interface HudRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Standard HUD row: every phase puts its three pieces on this line. */
export const HUD_ROW = { y: 16, h: 62 } as const;

export type MeterIcon = 'eye' | 'sleep';

export interface MeterState {
  label: string;
  /** 0..1 */
  value: number;
  /** Fill turns amber at `warn`, red (and the panel jitters) at `danger`. */
  warn: number;
  danger: number;
  icon: MeterIcon;
  /** Seconds, for the pulse. */
  t: number;
  reduced: boolean;
  /** 0..1 white flash over the bar (decays in the caller). */
  flash: number;
  /** Fully tripped (awake / about to be spotted): whole panel goes red. */
  alarm: boolean;
}

/** `turn_left` / `turn_right`: anticlockwise / clockwise arc arrows (abduction rotate buttons). */
export type HudIcon = 'close' | 'restart' | 'turn_left' | 'turn_right';

export type PromptGlyph = 'drag' | 'release' | 'hold' | 'shake';

export interface FuseState {
  /** 0..1: 1 = SPOTTED. */
  value: number;
  /** A detector covers the saucer this frame. */
  exposed: boolean;
  t: number;
  reduced: boolean;
  /** Seconds the full fuse lasts (1.0, or 1.25 with Hush Drive), shown as a caption. */
  seconds: number;
}
