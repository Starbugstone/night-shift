// Report card layout (540×960 logical): where the stat rows, the Form 7-B readings, the Bureau ID
// photo, the result stamp, Vrell's cover story and the tabloid clipping go. Pure and DOM-free so
// tests can check that nothing overlaps with long French strings; text width comes from `measure`.
import { VIEW_W } from '../contracts';
import { CARD_H, CARD_W } from './report-photo';

/** Width of `s` at `size` px and `weight` (the scene passes canvas measureText). */
export type Measure = (s: string, size: number, weight: number, italic: boolean) => number;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextBlock extends Box {
  lines: string[];
  size: number;
  lh: number;
}

// Card geometry (shared with report.ts)
export const CX = 24;
export const CY = 28;
export const CW = VIEW_W - 48;
export const CH = 796;
export const STAR_Y = CY + 556;
export const GLORB_Y = CY + 640;
/** First stat row (below the title, subtitle and rule). */
export const ROW_Y0 = CY + 128;
/** The middle band (ID card, stamp, cover story) sits between the rows and the stars; it drops when readings need the room. */
export const BAND_TOP = CY + 364;
const BAND_TOP_READINGS = CY + 392;
/** Above the stars' NEW! badges. */
export const BAND_BOTTOM = STAR_Y - 50;
const READ_MAX_LINES = 3;

/** Form 7-B readings: a heading row, then the readings in a grid of up to three lines. */
export interface ReadingsBlock {
  x: number;
  y: number;
  colW: number;
  cols: number;
  lines: number;
  lh: number;
  size: number;
  cells: readonly string[];
}

export interface ReportLayout {
  rowY: number[];
  rowGap: number;
  rowSize: number;
  /** Separator line offset below each row's centre. */
  rowLine: number;
  /** Heading row of the readings (valid when `readings`). */
  readingsY: number;
  readings: ReadingsBlock | null;
  photo: { x: number; y: number; k: number; box: Box };
  /** The small APPROVED stamp over the ID card's photo. */
  approved: { x: number; y: number; w: number; h: number };
  stamp: { x: number; y: number; scale: number; box: Box };
  cover: TextBlock;
  tabloid: TextBlock | null;
  /** The tabloid clipping's paper (it covers the title strip). */
  clip: Box | null;
}

/** Greedy word wrap at one size. */
export function wrapWith(measure: Measure, s: string, maxW: number, size: number, weight: number, italic: boolean): string[] {
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const test = line ? `${line} ${w}` : w;
      if (line && measure(test, size, weight, italic) > maxW) {
        out.push(line);
        line = w;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

/** Biggest size from `sizes` whose wrap fits `maxLines` (and every line fits the width); else the smallest, cut to `maxLines`. */
export function fitText(
  measure: Measure, s: string, box: Box, sizes: readonly number[], maxLines: number, weight: number, italic: boolean, lhK = 1.2,
): TextBlock {
  let lines: string[] = [];
  let size = sizes[sizes.length - 1]!;
  for (const sz of sizes) {
    const l = wrapWith(measure, s, box.w, sz, weight, italic);
    const lh = Math.round(sz * lhK);
    if (l.length <= maxLines && l.length * lh <= box.h && l.every((x) => measure(x, sz, weight, italic) <= box.w)) {
      lines = l;
      size = sz;
      break;
    }
  }
  if (lines.length === 0) {
    lines = wrapWith(measure, s, box.w, size, weight, italic);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1]! + '…';
    }
  }
  return { ...box, lines, size, lh: Math.round(size * lhK) };
}

export interface LayoutInput {
  rows: number;
  /** Form 7-B readings, already in the current language. */
  readings: readonly string[];
  cover: string;
  headline: string | null;
}

export function layoutReport(measure: Measure, inp: LayoutInput): ReportLayout {
  const n = inp.readings.length;
  let readings: ReadingsBlock | null = null;
  if (n > 0) {
    const cols = Math.max(n > 1 ? 2 : 1, Math.ceil(n / READ_MAX_LINES));
    const colW = (CW - 52) / cols - (cols > 1 ? 8 : 0);
    const widest = Math.max(...inp.readings.map((r) => measure(r, 13, 700, false)));
    const size = widest <= colW ? 13 : 12;
    readings = { x: CX + 26, y: 0, colW, cols, lines: Math.ceil(n / cols), lh: Math.round(size * 1.2), size, cells: inp.readings };
  }
  const readH = readings ? 12 + readings.lines * readings.lh : 0;
  const bandTop = readings ? BAND_TOP_READINGS : BAND_TOP;
  const rowCount = inp.rows + (readings ? 1 : 0);
  const room = bandTop - 4 - ROW_Y0 - (readings ? 4 : 19) - readH;
  const rowGap = Math.min(inp.rows > 6 ? 35 : 42, Math.floor(room / Math.max(1, rowCount - 1)));
  const rowY: number[] = [];
  for (let i = 0; i < inp.rows; i++) rowY.push(ROW_Y0 + i * rowGap);
  const readingsY = ROW_Y0 + inp.rows * rowGap;
  if (readings) readings.y = readingsY + 12;
  const rowSize = Math.min(18, Math.round(rowGap * 0.6));

  const k = readings ? 0.4 : 0.46;
  const pw = CARD_W * k;
  const ph = CARD_H * k;
  const px = CX + 22;
  const py = bandTop + 4;
  const right = px + pw + 16;
  // the rubber stamp art is 240×120 with a 92 px high box in it, rotated −0.16 rad
  const stampScale = readings ? 0.5 : 0.62;
  const sw = 240 * stampScale;
  const sh = 92 * stampScale + Math.sin(0.16) * sw;
  const sx = (right + CX + CW - 18) / 2;
  const sy = bandTop + 2 + sh / 2;
  const coverY = sy + sh / 2 + 4;
  const cover = fitText(measure, inp.cover, { x: right, y: coverY, w: CX + CW - 18 - right, h: BAND_BOTTOM - coverY }, [15, 14, 13, 12], 3, 600, true, 1.15);

  let tabloid: TextBlock | null = null;
  let clip: Box | null = null;
  if (inp.headline) {
    clip = { x: CX + 12, y: CY + 2, w: CW - 24, h: 92 };
    tabloid = fitText(measure, inp.headline, { x: clip.x + 14, y: clip.y + 47, w: clip.w - 28, h: 40 }, [18, 17, 16, 15, 14, 13], 2, 900, false, 1.08);
  }
  const aw = 240 * k * 0.8;
  return {
    rowY,
    rowGap,
    rowSize,
    rowLine: Math.min(19, Math.round(rowGap * 0.54)),
    readingsY,
    readings,
    photo: { x: px, y: py, k, box: { x: px, y: py, w: pw, h: ph } },
    approved: { x: px + pw * 0.56, y: py + ph * 0.74, w: aw, h: aw / 2 },
    stamp: { x: sx, y: sy, scale: stampScale, box: { x: sx - sw / 2, y: sy - sh / 2, w: sw, h: sh } },
    cover,
    tabloid,
    clip,
  };
}

/**
 * A stat row whose value is too long for the space beside its label (three souvenirs, say) stacks:
 * the label moves up and the value gets its own full-width line under it, inside the row's rules.
 * Returns the value's size, or null when it fits beside the label at no less than 85% of `size`
 * (the Label shrinks it that far). `full` is the row's whole width.
 */
export function stackedRowValue(measure: Measure, value: string, room: number, full: number, size: number): number | null {
  if (measure(value, size, 800, false) * 0.85 <= room) return null;
  // at most 14 px: label and value must both sit between the row rules (35 px apart on deep reports)
  for (let s = Math.min(size - 3, 14); s >= 11; s--) {
    if (measure(value, s, 800, false) <= full) return s;
  }
  return 11;
}
