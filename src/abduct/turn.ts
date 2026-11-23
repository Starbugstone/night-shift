import type { PointerState } from '../contracts';
import { HUD_ROW, type HudRect } from '../ui/hud';
import { clamp, wrapPi } from './ragdoll';

/** Held keys or a held button turn at this rate (rad/s). */
export const TURN_RATE = 2.6;
/** A tap on a rotate button nudges this far (rad) before the hold rate takes over. */
export const TURN_TAP = 0.18;
/** Mouse wheel: radians per logical px of scroll (a 100 px notch ≈ 20°). */
export const WHEEL_TURN = 0.004;
/** Right-button drag: radians per logical px of horizontal travel. */
export const RIGHT_DRAG_TURN = 0.012;

export interface TurnButtons {
  left: HudRect;
  right: HudRect;
}

/** HUD-kit buttons, HUD_ROW height. Tutorial rooms: the HUD's second row, under the shared HUD row. */
const ROW2_Y = HUD_ROW.y + HUD_ROW.h + 8;
/** Tutorial rooms: top left, clear of the ceiling emitter and the roof exits (all right of x 264). */
export const TURN_BUTTONS_ROOM: TurnButtons = {
  left: { x: 14, y: ROW2_Y, w: 62, h: HUD_ROW.h },
  right: { x: 84, y: ROW2_Y, w: 62, h: HUD_ROW.h },
};
/**
 * Deep interiors: the second HUD row is full (sleeper meters, sunrise clock, camera meter), so the
 * buttons take the bottom corners, either side of the room / exit bar: right where a second thumb rests.
 */
const BOTTOM_Y = 943 - HUD_ROW.h;
export const TURN_BUTTONS_DEEP: TurnButtons = {
  left: { x: 14, y: BOTTOM_Y, w: 62, h: HUD_ROW.h },
  right: { x: 464, y: BOTTOM_Y, w: 62, h: HUD_ROW.h },
};

function inside(r: HudRect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** -1 = anticlockwise button, +1 = clockwise button, 0 = neither. */
export function turnButtonAt(buttons: TurnButtons, x: number, y: number): number {
  return inside(buttons.left, x, y) ? -1 : inside(buttons.right, x, y) ? 1 : 0;
}

/**
 * Reads every rotation input once per frame and returns the radians to turn the specimen by
 * (+ = clockwise): the rotate buttons (primary or second finger), a two-finger twist, the wheel,
 * a right-button drag and the Q/E (A/D) keys. DOM-free.
 */
export class TurnControl {
  /** Button held by the primary pointer / the second finger: -1, 0 or +1. */
  primaryHold = 0;
  secondHold = 0;
  /** Two fingers down and neither on a button: the twist turns the body, the midpoint drags. */
  twisting = false;
  /** Direction of the latest turn and a 0..1 tell that fades once turning stops. */
  dir = 0;
  tell = 0;
  /** The player has turned at least once this attempt. */
  used = false;
  private twistAngle = 0;

  constructor(readonly buttons: TurnButtons) {}

  /** A primary press: true if it landed on a rotate button (then it is not a beam drag). */
  pressPrimary(x: number, y: number): boolean {
    this.primaryHold = turnButtonAt(this.buttons, x, y);
    return this.primaryHold !== 0;
  }

  update(p: PointerState, dt: number): number {
    let turn = 0;
    if (this.primaryHold !== 0) {
      if (p.pressed) turn += this.primaryHold * TURN_TAP;
      if (!p.down || p.released) this.primaryHold = 0;
    }
    const two = p.second;
    if (two) {
      if (two.pressed) {
        const button = turnButtonAt(this.buttons, two.x, two.y);
        if (button !== 0) {
          this.secondHold = button;
          turn += button * TURN_TAP;
        } else if (p.down && this.primaryHold === 0) {
          this.twisting = true;
          this.twistAngle = Math.atan2(two.y - p.y, two.x - p.x);
        }
      }
      if (this.twisting) {
        if (!two.down || !p.down || p.released) {
          this.twisting = false;
        } else {
          const angle = Math.atan2(two.y - p.y, two.x - p.x);
          turn += wrapPi(angle - this.twistAngle);
          this.twistAngle = angle;
        }
      }
      if (this.secondHold !== 0 && (!two.down || two.released)) this.secondHold = 0;
    } else {
      this.twisting = false;
    }
    const held = clamp(this.primaryHold + this.secondHold + (p.turnKeys ?? 0), -1, 1);
    turn += held * TURN_RATE * dt;
    turn += (p.wheel ?? 0) * WHEEL_TURN + (p.rightDx ?? 0) * RIGHT_DRAG_TURN;

    if (turn !== 0) {
      this.dir = Math.sign(turn);
      this.tell = 1;
      this.used = true;
    } else {
      this.tell = Math.max(0, this.tell - dt * 2.5);
    }
    return turn;
  }

  /** Forget held buttons and twists (scene end, failure, delivery). */
  reset(): void {
    this.primaryHold = 0;
    this.secondHold = 0;
    this.twisting = false;
  }
}
