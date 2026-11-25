---
name: evaluate-difficulty
description: Measure Night Shift star rates and deep-level difficulty for human-model players. Find which detectors or rooms cost a star, tune the level, and prove that the routes stay completable. Use after changing a room, flight hazard, wake, suspicion or star tuning, or when adding a level.
---

# Evaluate difficulty

The solvability tests (`tests/abduct-deep.test.ts`, `tests/flight-autopilot.test.ts`) prove that
planned routes can finish. This skill uses the same route planners with faster drags, reaction lag
and hand wobble to measure route difficulty and full-shift star rates.

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
- **Deep flight**: `FlightAutopilot`, run with a person's reaction. When the right move changes (wait → go,
  go → wait, dash), the thumb keeps doing what it was doing for `reaction` s, then follows. Steering
  runs 0.08 s behind, with tremor and drift. Do not delay the whole steering signal by the full
  reaction time: that makes the high-gain steering loop oscillate, which people don't do.
- **Tutorial flight** uses the two approaches from the pointer playthrough, with the same steering
  lag and wobble. Each profile tries both entries at every seed with the tutorial wake rules.
- **Whole shift** uses the live flight scenes and `DeepRun`. Each player starts 0–9 s into the hazard
  cycle, picks rings through the flight planner and spends time in each room before the next leg.
  Actual room failures trigger a retry of the same route with fresh input. A room that still has
  no outcome after 180 s ends the attempt. Shifts run with no upgrades and menus add no time.
  The independent room and flight runs still check the existing difficulty bands.
- **Calibration:** the model is *optimistic*, because it knows the ideal route. Before the
  2026-11-23 retune, L3 scored skilled ≈ 1 and casual ≈ 3 sightings per flight, and 0–50% skilled
  delivery for Dave and Barb's back door. The player who reported it as "way too hard" could not get
  one specimen out. Read the numbers as a floor on real difficulty, and compare levels against each
  other rather than against absolute targets.

## Run it

```bash
npm run difficulty                                    # all levels, 6 seeds each
DIFFICULTY_SEEDS=20 npm run difficulty                 # steadier rates for tuning
DIFFICULTY_LEVELS=level3,level4 DIFFICULTY_OUT=review/difficulty npm run difficulty
```

Each level lists the stars earned out of all attempts for each profile. The denominator includes
missed deliveries and sunrise. Deep levels also show route delivery, median time, peak wake, flight
sightings, and beeline catches. `DIFFICULTY_OUT` writes `<level>.md` and `<level>.json` under the
chosen directory. The deep JSON records each sighting's detector index, world coordinates, shift
time and exposure by detector since the fuse last emptied. Overlapping detectors share a single
fuse, and each frame is attributed to the detector the game selects. `npm test` enforces the bands
at six seeds.
Seed counts must be positive integers. Unknown level IDs and deep levels without a band fail.

## Star bands

The game awards Delivered for a completed delivery or all three in a deep shift. Still asleep
requires a tutorial delivery with no wake-up. Ghost requires all three deliveries before sunrise,
zero full flight sightings and zero failed abductions. A glimpse can build suspicion. The fuse
must reach full to count a sighting, and its grace period can carry suspicion between detectors.
Night owl uses the exact tutorial par or the deep sunrise margin.

For L8, score two field witnesses from each troop plus Echo in the appeals hatch. A
moving hover lock is a flight pickup. Include its time in the flight sample and keep
the room sample to `echo_appeal`. Ghost uses full flight sightings alone after the
quota is met. Night owl needs 25 s left on the 100 s sunrise clock. The whole-shift
runner and the game share these rules. At six seeds after the first-slab retune, the filing
run scored 5/6, 4/6, 4/6 for skilled and 6/6, 3/6, 4/6 for casual (quota, Ghost, Night owl).

| Shifts | Profile | Delivered floor | Still asleep or Ghost range | Night owl floor |
| --- | --- | --- | --- | --- |
| L1–L2 | Skilled | 5/6 | 75–100% | 2/3 |
| L1–L2 | Casual | 2/3 | 60–100% | 1/2 |
| L3–L4 | Skilled | 5/6 | 2/3–100% | 2/3 |
| L3–L4 | Casual | 2/3 | 60–90% | 1/2 |
| L5–L6 | Skilled | 5/6 | 60–100% | 2/3 |
| L5–L6 | Casual | 2/3 | 45–90% | 1/2 |
| L7–L8 | Skilled | 5/6 | 50–100% | 2/3 |
| L7–L8 | Casual | 2/3 | 33–90% | 1/2 |

Skilled floors are higher in each tier. The skilled model must also earn Ghost more often
than the casual model on a deep shift. A casual Ghost ceiling of 90% rejects six clean runs
out of six. Tutorial wake is forgiving while the player learns the controls, so both models
can earn Still asleep on every attempt. Retest near a boundary at 20 seeds. Human playtests
can also reveal a hard-to-read tell.
[Deep shift design](../../../docs/GDD-2-deeper.md)
and [later feel targets](../../../docs/GDD-3-new-shifts.md#feel-targets-and-proof).

## Bands (`tests/difficulty/evaluate.ts`, `BANDS`)

L3 ("firm but fair", the first deep level): skilled delivers ≥ 80% and casual ≥ 50% on every route;
the easier route of each building delivers ≥ 80% for casual. Median flight sightings: skilled ≤ 1,
casual ≤ 2. At least 80% of flights finish. The casual shift estimate fits in 80% of the sunrise
budget. L4 allows ≥ 75% skilled delivery on each route and uses the same remaining targets as L3.

## Hard rules

These hold on every level and room, tutorials included. A change that breaks one is not finished,
whatever the bands say.

- **No straight-line win.** The beeline and straight-drag checks under *Too-easy checks* must fail
  at every tested delay. Put the challenge on the obvious path; never lower the threshold.
- **Ghost stays reachable.** It may be hard, but the casual model must earn it within the star
  band, more generously on early levels.
- **No bump on start.** Every room spawn (`ROOMS` plus the Field Check room) must sit for 10 s with
  no input and record zero bonks and zero wake. The player must never lose wake before touching the
  beam. `tests/abduct-spawn.test.ts` enforces it in `npm test`. When you add or move a sleeper,
  furniture near the spawn, or a hazard that reaches it, run that test. To fix a failure, start the
  sleeper in its settled pose or move it clear: change the spawn pose or position, not the wake
  rules. Then rerun the route autopilots and `npm run difficulty`.
- **Tutorial rooms work without the route.** The human model follows the planned route, so a
  100% band does not show that a first-time player gets through. A plain drag (lift, move over
  the obstacle, head for the exit you can see, hold, release) must deliver with mouse and touch at
  200 and 350 px/s. `tests/abduct-tutorial-plain.test.ts` enforces this for Doyle's chimney and
  the laundry loading door. Add a plain path there when you add or change a tutorial room. Keep
  the challenge on the way in (mantel corner, fan, cart, washers), never as a snag inside the last
  shaft or doorway. A v4 ledge inside Doyle's flue scored 100% in the model, yet stopped a real
  player.

- **Every town pickup is hinted in the shift memo.** Each level after L1 has exactly one optional
  map collectible, and its shift memo mentions it in EN and FR. A memo that already names an object or
  person makes that thing the pickup. When you add a level, add both: the pickup (placed off the
  straight route, outside every detector, clear of rings and pills) and the memo line. When you rewrite
  a memo, keep the hint. `tests/flight-collectible*.test.ts` enforces it over all of `LEVELS`. The
  pickup is optional: check that the bands, the beeline and Ghost are unchanged with it in the map.

- **Every souvenir has a place in the trophy room.** A new room or route brings its souvenir to the
  trophy room: a slot, a name in `tr().items` and a catchy EN and FR description.
  `tests/ui-trophies*.test.ts` checks every room. One room for now; a second room opens when the shelves
  outgrow the first (docs/GDD-9-trophy-room.md).

## Too-easy checks

- **Flight.** At each delay (0, 2.5, 5 and 8 s), a straight hold toward either tutorial ring must
  get spotted or fail to lock within 60 s. On deep shifts a pilot takes the shortest geometrically
  open path and ignores detection and timing. It must get spotted or fail to reach the full quota
  before the shift budget at all four delays. This leaves careful routes room to work around a threat.
- **Rooms.** At the same delays, a steady 270 px/s drag straight at the exit must wake the specimen,
  trip an alarm or fail to deliver within 45 s. This catches usable shortcuts through scenery or
  across timing obstacles even when the authored route is challenging. Use the side route or wait
  pocket to retain a clean proof. L8 flight pickups have their room check in Echo’s appeals hatch.
- **Flight pressure.** On a deep shift the casual median peak Suspicion must reach 5%. That is about
  three frames of the default fuse. Its small floor detects a route that never even brushes a threat
  while allowing most runs to keep Ghost. The tutorial approaches can stay fully outside detection.
- **Wake pressure.** Casual median peak wake averaged across a deep shift’s rooms remains at least
  20 out of 100. The direct-drag check also exercises each room separately.
- **Room approach.** At least one casual run on every playable room route must get within 80 px
  of a solid obstacle or a hazard zone, or engage an active room rule. Sample at 10 Hz after the
  chest has travelled 160 px from spawn. A timed gate still has a crossing zone while open.
  Walls and decorative scenery cannot meet the clearance check. Wake, camera exposure, loss of
  dolphin moisture and a probe reading also count as evidence of an active room rule.
- **Par headroom.** The median successful casual run must use at least 30% of the Night owl par.
  By using par instead of the sunrise budget, the check leaves time for a recovery or room retry.
  The Night owl floor still protects players from a par that is too tight.

## Retune results (2026-11-24)

Each cell lists **Delivered / Still asleep or Ghost / Night owl**. Rates use six seeds per profile
and level, with both routes per seed in the tutorials (12 attempts). L3, L7 and L8 use 20 seeds.
Arrows mark before → after. The historical L8 row covers the original six cave routes.

| Level | Skilled | Casual |
| --- | --- | --- |
| L1 · Farm | 92% / 92% / 92% | 92% / 92% / 92% |
| L2 · Laundromat | 100% / 100% / 100% | 100% / 100% / 100% |
| L3 · Cul-de-Sac | 100% / 75% / 100% → 100% / 80% / 100% | 100% / 60% / 100% → 100% / 60% / 90% |
| L4 · Downtown | 100% / 50% / 100% | 100% / 33% / 100% |
| L5 · Pier | 100% / 67% / 100% | 100% / 50% / 100% |
| L6 · Clinic | 100% / 100% / 100% | 100% / 100% / 100% |
| L7 · Cruise | 65% / 35% / 65% → 95% / 80% / 95% | 85% / 45% / 85% → 90% / 65% / 90% |
| L8 · Prior Contact | 100% / 100% / 100% | 100% / 80% / 100% → 100% / 95% / 100% |

- **L3.** Gary's CCTV filled the fuse near (1614–1660, 2056–2096). In one catch the driveway
  light contributed 0.72 s and the camera finished with 0.60 s. A roof-biased aim
  (0.35 → 0.18 rad) and faster sweep (1.1 → 1.25 rad/s) shorten its pass near the garage door.
  Casual Night owl fell by two runs in the 20-seed sample and remains above its floor.
- **L4.** Six of the seven first sightings across the two profiles came from the Bassment's
  camera around the fire-escape approach (1252–1337, 2066–2228). The plaza CCTV and office
  window added exposure there. The original settings passed the bands, including all four
  beeline catches and the clean-flight proof.
- **L5, L6 and L8.** The L5 lighthouse caused all five first sightings, including two
  near (1647–1680, 2060–2108). The L6 six-seed shifts had no full sightings. In the latest L8
  sample, the third hum slab caused one casual sighting near (771, 943).
- **L7.** First catches clustered at the aft photographer (1136–1168, 2572–2607) and the
  midship photographer (862–893, 1798–1832). Shrinking the three frames from 200 × 160 px to
  160 × 128 px lets the same dodge clear the shutter sooner. Photographer first sightings fell
  from 11 to one across the 40 attempts. The six-seed gate saw skilled Ghost fall from 5/6 to 3/6,
  which still cleared its floor. Two of four beelines were caught on both L3 and L7 after tuning.

Real-pointer runs on an Intel GPU earned all three stars on L3 and L7, each with zero sightings and
zero failed abductions.

## Find the cause

For a low Ghost rate, compare the first sightings and room failures in the whole-shift report.
Open the JSON and match repeated detector indices to `level.map.hazards`. Use the coordinates to
locate the approach or entry ring, and the exposure breakdown to see if another detector filled
part of the fuse before the final one. Check the timing and available cover at that spot. Tune
the detector placement or sweep, then repeat the same seeds and check the beeline and route bands.

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
2. Give adjacent detectors separate coverage. First try moving a light, turning a camera or
   shortening how long a sweep stays on the ring. Leave an approach with room to hover for the
   full lock. For rooms, try swing amplitude or speed, gate timing or a shorter camera sweep.
3. Remove an obstacle the design doc does not list. Players read clutter as unfair.
4. Rules: `fuseSec` tunes a map. Shared `WakeMeter` constants such as `HARD_BONK_SPEED`, gain and
   decay affect every deep level. Re-run every band after changing shared rules.

After any change, run `npm test`. The bot proofs, the jittered-input and mouse-latency sweeps, the
beeline tests and this band must all pass. Then run `npm run typecheck`.

## Prove it in the browser

The model is headless. For a changed room, use `game.pilotRoom(id)` from the
[verification skill](../verify-night-shift/SKILL.md) and capture the changed spot and the delivery.
For a Ghost retune, serve an `e2e` build and run
`ONLY=L3 BASE=http://127.0.0.1:5311/ node scripts/e2e-playthrough.cjs`, with the real GPU flags
from the verification skill. Set `ONLY` to the changed level. At the report, check three deliveries,
zero sightings and failed abductions, and the Ghost flag in the resulting save.
