// Workarounds for a PixiJS 8.22 batching bug, applied once when the renderer starts. Remove them
// when the pinned Pixi includes the upstream fix (pixijs/pixijs#12382 or #12319, for #12295).
//
// The bug: when a container stops being part of the instruction build (hidden, unmasked, a mask
// whose owner went away...), Pixi can still call `updateRenderable` for its batched children on the
// next transform change. For an element that was never batched, `_batcher` is null and the update
// throws ("Cannot read properties of null (reading 'updateElement')", seen on L7 in the e2e runs).
// For an element from an older build, the stale offset overwrites another element's vertices
// until the next rebuild. Both are skipped here: the next rebuild adds the element with its
// current state, which is what the upstream fix does.
import { Batcher, type Renderer } from 'pixi.js';

interface Stamped {
  /** The build of its batcher this element was last added to. */
  __nsBuild?: number;
}

interface CountingBatcher {
  /** Builds started on this batcher. */
  __nsBuild?: number;
}

let patched = false;

/** Make the batcher ignore updates for elements that are not part of its current build. */
function patchBatcher(): void {
  if (patched) return;
  patched = true;
  const proto = Batcher.prototype as unknown as {
    begin(this: CountingBatcher): void;
    add(this: CountingBatcher, el: Stamped): void;
    updateElement(this: CountingBatcher, el: Stamped): void;
  };
  const begin = proto.begin;
  const add = proto.add;
  const updateElement = proto.updateElement;
  proto.begin = function (this: CountingBatcher) {
    this.__nsBuild = (this.__nsBuild ?? 0) + 1;
    begin.call(this);
  };
  proto.add = function (this: CountingBatcher, el: Stamped) {
    el.__nsBuild = this.__nsBuild;
    add.call(this, el);
  };
  proto.updateElement = function (this: CountingBatcher, el: Stamped) {
    if (el.__nsBuild !== this.__nsBuild) return;
    updateElement.call(this, el);
  };
}

interface TextPipe {
  updateRenderable(text: unknown): void;
  _getGpuText(text: unknown): { _batcher: unknown | null };
}

/** Apply the workarounds to a freshly created renderer. */
export function applyPixiFixes(renderer: Renderer): void {
  patchBatcher();
  // the text pipe reads `_batcher.updateElement` itself, so a never-batched text throws before the
  // batcher can ignore it
  const text = (renderer.renderPipes as unknown as { text?: TextPipe }).text;
  if (text && typeof text._getGpuText === 'function') {
    const update = text.updateRenderable.bind(text);
    text.updateRenderable = (t: unknown) => {
      if (text._getGpuText(t)._batcher) update(t);
    };
  }
}
