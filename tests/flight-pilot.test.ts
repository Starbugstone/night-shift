import { describe, expect, it } from 'vitest';
import { PILOT, Pilot, newPilotInput, type PilotInput } from '../src/flight/pilot';

const DT = 1 / 60;

/** Run `sec` seconds; `each` may change the input per frame (frame index, time). */
function run(p: Pilot, inp: PilotInput, sec: number, rm = false, each?: (i: number, t: number) => void): Pilot {
  const n = Math.round(sec / DT);
  for (let i = 0; i < n; i++) {
    each?.(i, i * DT);
    p.update(DT, inp, rm);
  }
  return p;
}

/** Fly a circle at `speed` px/s turning `rate` rad/s (+ = clockwise on screen = right turn). */
function circling(inp: PilotInput, speed: number, rate: number): (i: number, t: number) => void {
  return (_i, t) => {
    inp.vx = Math.cos(rate * t) * speed;
    inp.vy = Math.sin(rate * t) * speed;
  };
}

describe('pilot moods', () => {
  it('cruises with the tongue out while flying straight', () => {
    const inp = newPilotInput();
    inp.vx = 250;
    const p = run(new Pilot(), inp, 1);
    expect(p.mood).toBe('cruise');
    expect(p.mouth).toBe('tongue');
    expect(Math.abs(p.wheel)).toBeLessThan(0.05);
  });

  it('gets bored, yawns and picks its nose while parked', () => {
    const inp = newPilotInput();
    const p = new Pilot();
    const seen = new Set<string>();
    run(p, inp, PILOT.boredAfter + PILOT.loop + 0.5, false, () => seen.add(p.mood));
    expect([...seen]).toEqual(expect.arrayContaining(['cruise', 'bored', 'yawn', 'pick']));
    // the order: bored first, then a yawn, then the nose
    const at = (sec: number): string => run(new Pilot(), newPilotInput(), sec).mood;
    expect(at(PILOT.boredAfter + 0.2)).toBe('bored');
    expect(at(PILOT.boredAfter + (PILOT.yawnAt + PILOT.yawnEnd) / 2)).toBe('yawn');
    const picking = run(new Pilot(), newPilotInput(), PILOT.boredAfter + (PILOT.pickAt + PILOT.pickEnd) / 2);
    expect(picking.mood).toBe('pick');
    expect(picking.pick).toBeGreaterThan(0.8);
  });

  it('a yawn opens the mouth wide', () => {
    let widest = 0;
    const p = new Pilot();
    run(p, newPilotInput(), PILOT.boredAfter + PILOT.yawnEnd, false, () => {
      if (p.mood === 'yawn') widest = Math.max(widest, p.mouthOpen);
    });
    expect(widest).toBeGreaterThan(0.9);
  });

  it('cranks the wheel the way of a sharp turn and squashes the cheeks', () => {
    for (const dir of [1, -1]) {
      const inp = newPilotInput();
      const p = run(new Pilot(), inp, 0.6, false, circling(inp, 320, 4 * dir));
      expect(p.mood).toBe('turn');
      expect(Math.sign(p.wheel)).toBe(dir);
      expect(Math.abs(p.wheel)).toBeGreaterThan(0.8);
      expect(p.squash).toBeGreaterThan(0.3);
    }
  });

  it('is thrown away from a sideways shove', () => {
    for (const dir of [1, -1]) {
      const inp = newPilotInput();
      const p = run(new Pilot(), inp, 0.3, false, (i) => (inp.vx = dir * i * 20));
      expect(Math.sign(p.lean)).toBe(-dir);
      expect(Math.abs(p.lean)).toBeGreaterThan(0.5);
    }
  });

  it('a gentle curve is not a sharp turn', () => {
    const inp = newPilotInput();
    const p = run(new Pilot(), inp, 1, false, circling(inp, 250, 1));
    expect(p.mood).toBe('cruise');
  });

  it('holds a turn briefly after the stick straightens, then cruises', () => {
    const inp = newPilotInput();
    const p = run(new Pilot(), inp, 0.5, false, circling(inp, 320, 4));
    expect(p.mood).toBe('turn');
    run(p, inp, PILOT.turnHold + 0.4);
    expect(p.mood).toBe('cruise');
  });

  it('flat out is a zoom', () => {
    const inp = newPilotInput();
    inp.vy = -PILOT.maxSpeed;
    expect(run(new Pilot(), inp, 0.5).mood).toBe('zoom');
  });

  it('goes dizzy on a fresh bump and recovers', () => {
    const inp = newPilotInput();
    inp.vx = 150;
    const p = run(new Pilot(), inp, 0.3);
    inp.stun = 0.35;
    p.update(DT, inp, false);
    expect(p.mood).toBe('dizzy');
    expect(p.eyes).toBe('spin');
    // the stun winds down but the dizziness lasts
    run(p, inp, 0.5, false, () => (inp.stun = Math.max(0, inp.stun - DT)));
    expect(p.mood).toBe('dizzy');
    expect(p.spin).toBeGreaterThan(0);
    run(p, inp, PILOT.dizzy);
    expect(p.mood).toBe('cruise');
  });

  it('a stun that only winds down is not a new hit', () => {
    const inp = newPilotInput();
    inp.stun = 0.3;
    const p = run(new Pilot(), inp, 0.1);
    run(p, inp, PILOT.dizzy + 0.2, false, () => (inp.stun = Math.max(0, inp.stun - DT)));
    expect(p.mood).not.toBe('dizzy');
  });

  it('panics and ducks deeper as the fuse burns, then sighs with relief on escape', () => {
    const inp = newPilotInput();
    inp.vx = 100;
    const p = run(new Pilot(), inp, 0.3);
    inp.exposed = true;
    inp.sus = 0.2;
    run(p, inp, 0.3);
    expect(p.mood).toBe('panic');
    expect(p.eyes).toBe('wide');
    expect(p.mouth).toBe('teeth');
    expect(p.sweat).toBeGreaterThanOrEqual(0);
    const shallow = p.duck;
    inp.sus = 0.8;
    run(p, inp, 0.3);
    expect(p.duck).toBeGreaterThan(shallow);
    inp.exposed = false;
    p.update(DT, inp, false);
    expect(p.mood).toBe('phew');
    expect(p.mouth).toBe('puff');
    run(p, inp, PILOT.phew + 0.1);
    expect(p.mood).toBe('cruise');
    expect(p.sweat).toBe(-1);
  });

  it('a brush with a detector that barely started the fuse gets no phew', () => {
    const inp = newPilotInput();
    const p = new Pilot();
    inp.exposed = true;
    inp.sus = 0.1;
    run(p, inp, 0.1);
    inp.exposed = false;
    p.update(DT, inp, false);
    expect(p.mood).not.toBe('phew');
  });

  it('screams at the photo flash and cheers on lock-on, whatever else is going on', () => {
    const inp = newPilotInput();
    inp.exposed = true;
    inp.stun = 0.4;
    inp.phase = 'spotted';
    const p = run(new Pilot(), inp, 0.4);
    expect(p.mood).toBe('caught');
    expect(p.mouth).toBe('open');
    expect(p.palms).toBeGreaterThan(0.9);
    inp.phase = 'locking';
    inp.exposed = false;
    run(p, inp, 0.4);
    expect(p.mood).toBe('cheer');
    expect(p.eyes).toBe('happy');
    expect(p.handsUp).toBeGreaterThan(0.9);
  });

  it('a hit outranks being seen; being seen outranks a sharp turn', () => {
    const inp = newPilotInput();
    const p = run(new Pilot(), inp, 0.3, false, circling(inp, 320, 4));
    inp.exposed = true;
    inp.sus = 0.5;
    run(p, inp, 0.2, false, circling(inp, 320, 4));
    expect(p.mood).toBe('panic');
    inp.stun = 0.35;
    p.update(DT, inp, false);
    expect(p.mood).toBe('dizzy');
  });

  it('whistles innocently after a respawn, but not for the short start window', () => {
    const inp = newPilotInput();
    inp.ghost = 1.6;
    const p = run(new Pilot(), inp, 0.2);
    expect(p.mood).toBe('innocent');
    expect(p.mouth).toBe('whistle');
    inp.ghost = 0.4;
    run(p, inp, 0.1);
    expect(p.mood).toBe('cruise');
  });

  it("moves the mouth while Zib's line is up", () => {
    const inp = newPilotInput();
    inp.vx = 200;
    inp.talking = true;
    const p = new Pilot();
    let lo = 1;
    let hi = 0;
    run(p, inp, 1, false, () => {
      lo = Math.min(lo, p.mouthOpen);
      hi = Math.max(hi, p.mouthOpen);
    });
    expect(p.mouth).toBe('open');
    expect(hi - lo).toBeGreaterThan(0.3);
  });
});

describe('pilot body', () => {
  it('antennae lag behind a sideways shove and spring back', () => {
    const inp = newPilotInput();
    const p = new Pilot();
    run(p, inp, 0.2);
    // shove right hard for a moment
    run(p, inp, 0.12, false, (i) => (inp.vx = (i + 1) * 30));
    expect(p.antL).toBeLessThan(-0.05);
    expect(p.antR).toBeLessThan(-0.05);
    // (back at rest before boredom droops them)
    run(p, newPilotInput(), 1.5);
    expect(Math.abs(p.antL)).toBeLessThan(0.06);
  });

  it('a hit flings the antennae', () => {
    const inp = newPilotInput();
    const p = run(new Pilot(), inp, 0.2);
    inp.stun = 0.35;
    run(p, inp, 0.1);
    expect(Math.abs(p.antL)).toBeGreaterThan(0.3);
  });

  it('keeps every output finite and bounded through a rough flight', () => {
    const inp = newPilotInput();
    const p = new Pilot();
    run(p, inp, 20, false, (i, t) => {
      inp.vx = Math.sin(t * 3.1) * 430;
      inp.vy = Math.cos(t * 2.3) * 430;
      inp.stun = i % 97 === 0 ? 0.35 : Math.max(0, inp.stun - DT);
      inp.exposed = Math.sin(t) > 0.5;
      inp.sus = (t % 3) / 3;
      inp.phase = i % 600 < 20 ? 'spotted' : 'fly';
      for (const v of [p.wheel, p.lean, p.duck, p.squash, p.lookX, p.lookY, p.antL, p.antR, p.hop, p.mouthOpen]) {
        expect(Number.isFinite(v)).toBe(true);
      }
      expect(Math.abs(p.antL)).toBeLessThanOrEqual(1.3);
      expect(Math.abs(p.lean)).toBeLessThanOrEqual(1);
      expect(p.duck).toBeLessThanOrEqual(1);
    });
  });

  it('is deterministic', () => {
    const a = newPilotInput();
    const b = newPilotInput();
    const pa = run(new Pilot(), a, 2, false, circling(a, 300, 3));
    const pb = run(new Pilot(), b, 2, false, circling(b, 300, 3));
    expect(pa.wheel).toBe(pb.wheel);
    expect(pa.antL).toBe(pb.antL);
  });
});

describe('pilot with reduced motion', () => {
  it('changes faces but nothing wobbles, spins or hops', () => {
    const inp = newPilotInput();
    const p = new Pilot();
    run(p, inp, 0.5, true, circling(inp, 320, 4));
    expect(p.mood).toBe('turn');
    expect(p.lean).toBe(0);
    expect(p.antL).toBe(0);
    expect(Math.abs(p.wheel)).toBeLessThanOrEqual(0.6);
    inp.stun = 0.35;
    run(p, inp, 0.3, true);
    expect(p.mood).toBe('dizzy');
    expect(p.eyes).toBe('x');
    expect(p.spin).toBe(0);
    expect(p.stars).toBe(0);
    inp.phase = 'locking';
    run(p, inp, 0.5, true);
    expect(p.hop).toBe(0);
    expect(p.antR).toBe(0);
  });

  it('never blinks (the face holds still)', () => {
    const p = new Pilot();
    const inp = newPilotInput();
    inp.vx = 200;
    run(p, inp, 8, true, () => expect(p.eyes).toBe('open'));
  });
});
