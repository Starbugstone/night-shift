import { Container, DOMAdapter, Text } from 'pixi.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SPOT_CAUSES, type SpotCause } from '../src/flight/hazards';
import { SpottedPhoto, WitnessView } from '../src/flight/spotted';
import { LANGS, setLang, tr } from '../src/i18n';

// Run the real retained displays in Node. Only texture rasterization and the GL probe need a stub.
vi.mock('../src/core/gfx/textures', async (original) => {
  const { Texture } = await import('pixi.js');
  return { ...await original<typeof import('../src/core/gfx/textures')>(), paintedTexture: () => Texture.WHITE };
});

const adapter = DOMAdapter.get();
beforeAll(() => {
  DOMAdapter.set({ ...adapter, createCanvas: () => ({ getContext: () => null }) as unknown as HTMLCanvasElement });
});
afterAll(() => {
  DOMAdapter.set(adapter);
  setLang('en');
});

function visibleLayers(container: Container, prefix: string): string[] {
  return container.children.filter(child => child.label?.startsWith(prefix) && child.visible)
    .map(child => child.label);
}

describe.each(LANGS)('SPOTTED art (%s)', (lang) => {
  it('draws one lens, witness and localized caption for every cause in sequence', () => {
    setLang(lang);
    const photo = new SpottedPhoto();
    const witness = new WitnessView();
    const image = photo.root.getChildByLabel('photo image')!;
    const people = witness.root.getChildByLabel('witness art')!;
    const caption = photo.root.getChildByLabel('exhibit caption');
    if (!(caption instanceof Text)) throw new Error('Missing photo caption');
    const rec = image.getChildByLabel('recording light')!;
    const unknown = 'futureDetector' as SpotCause;
    const cases = [...SPOT_CAUSES, unknown, 'eraPolice'] as const;
    try {
      for (const cause of cases) {
        const expectedCause = cause === unknown ? 'watcher' : cause;
        photo.sync(cause, 1.2, 2, false, '10:04');
        witness.sync(cause, 1, 2, false, '!');
        expect(visibleLayers(image, 'lens ')).toEqual([`lens ${expectedCause}`]);
        expect(visibleLayers(people, 'witness ')).toEqual([`witness ${expectedCause}`]);
        expect(caption.text).toBe(tr().flight.photo.labels[expectedCause]);
        expect(caption.text.trim()).not.toBe('');
        if (cause === 'eraLight' || cause === 'eraPolice') expect(rec.visible).toBe(true);
        if (cause === 'eraWatcher' || cause === unknown) expect(rec.visible).toBe(false);
      }
    } finally {
      photo.dispose();
      photo.root.destroy({ children: true });
      witness.root.destroy({ children: true });
    }
  });
});
