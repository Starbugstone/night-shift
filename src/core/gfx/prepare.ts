// Incremental GPU upload of a scene's view, with a way to drop a replaced view's pending items.
//
// Pixi's `renderer.prepare` keeps one shared queue and drains it a few items per tick. A scene that
// is replaced before its upload finished still has items in that queue; once the scene is disposed
// they point at destroyed textures and graphics contexts, and uploading one throws (and the throw
// stops the queue for good). `SceneManager` cancels the old view's items before disposing it.
import type { Container, PrepareBase } from 'pixi.js';

/** The part of Pixi's `PrepareSystem` this uses (a fake in tests). */
export interface PrepareQueueLike {
  /** Pending items: texture sources, graphics contexts and texts. */
  queue: unknown[];
  upload(view: Container): Promise<void>;
  /** Pixi's own rule for which items a display object puts in the queue. */
  resolveQueueItem(source: Container, queue: unknown[]): unknown;
}

/** Uploads a freshly built scene view; cancels what is still pending for a view about to go. */
export interface ViewUploader {
  upload(view: Container): Promise<void>;
  /** Remove the view's not yet uploaded items from the queue. Call before destroying the view. */
  cancel(view: Container): void;
}

/** Wrap `renderer.prepare` (its `queue` is protected in Pixi's types, hence the cast). */
export function viewUploader(system: PrepareBase | PrepareQueueLike): ViewUploader {
  const prepare = system as unknown as PrepareQueueLike;
  const items: unknown[] = [];
  const collect = (c: Container): void => {
    prepare.resolveQueueItem(c, items);
    for (const child of c.children) collect(child);
  };
  return {
    upload: (view) => prepare.upload(view),
    cancel(view) {
      const { queue } = prepare;
      if (queue.length === 0) return;
      items.length = 0;
      collect(view);
      if (items.length === 0) return;
      const owned = new Set(items);
      items.length = 0;
      let keep = 0;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (!owned.has(item)) queue[keep++] = item;
      }
      queue.length = keep;
    },
  };
}
