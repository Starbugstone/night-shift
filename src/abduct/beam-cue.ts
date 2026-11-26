/**
 * When the room's beam whoosh plays. Players grab and let go many times a second while they steer a
 * specimen, and a whoosh on every press and release turned into a drone (2026-11-26: "the repeated beam
 * noise is horrible"). The beam sounds once when it comes on after a rest, and fades out only after a
 * real hold; quick re-grabs in between stay silent.
 */
export const BEAM_CUE = {
  /** Seconds the beam must have been off before switching it on sounds again. */
  rest: 1.6,
  /** Seconds a sounded grab must last before letting go plays the fade-out. */
  hold: 0.8,
} as const;

export class BeamCue {
  private releasedAt = -Infinity;
  private grabbedAt = 0;
  private sounded = false;

  /** A new grab at `clock` seconds; true when it should play `beam_on`. */
  grab(clock: number): boolean {
    this.grabbedAt = clock;
    this.sounded = clock - this.releasedAt >= BEAM_CUE.rest;
    return this.sounded;
  }

  /** The grab ended at `clock` seconds; true when it should play `beam_off`. */
  release(clock: number): boolean {
    const play = this.sounded && clock - this.grabbedAt >= BEAM_CUE.hold;
    this.releasedAt = clock;
    this.sounded = false;
    return play;
  }
}
