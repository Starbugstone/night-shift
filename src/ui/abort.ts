import type { FlightResult, RoomId, Scene } from '../contracts';
import { VIEW_W } from '../contracts';
import type { Shell } from '../core/shell';
import { drawPortrait, outlinedText, panel, paragraph } from './draw';
import { C } from './theme';
import { Button, drawNightSky } from './widgets';

const LINES = [
  'Abduction abandoned. I have been notified. I am always notified.',
  'Walking away is allowed. Once. I am writing it down.',
  'You gave up. The specimen, blissfully, did not notice.',
];

let rotation = 0;

/** Quick choice after the player gives up inside a room. */
export class AbortScene implements Scene {
  private t = 0;
  private readonly line = LINES[rotation++ % LINES.length]!;
  private readonly retryRoom = new Button(70, 520, VIEW_W - 140, 84, 'Retry room', 'primary', 30);
  private readonly backFlight = new Button(70, 624, VIEW_W - 140, 76, 'Back to flight', 'secondary', 26);
  private readonly orders = new Button(70, 720, VIEW_W - 140, 68, 'Work orders', 'ghost', 24);

  constructor(
    private readonly shell: Shell,
    private readonly levelIndex: number,
    private readonly room: RoomId,
    private readonly flight: FlightResult,
  ) {}

  update(dt: number): void {
    this.t += dt;
    const p = this.shell.ctx.pointer;
    const a = this.shell.audio;
    if (this.retryRoom.update(p, dt, a)) return this.shell.toAbduct(this.levelIndex, this.room, this.flight);
    if (this.backFlight.update(p, dt, a)) return this.shell.toFlight(this.levelIndex);
    if (this.orders.update(p, dt, a)) return this.shell.toWorkOrders();
  }

  render(g: CanvasRenderingContext2D): void {
    const { assets, ctx } = this.shell;
    drawNightSky(g, this.t, ctx.reducedMotion);
    outlinedText(g, 'SHIFT PAUSED', VIEW_W / 2, 150, 46, C.amberHi);
    panel(g, 40, 220, VIEW_W - 80, 250, C.panel, 22, C.ink, 4, 6);
    drawPortrait(g, assets, 'vrell', 120, 310, 120, this.t);
    paragraph(g, this.line, 196, 252, VIEW_W - 260, 20, C.text, 27, 'left', 600, true);
    paragraph(g, 'Pick an option. Any option. Quickly.', 70, 410, VIEW_W - 140, 17, C.muted, 22, 'center', 600);
    this.retryRoom.render(g);
    this.backFlight.render(g);
    this.orders.render(g);
  }
}
