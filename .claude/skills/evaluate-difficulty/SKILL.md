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

- **Abduction**: `AbductPilot` with a pace multiplier (darts capped at the touch speed cap,
  `POINT.max` = 260 px/s). The hand plays the plan `reaction` s late, with a few-Hz tremor and a slow
  drift off the ideal line. The beam follows the hand through the live touch path: the finger sits
  ahead of the beam and `pointStep` moves it, so no frame beats `POINT.max`, the same limit a phone
  enforces (`tests/levels-difficulty-touch.test.ts` checks every room). It eases off for
  2.5 s after hearing a creak or a crash. When the body snags and the beam runs on (lead > 150 px and
  the chest still for 0.5 s), it drags back to the body and rewinds to the last checkpoint reached.
  At a settle exit (the Grail's time window, `exitSettleSec`) the hand lets go one reaction after the
  chest enters the zone, as the room and the memo tell the player, and takes hold again if the body swings
  out (`tests/levels-difficulty-settle.test.ts`). Each run starts 0–8 s into the hazard cycles, under the
  deep rules (`wakeFails`, `hard`).
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
npm run difficulty                                    # all levels, 6 seeds each: the sanity check in npm test
npm run difficulty:release                            # the release sweep: every level, 20 seeds, exact bands
DIFFICULTY_LEVELS=level3,level4 npm run difficulty:release   # 20 seeds on the levels you retuned
DIFFICULTY_LEVELS=level3,level4 DIFFICULTY_OUT=review/difficulty npm run difficulty
```

**Release sweep (user decision 2026-11-27: "6-seed sanity + 20-seed release").** Run
`npm run difficulty:release` before every preprod push that touches a level, room, hazard, wake,
suspicion or star tuning, and before a merge to `main`. CI runs it on every pinned commit between
`npm test` and the build (`.github/workflows/pages.yml`), so an out-of-band commit is never
published. `scripts/difficulty-release.mjs` runs every level in `LEVELS` at 20 seeds, one vitest
process per level and several at once (`DIFFICULTY_JOBS`, default the machine's parallelism up to 8),
with the 20-seed-only bands (the 2199 finale bands, 1953 and 1955 shift estimates, the Grail targets)
switched on. It prints one table, every rate band with its count out of 20, the band and in or out,
followed by every other violation, and exits non-zero on any miss or crashed run. `DIFFICULTY_OUT` keeps
`summary.md` and each level's `.md`, `.json` and `.log`. On 2026-11-27 the full sweep took 4 min
wall time on this 8-core machine, which was shared with other jobs. Six seeds hide misses: the v0.2
council found Bakery, L4, L5, L6, L11 and L12 out of band at 20 seeds while the default sweep was green.
Keep the default sweep at six seeds; never shrink it.

## Rate bands and sample size (`tests/difficulty/rates.ts`)

Every band on a rate (a star share, a route's delivery share, a flight's finish share, a souvenir,
pickup, detour or time-car share, the casual Ghost and L9 Night owl ceilings, the finale and Grail
targets) goes through one rule, applied to the observed count *k* out of *n* attempts:

- **n ≥ 20: exact.** *k/n* must sit inside the band. This is the release sweep.
- **n < 20: sanity.** A count inside the band passes. A count outside fails only when it is too far
  from the band to be seed luck. For a floor *p₀* it fails when P(X ≤ k | n, p₀) < 0.05. For a ceiling
  *p₁* it fails when P(X ≥ k | n, p₁) < 0.05, with X ~ Binomial(n, p). In words: a level whose true rate
  sat exactly on the band edge would give a count this far out less than one time in twenty. This is
  the one-sided exact (Clopper–Pearson) 95% bound on the rate excluding the band.
- **"Skilled earns Ghost more often than casual"** compares two rates. It is exact (skilled share
  strictly above casual) from 20 attempts. Below 20 it fails only when a one-sided Fisher exact test
  says casual beats skilled (p < 0.05).

Everything that is not a rate stays exact at every seed count: median sightings, shift estimates,
L9 room median seconds, timeouts, the beeline and every-ring matrix catches and their
`PENDING_DIRECT` ratchet, direct room drags, par share, peak suspicion and tension. The report lists
the rates that are outside their exact band but pass the tolerance ("judge at 20 seeds"). The release
table marks them `in (tolerance)` when the sweep runs below 20 seeds.

What six seeds can and cannot see (n = 6):

| Band | Fails at |
| --- | --- |
| floor 100% (Bakery skilled stars) | any miss: 5/6 |
| floor 5/6 | 2/6 or fewer (3/6: p = 0.06) |
| floor 2/3 | 1/6 or fewer (2/6: p = 0.10) |
| floor 60% | 1/6 or fewer |
| floor 50% (L7 skilled Ghost) | 0/6 (1/6: p = 0.11) |
| ceiling 90% (casual Ghost, L9 Night owl) | never: 6/6 has p = 0.53. The 20-seed sweep holds it (19/20 fails). |

So the six-seed gate catches a level that collapses, for example a halved fuse: on 2026-11-27,
L3 casual Ghost fell from 4/6 to 0/6 (p = 0.004) and L6 from 4/6 to 0/6 (p = 0.03), and both failed.
It does not see a level drifting a few points out of its band. Only the release sweep sees that drift.
The 2026-11-27 six-seed misses after the touch-path change (Bakery casual Ghost 6/6 against a 90%
ceiling, L4 3/6, L5 3/6 and L7 2/6 skilled Ghost, L9 skilled Night owl 6/6 against its 90% ceiling)
all pass the sanity check. The same levels are in band at 20 seeds.
`tests/levels-difficulty-rates.test.ts` pins these numbers.

**Chaotic rates.** Deep-shift Ghost rates move with the hazard phase at each leg start, and that
phase depends on how long the rooms took. A change to a room or to the input model can move a
level's Ghost count by several seeds out of 20 (L5 casual went from 6/20 to 15/20 when only room
timing changed). Tune with margin, and re-run the 20-seed sweep after any shared change.

Each level lists the stars earned out of all attempts for each profile. The denominator includes
missed deliveries and sunrise. Deep levels also show route delivery, median time, peak wake, flight
sightings, and beeline catches. `DIFFICULTY_OUT` writes `<level>.md` and `<level>.json` under the
chosen directory. The deep JSON records each sighting's detector index, world coordinates, shift
time and exposure by detector since the fuse last emptied. Overlapping detectors share a single
fuse, and each frame is attributed to the detector the game selects. `npm test` runs the bands at
six seeds with the sample-size tolerance above; the release sweep enforces them exactly.
Seed counts must be positive integers. Unknown level IDs and deep levels without a band fail.

Each level also reports the casual median time from first input to delivery and two souvenir
counts. The ordinary route supplies the time. The souvenir run takes one detour from the closest
point along the route, approaches the item from above and returns to that point. Both use the
same seeds, pace, reaction delay and hand wobble. Grabbed counts a pickup even if the specimen
later wakes. Taken home counts the item on the delivery report. The floor is 40% of all attempts,
or 75% for the flex capacitor. Field Check runs under its practice rules and appears with L2.

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
than the casual model on a deep shift. A casual Ghost ceiling of 90% rejects 19 or 20 clean
runs out of 20 on the release sweep. Six seeds cannot test it (see *Rate bands and sample size*). Tutorial wake is forgiving while the player learns the controls, so both models
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
  `tests/ui-trophies*.test.ts` checks every room. A level's town pickup also gets a slot in the trophy
  room's town room, with an EN and FR name and description (docs/GDD-9-trophy-room.md). Each new
  sleeper (a room's `human`) gets a Specimen Archive entry: name, age, height, weight and a funny EN and
  FR description (`tests/ui-trophies-specimens.test.ts`).

## Too-easy checks

- **Flight.** At each delay (0, 2.5, 5 and 8 s), a straight hold toward either tutorial ring must
  get spotted or fail to lock within 60 s. On deep shifts a pilot takes the shortest geometrically
  open path and ignores detection and timing. It must get spotted or fail to reach the full quota
  before the shift budget at all four delays. This leaves careful routes room to work around a threat.
- **Every-ring matrix (deep shifts).** A thumb held straight from the launch at *each* entry ring,
  at each of the four delays, ignoring detectors, timing and walls, must be spotted or fail to lock
  within 60 s (`directApproaches` in `tests/difficulty/beeline.ts`; the report prints the matrix).
  `PENDING_DIRECT` is empty and may only stay so. Near rings (0.5–0.75 screens from the launch) cannot be
  caught at every delay by a timed guard without lighting the door 70–80% of the time, because a short
  hop's clean slot is wider than the gaps between tested delays; the 2026-11-27 attempt with such guards
  cut L5 Ghost to 6/20 skilled and 3/20 casual. Put the catch on the way instead: L5 strings regatta
  bunting across the straight lines (Sal's crate yard, the regatta course, the beach huts) and L12 runs
  the bypass cordon across Artie's lane and Penny's gardens, so a held thumb stalls on the flags while
  the way round crosses the level's real pressure. A cable must sit square to the line and reach well past
  the point where the target's perpendicular meets it, or the saucer slides along it and slips round the
  end; leave a gap of 190 px or more between two cables, or the planner wedges the saucer in it. Check a
  fine sweep too (every quarter second across one hazard cycle), not only the four tested delays.
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

## v0.2 release sweep (2026-11-27)

20 seeds per cell, **Delivered / Ghost / Night owl** out of 20, before → after. *Before* is preprod
c6b483a with the old input model (L3–L8 measured for this retune; Birch, L9–L12 from the council's
logs). *After* adds the touch speed cap in the model, the route pilot's dart capped at `POINT.max`
(it was 320 px/s and committed to timed crossings a phone cannot make), and the level changes listed.

| Level | Skilled | Casual | Change |
| --- | --- | --- | --- |
| Bakery | 20/20/20 → 20/20/20 | 20/**14**/20 → 20/17/20 | gate light active radius 360 → 330 px |
| Neighbours | 20/20/20 → 20/20/20 | 20/16/20 → 20/15/20 | – |
| L3 | 19/18/19 → 19/19/19 | 17/13/17 → 17/15/17 | – |
| L4 | 20/17/20 → 20/16/20 | 20/**11**/20 → 20/12/20 | museum NE camera sweep 1.65 → 1.4 rad/s |
| L5 | 20/16/20 → 20/12/20 → 20/19/20 | 20/**6**/20 → 20/11/20 → 20/11/20 | openings rework: regatta bunting, lamp phase 2.3 → 1.9 |
| L6 | 20/18/20 → 20/20/20 | 20/12/20 → 20/10/20 | ward camera centre +0.15 rad, medevac spot 136 → 120 px |
| L7 | 20/15/20 → 20/16/20 | 20/14/20 → 20/12/20 | – |
| L8 | 20/20/20 → 20/20/20 | 18/18/18 → 18/18/18 | – |
| L9 | 20/19/16 → 20/19/18 | 19/17/16 → 17/15/14 | kitchen creak tiles 20 px taller, transom sash phase +0.6 s |
| L10 | 20/16/15 → 20/16/15 → 20/16/16 → 19/16/16 | 18/9/11 → 18/**7**/10 → **20/7/15** → 17/9/10 | settle-exit fix in the model, then gallery doors, 4 s settle, 172 s dawn (see below) |
| L11 | 18/18/18 → 19/17/18 | 16/8/11 → 18/9/14 | east-lane headlights 300 → 270 px, attic probe crossing 282 → 260 px/s |
| L12 | 17/**14**/14 → **19/17/18** → 18/12/15 | 15/7/11 → 15/**8/12** → 15/7/11 | openings rework: bypass cordon, fuse 0.72 → 0.61 s, dozer dwell 1.35 → 1.8 s, Artie's inner door 15 px taller, clock 192 → 175 s |

Bold marks a miss. The tutorials stay at 100% Delivered and Still asleep for both profiles.

- **L11 flight stall.** At 300 px the east-lane cars left 0.55 s gaps, and a saucer east of the lane
  held until sunrise in 5 of 20 casual flights (casual flight finishes 75% → 100%; estimate
  108 → 111 s). The stall threshold sits near 290 px; 270 keeps a margin.
- **L10, settle exits.** The casual seed-5 timeouts in five Grail rooms were the model, not the room:
  the hand never let go at the time window, and its tremor and drift moved the beam about 70 px/s, so
  the chest never stayed under the 28 px/s settle speed for 1.25 s. The game tells the player to let go
  there, and a resting thumb inside the 14 px touch dead zone holds the beam still anyway. With the hand
  letting go, casual Grail rooms run about 6 s shorter and never time out: casual 18/7/10 → 20/7/15,
  Shrubbery 17 → 20/20, casual estimate 111 → 91 s. Skilled is unchanged (20/16/16, in band). The
  GDD-12 casual targets (Delivered 80–95%, Night owl 50–55%, Shrubbery 75–90%, estimate ≥ 105 s) were
  met through the artifact: a casual player who never times out delivers every shift in the 330 s dawn,
  and the casual model is faster in rooms than the skilled one, so no par splits their Night owl rates.
  The follow-up retune made the Grail slower instead of moving the targets: a timed door at the end of both ground
  galleries and the Portcullis loft on a 14 s cycle (4.5 s open), a 4 s settle bar, the smoke-hole sparks phase
  4 → 5 s, dawn 330 → 172 s and Night owl 198 → 31 s left (141 s elapsed). All GDD-12 targets hold at 20 seeds:
  skilled 19/16/16, Shrubbery 19; casual 17/9/10, Shrubbery 17; casual estimate 107 s.
- **Casual drags faster than skilled, on every level.** `casual.pace` is 3 against `skilled.pace` 2.2, so at
  cruise the casual hand moves 123 px/s against 90 px/s. In the 2026-11-27 sweep the casual median room time was
  below the skilled one in all 55 deep-level routes (summed per level, 5–26% less), and the casual shift estimate was at or
  below the skilled one on 8 of the 12 deep levels. The fast drag is where the casual wake and bonks come from, and
  every band is calibrated on it: a casual pace of 2 (below skilled) put 7 of 14 levels out (Bakery, Neighbours and
  L4 casual wake under 20; L9 and L12 casual Night owl 7/20 and 3/20; L4 nigel_skylight casual 4/20; L11 casual
  Ghost above skilled; L11 and L12 estimates over budget). So the profiles stay, and a time band (Night owl, shift
  estimate) can only tell casual from skilled where the extra time comes from failures and retries, or where the
  room's waits do not scale with drag pace (timed doors, settle bars), as in the L10 retune.
- **L12, in band.** The bypass cordon stops the straight holds, the fuse (0.61 s) and the ticket-loft
  dozer's 1.8 s turn put the skilled model's sightings on the loft → Moe leg (the avenue recital's east
  edge), and the 15 px taller inner doorway in Artie's garden room cuts the casual wakes there (casual
  Ghost stays 7/20 while skilled falls to 12/20). The rates are chaotic in the dozer dwell: 1.7 s and
  1.9 s put skilled Ghost back at 16–18/20. The clock and par come last: fit them from the run times
  in the JSON report (175 s with a 26 s margin sits in a 172–177.5 s by 148.5–150 s elapsed window).

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
