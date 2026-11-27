# New level / new room checklist

Every problem class the v0.2 release council found (`review/council-v02/report.txt`), the rule that keeps it
from coming back in a new level or room, and what enforces it. Rows in `docs/REGRESSIONS.md` carry the history.
Every guard below walks `LEVELS` or `ROOMS`, so a new level fails the suite until it meets the rule. Don't narrow
a guard to pass, and don't add a `PENDING_*` entry for content you are adding (`docs/REGRESSIONS.md` P1).

Before you call a new level or room done, run `npm run typecheck`, `npm test` (which includes `npm run difficulty`,
the 6-seed sanity check), `npm run difficulty:release` (the 20-seed exact bands) and `npm run build`, then the e2e
run at the end of this page.

## Difficulty

| Problem | Rule | Guard | Command |
|---|---|---|---|
| Difficulty bands look green on a small sample | Casual, skilled and Ghost rates sit inside the level's band on the 20-seed release sweep, where every rate band is exact. The 6-seed run in `npm test` is a sanity check: a rate fails there only when a one-sided exact binomial test (p < 0.05) rules out the band, so it catches big regressions, not seed luck. Retune the level; never relax a band. | `tests/levels-difficulty.test.ts`, `tests/difficulty/*` (rule: `tests/difficulty/rates.ts`, `tests/levels-difficulty-rates.test.ts`), `scripts/difficulty-release.mjs`, the release step in `.github/workflows/pages.yml` | `npm run difficulty` (6 seeds, in `npm test`), then `npm run difficulty:release` (every level at 20 seeds in parallel, one table, non-zero exit on any miss; about 4 min on 8 cores) before every preprod push. CI runs it on each pinned commit before the build. |
| A straight line still wins | A naive beeline is caught at every tested start time, and so is a thumb held straight from the launch at every entry ring of a deep shift (the every-ring matrix) at every tested delay. These are exact at every seed count: no tolerance. | `tests/levels-difficulty.test.ts` (nearest-ring beeline), `tests/difficulty/beeline.ts` (`directApproaches`, `PENDING_DIRECT`, empty since v0.2: never add to it) | `npm run difficulty`; the report prints the matrix. |
| Same opening, a detector parked on the spawn | No spawn gate; neighbouring levels use different spawn zones. | `tests/levels-spawn-variety.test.ts` | `npm test` |
| A deep map nobody flew | Every deep level is flown by the headless autopilot (or names its own driver). | `tests/flight-autopilot.test.ts` | `npm test` |
| Bump on start | A room spawn sits 10 s without input with zero bonks and zero wake. | `tests/abduct-spawn.test.ts` | `npm test` |
| A clock only fast hands beat | The perfect-hand autopilot at `SLOWEST_HONEST_PACE` (1.5 × cruise, about 62 px/s) delivers the whole shift with 5% of the budget left on every tested seed. Give back clock time or move a timed crossing so a slow hand meets its first opening; keep the Night owl par where it was in elapsed seconds. | `tests/difficulty/honest-pace.ts` (in `tests/levels-difficulty.test.ts`) | `npm run difficulty`; the release table lists every level's slowest honest run against its limit. |
| Difficulty evidence the game can't produce | The model's hand reaches the room only through `AbductSimulation.pointAt` with an on-screen finger, and charges room time with the game's `roomChargesShift`. Don't write to the beam or the shift clock from the model. | `tests/levels-difficulty-touch.test.ts`, `tests/levels-difficulty-clock.test.ts` | `npm test` |
| A band that admits one or two counts | Every rate band (with the other bands on the same count) admits at least three counts out of 20; widen it about its centre (`widenBand`), never shift it. | `narrowBands` in `tests/difficulty/rates.ts`, `tests/levels-difficulty-rates.test.ts` | `npm run difficulty` |

## Teaching

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A flight hazard nobody explains | Walking `LEVELS` in play order, every flight hazard kind and optional hazard field is classified, and taught on the first level that uses it: by that level's `FLIGHT_LESSONS` entry (`src/flight/views/progression-hint.ts`) or by registered EN+FR memo or prompt strings. Its `PENDING` list is empty since v0.2 and may never grow (`docs/REGRESSIONS.md` L13). | `tests/flight-hazard-taught.test.ts` | `npm test` |
| A room prompt the route never triggers | Every room prompt kind shows on an autopilot route of the level that introduces it; an unseen kind takes the slot over one already shown. | `tests/abduct-room-lessons.test.ts` | `npm test` |
| A flight lesson left behind when the map moves | Each lesson shows on the autopilot shift no later than the first meeting with its hazard, and never at a spawn far from it; prompts use hysteresis; once up, a tip stays at least FRESH_LINE_SECONDS (its read time if shorter). | `tests/flight-lesson-route.test.ts`, `tests/flight-lesson-hysteresis.test.ts` | `npm test` |
| A room mechanic nobody explains | Every room field, hazard kind and sleeper-keyed behaviour is classified and taught on its first level, in EN and FR. | `tests/abduct-mechanic-taught.test.ts`, `tests/abduct-room-lessons.test.ts` | `npm test` |
| A lesson the obvious route skips | The lesson's hazard sits on the beeline. | `tests/levels-field-check.test.ts` | `npm test` |

## Deadline and clock

| Problem | Rule | Guard | Command |
|---|---|---|---|
| "Before dawn" under a demolition clock, a sun on a storm retry bar | The deadline words and the clock look come from the level's `clockMode` (`endsAtSunrise`, `clockFace` in `src/levels/run.ts`; `deadlineLabel`, `deadlineWarning`, `clockLook` in `src/ui/deadline.ts`). Dawn words, the sun face and the sunrise glow appear only where the shift ends at sunrise, on every screen: launch banner, retry screen, report time, stamp and cover, Work Orders card, both HUD clocks, the HUD warning, the spotted-photo stamp. Every countdown level counts down everywhere. | `tests/ui-copy-continuity.test.ts` (section 2) | `npm test` |
| A view picks behaviour with `level.id === 'levelN'` and a new level falls through | No new level-id literal in `src/flight/views/**`, `src/ui/**` or `src/flight/deep-scene.ts`. Use `clockMode`, `clockLook`, `endsAtSunrise` or a level data field. The commented allowlist only shrinks. | `tests/shell-level-branches.test.ts` | `npm test` |

## Sound

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A cue repeating like an ambient loop | No sfx more than 16 times in any minute of a room's autopilot, idle or casual human-model run, or of a flight parked or flown; timed cues play only when they matter; the camera `alert` plays only while a camera watches; every cue honours its volume argument. | `tests/audio-repeats.test.ts`, `tests/audio-sound-rules.test.ts` | `npm test` |
| Beam whoosh and snore all through a room | The beam sounds once after a rest; only the first and every twelfth snore is heard, quietly. | `tests/abduct-beam-cue.test.ts` | `npm test` |

## Reading time

| Problem | Rule | Guard | Command |
|---|---|---|---|
| Speech or a card gone before you read it | Every speech, toast or card lifetime comes from `readSeconds()`; every lifetime set from `readSeconds()` is registered; the view that shows the line reads its timer, in flight, abduction rooms (both room views) and UI scenes. | `tests/shell-speech-timers.test.ts`, `tests/flight-2199-verse.test.ts` | `npm test` |
| A failure card that closes itself | SPOTTED cards wait for a tap. | `tests/flight-spotted-tap.test.ts` | `npm test` |

## Art

| Problem | Rule | Guard | Command |
|---|---|---|---|
| Stretched or borrowed art | Every sprite is drawn within 5% of its manifest aspect ratio; a new shape gets its own key (`scripts/art-shapes/build.mjs`, `shelfProp`). | `tests/abduct-sprite-aspect.test.ts`, `tests/flight-pickup-figure.test.ts` | `npm test` |
| A specimen wearing someone else's limbs | A new specimen ships all seven parts (`head`, `head_awake`, `torso`, `upper_arm`, `lower_arm`, `upper_leg`, `lower_leg`) as its own `human/<id>_*` keys; a new sleeper ships its own asleep and awake art. | `tests/abduct-body-art.test.ts` | `npm test` |
| Orphan art downloaded by every phone | Every key in `ART` is drawn by a room or level definition or by code that names it as a value. A key nothing draws leaves `ART`: delete it with its SVG, or move it to `SOURCE_ART` if a build script reads it. | `tests/shell-art-orphans.test.ts` | `npm test` |
| Boot requests art that isn't there | The loader asks only for `PRELOAD_ART`; procedural-only keys sit in `PROCEDURAL_ART`. | `tests/shell-art-preload.test.ts` | `npm test` |
| Solid props that look like decor | An art key is always solid or always decor; solid props wear the cream rim. | `tests/abduct-prop-roles.test.ts` | `npm test` |
| Art unreadable at phone size | Judge art at 1× in a 375×690 frame. | none (rule only) | capture at 1× |

## Copy and story

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A level missing from a registry | Counted words match the specimen count, plurals agree, each level has its own cover story, headline and opener, `#NNNN` numbers. | `tests/levels-registries.test.ts`, `tests/ui-story.test.ts`, `tests/ui-workorders.test.ts`, `tests/ui-report-extras.test.ts` | `npm test` |
| The same gag again, France-only references | No repeated 4-word phrases without a reason; worldwide references. | `tests/ui-copy-repeats.test.ts` | `npm test` |
| Missing French | FR mirrors EN. | `tests/ui-i18n.test.ts` | `npm test` |
| Story out of order, lore before its level | Story tokens only after their level; era levels name only the years of eras they require. A new lore term gets a token. | `tests/ui-copy-continuity.test.ts` (sections 1 and 3) | `npm test` |
| A rank payoff nobody can reach | The ladder spans every star; the parking-ring payoff shows once L12 is delivered at any rank. | `tests/levels-progress-ranks.test.ts` | `npm test` |
| A report line nobody can see | Every deep comment, first-clear, sunrise and pickup line comes out on at least one level for some report state and rotation; a pickup or level pool never holds the slot for good. | `tests/ui-report-comment-reach.test.ts` | `npm test` |
| Rank text squeezed sideways | Every rank title, flavour and payoff fits `RANK_BOX` at its normal font beside a 4-digit purse, EN and FR. | `tests/ui-workorders-rank-fit.test.ts` | `npm test` |
| A memo that runs into the goals | Body and joke box clear the goals block at or above the 16 px floor, EN and FR; cut the copy, never the floor. | `tests/ui-memo-fit.test.ts` | `npm test` |
| An exit sign off screen | Every interior room's exit tag stays inside the view wherever the exit shows, EN and FR. | `tests/abduct-exit-tag.test.ts` | `npm test` |
| A route pill over a cable | Route pills keep off every solid line on screen (wires, bunting, survey cables, crane booms) as drawn. A new solid hazard returns its segment from `HazardField.solidLine`. | `tests/flight-pill-lines.test.ts`, `tests/flight-pill-view.test.ts` (the real view) | `npm test` |
| A route pill far from its ring | A pill pushed more than 1.5 gaps from its ring, or across a solid line from it, hides (and comes back only near its ring after a hold). | `tests/flight-pill-reach.test.ts`, `tests/flight-pill-view.test.ts` | `npm test` |
| Behaviour keyed on display text | Find a prop, a route or a hazard by an id, an art key or a shared constant, never by comparing with English text (it is a translation key too). | `tests/shell-display-strings.test.ts` | `npm test` |
| Behaviour keyed on a hazard's place in its list | Find a hazard by a data field (a skin, an art key), never `hazards[0]`, `cause === 0` or a detector loop's index (a view's decoration, like the 2199 listeners, names its detector by data); reordering a room's hazards or a map's detectors changes nothing. | `tests/shell-data-couplings.test.ts` | `npm test` |
| A route pill over a detector edge | Route pills draw in the `ROUTE_PILLS` layer under every `DETECTOR_TELLS` layer; a new detector view adds its tells to the view's detector layer. | `tests/flight-pill-edges.test.ts` | `npm test` |
| A view that allocates every frame | `sync()` paths allocate nothing, down every call into any module and any class a view holds in a field: `if (shape.stale(key)) shape.redraw(…)`, helpers fill a required `out` object, plain loops instead of `.some(h => …)` closures. | `tests/shell-hot-alloc.test.ts` | `npm test` |
| A souvenir, specimen or town pickup with no trophy slot | Every room item, swap, specimen and town pickup has its slot and EN+FR text; each level after L1 has one pickup hinted in its memo. | `tests/ui-trophies*.test.ts`, `tests/ui-trophies-specimens.test.ts`, `tests/flight-collectible*.test.ts`, `tests/ui-trophies-hunt-star.test.ts` | `npm test` |

## Save and release

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A save that hides older progress, or a new level missing from the save | The loader imports only a real save shape, every recognised field correctly typed (a new save field gets its entry in `SAVE_FIELD_TYPES`), and falls through broken values and records with no usable value (`SAVE_FIELD_USABLE`), except that the current save is repaired, never thrown away, when it still holds level progress (or when there is no older save); `LEVEL_IDS` names exactly the levels in `LEVELS`, and each level's progress survives a write and a reload. | `tests/levels-save.test.ts`, `tests/levels-save-fallback.test.ts`, `tests/levels-save-levels.test.ts` | `npm test` |
| A browser run that passes without playing | Every shift ends on a delivered report that survives a reload; a full run plays every registered order and tutorial ring (a new tutorial ring needs its approach in `scripts/tutorial-approaches.cjs`); a typo or empty selection fails; each room entered must be the ring the run meant; rooms go no slower than `SLOWEST_HONEST_PACE`. | `scripts/e2e-playthrough.cjs`, `tests/shell-e2e-runner.test.ts` | `npm run build -- --mode e2e --outDir review/e2e-build`, `npm run preview -- --outDir review/e2e-build --port <port> --strictPort`, then `BASE=http://localhost:<port>/ node scripts/e2e-playthrough.cjs` |
| An untested commit on the live site | Pages pins each branch to one SHA, tests it before building it, and publishes only those builds; a push gates only its own branch (the other keeps its last good build), and a superseded run (a rerun with an old event SHA) publishes nothing; a branch superseded mid-run falls back to its live build, and builds and bundles are named per run attempt. | `tests/shell-pages-deploy.test.ts` | `npm test`; after a push, compare `/deployed.json` with the pushed SHA |
| A deadline that drops what the player earned | Sightings count when they happen; an accepted delivery is safe through its exit animation; the 2199 opener never holds back a warning. | `tests/flight-deep-lifecycle.test.ts` | `npm test` |
| The build calls itself the old version | Title label and lockfile follow `package.json`. | `tests/shell-version.test.ts` | `npm test` |

## What is not automated

- Art readability at phone size, the reference rules (obvious, international, quoted right) and the
  joke-variety caps beyond the tracked gags: judge them by capture and by reading.
- Story-specific copy that names one level (the 1955 "10:10" lines, the L8 ape counts, the 2199 practice fork)
  stays keyed by level id in the allowlist of `tests/shell-level-branches.test.ts`. A new storm, demolition or
  time-trial level falls through to the generic dawn copy, and `tests/ui-copy-continuity.test.ts` fails until it
  has its own words.
