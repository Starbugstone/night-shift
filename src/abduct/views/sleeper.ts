import { Container, Graphics } from 'pixi.js';
import { VIEW_H, VIEW_W, type Assets } from '../../contracts';
import { GLOW, Glow, glowTexture } from '../../core/gfx/glow';
import { easeOutBack } from '../../core/fx';
import { Label } from '../../core/gfx/text';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import type { SleeperState } from '../interior';
import { clamp } from '../ragdoll';
import { roomArt } from './building';
import { AMBER, Arc, INK, RED, TAU, burst, circleInView, dashedRing } from './pieces';

const DREAM = '#c4a2eb';
const CUE = { size: 26, weight: 900, color: '#ffffff' };

export class SleeperView {
  readonly root = new Container();
  hop = 0;
  private age = 0;
  private heard = 0;
  private readonly aura = new Glow(glowTexture('196,162,235'), true);
  private readonly red = glowTexture(GLOW.red);
  private readonly purple = glowTexture('196,162,235');
  private readonly radius: ReturnType<typeof dashedRing>;
  private readonly asleep: Container;
  private readonly awake: Container;
  private readonly headFx = new Container();
  private readonly bang = new Container();
  private readonly shout = new Container();
  private readonly shouts: string | undefined;
  private readonly dozing = new Container();
  private readonly track = new Graphics().arc(0, 0, 20, Math.PI, TAU).stroke({ color: INK, width: 8, cap: 'round' });
  private readonly gauge = new Arc(20, 4.5, Math.PI, Math.PI);
  private readonly question = new Label(CUE);
  private readonly snore: Container;

  constructor(private readonly s: SleeperState, assets: Assets, private readonly index: number) {
    const { x, y, spec } = s;
    this.radius = dashedRing(spec.radius, 3.75, 9, 8);
    this.radius.position.set(x, y);
    this.asleep = this.pose(assets, spec.asleep);
    this.awake = this.pose(assets, spec.awake);
    const headX = x + spec.asleep.w / 3;
    const headY = spec.asleep.y - 21;
    this.dozing.position.set(headX, headY);
    this.track.y = this.gauge.root.y = 4;
    const art = artSprite(assets, 'ui/zzz', 30, 30);
    this.snore = art ?? new Label({ size: 19, weight: 900, color: '#dcc9ff' }, 'Z z z');
    this.dozing.addChild(this.track, this.gauge.root, this.question, this.snore);
    this.bang.position.set(headX, spec.awake.y - 16);
    this.bang.addChild(burst(26, 17, RED, 3.5), new Label({ size: 30, weight: 900, color: '#ffffff' }).set('!', 0, 1, 30));
    this.shouts = (tr().abduct.sleeperShouts as Record<string, string>)[spec.name];
    if (this.shouts) this.shout.addChild(
      new Graphics().roundRect(-124, -22, 248, 44, 20).fill('#ffffff').stroke({ color: INK, width: 4 }),
      new Label({ size: 19, weight: 900, color: '#d33a52' }).set(this.shouts, 0, 1, 228),
    );
    this.headFx.addChild(this.dozing, this.bang, this.shout);
    this.root.addChild(this.aura, this.radius, this.asleep, this.awake, this.headFx);
  }

  private pose(assets: Assets, s: SleeperState['spec']['awake']): Container {
    const root = new Container();
    root.position.set(s.x + s.w / 2, s.y + s.h);
    root.addChild(roomArt(assets, s.key, -s.w / 2, -s.h, s.w, s.h));
    return root;
  }

  sync(t: number, dt: number, rm: boolean, cx: number, cy: number): void {
    const { x, y, spec, wake, pulse } = this.s;
    const awake = wake >= 100;
    if (pulse > this.heard + 0.15) this.hop = 1;
    this.heard = pulse;
    this.hop = Math.max(0, this.hop - dt * 3.2);
    this.age = awake ? this.age + (dt > 0 ? dt : 1 / 60) : 0;
    this.root.visible = circleInView(x, y, spec.radius, cx, cy, VIEW_W, VIEW_H);
    if (!this.root.visible) return;
    const tone = wake >= 70 ? RED : wake >= 45 ? AMBER : DREAM;
    this.aura.texture = wake >= 70 ? this.red : this.purple;
    this.aura.place(x, y, spec.radius, spec.radius, 0.05 + pulse * 0.16);
    this.radius.tint = tone;
    this.radius.alpha = 0.4 + pulse * 0.6;
    this.radius.rotation = rm ? 0 : t * 12 / spec.radius;
    this.asleep.visible = !awake;
    this.awake.visible = awake;
    if (awake) {
      const k = rm ? 1 : easeOutBack(this.age / 0.22, 3);
      this.awake.scale.set(1.25 - 0.25 * k, 0.6 + 0.4 * k);
    } else if (!rm) {
      const breath = Math.sin(t * 1.9 + this.index) * 0.5 + 0.5;
      this.asleep.rotation = wake >= 70 ? Math.sin(t * 26) * 0.02 : 0;
      this.asleep.scale.set(1 + this.hop * 0.04, 1 + breath * 0.025 + this.hop * 0.07);
    } else {
      this.asleep.rotation = 0;
      this.asleep.scale.set(1);
    }
    this.headFx.visible = circleInView(x, y, 140, cx, cy, VIEW_W, VIEW_H);
    if (!this.headFx.visible) return;
    this.dozing.visible = !awake;
    this.bang.visible = awake;
    this.shout.visible = awake && !!this.shouts && this.age > 0.12;
    if (awake) {
      this.bang.scale.set(rm ? 1 : easeOutBack(this.age / 0.2, 2.6));
      if (this.shout.visible) {
        this.shout.position.set(clamp(x, cx + 140, cx + VIEW_W - 140), spec.awake.y - 64);
        this.shout.scale.set(rm ? 1 : easeOutBack((this.age - 0.12) / 0.2));
      }
      return;
    }
    const fill = clamp(wake / 100, 0, 1);
    this.track.visible = fill > 0.02;
    this.gauge.sync(this.track.visible ? fill : 0, tone);
    this.question.visible = this.hop > 0.25;
    this.snore.visible = !this.question.visible;
    if (this.question.visible) {
      this.question.set(wake >= 70 ? '?!' : '?', 0, -26 - (1 - this.hop) * 10, 60);
      this.question.tint = tone;
      this.question.alpha = Math.min(1, this.hop * 2);
    } else {
      const k = 1 - fill * 0.45;
      const lift = rm ? 0 : Math.sin(t * 2.5) * 3;
      const jitter = wake >= 70 && !rm ? Math.sin(t * 30) * 2 : 0;
      this.snore.scale.set(k);
      this.snore.position.set(jitter, -22 - 15 * k + lift);
    }
  }
}
