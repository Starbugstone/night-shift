import { describe as group, expect as want, it as check } from 'vitest';
// Coordinator: saves from before the Specimen Archive fill it from their trophies and delivered levels.
import { backfillSpecimens as backfill } from '../src/levels/progress';
import { defaultSave as freshSave } from '../src/levels/save';
import { LEVELS as ALL_LEVELS, isDeep as deepLevel } from '../src/levels/levels';
import { buildSpecimenCatalog } from '../src/ui/trophy-data';

group('specimen back-fill for older saves', () => {
  check('a save with every level delivered gets every specimen, with a stable probe stamp', () => {
    const a = freshSave();
    for (const lv of ALL_LEVELS) a.levels[lv.id].delivered = true;
    backfill(a);
    const b = freshSave();
    for (const lv of ALL_LEVELS) b.levels[lv.id].delivered = true;
    backfill(b);
    const ids = buildSpecimenCatalog().flatMap(section => section.slots.map(slot => slot.id));
    want(Object.keys(a.specimens).sort()).toEqual(ids.sort());
    want(a.specimens).toEqual(b.specimens);
    const probed = Object.values(a.specimens).filter((e) => e.probed).length;
    want(probed).toBeGreaterThan(3);
    want(probed).toBeLessThan(ids.length);
  });

  check('a trophy proves its route\'s specimen; an existing archive is left alone', () => {
    const s = freshSave();
    s.trophies['slipper'] = { count: 1, room: 'farm_window', first: 4 };
    backfill(s);
    want(s.specimens.doyle).toMatchObject({ count: 1, room: 'farm_window', first: 4 });
    s.levels.level9.delivered = true;
    backfill(s);
    want(Object.keys(s.specimens)).toEqual(['doyle']);
  });

  check('a fresh save stays empty', () => {
    const s = freshSave();
    backfill(s);
    want(s.specimens).toEqual({});
    want(ALL_LEVELS.some(deepLevel)).toBe(true);
  });
});
