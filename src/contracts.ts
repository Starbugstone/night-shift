// Shared contracts between the shell/flight code (src/core, src/flight, src/ui,
// src/levels) and the abduction code (src/abduct). Changes here must be
// additive and announced in your hand-off report.
import type { Container } from 'pixi.js';

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
  /** Device set on press or mouse hover. Abduction fixtures without a kind use relative drag. */
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
  | 'lullaby'
  /** A souvenir (slipper, mug) gets sucked into the beam. */
  | 'pickup'
  | 'checkpoint'
  | 'sunrise'
  | 'monolith_hum';

/** v4 voices: who is talking when a line of text appears (src/audio/voice.ts). */
export type VoiceId = 'zib' | 'vrell' | 'bureau';

export interface SpeakOptions {
  /** The babble must be over by then, seconds (the text's reveal time). */
  within?: number;
  /** Zib in a panic: higher and quicker. */
  panic?: boolean;
  volume?: number;
}

export interface Audio {
  sfx(name: SfxName, volume?: number): void;
  /** v4: alien babble for a line of text as it appears. Optional so test doubles can skip it. */
  speak?(text: string, voice: VoiceId, opts?: SpeakOptions): void;
  /** v4: stop a voice (or every voice) now, e.g. when the text is skipped or the scene ends. */
  hush?(voice?: VoiceId): void;
}

export type UpgradeId =
  | 'beam_dampener'
  | 'hush_drive'
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

/**
 * A screen of the game. The scene keeps the logic; `view` is its Pixi display tree, built lazily
 * on first access (headless tests only call `update`, so they never build it), and `render()`
 * syncs that tree to the scene state once per frame. See docs/PIXI-MIGRATION.md.
 */
export interface Scene {
  update(dt: number): void;
  readonly view: Container;
  render(): void;
  /** Called once when the scene is removed: destroy the view here. */
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
  | 'mayor_elevator'
  // ---- v3 (docs/GDD-3-new-shifts.md): each level's code owner adds its six ids under its own line
  // L5 Pier Pressure (pier code)
  | 'bubbles_roof' | 'bubbles_tunnel' | 'pete_gallery' | 'pete_slipway' | 'sal_loft' | 'sal_dock'
  // L6 Probe Compliance (clinic code)
  | 'hank_front' | 'hank_rear' | 'osei_helipad' | 'osei_pharmacy' | 'pemberton_window' | 'pemberton_chute'
  // L7 A Whole Cruise Ship (cruise code)
  | 'captain_mast'
  | 'captain_funnel'
  | 'marco_skylight'
  | 'marco_promenade'
  | 'greg_awning'
  | 'greg_cabin'
  // v4 L8
  | 'echo_appeal'
  ;

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
  /**
   * v3 report (docs/GDD-3-new-shifts.md "Report additions"): the specimen's pose at the wildest moment
   * of the attempt, for the Bureau ID photo. Joint positions in world px relative to the chest, in the
   * ragdoll's joint order; `human` is the specimen's art prefix ("dave", "bubbles"). Set by the report agent.
   */
  photo?: { human: string; x: readonly number[]; y: readonly number[] };
  /** v3 L6: Form 7-B readings taken on the way out (English source strings, shown through gt()). Set by clinic code. */
  probeReadings?: readonly string[];
}

/** Implemented by src/abduct/index.ts. */
export type CreateAbductScene = (
  ctx: GameContext,
  start: AbductStart,
  onDone: (result: AbductResult) => void,
) => Scene;

// ---------------------------------------------------------------- flight

// v4 map collectibles
export type MapCollectibleId = 'seti_dish';

export interface FlightResult {
  /** Which entry point the player locked onto. */
  roomId: RoomId;
  timeSec: number;
  /** Times spotted (flight restarted) before success. */
  spotted: number;
  /** Optional side pickup logged during this flight. */
  mapCollectible?: MapCollectibleId;
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
 * Test-only. `debug.autopilot()` returns a beam displacement in logical pixels for headless
 * simulations. `{dx:0, dy:0}` holds still. Pointer-driven tests use `debug.autopilotFinger()`
 * for the screen position to hold this frame.
 */
export interface AbductAutopilotIntent {
  dx: number;
  dy: number;
}
