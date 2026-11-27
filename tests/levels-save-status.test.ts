// v0.2 damaged save (user, 2026-11-27: "if we can have a damaged save we probably need a delete save button with
// confirmation"): the loader reports what it found, so the title can say the file was damaged and offer a reset.
// Every generated damaged shape, under every key it can sit in (production and preprod), yields a non-'ok' status;
// a save that loads as stored, a migration with nothing broken in the way and an empty store are 'ok'. `loadSave`
// returns exactly the save `loadSaveWithStatus` does.
import { describe, expect, it } from 'vitest';
import { resetSave } from '../src/core/reset';
import { preprodStorage } from '../src/core/storage';
import { LEGACY_SAVE_KEY, LEVEL_IDS, SAVE_KEY, V2_SAVE_KEY, defaultSave, isSalvageableSave, isStoredSave, loadSave, loadSaveWithStatus, validateSave, writeSave, type KeyValueStore } from '../src/levels/save';
import { LEVELS, ROOM_IDS } from '../src/levels/levels';
import { en } from '../src/i18n/en';
import { SaveSession } from '../src/core/save-session';
import { SPARSE_PLACES, salvageableOverSoundCases, shelfFieldDamageShapes, damageCases, damagedOlderShapes, damagedProgressShapes, memStore, nestedDamageShapes, notSaveShapes, okCases, ownKey, sparseLevelShapes, storeFor } from './levels-save-shapes';

const cases = damageCases();
/** Thousands of generated cases per test: under a parallel full run the 5 s default is too short (Neon 4, P2). */
const SLOW = 60_000;

describe('the loader reports a damaged save', () => {
  it('generates damaged shapes for every place a save can sit', () => {
    expect(notSaveShapes().length).toBeGreaterThan(400);
    expect(damagedProgressShapes().length).toBeGreaterThan(60);
    expect(cases.length).toBeGreaterThan(3600);
  });

  it('every damaged shape loads with a non-ok status, the same save loadSave returns', () => {
    const misses: string[] = [];
    for (const c of cases) {
      const { status, save } = loadSaveWithStatus(storeFor(c).storage);
      if (!c.want.includes(status)) misses.push(`${c.name} -> ${status}`);
      expect(loadSave(storeFor(c).storage), c.name).toEqual(save);
    }
    expect(misses).toEqual([]);
  }, SLOW);

  it('a reset after damage reloads clean and ok, never touching the older keys', () => {
    for (const c of cases) {
      const { disk, storage } = storeFor(c);
      const { save } = loadSaveWithStatus(storage);
      const own = ownKey(c.preprod);
      const others = Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own));
      writeSave(storage, resetSave(save));
      const again = loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk);
      expect(again.status, c.name).toBe('ok');
      expect(again.save, c.name).toEqual({ ...defaultSave(), muted: save.muted, lang: save.lang });
      expect(Object.fromEntries(Object.entries(disk.data).filter(([k]) => k !== own)), c.name).toEqual(others);
    }
  }, SLOW);

  it('clean stores load ok, and stay ok on the next load', () => {
    for (const c of okCases()) {
      const { disk } = storeFor(c);
      expect(loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk).status, c.name).toBe('ok');
      expect(loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk).status, c.name).toBe('ok');
    }
    expect(loadSaveWithStatus(null)).toEqual({ save: defaultSave(), status: 'ok' });
  });

  it('a repaired or recovered save is stored back, so the next load is ok without a reset', () => {
    for (const c of cases) {
      const { disk, storage } = storeFor(c);
      const first = loadSaveWithStatus(storage);
      if (first.status === 'unreadable') continue;
      const again = loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk);
      expect(again, c.name).toEqual({ save: first.save, status: 'ok' });
    }
  }, SLOW);

  // v0.2 council round 5 (Sol P3): a progress write over a store that throws used to clear the status to 'ok' while
  // the damaged bytes stayed (the next boot said 'unreadable' again)
  it('a progress write clears the status only when it lands', () => {
    const misses: string[] = [];
    for (const c of cases) {
      const { disk, storage } = storeFor(c);
      const session = new SaveSession(storage);
      const loaded = session.status;
      const before = JSON.stringify(disk.data);
      // what the next boot says of the file as the load left it (a repaired or recovered save was stored back then)
      const reload = () => new SaveSession(storeFor({ init: { ...disk.data }, preprod: c.preprod }).storage).status;
      const next = reload();
      const setItem = disk.setItem;
      disk.setItem = () => { throw new Error('quota exceeded'); };
      const played = { ...session.save, reports: session.save.reports + 1 };
      if (session.writeProgress(played)) misses.push(`${c.name}: a throwing write reported persisted`);
      if (session.status !== loaded) misses.push(`${c.name}: ${loaded} -> ${session.status} after a failed write`);
      if (JSON.stringify(disk.data) !== before) misses.push(`${c.name}: the disk changed`);
      if (reload() !== next) misses.push(`${c.name}: reload ${reload()}, want ${next}`);
      disk.setItem = setItem;
      if (!session.writeProgress(played) || session.status !== 'ok') misses.push(`${c.name}: a landed write did not clear ${loaded}`);
      if (reload() !== 'ok') misses.push(`${c.name}: reload after a landed write is not ok`);
    }
    expect(misses).toEqual([]);
    expect(new SaveSession(null).writeProgress(defaultSave())).toBe(true);
  }, SLOW);

  it('a store that throws on a stored value reports it unreadable', () => {
    const disk = memStore({ [SAVE_KEY]: '{}' });
    const throwing: KeyValueStore = { ...disk, getItem: (k) => { if (k === V2_SAVE_KEY) throw new Error('quota'); return disk.getItem(k); } };
    expect(loadSaveWithStatus(throwing).status).toBe('unreadable');
    const blocked: KeyValueStore = { ...disk, getItem: () => { throw new Error('blocked'); } };
    expect(loadSaveWithStatus(blocked)).toEqual({ save: defaultSave(), status: 'ok' });
  });
});

// v0.2 council round 4 (Sol P1): damage inside a field used to load 'ok', repaired in memory only, with the bad bytes
// left on disk and no notice. The shapes are built by hand (never filtered through isStoredSave).
describe('damage inside a recognised field is reported and stored back clean (round 4, Sol P1)', () => {
  const nested = nestedDamageShapes();

  it('covers every level in LEVELS and LEVEL_IDS, with and without other progress', () => {
    for (const id of new Set([...LEVELS.map(l => l.id), ...LEVEL_IDS])) {
      expect(nested.filter(n => n.name.startsWith(`levels.${id} `) || n.name.startsWith(`levels.${id}.`)).length, id).toBeGreaterThanOrEqual(60);
    }
    expect(nested.some(n => !n.progress)).toBe(true);
    // independent of the loader's own checks: some are sound saves on the outside, every one is kept
    expect(nested.filter(n => isStoredSave(n.value)).length).toBeGreaterThan(nested.length / 2);
  });

  it('every shape loads repaired, keeps the sound records, stores no damage back, then loads ok', () => {
    const misses: string[] = [];
    for (const n of nested) {
      const disk = memStore({ [SAVE_KEY]: n.value });
      const first = loadSaveWithStatus(disk);
      if (first.status !== 'repaired') misses.push(`${n.name} -> ${first.status}`);
      if (n.progress && !LEVEL_IDS.some(id => first.save.levels[id].delivered)) misses.push(`${n.name}: the sound records were lost`);
      const damage: string[] = [];
      validateSave(JSON.parse(disk.data[SAVE_KEY]!), LEVEL_IDS, damage);
      if (damage.length) misses.push(`${n.name}: stored back with ${damage.join(', ')}`);
      const again = loadSaveWithStatus(disk);
      if (again.status !== 'ok') misses.push(`${n.name}: reload ${again.status}`);
      expect(again.save, n.name).toEqual(first.save);
    }
    expect(misses).toEqual([]);
  }, SLOW);

  // v0.2 council round 5 (Sol P3): `"first": "broken"` on a kept exhibit used to default to 0 with no damage, 'ok'
  it('a kept shelf entry with a mistyped field loads repaired and is stored back clean, for every souvenir and specimen', () => {
    const shapes = shelfFieldDamageShapes();
    expect(shapes.filter(s => s.shelf === 'trophies' && s.field === 'first').length).toBeGreaterThanOrEqual(Object.keys(en.items).length);
    expect(shapes.filter(s => s.shelf === 'specimens' && s.field === 'first').length).toBeGreaterThanOrEqual(Object.keys(en.trophies.specimens.entries).length);
    const misses: string[] = [];
    let kept = 0;
    for (const n of shapes) {
      const disk = memStore({ [SAVE_KEY]: n.value });
      const first = loadSaveWithStatus(disk);
      if (first.status !== 'repaired') misses.push(`${n.name} -> ${first.status}`);
      const entry = (first.save[n.shelf] as unknown as Record<string, Record<string, unknown> | undefined>)[n.id];
      if (entry) {
        kept++;
        if (entry.count !== n.kept.count || entry.room !== n.kept.room) misses.push(`${n.name}: kept as ${JSON.stringify(entry)}`);
      }
      if (n.field === 'first' && !entry) misses.push(`${n.name}: the exhibit was lost`);
      const damage: string[] = [];
      validateSave(JSON.parse(disk.data[SAVE_KEY]!), LEVEL_IDS, damage);
      if (damage.length) misses.push(`${n.name}: stored back with ${damage.join(', ')}`);
      const again = loadSaveWithStatus(disk);
      if (again.status !== 'ok') misses.push(`${n.name}: reload ${again.status}`);
      expect(again.save, n.name).toEqual(first.save);
    }
    expect(misses).toEqual([]);
    expect(kept).toBeGreaterThan(0);
  }, SLOW);

  it('a save a build writes is never reported damaged', () => {
    const played = defaultSave();
    played.levels.level3 = { stars: [true, false, true, false], delivered: true, bestTimeSec: 99, attempts: 4, mapCollectible: undefined };
    // round 5: shelf entries as a build writes them, for every souvenir and specimen
    const shelved = defaultSave();
    for (const [i, item] of Object.keys(en.items).entries()) shelved.trophies[item] = { count: 1 + (i % 3), room: ROOM_IDS[i % ROOM_IDS.length]!, first: i };
    for (const [i, id] of Object.keys(en.trophies.specimens.entries).entries()) {
      shelved.specimens[id] = i % 2 ? { count: 1, room: ROOM_IDS[i % ROOM_IDS.length]!, first: i, probed: i % 3 > 0, probes: i % 3 } : { count: 2, first: 0, probed: false, probes: 0 };
    }
    for (const save of [defaultSave(), played, shelved, { ...defaultSave(), upgrades: ['hush_drive' as const] }]) {
      const damage: string[] = [];
      validateSave(JSON.parse(JSON.stringify(save)), LEVEL_IDS, damage);
      expect(damage).toEqual([]);
    }
  });
});

// v0.2 council round 5 (Sol P2): `{"levels":{"level1":{"stars":[true,true,null,false]}}}` with nothing else loaded
// 'unreadable' with zero stars (the usable-level check wanted an all-boolean star list), and the next progress write
// replaced the bytes, so both earned stars were gone for good. Every level, every key, no glorbs or other usable field.
describe('a sparse damaged save keeps the progress it holds (round 5, Sol P2)', () => {
  const sparse = sparseLevelShapes();

  it('covers every level in LEVELS and LEVEL_IDS', () => {
    for (const id of new Set([...LEVELS.map(l => l.id), ...LEVEL_IDS])) expect(sparse.filter(n => n.id === id).length, id).toBeGreaterThanOrEqual(10);
    for (const n of sparse) expect(Object.keys(JSON.parse(n.value)).filter(k => k !== 'version' && k !== 'levels'), n.name).toEqual([]);
  });

  it('loads repaired under every key, keeps the earned stars, stores them back clean, then loads ok', () => {
    const misses: string[] = [];
    for (const n of sparse) {
      for (const p of SPARSE_PLACES) {
        const label = `${p.where}: ${n.name}`;
        const { disk, storage } = storeFor({ init: { [p.key]: n.value }, preprod: p.preprod });
        const first = loadSaveWithStatus(storage);
        if (first.status !== 'repaired') misses.push(`${label} -> ${first.status}`);
        const kept = first.save.levels[n.id]!;
        for (const [field, want] of Object.entries(n.keep)) {
          if (JSON.stringify(kept[field as keyof typeof kept]) !== JSON.stringify(want)) misses.push(`${label}: ${field} ${JSON.stringify(kept[field as keyof typeof kept])}, want ${JSON.stringify(want)}`);
        }
        const own = disk.data[ownKey(p.preprod)];
        if (own === undefined) { misses.push(`${label}: not stored back`); continue; }
        const damage: string[] = [];
        validateSave(JSON.parse(own), LEVEL_IDS, damage);
        if (damage.length) misses.push(`${label}: stored back with ${damage.join(', ')}`);
        if (p.key !== ownKey(p.preprod) && disk.data[p.key] !== n.value) misses.push(`${label}: the older key was rewritten`);
        const again = loadSaveWithStatus(p.preprod ? preprodStorage(disk)! : disk);
        if (again.status !== 'ok') misses.push(`${label}: reload ${again.status}`);
        expect(again.save, label).toEqual(first.save);
      }
    }
    expect(misses).toEqual([]);
  }, SLOW);
});

// v0.2 council round 4 (Opus O2): only the current key used to be salvaged, so a v0.1 save under the older v2 key with
// one wrong-type field loaded 'unreadable' with everything blank, and the first new save hid it for good.
describe('a damaged older save with level progress is salvaged (round 4, Opus O2)', () => {
  it.each(damagedOlderShapes())('%s under the v2 key alone: recovered, the older key untouched', (bad) => {
    for (const key of [V2_SAVE_KEY, LEGACY_SAVE_KEY]) {
      const disk = memStore({ [key]: bad });
      const { save, status } = loadSaveWithStatus(disk);
      expect(status).toBe('recovered');
      expect(save.levels.level3.stars).toEqual([true, true, true, false]);
      expect(save.levels.level2.delivered).toBe(true);
      // the mistyped field defaults; everything else survives
      expect(save.glorbs).toBe(typeof (JSON.parse(bad) as { glorbs: unknown }).glorbs === 'number' ? 420 : 0);
      expect(disk.data[key]).toBe(bad);
      expect(JSON.parse(disk.data[SAVE_KEY]!)).toEqual(save);
      expect(loadSaveWithStatus(disk)).toEqual({ save, status: 'ok' });
    }
    // preprod finds it under the production keys the same way, writing only its own key
    for (const key of [SAVE_KEY, V2_SAVE_KEY]) {
      const disk = memStore({ [key]: bad });
      const { save, status } = loadSaveWithStatus(preprodStorage(disk));
      expect(status).toBe('recovered');
      expect(save.levels.level3.delivered).toBe(true);
      expect(disk.data[key]).toBe(bad);
    }
  });

  // round 5 (Opus 2): this used to say a sound older save beats any damaged newer one, which threw away a salvageable
  // v0.1 save; it still holds for a newer value with nothing to salvage (E12)
  it('a sound older save still beats a newer value with nothing to salvage', () => {
    const v1 = JSON.stringify({ version: 1, glorbs: 321, levels: { level1: { stars: [true, false, true], delivered: true } } });
    for (const bad of notSaveShapes().filter(s => !isSalvageableSave(s))) {
      expect(loadSaveWithStatus(memStore({ [V2_SAVE_KEY]: bad, [LEGACY_SAVE_KEY]: v1 })).save.glorbs, bad).toBe(321);
    }
  });

  // round 5 (Opus 2): v2 held a salvageable v0.1 save (420 Glorbs, L3 starred) and v1 a sound older one (1 delivered,
  // 5 Glorbs): the game loaded v1 and wrote it to v3, losing the v0.1 progress. Same on preprod. Every key pair.
  it('a salvageable newer save beats a sound older one, under every pair of keys', () => {
    const misses: string[] = [];
    for (const c of salvageableOverSoundCases()) {
      const { disk, storage } = storeFor(c);
      const untouched = Object.fromEntries(Object.entries(c.init).filter(([k]) => k !== ownKey(c.preprod)));
      const { save, status } = loadSaveWithStatus(storage);
      if (!c.want.includes(status)) misses.push(`${c.name} -> ${status}`);
      if (save.glorbs === 5 || !save.levels.level2.delivered || JSON.stringify(save.levels.level3.stars) !== '[true,true,true,false]') misses.push(`${c.name}: loaded the older save (${save.glorbs} Glorbs)`);
      for (const [k, v] of Object.entries(untouched)) if (disk.data[k] !== v) misses.push(`${c.name}: ${k} rewritten`);
      const again = loadSaveWithStatus(c.preprod ? preprodStorage(disk)! : disk);
      if (again.status !== 'ok' || JSON.stringify(again.save) !== JSON.stringify(save)) misses.push(`${c.name}: reload ${again.status}`);
    }
    expect(misses).toEqual([]);
  }, SLOW);
});
