// Workarounds for PixiJS 8.22 bugs, applied once when the renderer starts: the batching bug below,
// the prepare queue (`patchPrepare`) and solo Graphics redraws (`patchGraphicsPipe`). Remove the
// batching one when the pinned Pixi includes the upstream fix (pixijs/pixijs#12382 or #12319, for
// #12295).
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

interface Destroyable {
  destroyed?: boolean;
}

interface PrepareUploads {
  uploadQueueItem(item: Destroyable | null): void;
  uploadTextureSource(source: Destroyable | null): void;
}

/**
 * `renderer.prepare` drains a shared queue a few items per tick. An item destroyed while it waits
 * (a scene disposed mid-upload) throws in `GlTextureSystem.initSource` ("reading 'addressModeU'" or
 * "'source'"), and the throw also stops the queue from rescheduling, so it never drains again.
 * Skip destroyed items, and never let one upload stop the queue. `SceneManager` also cancels a
 * replaced view's items; this is the safety net.
 */
function patchPrepare(renderer: Renderer): void {
  const prepare = (renderer as unknown as { prepare?: PrepareUploads }).prepare;
  if (!prepare || typeof prepare.uploadQueueItem !== 'function') return;
  const uploadItem = prepare.uploadQueueItem.bind(prepare);
  const uploadSource = prepare.uploadTextureSource.bind(prepare);
  let warned = false;
  prepare.uploadQueueItem = (item) => {
    if (!item || item.destroyed) return;
    try {
      uploadItem(item);
    } catch (e) {
      // drawn lazily on first render instead; keep the rest of the queue going
      if (!warned) console.warn('[night-shift] skipped a GPU upload', e);
      warned = true;
    }
  };
  // graphics contexts upload their fill textures through this too
  prepare.uploadTextureSource = (source) => {
    if (!source || source.destroyed) return;
    uploadSource(source);
  };
}

interface SoloStamped {
  context: unknown;
  /** Whether the current instruction build added this Graphics to a batch (false: drawn on its own). */
  __nsBatched?: boolean;
}

interface GraphicsPipeLike {
  addRenderable(g: SoloStamped, instructionSet: unknown): void;
  validateRenderable(g: SoloStamped): boolean;
}

/**
 * A Graphics that changes geometry asks for a rebuild of its whole render group when it is batched.
 * One drawn on its own (`context.batchMode = 'no-batch'`, see `Shape`) only needs its own geometry
 * re-uploaded, but Pixi 8.22 tests `!!graphics._gpuData`, which is always true, so it rebuilds every
 * time too. Remember how each Graphics went into the build and skip the rebuild while it stays solo.
 */
function patchGraphicsPipe(renderer: Renderer): void {
  const pipe = (renderer.renderPipes as unknown as { graphics?: GraphicsPipeLike }).graphics;
  const contexts = (renderer as unknown as { graphicsContext?: { updateGpuContext(c: unknown): { isBatchable: boolean } } }).graphicsContext;
  if (!pipe || !contexts || typeof pipe.validateRenderable !== 'function') return;
  const add = pipe.addRenderable.bind(pipe);
  const validate = pipe.validateRenderable.bind(pipe);
  pipe.addRenderable = (g, instructionSet) => {
    add(g, instructionSet);
    g.__nsBatched = contexts.updateGpuContext(g.context).isBatchable;
  };
  pipe.validateRenderable = (g) => {
    if (g.__nsBatched !== false) return validate(g);
    // solo in this build: rebuild only if it would now go into a batch
    return contexts.updateGpuContext(g.context).isBatchable;
  };
}

/** Apply the workarounds to a freshly created renderer. */
export function applyPixiFixes(renderer: Renderer): void {
  patchBatcher();
  patchPrepare(renderer);
  patchGraphicsPipe(renderer);
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
