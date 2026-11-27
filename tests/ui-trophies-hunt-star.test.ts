// v0.2 (council, Neon 5): a town pickup grabbed on a failed shift is filed in the trophy room, but its
// Work Orders star needs a delivered shift with the pickup aboard. The trophy room used to show the find
// and hide "Go get it", so nothing pointed the player back at the open star. Now the find stays filed and
// the hunt button stays up, worded for the star, until that star is earned. Walks every level in LEVELS.
import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult, MapCollectibleId } from '../src/contracts';
import type { Shell } from '../src/core/shell';
import { LANGS, setLang, tr } from '../src/i18n';
import { isDeep, LEVELS } from '../src/levels/levels';
import { applyDeepRun, applyRun, type RunOutcome } from '../src/levels/progress';
import { defaultSave, type LevelId, type SaveData } from '../src/levels/save';
import type { LevelDef } from '../src/levels/types';
import { TrophiesScene } from '../src/ui/trophies';
import { buildTownShelfState } from '../src/ui/trophy-data';

afterEach(() => setLang('en'));

function shell(save: SaveData): Shell {
  return {
    ctx: { pointer: { x: 0, y: 0, down: false, pressed: false, released: false }, assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: true },
    save, preprod: false, audio: { sfx() {} }, input: { wheelDy: 0 }, assets: { get: () => undefined },
    setSave() {}, toTitle() {}, toWorkOrders() {}, toTrophies() {}, toMemo() {},
  } as unknown as Shell;
}

/** One shift on `level` with its pickup aboard: failed (sunrise / not delivered) or delivered. */
function shift(save: SaveData, level: LevelDef, pickup: MapCollectibleId, delivered: boolean): RunOutcome {
  if (!isDeep(level)) {
    const abduct: AbductResult = { delivered, woke: false, timeSec: 10, bonks: 0, dignity: 90, snores: 0, itemsStolen: [], aborted: false };
    const flight: FlightResult = { roomId: level.map.entries[0]!.roomId, timeSec: 10, spotted: 0, mapCollectible: pickup };
    return applyRun(save, level.id as LevelId, abduct, flight, () => 0);
  }
  const n = level.map.targets.length;
  return applyDeepRun(save, level.id as LevelId, {
    delivered: delivered ? n : n - 1, elapsedSec: 10, spotted: 0, failedAbductions: 0, sunrise: !delivered, mapCollectible: pickup,
  }, () => 0);
}

function hunt(save: SaveData, id: MapCollectibleId): { launch: TrophiesScene['huntLaunch']; label: string } {
  const scene = new TrophiesScene(shell(save), 'workorders');
  expect(scene.debug.selectTown(id), id).toBe(true);
  return { launch: scene.huntLaunch, label: scene.huntBtn.label };
}

describe('town finds filed on a failed shift', () => {
  for (const lang of LANGS) {
    it(`${lang}: keep the find filed and the hunt button up, worded for the star, until the star is earned`, () => {
      setLang(lang);
      let checked = 0;
      LEVELS.forEach((level, index) => {
        const pickup = level.map.collectible?.id;
        if (!pickup) return;
        // the level is open, as it is whenever the player could have flown it
        const open = defaultSave();
        open.allUnlocked = true;
        expect(hunt(open, pickup), `${level.id} before the find`).toMatchObject({ label: tr().trophies.hunt });
        expect(hunt(open, pickup).launch?.index).toBe(index);

        const failed = shift(open, level, pickup, false);
        expect(failed.stars[0], `${level.id} failed shift`).toBe(false);
        const shelf = buildTownShelfState(failed.save).slots.find((s) => s.slot.id === pickup)!;
        expect(shelf.found, `${level.id}: the find is still filed`).toBe(true);
        expect(failed.save.levels[level.id as LevelId].stars[3]).toBe(false);
        const after = hunt(failed.save, pickup);
        expect(after.launch, `${level.id}: hunt still offered`).toMatchObject({ index, target: { kind: 'town', id: pickup } });
        expect(after.label, `${level.id}: worded for the open star`).toBe(tr().trophies.huntStar);

        // delivered with it aboard: the star is won, and the button goes
        const won = shift(failed.save, level, pickup, true);
        expect(won.save.levels[level.id as LevelId].stars[3], `${level.id}: star won`).toBe(true);
        expect(hunt(won.save, pickup).launch, `${level.id}: nothing left to hunt`).toBeNull();
        checked++;
      });
      expect(checked).toBe(LEVELS.filter((l) => l.map.collectible).length);
      expect(checked).toBeGreaterThan(0);
    });
  }
});
