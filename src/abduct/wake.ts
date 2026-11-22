import { clamp } from './ragdoll';

export const BONK_SPEED = 105;
export const AWAKE_SECONDS = 3;
export const HARD_BONK_SPEED = 81;
export const HARD_DECAY = 1.75;

export class WakeMeter {
  value = 0;
  dignity = 100;
  bonks = 0;
  woke = false;
  awake = 0;
  private cooldown = 0;

  constructor(private readonly hush: boolean, private readonly hard = false) {}

  tick(dt: number, held = false): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.awake > 0) {
      this.awake = Math.max(held ? Number.EPSILON : 0, this.awake - dt);
      if (this.awake === 0) this.value = 50;
    } else {
      this.value = Math.max(0, this.value - (this.hard ? HARD_DECAY : 3.4) * dt);
    }
  }

  impact(speed: number, cat = false): boolean {
    const threshold = this.hard ? HARD_BONK_SPEED : BONK_SPEED;
    if (!cat && (speed <= threshold || this.cooldown > 0)) return false;

    const gain = (cat ? 46 : clamp((speed - threshold) * 0.16, 0, 43)) * (this.hard ? 1.3 : 1);
    this.cooldown = 0.20;
    this.bonks++;
    this.dignity = Math.max(0, this.dignity - gain * 0.68);
    this.noise(gain);
    return true;
  }

  noise(gain: number): void {
    if (this.awake === 0) {
      this.value = Math.min(100, this.value + gain * (this.hush ? 0.75 : 1));
      if (this.value === 100) {
        this.awake = AWAKE_SECONDS;
        this.woke = true;
      }
    }
  }

  calm(amount: number): void {
    this.value = Math.max(0, this.value - amount);
  }
}
