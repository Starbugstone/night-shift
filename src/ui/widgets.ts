// Button logic (hit testing, press / release, the tap flash). ButtonView in src/ui/views/button.ts
// draws it.
import type { Audio, PointerState } from '../contracts';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'amber';

/** Tap = press inside, release inside. Min 56 logical px tall. */
export class Button {
  enabled = true;
  visible = true;
  private armed = false;
  private flash = 0;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public label: string,
    public kind: ButtonKind = 'primary',
    public size = 26,
  ) {}

  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  get pressedDown(): boolean {
    return this.armed;
  }

  /** 0..1 white flash after a tap (decays in `update`). */
  get flashLevel(): number {
    return this.flash;
  }

  /** Returns true when tapped. */
  update(p: PointerState, dt: number, audio?: Audio, dy = 0): boolean {
    this.flash = Math.max(0, this.flash - dt * 4);
    if (!this.visible || !this.enabled) {
      this.armed = false;
      return false;
    }
    const inside = this.contains(p.x, p.y + dy);
    if (p.pressed && inside) this.armed = true;
    if (this.armed && p.down && !inside) this.armed = false;
    if (p.released) {
      const hit = this.armed && inside;
      this.armed = false;
      if (hit) {
        this.flash = 1;
        audio?.sfx('click');
        return true;
      }
    }
    return false;
  }

  cancel(): void {
    this.armed = false;
  }
}
