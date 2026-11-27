# Regression catalogue

Every class of bug the player (the user) or a review has reported, the rule that prevents it, and the check
that enforces it. Built on 2026-11-26 from every unsettled T3 thread of the project (the coordinator thread,
the four 2026-11-26 threads and about 90 delegated build, council and review threads).

## How to use it

- **Adding a level or a room?** Work through `docs/NEW-LEVEL-CHECKLIST.md`: one line per problem class, with the
  guard and the command that enforce it.

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
| L1 | Straight-line win | A naive beeline is caught at every tested start time, on every level: the planner's nearest-ring itinerary, and a straight hold from the launch to every entry ring of every deep level (the every-ring matrix). | `tests/levels-difficulty.test.ts` (`npm run difficulty`), `tests/flight-autopilot.test.ts` | guarded. `PENDING_DIRECT` in `tests/difficulty/beeline.ts` is empty since the v0.2 openings rework (2026-11-27). |
| L2 | Same opening everywhere, detector parked on the spawn | No spawn gate (two story-reason exemptions at most); neighbouring levels use different spawn zones; at least four zones. | `tests/levels-spawn-variety.test.ts` | guarded. `PENDING_GATE` and `PENDING_ZONE` are empty and `GATE_EXEMPT` names no level (2026-11-27). |
| L3 | Moving cone on the first screen | No detector cone, fixed or moving, crosses the first screen ahead of the ship in the first seconds. | `tests/flight-grail.test.ts` covers L10 only | partial. Spawn-variety skips moving hazards (L11 car headlights). |
| L4 | Removing a gate lowered the pressure | Pressure is moved, not removed: casual peak suspicion must not collapse. | difficulty bands | rule only for a per-level floor. |
| L5 | Difficulty curve runs backwards | Earlier towns are never harder than later ones (fuse, hazard count, casual Ghost). | none yet | rule only. The fuse staircase is in progress (*Neon P1 fuse staircase + P4 L3*). |
| L6 | Tutorial too hard, or a level too easy | Two-sided bands; a plain drag gets through tutorial rooms; Ghost stays reachable for the casual model. | `tests/levels-difficulty.test.ts`, `tests/abduct-tutorial-plain.test.ts` | guarded. |
| L7 | Hazard that can never catch you | Exposure on any route the player can take is at least the catch time. | none | rule only. |
| L8 | Abduction rooms too short | After the tutorials, a casual room takes about 25 s or more. | none | rule only. |
| L9 | A lesson the obvious route skips | Each lesson's hazard sits on the beeline. | `tests/levels-field-check.test.ts` | guarded for Field Check. |
| L10 | Reduced motion changes outcomes | Same autopilot, same stars and time with reduced motion on or off. | `tests/levels-monolith.test.ts` | partial (L8 only). |
| L11 | Mechanic introduced without teaching | Every room mechanic is registered with the level that introduces it and the EN+FR strings that teach it; a new room field fails until classified. Behaviour keyed on one sleeper or room in the abduction runtime (`=== 'rodney'`) counts as a field (v0.2). Room prompts for patrols, fragile props, drafts, cameras and pop-ups show in the rooms of the level that introduces them. | `tests/abduct-mechanic-taught.test.ts`, `tests/abduct-room-lessons.test.ts` | guarded (PENDING empty since v0.2). |
| L12 | A deep map with no flight proof | Every deep level in `LEVELS` is flown by the headless autopilot and beelined, or is named in `OWN_DRIVER` with the test that proves it; no fixed level list. | `tests/flight-autopilot.test.ts` | guarded (2026-11-27; Birch Lane, L8 and L11 have their own drivers). |
| L13 | Flight hazard introduced without teaching (v0.2 follow-up) | Walking `LEVELS` in play order, every flight hazard kind and optional hazard field (a camera's `burst`, a radar's `spin`) is classified; a mechanic is taught on the first level that uses it, by that level's `FLIGHT_LESSONS` entry or registered EN+FR memo or prompt strings; a variant names the kind it plays like. | `tests/flight-hazard-taught.test.ts` | guarded (PENDING emptied in v0.2: L3 rooftop cameras and bats, L4 crane and office windows, L7 stewards and L11's sneezing tripod are taught in memos; the L10 rabbit has a flight lesson). |
| L14 | The beeline guard tests one ring only (council item 2) | Every straight hold from the launch to every entry ring of every deep level in `LEVELS` is caught at every tested delay (the every-ring matrix, `directApproaches`). | `tests/difficulty/beeline.ts` via `tests/levels-difficulty.test.ts` (`npm run difficulty`) | guarded: `PENDING_DIRECT` emptied in v0.2 (L5 regatta bunting and roped crate yard, L12 bypass cordon and survey cable; 24/24 each). |
| L15 | Bands green on the default sample, red on 20 seeds (council item 1) | Each band holds on the 20-seed release sweep; retune the level, never relax the band. Below 20 attempts a rate band fails only when a one-sided exact binomial test rejects it (p < 0.05); from 20 it is exact (user decision 2026-11-27). | `tests/difficulty/rates.ts`, `tests/levels-difficulty-rates.test.ts`, `npm run difficulty:release` (`scripts/difficulty-release.mjs`, every level in `LEVELS`, about 4 min), `tests/shell-pages-deploy.test.ts` | guarded: 6-seed sanity in `npm test`; exact 20-seed sweep in CI for each pinned SHA and before every preprod push that touches tuning. |
| L16 | Difficulty evidence from impossible input | The human-model players move the beam only through the live touch path (`pointStep`, at most `POINT.max` px/s), and the route pilot never plans a dart faster than that cap. Release candidates pass the 20-seed sweep. | `tests/levels-difficulty-touch.test.ts` (every room in `ROOMS` plus Field Check), `npm run difficulty:release` | guarded; the 20-seed sweep is a release step, not part of `npm test`. |
| L17 | Difficulty evidence from a stuck model hand | At a settle exit the human model lets go, as the room tells the player, so no run waits out the 180 s room limit in the exit zone (casual seed 5 did in five Grail rooms, 2026-11-27). | `tests/levels-difficulty-settle.test.ts` (every room in `ROOMS` with `exitSettleSec`, both profiles, seeds 1–20) | guarded. |

## Abduction rooms

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| A1 | Bump on start | 10 s without input: zero bonks, zero wake, wrappers (Field Check) included. Fix the pose, never the wake rules. | `tests/abduct-spawn.test.ts` | guarded. |
| A2 | Souvenir you can't pick up | Every room item and swap can be grabbed and carried out; casual reach at least 45%. | `tests/abduct-souvenir-reach.test.ts`, `tests/abduct-souvenir.test.ts` | guarded. |
| A3 | Solid props look like decor | An art key is always solid or always decor; solid props wear the cream rim, decor never does; colliders sit on their art. Never dim decor to fix clarity. | `tests/abduct-prop-roles.test.ts` | guarded (pending list emptied 2026-11-27). |
| A4 | Stretched or borrowed art | Every sprite is drawn within 5% of its manifest aspect ratio; flight props too. | `tests/abduct-sprite-aspect.test.ts`, `tests/flight-pickup-figure.test.ts` | guarded (pending lists emptied 2026-11-27). For a new shape, add a key: `scripts/art-shapes/build.mjs` redraws a prop in another box; shelves of any width go through `shelfProp` (`src/abduct/rooms/layout.ts`). |
| A5 | Floating props, hidden exits | Props and sleepers rest on a floor or collider; decor never covers an exit. | none | rule only. |
| A6 | Decor that reads as the pickup | Decor near the spawn must not share the pickup's silhouette or colour (the dough bowl read as the cherry pie). | none | rule only. |
| A7 | Field Check and other wrappers escape room tests | Hard-rule tests run through the scene wrapper, not only the simulation. | `tests/abduct-spawn.test.ts` | guarded for spawn. |
| A8 | Exit tag off screen | Every interior room's exit tag stays inside the view (below the HUD row, above the bottom bar) wherever the exit shows, in EN and FR; the view places it through `exitTagBox` every frame. | `tests/abduct-exit-tag.test.ts` | guarded (v0.2: the FR dave_roof tag ran off the left edge). |
| A9 | Room prompt never shown on the obvious route | Every room prompt kind shows on at least one autopilot route of the level that introduces it; when several are in range, a kind not yet shown takes the slot. | `tests/abduct-room-lessons.test.ts` | guarded (v0.2: the L3 patrol prompt never showed). |

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
| F9 | Flight lesson left behind when the map moves | Each flight lesson's trigger comes from its hazards on the map; on every level in `LEVELS` it shows on the autopilot shift no later than the first meeting with its hazard, and never at a spawn far from it. | `tests/flight-lesson-route.test.ts` | guarded (v0.2). |

## Copy, story and translation

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| C1 | Town pickup not hinted | Each level after L1 has one pickup, hinted in its memo in EN and FR. | `tests/flight-collectible*.test.ts` | guarded. |
| C2 | Souvenir, pickup or specimen with no trophy slot | Three trophy rooms, all filled. | `tests/ui-trophies*.test.ts` | guarded. |
| C3 | Missing FR key or placeholder | FR mirrors EN. | `tests/ui-i18n.test.ts` | guarded. |
| C4 | Text overflowing at phone size (mostly French) | Every string fits its slot in both languages. | `tests/ui-report-rowwrap.test.ts`, the bubble fit in `tests/ui-story.test.ts` | partial: no general fit test for card blurbs, meter captions or the marquee. |
| C5 | Speech too short to read, or a card that ignores its timer | Speech, toast and card timers come from `readSeconds()`; every lifetime set from `readSeconds()` anywhere in `src` is registered; the view that shows a line reads its timer, in flight, in both room views and in UI scenes; flavour lines never cut a fresh line. | `tests/shell-speech-timers.test.ts`, `tests/flight-2199-verse.test.ts` | guarded (v0.2: the work-order toast, collectible toast, `PickupShout` and `DeepTargetView` quips use `readSeconds()`; the follow-up added rooms, UI scenes and card-like names). |
| C6 | The same gag again and again | No 4-word phrase in 3+ strings without a reason; per-group caps on tracked gags. | `tests/ui-copy-repeats.test.ts` | pending: "still on the shelf" ×6, "it was the only" ×4, "nobody saw a thing" ×3; X-Files 7 against a cap of 2; Tuesday 8 against 7. |
| C7 | France-only or US-only references | References are worldwide; no Cerfa, URSSAF, France Inter, £ in French; no "plead the Fifth". | `tests/ui-copy-repeats.test.ts` | guarded. The 23 « Cerfa » lines became « formulaire » on 2026-11-26 (« FORM. 7-B » on the clinic badge). |
| C8 | Story contradicts progress or spoils a payoff | Story tokens (Intern/Agent, pay, ring, OBELISK™, Bubbles…) never show before or after their level; deadline words only where the deadline is dawn; no era names another era's year early. | `tests/ui-copy-continuity.test.ts` | guarded (v0.2: `mayor.at3` no longer names Bubbles; the L5 pickup is the "Unaccounted crate"). Decided 2026-11-26: L8 keeps Echo's in-story dawn, and its card, retry and HUD warning count down like its HUD (`src/ui/deadline.ts`). v0.2 follow-up: both HUD clocks and the Work Orders card sun come from `clockLook` / `endsAtSunrise`, keyed on `clockMode`; the guard also checks the report stamp and cover, and every countdown level. |
| C9 | A level missing from a registry | Count words match the level's specimens; plurals agree; each level has its own cover story, headline and opener; `#NNNN` order numbers. | `tests/levels-registries.test.ts`, `tests/ui-story.test.ts`, `tests/ui-workorders.test.ts`; no two levels share a headline or cause: `tests/ui-report-extras.test.ts` | guarded (v0.2: count lines come from `humor.deepComments.bySpecimens` by the level's specimen count; counted words use plural forms). |
| C13 | Rank ladder ends early or its panel contradicts the story | The ladder spans every star in LEVELS: a perfect player is promoted every one or two orders and keeps a next-rank hint until the last two; a delivery-only player always has a next rank; pay words only after L8; the parking-ring payoff shows once L12 is delivered, at any rank. Ranks are derived from stars, never saved. | `tests/levels-progress-ranks.test.ts` (perfect and minimal journeys through LEVELS, EN+FR) | guarded. |
| C14 | Trophy room hides an open star | A town find filed on a failed shift keeps its hunt button, worded for the star, until that level's pickup star is earned. | `tests/ui-trophies-hunt-star.test.ts` walks every level with a pickup | guarded. |
| C10 | Obscure, misquoted or far-fetched reference | Instantly obvious, international, quoted right; 2–3 running jokes at a time; send the user unsure lines with the original. | none | rule only (memory notes, `docs/story/continuity-review.md`). |
| C11 | Lore term used before it is set up | Terms like OBELISK™, Temporal Dispatch and Form 88-MPH appear only after the level that introduces them. | `tests/ui-copy-continuity.test.ts` (token table) | guarded for the listed tokens; add a token with each new term. |
| C12 | A literal translation loses a souvenir's reference | Keep the reference recognizable in both languages: the captain's log stays « log du capitaine » in French, with the same numeric stardate in its EN/FR descriptions and report lines. | `tests/ui-souvenir-reference.test.ts` walks every level and room, Field Check included | guarded for the captain's log. |
| C15 | Report line no level can show | Every deep comment, first-clear, sunrise and pickup line comes out on at least one level in `LEVELS` for some report state and rotation, EN and FR; a pickup or level pool never holds the slot for good. | `tests/ui-report-comment-reach.test.ts` | guarded (v0.2: 30+ lines were unreachable, including every specimen-count line). |
| C16 | Rank text squeezed sideways | Every rank title, flavour, next-rank line and payoff fits `RANK_BOX` at its normal font next to a 4-digit purse, EN and FR; French says "anneau de parking" throughout. | `tests/ui-workorders-rank-fit.test.ts` | guarded (v0.2). |
| C17 | Memo copy runs into the goals block | Every level's memo body and joke box clear the goals block at or above the 16 px font floor, EN and FR; cut the copy, never shrink the floor. | `tests/ui-memo-fit.test.ts` (`memoBodyLayout`, shared with the view) | guarded (v0.2: EN L4, FR L4 and FR L7 overflowed after new teaching lines). |

## Engine, rendering and sound

| # | Class | Rule | Guard | Status |
|---|---|---|---|---|
| E1 | Per-frame render-group rebuilds, draw-call splits | No per-frame `visible` flips, no `alpha = 0` hiding, no per-frame strings or `measure()` in `sync()`. | `tests/shell-shape-solo.test.ts`; `scripts/pixi/bench-frames.mjs` and `batches.mjs` (manual) | partial: no budget check in `npm test`. |
| E2 | Crash on a fast scene swap | Pending uploads are cancelled on dispose. | `tests/shell-prepare.test.ts` | guarded. |
| E3 | Canvas 2D drawing per frame | Canvas 2D only inside texture painters. | `tests/shell-pixi-only.test.ts` | guarded. |
| E4 | Effect drawn at the map origin | `place()` positions even at alpha 0. | none | rule only. |
| E5 | Menu clicks, Zib voice in play, ambient beds | No UI click sounds, no Zib voice in flight or rooms, no ambient loop; sfx soft and cartoony. | `tests/audio-sound-rules.test.ts`, `tests/audio-scenes.test.ts` | guarded. |
| E6 | Preprod and prod sharing a save | Preprod has its own save and unlocks everything; prod never rewrites a save. | `tests/levels-save.test.ts`, `tests/shell-preprod.test.ts` | guarded. |
| E7 | "Deployed" but the page is stale, or untested | Pages pins main and preprod to exact SHAs, tests each pinned checkout, runs the 20-seed difficulty sweep on it, builds it, and publishes only those builds; `/deployed.json` names both SHAs. Check it against the pushed commit before reporting a deploy. | `tests/shell-pages-deploy.test.ts` reads `.github/workflows/pages.yml` | guarded (2026-11-27: the workflow used to test one checkout and publish fresh clones of both tips). Still check `/deployed.json` after a push. |
| E8 | Beam whoosh and snore repeating all through a room | A room's beam sounds once after a rest (`BEAM_CUE.rest`) and fades out only after a real hold; quick re-grabs are silent. Only the first and every twelfth snore is heard (`SNORE_AUDIO_EVERY`, at least 20 s apart), at volume 0.32 or less (`SNORE_VOLUME`), except that a snore that marks a hazard is always heard. | `tests/abduct-beam-cue.test.ts` | guarded. |
| E9 | Legs floating free of a sleeper's body | A humanoid torso's art reaches the pelvis: manifest height minus its 5 px anchor is at least the neck→pelvis bone (80×120 like every other torso). | `tests/abduct-torso-reach.test.ts` | guarded. |
| E10 | Nose stuck on the side of a face-on head | A head drawn face-on (both eyes forward) has its nose in the middle under the eyes; only a profile head puts the nose on its edge. | none | rule only. |
| E11 | A cue repeating like an ambient loop (Forester clock, bell clapper, L10 cows; v0.2) | No sfx plays more than 16 times in any minute of a room's autopilot or 120 s idle run, or of a flight parked at the launch or flown on its autopilot (tutorial beelines may repeat the cues of being seen). Timed cues play only when they matter: the Geiger tick from wake 55, the clapper near the bell, the cows within 520 px. Every cue honours its volume argument. | `tests/audio-repeats.test.ts` (walks `ROOMS` and `LEVELS`), `tests/audio-sound-rules.test.ts` | guarded. |
| E12 | Older progress hidden behind an empty or broken newer save (v0.2) | The loader imports or stores only a value with a save field in it; unreadable, empty or non-object values fall through to the next older key. The reset record under the current key still wins. Older keys are never rewritten. | `tests/levels-save-fallback.test.ts` | guarded. |
| E13 | Boot requests art that isn't there | The loader requests only `PRELOAD_ART`; keys drawn only by a procedural painter are listed in `PROCEDURAL_ART` until their SVG lands. Production boots with zero failed requests. | `tests/shell-art-preload.test.ts` | guarded (nine 1955 keys 404'd before). |
| E14 | The build calls itself the previous version | The title label and the lockfile follow `package.json` (Vite `define`). | `tests/shell-version.test.ts` | guarded. |
| E15 | A view picks behaviour by level id and a new level falls through (v0.2 follow-up) | No new level-id literal in `src/flight/views/**`, `src/ui/**` or `src/flight/deep-scene.ts`; deadline, clock and HUD choices come from level data (`clockMode`, `clockLook`, `endsAtSunrise`). Today's story-specific ones sit in a commented allowlist that only shrinks. | `tests/shell-level-branches.test.ts` | guarded. |
| E16 | Orphan art downloaded at boot (v0.2 follow-up) | Every `ART` key is drawn by a room or level definition or by code that names it as a value; a fallback-painter `case` or table entry doesn't count. Unused keys leave `ART`; reshape sources move to `SOURCE_ART`. | `tests/shell-art-orphans.test.ts` | guarded (24 keys and SVGs removed, 7 reshape sources moved to `SOURCE_ART`). |
| E17 | A new level without a save slot | `LEVEL_IDS` names exactly the levels in `LEVELS`; every level's progress survives a write and a reload. | `tests/levels-save-levels.test.ts` | guarded. |

## Process

| # | Class | Rule |
|---|---|---|
| P1 | A test narrowed to pass | If a guard fails, fix the level or the code, not the assertion. Reducing what a test covers (levels, rings, delays, seeds, rooms) needs the user's OK, and the report gives before/after numbers. This is how the L10–L12 openings lost their pressure. |
| P2 | Failures blamed on other agents without proof | Name every failing file. Before calling a failure someone else's, show it fails without your change (for example on the staged snapshot). Under heavy load, re-run timeouts alone with a longer timeout. |
| P3 | Evidence that doesn't show the change | Capture after the change, on a fresh build, at 1× phone size, in EN and FR for text, after the typewriter finishes. Before/after images for graphics, video for motion, mp3 for sound. |
| P4 | "Finished" before the work was | The final report lists the tests run, the captures taken after the change, and what is still pending. |
| P5 | Shared checkout clashes | Follow "Git and committing" in `AGENTS.md`: children never commit, no stash or whole-file staging, check the exact commit in a scratch worktree, push only your own outgoing commits. |
| P6 | A browser playthrough that passes without playing | `scripts/e2e-playthrough.cjs` fails unless every shift it plays ends on a report stamped *delivered* with one more report and attempt that survives a reload; a full run must play every registered order; SPOTTED cards get a real tap; pickup routes end at the live pickup position; page and console errors fail the run. |
