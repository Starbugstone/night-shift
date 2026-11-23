// L6: drawing Form 7-B (logic in ./probe.ts). Mint = your goal (the ring, the probed joint, the
// ticks), amber = about to happen (the reflex-kick arrow) or not done yet (the exit's empty
// checkboxes). Nothing here is ever red: an unfinished form is paperwork, not danger.
import type { Assets } from '../contracts';
import { GLOW, drawGlow, drawSprite } from '../core/fx';
import { gt, localArt } from '../i18n';
import { hudPanel } from '../ui/hud';
import { PROBE, type ProbeKind, type ProbeSim, type ProbeState } from './probe';
import type { Ragdoll } from './ragdoll';
import type { Area } from './rooms/layout';

const TAU = Math.PI * 2;
const INK = '#1a162b';
const MINT = '#7cffcb';
const AMBER = '#ffb347';
const PAPER = '#f4efe2';
const PAPER_INK = '#2a2440';
const LIGHT = '#f1eeff';
const DASH: number[] = [8, 7];
const NO_DASH: number[] = [];
const DRONE = 70;
const DRONE_KEY: Readonly<Record<ProbeKind, string>> = {
  thermo: 'room/probe_drone_thermo',
  hammer: 'room/probe_drone_hammer',
  feather: 'room/probe_drone_feather',
};
const JOINT_NAME: Readonly<Record<ProbeKind, string>> = { thermo: 'HEAD', hammer: 'KNEE', feather: 'FOOT' };
/** Lettered L6 signs that have a French variant. */
const LETTERED = new Set(['room/ticket_sign', 'room/internal_affairs_sign']);

/** The art key to load for a decor sprite: L6's lettered signs in the current language. */
export function letteredKey(key: string): string {
  return LETTERED.has(key) ? localArt(key) : key;
}

/** Where the drone hovers: beside its ring, up and to the outside. */
function droneX(d: ProbeState): number {
  return d.spec.x + d.spec.r + 22;
}
function droneY(d: ProbeState): number {
  return d.spec.y - d.spec.r * 0.55 - 16;
}

/** World layer: each drone, its ring filling in mint, the probed joint, and the reflex arrow. */
export function drawProbes(g: CanvasRenderingContext2D, probes: ProbeSim, body: Ragdoll, assets: Assets, t: number, rm: boolean): void {
  for (const d of probes.drones) {
    const { spec } = d;
    const bob = rm ? 0 : Math.sin(t * 3.1 + spec.x * 0.01) * 4;
    const dx = droneX(d);
    const dy = droneY(d) + bob;
    // the tool's reach: a thin line from the drone to the ring
    g.beginPath();
    g.moveTo(dx - 18, dy + 14);
    g.lineTo(spec.x + spec.r * 0.7, spec.y - spec.r * 0.7);
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(124,255,203,0.45)';
    g.stroke();
    // the ring
    if (d.done) {
      const k = Math.min(1, d.since / 0.5);
      if (k < 1) {
        g.globalCompositeOperation = 'lighter';
        drawGlow(g, GLOW.mint, spec.x, spec.y, spec.r * (1 + k), spec.r * (1 + k), 0.6 * (1 - k));
        g.globalCompositeOperation = 'source-over';
      }
      g.beginPath();
      g.arc(spec.x, spec.y, spec.r, 0, TAU);
      g.lineWidth = 3;
      g.strokeStyle = MINT;
      g.globalAlpha = 0.45;
      g.stroke();
      g.globalAlpha = 1;
      tick(g, spec.x, spec.y, 13, MINT);
    } else {
      g.beginPath();
      g.arc(spec.x, spec.y, spec.r, 0, TAU);
      g.fillStyle = MINT;
      g.globalAlpha = d.inside ? 0.16 : 0.07;
      g.fill();
      g.globalAlpha = 1;
      g.setLineDash(d.inside ? NO_DASH : DASH);
      g.lineDashOffset = rm ? 0 : -t * 12;
      g.lineWidth = d.inside ? 3.5 : 2.5;
      g.strokeStyle = MINT;
      g.stroke();
      g.setLineDash(NO_DASH);
      g.lineDashOffset = 0;
      if (d.fill > 0) {
        // fills like the flight lock-on
        g.beginPath();
        g.arc(spec.x, spec.y, spec.r - 6, -Math.PI / 2, -Math.PI / 2 + TAU * d.fill);
        g.lineWidth = 8;
        g.lineCap = 'round';
        g.strokeStyle = MINT;
        g.stroke();
        g.lineCap = 'butt';
      }
      // which part goes in: HEAD / KNEE / FOOT, under the drone that wants it
      label(g, gt(JOINT_NAME[spec.kind]), dx, dy + 40, 12, MINT);
      // and that part on the body, so you can find it
      const jx = body.x[d.joint]!;
      const jy = body.y[d.joint]!;
      g.beginPath();
      g.arc(jx, jy, 15, 0, TAU);
      g.lineWidth = 2.5;
      g.strokeStyle = MINT;
      g.globalAlpha = 0.5 + (rm ? 0.2 : 0.3 * Math.sin(t * 6));
      g.stroke();
      g.globalAlpha = 1;
    }
    // the reflex kick: an amber arrow beside the joint, 0.35 s before it fires
    const pending = d.kickPending;
    if (pending >= 0) {
      const jx = body.x[d.joint]!;
      const jy = body.y[d.joint]!;
      const k = 1 - pending / PROBE.kickTell;
      arrow(g, jx + d.kx * 18, jy + d.ky * 18, d.kx, d.ky, 34 + 16 * k, rm ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(t * 18)));
    }
    drawDrone(g, assets, spec.kind, dx, dy, t, rm);
  }
}

function drawDrone(g: CanvasRenderingContext2D, assets: Assets, kind: ProbeKind, x: number, y: number, t: number, rm: boolean): void {
  const img = assets.get(DRONE_KEY[kind]);
  g.globalCompositeOperation = 'lighter';
  drawGlow(g, GLOW.mint, x, y, 46, 40, 0.35);
  g.globalCompositeOperation = 'source-over';
  if (img) {
    drawSprite(g, img, x - DRONE / 2, y - DRONE / 2, DRONE, DRONE);
    return;
  }
  // fallback: a little mint Bureau drone with a propeller and its instrument
  const spin = rm ? 0.6 : Math.abs(Math.sin(t * 22));
  g.lineWidth = 2.5;
  g.strokeStyle = INK;
  g.beginPath();
  g.ellipse(x, y - 24, 22 * spin + 4, 4, 0, 0, TAU);
  g.fillStyle = '#d9d0ea';
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(x, y - 20);
  g.lineTo(x, y - 12);
  g.stroke();
  g.beginPath();
  g.roundRect(x - 18, y - 12, 36, 24, 10);
  g.fillStyle = MINT;
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(x + 6, y - 1, 4, 0, TAU);
  g.fillStyle = INK;
  g.fill();
  // the instrument, held out towards the ring (down and left)
  g.lineWidth = 4;
  g.lineCap = 'round';
  if (kind === 'thermo') {
    g.strokeStyle = '#c9a24a';
    g.beginPath();
    g.moveTo(x - 14, y + 8);
    g.lineTo(x - 30, y + 24);
    g.stroke();
    g.fillStyle = '#e8a04a';
    g.beginPath();
    g.arc(x - 31, y + 25, 4, 0, TAU);
    g.fill();
  } else if (kind === 'hammer') {
    g.strokeStyle = '#8a8fa8';
    g.beginPath();
    g.moveTo(x - 14, y + 8);
    g.lineTo(x - 28, y + 22);
    g.stroke();
    g.strokeStyle = '#e46a7a';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x - 34, y + 16);
    g.lineTo(x - 22, y + 28);
    g.stroke();
  } else {
    g.strokeStyle = '#f4efe2';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x - 14, y + 8);
    g.quadraticCurveTo(x - 34, y + 10, x - 36, y + 30);
    g.stroke();
  }
  g.lineCap = 'butt';
}

/**
 * The exit while Form 7-B is unfinished: shut (dimmed, amber dashed edge) with one amber empty
 * checkbox per missing reading and a mint tick per reading in.
 */
export function drawExitLock(g: CanvasRenderingContext2D, probes: ProbeSim, zone: Area, t: number, rm: boolean): void {
  g.fillStyle = 'rgba(10,8,40,0.5)';
  g.fillRect(zone.x, zone.y, zone.w, zone.h);
  g.setLineDash(DASH);
  g.lineDashOffset = rm ? 0 : -t * 10;
  g.lineWidth = 3;
  g.strokeStyle = AMBER;
  g.globalAlpha = 0.85;
  g.strokeRect(zone.x, zone.y, zone.w, zone.h);
  g.setLineDash(NO_DASH);
  g.lineDashOffset = 0;
  g.globalAlpha = 1;
  const n = probes.drones.length;
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  const S = 22;
  const gap = 10;
  const w = n * S + (n - 1) * gap;
  hudPanel(g, cx - w / 2 - 10, cy - S / 2 - 26, w + 20, S + 36, AMBER);
  label(g, gt('FORM 7-B'), cx, cy - S / 2 - 14, 11, AMBER);
  for (let i = 0; i < n; i++) {
    const d = probes.drones[i]!;
    const x = cx - w / 2 + i * (S + gap);
    const y = cy - S / 2 + 2;
    g.beginPath();
    g.roundRect(x, y, S, S, 4);
    g.fillStyle = '#16102e';
    g.fill();
    g.lineWidth = 2.5;
    g.strokeStyle = d.done ? MINT : AMBER;
    g.stroke();
    if (d.done) tick(g, x + S / 2, y + S / 2, 7, MINT);
  }
}

/** HUD: the tiny clipboard listing the readings ("Temperature: lukewarm ✓"). */
export function drawClipboard(g: CanvasRenderingContext2D, probes: ProbeSim, assets: Assets, x: number, y: number, w: number): void {
  const n = probes.drones.length;
  const h = 30 + n * 20;
  hudPanel(g, x, y, w, h);
  // the clipboard itself, as an icon on the left
  const img = assets.get('ui/clipboard_7b');
  if (img) drawSprite(g, img, x + 8, y + 7, 34, 42);
  else {
    g.beginPath();
    g.roundRect(x + 10, y + 9, 30, 38, 4);
    g.fillStyle = '#8a6f4a';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = PAPER;
    g.fillRect(x + 14, y + 15, 22, 28);
    g.fillStyle = '#c9cbd8';
    g.fillRect(x + 19, y + 7, 12, 6);
    g.fillStyle = PAPER_INK;
    for (let k = 0; k < 4; k++) g.fillRect(x + 17, y + 20 + k * 6, 14, 1.5);
  }
  const tx = x + 50;
  label(g, gt('FORM 7-B'), tx, y + 15, 11, LIGHT, 'left');
  for (let i = 0; i < n; i++) {
    const d = probes.drones[i]!;
    const ly = y + 34 + i * 20;
    g.beginPath();
    g.roundRect(tx, ly - 7, 14, 14, 3);
    g.lineWidth = 2;
    g.strokeStyle = d.done ? MINT : AMBER;
    g.stroke();
    if (d.done) tick(g, tx + 7, ly, 5, MINT);
    label(g, gt(d.done ? d.spec.reading : d.spec.label), tx + 20, ly, 12, d.done ? MINT : LIGHT, 'left', w - 76);
  }
}

const FONT_11 = '850 11px system-ui';
const FONT_12 = '850 12px system-ui';

function label(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: 11 | 12, color: string, align: CanvasTextAlign = 'center', maxWidth?: number): void {
  g.font = size === 11 ? FONT_11 : FONT_12;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.lineWidth = 3;
  g.strokeStyle = INK;
  g.lineJoin = 'round';
  g.strokeText(s, x, y, maxWidth);
  g.fillStyle = color;
  g.fillText(s, x, y, maxWidth);
}

function tick(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  g.beginPath();
  g.moveTo(x - r, y);
  g.lineTo(x - r * 0.3, y + r * 0.7);
  g.lineTo(x + r, y - r * 0.8);
  g.lineWidth = Math.max(2.5, r * 0.45);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = color;
  g.stroke();
  g.lineCap = 'butt';
}

function arrow(g: CanvasRenderingContext2D, x: number, y: number, ux: number, uy: number, len: number, alpha: number): void {
  const ex = x + ux * len;
  const ey = y + uy * len;
  const nx = -uy;
  const ny = ux;
  g.globalAlpha = alpha;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(ex, ey);
  g.moveTo(ex - ux * 12 + nx * 9, ey - uy * 12 + ny * 9);
  g.lineTo(ex, ey);
  g.lineTo(ex - ux * 12 - nx * 9, ey - uy * 12 - ny * 9);
  g.lineWidth = 9;
  g.strokeStyle = INK;
  g.stroke();
  g.lineWidth = 5;
  g.strokeStyle = AMBER;
  g.stroke();
  g.lineCap = 'butt';
  g.globalAlpha = 1;
}
