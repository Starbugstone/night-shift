// Bureau ID photo on the report (docs/GDD-3-new-shifts.md "Report additions" A): the specimen's
// wildest pose from the abduction (src/abduct/photo.ts), redrawn with the abduction's own part
// sprites inside the ID card frame. Any other joint count (the dolphin's body plan) is drawn as a
// clean stick figure. Every piece has a primitive fallback.
import { ART } from '../art-manifest';
import type { AbductResult, Assets } from '../contracts';
import { bodyPlanFor } from '../abduct/body-plan';
import { Joint } from '../abduct/ragdoll';
import { roundRectPath } from './draw';

export type Photo = NonNullable<AbductResult['photo']>;

/** Card art size (manifest `ui/id_photo_frame`) and its photo window, in card px. */
export const CARD_W = 220;
export const CARD_H = 260;
export const WINDOW = { x: 22, y: 22, w: 176, h: 176 } as const;

const INK = '#1d1631';
const HUMAN_JOINTS = 11;

/** Human bones in the abduction's draw order: [from, to, part, far side]. */
const HUMAN_BONES: ReadonlyArray<readonly [Joint, Joint, string, boolean]> = [
  [Joint.Neck, Joint.FarElbow, 'upper_arm', true],
  [Joint.FarElbow, Joint.FarHand, 'lower_arm', true],
  [Joint.Pelvis, Joint.FarKnee, 'upper_leg', true],
  [Joint.FarKnee, Joint.FarFoot, 'lower_leg', true],
  [Joint.Pelvis, Joint.NearKnee, 'upper_leg', false],
  [Joint.NearKnee, Joint.NearFoot, 'lower_leg', false],
  [Joint.Neck, Joint.Pelvis, 'torso', false],
  [Joint.Neck, Joint.NearElbow, 'upper_arm', false],
  [Joint.NearElbow, Joint.NearHand, 'lower_arm', false],
];
const PART_COLORS: Readonly<Record<string, string>> = {
  upper_arm: '#6f8fd8',
  lower_arm: '#c18b77',
  upper_leg: '#4b4f7d',
  lower_leg: '#4b4f7d',
  torso: '#6f8fd8',
  head: '#d5a182',
};

/** Scale and offset that fit the pose into the photo window (computed once per report). */
export interface PhotoFit {
  scale: number;
  /** Window-space position of the pose origin (the chest). */
  ox: number;
  oy: number;
}

/** Fit the pose's joints (plus a margin for limb sprites) into a `w`×`h` window. */
export function fitPhoto(photo: Photo, w: number, h: number): PhotoFit {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const n = Math.min(photo.x.length, photo.y.length);
  for (let i = 0; i < n; i++) {
    const x = photo.x[i]!;
    const y = photo.y[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (minX > maxX) return { scale: 0.5, ox: w / 2, oy: h / 2 };
  // the head sprite reaches ~80 px past the head joint; limbs are ~30 px wide
  const pad = 46;
  const bw = maxX - minX + pad * 2;
  const bh = maxY - minY + pad * 2;
  const scale = Math.min(0.62, (w * 0.96) / bw, (h * 0.96) / bh);
  return { scale, ox: w / 2 - ((minX + maxX) / 2) * scale, oy: h / 2 - ((minY + maxY) / 2) * scale };
}

function bone(g: CanvasRenderingContext2D, assets: Assets, photo: Photo, key: string, color: string, a: number, b: number, head: boolean): void {
  let x = photo.x[a]!;
  let y = photo.y[a]!;
  if (key.endsWith('_upper_arm')) {
    x += (photo.x[Joint.Pelvis]! - x) * 0.15;
    y += (photo.y[Joint.Pelvis]! - y) * 0.15;
  }
  const spec = ART[key] ?? { w: 30, h: 60 };
  g.save();
  g.translate(x, y);
  g.rotate(Math.atan2(photo.y[b]! - y, photo.x[b]! - x) + (head ? Math.PI / 2 : -Math.PI / 2));
  const left = -spec.w * 0.5;
  const top = head ? -spec.h : -5;
  const img = assets.get(key);
  if (img) g.drawImage(img, left, top, spec.w, spec.h);
  else {
    roundRectPath(g, left + 2, top + 2, spec.w - 4, spec.h - 4, head ? 26 : 12);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.stroke();
    if (head) {
      // eyes wide open: it is the wildest moment of their night
      g.fillStyle = INK;
      g.beginPath();
      g.ellipse(-12, -47, 4, 6, 0, 0, Math.PI * 2);
      g.ellipse(12, -47, 4, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#76434c';
      g.beginPath();
      g.ellipse(6, -27, 6, 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

function drawHuman(g: CanvasRenderingContext2D, assets: Assets, photo: Photo): void {
  const base = 'human/' + photo.human + '_';
  for (const [a, b, part, far] of HUMAN_BONES) {
    g.globalAlpha = far ? 0.73 : 1;
    bone(g, assets, photo, base + part, PART_COLORS[part]!, a, b, false);
  }
  g.globalAlpha = 1;
  // awake head: nobody looks asleep in a passport photo
  const awake = assets.get(base + 'head_awake') ? base + 'head_awake' : base + 'head';
  bone(g, assets, photo, awake, PART_COLORS.head!, Joint.Neck, Joint.Head, true);
}

/**
 * Any other body plan (the dolphin): a soft silhouette of the plan's own bones and joint volumes,
 * with an eye on the end of its first bone (snout or head). Joints chained in order if the plan
 * does not match the joint count.
 */
function drawStick(g: CanvasRenderingContext2D, photo: Photo): void {
  const n = Math.min(photo.x.length, photo.y.length);
  if (n === 0) return;
  const plan = bodyPlanFor(photo.human);
  const own = plan.joints === n;
  const bones = own ? plan.bones : n - 1;
  g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    g.strokeStyle = pass === 0 ? INK : '#8fa6d4';
    for (let i = 0; i < bones; i++) {
      const a = own ? plan.boneA[i]! : i;
      const b = own ? plan.boneB[i]! : i + 1;
      g.lineWidth = (own ? plan.midRadii[i]! * 2 : 22) + (pass === 0 ? 7 : 0);
      g.beginPath();
      g.moveTo(photo.x[a]!, photo.y[a]!);
      g.lineTo(photo.x[b]!, photo.y[b]!);
      g.stroke();
    }
  }
  const eye = own ? plan.boneB[0]! : 0;
  const from = own ? plan.boneA[0]! : Math.min(1, n - 1);
  const ex = photo.x[eye]!;
  const ey = photo.y[eye]!;
  // the eye sits a little back from the tip, on the upper side of the bone
  const dx = photo.x[from]! - ex;
  const dy = photo.y[from]! - ey;
  const d = Math.hypot(dx, dy) || 1;
  g.fillStyle = INK;
  g.beginPath();
  g.arc(ex + (dx / d) * 14 + (dy / d) * 8, ey + (dy / d) * 14 - (dx / d) * 8, 5, 0, Math.PI * 2);
  g.fill();
}

/** The card frame and pose, card top-left at (x, y), drawn at `k` × the manifest size. */
export function drawIdPhoto(g: CanvasRenderingContext2D, assets: Assets, photo: Photo | undefined, fit: PhotoFit | null, x: number, y: number, k: number): void {
  const w = CARD_W * k;
  const h = CARD_H * k;
  const frame = assets.get('ui/id_photo_frame');
  if (!frame) {
    roundRectPath(g, x, y, w, h, 12 * k);
    g.fillStyle = '#eef3fb';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.stroke();
    // fake barcode under the window
    g.fillStyle = INK;
    const by = y + (WINDOW.y + WINDOW.h + 14) * k;
    const bh = 30 * k;
    for (let i = 0, bx = x + 26 * k; bx < x + w - 26 * k; i++) {
      const bw = (i * 7) % 3 === 0 ? 3 * k : 1.5 * k;
      g.fillRect(bx, by, bw, bh);
      bx += bw + ((i * 5) % 4 === 0 ? 3 : 2) * k;
    }
  }
  // the window: backdrop with height lines, then the specimen, clipped
  const wx = x + WINDOW.x * k;
  const wy = y + WINDOW.y * k;
  const ww = WINDOW.w * k;
  const wh = WINDOW.h * k;
  g.save();
  g.beginPath();
  g.rect(wx, wy, ww, wh);
  g.clip();
  g.fillStyle = '#c9d7ee';
  g.fillRect(wx, wy, ww, wh);
  g.fillStyle = 'rgba(29,22,49,0.13)';
  for (let i = 1; i < 6; i++) g.fillRect(wx, wy + (wh * i) / 6, ww, 1.5);
  if (photo && fit) {
    g.translate(wx + fit.ox * k, wy + fit.oy * k);
    g.scale(fit.scale * k, fit.scale * k);
    if (photo.x.length === HUMAN_JOINTS && bodyPlanFor(photo.human).kind === 'human') drawHuman(g, assets, photo);
    else drawStick(g, photo);
  }
  g.restore();
  if (frame) g.drawImage(frame, x, y, w, h);
  else {
    g.lineWidth = 2;
    g.strokeStyle = INK;
    g.strokeRect(wx, wy, ww, wh);
  }
}
