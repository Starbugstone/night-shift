import type { Audio } from '../contracts';
import { en } from '../i18n/en';
import type { Human } from './rooms/layout';
import type { Hazard, InteriorRoute } from './rooms/interior';

const [, , , , , shortbread, martians, scream] = en.invasion1953.mumbles;

/** Clive's Geiger counter only ticks once he is half awake, quickening and growing louder as he wakes. */
export const GEIGER = { from: 55, slowest: 1.1, fastest: 0.3, quiet: 0.35, loud: 0.8 };
/** The bell clapper clicks at the top of each swing while the specimen is near enough to meet it. */
export const BELL = { earshot: 440, volume: 0.55 };

type Swing = Extract<Hazard, { kind: 'swing' }>;

/**
 * The belfry clapper's art key: the room draws it and the clapper click finds it by it (round 2, Opus F4: this used
 * to match the route's English exit label, a translation key, `exitName === 'Bell hatch'`).
 */
export const BELL_CLAPPER_ART = 'invasion_bell_clapper';

export class WitnessReactions {
  private screamed = false;
  private nextTick = 0;
  private nextChimeArc = -1;
  private readonly clapper: Swing | undefined;

  constructor(private readonly human: Human, private readonly audio: Audio, route?: InteriorRoute) {
    this.clapper = route?.building.hazards.find((h): h is Swing => h.kind === 'swing' && h.sprite.key === `room/${BELL_CLAPPER_ART}`);
  }

  step(time: number, before: number, wake: number, moved: boolean, x: number, y: number): string | undefined {
    if (this.human === 'forester') {
      if (wake < GEIGER.from) this.nextTick = time;
      else if (time >= this.nextTick) {
        const k = Math.min(1, (wake - GEIGER.from) / (100 - GEIGER.from));
        this.audio.sfx('clock_tick', GEIGER.quiet + (GEIGER.loud - GEIGER.quiet) * k);
        this.nextTick = time + GEIGER.slowest - (GEIGER.slowest - GEIGER.fastest) * k;
      }
    }
    const bell = this.clapper;
    if (bell) {
      // the click lands where the drawn swing tops out (src/abduct/interior.ts: angle = amplitude·sin(t·speed + phase))
      const topOfArc = Math.floor((time * bell.speed + bell.phase - Math.PI / 2) / Math.PI);
      if (topOfArc > this.nextChimeArc) {
        this.nextChimeArc = topOfArc;
        const near = Math.hypot(x - (bell.sprite.x + bell.sprite.w / 2), y - bell.sprite.y) < BELL.earshot;
        if (near) this.audio.sfx('clapper', BELL.volume);
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
