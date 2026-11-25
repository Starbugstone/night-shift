import { crestValleyPortrait } from '../../ui/views/crest-valley-portrait';
import { apeFallback } from '../../abduct/monolith-art';
import type { Box } from './clear-of';
import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { VIEW_H, VIEW_W } from '../../contracts';
import { easeOutBack } from '../../core/fx';
import { panelPath } from '../../core/gfx/shapes';
import { Label, measure } from '../../core/gfx/text';
import { fmt, getLang, gt, num, tr } from '../../i18n';
import type { DeepMap } from '../../levels/types';
import { clamp, targetHeadKey } from '../../ui/draw';
import { HUD_ROW, type FuseState } from '../../ui/hud';
import { C } from '../../ui/theme';
import { artSprite, artTex } from '../../ui/views/art';
import { HudButton, HudFuse, HudPanel, HudPrompt, HudSunClock } from '../../ui/views/hud';
import type { DeepFlightScene } from '../deep-scene';
import { propSize } from '../props';
import { RING_R, SUSPICION } from '../sim';
import { mapCollectibleMinimapMark } from './collectible';
import { FlightBanner, ZibBubble, tick } from './overlays';
import { flightLesson } from './progression-hint';

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
  private readonly pickup: Graphics | null;
  private readonly ship = new Graphics().circle(0, 0, 3.5).fill(C.amberHi);
  private readonly scale: number;
  /** Screen box of the card, for labels that must keep clear of it. */
  readonly box: Box;

  private readonly apes: { ring: number; dot: Graphics }[] = [];

  constructor(s: DeepFlightScene) {
    const m = s.level.map;
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
    this.box = { x: VIEW_W - MINI_W - 17, y: HUD_Y - 3, w: MINI_W + 6, h: h + 6 };
    this.root.addChild(card, roads, this.window, ...this.marks);
    this.pickup = s.sim.collectible ? mapCollectibleMinimapMark(s.sim.collectible, k) : null;
    if (this.pickup) this.root.addChild(this.pickup);
    s.sim.ringRef.forEach((ref, ring) => {
      if (!ref.ape) return;
      this.marks[ref.target]!.visible = false;
      const dot = new Graphics().circle(0, 0, 2.6).fill(C.mint);
      this.apes.push({ ring, dot });
      this.root.addChild(dot);
    });
    this.root.addChild(this.ship);
  }

  sync(s: DeepFlightScene, t: number, rm: boolean): void {
    const { sim } = s;
    const k = this.scale;
    this.window.position.set(sim.camX * k, sim.camY * k);
    this.ship.position.set(sim.saucer.x * k, sim.saucer.y * k);
    const pickup = sim.collectible;
    if (this.pickup && pickup) {
      this.pickup.alpha = Number(pickup.available);
      this.pickup.position.set(pickup.position.x * k, pickup.position.y * k);
    }
    for (const { ring, dot } of this.apes) {
      const p = sim.rings[ring]!;
      dot.visible = p.x >= 0;
      if (dot.visible) dot.position.set(p.x * k, p.y * k);
    }
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
  private readonly bearing: Container;
  private readonly doneMark = tick(new Graphics(), 27, 25, 5.5);
  private readonly label: Label;
  private readonly head: Container | null;
  private lastDone: boolean | null = null;
  private lastCount = -1;

  constructor(assets: Assets, private readonly word: string, key: string, x: number, maxW: number, private readonly quota = 0) {
    this.w = Math.min(maxW, measure(quota ? word + ' 0/0' : word, 15, 800) + 67);
    this.root.position.set(x + this.w / 2, HUD_Y + 17);
    this.root.pivot.set(this.w / 2, 17);
    this.label = new Label(CHIP);
    this.head = artSprite(assets, key, 26, 30) ?? apeFallback(key, 26, 30) ?? crestValleyPortrait(key, 26, 30);
    this.root.addChild(this.panel, this.back);
    if (this.head) {
      this.head.position.set(19, 19);
      const clip = new Graphics().circle(19, 17, 12).fill(0xffffff);
      this.head.mask = clip;
      this.root.addChild(clip, this.head);
    }
    this.bearing = artSprite(assets, 'ui/target_marker', 18, 18) ??
      new Graphics().poly([0, -8, 6, 6, 0, 3, -6, 6]).fill(C.mint);
    this.bearing.position.set(this.w - 15, 17);
    this.root.addChild(this.border, this.doneMark, this.label, this.bearing);
  }

  sync(done: boolean, pop: number, angle: number | null, count = 0): void {
    // alpha, not visible: apes cross the screen edge all the time and a visible flip rebuilds the render group
    this.bearing.alpha = angle !== null ? 1 : 0;
    if (angle !== null) this.bearing.rotation = angle + Math.PI / 2;
    this.root.scale.set(pop);
    if (done === this.lastDone && count === this.lastCount) return;
    this.lastCount = count;
    this.lastDone = done;
    this.panel.set(this.w, 34, done ? C.mint : C.ink);
    this.back.tint = done ? '#1d5a4a' : '#120d2b';
    this.border.tint = done ? C.mint : '#6b63a3';
    this.label.restyle(done ? CHIP_DONE : CHIP).set(this.quota ? this.word + ' ' + count + '/' + this.quota : this.word, 38, 18, this.w - 65);
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
  private readonly banner: FlightBanner;
  private readonly delivered = new DeliveredBanner();
  private readonly zib: ZibBubble;
  private readonly hint = new HudPrompt();
  /** v4 council: the lesson hint sits above the saucer while the saucer is low on screen. */
  private hintAbove = false;
  /** The lesson shown last frame (exit hysteresis). */
  private tip = '';
  clock = '';
  private clockSec = -1;
  /** v4 council: screen boxes of the HUD under the top bar (minimap, target chips, practice badge) that route pills keep clear of. */
  readonly avoid: Box[];

  constructor(private readonly s: DeepFlightScene) {
    const { assets } = s.ctx;
    const words = tr().flight;
    const m = s.level.map;
    this.fuse = new HudFuse(artTex(assets, 'ui/eye_closed'), artTex(assets, 'ui/eye_open'));
    const storm = s.level.id === 'level9';
    this.sun = new HudSunClock(storm ? null : artTex(assets, 'ui/sunrise_clock'),
      storm ? tr().crestValley.left : s.level.id === 'level8' ? tr().timeTrial.left : undefined, storm);
    this.fuseState.seconds = 1 / (SUSPICION.rate * s.sim.mult);
    const fuse = Math.round(this.fuseState.seconds * 10) / 10;
    this.banner = new FlightBanner(400, 86,
      new Label(SHIFT).set(s.bannerHeading, VIEW_W / 2, 424, VIEW_W - 150),
      new Label(COLLECT).set(storm ? tr().crestValley.banner : s.level.id === 'level8' ? tr().timeTrial.banner : words.collectAll, VIEW_W / 2, 452, VIEW_W - 150),
      new Label(SEEN_RULE).set(s.level.id === 'level8' ? tr().timeTrial.hover : fmt(words.seenRule, { s: num(fuse, Number.isInteger(fuse) ? 0 : 1) }), VIEW_W / 2, 474, VIEW_W - 150),
    );
    this.map = new MiniMap(s);
    let x = 14;
    const chipRoom = VIEW_W - MINI_W - 14 - 8 - x;
    const native = m.targets.map((tg) => measure(gt(tg.short) + (tg.troop ? ' 0/0' : ''), 15, 800) + 67);
    const k = Math.min(1, (chipRoom - 16) / native.reduce((sum, width) => sum + width, 0));
    this.chips = m.targets.map((tg, i) => {
      const chip = new TargetChip(assets, gt(tg.short), targetHeadKey(tg), x, native[i]! * k, tg.troop?.quota);
      x += chip.w + 8;
      return chip;
    });
    this.zib = new ZibBubble(assets);
    this.root.addChild(this.quit, this.fuse, this.sun);
    for (const chip of this.chips) this.root.addChild(chip.root);
    this.root.addChild(this.map.root);
    this.root.addChild(this.banner.root, this.delivered.root, this.zib.root, this.hint);
    this.avoid = [this.map.box, { x: 10, y: HUD_Y - 4, w: x - 14, h: 42 }];
    if (s.practice) {
      this.root.addChild(new Label(SHIFT).set(tr().fieldCheck.badge, 270, 158, 350));
      const w = Math.min(350, measure(tr().fieldCheck.badge, 14, 900));
      this.avoid.push({ x: 270 - w / 2 - 6, y: 148, w: w + 12, h: 20 });
    }
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
    this.fuse.sync(88, HUD_ROW.y, s.practice ? 438 : 300, HUD_ROW.h, f);
    this.sun.visible = !s.practice;
    const sec = Math.floor(run.elapsed * 4);
    if (sec !== this.clockSec) {
      this.clockSec = sec;
      this.clock = run.clockText(getLang());
    }
    this.sun.sync(396, HUD_ROW.y, 130, HUD_ROW.h, this.clock, run.elapsed / run.budget, run.deadlineWarning, t, rm);
    const targets = s.level.map.targets;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const done = sim.delivered[i]!;
      const pop = s.deliverT > 0 && !rm && i === s.deliveredIdx ?
        1 + 0.22 * Math.max(0, Math.sin((2.6 - s.deliverT) * 7)) * Math.min(1, s.deliverT) : 1;

      const ape = target.troop && sim.nearestApe(i);
      const visible = ape ? overlaps(ape.x, ape.y, 12, 12, sim.camX, sim.camY) : targetOnScreen(target, sim.camX, sim.camY);
      const goal = ape ?? target.building;
      const angle = !spotted && !done && !visible ? Math.atan2(goal.y - sim.saucer.y, goal.x - sim.saucer.x) : null;
      this.chips[i]!.sync(done, pop, angle, run.troops[i]?.caught.size);
    }
    this.map.sync(s, t, rm);
    this.banner.root.visible = s.bannerT > 0 && flying;
    this.banner.root.alpha = clamp(Math.min((3 - s.bannerT) * 4, s.bannerT * 2), 0, 1);
    this.delivered.root.visible = s.level.id !== 'level8' && !this.banner.root.visible && s.deliverT > 0 && flying;
    if (this.delivered.root.visible) this.delivered.sync(s.deliverT, run.deliveredCount, rm);
    this.zib.sync(s.zibText, spotted ? 0 : s.zibT, t, rm, s.zibPanic, s.zibFor);
    const tip = flightLesson(s, this.tip);
    this.tip = tip;
    this.hint.visible = tip.length > 0;
    if (this.hint.visible) {
      // below the saucer as usual; above it while it flies low (the start of a map), with hysteresis
      const sy = sim.saucer.y - sim.camY;
      this.hintAbove = sy > (this.hintAbove ? 660 : 700);
      this.hint.sync(VIEW_W / 2, this.hintAbove ? Math.max(260, sy - 112) : 800, 52, tip, 20, 'hold', t, rm);
    }
  }
}
