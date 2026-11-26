import { Container, Graphics } from 'pixi.js';
import type { GrailReaction } from '../grail';
import { Joint, type Ragdoll } from '../ragdoll';

export class GrailReactionView {
  readonly root = new Container();
  private readonly prints = new Graphics();
  private readonly armour: Graphics[] = [];

  constructor(private readonly reaction: GrailReaction) {
    if (reaction.knight) {
      for (let i = 0; i < reaction.dropped.length; i++) {
        const plate = new Graphics();
        if (i < 4) plate.roundRect(-12, -9, 24, 22, 6).fill('#69707d').stroke({ color: '#302a3e', width: 3 })
          .moveTo(-8, -4).lineTo(7, -5).stroke({ color: '#bcc5c5', width: 2 });
        else plate.circle(0, 0, 4).fill('#b7a893').stroke({ color: '#39303d', width: 1.5 });
        this.armour.push(plate);
        this.root.addChild(plate);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const x = -20 - i * 18, y = i % 2 ? -5 : 3;
        this.prints.ellipse(x, y, 7, 3).ellipse(x + 11, y, 2.5, 3).fill('#ffc85e');
      }
      const retreatSide = new Graphics().roundRect(48, 470, 68, 30, 6).fill('#735841')
        .stroke({ color: '#302a3e', width: 3 }).poly([58, 485, 76, 474, 76, 481, 105, 481, 105, 489, 76, 489, 76, 496])
        .fill('#d5bb8a');
      this.root.addChild(retreatSide, this.prints);
    }
  }

  sync(body: Ragdoll, t: number, rm: boolean, done: boolean): void {
    this.root.visible = !done;
    if (done) return;
    const r = this.reaction;
    this.prints.visible = r.retreat > 0.4;
    this.prints.position.set(body.x[Joint.NearFoot]!, body.y[Joint.NearFoot]! + 10);
    for (let i = 0; i < this.armour.length; i++) {
      const piece = this.armour[i]!, age = t - r.dropped[i]!;
      if (!Number.isFinite(age)) {
        piece.visible = i < r.plates.length;
        if (piece.visible) piece.position.set(r.position(body.x, i), r.position(body.y, i));
      } else {
        piece.visible = age < 1.25;
        piece.alpha = Math.min(1, Math.max(0, (1.25 - age) * 3));
        const sign = i % 2 ? -1 : 1;
        piece.position.set(r.x[i]! + sign * (rm ? 18 : age * 60), r.y[i]! + (rm ? 12 : age * (120 * age - 55)));
        piece.rotation = rm ? 0 : sign * age * 4;
      }
    }
  }
}

/** The hand-held prop only reflects the charge on the stationary candle stand. */
export class EnchanterStaffView {
  readonly root = new Container();
  private readonly glint = new Graphics().poly([0, -11, 3, -3, 10, 0, 3, 3, 0, 11, -3, 3, -10, 0, -3, -3]).fill('#ffe3a5');

  constructor() {
    const staff = new Graphics().moveTo(0, 39).lineTo(0, -42).lineTo(8, -48).lineTo(3, -55)
      .stroke({ color: '#66463f', width: 7 }).circle(3, -54, 6).fill('#e7ad68');
    this.glint.position.set(3, -54);
    this.root.addChild(staff, this.glint);
  }

  sync(body: Ragdoll, charging: boolean, done: boolean): void {
    this.root.visible = !done;
    this.root.position.set(body.x[Joint.NearHand]!, body.y[Joint.NearHand]!);
    this.root.rotation = Math.atan2(body.y[Joint.NearElbow]! - this.root.y, body.x[Joint.NearElbow]! - this.root.x) + Math.PI / 2;
    this.glint.visible = charging;
  }
}
