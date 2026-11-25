// v4 easter eggs: film cameos parked on the flight maps (docs/research/film-references.md, "Easter
// eggs for existing levels"). An egg is an ordinary map prop of an egg kind: the map files place it,
// this table says what Zib says about it and where its decorations sit. Eggs are scenery: nothing in
// the flight sims reads them (no detector, no collider, no route change), and Zib's line about one
// plays once per run, only when no hazard line is up. Pure data and logic, DOM-free.
import { VIEW_H, VIEW_W } from '../contracts';
import type { PropDef, PropKind } from '../levels/types';
import { tr } from '../i18n';
import { propSize } from './props';

export type EggKind = Extract<PropKind, 'timecar' | 'iceberg'>;

export interface EggSpec {
  /** Zib's lines, in `tr().easterEggs.zib`. */
  line: 'timeCar' | 'iceberg';
  /** `over`: the saucer flies within `r` of the prop's centre. `view`: the whole prop is in the play area (below the HUD, above Zib's bubble). */
  trigger: 'over' | 'view';
  r: number;
  /** Soft instrument glow, in the sprite's own px from its top-left (it turns with the prop). */
  glow?: { x: number; y: number; r: number };
  /** Two scorched tyre streaks trailing behind the prop (its local -x side): length in px. */
  streaks?: number;
}

export const EGGS: Readonly<Record<EggKind, EggSpec>> = {
  // L2: a stainless gull-wing time car in Spin City's back lot (Back to the Future)
  timecar: { line: 'timeCar', trigger: 'over', r: 100, glow: { x: 74, y: 40, r: 26 }, streaks: 190 },
  // L7: a small iceberg off the SS Buffet Royale's port bow (Titanic)
  iceberg: { line: 'iceberg', trigger: 'view', r: 0 },
};

/** The play area a `view` egg must sit in, screen px: clear of the HUD rows and Zib's bubble. */
const VIEW_INSET = { side: 20, top: 220, bottom: 200 } as const;

export function eggOf(p: PropDef): EggSpec | null {
  return (EGGS as Readonly<Record<string, EggSpec>>)[p.kind] ?? null;
}

/** Eggs already mentioned, per run: a deep run spans several flight scenes, a tutorial run is one scene. */
const heard = new WeakMap<object, Set<PropDef>>();
/** How long a fly-over egg waits for Zib to be free (check() runs once a frame: ~5 s). */
const PENDING_CALLS = 300;

/** Zib's once-per-run line about the map's eggs. */
export class EggCues {
  private readonly eggs: { p: PropDef; spec: EggSpec }[];
  private readonly said: Set<PropDef>;

  constructor(props: readonly PropDef[], run: object) {
    this.eggs = props.flatMap((p) => {
      const spec = eggOf(p);
      return spec ? [{ p, spec }] : [];
    });
    let said = heard.get(run);
    if (!said) heard.set(run, (said = new Set()));
    this.said = said;
  }

  /** A fly-over egg met while Zib was busy: said as soon as Zib is free, if that is soon. */
  private pending: { p: PropDef; spec: EggSpec; sx: number; sy: number; calls: number } | null = null;

  /**
   * The line to say now, or null. `canTalk` is false while a hazard line, another Zib line or the
   * fuse has the floor: an egg met then is remembered for ~5 s (300 calls) and said once Zib is
   * free, so longer, readable Zib lines don't swallow the joke.
   */
  check(sx: number, sy: number, camX: number, camY: number, canTalk: boolean): string | null {
    if (this.pending && ++this.pending.calls > PENDING_CALLS) this.pending = null;
    for (const { p, spec } of this.eggs) {
      if (this.said.has(p)) continue;
      let near: boolean;
      if (spec.trigger === 'over') near = Math.hypot(sx - p.x, sy - p.y) < spec.r;
      else {
        const { w, h } = propSize(p);
        near = p.x - w / 2 > camX + VIEW_INSET.side && p.x + w / 2 < camX + VIEW_W - VIEW_INSET.side &&
          p.y - h / 2 > camY + VIEW_INSET.top && p.y + h / 2 < camY + VIEW_H - VIEW_INSET.bottom;
      }
      if (!near) continue;
      if (!canTalk) {
        if (spec.trigger === 'over' && this.pending?.p !== p) this.pending = { p, spec, sx, sy, calls: 0 };
        continue;
      }
      return this.say(p, spec, sx, sy);
    }
    if (canTalk && this.pending && !this.said.has(this.pending.p)) {
      const { p, spec, sx: px, sy: py } = this.pending;
      return this.say(p, spec, px, py);
    }
    return null;
  }

  private say(p: PropDef, spec: EggSpec, sx: number, sy: number): string {
    this.said.add(p);
    if (this.pending?.p === p) this.pending = null;
    const lines = tr().easterEggs.zib[spec.line];
    // which line: from where the saucer met it, so replays vary
    return lines[Math.abs(Math.floor(sx + sy)) % lines.length]!;
  }
}
