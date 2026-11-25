import { apeFallback } from '../../abduct/monolith-art';
import { Container, Graphics } from 'pixi.js';
import { ART } from '../../art-manifest';
import type { Assets } from '../../contracts';
import { bodyPlanFor } from '../../abduct/body-plan';
import { Joint } from '../../abduct/ragdoll';
import { roundRect } from '../../core/gfx/shapes';
import { CARD_H, CARD_W, WINDOW, fitPhoto, type Photo } from '../report-photo';
import { artSprite } from './art';

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

function bone(assets: Assets, photo: Photo, key: string, color: string, a: Joint, b: Joint, head: boolean): Container | null {
  let x = photo.x[a]!;
  let y = photo.y[a]!;
  if (key.endsWith('_upper_arm')) {
    x += (photo.x[Joint.Pelvis]! - x) * 0.15;
    y += (photo.y[Joint.Pelvis]! - y) * 0.15;
  }
  const dx = photo.x[b]! - x;
  const dy = photo.y[b]! - y;
  if (!Number.isFinite(x + y + dx + dy)) return null;

  const spec = ART[key] ?? { w: 30, h: 60 };
  const art = artSprite(assets, key, spec.w, spec.h) ?? apeFallback(key, spec.w, spec.h);
  const left = -spec.w * 0.5;
  const top = head ? -spec.h : -5;
  const part = new Container();
  part.position.set(x, y);
  part.rotation = Math.atan2(dy, dx) + (head ? Math.PI / 2 : -Math.PI / 2);
  if (art) {
    art.y = top + spec.h / 2;
    part.addChild(art);
  } else {
    const g = roundRect(new Graphics(), left + 2, top + 2, spec.w - 4, spec.h - 4, head ? 26 : 12)
      .fill(color).stroke({ color: INK, width: 3 });
    if (head) g.ellipse(-12, -47, 4, 6).ellipse(12, -47, 4, 6).fill(INK).ellipse(6, -27, 6, 8).fill('#76434c');
    part.addChild(g);
  }
  return part;
}

function humanPose(parent: Container, assets: Assets, photo: Photo): void {
  const base = 'human/' + photo.human + '_';
  for (const [a, b, part, far] of HUMAN_BONES) {
    const limb = bone(assets, photo, base + part, PART_COLORS[part]!, a, b, false);
    if (!limb) continue;
    limb.alpha = far ? 0.73 : 1;
    parent.addChild(limb);
  }
  const awake = assets.get(base + 'head_awake') ? base + 'head_awake' : base + 'head';
  const head = bone(assets, photo, awake, PART_COLORS.head!, Joint.Neck, Joint.Head, true);
  if (head) parent.addChild(head);
}

/** Dolphin silhouette, or a simple chain for an unrecognized joint count. */
function stickPose(photo: Photo): Graphics {
  const g = new Graphics();
  const n = Math.min(photo.x.length, photo.y.length);
  if (n === 0) return g;
  const plan = bodyPlanFor(photo.human);
  const own = plan.joints === n;
  const bones = own ? plan.bones : n - 1;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < bones; i++) {
      const a = own ? plan.boneA[i]! : i;
      const b = own ? plan.boneB[i]! : i + 1;
      const ax = photo.x[a]!;
      const ay = photo.y[a]!;
      const bx = photo.x[b]!;
      const by = photo.y[b]!;
      if (!Number.isFinite(ax + ay + bx + by)) continue;
      const width = (own ? plan.midRadii[i]! * 2 : 22) + (pass === 0 ? 7 : 0);
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ color: pass === 0 ? INK : '#8fa6d4', width, cap: 'round' });
    }
  }
  const eye = own ? plan.boneB[0]! : 0;
  const from = own ? plan.boneA[0]! : Math.min(1, n - 1);
  const ex = photo.x[eye]!;
  const ey = photo.y[eye]!;
  const dx = photo.x[from]! - ex;
  const dy = photo.y[from]! - ey;
  const d = Math.hypot(dx, dy) || 1;
  // The eye sits a little back from the tip, on the upper side of the bone.
  if (Number.isFinite(ex + ey + dx + dy)) g.circle(ex + (dx / d) * 14 + (dy / d) * 8, ey + (dy / d) * 14 - (dx / d) * 8, 5).fill(INK);
  return g;
}

/** Bureau ID card at its final display size, with a masked window and a retained pose. */
export function idPhoto(assets: Assets, photo: Photo | undefined, k: number): Container {
  const root = new Container();
  const w = CARD_W * k;
  const h = CARD_H * k;
  const frame = artSprite(assets, 'ui/id_photo_frame', w, h);
  if (!frame) {
    const background = roundRect(new Graphics(), 0, 0, w, h, 12 * k).fill('#eef3fb').stroke({ color: INK, width: 3 });
    const by = (WINDOW.y + WINDOW.h + 14) * k;
    for (let i = 0, bx = 26 * k; bx < w - 26 * k; i++) {
      const bw = ((i * 7) % 3 === 0 ? 3 : 1.5) * k;
      background.rect(bx, by, bw, 30 * k);
      bx += bw + ((i * 5) % 4 === 0 ? 3 : 2) * k;
    }
    background.fill(INK);
    root.addChild(background);
  }
  const wx = WINDOW.x * k;
  const wy = WINDOW.y * k;
  const ww = WINDOW.w * k;
  const wh = WINDOW.h * k;
  const backdrop = new Graphics().rect(wx, wy, ww, wh).fill('#c9d7ee');
  for (let i = 1; i < 6; i++) backdrop.rect(wx, wy + (wh * i) / 6, ww, 1.5);
  backdrop.fill('rgba(29,22,49,0.13)');
  root.addChild(backdrop);

  if (photo) {
    const fit = fitPhoto(photo, WINDOW.w, WINDOW.h);
    const mask = new Graphics().rect(wx, wy, ww, wh).fill('#ffffff');
    const pose = new Container();
    pose.position.set(wx + fit.ox * k, wy + fit.oy * k);
    pose.scale.set(fit.scale * k);
    if (Math.min(photo.x.length, photo.y.length) === HUMAN_JOINTS && bodyPlanFor(photo.human).kind === 'human') humanPose(pose, assets, photo);
    else pose.addChild(stickPose(photo));
    pose.mask = mask;
    root.addChild(mask, pose);
  }

  if (frame) {
    frame.position.set(w / 2, h / 2);
    root.addChild(frame);
  } else root.addChild(new Graphics().rect(wx, wy, ww, wh).stroke({ color: INK, width: 2 }));
  return root;
}
