// v4 reset: what a reset keeps, what counts as progress, and that preprod's reset never touches the
// save production reads.
import { describe, expect, it } from 'vitest';
import { hasProgress, resetSave } from '../src/core/reset';
import { PREPROD_SAVE_KEY, preprodStorage } from '../src/core/storage';
import { LEVEL_IDS, SAVE_KEY, defaultSave, loadSave, writeSave, type KeyValueStore, type SaveData } from '../src/levels/save';

function memory(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

/** A save with a bit of everything a reset erases, and non-default settings. */
function played(): SaveData {
  const s = defaultSave();
  s.glorbs = 340;
  s.reports = 12;
  s.upgrades = ['beam_dampener', 'snooze_ray'];
  s.allUnlocked = true;
  s.legacyDispatch = true;
  s.fieldCheckSeen = true;
  s.levels.level1 = { stars: [true, true, false, false], delivered: true, bestTimeSec: 41.5, attempts: 3 };
  s.levels.level4 = { stars: [true, false, true, true], delivered: true, bestTimeSec: 120, attempts: 7, mapCollectible: 'astronomer' };
  s.trophies = { 'yellow hazmat suit': { count: 2, room: 'dave_roof', first: 1 } };
  s.specimens = { doyle: { count: 1, room: 'farm_chimney', first: 0, probed: true, probes: 1 } };
  s.muted = true;
  s.lang = 'fr';
  return s;
}

describe('reset progress', () => {
  it('the reset save is defaultSave() apart from sound and language', () => {
    const before = played();
    const after = resetSave(before);
    expect(after).toEqual({ ...defaultSave(), muted: true, lang: 'fr' });
    // the source save is left alone
    expect(before.glorbs).toBe(340);
    // the other way round too: an unmuted auto-language player gets exactly the default save
    expect(resetSave({ ...played(), muted: false, lang: 'auto' })).toEqual(defaultSave());
  });

  it('a preprod reset writes only the preprod key and leaves the shared save byte-identical', () => {
    const disk = memory();
    disk.setItem(SAVE_KEY, JSON.stringify(played()));
    const shared = disk.getItem(SAVE_KEY);
    // Game on /preprod/: storage = preprodStorage(browserStorage()); resetProgress = setSave(resetSave(save))
    const store = preprodStorage(disk)!;
    const save = loadSave(store);
    expect(save.glorbs).toBe(340); // preprod starts from a copy of the shared save
    expect(writeSave(store, resetSave(save))).toBe(true);
    expect(disk.getItem(SAVE_KEY)).toBe(shared);
    expect(JSON.parse(disk.getItem(PREPROD_SAVE_KEY)!)).toEqual(resetSave(save));
    // after the reset preprod reads its fresh save, production still reads the old one
    expect(hasProgress(loadSave(preprodStorage(disk)))).toBe(false);
    expect(loadSave(disk).glorbs).toBe(340);
  });

  it('a production reset is stored, so a reload starts fresh with the settings kept', () => {
    const disk = memory();
    disk.setItem(SAVE_KEY, JSON.stringify(played()));
    writeSave(disk, resetSave(loadSave(disk)));
    const reloaded = loadSave(disk);
    expect(hasProgress(reloaded)).toBe(false);
    expect(reloaded.muted).toBe(true);
    expect(reloaded.lang).toBe('fr');
  });
});

describe('reset button visibility', () => {
  it('is hidden for an empty save, even with non-default settings', () => {
    expect(hasProgress(defaultSave())).toBe(false);
    expect(hasProgress({ ...defaultSave(), muted: true, lang: 'fr' })).toBe(false);
    expect(hasProgress(resetSave(played()))).toBe(false);
  });

  it('shows for any one kind of progress', () => {
    const cases: Array<[string, (s: SaveData) => void]> = [
      ['glorbs', (s) => void (s.glorbs = 1)],
      ['reports', (s) => void (s.reports = 1)],
      ['upgrades', (s) => void (s.upgrades = ['hush_drive'])],
      ['trophies', (s) => void (s.trophies = { 'yellow hazmat suit': { count: 1, room: 'dave_roof', first: 0 } })],
      ['specimens', (s) => void (s.specimens = { doyle: { count: 1, first: 0, probed: false, probes: 0 } })],
    ];
    for (const id of LEVEL_IDS) {
      cases.push([`${id} attempted`, (s) => void (s.levels[id].attempts = 1)]);
      cases.push([`${id} delivered`, (s) => void (s.levels[id].delivered = true)]);
    }
    for (const [name, apply] of cases) {
      const s = defaultSave();
      apply(s);
      expect(hasProgress(s), name).toBe(true);
    }
    expect(hasProgress(played())).toBe(true);
  });
});
