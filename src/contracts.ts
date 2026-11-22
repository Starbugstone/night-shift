// Shared contracts between the shell/flight code (src/core, src/flight, src/ui,
// src/levels) and the abduction code (src/abduct). Changes here must be
// additive and announced in your hand-off report.

/** Logical canvas size. Everything draws in these units; the shell scales. */
export const VIEW_W = 540;
export const VIEW_H = 960;

export interface Vec2 {
  x: number;
  y: number;
}

/** Pointer state in logical coordinates, updated once per frame by the shell. */
export interface PointerState {
  /** Finger / mouse currently down. */
  down: boolean;
  x: number;
  y: number;
  /** True only on the frame the pointer went down / up. */
  pressed: boolean;
  released: boolean;
}

/** Loaded art. `get` returns undefined until loaded or when the file is missing;
 * every draw call must have a primitive fallback so the game runs without art. */
export interface Assets {
  get(key: string): HTMLImageElement | undefined;
}

export type SfxName =
  | 'beam_on'
  | 'beam_off'
  | 'bonk'
  | 'snore'
  | 'mumble'
  | 'wake'
  | 'yowl'
  | 'bark'
  | 'spotted'
  | 'lock_on'
  | 'success'
  | 'fail'
  | 'click'
  | 'stamp'
  /** Soft rising 'uh-oh' tick while a meter climbs (added by shell). */
  | 'alert';

export interface Audio {
  sfx(name: SfxName, volume?: number): void;
}

export type UpgradeId = 'beam_dampener' | 'hush_drive';

export interface GameContext {
  pointer: PointerState;
  assets: Assets;
  audio: Audio;
  /** Upgrades the player owns (affects tuning). */
  upgrades: ReadonlySet<UpgradeId>;
  /** True on level 1 to show tutorial prompts. */
  tutorial: boolean;
  /** Seconds since the game started; for animation. */
  time: number;
  /** Respect prefers-reduced-motion: no screen shake, gentler effects. */
  reducedMotion: boolean;
}

export interface Scene {
  update(dt: number): void;
  render(g: CanvasRenderingContext2D): void;
  /** Called once when the scene is removed. */
  dispose?(): void;
}

// ---------------------------------------------------------------- abduction

/** Abduction room ids, implemented in src/abduct/rooms/. */
export type RoomId = 'farm_window' | 'farm_chimney' | 'laundry_skylight' | 'laundry_loading';

export interface AbductStart {
  levelId: string;
  roomId: RoomId;
}

export interface AbductResult {
  delivered: boolean;
  /** Human ever fully woke up during the attempt. */
  woke: boolean;
  timeSec: number;
  bonks: number;
  /** 0..100, starts 100, drops with each bonk scaled by impact. */
  dignity: number;
  snores: number;
  /** Funny item names that came along, e.g. ['slipper']. */
  itemsStolen: string[];
  /** Player tapped "give up" / restart. */
  aborted: boolean;
}

/** Implemented by src/abduct/index.ts. */
export type CreateAbductScene = (
  ctx: GameContext,
  start: AbductStart,
  onDone: (result: AbductResult) => void,
) => Scene;

// ---------------------------------------------------------------- flight

export interface FlightResult {
  /** Which entry point the player locked onto. */
  roomId: RoomId;
  timeSec: number;
  /** Times spotted (flight restarted) before success. */
  spotted: number;
}
