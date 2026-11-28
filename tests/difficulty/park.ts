// A human-model hand that parks for good (docs/REGRESSIONS.md L21, round 6). The casual hand on L3 sat at
// (1328, 716), west of Barb's block, from about 52 s until sunrise: the autopilot held, and a 0.1 s "go" every 10 s
// reset its wait clock, so its re-plan never came. A player who sees no opening moves, retries or picks another ring.
// ParkWatch measures the longest stretch a flight leg keeps the saucer within PARK_R of one spot while flying (the
// shift clock runs); deepShift records it per run and the evaluator fails any run over PARK_LIMIT_SEC.
import type { Vec2 } from '../../src/contracts';

/** Within this of one spot counts as parked (half a ring; a hold point is one 40 px cell). */
export const PARK_R = 30;
/**
 * The longest park a run may show. The autopilot re-plans after 20 s without progress (REPLAN_AFTER in
 * src/flight/autopilot.ts), so a healthy wait ends by then. Calibration at 20 seeds, every level, both profiles,
 * before the round 6 autopilot fix: healthy parks at most 20.05 s (L11 casual seed 16), the next 15.8 s; the stalls
 * 65–373 s (L3 casual 10, 13, 14; L8 casual 6, 20; L9 casual 14). After the fix the longest is 19.9 s.
 */
export const PARK_LIMIT_SEC = 30;

export interface Park { seconds: number; x: number; y: number; leg: number }

export class ParkWatch {
  longest: Park = { seconds: 0, x: 0, y: 0, leg: 0 };
  private at: Vec2 = { x: NaN, y: NaN };
  private since = 0;
  private leg = 0;

  /** Call every frame with the saucer and whether it is flying; `t` is the shift clock. A new leg starts afresh (it leaves from the ring the room was entered by). */
  step(s: Vec2, flying: boolean, t: number, leg: number): void {
    if (!flying || leg !== this.leg || !(Math.hypot(s.x - this.at.x, s.y - this.at.y) <= PARK_R)) {
      this.at = { x: s.x, y: s.y };
      this.since = t;
      this.leg = leg;
      return;
    }
    const seconds = t - this.since;
    if (seconds > this.longest.seconds) this.longest = { seconds, x: Math.round(this.at.x), y: Math.round(this.at.y), leg };
  }
}
