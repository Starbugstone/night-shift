import type { CreateAbductScene } from '../contracts';
import { AbductView, RESTART } from './draw';
import { ROOMS } from './rooms';
import { AbductSimulation } from './simulation';

export const createAbductScene: CreateAbductScene = (ctx, start, onDone) => {
  const simulation = new AbductSimulation(ROOMS[start.roomId], ctx.upgrades, ctx.audio);
  const view = new AbductView(simulation, ctx);
  let tutorial = ctx.tutorial;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let finished = false;

  function endDrag(): void {
    if (!dragging) return;
    dragging = false;
    ctx.audio.sfx('beam_off');
  }

  return {
    update(dt) {
      if (finished) return;
      const { pointer } = ctx;
      if (pointer.pressed) {
        if (pointer.x >= RESTART.x && pointer.x <= RESTART.x + RESTART.w &&
            pointer.y >= RESTART.y && pointer.y <= RESTART.y + RESTART.h) {
          finished = true;
          endDrag();
          onDone(simulation.result(true));
          return;
        }
        if (!simulation.delivered && pointer.down) {
          dragging = true;
          lastX = pointer.x;
          lastY = pointer.y;
          ctx.audio.sfx('beam_on');
        }
      }

      if (dragging && pointer.down && !simulation.delivered) {
        const dx = pointer.x - lastX;
        const dy = pointer.y - lastY;
        if (dx !== 0 || dy !== 0) {
          tutorial = false;
          simulation.moveBeam(simulation.body.beamX + dx, simulation.body.beamY + dy);
          lastX = pointer.x;
          lastY = pointer.y;
        }
      }
      if (!pointer.down || pointer.released) endDrag();

      simulation.update(dt);
      if (simulation.delivered) endDrag();
      if (simulation.complete) {
        finished = true;
        onDone(simulation.result());
      }
    },
    render(g) {
      view.render(g, tutorial && !simulation.delivered, dragging);
    },
    dispose: endDrag,
    /** For automated test scripts (window.__nightShift.active.debug). */
    debug: simulation,
  } as ReturnType<CreateAbductScene> & { debug: AbductSimulation };
};
