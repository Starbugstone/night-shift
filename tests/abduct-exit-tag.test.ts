// v0.2 follow-up: an interior room's exit tag never runs off the screen. On Dave's roof route the French
// "TRAPPE DU TOIT" tag, centred on a hatch near the attic's left wall, hung off the left edge while the
// camera followed the specimen up the ladder. For every room in ROOMS, in English and French, the tag box
// (exitTagBox, which the room view draws with) lies inside the 540×960 view at the room's spawn camera and
// at every camera position from which the exit can be seen, clear of the top HUD row and the bottom bar.
import { afterEach, describe, expect, it } from 'vitest';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { measure } from '../src/core/gfx/text';
import { EXIT_TAG, exitTagBox, type TagBox } from '../src/abduct/exit-tag';
import { ROOMS } from '../src/abduct/rooms';
import { AbductSimulation } from '../src/abduct/simulation';
import { gt, setLang, type Lang } from '../src/i18n';
import { HUD_ROW } from '../src/ui/hud';
import deepViewSource from '../src/abduct/deep-view.ts?raw';

const LANGS: Lang[] = ['en', 'fr'];
/** Same reach as the exit view's visibility test (DeepExit.sync). */
const SLACK = 18;

afterEach(() => setLang('en'));

/** Generous width estimate for bold caps in the system sans (the tests' usual fit estimate). */
function generous(s: string, size: number): number {
  let w = 0;
  for (const ch of s) {
    const caps = (ch >= 'A' && ch <= 'Z') || 'ÀÂÉÈÊÎÔÛÇ'.includes(ch);
    w += size * (ch === ' ' ? 0.28 : caps ? 0.7 : "il.,:;'’!|".includes(ch) ? 0.3 : 0.56);
  }
  return w * 1.08;
}

function onScreen(b: TagBox, cx: number, cy: number): boolean {
  return b.x >= cx && b.x + b.w <= cx + VIEW_W && b.y >= cy + HUD_ROW.y + HUD_ROW.h && b.y + b.h <= cy + VIEW_H;
}

const interiorRooms = Object.entries(ROOMS).filter(([, room]) => room.interior);

describe('exit tags stay on screen (v0.2 follow-up)', () => {
  it('walks every interior room', () => {
    expect(interiorRooms.length).toBeGreaterThan(20);
  });

  for (const lang of LANGS) {
    it(`every exit tag lies inside the view at the spawn camera and wherever the exit shows (${lang})`, () => {
      setLang(lang);
      const bad: string[] = [];
      for (const [id, room] of interiorRooms) {
        const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, { hard: true, wakeFails: true });
        const title = gt(room.interior!.exitName);
        const textW = Math.max(measure(title, EXIT_TAG.size, EXIT_TAG.weight), generous(title, EXIT_TAG.size));
        const s = room.exit;
        const cameras: Array<[number, number]> = [[sim.camera.x, sim.camera.y]];
        for (let cx = s.x - VIEW_W - SLACK; cx <= s.x + s.w + SLACK; cx += 12) {
          for (let cy = s.y - VIEW_H - SLACK; cy <= s.y + s.h + SLACK; cy += 24) cameras.push([cx, cy]);
        }
        for (const [cx, cy] of cameras) {
          const box = exitTagBox(room, sim.exitX, textW, cx, cy, { x: 0, y: 0, w: 0, h: 0 });
          if (!onScreen(box, cx, cy)) {
            bad.push(`${id} "${title}" at camera (${cx.toFixed(0)}, ${cy.toFixed(0)}): tag ${box.x.toFixed(0)}..${(box.x + box.w).toFixed(0)}`);
            break;
          }
        }
      }
      expect(bad, `${lang}: exit tags off screen`).toEqual([]);
    });
  }

  it('the room view places the tag through exitTagBox, every frame', () => {
    const src = deepViewSource;
    const exitView = src.slice(src.indexOf('class DeepExit'), src.indexOf('class DeepBeam'));
    expect(exitView).toMatch(/sync\([^)]*\)[^{]*\{[\s\S]*this\.placeTag\(cx, cy\)/);
    expect(exitView).toMatch(/exitTagBox\(/);
    expect(exitView, 'no tag placed by hand at the exit centre').not.toMatch(/exitX - width \/ 2/);
  });
});
