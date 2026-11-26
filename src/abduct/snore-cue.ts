/**
 * Which snores are heard. Sleepers snore on screen every ~2 s, and voicing each one made the room drone
 * (2026-11-26: "the snoring is even worse", then "too frequent"). The first snore and every fifth after it
 * play, about one recorded breath every 10 s; the rest stay visual (the zZ puff). A snore that marks a hazard (the enchanter's spark charge) always plays.
 */
export const SNORE_AUDIO_EVERY = 5;

/** `count` is the room's snore count after this snore (the first snore is 1). */
export function snoreHeard(count: number, tell: boolean): boolean {
  return tell || (count - 1) % SNORE_AUDIO_EVERY === 0;
}
