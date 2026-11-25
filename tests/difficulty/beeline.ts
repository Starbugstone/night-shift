import type { GameContext, RoomId } from '../../src/contracts';
import { ROOMS } from '../../src/abduct/rooms';
import { AbductSimulation } from '../../src/abduct/simulation';
import { FlightScene } from '../../src/flight/scene';
import type { LevelDef, TutorialLevelDef } from '../../src/levels/types';
import { beelineController, runHeadless } from '../flight-deep-harness';

export const BEELINE_DELAYS = [0, 2.5, 5, 8] as const;
const DT = 1 / 60;

function cleanTutorialBeeline(level: TutorialLevelDef, entry: TutorialLevelDef['map']['entries'][number], delay: number): boolean {
  const ctx: GameContext = {
    pointer: { down: false, x: 0, y: 0, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(), tutorial: false, time: 0, reducedMotion: false,
  };
  let delivered = false;
  const scene = new FlightScene({
    ctx, level, spotted: 0,
    onLocked: () => { delivered = true; },
    onQuit: () => { throw new Error('Beeline quit instead of steering'); },
  });
  for (let f = 0; f < delay * 60; f++) scene.update(DT);
  for (let f = 0; f < 60 * 60 && !delivered && scene.state !== 'spotted'; f++) {
    const { x, y, vx, vy } = scene.saucer;
    const dx = entry.x - x;
    const dy = entry.y - y;
    const d = Math.hypot(dx, dy);
    const lead = Math.min(180, d * 1.4);
    ctx.pointer.down = d > 14 || Math.hypot(vx, vy) > 65;
    ctx.pointer.x = x - scene.camX + dx * lead / Math.max(1, d) - vx * (d < 130 ? 0.35 : 0.1);
    ctx.pointer.y = y - scene.camY + dy * lead / Math.max(1, d) - vy * (d < 130 ? 0.35 : 0.1);
    scene.update(DT);
  }
  return delivered;
}

export function beelineFlight(level: LevelDef): number {
  let stopped = 0;
  for (const delay of BEELINE_DELAYS) {
    if (level.kind === 'tutorial') {
      if (level.map.entries.every(entry => !cleanTutorialBeeline(level, entry, delay))) stopped++;
    } else {
      const route = runHeadless(level.map, [], beelineController, level.budgetSec, true, delay);
      if (!route.done) stopped++;
    }
  }
  return stopped;
}

export function naiveRoomWins(id: RoomId, hard: boolean): number {
  const room = ROOMS[id];
  let wins = 0;
  for (const delay of BEELINE_DELAYS) {
    const sim = new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, { hard, wakeFails: hard });
    for (let f = 0; f < delay * 60; f++) sim.update(DT);
    for (let f = 0; f < 60 * 45 && !sim.delivered && !sim.failure && !sim.wake.woke; f++) {
      const { beamX, beamY } = sim.body;
      const dx = sim.exitX - beamX;
      const dy = sim.exitY - beamY;
      const fraction = Math.min(1, 270 * DT / Math.max(1, Math.hypot(dx, dy)));
      sim.moveBeam(beamX + dx * fraction, beamY + dy * fraction);
      sim.update(DT);
    }
    if (sim.delivered && !sim.wake.woke) wins++;
  }
  return wins;
}
