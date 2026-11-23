import { VIEW_H, VIEW_W, type AbductResult, type AbductStart, type GameContext, type RoomId, type Scene, type Vec2 } from '../contracts';
import { tr } from '../i18n';
import { DeepAbductView, drawFailure, drawSnooze } from './deep-view';
import { AbductView, RESTART } from './draw';
import { ROOMS } from './rooms';
import { FOLLOW } from './ragdoll';
import { CEILING } from './rooms/layout';
import { AbductSimulation } from './simulation';
import { TURN_BUTTONS_DEEP, TURN_BUTTONS_ROOM, TurnControl } from './turn';

const TAP_LENGTH = 0.24;
const DOUBLE_TAP = 0.32;
const TAP_TRAVEL = 22;
/** The turn hint stays up this long after the first drag, until the player turns once. */
const TURN_HINT_SECONDS = 7;

interface AbductScene extends Scene {
  debug: AbductSimulation;
}

/** Screen-space origin for the shell's iris transition. */
export function emitterPoint(roomId: RoomId): Vec2 {
  const room = ROOMS[roomId];
  if (room.interior) return { x: VIEW_W / 2, y: VIEW_H * 0.49 };
  return { x: room.roofExit ? room.exit.x + room.exit.w / 2 : VIEW_W / 2, y: CEILING };
}

export function createAbductScene(ctx: GameContext, start: AbductStart, onDone: (result: AbductResult) => void): AbductScene {
  const simulation = new AbductSimulation(ROOMS[start.roomId], ctx.upgrades, ctx.audio, Math.random, start.rules);
  const view = simulation.interior ? new DeepAbductView(simulation, ctx) : new AbductView(simulation, ctx);
  let tutorial = ctx.tutorial;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pressAt = 0;
  let travel = 0;
  let firstTapAt = -Infinity;
  let firstTapX = 0;
  let firstTapY = 0;
  let clock = 0;
  let finished = false;
  const turn = new TurnControl(simulation.interior ? TURN_BUTTONS_DEEP : TURN_BUTTONS_ROOM);
  let twisted = false;
  let turnHintUntil = -1;

  function endDrag(): void {
    if (!dragging) return;
    dragging = false;
    ctx.audio.sfx('beam_off');
  }

  return {
    update(dt) {
      if (finished) return;
      clock += dt;
      const { pointer } = ctx;
      const playable = !simulation.delivered && !simulation.failure;
      if (playable && pointer.pressed) {
        if (pointer.x >= RESTART.x && pointer.x <= RESTART.x + RESTART.w &&
            pointer.y >= RESTART.y && pointer.y <= RESTART.y + RESTART.h) {
          finished = true;
          endDrag();
          onDone(simulation.result(true));
          return;
        }
        if ((pointer.down || pointer.released) && !turn.pressPrimary(pointer.x, pointer.y)) {
          dragging = true;
          lastX = pointer.x;
          lastY = pointer.y;
          twisted = false;
          pressAt = clock;
          travel = 0;
          // A mouse or pen aims with the eye: the body has to stop where the cursor stops.
          simulation.body.follow = pointer.kind === 'mouse' || pointer.kind === 'pen' ? FOLLOW.mouse : FOLLOW.touch;
          ctx.audio.sfx('beam_on');
        }
      }

      if (playable) {
        const radians = turn.update(pointer, dt);
        if (radians !== 0) simulation.body.rotate(radians);
      } else {
        turn.reset();
      }

      if (playable && dragging && (pointer.down || pointer.released)) {
        // Two fingers twisting: the midpoint drags the beam, so the twist itself does not.
        const second = pointer.second;
        const twist = turn.twisting && second !== undefined;
        const refX = twist ? (pointer.x + second.x) / 2 : pointer.x;
        const refY = twist ? (pointer.y + second.y) / 2 : pointer.y;
        if (twist !== twisted) {
          twisted = twist;
          lastX = refX;
          lastY = refY;
        }
        const dx = refX - lastX;
        const dy = refY - lastY;
        if (dx !== 0 || dy !== 0) {
          tutorial = false;
          if (turnHintUntil < 0) turnHintUntil = clock + TURN_HINT_SECONDS;
          simulation.moveBeam(simulation.body.beamX + dx, simulation.body.beamY + dy);
          travel += Math.hypot(dx, dy);
          lastX = refX;
          lastY = refY;
        }
        if (pointer.released && simulation.snoozeOwned && travel <= TAP_TRAVEL && clock - pressAt <= TAP_LENGTH) {
          if (clock - firstTapAt <= DOUBLE_TAP && Math.hypot(pointer.x - firstTapX, pointer.y - firstTapY) <= 80) {
            simulation.snooze();
            firstTapAt = -Infinity;
          } else {
            firstTapAt = clock;
            firstTapX = pointer.x;
            firstTapY = pointer.y;
          }
        } else if (travel > TAP_TRAVEL) {
          firstTapAt = -Infinity;
        }
      }
      if (!pointer.down || pointer.released) endDrag();

      simulation.update(dt);
      if (simulation.delivered || simulation.failure) endDrag();
      if (simulation.complete) {
        finished = true;
        onDone(simulation.result());
      }
    },
    render(g) {
      const playable = !simulation.delivered && !simulation.failure;
      const hint = playable && !turn.used && !simulation.body.gripActive && clock < turnHintUntil
        ? (ctx.pointer.kind === 'mouse' || ctx.pointer.kind === 'pen' ? tr().abduct.turnHintMouse : tr().abduct.turnHintTouch)
        : undefined;
      view.render(g, tutorial && !simulation.delivered, dragging, turn, hint);
      if (!simulation.interior) {
        drawSnooze(g, simulation, ctx.reducedMotion);
        drawFailure(g, simulation, ctx.reducedMotion);
      }
    },
    dispose() {
      endDrag();
      turn.reset();
    },
    debug: simulation,
  };
}
