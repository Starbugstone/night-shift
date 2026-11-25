import { Container, Graphics, Sprite, Texture, TextureSource } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { PointerState, Scene } from '../src/contracts';
import { viewUploader, type PrepareQueueLike } from '../src/core/gfx/prepare';
import { SceneManager } from '../src/core/scenes';

/** A prepare queue like Pixi's: items wait until drained, and a destroyed item would throw. */
function fakePrepare(log: string[]): PrepareQueueLike & { drain(): void } {
  const fake = {
    queue: [] as unknown[],
    resolveQueueItem(c: Container, q: unknown[]) {
      if (c instanceof Sprite) q.push(c.texture.source);
      else if (c instanceof Graphics) q.push(c.context);
      return null;
    },
    upload(view: Container) {
      const add = (c: Container): void => {
        fake.resolveQueueItem(c, fake.queue);
        for (const child of c.children) add(child);
      };
      add(view);
      log.push(`upload:${view.label}`);
      return new Promise<void>(() => {});
    },
    drain() {
      for (const item of fake.queue) {
        if ((item as { destroyed?: boolean }).destroyed) throw new Error('uploaded a destroyed item');
      }
      fake.queue.length = 0;
    },
  };
  return fake;
}

function sceneWithOwnTexture(log: string[], name: string): Scene {
  const view = new Container({ label: name });
  const own = new Texture({ source: new TextureSource({ width: 4, height: 4 }) });
  const sprite = new Sprite(own);
  const g = new Graphics().rect(0, 0, 10, 10).fill(0xffffff);
  const shared = new Sprite(Texture.WHITE);
  view.addChild(sprite, g, shared);
  return {
    view,
    update: () => {},
    render: () => {},
    dispose: () => {
      log.push(`dispose:${name}`);
      // what GroundView.destroy does: free the scene's own bitmaps and contexts
      own.destroy(true);
      view.destroy({ children: true });
    },
  };
}

describe('scene upload queue', () => {
  it('cancels a replaced scene before disposing it, so the queue never holds destroyed items', () => {
    const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
    const log: string[] = [];
    const prep = fakePrepare(log);
    const cancel = viewUploader(prep);
    const uploader = {
      upload: cancel.upload,
      cancel: (v: Container) => {
        log.push(`cancel:${v.label}`);
        cancel.cancel(v);
      },
    };
    const sm = new SceneManager(p, () => false, new Container(), null, uploader);
    sm.go('a', () => sceneWithOwnTexture(log, 'a'), true);
    expect(prep.queue.length).toBe(3);
    // replaced before its upload drained (the queue drains 4 items a tick)
    sm.go('b', () => sceneWithOwnTexture(log, 'b'), true);
    expect(log).toEqual(['upload:a', 'cancel:a', 'dispose:a', 'upload:b']);
    expect(prep.queue.some((i) => (i as { destroyed?: boolean }).destroyed)).toBe(false);
    expect(() => prep.drain()).not.toThrow();
  });

  it('keeps items that belong to other views', () => {
    const prep = fakePrepare([]);
    const up = viewUploader(prep);
    const a = new Container({ label: 'a' });
    a.addChild(new Graphics().rect(0, 0, 1, 1).fill(0));
    const b = new Container({ label: 'b' });
    const kept = new Graphics().rect(0, 0, 1, 1).fill(0);
    b.addChild(kept);
    void prep.upload(a);
    void prep.upload(b);
    up.cancel(a);
    expect(prep.queue).toEqual([kept.context]);
  });
});
