// v4 trophy room: every souvenir taken home is kept in the save (count, first route, first report).
import { describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { applyDeepRun, applyRun } from '../src/levels/progress';
import { defaultSave, validateSave } from '../src/levels/save';

const abduct = (o: Partial<AbductResult> = {}): AbductResult => ({
  delivered: true, woke: false, timeSec: 20, bonks: 0, dignity: 100, snores: 3, itemsStolen: [], aborted: false, ...o,
});
const flight = (roomId: FlightResult['roomId'] = 'farm_window'): FlightResult => ({ roomId, timeSec: 10, spotted: 0 });

describe('trophy shelf in the save', () => {
  it('files a delivered souvenir with its route and report number, and counts repeats', () => {
    const one = applyRun(defaultSave(), 'level1', abduct({ itemsStolen: ['slipper'] }), flight('farm_window')).save;
    expect(one.trophies).toEqual({ slipper: { count: 1, room: 'farm_window', first: 0 } });
    const two = applyRun(one, 'level1', abduct({ itemsStolen: ['slipper'] }), flight('farm_chimney')).save;
    expect(two.trophies.slipper).toEqual({ count: 2, room: 'farm_window', first: 0 });
  });

  it('files nothing for an aborted or failed attempt', () => {
    expect(applyRun(defaultSave(), 'level1', abduct({ itemsStolen: ['slipper'], aborted: true }), flight()).save.trophies).toEqual({});
    expect(applyRun(defaultSave(), 'level1', abduct({ itemsStolen: ['slipper'], delivered: false }), flight()).save.trophies).toEqual({});
  });

  it('files every souvenir of a deep shift with its own route', () => {
    const save = applyDeepRun(defaultSave(), 'level4', {
      delivered: 3, elapsedSec: 300, spotted: 0, failedAbductions: 0, sunrise: false,
      trophies: [{ item: 'UFO snow globe', room: 'nigel_loading' }, { item: 'mayoral toupee', room: 'mayor_elevator' }],
    }).save;
    expect(save.trophies['UFO snow globe']).toEqual({ count: 1, room: 'nigel_loading', first: 0 });
    expect(save.trophies['mayoral toupee']?.room).toBe('mayor_elevator');
  });

  it('survives a save round trip, starts empty on old saves and drops unknown items or routes', () => {
    const save = applyRun(defaultSave(), 'level1', abduct({ itemsStolen: ['slipper'] }), flight()).save;
    expect(validateSave(JSON.parse(JSON.stringify(save))).trophies).toEqual(save.trophies);
    expect(validateSave({ version: 2, levels: {} }).trophies).toEqual({});
    expect(validateSave({
      version: 2,
      trophies: {
        slipper: { count: 2, room: 'farm_window', first: 1 },
        'retired gizmo': { count: 1, room: 'farm_window', first: 0 },
        'coffee mug': { count: 1, room: 'not_a_room', first: 0 },
        'odd sock': { count: 0, room: 'laundry_skylight', first: 0 },
      },
    }).trophies).toEqual({ slipper: { count: 2, room: 'farm_window', first: 1 } });
  });
});
