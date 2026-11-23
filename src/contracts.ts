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
  // ---- v2.1 (abduction precision + rotation). All optional: scenes that ignore them keep working.
  /** Device behind the primary pointer (set on press, and by mouse hover). Missing = treat as touch. */
  kind?: PointerKind;
  /** A second finger while the primary is down (touch). Same once-per-frame semantics. */
  second?: SecondPointer;
  /** Mouse wheel this frame, logical px (+ = scroll down). */
  wheel?: number;
  /** Right-button drag this frame, logical px of horizontal travel (mouse only). */
  rightDx?: number;
  /** Rotate keys held: -1 = Q / A (anticlockwise), +1 = E / D (clockwise), 0 = none or both. */
  turnKeys?: number;
}

export type PointerKind = 'mouse' | 'touch' | 'pen';

export interface SecondPointer {
  down: boolean;
  x: number;
  y: number;
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
  | 'alert'
  // ---- v2 (deep levels). Shell implements; anyone may play them.
  | 'laser'
  | 'alarm'
  | 'crash'
  | 'creak'
  | 'scream'
  | 'siren'
  | 'dash'
  | 'lullaby'
  /** A souvenir (slipper, mug) gets sucked into the beam. */
  | 'pickup'
  | 'checkpoint'
  | 'sunrise';

export interface Audio {
  sfx(name: SfxName, volume?: number): void;
}

export type UpgradeId =
  | 'beam_dampener'
  | 'hush_drive'
  /** v2, flight: flick to dash (owned by flight code). */
  | 'afterburner'
  /** v2, abduction: double-tap once per building to calm every wake meter (owned by abduct code). */
  | 'snooze_ray';

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

/**
 * Abduction route ids, implemented in src/abduct/rooms/. A route = one building interior
 * + the exit you must reach (= the entry ring the saucer locked onto).
 * Tutorial routes are single rooms; v2 routes are multi-room scrolling interiors.
 */
export type RoomId =
  // L1, L2 (tutorials)
  | 'farm_window'
  | 'farm_chimney'
  | 'laundry_skylight'
  | 'laundry_loading'
  // L3 Cul-de-Sac Sweep
  | 'dave_roof'
  | 'dave_patio'
  | 'barb_chimney'
  | 'barb_backdoor'
  | 'gary_skylight'
  | 'gary_garagedoor'
  // L4 Downtown Graveyard Shift
  | 'nigel_skylight'
  | 'nigel_loading'
  | 'kev_vent'
  | 'kev_fireescape'
  | 'mayor_clocktower'
  | 'mayor_elevator';

/** How punishing an abduction is. Tutorials: all false. Deep levels: all true. */
export interface AbductRules {
  /** Specimen fully waking fails the attempt (else: only costs the star, old behaviour). */
  wakeFails: boolean;
  /** Tighter bonk threshold / faster wake fill / slower decay. */
  hard: boolean;
}

export interface AbductStart {
  levelId: string;
  roomId: RoomId;
  /** Optional for back-compat; missing = tutorial rules. */
  rules?: AbductRules;
}

export type AbductFailReason =
  /** Specimen woke (only when rules.wakeFails). */
  | 'woke'
  /** A second sleeper (spouse, dog, bouncer...) woke. */
  | 'sleeper'
  /** Laser tripwire or security camera. */
  | 'alarm';

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
  /** Set when the attempt failed for a reason other than aborting (delivered is false). */
  failReason?: AbductFailReason;
  /** Short display name of what caused the failure, e.g. "Brenda", "Gary's laser". */
  failBy?: string;
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

// ---------------------------------------------------------------- v2 autopilots (tests + e2e bot)

/**
 * Test-only. Flight scenes expose `debug.autopilot()`: the finger a competent player would
 * hold this frame, in logical screen coords (steering = finger offset from the saucer).
 */
export interface FlightAutopilotIntent {
  down: boolean;
  x: number;
  y: number;
}

/**
 * Test-only. Abduction scenes expose `debug.autopilot()`: the beam drag a competent player
 * would make this frame, as a finger delta in logical px (the beam follows relative drag).
 * `{dx:0, dy:0}` = hold still (e.g. waiting for a laser to switch off).
 */
export interface AbductAutopilotIntent {
  dx: number;
  dy: number;
}
