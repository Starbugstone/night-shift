import { afterEach, describe, expect, it } from 'vitest';
import { PREPROD_SAVE_KEY, isPreprodPath, preprodStorage } from '../src/core/storage';
import { LEVELS } from '../src/levels/levels';
import { isLevelUnlocked, setUnlockEverything } from '../src/levels/progress';
import { SAVE_KEY, V2_SAVE_KEY, defaultSave, loadSave, writeSave, type KeyValueStore } from '../src/levels/save';

function memory(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

afterEach(() => setUnlockEverything(false));

describe('preprod vs production', () => {
  it('only the /preprod/ path counts as preprod', () => {
    expect(isPreprodPath('/night-shift/preprod/')).toBe(true);
    expect(isPreprodPath('/night-shift/preprod/index.html')).toBe(true);
    expect(isPreprodPath('/night-shift/')).toBe(false);
    expect(isPreprodPath('/')).toBe(false);
  });

  it('preprod starts from the shared save but never writes it', () => {
    const disk = memory();
    const shared = defaultSave();
    shared.glorbs = 42;
    disk.setItem(SAVE_KEY, JSON.stringify(shared));
    const before = disk.getItem(SAVE_KEY);
    const store = preprodStorage(disk)!;
    const save = loadSave(store);
    expect(save.glorbs).toBe(42);
    save.glorbs = 999;
    writeSave(store, save);
    expect(disk.getItem(SAVE_KEY)).toBe(before);
    expect(JSON.parse(disk.getItem(PREPROD_SAVE_KEY)!).glorbs).toBe(999);
    expect(loadSave(preprodStorage(disk)).glorbs).toBe(999);
    expect(loadSave(disk).glorbs).toBe(42);
  });

  it('preserves independent preprod and production v2 progress across first launch and reopen', () => {
    const disk = memory();
    const prod = JSON.stringify({ version: 2, glorbs: 22 });
    const preprod = JSON.stringify({ version: 2, glorbs: 77, levels: { level7: { stars: 2 } } });
    disk.setItem(V2_SAVE_KEY, prod);
    disk.setItem('night-shift-save-preprod', preprod);
    expect(loadSave(disk).glorbs).toBe(22);
    expect(loadSave(preprodStorage(disk))).toMatchObject({ glorbs: 77, bridgeAccess: true });
    expect(disk.getItem(V2_SAVE_KEY)).toBe(prod);
    expect(disk.getItem('night-shift-save-preprod')).toBe(preprod);
    disk.setItem(V2_SAVE_KEY, '{}');
    disk.setItem('night-shift-save-preprod', '{}');
    expect(loadSave(preprodStorage(disk)).glorbs).toBe(77);
    expect(loadSave(disk).glorbs).toBe(22);
  });

  it('the unlock switch opens every level without touching the save', () => {
    const save = defaultSave();
    expect(isLevelUnlocked(save, LEVELS.length - 1)).toBe(false);
    setUnlockEverything(true);
    for (let i = 0; i < LEVELS.length; i++) expect(isLevelUnlocked(save, i)).toBe(true);
    expect(save.allUnlocked).toBe(false);
    expect(JSON.stringify(save)).toBe(JSON.stringify(defaultSave()));
  });
});
