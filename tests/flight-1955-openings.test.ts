// 2026-11-26 openings: L9 launches at the south end of Main Street with no spawn gate and nothing aimed at the
// saucer on the first screen, yet a finger held straight at any of the six rings is caught on the way, beyond
// the opening. The courthouse worklamp covers the square (Doc), the Marshal's torch lights the alley up to the
// café (Buff, both doors), and the dance's two searchlights in the gym car park light the way up to Marvin's
// roof hatch and loading canopy. The planner's naive beeline is caught by the canopy searchlight.
import { describe, expect, it } from 'vitest';
import type { PointerState, Vec2 } from '../src/contracts';
import { DeepFlightSim } from '../src/flight/deep-sim';
import { HazardField } from '../src/flight/hazards';
import { VIEW_H, VIEW_W } from '../src/contracts';
import { LEVEL9 } from '../src/levels/deep-1955';
import { BEELINE_DELAYS } from './difficulty/beeline';
import { beelineController, runHeadless } from './flight-deep-harness';

const { map } = LEVEL9;
const DT = 1 / 60;
const idle: PointerState = { down: false, x: 0, y: 0, pressed: false, released: false };
const press = (sim: DeepFlightSim, goal: Vec2): PointerState => {
  const s = sim.saucer;
  const distance = Math.hypot(goal.x - s.x, goal.y - s.y);
  const scale = Math.min(186, distance * 1.4) / Math.max(1, distance);
  return {
    ...idle, down: distance > 12 || Math.hypot(s.vx, s.vy) > 60,
    x: s.x - sim.camX + (goal.x - s.x) * scale - s.vx * (distance < 130 ? 0.35 : 0.1),
    y: s.y - sim.camY + (goal.y - s.y) * scale - s.vy * (distance < 130 ? 0.35 : 0.1),
  };
};
const opening = new DeepFlightSim(map, new Set(), 0);
const onOpening = (x: number, y: number): boolean =>
  x >= opening.camX && x <= opening.camX + VIEW_W && y >= opening.camY && y <= opening.camY + VIEW_H;

describe('1955 · openings', () => {
  it('catches a straight run from the launch to every ring at every tested phase, beyond the opening', () => {
    const { start } = map;
    for (const entry of map.targets.flatMap(t => t.entries)) {
      for (const delay of BEELINE_DELAYS) {
        const sim = new DeepFlightSim(map, new Set(), delay);
        while (sim.phase === 'fly' && sim.t < delay + 16) sim.update(DT, press(sim, entry));
        const at = `${entry.roomId} from ${delay}s`;
        expect(sim.phase, at).toBe('spotted');
        const { x, y } = sim.saucer;
        expect(Math.hypot(x - start.x, y - start.y), at).toBeGreaterThan(600);
        expect(onOpening(x, y), `${at}: caught on the first screen`).toBe(false);
      }
    }
  });

  it('the naive beeline is caught at every tested phase, beyond the opening', () => {
    const { start } = map;
    for (const delay of BEELINE_DELAYS) {
      const run = runHeadless(map, [], beelineController, LEVEL9.budgetSec, true, delay);
      expect(run.done, `beeline from ${delay}s`).toBe(false);
      const spot = run.spots[0]!;
      expect(spot, `beeline from ${delay}s`).toBeDefined();
      expect(Math.hypot(spot.x - start.x, spot.y - start.y)).toBeGreaterThan(600);
      expect(onOpening(spot.x, spot.y)).toBe(false);
    }
  });

  it('shows no detector ahead of the saucer on the first screen at launch', () => {
    const { start } = map;
    const field = new HazardField(map.hazards);
    const lit = new Float64Array(8).fill(1);
    for (let t = 0; t < 12; t += 0.1) {
      field.sample(t);
      for (let x = start.x - 160; x <= start.x + 160; x += 16) {
        for (let y = opening.camY; y <= start.y; y += 16) {
          if (field.detect(x, y, lit) !== -1) throw new Error(`detector ahead of the launch at ${x},${y}, t=${t.toFixed(1)}`);
        }
      }
    }
  });

  it('keeps the west verge run to the time-car turnout dark', () => {
    const field = new HazardField(map.hazards);
    const lit = new Float64Array(8).fill(1);
    const points: Vec2[] = [];
    for (let x = 140; x <= map.start.x; x += 20) points.push({ x, y: map.start.y });
    for (let y = 980; y <= map.start.y; y += 20) points.push({ x: 140, y });
    for (let k = 0; k <= 10; k++) points.push({ x: 140 + 18 * k, y: 980 - 13 * k });
    for (let t = 0; t < 16; t += 0.05) {
      field.sample(t);
      for (const p of points) {
        if (field.detect(p.x, p.y, lit) !== -1) throw new Error(`verge exposed at ${p.x},${p.y}, t=${t.toFixed(2)}`);
      }
    }
  });
});
