import { Container, Graphics } from 'pixi.js';
import type { Assets } from '../../contracts';
import { artSprite } from '../../ui/views/art';
import type { HumSlab } from '../monolith';

export class MonolithView {
  readonly root = new Container();
  private readonly edges: Graphics;
  private readonly belt: Graphics;

  constructor(assets: Assets, d: HumSlab) {
    const stone = artSprite(assets, 'flight/hum_slab_top', 76, 100) ?? new Graphics()
      .poly([-36,-32,18,-49,37,29,-18,49]).fill('#15131e')
      .poly([18,-49,37,29,31,27,12,-46]).fill('#837994');
    this.belt = new Graphics().circle(0, 0, (d.inner + d.outer) / 2)
      .stroke({ width: d.outer - d.inner, color: 0xffffff });
    this.edges = new Graphics().circle(0, 0, d.inner).circle(0, 0, d.outer)
      .stroke({ width: 3, color: 0xffffff });
    this.root.addChild(this.belt, this.edges, stone);
    this.root.position.set(d.x, d.y);
  }

  sync(active: boolean, warning: boolean, hot: number): void {
    this.edges.alpha = active || warning ? 1 : 0.2;
    const color = hot > 0 ? 0xff596c : warning ? 0xffc574 : active ? 0xd3c3fa : 0xb1a2b9;
    this.edges.tint = this.belt.tint = color;
    // the hum comes and goes: hide the belt with alpha (a visible flip rebuilds the render group)
    this.belt.alpha = !active ? 0 : hot > 0 ? 0.24 : 0.14;
  }
}

/** Coordinates relative to the centre, matching both entry landmarks on the painted roofs. */
export function paintApeRoof(g: CanvasRenderingContext2D, key: string, w: number, h: number): void {
  const quarry = key === 'flight/quarry_top';
  const reeds = key === 'flight/bandstand_top';
  g.scale(w / 320, h / 220);
  for (let tier = 0; tier < 3; tier++) {
    const shrink = 1 - tier * 0.13;
    g.save();
    g.scale(shrink, shrink);
    g.fillStyle = (quarry ? ['#624749','#896451','#b78c67'] : reeds ?
      ['#4a3d46','#73614f','#a49365'] : ['#444057','#65617c','#8e859c'])[tier]!;
    g.beginPath();
    g.moveTo(-154, -59); g.lineTo(-80,-105); g.lineTo(102,-94);
    g.lineTo(157,-26); g.lineTo(130,88); g.lineTo(-58,106); g.lineTo(-154,52);
    g.closePath(); g.fill(); g.restore();
  }
  g.fillStyle = '#362c3c';
  g.fillRect(-109,-53,50,17);
  g.fillRect(69,24,36,30);
  g.strokeStyle = '#d4b293';
  for (let i = 0; i < 5; i++) {
    g.beginPath(); g.moveTo(-30 + i * 13, -18); g.lineTo(-37 + i * 13, reeds ? 23 : 2); g.stroke();
  }
}

/** Shallow sediment bands span neighbouring ground chunks in world coordinates. */
export function paintBadlands(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.strokeStyle = '#513e47';
  g.lineWidth = 12;
  for (let band = Math.floor((y - 70) / 200); band <= Math.ceil((y + h + 70) / 200); band++) {
    g.beginPath();
    const first = Math.floor(x / 30) * 30 - 30;
    for (let px = first; px <= x + w + 30; px += 30) {
      const py = band * 200 + 45 * Math.sin(px / 240 + band * 1.9) + 17 * Math.sin(px / 105);
      if (px === first) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  }
}
