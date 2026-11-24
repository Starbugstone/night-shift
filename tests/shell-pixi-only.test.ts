// Guards the Pixi migration (docs/PIXI-MIGRATION.md): screens draw through Pixi display objects,
// and Canvas 2D only ever runs inside `paintedTexture` painters, which receive their context from
// the kit. Nothing outside the kit makes a canvas or a 2D context of its own, and no scene draws
// on a context per frame.
import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';

const raw = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const files = Object.entries(raw).map(([p, text]) => ({ path: p.replace(/^\.\.\//, ''), text }));

/** The only file allowed its own 2D context: the text measurer (layout maths, never drawn). */
const OWN_CONTEXT_ALLOWED = new Set(['src/core/gfx/text.ts']);

describe('Pixi-only rendering', () => {
  it('makes no canvas or 2D context outside the kit', () => {
    const offenders = files
      .filter((f) => !OWN_CONTEXT_ALLOWED.has(f.path))
      .filter((f) => /\.getContext\(|createElement\(\s*['"]canvas['"]\s*\)/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('has no scene drawing on a canvas each frame', () => {
    const offenders = files.filter((f) => /\brender\(\s*\w+\s*\??\s*:\s*CanvasRenderingContext2D|\brender\(\s*g\s*[?)]/.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('keeps one game canvas, owned by the Pixi host', () => {
    expect(indexHtml.match(/<canvas\b/g)?.length).toBe(1);
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((f) => f.path === 'src/core/canvas.ts')).toBe(false);
  });
});
