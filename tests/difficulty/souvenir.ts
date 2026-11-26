// One deliberate side trip from the closest point on the planned route. The human hand
// still supplies the reaction lag, drift and tremor. No retries or seed-specific paths.
import { PILOT_CRUISE } from '../../src/abduct/autopilot';
import type { AbductSimulation } from '../../src/abduct/simulation';
import type { Room } from '../../src/abduct/rooms/layout';

type Point = { x: number; y: number };

export class SouvenirAttempt {
  private start: Point;
  private phase: 'route' | 'over' | 'lower' | 'lift' | 'return' | 'done' = 'route';
  private wait = 0;

  constructor(room: Room, spawn: Point) {
    const item = room.item.sprite;
    const aim = { x: item.x + item.w / 2, y: item.y + item.h / 2 - 60 };
    let previous = spawn;
    let nearest = Infinity;
    this.start = spawn;
    for (const next of room.interior?.checkpoints ?? room.route) {
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      // Finish a timed crossing before leaving the route.
      const along = ((aim.x - previous.x) * dx + (aim.y - previous.y) * dy) / (dx * dx + dy * dy || 1);
      const t = 'cross' in next && next.cross ? 1 : Math.max(0, Math.min(1, along));
      const point = { x: previous.x + t * dx, y: previous.y + t * dy };
      const distance = Math.hypot(aim.x - point.x, aim.y - point.y);
      if (distance < nearest) {
        nearest = distance;
        this.start = point;
      }
      previous = next;
    }
  }

  move(sim: AbductSimulation, pace: number, dt: number) {
    const { body, item } = sim;
    const x = body.beamX;
    const y = body.beamY;
    if (this.phase === 'done') return;
    if (this.phase === 'route') {
      if (item.captured || Math.hypot(this.start.x - x, this.start.y - y) > 8) return;
      this.start = { x, y };
      this.phase = 'over';
    }
    // Approach from above so the specimen clears the shelf, and retrace that path on departure.
    const high = Math.min(this.start.y, sim.room.item.sprite.y - 70);
    const ix = sim.room.item.sprite.x + sim.room.item.sprite.w / 2;
    if (item.captured && this.phase === 'over') this.phase = 'return';
    if (item.captured && this.phase === 'lower') this.phase = 'lift';
    let tx = ix;
    let ty = high;
    if (this.phase === 'lower') ty = item.y - 35;
    if (this.phase === 'return') ({ x: tx, y: ty } = this.start);
    const dx = tx - x;
    const dy = ty - y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      if (this.phase === 'over') this.phase = 'lower';
      else if (this.phase === 'lower') {
        this.wait += dt;
        if (this.wait > 1.5) this.phase = 'lift';
      } else if (this.phase === 'lift') this.phase = 'return';
      else this.phase = 'done';
    }
    const ratio = Math.min(1, dt * PILOT_CRUISE * pace / (distance || 1));
    return { dx: dx * ratio, dy: dy * ratio };
  }
}
