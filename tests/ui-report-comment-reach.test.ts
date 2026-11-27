// v0.2 follow-up: every line Vrell can say on a report is reachable. Walks every level in LEVELS, in
// English and French, through the real report builders (tutorialReport / deepReport) over a grid of
// report states and rotations, and checks that each line of every deep comment pool, every first-clear
// line, every sunrise memo and each level's town-pickup lines comes out at least once. A pool that
// another line always beats (the pickup comment on Birch Lane used to) fails here.
import { afterEach, describe, expect, it } from 'vitest';
import type { AbductResult, FlightResult } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { setLang, tr, type Lang } from '../src/i18n';
import { LEVELS } from '../src/levels/levels';
import { RANKS, type RunOutcome } from '../src/levels/progress';
import { DeepRun } from '../src/levels/run';
import { defaultSave } from '../src/levels/save';
import type { DeepLevelDef, TutorialLevelDef } from '../src/levels/types';
import { deepReport, tutorialReport } from '../src/ui/report';

const LANGS: Lang[] = ['en', 'fr'];
/** Enough reports for every rotation split (pickup 1/2 × souvenir 1/3 × pools of up to 4). */
const ROTATIONS = 48;

afterEach(() => setLang('en'));

type Deep = string | readonly Deep[] | { readonly [k: string]: Deep };

/** Every string under `v`, keyed by its path. */
function strings(v: Deep, path: string, out = new Map<string, string>()): Map<string, string> {
  if (typeof v === 'string') out.set(path, v);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x as Deep, `${path}#${i}`, out));
  else for (const [k, x] of Object.entries(v as Record<string, Deep>)) strings(x, `${path}.${k}`, out);
  return out;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A template line as a matcher: `{placeholders}` match any filled-in value. */
function matcher(line: string): RegExp {
  return new RegExp('^' + line.split(/\{\w+\}/).map(escape).join('.+?') + '$', 's');
}

/** Every line the report comment slot can carry, keyed by where it lives. */
function expectedLines(): Map<string, string> {
  const h = tr().humor;
  const lines = new Map<string, string>();
  const { units: _units, ...pools } = h.deepComments as unknown as Record<string, Deep>;
  for (const [pool, v] of Object.entries(pools)) strings(v, `deepComments.${pool}`, lines);
  for (const [id, s] of Object.entries(h.storyFirstClear as Record<string, string>)) {
    if (LEVELS.some(l => l.id === id)) lines.set(`storyFirstClear.${id}`, s);
  }
  h.sunriseMemos.forEach((s, i) => lines.set(`sunriseMemos#${i}`, s));
  for (const lv of LEVELS) {
    const id = lv.map.collectible?.id;
    if (!id) continue;
    const item = tr().mapCollectibles.items[id];
    lines.set(`mapCollectibles.${id}.comment`, item.comment);
    lines.set(`mapCollectibles.${id}.missedComment`, item.missedComment);
  }
  return lines;
}

function outcome(reports: number, perfect: boolean, first: boolean): RunOutcome {
  const save = { ...defaultSave(), reports };
  return {
    save,
    stars: perfect ? [true, true, true, true] : [true, false, false, false],
    newStarFlags: [first, false, false, false],
    glorbs: 0,
    rankBefore: RANKS[0]!,
    rankAfter: RANKS[0]!,
    unlockedNext: false,
  };
}

function* deepComments(lv: DeepLevelDef): Generator<string> {
  const idx = LEVELS.indexOf(lv);
  const rooms = lv.map.targets.flatMap(t => (t.entries[0] ? [t.entries[0].roomId] : []));
  const offered = rooms.map(id => ROOMS[id]!.item.name);
  for (const sunrise of [false, true])
    for (const perfect of [false, true])
      for (const first of [false, true])
        for (const spotted of [0, 1, 2, 3])
          for (const failed of [0, 2])
            for (const remaining of [10, 200])
              for (const items of [[], offered])
                for (const collected of [false, true]) {
                  const run = new DeepRun(lv, idx);
                  run.phase = sunrise ? 'sunrise' : 'flight';
                  run.delivered.fill(!sunrise);
                  run.order.push(...lv.map.targets.map((_, i) => i));
                  run.spotted = spotted;
                  run.failedAbductions = failed;
                  run.elapsed = Math.max(0, lv.budgetSec - remaining);
                  run.totals.rooms.push(...rooms);
                  run.totals.items.push(...items);
                  if (run.collectible) run.collectible.collected = collected;
                  for (let r = 0; r < ROTATIONS; r++) yield deepReport(run, outcome(r, perfect, first)).comment;
                }
}

function* tutorialComments(lv: TutorialLevelDef): Generator<string> {
  const idx = LEVELS.indexOf(lv);
  for (const entry of lv.map.entries)
    for (const delivered of [true, false])
      for (const first of [false, true])
        for (const collected of [false, true]) {
          const abduct: AbductResult = {
            delivered, woke: !delivered, timeSec: 20, bonks: 0, snores: 0, dignity: 80, itemsStolen: [],
          } as unknown as AbductResult;
          const flight: FlightResult = {
            roomId: entry.roomId, timeSec: 20, spotted: 0,
            ...(collected && lv.map.collectible ? { mapCollectible: lv.map.collectible.id } : {}),
          };
          for (let r = 0; r < ROTATIONS; r++) yield tutorialReport(idx, abduct, flight, outcome(r, false, first)).comment;
        }
}

describe('report comment reachability (v0.2 follow-up)', () => {
  for (const lang of LANGS) {
    it(`reaches every deep comment, first-clear, sunrise and town-pickup line on some level (${lang})`, () => {
      setLang(lang);
      const lines = expectedLines();
      const exact = new Map<string, string[]>();
      const templated: Array<[string, RegExp]> = [];
      for (const [key, s] of lines) {
        if (/\{\w+\}/.test(s)) templated.push([key, matcher(s)]);
        else exact.set(s, [...(exact.get(s) ?? []), key]);
      }
      const reached = new Set<string>();
      const seen = new Set<string>();
      const mark = (comment: string) => {
        if (seen.has(comment)) return;
        seen.add(comment);
        for (const key of exact.get(comment) ?? []) reached.add(key);
        for (const [key, re] of templated) if (!reached.has(key) && re.test(comment)) reached.add(key);
      };
      for (const lv of LEVELS) {
        const gen = lv.kind === 'deep' ? deepComments(lv) : tutorialComments(lv);
        for (const c of gen) mark(c);
      }
      const missing = [...lines.keys()].filter(k => !reached.has(k));
      expect(missing, `${lang}: report lines no level can show`).toEqual([]);
    }, 60_000);
  }
});
