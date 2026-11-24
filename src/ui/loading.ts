import { Container, Graphics } from 'pixi.js';
import type { Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { AssetLoader } from '../core/assets';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Shape, ellipseArc, panelPath, roundRect } from '../core/gfx/shapes';
import { Label, Paragraph, wrapLines } from '../core/gfx/text';
import { fmt, tr } from '../i18n';
import { C } from './theme';
import { NightSky } from './views/backdrop';

const MIN_TIME = 0.7;
const MAX_TIME = 8;
const BAR_W = 380;
const BAR_X = (VIEW_W - BAR_W) / 2;
const TIP_W = VIEW_W - 148;

export class LoadingScene implements Scene {
  t = 0;
  /** Progress shown on the bar (eases towards the real value). */
  shown = 0;
  private finished = false;
  readonly tipSeed = Math.random();
  private readonly look = new ViewSlot(() => new LoadingView(this));

  constructor(
    private readonly assets: AssetLoader,
    private readonly onReady: () => void,
    readonly reduced: () => boolean,
  ) {}

  get view(): Container {
    return this.look.get().root;
  }

  update(dt: number): void {
    this.t += dt;
    this.shown += (this.assets.progress - this.shown) * Math.min(1, dt * 10);
    if (!this.finished && ((this.assets.done && this.t >= MIN_TIME) || this.t >= MAX_TIME)) {
      this.finished = true;
      this.onReady();
    }
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.look.destroy();
  }
}

const TITLE = { size: 40, color: C.mint, weight: 900, outline: C.ink } as const;
const PCT = { size: 18, color: C.muted, weight: 600 } as const;
const TIP = { size: 21, color: C.text, weight: 600, lineHeight: 27 } as const;

class LoadingView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly saucer = new Container();
  private readonly lights: Graphics[] = [];
  private readonly fill = new Shape();
  private readonly title = new Label(TITLE);
  private readonly pct = new Label(PCT);
  private readonly card = new Shape();
  private readonly tip = new Paragraph(TIP);

  constructor(private readonly s: LoadingScene) {
    // little saucer, drawn round its own centre so the bob just moves the container
    const body = new Graphics()
      .poly([-30, 10, 30, 10, 70, 170, -70, 170])
      .fill('rgba(124,255,203,0.16)')
      .ellipse(0, 0, 80, 22)
      .fill('#8fa6c8')
      .stroke({ color: C.ink, width: 4 });
    ellipseArc(body, 0, -12, 36, 26, Math.PI, 0).closePath().fill(C.mint).stroke({ color: C.ink, width: 4 });
    this.saucer.addChild(body);
    for (let i = 0; i < 5; i++) {
      const dot = new Graphics().circle(-52 + i * 26, 4, 5).fill('#ffffff');
      this.lights.push(dot);
      this.saucer.addChild(dot);
    }
    const track = new Graphics();
    roundRect(track, BAR_X, 640, BAR_W, 24, 12).fill(C.night3).stroke({ color: C.ink, width: 3 });
    this.root.addChild(this.sky, this.saucer, this.title, track, this.fill, this.pct, this.card, this.tip);
  }

  sync(): void {
    const s = this.s;
    const rm = s.reduced();
    this.sky.sync(s.t, rm);
    const bob = rm ? 0 : Math.sin(s.t * 3) * 8;
    this.saucer.position.set(VIEW_W / 2, 360 + bob);
    const lit = Math.floor(s.t * 6) % 5;
    for (let i = 0; i < 5; i++) this.lights[i]!.tint = i === lit ? 0xffd27a : 0x4d5d86;

    const str = tr().loading;
    this.title.set(str.clockingIn, VIEW_W / 2, 600, VIEW_W - 60);
    const fw = Math.max(18, (BAR_W - 6) * s.shown);
    this.fill.draw(Math.round(fw * 2), (g) => roundRect(g, BAR_X + 3, 643, fw, 18, 9).fill(C.mint));
    this.pct.set(fmt(str.calibrating, { pct: Math.round(s.shown * 100) }), VIEW_W / 2, 690, VIEW_W - 60);

    const tip = str.tips[Math.floor(s.tipSeed * str.tips.length)]!;
    // the card grows for a long tip (French runs longer) and stays centred on the same spot
    const lines = wrapLines(tip, TIP_W, 21, 600).length;
    const h = Math.max(110, 36 + lines * 27);
    this.card.draw(h, (g) => panelPath(g, 50, 815 - h / 2, VIEW_W - 100, h, { fill: 'rgba(42,33,96,0.92)', r: 20, lineW: 3, shadow: 4 }));
    this.tip.setBlock(tip, 74, 815 - (lines * 27) / 2, TIP_W);
  }
}
