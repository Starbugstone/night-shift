// The difficulty model charges the shift clock for a room exactly as the game does (v0.2 council
// round 2, Sol P1). The game stops charging when the room accepts the specimen (DeepAbductScene,
// src/ui/deep-abduct.ts); the model used to charge through the 0.56 s exit animation, so every next
// flight started at another hazard phase than in the game (L12 casual Ghost 7/20 against 5/20 with
// the game's cutoff). Both now ask `roomChargesShift`. This test plays the model's own hands through
// the game's scenes (createAbductScene inside a DeepAbductScene, driven by the pointer) and through
// the model's simulation host, for every room of every deep level in LEVELS, and wants the same
// outcome and the same charged shift time from both.
import { describe, expect, it } from 'vitest';
import type { GameContext, PointerState, RoomId } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { LEVELS } from '../src/levels/levels';
import { DeepRun } from '../src/levels/run';
import type { DeepLevelDef } from '../src/levels/types';
import { DeepAbductScene } from '../src/ui/deep-abduct';
import { PROFILES, playAbduction, type RoomHost, type RoomSetup } from './difficulty/human';

const DT = 1 / 60;

/** The game's own room scenes, fed the model's finger through the pointer like a phone. */
function gameHost(level: DeepLevelDef, target: number, entry: number) {
  return (setup: RoomSetup): RoomHost => {
    const run = new DeepRun(level, LEVELS.indexOf(level));
    run.startAbduct(target, entry);
    const start = run.elapsed;
    const pointer: PointerState = { x: 270, y: 480, down: false, pressed: false, released: false, kind: 'touch' };
    const ctx: GameContext = {
      pointer, assets: { get: () => undefined }, audio: setup.audio, upgrades: setup.upgrades,
      tutorial: false, time: 0, reducedMotion: false,
    };
    const roomId = level.map.targets[target]!.entries[entry]!.roomId;
    // the room takes its randomness from Math.random: hand it the model's seeded one
    const random = Math.random;
    Math.random = setup.random;
    let inner: ReturnType<typeof createAbductScene>;
    try {
      inner = createAbductScene(ctx, { levelId: level.id, roomId, rules: setup.rules }, () => {}, setup.room);
    } finally {
      Math.random = random;
    }
    const scene = new DeepAbductScene(inner, run, ctx.assets, () => false, () => {});
    return {
      sim: inner.debug,
      frame(finger) {
        const down = finger !== null;
        pointer.pressed = down && !pointer.down;
        pointer.released = !down && pointer.down;
        pointer.down = down;
        if (finger) {
          pointer.x = finger.x;
          pointer.y = finger.y;
        }
        scene.update(DT);
      },
      get charged() { return run.elapsed - start; },
    };
  };
}

const deep = LEVELS.filter((level): level is DeepLevelDef => level.kind === 'deep');

describe('the difficulty model charges room time like the game', () => {
  it('walks every deep level', () => {
    expect(deep.length).toBeGreaterThan(10);
  });
  for (const level of deep) {
    const rooms = level.map.targets.flatMap((target, t) => target.troop ? [] : target.entries.map((entry, e) => ({ roomId: entry.roomId as RoomId, t, e })));
    it(`${level.id}: every room charges the same shift time in the model and in the game`, () => {
      const off: string[] = [];
      for (const { roomId, t, e } of rooms) {
        for (const profile of [PROFILES.skilled, PROFILES.casual]) {
          const model = playAbduction(roomId, profile, 1);
          const game = playAbduction(roomId, profile, 1, undefined, [], 'exit', gameHost(level, t, e));
          const same = model.delivered === game.delivered && model.failReason === game.failReason &&
            Math.abs(model.timeSec - game.timeSec) < 1e-9;
          if (!same) off.push(`${roomId} ${profile.name}: model ${model.failReason ?? 'delivered'} at ${model.timeSec.toFixed(2)} s, game ${game.failReason ?? 'delivered'} at ${game.timeSec.toFixed(2)} s`);
          else if (Math.abs(model.shiftSec - game.shiftSec) > 1e-6) off.push(`${roomId} ${profile.name}: model charges ${model.shiftSec.toFixed(3)} s, game ${game.shiftSec.toFixed(3)} s`);
        }
      }
      expect(off).toEqual([]);
    }, 240_000);
  }
});
