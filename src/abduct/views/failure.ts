import { Container, Graphics, type Sprite } from 'pixi.js';
import { type Assets, VIEW_H, VIEW_W } from '../../contracts';
import { ScreenTint } from '../../core/gfx/glow';
import { Label, measure, wrapLines } from '../../core/gfx/text';
import { gt, tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import { HudPanel } from '../../ui/views/hud';
import type { AbductSimulation } from '../simulation';
import { AMBER, INK, LIGHT, RED, disc, ring } from './pieces';

export const ALERT_RGB = '255,105,125';
const CAPTION = { size: 16, weight: 650, color: '#bdb3d9' };
const SMALL = { ...CAPTION, size: 14 };

export class FailureView {
  readonly root = new Container();
  private readonly edge = ScreenTint.edge(ALERT_RGB);
  private readonly beacon = new Graphics();
  private readonly card = new Container();
  private readonly portrait = new Container();
  private readonly camera = new Container();
  private readonly cameraLight = disc(4, '#ffffff');
  private readonly klaxon = new Graphics();
  private readonly exclaim = new Label({ size: 50, weight: 900, color: RED }, '!');
  private readonly specimen: Sprite | null;
  private readonly sleepers = new Map<string, Sprite>();
  private readonly heading = new Label({ size: 15, weight: 900, color: '#ffd9de' });
  private readonly who = new Label({ size: 30, weight: 900, color: LIGHT });
  private readonly caption = new Label(CAPTION);
  private readonly bottomLine = new Label(SMALL);
  private last: AbductSimulation['failure'];

  constructor(sim: AbductSimulation, assets?: Assets) {
    for (let i = 0; i < 2; i++) {
      this.beacon.moveTo(0, 0).arc(0, 0, 1100, i * Math.PI - 0.32, i * Math.PI + 0.32).closePath().fill(RED);
    }
    this.beacon.position.set(VIEW_W / 2, VIEW_H * 0.42);
    this.beacon.blendMode = 'add';
    this.beacon.alpha = 0.13;
    const panel = new HudPanel().set(488, 146, RED);
    panel.position.set(-244, -73);
    const band = new Graphics()
      .moveTo(-240, -35).lineTo(-240, -54).quadraticCurveTo(-240, -69, -225, -69)
      .lineTo(225, -69).quadraticCurveTo(240, -69, 240, -54).lineTo(240, -35).closePath()
      .fill({ color: RED, alpha: 0.2 });
    this.card.position.set(270, 693);
    const badge = new Container();
    badge.position.set(-190, 18);
    const mask = disc(40);
    this.portrait.mask = mask;
    badge.addChild(disc(40, '#16102e'), ring(40, 3, RED), mask, this.portrait);
    this.camera.addChild(new Graphics()
      .roundRect(-24, -14, 44, 26, 6).fill('#c9cbd8').stroke({ color: INK, width: 3 })
      .roundRect(18, -9, 12, 16, 3).fill('#2a2438').stroke({ color: INK, width: 3 }), this.cameraLight);
    this.cameraLight.position.set(-12, -6);
    this.klaxon.arc(0, 8, 20, Math.PI, 0).closePath().fill(RED).stroke({ color: INK, width: 3 })
      .rect(-26, 8, 52, 8).fill('#6b63a3').stroke({ color: INK, width: 3 });
    for (let i = -1; i <= 1; i++) {
      const a = -Math.PI / 2 + i * 0.7;
      this.klaxon.moveTo(Math.cos(a) * 26, 8 + Math.sin(a) * 26).lineTo(Math.cos(a) * 34, 8 + Math.sin(a) * 34);
    }
    this.klaxon.stroke({ color: AMBER, width: 3, cap: 'round' });
    this.exclaim.y = 2;
    this.portrait.addChild(this.camera, this.klaxon, this.exclaim);
    this.specimen = assets ? artSprite(assets, 'human/' + sim.room.human + '_head_awake', 70, 80) : null;
    if (this.specimen) {
      this.specimen.y = -2;
      this.portrait.addChild(this.specimen);
    }
    if (sim.interior && assets) {
      for (const { spec } of sim.interior.sleepers) {
        const { w, h, key } = spec.awake;
        const k = 84 / Math.max(w, h);
        const sprite = artSprite(assets, key, w * k, h * k);
        if (sprite) {
          this.sleepers.set(spec.name, sprite);
          this.portrait.addChild(sprite);
        }
      }
    }
    this.card.addChild(panel, band, badge, this.heading, this.who, this.caption, this.bottomLine);
    this.root.addChild(this.edge, this.beacon, this.card);
  }

  sync(sim: AbductSimulation, rm: boolean): void {
    const { failure, failureTime: age } = sim;
    this.root.visible = !!failure;
    if (!failure) return;
    const alarm = failure.reason === 'alarm';
    this.edge.strength = rm ? 0.38 : 0.35 + Math.max(0, 0.28 - age * 1.8);
    this.beacon.visible = alarm && !rm;
    this.beacon.rotation = age * 9;
    this.card.scale.set(rm ? 1 : 1 + 0.4 * Math.max(0, 1 - age / 0.13));
    this.card.rotation = rm ? 0 : -0.072 * Math.max(0, 1 - age / 0.3);
    this.card.alpha = rm ? 1 : Math.min(1, age / 0.05);
    this.cameraLight.tint = rm || Math.floor(age * 10) % 2 === 0 ? '#ff3355' : '#6a2030';
    if (this.specimen?.visible) this.specimen.x = rm ? 0 : Math.sin(age * 40) * 2;
    if (failure === this.last) return;
    this.last = failure;
    const ab = tr().abduct;
    this.camera.visible = alarm && failure.by.toLowerCase().includes('camera');
    this.klaxon.visible = alarm && !this.camera.visible;
    const sleeper = failure.reason === 'sleeper' ? this.sleepers.get(failure.by) : undefined;
    for (const sprite of this.sleepers.values()) sprite.visible = sprite === sleeper;
    const woke = failure.reason === 'woke' && !!this.specimen;
    if (this.specimen) this.specimen.visible = woke;
    this.exclaim.visible = !alarm && !sleeper && !woke;
    this.heading.set(alarm ? ab.alarmTripped : failure.reason === 'sleeper' ? ab.sleeperWoke : ab.specimenWoke, 0, -52, 448);
    this.who.set(gt(failure.by), 46, -12, 350);
    const source = sim.room.interior?.caption;
    const caption = (ab.sleeperCaptions as Record<string, string>)[failure.by] ?? (source ? gt(source) : ab.defaultCaption);
    const small = measure(caption, 16, 650) > 356;
    this.bottomLine.visible = small;
    if (small) {
      const lines = wrapLines(caption, 356, 14, 650);
      this.caption.restyle(SMALL).set(lines[0] ?? '', 46, 25, 356);
      this.bottomLine.set(lines[1] ?? '', 46, 44, 356);
    } else this.caption.restyle(CAPTION).set(caption, 46, 34, 356);
  }
}
