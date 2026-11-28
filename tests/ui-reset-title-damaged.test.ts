// v0.2 damaged save (user, 2026-11-27): a damaged save makes the title say so and offer its reset, even when no
// progress survived. Walks every generated damaged shape (tests/levels-save-shapes.ts) through a shell that loads,
// resets and dismisses with the Game's own SaveSession (src/core/save-session.ts), in EN and FR: the notice and the
// reset button show, the confirmation card says what happened to the file, Erase needs its confirmation tap, and a
// reload after the reset is clean and 'ok'. A save that loads 'ok' never shows the notice.
// Council round 4: the card body and keep button follow the status (Neon 3: an unreadable file has no progress to
// keep); dismissing writes nothing (Sol P2); saved progress ends the notice, sound and language toggles do not (Neon 4).
import { afterEach, describe, expect, it } from 'vitest';
import { VIEW_W } from '../src/contracts';
import { hasProgress } from '../src/core/reset';
import type { Shell } from '../src/core/shell';
import { preprodStorage } from '../src/core/storage';
import { measure } from '../src/core/gfx/text';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { fmt, getLang, setLang, tr as activeTr, type Lang } from '../src/i18n';
import { SaveSession } from '../src/core/save-session';
import { defaultSave, loadSaveWithStatus, type KeyValueStore, type SaveData, type SaveStatus } from '../src/levels/save';
import { trophyProgress } from '../src/ui/trophy-data';
import { NOTICE_CROSS_W, NOTICE_TEXT, RESET_CARD, SAVE_NOTICE, TitleScene, cardBody, keepLabel, noticeText } from '../src/ui/title';
import type { Button } from '../src/ui/widgets';
import { damageCases, memStore, okCases, ownKey } from './levels-save-shapes';

afterEach(() => setLang('en'));

/** The Game's save handling (constructor, setSave, resetProgress, dismissSaveNotice) over an in-memory disk. */
function boot(disk: ReturnType<typeof memStore>, preprod: boolean) {
  const storage: KeyValueStore = preprod ? preprodStorage(disk)! : disk;
  const loaded = loadSaveWithStatus(preprod ? preprodStorage(memStore(disk.data))! : memStore(disk.data));
  const saves = new SaveSession(storage);
  const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
  const sfx: string[] = [];
  const shell = {
    ctx: { pointer, assets: { get: () => undefined }, audio: { sfx: (n: string) => sfx.push(n) }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: false },
    get save() { return saves.save; },
    get saveStatus(): SaveStatus { return saves.status; },
    audio: { sfx: (n: string) => sfx.push(n) },
    input: {},
    assets: { get: () => undefined },
    setSave(s: SaveData) { return saves.writeProgress(s); },
    resetProgress() { return saves.reset(); },
    dismissSaveNotice() { saves.dismiss(); },
    toggleMute() { saves.writeSettings({ ...saves.save, muted: !saves.save.muted }); },
    setLanguage(lang: Lang) { saves.writeSettings({ ...saves.save, lang }); setLang(lang); },
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
const titleSource = import.meta.glob('../src/ui/title.ts', { query: '?raw', import: 'default', eager: true })['../src/ui/title.ts'] as string;
const cases = damageCases();
const LANGS: Lang[] = ['en', 'fr'];
/** Thousands of generated cases per test: under a parallel full run the 5 s default is too short (Neon 4, P2). */
const SLOW = 60_000;

describe('a damaged save on the title', () => {
  it('the Game keeps its save in a SaveSession: progress, settings and the dismissal go through it', () => {
    const game = gameSource;
    expect(game).toMatch(/this\.saves = new SaveSession\(this\.storage\)/);
    expect(game).toMatch(/setSave\(s: SaveData\): boolean \{\s*const persisted = this\.saves\.writeProgress\(s\);[^}]*return persisted;/);
    // v0.2 council round 6 (Sol P2): the reset has its own path, and live progress moves only when it was stored
    expect(game).toMatch(/resetProgress\(\): boolean \{[^}]*if \(!this\.saves\.reset\(\)\) return false;[^}]*this\.applySave\(this\._save\);\s*return true;\s*\}/);
    expect(game).not.toMatch(/resetSave\(/);
    expect(game).toMatch(/dismissSaveNotice\(\): void \{[^}]*this\.saves\.dismiss\(\);\s*\}/);
    expect(game).toMatch(/toggleMute\(\): void \{\s*this\.setSettings\(/);
    expect(game).toMatch(/setLanguage\(lang: Lang\): void \{[^}]*this\.setSettings\(/);
    // nothing else writes the save behind the session's back
    expect(game.match(/\bwriteSave\(/g) ?? []).toEqual([]);
    expect(game.match(/\bsaveStatus\b/g)?.length).toBe(1);
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
  }, SLOW);

  // Neon 3: an unreadable file was started fresh; the card must not say it was patched or offer to keep progress
  it('the card body and keep button match the status, EN and FR', () => {
    const misses: string[] = [];
    const all = [...cases.map(c => ({ ...c, want: c.want })), ...okCases().map(c => ({ ...c, want: ['ok'] as const }))];
    for (const c of all) {
      for (const lang of LANGS) {
        setLang(lang);
        const f = boot(memStore(c.init), c.preprod);
        const scene = f.title();
        scene.relabel();
        const str = activeTr().title.reset; // the live table (French typography applied)
        const status = f.loaded.status;
        const body = status === 'ok' ? str.body : status === 'unreadable' ? str.damagedLostBody : str.damagedBody;
        const keep = status === 'unreadable' ? str.keepFresh : str.keep;
        if (scene.saveStatus !== status || cardBody(scene.saveStatus) !== body || keepLabel(status) !== keep || scene.keep.label !== keep) misses.push(`${lang} ${status} ${c.name}`);
      }
    }
    expect(misses).toEqual([]);
    // the card view draws exactly that body
    expect(titleSource).toMatch(/this\.body\.setBlock\(cardBody\(s\.saveStatus\)/);
    expect(titleSource).toMatch(/this\.keep\.label = keepLabel\(this\.saveStatus\)/);
    for (const lang of LANGS) {
      const str = tr(lang);
      expect(new Set([str.body, str.damagedBody, str.damagedLostBody]).size, lang).toBe(3);
      expect(str.keepFresh, lang).not.toBe(str.keep);
    }
  }, SLOW);

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
  }, SLOW);

  // Sol P2: dismissing an unreadable notice used to write a fresh save over the original bytes without asking
  it('dismissing the notice hides it for the session and leaves storage byte-identical, for every status', () => {
    for (const c of cases) {
      const disk = memStore(c.init);
      const f = boot(disk, c.preprod);
      const before = JSON.stringify(disk.data);
      const scene = f.title();
      f.tap(scene, scene.notice);
      expect(scene.notice.visible, c.name).toBe(false);
      expect(scene.reset.visible, c.name).toBe(hasProgress(f.shell.save));
      expect(scene.confirming, c.name).toBe(false);
      expect(JSON.stringify(disk.data), c.name).toBe(before);
      // back to the title in the same session: still hidden
      expect(f.title().notice.visible, c.name).toBe(false);
      // the next boot reads the same disk: an unreadable file is still reported, a repaired one was stored at load
      const again = boot(disk, c.preprod);
      expect(again.loaded.status, c.name).toBe(f.loaded.status === 'unreadable' ? 'unreadable' : 'ok');
      expect(again.title().notice.visible, c.name).toBe(f.loaded.status === 'unreadable');
    }
  }, SLOW);

  // Neon 4: the status used to last the whole session, so a played shift still came back to the damaged notice
  it('saved progress ends the notice; sound and language toggles do not, and never overwrite an unreadable file', () => {
    for (const c of cases) {
      const disk = memStore(c.init);
      const f = boot(disk, c.preprod);
      const before = JSON.stringify(disk.data);
      f.shell.toggleMute();
      f.shell.setLanguage('fr');
      expect(f.title().notice.visible, c.name).toBe(true);
      if (f.loaded.status === 'unreadable') expect(JSON.stringify(disk.data), c.name).toBe(before);
      // a shift is played and its report saved
      const played = { ...f.shell.save, reports: f.shell.save.reports + 1, levels: { ...f.shell.save.levels, level1: { stars: [true, false, false, false] as SaveData['levels']['level1']['stars'], delivered: true, bestTimeSec: 60, attempts: 1 } } };
      f.shell.setSave(played);
      const scene = f.title();
      expect(scene.notice.visible, c.name).toBe(false);
      expect(scene.damaged, c.name).toBe(false);
      expect(scene.reset.visible, c.name).toBe(true);
      const again = boot(disk, c.preprod);
      expect(again.loaded, c.name).toEqual({ save: played, status: 'ok' });
    }
  }, SLOW);

  // v0.2 council round 5 (Sol P3): with a store whose writes throw, the erase used to say "file shredded" and the
  // session reported 'ok' while the damaged bytes stayed on disk, so the next boot showed the notice again
  it('a jammed erase never says shredded: the file, its status, the notice and the reset button stay, EN and FR', () => {
    const misses: string[] = [];
    for (const c of cases) {
      for (const lang of LANGS) {
        setLang(lang);
        const disk = memStore(c.init);
        const f = boot(disk, c.preprod);
        const status = f.shell.saveStatus;
        const before = JSON.stringify(disk.data);
        // what the next boot says of the file as the load left it (a repaired save was stored back then)
        const next = boot(memStore(disk.data), c.preprod).loaded.status;
        disk.setItem = () => { throw new Error('quota exceeded'); };
        const scene = f.title();
        f.tap(scene, scene.reset);
        f.tap(scene, scene.erase);
        const str = activeTr().title.reset;
        if (scene.confirming) misses.push(`${lang} ${c.name}: the card stayed open`);
        if (!scene.shredFailed || scene.shreddedT <= 0) misses.push(`${lang} ${c.name}: no jammed note`);
        if (f.shell.saveStatus !== status || scene.saveStatus !== status) misses.push(`${lang} ${c.name}: status ${f.shell.saveStatus}/${scene.saveStatus}, want ${status}`);
        if (!scene.reset.visible) misses.push(`${lang} ${c.name}: the reset button went away`);
        if (JSON.stringify(disk.data) !== before) misses.push(`${lang} ${c.name}: the disk changed`);
        // once the note has been read, the notice comes back for the file still on disk
        for (let i = 0; i < 60 * 12 && scene.shreddedT > 0; i++) scene.update(1 / 60);
        if (scene.shredFailed || scene.notice.visible !== (status !== 'ok')) misses.push(`${lang} ${c.name}: notice ${scene.notice.visible} after the note`);
        if (str.shredFailed === str.done) misses.push(`${lang}: the jammed note is the shredded note`);
        const again = boot(memStore(disk.data), c.preprod);
        if (again.loaded.status !== next) misses.push(`${lang} ${c.name}: reload ${again.loaded.status}, want ${next}`);
      }
    }
    expect(misses).toEqual([]);
    // the view draws the jammed note in place of the shredded one, and both fit the phone width
    expect(titleSource).toMatch(/this\.shredded\.set\(s\.shredFailed \? str\.reset\.shredFailed : str\.reset\.done/);
    for (const lang of LANGS) for (const line of [tr(lang).done, tr(lang).shredFailed]) expect(measure(line, 19, 800), line).toBeLessThanOrEqual(VIEW_W - 40);
  }, SLOW);

  // v0.2 council round 6 (Sol P2): a jammed erase cleared progress in memory only, so once writes worked again the
  // next mute or language tap stored the empty save while the jammed note still said the file was still here
  it('a jammed erase keeps live progress; the next mute or language tap stores the loaded save, EN and FR', () => {
    const misses: string[] = [];
    for (const c of cases) {
      for (const lang of LANGS) {
        setLang(lang);
        const disk = memStore(c.init);
        const f = boot(disk, c.preprod);
        const loaded = structuredClone(f.shell.save);
        const status = f.shell.saveStatus;
        const own = ownKey(c.preprod);
        const ownBytes = disk.data[own];
        const count = (s: SaveData) => { const p = trophyProgress(s); return fmt(activeTr().trophies.buttonCount, { n: p.found, max: p.total }); };
        const setItem = disk.setItem;
        disk.setItem = () => { throw new Error('quota exceeded'); };
        const scene = f.title();
        f.tap(scene, scene.reset);
        f.tap(scene, scene.erase);
        scene.relabel();
        if (!scene.shredFailed) misses.push(`${lang} ${c.name}: no jammed note`);
        if (JSON.stringify(f.shell.save) !== JSON.stringify(loaded)) misses.push(`${lang} ${c.name}: live progress changed after a jammed erase`);
        if (scene.trophies.label !== count(loaded)) misses.push(`${lang} ${c.name}: trophy count ${scene.trophies.label}, want ${count(loaded)}`);
        if (f.shell.saveStatus !== status) misses.push(`${lang} ${c.name}: status ${f.shell.saveStatus}, want ${status}`);
        // the store works again; the player taps mute and the other language while the note still shows
        disk.setItem = setItem;
        f.tap(scene, scene.mute);
        const other = scene.langs.find((l) => l.lang !== getLang())!;
        f.tap(scene, other.b);
        if (!scene.shredFailed) misses.push(`${lang} ${c.name}: the note went before the taps were checked`);
        const want = { ...loaded, muted: !loaded.muted, lang: other.lang };
        if (JSON.stringify(f.shell.save) !== JSON.stringify(want)) misses.push(`${lang} ${c.name}: live save after the taps is not the loaded progress`);
        const stored = boot(memStore(disk.data), c.preprod).loaded.save;
        if (status === 'unreadable') {
          if (disk.data[own] !== ownBytes) misses.push(`${lang} ${c.name}: the unreadable bytes were overwritten`);
        } else if (JSON.stringify(stored) !== JSON.stringify(want)) misses.push(`${lang} ${c.name}: stored save lost progress (glorbs ${stored.glorbs}, want ${loaded.glorbs})`);
        // a later erase that lands clears it for good, settings kept
        f.tap(scene, scene.reset);
        f.tap(scene, scene.erase);
        if (scene.shredFailed) misses.push(`${lang} ${c.name}: the landed erase said jammed`);
        const again = boot(memStore(disk.data), c.preprod).loaded;
        if (again.status !== 'ok' || JSON.stringify(again.save) !== JSON.stringify({ ...defaultSave(), muted: want.muted, lang: want.lang })) misses.push(`${lang} ${c.name}: the landed erase reloads ${again.status} with glorbs ${again.save.glorbs}`);
        if (hasProgress(f.shell.save) || f.shell.saveStatus !== 'ok') misses.push(`${lang} ${c.name}: live save after the landed erase`);
      }
    }
    expect(misses.slice(0, 20)).toEqual([]);
  }, SLOW);

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
      // the damaged card bodies leave room for the Erase button, like the plain body
      for (const body of [tr(lang).damagedBody, tr(lang).damagedLostBody]) {
        const lines = Math.ceil(measure(body, 17, 500, true) / (RESET_CARD.w - 64)) + 1;
        expect(98 + lines * 23, lang).toBeLessThanOrEqual(RESET_CARD.h - 176);
      }
      expect(measure(tr(lang).keepFresh, 24, 800), lang).toBeLessThanOrEqual(RESET_CARD.w - 64 - 24);
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
