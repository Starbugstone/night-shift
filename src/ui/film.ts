// A story film between shifts (docs/story/rules.md §6, films in src/ui/films.ts). Illustrated
// keyframes with a camera, captions held for their reading time (src/core/film-time.ts), soft sound
// cues and an end card. A tap moves to the next shot once its line could be read; Skip leaves.
import { Container, Graphics, ImageSource, Sprite, Texture } from 'pixi.js';
import type { Scene } from '../contracts';
import type { Shell } from '../core/shell';
import {
  authoredLocal, cameraAt, captionAlpha, captionShown, EASE, shotAt, span, type Cam, type FilmClock,
} from '../core/film-time';
import { FRESH_LINE_SECONDS } from '../core/read-time';
import { glowTexture } from '../core/gfx/glow';
import { ViewSlot } from '../core/gfx/scene';
import { Label, Paragraph } from '../core/gfx/text';
import { paintedTexture } from '../core/gfx/textures';
import { tr } from '../i18n';
import { filmFrame, filmReady, FRAME_H, FRAME_W, preloadFilm } from './film-art';
import { filmById, filmClock, spokenLine, type FilmDef, type FilmFx, type FilmId, type FilmShot } from './films';
import { ButtonView } from './views/button';
import { Button } from './widgets';
import { C } from './theme';

const W = 540;
const H = 960;
/** Cover fit: at camera scale 1 the frame's full height shows (and 75 % of its width). */
const COVER = Math.max(W / FRAME_W, H / FRAME_H);
/** Longest wait for the frames before the film plays with fallbacks (s). */
const LOAD_TIMEOUT = 6;
/** End card: title fade-in (s). The card then waits for a tap, like the last page of any story sequence. */
const END_FADE = 0.6;
/** When the "tap to continue" hint shows on the end card (s). */
const END_HINT = 1.6;
const SMASH = 0.4;
const FADE_IN = 0.45;
const NO_FX: readonly FilmFx[] = [];
const SHAKE: readonly (readonly [number, number])[] = [[7, -5], [-6, 4], [4, -3], [-3, 2], [2, -1], [-1, 1]];

export class FilmScene implements Scene {
  /** Film clock (s), the time spent waiting for frames, and the end card's clock. */
  t = 0;
  wait = 0;
  endT = -1;
  playing = false;
  readonly film: FilmDef;
  readonly clock: FilmClock;
  readonly skip = new Button(W - 152, 22, 132, 62, tr().films.skip, 'ghost', 24);
  /** Next cue to fire, per shot. */
  private readonly cue: number[];
  private finished = false;
  private readonly look = new ViewSlot(() => new FilmView(this));

  constructor(private readonly shell: Shell, readonly id: FilmId, private readonly then: () => void) {
    this.film = filmById(id);
    this.clock = filmClock(id);
    this.cue = this.film.shots.map(() => 0);
    preloadFilm(id);
  }

  get view() { return this.look.get().root; }
  get reduced(): boolean { return this.shell.ctx.reducedMotion; }
  get shotIndex(): number { return shotAt(this.clock, this.t); }

  update(dt: number): void {
    const { pointer } = this.shell.ctx;
    if (this.skip.update(pointer, dt)) return this.finish();
    if (!this.playing) {
      this.wait += dt;
      this.playing = filmReady(this.id) || this.wait >= LOAD_TIMEOUT;
      return;
    }
    const tapped = pointer.pressed && !this.skip.contains(pointer.x, pointer.y);
    if (this.endT >= 0) {
      this.endT += dt;
      if (tapped && this.endT > END_FADE) return this.finish();
      return;
    }
    if (tapped) this.tapNext();
    else this.t += dt;
    this.fireCues();
    if (this.t >= this.clock.length) this.endT = 0;
  }

  /** A tap moves on to the next shot, but never before its line has had a fair read. */
  private tapNext(): void {
    const i = this.shotIndex;
    const shot = this.clock.shots[i]!;
    const l = this.t - shot.start;
    if (shot.capInF !== null && captionAlpha(shot, l) > 0 && captionShown(shot, l) < Math.min(shot.read, FRESH_LINE_SECONDS)) return;
    // the skipped shot's remaining sound cues stay silent
    this.cue[i] = this.film.shots[i]!.sfx?.length ?? 0;
    this.t = i + 1 < this.clock.shots.length ? this.clock.shots[i + 1]!.start : this.clock.length;
  }

  private fireCues(): void {
    const i = this.shotIndex;
    const def = this.film.shots[i]!;
    const cues = def.sfx;
    if (!cues) return;
    const timed = this.clock.shots[i]!;
    const a = authoredLocal(timed, this.t - timed.start);
    while (this.cue[i]! < cues.length && cues[this.cue[i]!]![0] <= a) {
      const [, name, volume] = cues[this.cue[i]!]!;
      this.cue[i]!++;
      this.shell.audio.sfx(name, volume);
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.then();
  }

  render(): void { this.look.peek()?.sync(); }
  dispose(): void { this.look.destroy(); }
}

class FilmView {
  readonly root = new Container();
  private readonly camera = new Container();
  private readonly frames: Container[] = [];
  private readonly sprites: (Sprite | null)[] = [];
  private readonly textures: Texture[] = [];
  private readonly flash = new Graphics().rect(0, 0, W, H).fill('#ffffff');
  private readonly bloom = new Sprite(glowTexture('255,248,224'));
  private readonly iris = new Graphics();
  private irisKey = -1;
  /** Where the closing iris sits on screen: the end card keeps clear of it. */
  private irisY = -1;
  private cardY = -1;
  private readonly black = new Graphics().rect(0, 0, W, H).fill('#05040c');
  private readonly shade: Sprite;
  private readonly who = new Label({ size: 19, weight: 800, color: C.mint, align: 'left' });
  private readonly line = new Paragraph({ size: 27, weight: 700, color: '#fbfaf4', align: 'left', lineHeight: 36 });
  private readonly endTitle = new Label({ size: 46, weight: 850, color: '#fbfaf4' });
  private readonly endSub = new Label({ size: 22, weight: 700, color: C.mint });
  private readonly loading = new Label({ size: 24, weight: 700, color: C.muted });
  private readonly hint = new Label({ size: 20, weight: 700, color: C.muted });
  private readonly skip: ButtonView;
  private capShot = -1;
  private readonly cam: Cam = { x: 0.5, y: 0.5, s: 1, r: 0 };
  private built = false;

  constructor(private readonly scene: FilmScene) {
    this.shade = new Sprite(paintedTexture('film|shade', W, 340, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(4,5,12,0)');
      grad.addColorStop(0.45, 'rgba(4,5,12,0.62)');
      grad.addColorStop(1, 'rgba(4,5,12,0.9)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }));
    this.shade.position.set(0, H - 340);
    this.bloom.anchor.set(0.5);
    this.bloom.blendMode = 'add';
    this.skip = new ButtonView(scene.skip);
    const { films } = tr();
    const words = films[scene.id];
    this.endTitle.set(words.title, W / 2, H * 0.42, W - 64);
    this.endSub.set(words.sub, W / 2, H * 0.42 + 52, W - 64);
    this.loading.set(films.loading, W / 2, H / 2);
    this.hint.set(films.tap, W / 2, H - 70, W - 64);
    this.root.addChild(
      new Graphics().rect(0, 0, W, H).fill('#05040c'), this.camera, this.bloom, this.flash, this.iris, this.black,
      this.shade, this.who, this.line, this.endTitle, this.endSub, this.hint, this.loading, this.skip,
    );
  }

  /** The frames are made once the film starts playing (they have loaded, or failed: then a plain night). */
  private build(): void {
    this.built = true;
    const { film } = this.scene;
    for (const shot of film.shots) {
      const holder = new Container();
      const img = filmFrame(film.id, shot.id);
      let sprite: Sprite | null = null;
      if (img) {
        const texture = new Texture({ source: new ImageSource({ resource: img }) });
        this.textures.push(texture);
        sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        holder.addChild(sprite);
      } else {
        holder.addChild(new Graphics().rect(0, 0, W, H).fill('#1d1838').rect(0, H * 0.62, W, H * 0.38).fill('#141029'));
      }
      holder.visible = false;
      this.frames.push(holder);
      this.sprites.push(sprite);
      this.camera.addChild(holder);
    }
  }

  sync(): void {
    const s = this.scene;
    this.skip.sync();
    this.loading.visible = !s.playing;
    if (!s.playing) {
      this.hideFilm();
      return;
    }
    if (!this.built) this.build();
    const rm = s.reduced;
    const clock = s.clock;
    const cur = s.shotIndex;
    const timed = clock.shots[cur]!;
    const def = s.film.shots[cur]!;
    const a = authoredLocal(timed, s.t - timed.start);

    // --- pictures: the current shot, and the previous one under it while it dissolves in
    const enterFor = rm && cur > 0 ? 0.5 : typeof def.enter === 'object' ? def.enter.dissolve : 0;
    for (let i = 0; i < this.frames.length; i++) {
      let op = 0;
      if (i === cur) op = enterFor > 0 ? span(a, 0, enterFor) : 1;
      else if (i === cur - 1 && enterFor > 0 && a < enterFor) op = 1;
      const frame = this.frames[i]!;
      frame.visible = op > 0.001;
      if (!frame.visible) continue;
      frame.alpha = op;
      const shot = s.film.shots[i]!;
      const ti = clock.shots[i]!;
      this.place(i, rm ? null : cameraAt(shot.cam, authoredLocal(ti, s.t - ti.start), this.cam));
    }

    // --- light and shake: smash cuts, flashes, stamps, a camera bloom
    let flash = 0;
    let bloom = 0;
    let dx = 0;
    let dy = 0;
    let black = cur === 0 && def.enter === 'fade' ? 1 - span(a, 0, FADE_IN) : 0;
    if (!rm) {
      if (def.enter === 'smash') {
        flash = flashCurve(a);
        const f = Math.floor(a * 60);
        if (f >= 0 && f < SHAKE.length) { dx = SHAKE[f]![0]; dy = SHAKE[f]![1]; }
      }
      for (const fx of def.fx ?? NO_FX) {
        const d = a - fx.at;
        if (d < 0) continue;
        if (fx.kind === 'flash') flash = Math.max(flash, flashCurve(d));
        else if (fx.kind === 'shake') {
          const f = Math.floor(d * 60);
          if (f < SHAKE.length) { dx += SHAKE[f]![0]; dy += SHAKE[f]![1]; }
        } else if (fx.kind === 'stamp') {
          if (d < 0.3) dy += 6 * Math.exp(-d * 16) * Math.cos(d * 46);
        } else if (fx.kind === 'bloom' && d < 0.3) {
          bloom = d < 0.03 ? 1 : Math.pow(1 - (d - 0.03) / 0.27, 2);
          flash = Math.max(flash, 0.16 * bloom);
          cameraAt(def.cam, a, this.cam);
          this.bloom.position.set(screenX(fx.x, this.cam), screenY(fx.y, this.cam));
          this.bloom.scale.set((0.7 + 0.5 * bloom) * 2.4);
        }
      }
    }
    this.camera.position.set(dx, dy);
    this.flash.alpha = flash;
    this.flash.visible = flash > 0.001;
    this.bloom.alpha = bloom;
    this.bloom.visible = bloom > 0.001;

    // --- the hand-off: an iris onto a point (a fade with reduced motion), then the end card
    let irisR = -1;
    const ending = s.endT >= 0;
    if (def.iris && a >= def.iris.from) {
      if (rm) black = Math.max(black, span(a, def.iris.from + 0.5, def.iris.to));
      else {
        cameraAt(def.cam, a, this.cam);
        const px = screenX(def.iris.x, this.cam);
        const py = screenY(def.iris.y, this.cam);
        const full = Math.hypot(Math.max(px, W - px), Math.max(py, H - py)) + 4;
        irisR = full + (52 - full) * EASE.inOutCubic(span(a, def.iris.from, def.iris.to));
        this.drawIris(px, py, irisR);
        this.irisY = py;
      }
    } else if (ending && !def.iris) black = Math.max(black, Math.min(0.88, s.endT / 0.5));
    this.iris.visible = irisR >= 0;
    this.black.alpha = black;
    this.black.visible = black > 0.001;
    const card = ending ? span(s.endT, 0, END_FADE) : 0;
    if (ending) {
      const y = this.irisY < 0 || rm ? H * 0.42 : this.irisY > H * 0.45 ? H * 0.2 : H * 0.66;
      if (y !== this.cardY) {
        this.cardY = y;
        this.endTitle.position.y = y;
        this.endSub.position.y = y + 52;
      }
    }
    this.endTitle.alpha = this.endSub.alpha = card;
    this.endTitle.visible = this.endSub.visible = card > 0.001;
    const hint = ending ? span(s.endT, END_HINT, END_HINT + 0.4) : 0;
    this.hint.alpha = hint;
    this.hint.visible = hint > 0.001;

    // --- caption
    const capOp = ending ? 0 : captionAlpha(timed, s.t - timed.start);
    if (capOp > 0 && this.capShot !== cur) this.setCaption(cur, def);
    this.shade.alpha = this.who.alpha = this.line.alpha = capOp;
    this.shade.visible = this.who.visible = this.line.visible = capOp > 0.001;
  }

  private setCaption(i: number, def: FilmShot): void {
    this.capShot = i;
    const words = tr();
    const text = spokenLine(words, this.scene.id, def);
    const h = this.line.setBlock(text, 32, 0, W - 64);
    const top = H - 64 - h;
    this.line.position.y = top;
    this.who.set(words.films.speakers[def.who ?? 'narration'].toUpperCase(), 32, top - 22);
  }

  /** Frame i at the camera (null: the whole frame, still, for reduced motion). */
  private place(i: number, cam: Cam | null): void {
    const sprite = this.sprites[i];
    if (!sprite) return;
    const s = cam ? Math.max(1, cam.s) : 1;
    const hx = W / (2 * FRAME_W * COVER * s);
    const hy = H / (2 * FRAME_H * COVER * s);
    const x = clamp(cam ? cam.x : 0.5, hx, 1 - hx);
    const y = clamp(cam ? cam.y : 0.5, hy, 1 - hy);
    sprite.scale.set(COVER * s);
    sprite.position.set(W / 2 + (0.5 - x) * FRAME_W * COVER * s, H / 2 + (0.5 - y) * FRAME_H * COVER * s);
    sprite.rotation = cam ? (cam.r * Math.PI) / 180 : 0;
  }

  private drawIris(x: number, y: number, r: number): void {
    const key = Math.round(x) * 1e6 + Math.round(y) * 1e3 + Math.round(r);
    if (key === this.irisKey) return;
    this.irisKey = key;
    this.iris.clear().rect(-40, -40, W + 80, H + 80).fill('#05040c').circle(x, y, Math.max(0, r)).cut()
      .circle(x, y, Math.max(0, r)).stroke({ color: C.mint, width: 3, alpha: 0.85 });
  }

  private hideFilm(): void {
    this.shade.visible = this.who.visible = this.line.visible = false;
    this.endTitle.visible = this.endSub.visible = this.hint.visible = false;
    this.flash.visible = this.bloom.visible = this.iris.visible = this.black.visible = false;
  }

  dispose(): void {
    for (const t of this.textures) t.destroy(true);
    this.textures.length = 0;
  }
}

function flashCurve(d: number): number {
  if (d < 0 || d >= SMASH) return 0;
  return d < 0.034 ? 1 : 0.9 * Math.pow(1 - (d - 0.034) / (SMASH - 0.034), 2.4);
}

function clamp(v: number, lo: number, hi: number): number {
  return lo > hi ? 0.5 : v < lo ? lo : v > hi ? hi : v;
}

/** Screen position of an image point under the camera (roll ignored). */
function screenX(px: number, cam: Cam): number {
  const s = Math.max(1, cam.s);
  const hx = W / (2 * FRAME_W * COVER * s);
  return W / 2 + (px - clamp(cam.x, hx, 1 - hx)) * FRAME_W * COVER * s;
}
function screenY(py: number, cam: Cam): number {
  const s = Math.max(1, cam.s);
  const hy = H / (2 * FRAME_H * COVER * s);
  return H / 2 + (py - clamp(cam.y, hy, 1 - hy)) * FRAME_H * COVER * s;
}
