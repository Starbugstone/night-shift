---
name: evaluate-difficulty
description: Measure how hard a Night Shift deep level is for human-like players (reaction delay, hand wobble, human drag speed), check it against the level's target band, find which hazard or prop causes the failures, and prove the level stays completable. Use when a level feels too hard or too easy, after changing rooms, hazards, wake or suspicion tuning, or before shipping a new level.
---

# Evaluate difficulty

The solvability tests (`tests/abduct-deep.test.ts`, `tests/flight-autopilot.test.ts`) only prove a
*perfect* bot can finish. That bot drags the beam at 41 px/s with frame-perfect timing, which no
person does. This skill measures what a person meets, using the same route planners played through
a human "hand".

## The model (`tests/difficulty/human.ts`)

| Profile | Drag pace | Reaction | Wobble | Drift | Meaning |
| --- | --- | --- | --- | --- | --- |
| `bot` | 1× | 0 s | 0 px | 0 px | the solvability proof |
| `skilled` | 2.2× | 0.18 s | 4 px | 10 px | a practised player |
| `casual` | 3× | 0.28 s | 7 px | 20 px | a first evening |

- **Abduction**: `AbductPilot` with a pace multiplier (darts capped at 320 px/s). The hand plays the
  plan `reaction` s late, with a few-Hz tremor and a slow drift off the ideal line. It eases off for
  2.5 s after hearing a creak or a crash. When the body snags and the beam runs on (lead > 150 px and
  the chest still for 0.5 s), it drags back to the body and rewinds to the last checkpoint reached.
  Each run starts 0–8 s into the hazard cycles, under the deep rules (`wakeFails`, `hard`).
- **Flight**: `FlightAutopilot`, run with a person's reaction. When the right move changes (wait → go,
  go → wait, dash), the thumb keeps doing what it was doing for `reaction` s, then follows. Steering
  runs 0.08 s behind, with tremor and drift. Do not delay the whole steering signal by the full
  reaction time: that makes the high-gain steering loop oscillate, which people don't do.
- **Calibration:** the model is *optimistic*, because it knows the ideal route. Before the
  2026-11-23 retune, L3 scored skilled ≈ 1 and casual ≈ 3 sightings per flight, and 0–50% skilled
  delivery for Dave and Barb's back door. The player who reported it as "way too hard" could not get
  one specimen out. Read the numbers as a floor on real difficulty, and compare levels against each
  other rather than against absolute targets.

## Run it

```bash
npm run difficulty                                    # all deep levels, 6 seeds each
DIFFICULTY_SEEDS=20 npm run difficulty                # steadier numbers (~1 min)
DIFFICULTY_LEVELS=level3,level4 DIFFICULTY_OUT=review/difficulty npm run difficulty
```

It prints one table per level: delivery rate, median time, peak wake and peak second-sleeper wake per
route and profile, with fail causes; then flight sightings by cause, naive-beeline catches, a
"tension" score and a whole-shift time estimate. `DIFFICULTY_OUT` also writes `<level>.md` and `.json`
(`review/` is ignored by Git). `npm test` enforces every deep level's band at 6 seeds. Seed counts
must be positive integers. Unknown level IDs and levels without a band fail the check.

## Bands (`tests/difficulty/evaluate.ts`, `BANDS`)

L3 ("firm but fair", the first deep level): skilled delivers ≥ 80% and casual ≥ 50% on every route;
the easier route of each building delivers ≥ 80% for casual. Median flight sightings: skilled ≤ 1,
casual ≤ 2. At least 80% of flights finish. The casual shift estimate fits in 80% of the sunrise
budget. **Not trivial:** a naive beeline is caught at ≥ 2 of 4 start times, and casual peak wake
averages ≥ 20. L4 allows ≥ 75% skilled delivery on each route and uses the same remaining targets
as L3.

## Find the cause

When a route is out of band, find *what* wakes the specimen before you change anything. In a
scratch test, wrap `WakeMeter.prototype.impact` / `noise`. Map the hardest
`body.impacts[i]` to a name: indices below `sim.wallCount` (private: cast in scratch code) are walls,
`interior.hazards[k].firstSolid …+shapes.length` are hazards, and the rest is furniture (log
`body.impactX/Y` to tell which piece). Then sum the wake gained per source over 10 seeds. A
`timeout` with `stall.checkpoint` means the run got stuck: the body jams on a lip or the delivery
zone sits out of reach. Fix the level, not the model. Delete scratch probes when done.

Causes found and fixed in the 2026-11-23 L3 retune:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Barb's back door: 0% | the snag "squash" bonk re-fired every 0.2 s (+18 wake each) | fire once per snag (`SQUASH_SPEED`, latched until strain clears) |
| Dave's roof: woke / timeout | the swinging Attic bulb hung ~11 px over the route; the chest stopped 20 px short of the hatch zone | gentler bulb, route lowered, exit zone 40 px deeper |
| Dave, both routes | the bedroom wardrobe and the attic shelf sat across the line | nightstand instead of wardrobe, shelf and extra chandelier removed |
| Dave's patio: timeout | the body snagged on the stairwell hatch lip | stairwell hatch 198 px wide |
| Dave's patio: woke | the route dragged the feet over the fish tank | route lifted over the tank |
| Flight: casual never finished | 18 porch lights (one lit the road out of the start) plus Gary's camera and three yard lights round his ring | 10 lights at 100/175 px, one door trap left (Gary's drive), camera tamed, 1.3 s fuse (`DeepMap.fuseSec`) |

## Levers, mildest first

1. Move a prop or a checkpoint so the ideal line has ≥ 20 px of clearance (the route is in
   `src/abduct/rooms/deep.ts`; the bot's proof tests must still pass).
2. Hazard tempo: swing amplitude or speed, gate `open` window, camera sweep or range.
3. Remove an obstacle the design doc does not list. Players read clutter as unfair.
4. Rules: the `fuseSec` per map, and the `WakeMeter` constants (`HARD_BONK_SPEED`, gain, decay).
   These change every deep level, so re-run every band.

After any change, run `npm test`. The bot proofs, the jittered-input and mouse-latency sweeps, the
beeline tests and this band must all pass. Then run `npm run typecheck`.

## Prove it in the browser

The model is headless. Finish with a real-input pass, using the `verify-night-shift` skill: open a changed
room with `?room=<id>`, drive it with `game.pilotRoom(id)`, and capture the changed spots (the moved
prop, the widened hatch, the delivery). For flight, open the level and capture the HUD fuse: it must
show the level's fuse length. Hand-play at least one changed route with the mouse at a normal pace,
and report whether you woke anyone.
