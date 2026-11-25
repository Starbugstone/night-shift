import { describe, expect, it } from 'vitest';
import { defaultSave } from '../src/levels/save';
import { buildShelfState, buildSpecimenShelfState, buildTownShelfState, previewSave } from '../src/ui/trophy-data';

describe('preprod trophy preview', () => {
  it('shows every exhibit as found without touching the real save', () => {
    const save = defaultSave();
    const before = JSON.stringify(save);
    const preview = previewSave(save);
    const shelf = buildShelfState(preview);
    const town = buildTownShelfState(preview);
    const specimens = buildSpecimenShelfState(preview);
    expect(shelf.foundCount).toBe(shelf.totalCount);
    expect(town.foundCount).toBe(town.totalCount);
    expect(specimens.foundCount).toBe(specimens.totalCount);
    expect(JSON.stringify(save)).toBe(before);
  });

  it('specimens show 1, 3 and 10 visits so both addenda can be checked', () => {
    const counts = new Set(Object.values(previewSave(defaultSave()).specimens).map((e) => e.count));
    expect([...counts].sort((a, b) => a - b)).toEqual([1, 3, 10]);
  });
});
