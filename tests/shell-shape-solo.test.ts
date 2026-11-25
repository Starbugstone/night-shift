import { Texture, TextureSource, type Graphics } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';
import { Shape, tickShapeClock } from '../src/core/gfx/shapes';

const box = (k: number) => (g: Graphics) => g.rect(0, 0, k, 4).fill(0xffffff);

describe('Shape batching', () => {
  afterEach(() => tickShapeClock(0));

  it('stays batched while static and draws on its own once it changes three frames in a second', () => {
    tickShapeClock(1000);
    const still = new Shape().draw(1, box(10));
    tickShapeClock(1016);
    still.draw(1, box(10));
    expect(still.context.batchMode).toBe('auto');
    const arc = new Shape();
    for (let k = 1; k <= 2; k++) {
      tickShapeClock(1000 + 16 * k);
      arc.draw(k, box(k));
    }
    expect(arc.context.batchMode).toBe('auto');
    tickShapeClock(1048);
    arc.draw(3, (g) => g.rect(0, 0, 3, 4).stroke({ color: 0xffffff, width: 2 }));
    expect(arc.context.batchMode).toBe('no-batch');
  });

  it('stays batched when its redraws are rare (a layout, a language switch)', () => {
    const rare = new Shape();
    for (let k = 1; k <= 6; k++) {
      tickShapeClock(k * 900);
      rare.draw(k, box(k));
    }
    expect(rare.context.batchMode).toBe('auto');
    // several redraws in one frame (construction, first sync) count once
    const init = new Shape();
    tickShapeClock(20000);
    for (let k = 1; k <= 3; k++) init.draw(k, box(k));
    tickShapeClock(20016);
    init.draw(4, box(4));
    expect(init.context.batchMode).toBe('auto');
  });

  it('goes back into the batch once it settles', () => {
    const tell = new Shape();
    for (let k = 1; k <= 3; k++) {
      tickShapeClock(5000 + 16 * k);
      tell.draw(k, box(k));
    }
    expect(tell.context.batchMode).toBe('no-batch');
    tickShapeClock(6000);
    tell.draw(3, box(3));
    expect(tell.context.batchMode).toBe('no-batch');
    tickShapeClock(9000);
    tell.draw(3, box(3));
    expect(tell.context.batchMode).toBe('auto');
    expect(tell.context.dirty).toBe(true);
  });

  it('can opt out', () => {
    const iris = new Shape();
    iris.canGoSolo = false;
    for (let k = 1; k <= 8; k++) {
      tickShapeClock(16 * k);
      iris.draw(k, box(k));
    }
    expect(iris.context.batchMode).toBe('auto');
  });

  it('keeps a textured shape batched', () => {
    const texture = new Texture({ source: new TextureSource({ width: 4, height: 4 }) });
    const beam = new Shape();
    for (let k = 1; k <= 4; k++) {
      tickShapeClock(16 * k);
      beam.draw(k, (g) => g.rect(0, 0, k, 4).fill({ texture }));
    }
    expect(beam.context.batchMode).toBe('auto');
  });
});
