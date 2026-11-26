/**
 * Which snores are heard, and how loud. Sleepers snore on screen every ~2 s, and voicing each one made the
 * room drone (2026-11-26: "the snoring is even worse", "too frequent", then "too loud and too frequent").
 * The first snore and every twelfth after it play, about one recorded breath every 25 s, quietly; the rest
 * stay visual (the zZ puff). A snore that marks a hazard (the enchanter's spark charge) always plays.
 */
export const SNORE_AUDIO_EVERY = 12;

/** Snore volume handed to `audio.sfx`. Doyle snores louder: it's his joke. */
export const SNORE_VOLUME = { sleeper: 0.22, doyle: 0.32 } as const;

/** `count` is the room's snore count after this snore (the first snore is 1). */
export function snoreHeard(count: number, tell: boolean): boolean {
  return tell || (count - 1) % SNORE_AUDIO_EVERY === 0;
}
