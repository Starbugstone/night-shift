import { Container, Graphics } from 'pixi.js';
import type { FlightResult, RoomId, Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { Label, Paragraph } from '../core/gfx/text';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { highlightedPanel } from './views/menu-decor';
import { VrellPortrait } from './views/portrait';
import { C } from './theme';
import { Button } from './widgets';
import { tr } from '../i18n';

let rotation = 0;

/** Quick choice after the player gives up inside a room. */
export class AbortScene implements Scene {
  t = 0;
  readonly lineN = rotation++;
  readonly retryRoom = new Button(70, 520, VIEW_W - 140, 84, tr().abort.retryRoom, 'primary', 30);
  readonly backFlight = new Button(70, 624, VIEW_W - 140, 76, tr().common.backToFlight, 'secondary', 26);
  readonly orders = new Button(70, 720, VIEW_W - 140, 68, tr().common.workOrders, 'ghost', 24);

  private readonly look = new ViewSlot(() => new AbortView(this));

  constructor(
    readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly room: RoomId,
    private readonly flight: FlightResult,
  ) {}

  update(dt: number): void {
    if (this.t === 0) {
      const lines = tr().abort.lines; // v4 voices: Vrell says it
      this.shell.audio.speak(lines[this.lineN % lines.length]!, 'vrell', { within: 3 });
    }
    this.t += dt;
    const p = this.shell.ctx.pointer;
    if (this.retryRoom.update(p, dt)) return this.shell.toAbduct(this.levelIndex, this.room, this.flight);
    if (this.backFlight.update(p, dt)) return this.shell.toFlight(this.levelIndex, 0, this.shell.ctx.hunt);
    if (this.orders.update(p, dt)) return this.shell.toWorkOrders();
  }

  get view(): Container {
    return this.look.get().root;
  }

  render(): void {
    this.look.peek()?.sync();
  }

  dispose(): void {
    this.shell.audio.hush('vrell'); // v4 voices
    this.look.destroy();
  }
}

class AbortView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly portrait: VrellPortrait;
  private readonly buttons: ButtonView[];

  constructor(private readonly s: AbortScene) {
    const strings = tr().abort;
    this.portrait = new VrellPortrait(s.shell.assets, 120, 310, 120);
    this.buttons = [s.retryRoom, s.backFlight, s.orders].map((button) => new ButtonView(button));
    const title = new Label({ size: 46, color: C.amberHi, weight: 900, outline: C.ink });
    const line = new Paragraph({ size: 20, color: C.text, weight: 600, lineHeight: 27, align: 'left', italic: true });
    const pick = new Paragraph({ size: 17, color: C.muted, weight: 600, lineHeight: 22 });
    line.setBlock(strings.lines[s.lineN % strings.lines.length]!, 196, 252, VIEW_W - 260);
    pick.setBlock(strings.pick, 70, 410, VIEW_W - 140);
    this.root.addChild(
      this.sky,
      title.set(strings.title, VIEW_W / 2, 150, VIEW_W - 60),
      highlightedPanel(new Graphics(), 40, 220, VIEW_W - 80, 250, { fill: C.panel }),
      this.portrait.root, line, pick, ...this.buttons,
    );
  }

  sync(): void {
    const { t, shell } = this.s;
    const reduced = shell.ctx.reducedMotion;
    this.sky.sync(t, reduced);
    this.portrait.sync(t, reduced);
    for (const button of this.buttons) button.sync();
  }
}
