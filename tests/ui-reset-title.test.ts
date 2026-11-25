// v4 reset: the title's reset button and its confirmation, driven headless through taps.
import { afterEach, describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { resetSave } from '../src/core/reset';
import type { Shell } from '../src/core/shell';
import { setLang } from '../src/i18n';
import { defaultSave, type SaveData } from '../src/levels/save';
import { RESET_CARD, TitleScene } from '../src/ui/title';
import type { Button } from '../src/ui/widgets';

afterEach(() => setLang('en'));

function fakeShell(save: SaveData) {
  const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
  const calls = { reset: 0, workOrders: 0, trophies: 0 };
  const shell = {
    ctx: { pointer, assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: false },
    save,
    audio: { sfx() {} },
    input: {},
    assets: { get: () => undefined },
    setSave(s: SaveData) { shell.save = s; },
    resetProgress() { calls.reset++; shell.save = resetSave(shell.save); },
    toggleMute() {},
    setLanguage() {},
    toTitle() {},
    toWorkOrders() { calls.workOrders++; },
    toTrophies() { calls.trophies++; },
  };
  const tap = (scene: TitleScene, x: number, y: number): void => {
    Object.assign(pointer, { x, y, down: true, pressed: true, released: false });
    scene.update(1 / 60);
    Object.assign(pointer, { down: false, pressed: false, released: true });
    scene.update(1 / 60);
    pointer.released = false;
    scene.update(1 / 60);
  };
  const press = (scene: TitleScene, b: Button) => tap(scene, b.x + b.w / 2, b.y + b.h / 2);
  return { shell, calls, tap, press, asShell: shell as unknown as Shell };
}

function progressSave(): SaveData {
  const s = defaultSave();
  s.glorbs = 120;
  s.reports = 4;
  s.levels.level1 = { stars: [true, false, false, false], delivered: true, bestTimeSec: 50, attempts: 2 };
  s.muted = true;
  s.lang = 'fr';
  return s;
}

describe('title reset button', () => {
  it('is hidden on an empty save and shown with progress', () => {
    expect(new TitleScene(fakeShell(defaultSave()).asShell).reset.visible).toBe(false);
    expect(new TitleScene(fakeShell(progressSave()).asShell).reset.visible).toBe(true);
  });

  it('sits bottom-left, clear of the language and speaker buttons', () => {
    const scene = new TitleScene(fakeShell(progressSave()).asShell);
    const r = scene.reset;
    expect(r.x).toBeGreaterThanOrEqual(16);
    expect(r.y + r.h).toBeLessThanOrEqual(VIEW_H - 16);
    expect(r.h).toBeGreaterThanOrEqual(56);
    for (const b of [...scene.langs.map((l) => l.b), scene.mute, scene.trophies, scene.start]) {
      const apart = r.x + r.w <= b.x || b.x + b.w <= r.x || r.y + r.h <= b.y || b.y + b.h <= r.y;
      expect(apart).toBe(true);
    }
    // the card and its buttons fit the screen
    expect(RESET_CARD.x + RESET_CARD.w).toBeLessThanOrEqual(VIEW_W);
    for (const b of [scene.erase, scene.keep]) {
      expect(b.y).toBeGreaterThan(RESET_CARD.y);
      expect(b.y + b.h).toBeLessThan(RESET_CARD.y + RESET_CARD.h);
    }
  });

  it('a tap outside the card or on Keep closes it with nothing changed', () => {
    const f = fakeShell(progressSave());
    const scene = new TitleScene(f.asShell);
    const before = JSON.stringify(f.shell.save);
    f.press(scene, scene.reset);
    expect(scene.confirming).toBe(true);
    // the card swallows the title's own buttons while it is open: a tap where the card covers Clock in
    const under = { x: scene.start.x + scene.start.w / 2, y: (scene.start.y + RESET_CARD.y + RESET_CARD.h) / 2 };
    expect(scene.start.contains(under.x, under.y)).toBe(true);
    expect(under.y).toBeLessThan(RESET_CARD.y + RESET_CARD.h);
    f.tap(scene, under.x, under.y);
    expect(f.calls.workOrders).toBe(0);
    expect(scene.confirming).toBe(true);
    // the trophies button is outside the card: the tap only closes the card
    f.press(scene, scene.trophies);
    expect(scene.confirming).toBe(false);
    expect(f.calls.trophies).toBe(0);
    f.press(scene, scene.reset);
    expect(scene.confirming).toBe(true);
    f.press(scene, scene.keep);
    expect(scene.confirming).toBe(false);
    expect(f.calls.reset).toBe(0);
    expect(JSON.stringify(f.shell.save)).toBe(before);
    expect(scene.reset.visible).toBe(true);
  });

  it('Erase everything resets, closes the card and hides the button', () => {
    const f = fakeShell(progressSave());
    const scene = new TitleScene(f.asShell);
    f.press(scene, scene.reset);
    f.press(scene, scene.erase);
    expect(f.calls.reset).toBe(1);
    expect(scene.confirming).toBe(false);
    expect(scene.reset.visible).toBe(false);
    expect(scene.shreddedT).toBeGreaterThan(0);
    expect(f.shell.save).toEqual({ ...defaultSave(), muted: true, lang: 'fr' });
    // the hidden button no longer answers taps
    f.press(scene, scene.reset);
    expect(scene.confirming).toBe(false);
  });

  it('labels follow the language', () => {
    const scene = new TitleScene(fakeShell(progressSave()).asShell);
    setLang('en');
    scene.relabel();
    expect([scene.reset.label, scene.erase.label, scene.keep.label]).toEqual(['Reset progress', 'Erase everything', 'Keep my progress']);
    setLang('fr');
    scene.relabel();
    expect([scene.reset.label, scene.erase.label, scene.keep.label]).toEqual(['Recommencer à zéro', 'Tout effacer', 'Garder ma progression']);
  });
});
