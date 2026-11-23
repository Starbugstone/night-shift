import { describe, expect, it, vi } from 'vitest';
import type { GameContext, PointerState, RoomId, SecondPointer } from '../src/contracts';
import { createAbductScene } from '../src/abduct';
import { FOLLOW, Joint, Ragdoll, STEP, TURN, type Rect } from '../src/abduct/ragdoll';
import { CHAIR_POSE } from '../src/abduct/rooms/layout';
import {
  RIGHT_DRAG_TURN, TURN_BUTTONS_DEEP, TURN_BUTTONS_ROOM, TURN_RATE, TURN_TAP, TurnControl, WHEEL_TURN, turnButtonAt,
} from '../src/abduct/turn';
import { BONK_SPEED } from '../src/abduct/wake';

/** A body hanging in the beam in open air, lift fully on. */
function hanging(solids: Rect[] = []): Ragdoll {
  const body = new Ragdoll({ ...CHAIR_POSE, neckX: 270, neckY: 420 }, solids);
  body.beamX = 270;
  body.beamY = 450;
  let lift = 0;
  for (let i = 0; i < 2 / STEP; i++) {
    lift = Math.min(1, lift + STEP * 2);
    body.step(lift);
  }
  return body;
}

/** Turns at the key rate until `target` has been asked for, then waits out `seconds`. */
function turnBy(body: Ragdoll, target: number, seconds: number): number {
  let asked = 0;
  let maxBoneError = 0;
  for (let i = 0; i < seconds / STEP; i++) {
    if (asked < Math.abs(target)) {
      const d = Math.min(TURN_RATE * STEP, Math.abs(target) - asked);
      body.rotate(Math.sign(target) * d);
      asked += d;
    }
    body.step(1);
    maxBoneError = Math.max(maxBoneError, body.maxBoneError());
  }
  return maxBoneError;
}

describe('turning the specimen (physics)', () => {
  it('hangs upright and ignores turning until the player first turns', () => {
    const body = hanging();
    expect(body.turning).toBe(false);
    expect(Math.abs(body.tilt)).toBeLessThan(0.1);
  });

  it.each([
    { target: Math.PI / 2, side: 1 },
    { target: -Math.PI / 2, side: -1 },
  ])('turns $target rad about the chest and keeps the bones whole', ({ target, side }) => {
    const body = hanging();
    const boneError = turnBy(body, target, 2);
    expect(Math.abs(body.tilt - target)).toBeLessThan(0.15);
    // clockwise puts the head to the right of the chest, anticlockwise to the left
    expect((body.x[Joint.Head]! - body.chestX) * side).toBeGreaterThan(55);
    // it turns about the chest: the chest stays near the beam
    expect(Math.hypot(body.chestX - body.beamX, body.chestY - body.beamY)).toBeLessThan(16);
    expect(boneError).toBeLessThan(3);
    expect([...body.x, ...body.y].every(Number.isFinite)).toBe(true);
  });

  it('can go fully upside down and the limbs still flop behind the torso', () => {
    const body = hanging();
    turnBy(body, Math.PI, 3);
    expect(Math.abs(Math.abs(body.tilt) - Math.PI)).toBeLessThan(0.25);
    expect(body.y[Joint.Head]!).toBeGreaterThan(body.chestY + 40);
  });

  it('never lets the target run more than TURN.lead ahead of the body', () => {
    const body = hanging();
    body.rotate(10);
    expect(body.turn - body.tilt).toBeCloseTo(TURN.lead, 6);
    body.rotate(-30);
    expect(body.turn - body.tilt).toBeCloseTo(-TURN.lead, 6);
  });

  it('turning hard into a wall is a bonk like any other', () => {
    const wall: Rect = { kind: 'rect', x: 330, y: 0, w: 200, h: 1000, vx: 0, vy: 0 };
    const body = hanging([wall]);
    let hardest = 0;
    for (let i = 0; i < 1.5 / STEP; i++) {
      if (i < 0.8 / STEP) body.rotate(-4 * STEP);
      body.step(1);
      hardest = Math.max(hardest, body.impacts[0]!);
    }
    expect(hardest).toBeGreaterThan(BONK_SPEED);
  });

  it('a gentle turn beside the wall stays under the bonk threshold', () => {
    const wall: Rect = { kind: 'rect', x: 380, y: 0, w: 200, h: 1000, vx: 0, vy: 0 };
    const body = hanging([wall]);
    let hardest = 0;
    for (let i = 0; i < 2 / STEP; i++) {
      if (i < 1 / STEP) body.rotate(-0.6 * STEP);
      body.step(1);
      hardest = Math.max(hardest, body.impacts[0]!);
    }
    expect(hardest).toBeLessThan(BONK_SPEED);
  });
});

describe('turn input mapping', () => {
  function pointer(over: Partial<PointerState> = {}): PointerState {
    return { down: false, x: 270, y: 500, pressed: false, released: false, ...over };
  }
  function second(over: Partial<SecondPointer> = {}): SecondPointer {
    return { down: false, x: 0, y: 0, pressed: false, released: false, ...over };
  }

  it('maps keys, wheel and right-button drag to radians', () => {
    const turn = new TurnControl(TURN_BUTTONS_ROOM);
    expect(turn.update(pointer({ turnKeys: 1 }), 0.1)).toBeCloseTo(TURN_RATE * 0.1);
    expect(turn.update(pointer({ turnKeys: -1 }), 0.1)).toBeCloseTo(-TURN_RATE * 0.1);
    expect(turn.update(pointer({ wheel: 100 }), 1 / 60)).toBeCloseTo(100 * WHEEL_TURN);
    expect(turn.update(pointer({ rightDx: -30 }), 1 / 60)).toBeCloseTo(-30 * RIGHT_DRAG_TURN);
    expect(turn.used).toBe(true);
    expect(turn.dir).toBe(-1);
    expect(turn.update(pointer(), 1 / 60)).toBe(0);
    expect(turn.tell).toBeLessThan(1);
  });

  it('turns by the angle a two-finger twist sweeps', () => {
    const turn = new TurnControl(TURN_BUTTONS_DEEP);
    const p = pointer({ down: true, x: 200, y: 500, second: second({ down: true, pressed: true, x: 340, y: 500 }) });
    expect(turn.update(p, 1 / 60)).toBe(0);
    expect(turn.twisting).toBe(true);
    let total = 0;
    p.second!.pressed = false;
    for (let i = 1; i <= 10; i++) {
      const a = 0.05 * i;
      p.x = 270 - Math.cos(a) * 70;
      p.y = 500 - Math.sin(a) * 70;
      p.second!.x = 270 + Math.cos(a) * 70;
      p.second!.y = 500 + Math.sin(a) * 70;
      total += turn.update(p, 1 / 60);
    }
    expect(total).toBeCloseTo(0.5, 6);
    p.second!.down = false;
    p.second!.released = true;
    turn.update(p, 1 / 60);
    expect(turn.twisting).toBe(false);
  });

  it('a second thumb on a rotate button taps, then turns at the hold rate', () => {
    const turn = new TurnControl(TURN_BUTTONS_DEEP);
    const r = TURN_BUTTONS_DEEP.right;
    const p = pointer({ down: true, second: second({ down: true, pressed: true, x: r.x + 20, y: r.y + 20 }) });
    expect(turn.update(p, 0.1)).toBeCloseTo(TURN_TAP + TURN_RATE * 0.1);
    expect(turn.twisting).toBe(false);
    p.second!.pressed = false;
    expect(turn.update(p, 0.1)).toBeCloseTo(TURN_RATE * 0.1);
    p.second!.down = false;
    p.second!.released = true;
    turn.update(p, 0.1);
    expect(turn.update(p, 0.1)).toBe(0);
  });

  it('finds the buttons on the HUD second row in both layouts', () => {
    for (const buttons of [TURN_BUTTONS_ROOM, TURN_BUTTONS_DEEP]) {
      expect(turnButtonAt(buttons, buttons.left.x + 5, buttons.left.y + 5)).toBe(-1);
      expect(turnButtonAt(buttons, buttons.right.x + buttons.right.w - 5, buttons.right.y + 5)).toBe(1);
      expect(turnButtonAt(buttons, 270, 600)).toBe(0);
      expect(buttons.left.w).toBeGreaterThanOrEqual(56);
    }
  });
});

describe('turning in the abduction scene', () => {
  function scene(id: RoomId, kind?: PointerState['kind']) {
    const ctx: GameContext = {
      pointer: { x: 270, y: 520, down: false, pressed: false, released: false, ...(kind ? { kind } : {}) },
      assets: { get: () => undefined }, audio: { sfx: vi.fn() }, upgrades: new Set(),
      tutorial: false, reducedMotion: true, time: 0,
    };
    const s = createAbductScene(ctx, { roomId: id, levelId: 'headless' }, vi.fn());
    const frame = () => {
      ctx.time += 1 / 60;
      s.update(1 / 60);
      ctx.pointer.pressed = ctx.pointer.released = false;
      if (ctx.pointer.second) ctx.pointer.second.pressed = ctx.pointer.second.released = false;
    };
    return { s, ctx, frame, sim: (s as unknown as { debug: import('../src/abduct/simulation').AbductSimulation }).debug };
  }

  it('a press on a rotate button turns the body and does not drag the beam', () => {
    const { ctx, frame, sim } = scene('farm_window');
    const r = TURN_BUTTONS_ROOM.right;
    const beamX = sim.body.beamX;
    Object.assign(ctx.pointer, { x: r.x + 30, y: r.y + 30, down: true, pressed: true });
    frame();
    for (let i = 0; i < 30; i++) {
      ctx.pointer.x += 3;
      frame();
    }
    expect(sim.body.beamX).toBe(beamX);
    expect(sim.body.turning).toBe(true);
    expect(ctx.audio.sfx).not.toHaveBeenCalledWith('beam_on');
  });

  it('a two-finger twist drags the beam by the midpoint, so twisting in place does not move it', () => {
    const { ctx, frame, sim } = scene('dave_patio');
    Object.assign(ctx.pointer, { x: 200, y: 520, down: true, pressed: true });
    frame();
    ctx.pointer.second = { x: 340, y: 520, down: true, pressed: true, released: false };
    frame();
    const beamX = sim.body.beamX;
    const beamY = sim.body.beamY;
    for (let i = 1; i <= 20; i++) {
      const a = 0.04 * i;
      ctx.pointer.x = 270 - Math.cos(a) * 70;
      ctx.pointer.y = 520 - Math.sin(a) * 70;
      ctx.pointer.second.x = 270 + Math.cos(a) * 70;
      ctx.pointer.second.y = 520 + Math.sin(a) * 70;
      frame();
    }
    expect(Math.hypot(sim.body.beamX - beamX, sim.body.beamY - beamY)).toBeLessThan(0.001);
    expect(sim.body.turning).toBe(true);
    // lifting the second finger hands the drag back to the first without a jump
    ctx.pointer.second.down = false;
    ctx.pointer.second.released = true;
    frame();
    ctx.pointer.x += 10;
    frame();
    expect(sim.body.beamX - beamX).toBeCloseTo(10, 6);
  });

  it('switches to the precise follow for a mouse and keeps the swingy one for touch', () => {
    for (const [kind, follow] of [['mouse', FOLLOW.mouse], ['pen', FOLLOW.mouse], ['touch', FOLLOW.touch], [undefined, FOLLOW.touch]] as const) {
      const { ctx, frame, sim } = scene('farm_chimney', kind);
      Object.assign(ctx.pointer, { down: true, pressed: true });
      frame();
      expect(sim.body.follow, String(kind)).toBe(follow);
    }
  });
});
