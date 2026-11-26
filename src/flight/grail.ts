import type { Audio, Vec2 } from '../contracts';
import { readSeconds } from '../core/read-time';
import { tr } from '../i18n';
import type { HazardField } from './hazards';
import type { StewardHazard } from './photographer';
import { pointInCircle } from './geometry';

export type GrailHazard =
  | { type: 'cow'; x: number; y: number; offset: number }
  | (Pick<StewardHazard, 'path' | 'speed' | 'dwell' | 'phase' | 'sweepAmp' | 'sweepRate'> & { type: 'squire' })
  | { type: 'rabbit'; x: number; y: number };

export const COW = { warning: 1.15, impact: 1.25, cycle: 7.6, radius: 108, body: 33 };
export const CLOP = { period: 2.6, warning: 0.45, pulse: 1.05, radius: 118 };
export const RABBIT = { radius: 118, speed: 110, arm: 0.75, lunge: 0.95, rest: 1.5 };
export const cycleTime = (t: number, period: number): number => ((t % period) + period) % period;

export function inRabbitRun(cx: number, cy: number, x: number, y: number): boolean {
  return y >= cy && pointInCircle(x, y, cx, cy, RABBIT.radius);
}

/** The commit belongs to the first instant after a full uninterrupted slow hover. */
export function rabbitStart(start: number, t: number, eligible: boolean): number {
  const age = t - start;
  if (Number.isFinite(start) && age < RABBIT.arm + RABBIT.lunge + RABBIT.rest) {
    if (age < RABBIT.arm && !eligible) return -Infinity;
    return start;
  }
  return eligible ? t : -Infinity;
}

// The cart driver uses the marked shortcut past the first drop. The planner samples the
// actual cow phase at its wait pocket before committing to this stretch.
export function pavilionTrack(): Vec2[] {
  const posts = [[900, 2150], [774, 2057], [265, 1930], [265, 1410],
    [505, 1290], [460, 1125], [315, 990]] as const;
  const points: Vec2[] = [{ x: posts[0][0], y: posts[0][1] }];
  for (let i = 1; i < posts.length; i++) {
    const [x, y] = posts[i - 1]!, [tx, ty] = posts[i]!;
    const steps = Math.ceil(Math.hypot(tx - x, ty - y) / 40);
    for (let step = 1; step <= steps; step++) points.push({ x: x + (tx - x) * step / steps, y: y + (ty - y) * step / steps });
  }
  return points;
}

/** Lives on the shift so taking a witness home preserves the sentry's place in the exchange. */
export class GrailSpeech {
  text = '';
  until = 0;
  x = 0;
  y = 0;
  private taunt = 0;
  private approach = false;
  private sawBunny = false;
  private ranAway = false;
  private reply = false;
  private niAt = 0;

  private speak(text: string, t: number, x: number, y: number): void {
    this.text = text;
    this.until = t + readSeconds(text);
    this.x = x;
    this.y = y;
  }

  update(t: number, x: number, y: number, exposed: boolean, committed: boolean, collected: boolean): void {
    const words = tr().grail;
    const near = Math.hypot(x - 900, y - 1510) < 650;
    if (committed && !this.ranAway) {
      this.ranAway = this.sawBunny = true;
      this.speak(words.rabbit[1]!, t, x, y - 120);
    } else if (this.until <= t) {
      if (!this.taunt && exposed || this.taunt > 0 && this.taunt < 3 && near && !this.approach) {
        this.speak(words.taunts[this.taunt++]!, t, x, y - 145);
        this.reply = this.taunt === 3;
        this.approach = true;
      } else if (this.reply) {
        this.speak(words.taunts[3]!, t, x, y - 115);
        this.reply = false;
      } else if (!this.sawBunny && Math.hypot(x - 1190, y - 970) < 230) {
        this.speak(words.rabbit[0]!, t, x, y - 115);
        this.sawBunny = true;
      } else if (!collected && t >= this.niAt && Math.hypot(x - 175, y - 1260) < 265) {
        this.speak(words.ni, t, 175, 1200);
        this.niAt = this.until + 2;
      }
    }
    if (!near) this.approach = false;
    if (collected && this.text === words.ni) this.until = 0;
  }

  sound(field: HazardField, previous: number, audio: Audio, x: number, y: number): void {
    for (let i = 0; i < field.defs.length; i++) {
      const d = field.defs[i]!;
      if (d.type === 'cow' && (previous === 0 && d.offset === 0 ||
        Math.floor((previous - d.offset) / COW.cycle) < Math.floor((field.t - d.offset) / COW.cycle))) {
        audio.sfx('creak', 0.45);
        audio.sfx('moo', 0.5);
      }
      if (d.type === 'squire' && Math.floor(previous / CLOP.period) < Math.floor(field.t / CLOP.period) &&
        Math.hypot(x - field.x[i]!, y - field.y[i]!) < 420) audio.sfx('clop', 0.52);
    }
  }
}
