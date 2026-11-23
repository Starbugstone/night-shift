// One in-game HUD kit, shared by the flight and abduction phases and matched to the menu panels:
// indigo pill panels with an ink outline, a small drop shadow and an inner top highlight.
import { roundRectPath, text } from './draw';
import { C, font } from './theme';

const PANEL_FILL = 'rgba(38,30,88,0.93)';
const TRACK = '#120d2b';
const HILITE = 'rgba(255,255,255,0.13)';
const R = 18;

export interface HudRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Standard HUD row: every phase puts its three pieces on this line. */
export const HUD_ROW = { y: 16, h: 62 } as const;

export function hudPanel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent: string = C.ink, pushed = 0): void {
  // shadow
  roundRectPath(g, x, y + 4, w, h, R);
  g.fillStyle = 'rgba(5,3,20,0.45)';
  g.fill();
  const yy = y + pushed;
  roundRectPath(g, x, yy, w, h, R);
  g.fillStyle = PANEL_FILL;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = accent;
  g.stroke();
  // inner top highlight
  g.beginPath();
  g.moveTo(x + R, yy + 3.5);
  g.lineTo(x + w - R, yy + 3.5);
  g.lineWidth = 1.5;
  g.strokeStyle = HILITE;
  g.stroke();
}

export type MeterIcon = 'eye' | 'sleep';

export interface MeterState {
  label: string;
  /** 0..1 */
  value: number;
  /** Fill turns amber at `warn`, red (and the panel jitters) at `danger`. */
  warn: number;
  danger: number;
  icon: MeterIcon;
  /** Seconds, for the pulse. */
  t: number;
  reduced: boolean;
  /** 0..1 white flash over the bar (decays in the caller). */
  flash: number;
  /** Fully tripped (awake / about to be spotted): whole panel goes red. */
  alarm: boolean;
}

/** Icon + label + bar. Used for Suspicion (flight) and Wake (abduction). */
export function hudMeter(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, m: MeterState): void {
  const hot = m.value >= m.danger || m.alarm;
  const jitter = hot && !m.reduced ? Math.sin(m.t * 50) * 2 : 0;
  const px = x + jitter;
  const blink = m.reduced || Math.floor(m.t * 8) % 2 === 0;
  hudPanel(g, px, y, w, h, hot && blink ? C.red : C.ink);

  // icon badge
  const cx = px + 30;
  const cy = y + h / 2;
  g.beginPath();
  g.arc(cx, cy, 17, 0, Math.PI * 2);
  g.fillStyle = TRACK;
  g.fill();
  const tone = hot ? C.red : m.value >= m.warn ? C.amber : C.mint;
  if (m.icon === 'eye') drawEye(g, cx, cy, m.value >= m.warn ? 1 : m.value > 0.02 ? 0.55 : 0.12, tone);
  else drawSleep(g, cx, cy, m.alarm, tone, m.t, m.reduced);

  text(g, m.label, px + 56, y + 19, 14, hot ? C.red : C.muted, 'left', 900);

  // bar
  const bx = px + 56;
  const by = y + 32;
  const bw = w - 72;
  const bh = 18;
  roundRectPath(g, bx, by, bw, bh, bh / 2);
  g.fillStyle = TRACK;
  g.fill();
  const v = m.value < 0 ? 0 : m.value > 1 ? 1 : m.value;
  if (v > 0.005) {
    const fw = Math.max(bh, bw * v);
    roundRectPath(g, bx, by, fw, bh, bh / 2);
    g.fillStyle = hot ? (blink ? C.red : C.amber) : v >= m.warn ? C.amber : C.mint;
    g.fill();
    // gloss
    roundRectPath(g, bx + 5, by + 3, fw - 10, 5, 2.5);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fill();
  }
  // threshold ticks
  g.fillStyle = 'rgba(241,238,255,0.28)';
  g.fillRect(bx + bw * m.warn - 1, by + 3, 2, bh - 6);
  g.fillRect(bx + bw * m.danger - 1, by + 3, 2, bh - 6);
  if (m.flash > 0.01) {
    roundRectPath(g, bx - 3, by - 3, bw + 6, bh + 6, bh / 2 + 3);
    g.globalAlpha = Math.min(1, m.flash) * 0.75;
    g.fillStyle = '#ffffff';
    g.fill();
    g.globalAlpha = 1;
  }
}

function drawEye(g: CanvasRenderingContext2D, cx: number, cy: number, open: number, color: string): void {
  const h = 2 + 8 * open;
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  g.strokeStyle = color;
  g.beginPath();
  g.moveTo(cx - 11, cy);
  g.quadraticCurveTo(cx, cy - h * 1.5, cx + 11, cy);
  g.quadraticCurveTo(cx, cy + h * 1.5, cx - 11, cy);
  g.stroke();
  if (open > 0.3) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cy, 2.2 + open * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  g.lineCap = 'butt';
}

function drawSleep(g: CanvasRenderingContext2D, cx: number, cy: number, awake: boolean, color: string, t: number, reduced: boolean): void {
  if (awake) {
    const s = reduced ? 1 : 1 + Math.sin(t * 16) * 0.12;
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(cx - 2.6 * s, cy - 11 * s, 5.2 * s, 13 * s, 2.4);
    g.arc(cx, cy + 8 * s, 3 * s, 0, Math.PI * 2);
    g.fill();
    return;
  }
  // two little Z's
  g.strokeStyle = color;
  g.lineWidth = 2.6;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const d = reduced ? 0 : Math.sin(t * 2.2) * 1.2;
  g.beginPath();
  g.moveTo(cx - 9, cy - 1 + d);
  g.lineTo(cx - 1, cy - 1 + d);
  g.lineTo(cx - 9, cy + 9 + d);
  g.lineTo(cx - 1, cy + 9 + d);
  g.moveTo(cx + 3, cy - 10 - d);
  g.lineTo(cx + 9, cy - 10 - d);
  g.lineTo(cx + 3, cy - 3 - d);
  g.lineTo(cx + 9, cy - 3 - d);
  g.stroke();
  g.lineCap = 'butt';
}

const DIGIT_W = 15;
const COLON_W = 8;

/** Timer chip. Digits sit in fixed cells so the clock doesn't shimmy as numbers change. */
export function hudTimer(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: string): void {
  hudPanel(g, x, y, w, h);
  text(g, 'TIME', x + w / 2, y + 19, 13, C.muted, 'center', 900);
  let total = 0;
  for (let i = 0; i < time.length; i++) total += time.charCodeAt(i) === 58 ? COLON_W : DIGIT_W;
  let cx = x + w / 2 - total / 2;
  g.font = font(24, 800);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = C.text;
  for (let i = 0; i < time.length; i++) {
    const cw = time.charCodeAt(i) === 58 ? COLON_W : DIGIT_W;
    g.fillText(time[i]!, cx + cw / 2, y + 42);
    cx += cw;
  }
}

export type HudIcon = 'close' | 'restart';

/** Square-ish HUD button: vector icon over a tiny caps label. */
export function hudButton(g: CanvasRenderingContext2D, r: HudRect, icon: HudIcon, label: string, pressed: boolean): void {
  const push = pressed ? 3 : 0;
  hudPanel(g, r.x, r.y, r.w, r.h, 'rgba(170,160,220,0.65)', push);
  const cx = r.x + r.w / 2;
  const cy = r.y + push + r.h / 2 - 7;
  g.strokeStyle = C.text;
  g.lineWidth = 3.4;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  if (icon === 'close') {
    g.moveTo(cx - 8, cy - 8);
    g.lineTo(cx + 8, cy + 8);
    g.moveTo(cx + 8, cy - 8);
    g.lineTo(cx - 8, cy + 8);
    g.stroke();
  } else {
    g.arc(cx, cy, 9.5, -0.35, Math.PI * 1.45);
    g.stroke();
    // arrow head at the open end of the arc
    const ax = cx + Math.cos(-0.35) * 9.5;
    const ay = cy + Math.sin(-0.35) * 9.5;
    g.fillStyle = C.text;
    g.beginPath();
    g.moveTo(ax + 5.5, ay + 4.5);
    g.lineTo(ax - 6.5, ay + 3);
    g.lineTo(ax + 2, ay - 7);
    g.closePath();
    g.fill();
  }
  g.lineCap = 'butt';
  text(g, label, cx, r.y + push + r.h - 14, 11, C.muted, 'center', 900);
}

export type PromptGlyph = 'drag' | 'release' | 'hold' | 'shake';

/** Tutorial / instruction pill: solid mint, ink text, finger dot on the left. */
export function hudPrompt(
  g: CanvasRenderingContext2D, cx: number, cy: number, h: number, msg: string, size: number,
  glyph: PromptGlyph, t: number, reduced: boolean, maxW = 500,
): void {
  g.font = font(size, 800);
  const w = Math.min(maxW, g.measureText(msg).width + 86);
  const x = cx - w / 2;
  roundRectPath(g, x, cy - h / 2 + 4, w, h, h / 2);
  g.fillStyle = 'rgba(5,3,20,0.45)';
  g.fill();
  roundRectPath(g, x, cy - h / 2, w, h, h / 2);
  g.fillStyle = C.mint;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = C.ink;
  g.stroke();
  roundRectPath(g, x + 14, cy - h / 2 + 6, w - 28, h * 0.22, h * 0.11);
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.fill();
  text(g, msg, cx + 18, cy + 1, size, C.ink, 'center', 800, false, w - 78);

  // finger glyph
  const fx = x + 32;
  let fy = cy;
  let dx = 0;
  if (!reduced) {
    if (glyph === 'drag') fy += Math.sin(t * 4) * 6;
    else if (glyph === 'shake') dx = Math.sin(t * 18) * 5;
  }
  if (glyph === 'hold' || glyph === 'release') {
    g.beginPath();
    g.arc(fx, fy, 15, 0, Math.PI * 2);
    g.lineWidth = 2.5;
    g.strokeStyle = glyph === 'hold' ? C.ink : 'rgba(27,20,51,0.35)';
    g.stroke();
  }
  g.beginPath();
  g.arc(fx + dx, fy, glyph === 'release' ? 8 : 11, 0, Math.PI * 2);
  g.fillStyle = glyph === 'release' ? 'rgba(27,20,51,0.35)' : C.ink;
  g.fill();
}

export interface FuseState {
  /** 0..1: 1 = SPOTTED. */
  value: number;
  /** A detector covers the saucer this frame. */
  exposed: boolean;
  t: number;
  reduced: boolean;
  /** Seconds the full fuse lasts (1.0, or 1.25 with Hush Drive), shown as a caption. */
  seconds: number;
}

/** "0.0" .. "2.0", so the countdown never builds a string per frame. */
const TENTHS: string[] = [];
for (let i = 0; i <= 20; i++) TENTHS.push((i / 10).toFixed(1));
let fuseCaption = '';
let fuseCaptionFor = -1;

/**
 * Suspicion as a 1-second fuse: an eye that opens as the meter fills, a fuse cord that burns
 * down from the right with a spark at the burning end, and the seconds left in big digits.
 * `assets` may supply ui/eye_closed / ui/eye_open.
 */
export function hudFuse(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: FuseState, eyeClosed?: HTMLImageElement, eyeOpen?: HTMLImageElement): void {
  const v = f.value < 0 ? 0 : f.value > 1 ? 1 : f.value;
  const hot = v > 0.6 || (f.exposed && v > 0.25);
  const jitter = hot && !f.reduced ? Math.sin(f.t * 55) * 2.5 * v : 0;
  const px = x + jitter;
  const blink = f.reduced || Math.floor(f.t * 10) % 2 === 0;
  hudPanel(g, px, y, w, h, f.exposed && blink ? C.red : hot ? C.amber : C.ink);
  if (f.exposed) {
    // the whole chip floods red while something can see you
    roundRectPath(g, px + 2, y + 2, w - 4, h - 4, R - 2);
    g.globalAlpha = (f.reduced ? 0.3 : 0.2 + 0.2 * Math.abs(Math.sin(f.t * (8 + v * 14)))) * (0.5 + v * 0.5);
    g.fillStyle = C.red;
    g.fill();
    g.globalAlpha = 1;
  }

  // the eye: opens with the meter
  const ex = px + 38;
  const ey = y + h / 2;
  const open = v < 0.02 ? 0 : 0.25 + 0.75 * v;
  g.beginPath();
  g.ellipse(ex, ey, 27, 20, 0, 0, Math.PI * 2);
  g.fillStyle = TRACK;
  g.fill();
  const img = v > 0.55 ? eyeOpen : eyeClosed;
  if (img && (v <= 0.02 || v > 0.55)) {
    const s = v > 0.55 && !f.reduced ? 1 + 0.08 * Math.sin(f.t * 30) : 1;
    g.drawImage(img, ex - 25 * s, ey - 16 * s, 50 * s, 32 * s);
  } else {
    const lid = 2 + 13 * open;
    const tone = v > 0.6 ? C.red : v > 0.02 ? C.amber : C.mint;
    g.lineWidth = 3;
    g.lineJoin = 'round';
    g.strokeStyle = tone;
    g.beginPath();
    g.moveTo(ex - 20, ey);
    g.quadraticCurveTo(ex, ey - lid * 1.4, ex + 20, ey);
    g.quadraticCurveTo(ex, ey + lid * 1.4, ex - 20, ey);
    g.closePath();
    if (open > 0) {
      g.fillStyle = '#f4efe2';
      g.fill();
    }
    g.stroke();
    if (open > 0.15) {
      g.save();
      g.beginPath();
      g.moveTo(ex - 20, ey);
      g.quadraticCurveTo(ex, ey - lid * 1.4, ex + 20, ey);
      g.quadraticCurveTo(ex, ey + lid * 1.4, ex - 20, ey);
      g.clip();
      g.beginPath();
      g.arc(ex, ey, 4 + 4 * open, 0, Math.PI * 2);
      g.fillStyle = v > 0.6 ? C.red : '#3a2a6a';
      g.fill();
      g.beginPath();
      g.arc(ex, ey, 2.2 + 1.6 * open, 0, Math.PI * 2);
      g.fillStyle = C.ink;
      g.fill();
      g.restore();
    } else {
      // asleep: lashes
      g.lineWidth = 2;
      g.beginPath();
      for (let k = -1; k <= 1; k++) {
        g.moveTo(ex + k * 9, ey + 3);
        g.lineTo(ex + k * 11, ey + 8);
      }
      g.stroke();
    }
  }

  const burning = v > 0.005;
  text(g, f.exposed ? 'SEEN!' : burning ? 'COOLING…' : 'SUSPICION', px + 74, y + 18, f.exposed ? 17 : 14, f.exposed ? '#ffd9de' : burning ? C.amberHi : C.muted, 'left', 900);
  if (burning) {
    // seconds left before SPOTTED, in tenths
    const left = Math.max(0, Math.min(20, Math.ceil((1 - v) * f.seconds * 10)));
    text(g, TENTHS[left]!, px + w - 30, y + 19, 22, f.exposed ? '#ffffff' : C.amberHi, 'right', 900);
    text(g, 's', px + w - 15, y + 21, 14, f.exposed ? '#ffd9de' : C.amberHi, 'right', 900);
  } else {
    if (fuseCaptionFor !== f.seconds) {
      fuseCaptionFor = f.seconds;
      fuseCaption = `${f.seconds.toFixed(f.seconds % 1 === 0 ? 1 : 2)} s fuse`;
    }
    text(g, fuseCaption, px + w - 14, y + 18, 12, 'rgba(169,162,214,0.8)', 'right', 700);
  }

  // fuse cord: full length = time left; burns from the right towards the bomb (the eye)
  const bx = px + 76;
  const by = y + 42;
  const bw = w - 94;
  const left = 1 - v;
  g.lineCap = 'round';
  g.lineWidth = 11;
  g.strokeStyle = 'rgba(18,13,43,0.9)';
  g.beginPath();
  g.moveTo(bx, by);
  g.lineTo(bx + bw, by);
  g.stroke();
  const endX = bx + bw * left;
  if (burning) {
    // what has burnt away: a dying ember trail
    g.lineWidth = 3;
    g.setLineDash(EMBER_DASH);
    g.strokeStyle = f.exposed ? '#ff5d73' : '#8a4a52';
    g.beginPath();
    g.moveTo(Math.min(bx + bw, endX + 9), by);
    g.lineTo(bx + bw, by);
    g.stroke();
    g.setLineDash(NO_DASH);
  }
  if (left > 0.002) {
    g.lineWidth = 8;
    g.strokeStyle = '#c9a574';
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(endX, by);
    g.stroke();
    // twist marks
    g.lineWidth = 2;
    g.strokeStyle = '#8a6a44';
    g.beginPath();
    for (let k = bx + 6; k < endX - 4; k += 10) {
      g.moveTo(k, by - 3.5);
      g.lineTo(k + 4, by + 3.5);
    }
    g.stroke();
  }
  g.lineCap = 'butt';
  // the spark: only while it is burning (exposed or not yet cooled)
  if (burning) {
    const fl = f.reduced ? 1 : 0.75 + 0.25 * Math.sin(f.t * 47) + (f.exposed ? 0.3 : 0);
    g.globalCompositeOperation = 'lighter';
    g.beginPath();
    g.arc(endX, by, 11 * fl, 0, Math.PI * 2);
    g.fillStyle = f.exposed ? 'rgba(255,120,80,0.75)' : 'rgba(255,190,110,0.5)';
    g.fill();
    if (f.exposed) {
      // crackle: six rays turning with the clock
      g.lineWidth = 2.5;
      g.lineCap = 'round';
      g.strokeStyle = '#ffe9a8';
      g.beginPath();
      const turn = f.reduced ? 0 : f.t * 9;
      for (let k = 0; k < 6; k++) {
        const a = turn + (k * Math.PI) / 3;
        const r0 = 7;
        const r1 = 13 + (k % 2) * 5 * fl;
        g.moveTo(endX + Math.cos(a) * r0, by + Math.sin(a) * r0);
        g.lineTo(endX + Math.cos(a) * r1, by + Math.sin(a) * r1);
      }
      g.stroke();
      g.lineCap = 'butt';
    }
    g.beginPath();
    g.arc(endX, by, 4.5, 0, Math.PI * 2);
    g.fillStyle = '#fff6c9';
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }
}

const EMBER_DASH = [2, 7];
const NO_DASH: number[] = [];

/** Sunrise clock chip: a little clock face and the time; warms up near sunrise. */
export function hudSunClock(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: string, k: number, dawn: number, t: number, reduced: boolean, face?: HTMLImageElement): void {
  const hot = dawn > 0;
  const blink = reduced || Math.floor(t * 3) % 2 === 0;
  hudPanel(g, x, y, w, h, hot && blink ? C.amber : C.ink);
  const cx = x + 30;
  const cy = y + h / 2;
  const r = 20;
  if (hot) {
    // the chip itself warms up, and the sun comes up behind the dial
    const a0 = g.globalAlpha;
    roundRectPath(g, x + 2, y + 2, w - 4, h - 4, R - 2);
    g.globalAlpha = a0 * (0.12 + 0.3 * dawn);
    g.fillStyle = '#ff9a55';
    g.fill();
    g.globalAlpha = a0 * (0.35 + 0.65 * dawn);
    g.strokeStyle = C.amberHi;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    const turn = reduced ? 0 : t * 0.9;
    for (let i = 0; i < 10; i++) {
      const a = turn + (i * Math.PI) / 5;
      const r1 = r + 4 + (i % 2 === 0 ? 5 : 2) * dawn;
      g.moveTo(cx + Math.cos(a) * (r + 2), cy + Math.sin(a) * (r + 2));
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    g.stroke();
    g.lineCap = 'butt';
    g.globalAlpha = a0;
  }
  if (face) g.drawImage(face, cx - r - 2, cy - r - 2, (r + 2) * 2, (r + 2) * 2);
  else {
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fillStyle = hot ? '#5a3a40' : TRACK;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = C.muted;
    g.stroke();
  }
  // the night used so far, as a wedge
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
  g.closePath();
  g.fillStyle = hot ? 'rgba(255,170,90,0.55)' : 'rgba(124,255,203,0.28)';
  g.fill();
  const a = -Math.PI / 2 + Math.PI * 2 * k;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.strokeStyle = C.text;
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5));
  g.stroke();
  g.lineCap = 'butt';
  // Label and digits sit on the chip's centre line so any height >= 52 keeps the 22 px digits
  // inside the border, and both squeeze to the width right of the dial.
  const tx = x + 58;
  const tw = Math.max(20, w - 58 - 10);
  text(g, hot ? 'SUNRISE!' : 'SHIFT', tx, cy - 11, 12, hot ? C.amberHi : C.muted, 'left', 900, false, tw);
  text(g, time, tx, cy + 9, 22, hot ? C.amberHi : C.text, 'left', 800, false, tw);
}
