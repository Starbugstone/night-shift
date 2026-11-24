import { Container, Graphics } from 'pixi.js';
import { tr } from '../i18n';
import { HudButton } from '../ui/views/hud';
import type { TurnControl } from './turn';
import { INK, MINT } from './views/pieces';

export class TurnButtonsView {
  readonly root = new Container();
  private readonly left = new HudButton('turn_left');
  private readonly right = new HudButton('turn_right');
  private lastHeld = NaN;

  constructor() {
    this.root.addChild(this.left, this.right);
  }

  sync(turn: TurnControl, playable: boolean): void {
    this.root.visible = playable;
    if (!playable) return;
    const held = Math.sign(turn.primaryHold + turn.secondHold);
    if (held === this.lastHeld) return;
    this.lastHeld = held;
    const label = tr().abduct.turn;
    this.left.sync(turn.buttons.left, label, held < 0);
    this.right.sync(turn.buttons.right, label, held > 0);
  }
}

/** The arrow follows the specimen's tilt, or stays on top with reduced motion. */
export class TurnTell {
  readonly root = new Container();
  private readonly variants: Graphics[] = [];

  constructor(baseRadius: number) {
    const half = 0.95;
    for (let i = 0; i < 4; i++) {
      const r = baseRadius + 17 + (i >= 2 ? 5 : 0);
      const dir = i % 2 ? 1 : -1;
      const angle = dir * half;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tx = -sin * dir;
      const ty = cos * dir;
      const x = cos * r;
      const y = sin * r;
      const g = new Graphics()
        .arc(0, 0, r, -half, half).stroke({ color: INK, width: 7, cap: 'round' })
        .arc(0, 0, r, -half, half).stroke({ color: MINT, width: 3, cap: 'round' })
        .poly([x + tx * 10, y + ty * 10, x - tx * 3 + cos * 7.5, y - ty * 3 + sin * 7.5, x - tx * 3 - cos * 7.5, y - ty * 3 - sin * 7.5])
        .fill(MINT).stroke({ color: INK, width: 2, join: 'round' });
      this.variants.push(g);
      this.root.addChild(g);
    }
  }

  sync(x: number, y: number, dragging: boolean, turn: TurnControl, tilt: number, reduced: boolean): void {
    this.root.visible = turn.tell > 0.01 && turn.dir !== 0;
    if (!this.root.visible) return;
    const variant = (dragging ? 2 : 0) + (turn.dir > 0 ? 1 : 0);
    for (let i = 0; i < this.variants.length; i++) this.variants[i]!.visible = i === variant;
    this.root.position.set(x, y);
    this.root.rotation = (reduced ? 0 : tilt) - Math.PI / 2;
    this.root.alpha = Math.min(1, turn.tell * 1.4);
  }
}
