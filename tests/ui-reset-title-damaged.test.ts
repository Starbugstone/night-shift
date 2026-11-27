// v0.2 damaged save (user, 2026-11-27): a damaged save makes the title say so and offer its reset, even when no
// progress survived. Walks every generated damaged shape (tests/levels-save-shapes.ts) through a shell that loads,
// resets and dismisses the way src/core/game.ts does, in EN and FR: the notice and the reset button show, the
// confirmation card says the file was damaged, Erase needs its confirmation tap, and a reload after the reset (or
// after dismissing the notice) is clean and 'ok'. A save that loads 'ok' never shows the notice.
import { afterEach, describe, expect, it } from 'vitest';
import { VIEW_W } from '../src/contracts';
import { hasProgress, resetSave } from '../src/core/reset';
import type { Shell } from '../src/core/shell';
import { preprodStorage } from '../src/core/storage';
import { measure } from '../src/core/gfx/text';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { setLang, type Lang } from '../src/i18n';
import { defaultSave, loadSaveWithStatus, writeSave, type KeyValueStore, type SaveData, type SaveStatus } from '../src/levels/save';
import { NOTICE_CROSS_W, NOTICE_TEXT, RESET_CARD, SAVE_NOTICE, TitleScene, noticeText } from '../src/ui/title';
import type { Button } from '../src/ui/widgets';
import { damageCases, memStore, okCases, ownKey } from './levels-save-shapes';

afterEach(() => setLang('en'));

/** The Game's save handling (constructor, setSave, resetProgress, dismissSaveNotice) over an in-memory disk. */
function boot(disk: ReturnType<typeof memStore>, preprod: boolean) {
  const storage: KeyValueStore = preprod ? preprodStorage(disk)! : disk;
  const loaded = loadSaveWithStatus(storage);
  const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
  const sfx: string[] = [];
  const shell = {
    ctx: { pointer, assets: { get: () => undefined }, audio: { sfx: (n: string) => sfx.push(n) }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: false },
    save: loaded.save,
    saveStatus: loaded.status as SaveStatus,
    audio: { sfx: (n: string) => sfx.push(n) },
    input: {},
    assets: { get: () => undefined },
    setSave(s: SaveData) { shell.save = s; writeSave(storage, s); },
    resetProgress() { shell.setSave(resetSave(shell.save)); shell.saveStatus = 'ok'; },
    dismissSaveNotice() { shell.saveStatus = 'ok'; writeSave(storage, shell.save); },
    toggleMute() {},
    setLanguage() {},
    toTitle() {},
    toWorkOrders() {},
    toTrophies() {},
  };
  const tap = (scene: TitleScene, b: Button): void => {
    Object.assign(pointer, { x: b.x + b.w / 2, y: b.y + b.h / 2, down: true, pressed: true, released: false });
    scene.update(1 / 60);
    Object.assign(pointer, { down: false, pressed: false, released: true });
    scene.update(1 / 60);
    pointer.released = false;
    scene.update(1 / 60);
  };
  return { shell, loaded, sfx, tap, title: () => new TitleScene(shell as unknown as Shell) };
}

const gameSource = import.meta.glob('../src/core/game.ts', { query: '?raw', import: 'default', eager: true })['../src/core/game.ts'] as string;
const cases = damageCases();
const LANGS: Lang[] = ['en', 'fr'];

describe('a damaged save on the title', () => {
  it('the Game loads with the status and clears it on a reset or a dismissal', () => {
    const game = gameSource;
    expect(game).toMatch(/loadSaveWithStatus\(this\.storage\)/);
    expect(game).toMatch(/resetProgress\(\): void \{[^}]*this\._saveStatus = 'ok';/);
    expect(game).toMatch(/dismissSaveNotice\(\): void \{[^}]*this\._saveStatus = 'ok';[^}]*writeSave\(this\.storage, this\._save\)/);
  });

  it('every damaged shape shows the notice and the reset button, EN and FR', () => {
    const misses: string[] = [];
    for (const c of cases) {
      for (const lang of LANGS) {
        setLang(lang);
        const scene = boot(memStore(c.init), c.preprod).title();
        scene.relabel();
        if (!scene.notice.visible || !scene.reset.visible || !scene.damaged) misses.push(`${lang} ${c.name}`);
        const want = scene.saveStatus === 'unreadable' ? tr(lang).damagedLost : tr(lang).damagedKept;
        if (noticeText(scene.saveStatus) !== want) misses.push(`${lang} text ${c.name}`);
      }
    }
    expect(misses).toEqual([]);
  });

  it('Erase needs the confirmation tap; then a reload is clean and ok, older keys untouched, settings kept', () => {
    for (const c of cases) {
      const disk = memStore(c.init);
      const f = boot(disk, c.preprod);
      const scene = f.title();
      const own = ownKey(c.preprod);
      const others = Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own));
      const before = JSON.stringify(disk.data);
      // the button only opens the card; Keep closes it with nothing written
      f.tap(scene, scene.reset);
      expect(scene.confirming, c.name).toBe(true);
      f.tap(scene, scene.keep);
      expect(scene.confirming, c.name).toBe(false);
      expect(JSON.stringify(disk.data), c.name).toBe(before);
      expect(scene.notice.visible, c.name).toBe(true);
      f.tap(scene, scene.reset);
      f.tap(scene, scene.erase);
      expect(scene.notice.visible, c.name).toBe(false);
      expect(scene.reset.visible, c.name).toBe(false);
      const again = boot(disk, c.preprod);
      expect(again.loaded.status, c.name).toBe('ok');
      expect(again.loaded.save, c.name).toEqual({ ...defaultSave(), muted: f.loaded.save.muted, lang: f.loaded.save.lang });
      expect(again.title().notice.visible, c.name).toBe(false);
      expect(Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own)), c.name).toEqual(others);
      // no UI click sounds (sound-preferences)
      expect(f.sfx, c.name).toEqual([]);
    }
  });

  it('dismissing the notice keeps the loaded save, and the next load is ok', () => {
    for (const c of cases) {
      const disk = memStore(c.init);
      const f = boot(disk, c.preprod);
      const scene = f.title();
      const own = ownKey(c.preprod);
      const others = Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own));
      f.tap(scene, scene.notice);
      expect(scene.notice.visible, c.name).toBe(false);
      expect(scene.reset.visible, c.name).toBe(hasProgress(f.shell.save));
      expect(scene.confirming, c.name).toBe(false);
      const again = boot(disk, c.preprod);
      expect(again.loaded, c.name).toEqual({ save: f.loaded.save, status: 'ok' });
      expect(Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own)), c.name).toEqual(others);
    }
  });

  it('the card says the file was damaged only for a damaged save', () => {
    const damaged = boot(memStore(cases[0]!.init), cases[0]!.preprod).title();
    expect(damaged.damaged).toBe(true);
    const clean = boot(memStore(okCases()[1]!.init), false).title();
    expect(clean.damaged).toBe(false);
  });

  it('a save that loads ok never shows the notice', () => {
    for (const c of okCases()) {
      for (const lang of LANGS) {
        setLang(lang);
        const f = boot(memStore(c.init), c.preprod);
        const scene = f.title();
        expect(scene.notice.visible, c.name).toBe(false);
        expect(scene.damaged, c.name).toBe(false);
        expect(scene.reset.visible, c.name).toBe(hasProgress(f.shell.save));
      }
    }
  });

  it('the notice fits one line at phone size and clears the buttons around it', () => {
    for (const lang of LANGS) {
      for (const line of [tr(lang).damagedKept, tr(lang).damagedLost]) {
        expect(line.length, line).toBeGreaterThan(10);
        expect(measure(line, NOTICE_TEXT.size, NOTICE_TEXT.weight), line).toBeLessThanOrEqual(SAVE_NOTICE.w - 22 - NOTICE_CROSS_W - 8);
      }
      // the damaged card body leaves room for the Erase button, like the plain body
      const lines = Math.ceil(measure(tr(lang).damagedBody, 17, 500, true) / (RESET_CARD.w - 64)) + 1;
      expect(98 + lines * 23, lang).toBeLessThanOrEqual(RESET_CARD.h - 176);
    }
    const scene = boot(memStore(cases[0]!.init), false).title();
    expect(SAVE_NOTICE.x).toBeGreaterThanOrEqual(16);
    expect(SAVE_NOTICE.x + SAVE_NOTICE.w).toBeLessThanOrEqual(VIEW_W - 16);
    expect(SAVE_NOTICE.h).toBeGreaterThanOrEqual(44);
    for (const b of [scene.reset, scene.trophies, scene.start, scene.mute, ...scene.langs.map((l) => l.b)]) {
      const n = scene.notice;
      const apart = n.x + n.w <= b.x || b.x + b.w <= n.x || n.y + n.h <= b.y || b.y + b.h <= n.y;
      expect(apart).toBe(true);
    }
  });
});

function tr(lang: Lang) {
  return (lang === 'fr' ? fr : en).title.reset;
}
