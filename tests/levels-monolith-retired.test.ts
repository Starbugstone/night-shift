import { describe, expect, it } from 'vitest';
import { ART, RETIRED_ART } from '../src/art-manifest';
import { ROOMS } from '../src/abduct/rooms';
import { isRoomId } from '../src/levels/levels';
import { MONOLITH_ROOMS, RETIRED_MONOLITH_ROOMS } from '../src/abduct/rooms/deep-monolith';
import { tr, setLang } from '../src/i18n';

describe('retired L8 routes', () => {
  it('ships only the appeal shaft', () => {
    expect(Object.keys(MONOLITH_ROOMS)).toEqual(['echo_appeal']);
    for (const id of Object.keys(RETIRED_MONOLITH_ROOMS)) {
      expect(isRoomId(id)).toBe(false);
      expect(id in ROOMS).toBe(false);
    }
  });

  it('keeps the retired layouts buildable, with their art out of the preload list', () => {
    const used = new Set<string>();
    for (const room of Object.values(RETIRED_MONOLITH_ROOMS)) {
      expect(room.human === 'flint' || room.human === 'reed' || room.human === 'echo').toBe(true);
      JSON.stringify(room, (_k, v) => {
        if (typeof v === 'string' && v.startsWith('room/')) used.add(v);
        return v;
      });
    }
    for (const key of used) expect(key in ART || key in RETIRED_ART).toBe(true);
    for (const key of Object.keys(RETIRED_ART)) expect(key in ART).toBe(false);
    // the HUD, Work Orders and flight chips still show Flint's and Reed's faces
    expect('human/flint_head' in ART && 'human/reed_head' in ART).toBe(true);
  });

  it('has no route strings left for them', () => {
    for (const lang of ['en', 'fr'] as const) {
      setLang(lang);
      const routes = tr().routes as Record<string, unknown>;
      for (const id of Object.keys(RETIRED_MONOLITH_ROOMS)) expect(routes[id]).toBeUndefined();
    }
    setLang('en');
  });
});
