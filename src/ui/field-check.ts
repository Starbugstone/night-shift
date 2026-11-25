import { Container, Graphics } from 'pixi.js';
import { VIEW_W, type GameContext, type Scene } from '../contracts';
import { ViewSlot, type SceneView } from '../core/gfx/scene';
import { panelPath } from '../core/gfx/shapes';
import { Label, Paragraph } from '../core/gfx/text';
import { tr } from '../i18n';
import type { AbductSimulation } from '../abduct/simulation';
import { C } from './theme';
import { NightSky } from './views/backdrop';
import { ButtonView } from './views/button';
import { HudPrompt } from './views/hud';
import { Button } from './widgets';

type Phase = 'memo' | 'retry' | 'done';

export class FieldCheckCard implements Scene {
  t = 0;
  readonly primary: Button;
  readonly skip: Button;
  private readonly look = new ViewSlot(() => new FieldCheckCardView(this));

  constructor(readonly ctx: GameContext, readonly phase: Phase, private readonly advance: () => void, private readonly leave: () => void) {
    const words = tr().fieldCheck;
    this.primary = new Button(64, 746, 412, 78, phase === 'memo' ? words.start : phase === 'retry' ? tr().common.retry : words.continueToL3, 'primary', 24);
    this.skip = new Button(64, 844, 412, 64, words.skip, 'ghost', 22);
  }

  get view(): Container { return this.look.get().root; }
  render(): void { this.look.peek()?.sync(); }
  dispose(): void { this.look.destroy(); }

  update(dt: number): void {
    this.t += dt;
    const { pointer, audio } = this.ctx;
    if (this.primary.update(pointer, dt, audio)) this.advance();
    else if (this.phase !== 'done' && this.skip.update(pointer, dt, audio)) this.leave();
  }
}

class FieldCheckCardView implements SceneView {
  readonly root = new Container();
  private readonly sky = new NightSky();
  private readonly primary: ButtonView;
  private readonly skip: ButtonView;

  constructor(private readonly card: FieldCheckCard) {
    const { phase } = card;
    const words = tr().fieldCheck;
    const memo = phase === 'memo';
    this.primary = new ButtonView(card.primary);
    this.skip = new ButtonView(card.skip);
    const paper = new Container();
    const heading = new Paragraph({ size: 30, lineHeight: 38, color: C.paperInk, weight: 900 });
    heading.setBlock(memo ? words.re : phase === 'retry' ? tr().common.retry : words.completeTitle, 57, 255, 426);
    const body = new Paragraph({ size: 20, lineHeight: 27, color: C.paperInk, weight: 600 });
    body.setBlock(memo ? words.body : phase === 'retry' ? words.prompts.retry : words.prompts.complete, 60, 350, 420);
    paper.addChild(
      panelPath(new Graphics(), 24, 168, 492, 528, { fill: C.paper, r: 20 }),
      new Label({ size: 17, color: '#6548a9', weight: 850 }).set(words.location, VIEW_W / 2, 206, 424),
      heading, body,
    );
    if (memo) {
      const joke = new Paragraph({ size: 18, lineHeight: 23, color: '#6548a9', italic: true });
      joke.setBlock(words.joke, 70, 562, 400);
      paper.addChild(joke, new Label({ size: 16, color: '#6548a9', italic: true }).set(words.signoff, VIEW_W / 2, 666, 420));
    }
    if (phase === 'done') {
      const comment = new Paragraph({ size: 18, lineHeight: 24, color: '#6548a9', italic: true });
      comment.setBlock(words.completeComment, 60, 449, 420);
      const pips = new Graphics();
      for (let i = 0; i < 3; i++) pips.circle(224 + 46 * i, 599, 13).fill(i === 0 ? '#16865f' : C.paper).stroke({ color: '#16865f', width: 3 });
      paper.addChild(comment, pips, new Label({ size: 18, color: '#16865f', weight: 850 }).set(tr().fieldCheckControls.checkpoint, VIEW_W / 2, 640, 420));
    }
    this.root.addChild(this.sky, paper, new Label({ size: 27, color: C.mint, weight: 900 }).set(words.title, VIEW_W / 2, 110, 470), this.primary);
    if (memo) this.root.addChild(new Label({ size: 16, color: C.muted, weight: 650 }).set(words.blurb, VIEW_W / 2, 141, 466));
    if (phase !== 'done') this.root.addChild(this.skip);
  }

  sync(): void {
    this.sky.sync(this.card.t, this.card.ctx.reducedMotion);
    this.primary.sync();
    this.skip.sync();
  }
}

/** How long the clatter demo (dropped clipboard + prompt) stays up. */
const CLATTER_SEC = 2.3;
/** The clipboard's fall from the top of the screen to the floor. */
const DROP_SEC = 0.42;
/** Floor line of the Field Check bedroom (the interior rooms' door sill, `door()` in rooms/deep.ts). */
const ROOM_FLOOR = 686;

export class FieldCheckAbduction implements Scene {
  private demonstratedAt = -Infinity;
  /** World x where the demo clipboard lands, beside the specimen. */
  dropX = 0;
  /** The clipboard has hit the floor (its clatter played). */
  private landed = false;
  private readonly look = new ViewSlot(() => new FieldCheckRoomView(this.inner.view, this.ctx, this.debug, this));

  constructor(private readonly inner: Scene & { debug: AbductSimulation }, private readonly ctx: GameContext) {}

  get debug(): AbductSimulation { return this.inner.debug; }
  get view(): Container { return this.look.get().root; }
  render(): void { this.inner.render(); this.look.peek()?.sync(); }
  dispose(): void { this.look.destroy(); this.inner.dispose?.(); }

  /** Seconds since the clatter demo, or -1 outside its window. */
  get clatterT(): number {
    const k = this.debug.elapsed - this.demonstratedAt;
    return k < CLATTER_SEC ? k : -1;
  }

  /** Seconds the clipboard takes to land (none under reduced motion: it is drawn already down). */
  get dropSec(): number { return this.ctx.reducedMotion ? 0 : DROP_SEC; }

  update(dt: number): void {
    this.inner.update(dt);
    const { moved, elapsed, body, wake, interior, delivered, failure } = this.debug;
    if (!Number.isFinite(this.demonstratedAt)) {
      if (!moved) return;
      // the demo has a visible cause: Head Office drops a clipboard down the beam, beside the specimen
      this.demonstratedAt = elapsed;
      this.dropX = Math.max(40, Math.min(500, body.chestX + (body.chestX < 270 ? 70 : -70)));
    }
    // the clatter is the landing, not the drop
    if (this.landed || elapsed - this.demonstratedAt < this.dropSec || delivered || failure) return;
    this.landed = true;
    wake.noise(22);
    interior?.noise(44, this.dropX, ROOM_FLOOR - 27);
    this.ctx.audio.sfx('crash', 0.4);
  }
}

/** A Head Office clipboard, drawn once (centre origin, 44 × 56). */
function clipboard(): Graphics {
  return new Graphics()
    .roundRect(-22, -28, 44, 56, 5).fill('#a8743f').stroke({ color: C.ink, width: 3 })
    .rect(-15, -18, 30, 40).fill('#f4efe2')
    .rect(-10, -10, 20, 2.5).rect(-10, -3, 20, 2.5).rect(-10, 4, 14, 2.5).fill('#6548a9')
    .roundRect(-9, -32, 18, 9, 3).fill('#c9ccd6').stroke({ color: C.ink, width: 2.5 });
}

class FieldCheckRoomView implements SceneView {
  readonly root = new Container();
  private readonly prompt = new HudPrompt();
  private readonly board = clipboard();

  constructor(private readonly room: Container, private readonly ctx: GameContext, private readonly sim: AbductSimulation, private readonly demo: FieldCheckAbduction) {
    this.board.alpha = 0;
    // under the room's HUD, so it falls behind the TIME chip and the meters
    const hud = room.getChildByLabel('hud');
    if (hud) room.addChildAt(this.board, room.getChildIndex(hud));
    this.root.addChild(room);
    if (!hud) this.root.addChild(this.board);
    this.root.addChild(this.prompt);
  }

  sync(): void {
    const { elapsed, body, delivered, failure, camera } = this.sim;
    const rm = this.ctx.reducedMotion;
    const k = this.demo.clatterT;
    const clatter = k >= 0;
    // the clipboard falls down the beam and lands flat beside the specimen (already down under
    // reduced motion); gone with the prompt once the room fails or delivers
    this.board.alpha = clatter && !delivered && !failure ? Math.min(1, (CLATTER_SEC - k) / 0.3) : 0;
    if (this.board.alpha > 0) {
      const fall = Math.min(1, k / Math.max(1e-6, this.demo.dropSec));
      // lands on its edge, leaning, on the bedroom floor
      const floor = ROOM_FLOOR - 27 - camera.y;
      this.board.position.set(this.demo.dropX - camera.x, -40 + (floor + 40) * fall * fall);
      this.board.rotation = fall * (Math.PI * 2 - 0.18);
    }
    this.prompt.visible = !delivered && !failure && (clatter || body.chestX < 540);
    if (this.prompt.visible) {
      const { prompts } = tr().fieldCheck;
      const text = clatter ? prompts.clatter : prompts.doorLip;
      this.prompt.sync(VIEW_W / 2, 803, 52, text, 20, 'release', elapsed, rm);
    }
  }

  dispose(): void { this.root.removeChild(this.room); }
}
