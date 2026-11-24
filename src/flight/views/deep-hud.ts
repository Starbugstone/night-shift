import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { VIEW_H, VIEW_W } from '../../contracts';
import { easeOutBack } from '../../core/fx';
import { panelPath } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { fmt, gt, num, tr } from '../../i18n';
import type { DeepMap } from '../../levels/types';
import { clamp, headKey } from '../../ui/draw';
import { HUD_ROW, type FuseState } from '../../ui/hud';
import { C } from '../../ui/theme';
import { artSprite, artTex } from '../../ui/views/art';
import { HudButton, HudFuse, HudPanel, HudSunClock } from '../../ui/views/hud';
import type { DeepFlightScene } from '../deep-scene';
import { propSize } from '../props';
import { RING_R, SUSPICION } from '../sim';
import { FlightBanner, TargetArrow, ZibBubble, tick } from './overlays';

const MINI_W = 84;
const HUD_Y = HUD_ROW.y + HUD_ROW.h + 10;
const SHIFT = { size: 14, weight: 900, color: C.mint } as const;
const COLLECT = { size: 20, weight: 800, color: C.text } as const;
const SEEN_RULE = { size: 14, weight: 700, color: C.amberHi } as const;
const TOTAL = { size: 24, weight: 900, color: C.text } as const;
const CHIP = { size: 15, weight: 800, color: C.text, align: 'left' } as const;
const CHIP_DONE = { ...CHIP, color: C.mint } as const;

type Target = DeepMap['targets'][number];

function overlaps(x: number, y: number, w: number, h: number, cx: number, cy: number): boolean {
  return x + w > cx && x - w < cx + VIEW_W && y + h > cy && y - h < cy + VIEW_H;
}

function targetOnScreen(tg: Target, cx: number, cy: number): boolean {
  const b = tg.building;
  const { w, h } = propSize(b);
  if (overlaps(b.x, b.y, w / 2, h / 2, cx, cy)) return true;
  for (const e of tg.entries) if (overlaps(e.x, e.y, RING_R, RING_R, cx, cy)) return true;
  return false;
}

class MiniMap {
  readonly root = new Container();
  private readonly window: Graphics;
  private readonly marks: Graphics[];
  private readonly ship = new Graphics().circle(0, 0, 3.5).fill(C.amberHi);
  private readonly scale: number;

  constructor(m: DeepMap) {
    const k = this.scale = MINI_W / m.w;
    const h = m.h * k;
    const card = panelPath(new Graphics(), -3, -3, MINI_W + 6, h + 6,
      { fill: 'rgba(27,20,51,0.78)', r: 8, lineW: 2, shadow: 0 });
    const roads = new Graphics();
    for (const r of m.roads) {
      if (r.dir === 'h') roads.rect(r.from * k, (r.at - 60) * k, (r.to - r.from) * k, 120 * k);
      else roads.rect((r.at - 60) * k, r.from * k, 120 * k, (r.to - r.from) * k);
    }
    if (m.roads.length > 0) roads.fill('rgba(124,255,203,0.09)');
    this.window = new Graphics().rect(0, 0, VIEW_W * k, VIEW_H * k)
      .stroke({ color: 'rgba(241,238,255,0.35)', width: 1 });
    this.marks = m.targets.map(({ building: b }) => {
      const g = new Graphics().circle(0, 0, 4).fill(0xffffff);
      g.position.set(b.x * k, b.y * k);
      return g;
    });
    this.root.position.set(VIEW_W - MINI_W - 14, HUD_Y);
    this.root.addChild(card, roads, this.window, ...this.marks, this.ship);
  }

  sync(s: DeepFlightScene, t: number, rm: boolean): void {
    const { sim } = s;
    const k = this.scale;
    this.window.position.set(sim.camX * k, sim.camY * k);
    this.ship.position.set(sim.saucer.x * k, sim.saucer.y * k);
    for (let i = 0; i < this.marks.length; i++) {
      const g = this.marks[i]!;
      const done = sim.delivered[i]!;
      g.tint = done ? '#4a4470' : C.mint;
      g.scale.set(done ? 0.75 : 1 + (rm ? 0 : 0.2 * Math.sin(t * 4 + i)));
    }
  }
}

class TargetChip {
  readonly root = new Container();
  readonly w: number;
  private readonly panel = new HudPanel();
  private readonly back = new Graphics().circle(19, 17, 12).fill(0xffffff);
  private readonly border = new Graphics().circle(19, 17, 12).stroke({ color: 0xffffff, width: 2 });
  private readonly doneMark = tick(new Graphics(), 27, 25, 5.5);
  private readonly label: Label;
  private readonly head: Container | null;
  private lastDone: boolean | null = null;

  constructor(assets: Assets, private readonly word: string, key: string, x: number, maxW: number) {
    this.w = Math.min(maxW, measure(word, 15, 800) + 58);
    this.root.position.set(x + this.w / 2, HUD_Y + 17);
    this.root.pivot.set(this.w / 2, 17);
    this.label = new Label(CHIP);
    this.head = artSprite(assets, key, 26, 30);
    this.root.addChild(this.panel, this.back);
    if (this.head) {
      this.head.position.set(19, 19);
      const clip = new Graphics().circle(19, 17, 12).fill(0xffffff);
      this.head.mask = clip;
      this.root.addChild(clip, this.head);
    }
    this.root.addChild(this.border, this.doneMark, this.label);
  }

  sync(done: boolean, pop: number): void {
    this.root.scale.set(pop);
    if (done === this.lastDone) return;
    this.lastDone = done;
    this.panel.set(this.w, 34, done ? C.mint : C.ink);
    this.back.tint = done ? '#1d5a4a' : '#120d2b';
    this.border.tint = done ? C.mint : '#6b63a3';
    this.label.restyle(done ? CHIP_DONE : CHIP).set(this.word, 38, 18, this.w - 47);
    if (this.head) this.head.alpha = done ? 0.55 : 1;
    this.doneMark.visible = done;
  }
}

class DeliveredBanner {
  readonly root = new Container();
  private readonly states = [0, 1, 2, 3].map((n) => fmt(tr().flight.countOf, { n }));
  private readonly counts = new Label(TOTAL);
  private readonly empty: Graphics[] = [];
  private readonly lit: Graphics[] = [];

  constructor() {
    this.root.position.set(VIEW_W / 2, 300);
    const card = new HudPanel();
    card.set(300, 84, C.mint);
    card.position.set(-150, -42);
    this.root.addChild(card, new Label(SHIFT).set(tr().flight.secured, 0, -20, 270), this.counts);
    for (let i = 0; i < 3; i++) {
      const off = new Graphics().circle(0, 0, 10).fill('#120d2b').stroke({ color: '#6b63a3', width: 2.5 });
      const on = new Graphics().circle(0, 0, 10).fill(C.mint).stroke({ color: C.ink, width: 2.5 });
      off.position.set(-118 + i * 30, 14);
      on.position.copyFrom(off.position);
      this.empty.push(off);
      this.lit.push(on);
      this.root.addChild(off, on);
    }
  }

  sync(time: number, delivered: number, rm: boolean): void {
    const age = 2.6 - time;
    this.root.alpha = clamp(Math.min(age * 6, time * 2.5), 0, 1);
    this.root.scale.set(rm ? 1 : easeOutBack(age / 0.3));
    for (let i = 0; i < 3; i++) {
      const landed = i < delivered - 1 || (i === delivered - 1 && age > 0.45);
      const hit = i === delivered - 1 && !rm ? 1 + 0.6 * Math.max(0, 1 - Math.abs(age - 0.5) * 6) : 1;
      this.empty[i]!.visible = !landed;
      this.lit[i]!.visible = landed;
      if (landed) this.lit[i]!.scale.set(hit);
      else this.empty[i]!.scale.set(hit);
    }
    this.counts.set(this.states[Math.min(3, delivered)]!, 60, 15, 150);
  }
}

export class DeepFlightHud {
  readonly root = new Container();
  private readonly quit = new HudButton('close');
  private readonly fuse: HudFuse;
  private readonly sun: HudSunClock;
  private readonly fuseState: FuseState = { value: 0, exposed: false, t: 0, reduced: false, seconds: 1 };
  private readonly chips: TargetChip[];
  private readonly map: MiniMap;
  private readonly arrows: TargetArrow[];
  private readonly arrowTop: number;
  private readonly banner: FlightBanner;
  private readonly delivered = new DeliveredBanner();
  private readonly zib: ZibBubble;
  clock = '';
  private clockSec = -1;

  constructor(private readonly s: DeepFlightScene) {
    const { assets } = s.ctx;
    const words = tr().flight;
    const m = s.level.map;
    this.fuse = new HudFuse(artTex(assets, 'ui/eye_closed'), artTex(assets, 'ui/eye_open'));
    this.sun = new HudSunClock(artTex(assets, 'ui/sunrise_clock'));
    this.fuseState.seconds = 1 / (SUSPICION.rate * s.sim.mult);
    const fuse = Math.round(this.fuseState.seconds * 10) / 10;
    this.banner = new FlightBanner(400, 86,
      new Label(SHIFT).set(fmt(words.banner, { num: s.level.num, h: s.level.hours[1] }), VIEW_W / 2, 424, VIEW_W - 150),
      new Label(COLLECT).set(words.collectAll, VIEW_W / 2, 452, VIEW_W - 150),
      new Label(SEEN_RULE).set(fmt(words.seenRule, { s: num(fuse, Number.isInteger(fuse) ? 0 : 1) }), VIEW_W / 2, 474, VIEW_W - 150),
    );
    this.map = new MiniMap(m);
    this.arrows = m.targets.map((tg) => new TargetArrow(assets, gt(tg.short)));
    this.arrowTop = Math.max(230, Math.ceil(HUD_Y + m.h * MINI_W / m.w + 35));
    let x = 14;
    const chipRoom = VIEW_W - MINI_W - 14 - 8 - x;
    const native = m.targets.map((tg) => measure(gt(tg.short), 15, 800) + 58);
    const k = Math.min(1, (chipRoom - 16) / native.reduce((sum, width) => sum + width, 0));
    this.chips = m.targets.map((tg, i) => {
      const chip = new TargetChip(assets, gt(tg.short), headKey(tg.short), x, native[i]! * k);
      x += chip.w + 8;
      return chip;
    });
    this.zib = new ZibBubble(assets);
    this.root.addChild(this.quit, this.fuse, this.sun);
    for (const chip of this.chips) this.root.addChild(chip.root);
    this.root.addChild(this.map.root);
    for (const arrow of this.arrows) this.root.addChild(arrow.root);
    this.root.addChild(this.banner.root, this.delivered.root, this.zib.root);
  }

  sync(t: number, rm: boolean): void {
    const s = this.s;
    const { sim, run } = s;
    const flying = s.state === 'fly';
    const spotted = s.state === 'spotted';
    this.quit.sync(s.quit, tr().common.quit, s.quit.pressedDown);
    const f = this.fuseState;
    f.value = spotted ? 1 : sim.st.sus;
    f.exposed = spotted || (flying && sim.st.cause >= 0);
    f.t = t;
    f.reduced = rm;
    this.fuse.sync(88, HUD_ROW.y, 300, HUD_ROW.h, f);
    const sec = Math.floor(run.elapsed * 4);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clock = run.clockText();
    }
    this.sun.sync(396, HUD_ROW.y, 130, HUD_ROW.h, this.clock, run.elapsed / run.budget, run.dawn, t, rm);
    const targets = s.level.map.targets;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const done = sim.delivered[i]!;
      const pop = s.deliverT > 0 && !rm && i === s.deliveredIdx ?
        1 + 0.22 * Math.max(0, Math.sin((2.6 - s.deliverT) * 7)) * Math.min(1, s.deliverT) : 1;
      this.chips[i]!.sync(done, pop);
      const arrow = this.arrows[i]!;
      arrow.root.visible = !spotted && !done && !targetOnScreen(target, sim.camX, sim.camY);
      if (arrow.root.visible) arrow.sync(target.building, sim.camX, sim.camY, t + i, rm, this.arrowTop, 180);
    }
    this.map.sync(s, t, rm);
    this.banner.root.visible = s.bannerT > 0 && flying;
    this.banner.root.alpha = clamp(Math.min((3 - s.bannerT) * 4, s.bannerT * 2), 0, 1);
    this.delivered.root.visible = !this.banner.root.visible && s.deliverT > 0 && flying;
    if (this.delivered.root.visible) this.delivered.sync(s.deliverT, run.deliveredCount, rm);
    this.zib.sync(s.zibText, spotted ? 0 : s.zibT, t, rm, s.zibPanic);
  }
}
