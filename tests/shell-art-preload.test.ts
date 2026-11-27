// Boot must make no failing request: every file the asset loader asks for exists in public/art.
// Keys with only a procedural painter (PROCEDURAL_ART) stay out of the preload list; once their SVG
// lands they must go back in. Production showed nine 404s at boot before this guard (v0.2 council).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ART, PRELOAD_ART, PROCEDURAL_ART } from '../src/art-manifest';
import { AssetLoader } from '../src/core/assets';
import { paintRoom55 } from '../src/abduct/crest-valley-art';

const requested: string[] = [];

class FakeImage {
  decoding = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(url: string) {
    requested.push(url);
  }
}

/** Art files on disk (paths only, nothing is loaded). */
const FILES = new Set(Object.keys(import.meta.glob('../public/art/**/*.svg')).map((path) => path.replace('../public/art/', '')));
const hasFile = (key: string): boolean => FILES.has(`${key}.svg`);

/** A Canvas 2D stand-in that accepts every call and property write. */
const fakeContext = (): CanvasRenderingContext2D =>
  new Proxy({}, { get: () => () => undefined, set: () => true }) as unknown as CanvasRenderingContext2D;

describe('art preload', () => {
  const realImage = (globalThis as { Image?: unknown }).Image;
  beforeEach(() => {
    requested.length = 0;
    (globalThis as { Image?: unknown }).Image = FakeImage;
  });
  afterEach(() => {
    (globalThis as { Image?: unknown }).Image = realImage;
  });

  it('requests only files that exist in public/art', () => {
    const loader = new AssetLoader('/base/');
    expect(requested.length).toBe(loader.total);
    expect(requested.length).toBeGreaterThan(0);
    const missing = requested
      .map((url) => url.replace(/^\/base\/art\//, '').replace(/\.svg$/, ''))
      .filter((key) => !hasFile(key));
    expect(missing).toEqual([]);
  });

  it('requests every manifest key that has a file', () => {
    new AssetLoader('/base/');
    const asked = new Set(requested);
    const skipped = Object.keys(ART).filter((key) => hasFile(key) && !asked.has(`/base/art/${key}.svg`));
    expect(skipped).toEqual([]);
  });

  it('keeps procedural-only keys in ART, without a file and with a painter', () => {
    for (const key of PROCEDURAL_ART) {
      expect(ART[key], `${key} is not in ART`).toBeDefined();
      expect(hasFile(key), `${key} has an SVG now: take it off PROCEDURAL_ART`).toBe(false);
      const spec = ART[key]!;
      expect(paintRoom55(fakeContext(), key, spec.w, spec.h), `${key} has no procedural painter`).toBe(true);
    }
    expect(PRELOAD_ART.length + PROCEDURAL_ART.size).toBe(Object.keys(ART).length);
  });
});
