# Regression catalogue

Every class of bug the player (the user) or a review has reported, the rule that prevents it, and the check
that enforces it. Built on 2026-11-26 from every unsettled T3 thread of the project (the coordinator thread,
the four 2026-11-26 threads and about 90 delegated build, council and review threads).

## How to use it

- **Before you finish a change**, find the rows your change touches and run their guards. `npm test` runs
  every vitest guard; the browser scripts under `scripts/pixi/` are manual.
- **When the user reports a new bug class**, add a row here and a test that walks every level in `LEVELS` and
  every room in `ROOMS`, never a fixed list. The user's standing request is "tests on all levels + any future
  levels".
- **PENDING lists only shrink.** Guards that shipped with known violations list them as `PENDING_*`. A pending
  entry that starts passing fails the test until it is removed. Never add an entry for content you are adding;
  fix the content.
- **Never narrow a guard to make your change pass** (see P1 below).

Status: **guarded** = a test fails on regression; **pending** = guarded, with current violations still listed;
**partial** = guarded for some levels or in a manual script only; **rule only** = no automated check yet.

## Level design and difficulty

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| L1 | Straight-line win | A naive beeline is caught at every tested start time, on every level. | `tests/levels-difficulty.test.ts` (`npm run difficulty`) | guarded. The beeline goes to the nearest ring only; "every straight run to every ring" is being added by the L10/L11 pressure forks of thread *Vary Level Opening Layouts*. |
| L2 | Same opening everywhere, detector parked on the spawn | No spawn gate (two story-reason exemptions at most); neighbouring levels use different spawn zones; at least four zones. | `tests/levels-spawn-variety.test.ts` | pending: `PENDING_GATE`, `PENDING_ZONE` (batch 2 of the rework). |
| L3 | Moving cone on the first screen | No detector cone, fixed or moving, crosses the first screen ahead of the ship in the first seconds. | `tests/flight-grail.test.ts` covers L10 only | partial. Spawn-variety skips moving hazards (L11 car headlights). |
| L4 | Removing a gate lowered the pressure | Pressure is moved, not removed: casual peak suspicion must not collapse. | difficulty bands | rule only for a per-level floor. |
| L5 | Difficulty curve runs backwards | Earlier towns are never harder than later ones (fuse, hazard count, casual Ghost). | none yet | rule only. The fuse staircase is in progress (*Neon P1 fuse staircase + P4 L3*). |
| L6 | Tutorial too hard, or a level too easy | Two-sided bands; a plain drag gets through tutorial rooms; Ghost stays reachable for the casual model. | `tests/levels-difficulty.test.ts`, `tests/abduct-tutorial-plain.test.ts` | guarded. |
| L7 | Hazard that can never catch you | Exposure on any route the player can take is at least the catch time. | none | rule only. |
| L8 | Abduction rooms too short | After the tutorials, a casual room takes about 25 s or more. | none | rule only. |
| L9 | A lesson the obvious route skips | Each lesson's hazard sits on the beeline. | `tests/levels-field-check.test.ts` | guarded for Field Check. |
| L10 | Reduced motion changes outcomes | Same autopilot, same stars and time with reduced motion on or off. | `tests/levels-monolith.test.ts` | partial (L8 only). |
| L11 | Mechanic introduced without teaching | Every room mechanic is registered with the level that introduces it and the EN+FR strings that teach it; a new room field fails until classified. | `tests/abduct-mechanic-taught.test.ts` | pending: `room.cat` (L1), `hazard.patrol`, `hazard.fragile`, `hazard.draft`, `hazard.camera` (L3), `hazard.pop` (L4). |

## Abduction rooms

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| A1 | Bump on start | 10 s without input: zero bonks, zero wake, wrappers (Field Check) included. Fix the pose, never the wake rules. | `tests/abduct-spawn.test.ts` | guarded. |
| A2 | Souvenir you can't pick up | Every room item and swap can be grabbed and carried out; casual reach at least 45%. | `tests/abduct-souvenir-reach.test.ts`, `tests/abduct-souvenir.test.ts` | guarded. |
| A3 | Solid props look like decor | An art key is always solid or always decor; solid props wear the cream rim, decor never does; colliders sit on their art. Never dim decor to fix clarity. | `tests/abduct-prop-roles.test.ts` | pending: `room/portrait_cow`, `room/shelf`, `room/counter55`. |
| A4 | Stretched or borrowed art | Every sprite is drawn within 5% of its manifest aspect ratio; flight props too. | `tests/abduct-sprite-aspect.test.ts`, `tests/flight-pickup-figure.test.ts` | pending: 44 room keys (worst: `room/shelf` used as a post, the eight `grail_*` props sharing one 120×96 size), `flight/invasion_field_rows`. |
| A5 | Floating props, hidden exits | Props and sleepers rest on a floor or collider; decor never covers an exit. | none | rule only. |
| A6 | Decor that reads as the pickup | Decor near the spawn must not share the pickup's silhouette or colour (the dough bowl read as the cherry pie). | none | rule only. |
| A7 | Field Check and other wrappers escape room tests | Hard-rule tests run through the scene wrapper, not only the simulation. | `tests/abduct-spawn.test.ts` | guarded for spawn. |

## Flight maps

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| F1 | Road junction with no kerb | Junctions come from `drawJunctions`. | `tests/flight-roads.test.ts` | guarded. |
| F2 | Speech bubble under a map object or the launch banner | Speech goes in `FLIGHT_BUBBLES`. | `scripts/pixi/check-bubbles.mjs` (browser) | partial: manual, and the launch banner isn't checked. |
| F3 | Spot cause missing, or from another era | Every detector on every map resolves to a registered cause with EN+FR text from its own era. | `tests/flight-spot-causes.test.ts`, `tests/flight-spotted-art.test.ts` | guarded. |
| F4 | Set dressing left behind when the layout moves | Pickups don't overlap figures; lines that name something play only once it is on screen. | `tests/flight-pickup-figure.test.ts`, the L12 `poetsUnseen` test | partial. |
| F5 | Pickup or prop art unreadable at phone size | Judge art at 1× in a 375×690 frame, never from zoomed crops. | none | rule only. |
| F6 | Spotted card vanishing before you read it | Failure cards wait for a tap. | `tests/flight-spotted-tap.test.ts` | guarded. |
| F7 | Route labels on rings or the minimap | Labels may slide or flip, never cross a ring. | `tests/flight-route-pill.test.ts` | guarded. |
| F8 | Lessons flickering | Lesson prompts use hysteresis. | `tests/flight-lesson-hysteresis.test.ts` | guarded. |

## Copy, story and translation

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| C1 | Town pickup not hinted | Each level after L1 has one pickup, hinted in its memo in EN and FR. | `tests/flight-collectible*.test.ts` | guarded. |
| C2 | Souvenir, pickup or specimen with no trophy slot | Three trophy rooms, all filled. | `tests/ui-trophies*.test.ts` | guarded. |
| C3 | Missing FR key or placeholder | FR mirrors EN. | `tests/ui-i18n.test.ts` | guarded. |
| C4 | Text overflowing at phone size (mostly French) | Every string fits its slot in both languages. | `tests/ui-report-rowwrap.test.ts`, the bubble fit in `tests/ui-story.test.ts` | partial: no general fit test for card blurbs, meter captions or the marquee. |
| C5 | Speech too short to read | Speech timers come from `readSeconds()`; flavour lines never cut a fresh line. | `tests/shell-speech-timers.test.ts` | pending: work-order toast, collectible toast (flight and deep), `PickupShout`, `DeepTargetView` quip. |
| C6 | The same gag again and again | No 4-word phrase in 3+ strings without a reason; per-group caps on tracked gags. | `tests/ui-copy-repeats.test.ts` | pending: "still on the shelf" ×6, "it was the only" ×4, "nobody saw a thing" ×3; X-Files 7 against a cap of 2; Tuesday 8 against 7. |
| C7 | France-only or US-only references | References are worldwide; no Cerfa, URSSAF, France Inter, £ in French; no "plead the Fifth". | `tests/ui-copy-repeats.test.ts` | guarded. The 23 « Cerfa » lines became « formulaire » on 2026-11-26 (« FORM. 7-B » on the clinic badge). |
| C8 | Story contradicts progress or spoils a payoff | Story tokens (Intern/Agent, pay, ring, OBELISK™, Bubbles…) never show before or after their level; deadline words only where the deadline is dawn; no era names another era's year early. | `tests/ui-copy-continuity.test.ts` | pending: `mayor.at3` mentions Bubbles before L5, the L5 "OBELISK™ crate" names the firm before L7. Decided 2026-11-26: L8 keeps Echo's in-story dawn, and its card, retry and HUD warning count down like its HUD (`src/ui/deadline.ts`). |
| C9 | A level missing from a registry | Count words match the level's specimens; plurals agree; each level has its own cover story, headline and opener; `#NNNN` order numbers. | `tests/levels-registries.test.ts`, `tests/ui-story.test.ts`, `tests/ui-workorders.test.ts` | pending: Birch shifts reuse "three specimens" lines, "1 sightings"/"1 seconds", no cover story for L10 and L12, no headline for L12, no opener for `birch_bakery`. |
| C10 | Obscure, misquoted or far-fetched reference | Instantly obvious, international, quoted right; 2–3 running jokes at a time; send the user unsure lines with the original. | none | rule only (memory notes, `docs/story/continuity-review.md`). |
| C11 | Lore term used before it is set up | Terms like OBELISK™, Temporal Dispatch and Form 88-MPH appear only after the level that introduces them. | `tests/ui-copy-continuity.test.ts` (token table) | guarded for the listed tokens; add a token with each new term. |
| C12 | A literal translation loses a souvenir's reference | Keep the reference recognizable in both languages: the captain's log stays « log du capitaine » in French, with the same numeric stardate in its EN/FR descriptions and report lines. | `tests/ui-souvenir-reference.test.ts` walks every level and room, Field Check included | guarded for the captain's log. |
| C13 | Film caption gone before you can read it | A film or interlude caption is fully on screen for `readSeconds()` of its longer language, never crosses a cut, and in game no page moves on before then. | `src/ui/dispatch-finale.ts` times its pages with `readSeconds()` | rule only: films are previews outside the game so far. Reported 2026-11-28 on the Season 1 intro animatic. See [story rules §6](story/rules.md#6-films-and-interludes). |
| C14 | Film with no story | A film starts as a storyboard table (we see, what changes, why now, line, camera); one beat per shot, concrete illustrated keyframes, reads with captions off. | review | rule only. Reported 2026-11-27: the first mini-films were incoherent, had no storyboard and a rough render. See [story rules §6](story/rules.md#6-films-and-interludes). |

## Engine, rendering and sound

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| E1 | Per-frame render-group rebuilds, draw-call splits | No per-frame `visible` flips, no `alpha = 0` hiding, no per-frame strings or `measure()` in `sync()`. | `tests/shell-shape-solo.test.ts`; `scripts/pixi/bench-frames.mjs` and `batches.mjs` (manual) | partial: no budget check in `npm test`. |
| E2 | Crash on a fast scene swap | Pending uploads are cancelled on dispose. | `tests/shell-prepare.test.ts` | guarded. |
| E3 | Canvas 2D drawing per frame | Canvas 2D only inside texture painters. | `tests/shell-pixi-only.test.ts` | guarded. |
| E4 | Effect drawn at the map origin | `place()` positions even at alpha 0. | none | rule only. |
| E5 | Menu clicks, Zib voice in play, ambient beds | No UI click sounds, no Zib voice in flight or rooms, no ambient loop; sfx soft and cartoony. | `tests/audio-sound-rules.test.ts`, `tests/audio-scenes.test.ts` | guarded. |
| E6 | Preprod and prod sharing a save | Preprod has its own save and unlocks everything; prod never rewrites a save. | `tests/levels-save.test.ts`, `tests/shell-preprod.test.ts` | guarded. |
| E7 | "Deployed" but the page is stale | Check that the deployed build is the pushed commit before reporting a deploy. | none | rule only. |
| E8 | Beam whoosh and snore repeating all through a room | A room's beam sounds once after a rest (`BEAM_CUE.rest`) and fades out only after a real hold; quick re-grabs are silent. Only the first and every twelfth snore is heard (`SNORE_AUDIO_EVERY`, at least 20 s apart), at volume 0.32 or less (`SNORE_VOLUME`), except that a snore that marks a hazard is always heard. | `tests/abduct-beam-cue.test.ts` | guarded. |
| E9 | Legs floating free of a sleeper's body | A humanoid torso's art reaches the pelvis: manifest height minus its 5 px anchor is at least the neck→pelvis bone (80×120 like every other torso). | `tests/abduct-torso-reach.test.ts` | guarded. |
| E10 | Nose stuck on the side of a face-on head | A head drawn face-on (both eyes forward) has its nose in the middle under the eyes; only a profile head puts the nose on its edge. | none | rule only. |

## Process

| # | Class | Rule |
|---|---|---|
| P1 | A test narrowed to pass | If a guard fails, fix the level or the code, not the assertion. Reducing what a test covers (levels, rings, delays, seeds, rooms) needs the user's OK, and the report gives before/after numbers. This is how the L10–L12 openings lost their pressure. |
| P2 | Failures blamed on other agents without proof | Name every failing file. Before calling a failure someone else's, show it fails without your change (for example on the staged snapshot). Under heavy load, re-run timeouts alone with a longer timeout. |
| P3 | Evidence that doesn't show the change | Capture after the change, on a fresh build, at 1× phone size, in EN and FR for text, after the typewriter finishes. Before/after images for graphics, video for motion, mp3 for sound. |
| P4 | "Finished" before the work was | The final report lists the tests run, the captures taken after the change, and what is still pending. |
| P5 | Shared checkout clashes | Follow "Git and committing" in `AGENTS.md`: children never commit, no stash or whole-file staging, check the exact commit in a scratch worktree, push only your own outgoing commits. |
