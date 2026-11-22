import { clamp } from './ragdoll';

export const BONK_SPEED = 105;
export const AWAKE_SECONDS = 3;

export class WakeMeter {
  value = 0;
  dignity = 100;
  bonks = 0;
  woke = false;
  awake = 0;
  private cooldown = 0;

  constructor(private readonly hush: boolean) {}

  tick(dt: number, held = false): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.awake > 0) {
      this.awake = Math.max(held ? Number.EPSILON : 0, this.awake - dt);
      if (this.awake === 0) this.value = 50;
    } else {
      this.value = Math.max(0, this.value - 3.4 * dt);
    }
  }

  impact(speed: number, cat = false): boolean {
    if (!cat && (speed <= BONK_SPEED || this.cooldown > 0)) return false;

    const gain = cat ? 46 : clamp((speed - BONK_SPEED) * 0.16, 0, 43);
    this.cooldown = 0.20;
    this.bonks++;
    this.dignity = Math.max(0, this.dignity - gain * 0.68);
    if (this.awake === 0) {
      this.value = Math.min(100, this.value + gain * (this.hush ? 0.75 : 1));
      if (this.value === 100) {
        this.awake = AWAKE_SECONDS;
        this.woke = true;
      }
    }
    return true;
  }
}
