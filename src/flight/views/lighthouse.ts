import { Container, Graphics } from 'pixi.js';
import { GLOW, glowTexture, Glow } from '../../core/gfx/glow';
import { wrapAngle } from '../geometry';
import { shadowsOf, type LighthouseHazard, type ShadowWedges } from '../lighthouse';
import { dashedLine, sectorPath } from './tells';
import { TAU } from './world';

function wedgePath(g: Graphics, r0: number, r1: number, a0: number, a1: number): Graphics {
  if (a1 - a0 >= TAU && r0 === 0) return g.circle(0, 0, r1);
  g.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0)
    .lineTo(Math.cos(a0) * r1, Math.sin(a0) * r1).arc(0, 0, r1, a0, a1);
  if (r0 > 0) g.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0).arc(0, 0, r0, a1, a0, true);
  else g.lineTo(0, 0);
  return g.closePath();
}

/** Precompute the complement of the shadow wedges as disjoint lit sectors. */
function clearWaterMask(wedges: ShadowWedges, range: number): Graphics {
  const norm = (a: number): number => (a + TAU) % TAU;
  const edges = [0, TAU];
  for (let i = 0; i < wedges.count; i++) {
    edges.push(norm(wedges.angle[i]! - wedges.width[i]!), norm(wedges.angle[i]! + wedges.width[i]!));
  }
  edges.sort((a, b) => a - b);
  const mask = new Graphics();
  for (let i = 0; i + 1 < edges.length; i++) {
    const a0 = edges[i]!;
    const a1 = edges[i + 1]!;
    if (a1 - a0 < 1e-8) continue;
    const probe = (a0 + a1) / 2;
    const blockers: number[] = [];
    for (let j = 0; j < wedges.count; j++) {
      if (Math.abs(wrapAngle(probe - wedges.angle[j]!)) <= wedges.width[j]!) blockers.push(j);
    }
    blockers.sort((a, b) => wedges.near[a]! - wedges.near[b]!);
    let r = 0;
    for (const j of blockers) {
      const start = Math.min(range, wedges.near[j]!);
      if (start > r) wedgePath(mask, r, start, a0, a1).fill(0xffffff);
      r = Math.max(r, wedges.far[j]!);
    }
    if (r < range) wedgePath(mask, r, range, a0, a1).fill(0xffffff);
  }
  return mask;
}

/** The rotating light and its rays are cut by the same fixed radial wedges the simulation uses. */
export class LighthouseView {
  readonly root = new Container();
  readonly shadows = new Graphics();
  private readonly sweep = new Container();
  private readonly edge = new Graphics();
  private readonly hotEdge = new Graphics();

  constructor(d: LighthouseHazard) {
    this.root.position.set(d.x, d.y);
    this.shadows.position.set(d.x, d.y);
    const wedges = shadowsOf(d);
    for (let i = 0; i < wedges.count; i++) {
      const a0 = wedges.angle[i]! - wedges.width[i]!;
      const a1 = wedges.angle[i]! + wedges.width[i]!;
      wedgePath(this.shadows, wedges.near[i]!, wedges.far[i]!, a0, a1);
    }
    this.shadows.fill({ color: '#060a16', alpha: 0.34 });
    const fill = sectorPath(new Graphics(), d.range, -d.half, d.half).fill({ color: '#fff0cd', alpha: 0.22 });
    fill.blendMode = 'add';
    for (let side = -1; side <= 1; side += 2) {
      const a = d.half * side;
      const x = Math.cos(a) * d.range;
      const y = Math.sin(a) * d.range;
      this.edge.moveTo(0, 0).lineTo(x, y);
      this.hotEdge.moveTo(0, 0).lineTo(x, y);
    }
    this.edge.stroke({ color: '#fff0cd', width: 3.5, alpha: 0.75 });
    this.hotEdge.stroke({ color: '#ff697d', width: 5.5 });
    const turn = TAU / d.period;
    const lead = Math.sign(turn) * d.half + turn * d.lead;
    const ghost = dashedLine(new Graphics(), 0, 0, Math.cos(lead) * d.range, Math.sin(lead) * d.range, 16, 12)
      .stroke({ color: '#ffd081', width: 3 });
    this.sweep.addChild(fill, this.edge, this.hotEdge, ghost);
    const mask = clearWaterMask(wedges, d.range + 8);
    this.sweep.mask = mask;
    this.root.addChild(mask, this.sweep, new Glow(glowTexture(GLOW.amber), true).place(0, 0, 46, 46, 0.95));
  }

  sync(a: number, hot: number): void {
    this.sweep.rotation = a;
    this.edge.visible = hot <= 0;
    this.hotEdge.visible = hot > 0;
    this.hotEdge.alpha = hot;
  }
}
