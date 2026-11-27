// Runtime code finds a hazard by data, never by its place in a level's list (v0.2 council round 2, Fable item 7):
// the L10 sleeper snored on `interior.hazards[0]`, assumed to be Tom's staff sparks, and the 1953 drive-in
// applauded on `sim.st.cause === 0`, assumed to be the projector. Reordering a room's hazards or a map's
// detectors silently moved both cues. They are found by data now: the laser `skin: 'staff'`
// (`InteriorSimulation.staffSpark`) and the projector's skin (`projectorSees`).
//
// 1. Static: no src/ runtime file outside the level and room builders indexes a hazard, detector, target, entry,
//    sleeper, checkpoint or probe list with a number literal, or compares a detector index (`cause`, `spottedBy`,
//    `bump`) with one.
// 2. Every room in ROOMS: with an inert decoy hazard put first and the rest reversed, an idle run plays the same
//    sounds at the same moments and finds the same staff sparks.
// 3. Every level in LEVELS: with a decoy detector put first and the rest reversed, the projector is still the
//    detector that applauds, and no other detector is.
// 4. Round 3 (Sol P3): the 2199 recital audience slumped on loop indices 0 and 2 of the detector list, so one
//    inert hazard put first silenced both listeners. Listeners name their recital by data (`listenerRecitals`);
//    a loop over a detector list never compares its index with a number literal, and on every level in LEVELS
//    the real RecitalView, built headless, slumps the same listeners on the same frames with the list reordered.
import './pixi-headless';
import { describe, expect, it } from 'vitest';
import { STEP } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import type { Hazard } from '../src/abduct/rooms/interior';
import type { Room } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';
import { HazardField, type HazardDef } from '../src/flight/hazards';
import { DRIVE_IN_PROJECTOR, projectorSees } from '../src/flight/invasion1953';
import { GRIMSBY_SET, listenerRecitals } from '../src/flight/recital';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { RecitalView } from '../src/flight/views/recital';
import { CameraView } from '../src/flight/views/world';
import type { GameContext } from '../src/contracts';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef } from '../src/levels/types';
import { isDeep, LEVELS } from '../src/levels/levels';

const SOURCES = import.meta.glob(['../src/**/*.ts', '!../src/i18n/**', '!../src/levels/**', '!../src/abduct/rooms/**'],
  { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const LISTS = 'hazards|defs|targets|entries|sleepers|checkpoints|probes';
const INDEXED = new RegExp(`\\b(?:${LISTS})\\??\\.?\\[\\d+\\]`, 'g');
const CAUSE = /\b(?:cause|spottedBy|bump)\s*[!=]==?\s*\d+\b|\b\d+\s*[!=]==?\s*[\w.]*\b(?:cause|spottedBy|bump)\b/g;

/** Inside a loop over a level-data list (`for (let i = 0; i < f.defs.length; i++)`), its index compared with a number. */
function defLoopIndexCompares(code: string): { 0: string }[] {
  const out: { 0: string }[] = [];
  for (const m of code.matchAll(new RegExp(`for \\(let (\\w+) = 0; \\1 < [\\w.!?]*\\b(?:${LISTS})\\.length;[^)]*\\)\\s*\\{`, 'g'))) {
    let depth = 1, end = m.index! + m[0].length;
    while (depth > 0 && end < code.length) depth += code[end] === '{' ? 1 : code[end] === '}' ? -1 : 0, end++;
    const body = code.slice(m.index! + m[0].length, end);
    const index = new RegExp(`\\b${m[1]}\\s*[!=]==?\\s*\\d+\\b|\\b\\d+\\s*[!=]==?\\s*${m[1]}\\b`, 'g');
    for (const hit of body.matchAll(index)) out.push({ 0: hit[0] });
  }
  return out;
}

/** Every number-literal index into a level-data list and every detector index compared with a number: file → matches. */
export function indexCouplings(sources: Record<string, string>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [path, text] of Object.entries(sources)) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const hits = [...code.matchAll(INDEXED), ...code.matchAll(CAUSE), ...defLoopIndexCompares(code)].map(m => m[0]);
    if (hits.length) out[path.replace(/^\.\.\/src\//, '')] = hits;
  }
  return out;
}

describe('no behaviour keyed on a hazard list position', () => {
  it('reads the runtime sources', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
    expect(Object.keys(SOURCES)).toContain('../src/abduct/simulation.ts');
  });

  it('no number-literal index into hazards, detectors or targets, and no detector index compared with a number', () => {
    expect(indexCouplings(SOURCES)).toEqual({});
  });

  it('catches the old couplings (mutation check)', () => {
    expect(indexCouplings({
      '../src/abduct/simulation.ts': "const charge = this.room.human === 'tom_enchanter' && !!interior?.hazards[0]?.tell;",
      '../src/flight/views/deep.ts': 'this.driveIn?.sync(cam, t, rm, false, sim.st.cause === 0, bark);',
      '../src/flight/x.ts': 'if (field.defs[2]!.type === "camera" || 1 !== st.bump) {}',
    })).toEqual({
      'abduct/simulation.ts': ['hazards[0]'],
      'flight/views/deep.ts': ['cause === 0'],
      'flight/x.ts': ['defs[2]', '1 !== st.bump'],
    });
    // round 3 (Sol P3): the recital audience keyed on the detector loop index
    expect(indexCouplings({
      '../src/flight/views/recital.ts': 'for (let i = 0; i < f.defs.length; i++) { const d = f.defs[i]!; if (d.type === "camera") { const l = i === 0 ? a : i === 2 ? b : undefined; } }',
    })).toEqual({ 'flight/views/recital.ts': ['i === 0', 'i === 2'] });
    expect(indexCouplings({ '../src/ok.ts': 'for (let i = 0; i < f.defs.length; i++) { const l = this.audience[i]; if (i === cause) {} }' })).toEqual({});
    expect(indexCouplings({ '../src/ok.ts': 'const d = field.defs[cause]; if (cause >= 0) {}; rooms[0]' })).toEqual({});
  });
});

/** An inert laser far outside every building: it ticks on its own cycle and can catch nobody. */
const DECOY: Hazard = { kind: 'laser', name: 'Decoy (coupling test)', area: { x: -90000, y: -90000, w: 10, h: 10 }, cycle: { period: 2.3, open: 1.1, phase: 0.4 } };

function reordered(room: Room): Room {
  const route = room.interior!;
  const hazards = [DECOY, ...[...route.building.hazards].reverse()];
  return { ...room, interior: { ...route, building: { ...route.building, hazards } } };
}

/** The sounds of a 30 s idle run, with the step each played on. */
function idleSounds(room: Room): { sounds: string[]; spark: Hazard | undefined } {
  const sounds: string[] = [];
  let step = 0;
  const sim = new AbductSimulation(room, new Set(), { sfx: (name: string) => sounds.push(`${step}:${name}`) }, () => 0.5, { hard: true, wakeFails: true });
  for (; step < 30 / STEP; step++) sim.update(STEP);
  return { sounds, spark: sim.interior?.staffSpark?.spec };
}

describe('every room plays the same with its hazards reordered', () => {
  const rooms = Object.entries(ROOMS).filter(([, r]) => r.interior);

  it('walks the interior rooms and finds the staff sparks', () => {
    expect(rooms.length).toBeGreaterThan(30);
    const withSparks = rooms.filter(([, r]) => r.interior!.building.hazards.some(h => h.kind === 'laser' && h.skin === 'staff'));
    expect(withSparks.length).toBeGreaterThan(0);
  });

  it.each(rooms)('%s', (_, room) => {
    const plain = idleSounds(room);
    const moved = idleSounds(reordered(room));
    expect(moved.spark).toBe(plain.spark);
    expect(moved.sounds).toEqual(plain.sounds);
  });
});

describe('every level keeps its projector with its detectors reordered', () => {
  const DECOY_CAMERA: HazardDef = { ...DRIVE_IN_PROJECTOR, skin: undefined, x: -90000, y: -90000 };
  const levels = LEVELS.filter(isDeep);

  it.each(levels.map(l => [l.id, l] as const))('%s', (_, level) => {
    const defs = level.map.hazards;
    const moved = new HazardField([DECOY_CAMERA, ...[...defs].reverse()]);
    const plain = new HazardField(defs);
    const count = (field: HazardField) => field.defs.filter((_d, i) => projectorSees(field, i)).length;
    const projectors = defs.filter(d => d.type === 'camera' && d.skin === DRIVE_IN_PROJECTOR.skin).length;
    expect(count(plain)).toBe(projectors);
    expect(count(moved)).toBe(projectors);
    expect(projectorSees(moved, -1)).toBe(false);
    if (!projectors) return;
    // the saucer in the projector's beam: whichever index detects it, the applause follows the projector
    const p = DRIVE_IN_PROJECTOR;
    const x = p.x + Math.cos(p.base) * p.range * 0.5;
    const y = p.y + Math.sin(p.base) * p.range * 0.5;
    const lit = new Float64Array(64).fill(1);
    for (const field of [plain, moved]) {
      field.sample(0);
      const cause = field.detect(x, y, lit);
      expect(cause).toBeGreaterThanOrEqual(0);
      expect(projectorSees(field, cause)).toBe(field.defs[cause] === p);
    }
    expect(projectorSees(moved, moved.defs.indexOf(p))).toBe(true);
  });

  it('finds the drive-in projector on a level', () => {
    expect(levels.some(l => l.map.hazards.includes(DRIVE_IN_PROJECTOR))).toBe(true);
  });
});

describe('every level keeps its recital audience with its detectors reordered (round 3, Sol P3)', () => {
  /** An inert bunting far outside the map, as in Sol's probe. */
  const DECOY_WIRE: HazardDef = { type: 'wire', kind: 'bunting', ax: -90000, ay: -90000, bx: -89000, by: -90000 };
  const levels = LEVELS.filter(isDeep);
  const recitalLevels = levels.filter(l => l.map.theme === 'grimsby2199');

  it('finds the recital levels, and every listener there has its recital', () => {
    expect(recitalLevels.length).toBeGreaterThan(0);
    for (const level of recitalLevels) {
      const at = listenerRecitals(level.map.hazards);
      expect(at.length, level.id).toBe(GRIMSBY_SET.listeners.length);
      expect(at.every(i => i >= 0), level.id).toBe(true);
      expect(new Set(at).size, level.id).toBe(at.length);
    }
  });

  it.each(levels.map(l => [l.id, l] as const))('%s: each listener keeps the same recital', (_, level) => {
    const defs = level.map.hazards;
    for (const moved of [[DECOY_WIRE, ...[...defs].reverse()], [...defs].reverse()]) {
      const want = listenerRecitals(defs).map(i => (i >= 0 ? defs[i] : null));
      expect(listenerRecitals(moved).map(i => (i >= 0 ? moved[i] : null))).toEqual(want);
    }
  });

  /** For each listener, the frames (of 1200 at 60 fps) on which it is drawn slumped. */
  function slumps(level: DeepLevelDef): number[][] {
    const ctx = {
      pointer: { x: 270, y: 480, down: false, pressed: false, released: false }, audio: { sfx() {} }, assets: { get: () => undefined },
      upgrades: new Set(), time: 0, tutorial: false, reducedMotion: true,
    } as unknown as GameContext;
    const scene = new DeepFlightScene({ ctx, level, run: new DeepRun(level, LEVELS.indexOf(level)), onLocked() {}, onSunrise() {}, onQuit() {} });
    const view = new RecitalView(scene);
    const figures = (view as unknown as { listeners: { scale: { y: number } }[] }).listeners;
    const cam = new CameraView();
    const frames = figures.map((): number[] => []);
    for (let frame = 0; frame < 1200; frame++) {
      scene.sim.field.sample(frame / 60);
      view.sync(cam);
      figures.forEach((f, k) => { if (f.scale.y < 1) frames[k]!.push(frame); });
    }
    return frames;
  }

  it.each(recitalLevels.map(l => [l.id, l] as const))('%s: the RecitalView slumps the same listeners on the same frames', (_, level) => {
    const plain = slumps(level);
    expect(plain.map(f => f.length).every(n => n > 0), JSON.stringify(plain.map(f => f.length))).toBe(true);
    const hazards = level.map.hazards;
    for (const moved of [[DECOY_WIRE, ...hazards], [DECOY_WIRE, ...[...hazards].reverse()]]) {
      expect(slumps({ ...level, map: { ...level.map, hazards: moved } })).toEqual(plain);
    }
  });
});
