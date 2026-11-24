// Text for Pixi scenes. `Label` is a Text that behaves like the old Canvas 2D helpers: positioned by
// its anchor point (align + middle baseline), squeezed horizontally to a max width, optionally
// outlined. Layout maths (wrapping, widths) use one shared measuring context so line breaks match
// what the Canvas 2D game did.
import { Text, TextStyle } from 'pixi.js';
import { font } from '../../ui/theme';
import { textureScale } from './textures';

export type Align = 'left' | 'center' | 'right';

export interface LabelStyle {
  size: number;
  color: string;
  weight?: number;
  italic?: boolean;
  align?: Align;
  /** Outline colour (titles, captions); width is max(4, size · 0.18) unless `outlineW` is given. */
  outline?: string;
  outlineW?: number;
  /** Multi-line text: distance between baselines. */
  lineHeight?: number;
}

const STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const styles = new Map<string, TextStyle>();

/** One shared TextStyle per distinct look (styles are compared by identity by Pixi's text cache). */
export function textStyle(s: LabelStyle): TextStyle {
  const weight = s.weight ?? 600;
  const key = `${s.size}|${s.color}|${weight}|${s.italic ? 1 : 0}|${s.align ?? 'center'}|${s.outline ?? ''}|${s.outlineW ?? ''}|${s.lineHeight ?? ''}`;
  let st = styles.get(key);
  if (!st) {
    st = new TextStyle({
      fontFamily: STACK,
      fontSize: s.size,
      fontWeight: String(weight) as TextStyle['fontWeight'],
      fontStyle: s.italic ? 'italic' : 'normal',
      fill: s.color,
      align: s.align ?? 'center',
      lineHeight: s.lineHeight,
      stroke: s.outline ? { color: s.outline, width: s.outlineW ?? Math.max(4, s.size * 0.18), join: 'round' } : undefined,
      padding: s.outline ? Math.ceil((s.outlineW ?? Math.max(4, s.size * 0.18)) / 2) + 2 : 2,
    });
    styles.set(key, st);
  }
  return st;
}

/**
 * A text line (or a block of pre-wrapped lines) anchored like Canvas 2D `fillText` with
 * `textBaseline = 'middle'`. Call `set` every frame: it only re-rasterises when the string, the
 * style or the squeeze changes. Keep `LabelStyle` objects in constants or fields (not literals
 * built each frame): `restyle` with the same object is free.
 */
export class Label extends Text {
  private look: LabelStyle;
  private maxW = 0;
  /** The text the current squeeze was measured for. */
  private fitted: string | null = null;

  constructor(look: LabelStyle, text = '') {
    super({ text, style: textStyle(look), resolution: textureScale() });
    this.look = look;
    this.applyAnchor();
    // follow the backing store after a resize or rotation (also for labels set only once)
    this.onRender = this.followScale;
  }

  private readonly followScale = (): void => {
    const res = textureScale();
    if (this.resolution !== res) this.resolution = res;
  };

  protected applyAnchor(): void {
    const a = this.look.align ?? 'center';
    this.anchor.set(a === 'left' ? 0 : a === 'right' ? 1 : 0.5, 0.5);
  }

  /** Change the look (colour, size...). Free when it is the same object as before. */
  restyle(look: LabelStyle): this {
    if (look === this.look) return this;
    const st = textStyle(look);
    this.look = look;
    if (st !== this.style) {
      this.style = st;
      this.applyAnchor();
      this.fitted = null;
    }
    return this;
  }

  /** Text and position (the anchor point). `maxW` squeezes the line to fit, like fillText's maxWidth. */
  set(s: string, x: number, y: number, maxW = 0): this {
    if (this.text !== s) this.text = s;
    this.position.set(x, y);
    if (maxW !== this.maxW) {
      this.maxW = maxW;
      this.fitted = null;
    }
    if (this.fitted !== this.text) this.fit();
    return this;
  }

  private fit(): void {
    this.fitted = this.text;
    if (this.maxW <= 0) {
      this.scale.x = 1;
      return;
    }
    const w = measure(this.text, this.look.size, this.look.weight ?? 600, this.look.italic ?? false);
    this.scale.x = w > this.maxW ? this.maxW / w : 1;
  }
}

// ---------------------------------------------------------------- measuring

let measurer: CanvasRenderingContext2D | null = null;

function ctx(): CanvasRenderingContext2D | null {
  if (measurer) return measurer;
  if (typeof document === 'undefined') return null;
  measurer = document.createElement('canvas').getContext('2d');
  return measurer;
}

const widths = new Map<string, number>();

/** Width of one line of text in logical px (cached). Rough estimate when there is no DOM (tests). */
export function measure(s: string, size: number, weight = 600, italic = false): number {
  const key = `${size}|${weight}|${italic ? 1 : 0}|${s}`;
  let w = widths.get(key);
  if (w === undefined) {
    const g = ctx();
    if (g) {
      g.font = font(size, weight, italic);
      w = g.measureText(s).width;
    } else w = s.length * size * 0.55;
    if (widths.size > 2000) widths.clear();
    widths.set(key, w);
  }
  return w;
}

const wraps = new Map<string, string[]>();

/** Greedy word wrap into lines no wider than `maxW` (same breaks as the Canvas 2D game). Cached. */
export function wrapLines(s: string, maxW: number, size: number, weight = 600, italic = false): string[] {
  const key = `${size}|${weight}|${italic ? 1 : 0}|${maxW}|${s}`;
  const hit = wraps.get(key);
  if (hit) return hit;
  const lines: string[] = [];
  for (const para of s.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (measure(test, size, weight, italic) > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    lines.push(line);
  }
  if (wraps.size > 400) wraps.clear();
  wraps.set(key, lines);
  return lines;
}

/**
 * A wrapped paragraph: lines broken by `wrapLines` and laid out `lineH` apart, with the first line's
 * middle at y + lineH / 2 (as the old `paragraph` helper did). `set` returns the block height.
 */
export class Paragraph extends Label {
  private key = '';
  private lines = 0;

  constructor(look: LabelStyle) {
    super({ ...look, lineHeight: look.lineHeight ?? look.size * 1.3 });
  }

  protected override applyAnchor(): void {
    super.applyAnchor();
    this.anchor.y = 0;
  }

  /** Paragraph looks need a `lineHeight` (default size · 1.3 is applied at construction only). */
  override restyle(look: LabelStyle): this {
    super.restyle(look);
    this.key = '';
    return this;
  }

  /** Lay out `s` in a box starting at (x, y), `maxW` wide. Returns the height used. */
  setBlock(s: string, x: number, y: number, maxW: number): number {
    const look = this.style;
    const size = Number(look.fontSize);
    const weight = Number(look.fontWeight);
    const italic = look.fontStyle === 'italic';
    const lineH = look.lineHeight || size * 1.3;
    const key = `${maxW}|${s}`;
    if (key !== this.key) {
      this.key = key;
      const lines = wrapLines(s, maxW, size, weight, italic);
      this.lines = lines.length;
      this.text = lines.join('\n');
    }
    const align = look.align;
    const ax = align === 'center' ? x + maxW / 2 : align === 'right' ? x + maxW : x;
    this.position.set(ax, y);
    return this.lines * lineH;
  }
}
