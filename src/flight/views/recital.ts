import { Container, Graphics } from 'pixi.js';
import { Label, Paragraph } from '../../core/gfx/text';
import type { Assets } from '../../contracts';
import { tr } from '../../i18n';
import { artSprite } from '../../ui/views/art';
import type { DeepFlightScene } from '../deep-scene';
import { cameraHeading, GRIMSBY_SET, listenerRecitals, RECITAL_LOOKAHEAD, recitalAt } from '../recital';
import { stewardPose, STEWARD_REACH } from '../photographer';
import { dashedArc, dashedLine, sectorPath } from './tells';
import type { Box } from './clear-of';
import { CameraView } from './world';

function preview(range: number, half: number): Graphics {
  const g = sectorPath(new Graphics(), range, -half, half).fill({ color: '#ffbd64', alpha: 0.075 });
  const x = Math.cos(half) * range, y = Math.sin(half) * range;
  dashedLine(g, 0, 0, x, -y, 13, 9);
  dashedLine(g, 0, 0, x, y, 13, 9);
  return dashedArc(g, range, -half, half, 13, 9).stroke({ color: '#ffba56', width: 3 });
}

/** The same uniform and broad two-page folio identify the speaker on the map and in dialogue. */
export function poetryGuard(assets: Assets): Container {
  return artSprite(assets, 'flight/reciter2199_top', 104, 98) ?? new Graphics()
    .ellipse(0, 15, 44, 28).fill('#925d91').stroke({ color: '#292037', width: 3 })
    .ellipse(0, -15, 23, 22).fill('#a6bb94').stroke({ color: '#292037', width: 3 })
    .roundRect(-25, -38, 50, 12, 4).fill('#786080').circle(-10, -17, 3).circle(10, -17, 3).fill('#292037')
    .poly([-42, 4, -20, 4, 0, 12, 20, 4, 42, 4, 36, 32, 18, 32, 0, 40, -18, 32, -36, 32])
    .fill('#ffe2a4').stroke({ color: '#58394b', width: 4 }).moveTo(0, 12).lineTo(0, 37).stroke({ color: '#906c61', width: 3 });
}

/** Decorations read from the same hazard clock as the live sectors. */
export class RecitalView {
  readonly ground = new Container();
  readonly sectors = new Container();
  readonly bubble = new Container();
  coverEars = false;
  private readonly listeners: Container[];
  /** By detector index: the listener who slumps in that recital's cone. */
  private readonly audience: (Container | undefined)[];
  private readonly previews: Graphics[];
  private readonly lamps = new Container();
  private readonly cards: Container[];
  private readonly heights: number[];
  private readonly tail = new Graphics().poly([-13, 0, 6, -18, 15, 0]).fill('#fff0d2')
    .moveTo(-13, 0).lineTo(6, -18).lineTo(15, 0).stroke({ color: '#483449', width: 4, join: 'round' });
  private height = 0;
  private readonly verses = tr().dispatch2199.verses;
  private readonly predicted = { x: 0, y: 0, heading: 0, torch: 0 };
  private readonly tmp = { x: 0, y: 0 };

  constructor(private readonly s: DeepFlightScene) {
    const assets = s.ctx.assets;
    this.previews = s.sim.field.defs.map(d => {
      const g = d.type === 'camera' ? preview(d.range, d.half) :
        d.type === 'steward' ? preview(d.coneRange, d.coneHalf) : new Graphics();
      this.sectors.addChild(g);
      return g;
    });
    this.listeners = GRIMSBY_SET.listeners.map(({ x, y }) => {
      const figure = artSprite(assets, 'flight/recital_listener2199') ?? new Graphics().ellipse(0, 6, 17, 11)
        .fill('#88748b').circle(0, -5, 10).fill('#dbb998');
      figure.position.set(x, y);
      this.ground.addChild(figure);
      return figure;
    });
    this.audience = s.sim.field.defs.map(() => undefined);
    listenerRecitals(s.sim.field.defs).forEach((d, k) => { if (d >= 0) this.audience[d] = this.listeners[k]; });
    const at = GRIMSBY_SET.sign;
    const sign = new Graphics().rect(at.x - 89, at.y, 8, 47).rect(at.x + 82, at.y, 8, 47).fill('#817e86')
      .roundRect(at.x - 107, at.y - 24, 214, 50, 8).fill('#283a47').stroke({ color: '#d7c48e', width: 4 });
    this.ground.addChild(sign, new Label({ size: 24, weight: 900, color: '#ffe6ab' }).set(tr().dispatch2199.sign, at.x, at.y, 198));
    this.ground.addChild(new Graphics().moveTo(1460, 577).lineTo(1280, 667).stroke({ color: '#b7b4a1', width: 4, alpha: 0.8 }));
    for (const { key, x, y } of s.level.map.groundProps) {
      if (key !== 'flight/demolition_barge2199_top') continue;
      for (let i = 0; i < 5; i++) this.lamps.addChild(new Graphics().circle(x - 132 + i * 55, y + 58 - i * 2, 7).fill('#ffd375'));
    }
    this.ground.addChild(this.lamps);
    this.heights = [];
    this.cards = this.verses.map(line => {
      const card = new Container();
      const words = new Paragraph({ size: 18, weight: 700, color: '#35263e', align: 'left', lineHeight: 25 });
      const height = Math.max(84, words.setBlock(line, -151, 12, 374) + 26);
      this.heights.push(height);
      const ink = '#483449';
      const plate = new Graphics().roundRect(-236, 0, 472, height, 17).fill('#fff0d2').stroke({ color: ink, width: 4 })
        .roundRect(-230, 6, 65, height - 12, 12).fill('#59445d');
      const reader = poetryGuard(assets);
      reader.scale.set(reader.scale.x * 0.63, reader.scale.y * 0.63);
      reader.position.set(-197, height / 2);
      card.addChild(plate, reader, words);
      this.bubble.addChild(card);
      return card;
    });
    this.bubble.addChild(this.tail);
  }

  sync(cam: CameraView): void {
    const { sim, run } = this.s;
    const f = sim.field;
    const t = f.t, future = t + RECITAL_LOOKAHEAD;
    this.coverEars = false;
    this.lamps.alpha = 0.2 + 0.8 * run.deadlineWarning;
    for (let i = 0; i < f.defs.length; i++) {
      const d = f.defs[i]!, g = this.previews[i]!;
      if (d.type === 'camera') {
        const a = cameraHeading(d, future);
        g.visible = cam.sees(d.x, d.y, d.range) && Math.abs(a - f.a[i]!) > 0.001;
        g.position.set(d.x, d.y);
        g.rotation = a;
        this.coverEars ||= g.visible && recitalAt(d, future, sim.saucer.x, sim.saucer.y);
        const listener = this.audience[i];
        if (listener) {
          const slump = recitalAt(d, t, listener.x, listener.y);
          listener.scale.y = slump ? 0.62 : 1;
          listener.rotation = slump ? -0.72 : 0;
        }
      } else if (d.type === 'steward') {
        const p = this.predicted;
        stewardPose(d, f.routes[i]!, future, p, this.tmp);
        g.visible = cam.sees(p.x, p.y, d.coneRange) && Math.abs(Math.sin((p.heading - f.b[i]!) / 2)) > 0.002;
        g.position.set(p.x + STEWARD_REACH * Math.cos(p.torch), p.y + STEWARD_REACH * Math.sin(p.torch));
        g.rotation = p.torch;
      }
    }
    // v0.2 presentation: the card belongs to the poet who began the verse and stays for its reading time,
    // wherever the cone sweeps or the saucer drifts meanwhile.
    const speaker = this.s.verseT > 0 ? f.defs[this.s.verseSpeaker] : undefined;
    const verse = this.verses.indexOf(this.s.verse);
    this.bubble.visible = speaker?.type === 'camera' && verse >= 0 && this.s.state === 'fly';
    if (!this.bubble.visible || speaker?.type !== 'camera') return;
    for (let i = 0; i < this.cards.length; i++) this.cards[i]!.visible = i === verse;
    const h = this.height = this.heights[verse]!;
    const x = Math.max(cam.x + 245, Math.min(cam.x + 295, speaker.x));
    // Stay clear of the HUD, the guard and the saucer. At the fork the reader is
    // beyond the viewport, so the folio in the speech card still shows who is talking.
    const top = cam.y + 209;
    const above = speaker.y - 98 - h;
    let y = above >= top ? above : Math.max(top, speaker.y + 68);
    if (Math.abs(sim.saucer.x - x) < 307 && sim.saucer.y + 85 > y && sim.saucer.y - 85 < y + h)
      y = sim.saucer.y + 108;
    this.bubble.position.set(x, Math.min(cam.y + 936 - h, y));
    const below = this.bubble.y > speaker.y;
    this.tail.position.set(Math.max(-199, Math.min(199, speaker.x - x)), below ? 2 : h - 2);
    this.tail.scale.y = below ? 1 : -1;
  }

  avoid(box: Box, cam: CameraView): boolean {
    if (!this.bubble.visible) return false;
    box.x = this.bubble.x - cam.x - 240;
    box.y = this.bubble.y - cam.y - 21;
    box.w = 480;
    box.h = this.height + 42;
    return true;
  }
}
