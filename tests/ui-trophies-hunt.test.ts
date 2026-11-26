import { expect, it } from 'vitest';
import type { GameContext } from '../src/contracts';
import { ROOMS } from '../src/abduct/rooms';
import { DeepFlightScene } from '../src/flight/deep-scene';
import { trophyHunt, type HuntTarget } from '../src/flight/hunt';
import { FlightScene } from '../src/flight/scene';
import { LEVELS, levelRooms } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import { buildTownCatalog, buildTrophyCatalog } from '../src/ui/trophy-data';

function flight(index: number, hunt: HuntTarget) {
  const level = LEVELS[index]!;
  const ctx: GameContext = {
    pointer: { x: 270, y: 480, down: false, pressed: false, released: false },
    assets: { get: () => undefined }, audio: { sfx() {} }, upgrades: new Set(),
    reducedMotion: true, tutorial: false, time: 0, hunt,
  };
  const callbacks = { onLocked() {}, onSunrise() {}, onQuit() {} };
  return level.kind === 'deep'
    ? new DeepFlightScene({ ctx, level, run: new DeepRun(level, index), ...callbacks })
    : new FlightScene({ ctx, level, spotted: 0, ...callbacks });
}

it('maps every room souvenir to its playable flight entry', () => {
  const slots = buildTrophyCatalog().flatMap(section => section.slots);
  for (const [room, def] of Object.entries(ROOMS)) {
    const slot = slots.find(slot => slot.itemId === def.item.name);
    expect(slot, room).toBeDefined();
    expect(trophyHunt(slot!, () => false)).toBeNull();
    const launch = trophyHunt(slot!, () => true)!;
    expect(launch.target.kind).toBe('souvenir');
    expect(flight(launch.index, launch.target).huntPosition, room).toBeDefined();
  }
  LEVELS.forEach((level, index) => {
    for (const room of levelRooms(level)) {
      const entries = level.kind === 'deep' ? level.map.targets.flatMap(target => target.entries) : level.map.entries;
      const entry = entries.find(entry => entry.roomId === room)!;
      expect(flight(index, { kind: 'souvenir', itemId: ROOMS[room].item.name, room }).huntPosition).toMatchObject({ x: entry.x, y: entry.y });
    }
  });
});

it('marks every field find and hides the marker after pickup', () => {
  const slots = buildTownCatalog();
  LEVELS.forEach((level, index) => {
    if (!level.map.collectible) return;
    const slot = slots.find(slot => slot.levelId === level.id)!;
    expect(trophyHunt(slot, () => false)).toBeNull();
    const launch = trophyHunt(slot, candidate => candidate === index)!;
    expect(launch.index).toBe(index);
    const scene = flight(index, launch.target);
    const pickup = scene instanceof DeepFlightScene ? scene.sim.collectible : scene.collectible;
    expect(scene.huntPosition).toEqual(pickup?.available ? pickup.position : undefined);
    expect(pickup).not.toBeNull();
    pickup!.collected = true;
    expect(scene.huntPosition).toBeUndefined();
  });
});
