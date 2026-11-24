import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { PointerState, Scene } from '../src/contracts';
import { SceneManager } from '../src/core/scenes';

function fakeScene(log: string[], name: string): Scene {
  return {
    view: new Container(),
    update: () => void log.push(`u:${name}`),
    render: () => {},
    dispose: () => void log.push(`d:${name}`),
  };
}

describe('scene manager', () => {
  it('builds the next scene at the fade midpoint and disposes the old one', () => {
    const p: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
    const layer = new Container();
    const sm = new SceneManager(p, () => false, layer);
    const log: string[] = [];
    sm.go('a', () => fakeScene(log, 'a'), true);
    sm.update(0.01);
    expect(sm.name).toBe('a');
    let built = false;
    let current: Container | null = null;
    sm.go('b', () => {
      built = true;
      const s = fakeScene(log, 'b');
      current = s.view;
      return s;
    });
    sm.update(0.05);
    expect(built).toBe(false);
    expect(sm.transitioning).toBe(true);
    sm.update(0.2);
    expect(built).toBe(true);
    expect(sm.name).toBe('b');
    expect(log).toContain('d:a');
    // only the live scene's view is mounted
    expect(layer.children).toEqual([current]);
    // taps are swallowed while fading in
    p.pressed = true;
    sm.update(0.01);
    expect(p.pressed).toBe(false);
    sm.update(0.3);
    expect(sm.transitioning).toBe(false);
  });
});
