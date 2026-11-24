// How a scene owns its Pixi display tree. The scene keeps the logic (update, input, state); a
// separate view class builds the display objects once and `sync()`s them to the scene each frame.
// The view is built lazily on first use, so headless tests (which only call `update`) never touch
// Pixi, the DOM or textures.
import type { Container } from 'pixi.js';

export interface SceneView {
  /** Everything the view draws, in logical 540×960 coordinates. */
  readonly root: Container;
  /** Bring the display objects up to date. Set properties only; build nothing here. */
  sync(): void;
  /** Free anything the view made that is not a child of `root` (render textures, listeners). */
  dispose?(): void;
}

/**
 * Lazily built view for a scene:
 *
 *   private readonly look = new ViewSlot(() => new TitleView(this));
 *   get view(): Container { return this.look.get().root; }
 *   render(): void { this.look.peek()?.sync(); }
 *   dispose(): void { this.look.destroy(); }
 */
export class ViewSlot<V extends SceneView> {
  private v: V | null = null;

  constructor(private readonly make: () => V) {}

  /** The view, built on first call. */
  get(): V {
    return (this.v ??= this.make());
  }

  /** The view if it has been built (render before mount is a no-op). */
  peek(): V | null {
    return this.v;
  }

  /** Destroy the view and its display objects. Shared textures are left alone. */
  destroy(): void {
    const v = this.v;
    if (!v) return;
    this.v = null;
    v.dispose?.();
    v.root.destroy({ children: true });
  }
}
