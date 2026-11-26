import type { Audio } from '../contracts';
import { en } from '../i18n/en';
import type { Human } from './rooms/layout';

const [, , , , , shortbread, martians, scream] = en.invasion1953.mumbles;

export class WitnessReactions {
  private screamed = false;
  private nextTick = 0;
  private nextChimeArc = -1;

  constructor(private readonly human: Human, private readonly audio: Audio, private readonly bell: boolean) {}

  step(time: number, before: number, wake: number, moved: boolean): string | undefined {
    if (this.human === 'forester' && time >= this.nextTick) {
      this.audio.sfx('clock_tick');
      this.nextTick = time + 1.6 - 1.44 * (wake / 100);
    }
    if (this.bell) {
      const topOfArc = Math.floor((time * 1.45 + 0.6 - Math.PI / 2) / Math.PI);
      if (topOfArc > this.nextChimeArc) {
        this.nextChimeArc = topOfArc;
        this.audio.sfx('clapper');
      }
    }
    if (this.human === 'van_bell' && !this.screamed && moved && before < 55 && wake >= 55) {
      this.screamed = true;
      return scream;
    }
    return undefined;
  }

  bonkLine(bonk: number): string | undefined {
    if (this.human !== 'collier') return undefined;
    return bonk === 1 ? shortbread : bonk === 2 ? martians : undefined;
  }
}
