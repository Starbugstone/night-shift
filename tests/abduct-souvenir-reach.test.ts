// v4 items & recap humour: every room's loose item can actually be taken home. For each route (and
// the Field Check room) the item first settles with no input: it must rest where the room file puts
// it, stay in view (not under the sleeper's body) and leave room above it for the body to come down.
// Then a real beam run (physics only, no teleport) follows the route's own autopilot, makes a short
// detour to the item from one checkpoint, comes back to that checkpoint and finishes the route: the
// item must be captured and still with the body at the exit (`item.stolen`).
// The rules are the quiet ones (wake doesn't fail): this proves the item is obtainable, not that the
// detour is free. Each route prints how much the detour cost (seconds, peak wake, bonks).
import { describe, expect, it } from 'vitest';
import { AbductPilot } from '../src/abduct/autopilot';
import { STEP } from '../src/abduct/ragdoll';
import { ROOMS } from '../src/abduct/rooms';
import type { Room } from '../src/abduct/rooms/layout';
import { AbductSimulation } from '../src/abduct/simulation';
import { FIELD_CHECK_ROOM } from '../src/levels/field-check';

declare const process: { stdout: { write(message: string): boolean } };

const DT = 1 / 60;
const QUIET = { hard: false, wakeFails: false } as const;
/** How far a placed item may drop before it rests: the room file names where it lies. */
const MAX_SETTLE_DROP = 24;
/** Share of the settled item's box the sleeper's own body may cover. */
const MAX_COVERED = 0.25;
/** Clear width needed just above the item for the body to come down to it. */
const MIN_GAP = 72;

type Point = { readonly x: number; readonly y: number };
type Approach = 'flat' | 'direct';
type Phase = 'route' | 'out' | 'grab' | 'back';

const ALL: readonly (readonly [string, Room])[] = [...Object.entries(ROOMS), ['field_check', FIELD_CHECK_ROOM]];

function make(room: Room): AbductSimulation {
  return new AbductSimulation(room, new Set(), { sfx() {} }, () => 0.5, QUIET);
}

function checkpoints(room: Room): readonly Point[] {
  return room.interior ? room.interior.checkpoints : room.route;
}

/** Share of the item's box inside the sleeper's body volumes (joint and bone-midpoint radii). */
function coveredByBody(sim: AbductSimulation, room: Room): number {
  const { body } = sim;
  const { plan } = body;
  const { w, h } = room.item.sprite;
  let covered = 0;
  let samples = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 5; j++) {
      const px = sim.item.x - w / 2 + (w * (i + 0.5)) / 7;
      const py = sim.item.y - h / 2 + (h * (j + 0.5)) / 5;
      samples++;
      let inside = false;
      for (let k = 0; k < body.x.length && !inside; k++) {
        inside = Math.hypot(px - body.x[k]!, py - body.y[k]!) < plan.radii[k]!;
      }
      for (let b = 0; b < plan.bones && !inside; b++) {
        const ax = body.x[plan.boneA[b]!]!;
        const ay = body.y[plan.boneA[b]!]!;
        const bx = body.x[plan.boneB[b]!]!;
        const by = body.y[plan.boneB[b]!]!;
        const len2 = (bx - ax) ** 2 + (by - ay) ** 2;
        const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / len2)) : 0;
        inside = Math.hypot(px - (ax + (bx - ax) * t), py - (ay + (by - ay) * t)) < plan.midRadii[b]!;
      }
      if (inside) covered++;
    }
  }
  return covered / samples;
}

/** Clear width of the row just above the settled item, between the nearest solid rects on each side. */
function gapAbove(sim: AbductSimulation, room: Room): number {
  const y = sim.item.y - room.item.sprite.h / 2 - 24;
  let left = -Infinity;
  let right = Infinity;
  for (const s of sim.solids) {
    if (s.kind !== 'rect' || y < s.y || y > s.y + s.h) continue;
    if (s.x + s.w <= sim.item.x) left = Math.max(left, s.x + s.w);
    else if (s.x >= sim.item.x) right = Math.min(right, s.x);
    else return 0;
  }
  return right - left;
}

interface Run {
  sim: AbductSimulation;
  peakWake: number;
}

/** The route's autopilot from start to exit, without detours. */
function plainRun(room: Room): Run {
  const sim = make(room);
  let peakWake = 0;
  for (let f = 0; f < 160 * 60 && !sim.complete; f++) {
    const { dx, dy } = sim.autopilot();
    sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
    sim.update(DT);
    peakWake = Math.max(peakWake, sim.wake.value);
  }
  return { sim, peakWake };
}

/**
 * The route's autopilot with one detour: after reaching checkpoint `from` (-1 = the spawn, before the
 * first move), steer to the item (along the checkpoint's height first for 'flat'), lower the body
 * until it is captured, go back the same way to the checkpoint and finish the route.
 */
function detourRun(room: Room, from: number, approach: Approach, lift: number): Run {
  const sim = make(room);
  const pilot = new AbductPilot(room);
  const route = checkpoints(room);
  for (let f = 0; f < 120; f++) sim.update(DT); // the item settles first, as a player sees it
  // (widened: plan() switches the phase from inside a closure)
  let phase = 'route' as Phase;
  let out: Point[] = [];
  let back: Point[] = [];
  let grabbing = 0;
  let detoured = false;
  let peakWake = 0;
  const plan = (start: Point) => {
    detoured = true;
    const above = { x: sim.item.x, y: Math.min(start.y, sim.item.y - lift) };
    out = approach === 'flat' ? [{ x: sim.item.x, y: start.y }, above] : [above];
    back = [...out].reverse().concat([start]);
    phase = 'out';
  };
  const steer = (to: Point, speed: number): boolean => {
    const dx = to.x - sim.body.beamX;
    const dy = to.y - sim.body.beamY;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, speed * DT);
    if (d > 0) sim.moveBeam(sim.body.beamX + (dx / d) * step, sim.body.beamY + (dy / d) * step);
    return d < 1;
  };
  if (from < 0) plan({ x: sim.body.beamX, y: sim.body.beamY });
  for (let f = 0; f < 160 * 60 && !sim.complete; f++) {
    if (phase === 'route') {
      const { dx, dy } = pilot.move(sim.body, sim.elapsed, sim.interior);
      sim.moveBeam(sim.body.beamX + dx, sim.body.beamY + dy);
      const at = route[from];
      if (!detoured && at && pilot.checkpoint === from + 1 && Math.hypot(sim.body.beamX - at.x, sim.body.beamY - at.y) < 1) plan(at);
    } else if (phase === 'out') {
      if (steer(out[0]!, 70)) out.shift();
      if (out.length === 0 || sim.item.captured) phase = 'grab';
    } else if (phase === 'grab') {
      // Lower the chest to just above the item, slowly, by following the body rather than the beam.
      steer({ x: sim.body.beamX + sim.item.x - sim.body.chestX, y: sim.body.beamY + sim.item.y - 30 - sim.body.chestY }, 45);
      grabbing += DT;
      if (sim.item.captured || grabbing > 6) phase = 'back';
    } else {
      if (back.length > 0 && steer(back[0]!, 60)) back.shift();
      if (back.length === 0) phase = 'route';
    }
    sim.update(DT);
    peakWake = Math.max(peakWake, sim.wake.value);
  }
  return { sim, peakWake };
}

describe('every room item can be taken home', () => {
  it.each(ALL)('%s: the item settles in view where the room puts it', (_, room) => {
    const sim = make(room);
    const placed = sim.item.y;
    for (let t = 0; t < 2 / STEP; t++) sim.update(STEP);
    const drop = sim.item.y - placed;
    expect(Math.abs(sim.item.vy), 'item at rest').toBeLessThan(2);
    expect(drop, `item drops ${drop.toFixed(0)} px before resting (rests at ${sim.item.x.toFixed(0)},${sim.item.y.toFixed(0)})`).toBeLessThan(MAX_SETTLE_DROP);
    expect(coveredByBody(sim, room), 'item hidden under the sleeper').toBeLessThan(MAX_COVERED);
    expect(gapAbove(sim, room), 'item wedged in a gap the body cannot enter').toBeGreaterThanOrEqual(MIN_GAP);
    if (room.interior) {
      const { x, y } = sim.item;
      expect(room.interior.building.rooms.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h), 'item inside a room').toBe(true);
    }
  });

  it.each(ALL)('%s: a detour from the route grabs the item and delivers it', (id, room) => {
    const plain = plainRun(room);
    expect(plain.sim.delivered, 'the plain route delivers').toBe(true);
    const route = checkpoints(room);
    const s = room.item.sprite;
    const ix = s.x + s.w / 2;
    const iy = s.y + s.h / 2;
    const near = (i: number): number => {
      const p = i < 0 ? { x: room.pose.neckX, y: room.pose.neckY } : route[i]!;
      return Math.hypot(p.x - ix, p.y - iy);
    };
    // The detour starts from the spawn or one of the checkpoints nearest the item.
    const starts = [-1, ...route.map((_, i) => i)].sort((a, b) => near(a) - near(b)).slice(0, 4);
    const tried: string[] = [];
    let found: (Run & { how: string }) | undefined;
    if (plain.sim.item.stolen) found = { ...plain, how: 'on the route' };
    for (const from of starts) {
      for (const approach of ['flat', 'direct'] as const) {
        for (const lift of [80, 140]) {
          if (found) break;
          const run = detourRun(room, from, approach, lift);
          const how = `${from < 0 ? 'spawn' : `checkpoint ${from}`} ${approach} ${lift}`;
          if (run.sim.delivered && run.sim.item.stolen) found = { ...run, how };
          else tried.push(`${how}: ${run.sim.item.captured ? 'grabbed, lost before the exit' : 'not grabbed'}${run.sim.delivered ? '' : `, ${run.sim.failure?.reason ?? 'no delivery'}`}`);
        }
      }
    }
    expect(found, `${id}: no detour took the item home\n  ${tried.join('\n  ')}`).toBeDefined();
    const { sim, peakWake, how } = found!;
    const extra = sim.elapsed - plain.sim.elapsed;
    process.stdout.write(`[souvenir ${id}] ${room.item.name}: ${how}, +${extra.toFixed(1)} s, peak wake ${peakWake.toFixed(0)} (route ${plain.peakWake.toFixed(0)}), ${sim.wake.bonks} bonks\n`);
  }, 60_000);
});
