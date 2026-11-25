// How long a speech bubble stays up. Players reported Zib's lines and the sleepers' mumbles
// vanishing before they could read them: give each line time to be read at a relaxed pace.

/** Seconds a line of `text` stays on screen: ~15 characters a second plus a beat, within [min, max]. */
/** A line shown for less than this is still being read: flavour lines don't cut it short. */
export const FRESH_LINE_SECONDS = 2.4;

export function readSeconds(text: string, min = 2.4, max = 7): number {
  return Math.min(max, Math.max(min, 1 + text.length / 15));
}
