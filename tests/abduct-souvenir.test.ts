// Souvenirs: swinging the body past the room's loose item grabs it once, with a sound and an event
// both views turn into a "+1 slipper" pop; the label uses the report's item names in both languages.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RoomId } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { souvenirLabel } from '../src/abduct/souvenir';
import { setLang, tr } from '../src/i18n';

afterEach(() => setLang('en'));

describe('souvenir label', () => {
  it('reads like the report, in English and French', () => {
    expect(souvenirLabel('slipper')).toBe('+1 slipper');
    expect(souvenirLabel('municipal mug')).toBe('+1 municipal mug');
    setLang('fr');
    expect(souvenirLabel('slipper')).toBe('+1 chausson');
    expect(souvenirLabel('coffee mug')).toBe('+1 tasse à café');
  });

  it('has a name for every room item', () => {
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      for (const room of Object.values(ROOMS)) expect(Object.keys(tr().items), `${lang}: ${room.item.name}`).toContain(room.item.name);
    }
  });
});

describe('grabbing the item', () => {
  for (const id of ['farm_window', 'laundry_loading', 'pemberton_window', 'osei_pharmacy'] as const satisfies readonly RoomId[]) {
    it(`${id}: swinging past it grabs it once, with one pickup sound`, () => {
      const sfx = vi.fn();
      const sim = new AbductSimulation(ROOMS[id], new Set(), { sfx }, () => 0.5);
      // lift a little, then glide the beam over the item and hang about there
      const tx = sim.item.x;
      const ty = sim.item.y - 40;
      for (let f = 0; f < 6 * 60 && !sim.item.captured; f++) {
        const dx = tx - sim.body.beamX;
        const dy = ty - sim.body.beamY;
        const d = Math.hypot(dx, dy);
        const step = Math.min(d, 1.2);
        if (d > 0) sim.moveBeam(sim.body.beamX + (dx / d) * step, sim.body.beamY + (dy / d) * step);
        sim.update(1 / 60);
      }
      expect(sim.item.captured, `${id}: item grabbed`).toBe(true);
      for (let f = 0; f < 120; f++) sim.update(1 / 60);
      expect(sim.itemSeq).toBe(1);
      expect(sfx.mock.calls.filter(([name]) => name === 'pickup')).toHaveLength(1);
    });
  }
});
