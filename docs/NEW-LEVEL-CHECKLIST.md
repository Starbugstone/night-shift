# New level / new room checklist

Every problem class the v0.2 release council found (`review/council-v02/report.txt`), the rule that keeps it
from coming back in a new level or room, and what enforces it. Rows in `docs/REGRESSIONS.md` carry the history.
Every guard below walks `LEVELS` or `ROOMS`, so a new level fails the suite until it meets the rule. Don't narrow
a guard to pass, and don't add a `PENDING_*` entry for content you are adding (`docs/REGRESSIONS.md` P1).

Before you call a new level or room done, run `npm run typecheck`, `npm test` (which includes `npm run difficulty`)
and `npm run build`, then the e2e run at the end of this page.

## Difficulty

| Problem | Rule | Guard | Command |
|---|---|---|---|
| Difficulty bands look green on a small sample | Casual, skilled and Ghost rates sit inside the level's band on the release sample, not only on the default sweep. Retune the level; never relax a band. | `tests/levels-difficulty.test.ts`, `tests/difficulty/*` | `npm run difficulty`. *Placeholder: the difficulty agent adds the 20-seed release sweep (`npm run difficulty:release`).* |
| A straight line still wins | A naive beeline is caught at every tested start time. | `tests/levels-difficulty.test.ts` (nearest-ring beeline) | `npm run difficulty`. *Placeholder: the difficulty agent adds the every-ring, every-entry beeline matrix.* |
| Same opening, a detector parked on the spawn | No spawn gate; neighbouring levels use different spawn zones. | `tests/levels-spawn-variety.test.ts` | `npm test` |
| A deep map nobody flew | Every deep level is flown by the headless autopilot (or names its own driver). | `tests/flight-autopilot.test.ts` | `npm test` |
| Bump on start | A room spawn sits 10 s without input with zero bonks and zero wake. | `tests/abduct-spawn.test.ts` | `npm test` |

## Teaching

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A flight hazard nobody explains | Walking `LEVELS` in play order, every flight hazard kind and optional hazard field is classified, and taught on the first level that uses it: by that level's `FLIGHT_LESSONS` entry (`src/flight/views/progression-hint.ts`) or by registered EN+FR memo or prompt strings. Seven hazards from before the rule wait in its `PENDING` list (`docs/REGRESSIONS.md` L13). | `tests/flight-hazard-taught.test.ts` | `npm test` |
| A flight lesson left behind when the map moves | Each lesson shows on the autopilot shift no later than the first meeting with its hazard, and never at a spawn far from it; prompts use hysteresis. | `tests/flight-lesson-route.test.ts`, `tests/flight-lesson-hysteresis.test.ts` | `npm test` |
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
| A cue repeating like an ambient loop | No sfx more than 16 times in any minute of a room's autopilot or idle run, or of a flight parked or flown; timed cues play only when they matter; every cue honours its volume argument. | `tests/audio-repeats.test.ts`, `tests/audio-sound-rules.test.ts` | `npm test` |
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
| A souvenir, specimen or town pickup with no trophy slot | Every room item, swap, specimen and town pickup has its slot and EN+FR text; each level after L1 has one pickup hinted in its memo. | `tests/ui-trophies*.test.ts`, `tests/ui-trophies-specimens.test.ts`, `tests/flight-collectible*.test.ts`, `tests/ui-trophies-hunt-star.test.ts` | `npm test` |

## Save and release

| Problem | Rule | Guard | Command |
|---|---|---|---|
| A save that hides older progress, or a new level missing from the save | The loader imports only a real save shape and falls through broken values; `LEVEL_IDS` names exactly the levels in `LEVELS`, and each level's progress survives a write and a reload. | `tests/levels-save.test.ts`, `tests/levels-save-fallback.test.ts`, `tests/levels-save-levels.test.ts` | `npm test` |
| A browser run that passes without playing | Every shift ends on a delivered report that survives a reload; a full run plays every registered order. | `scripts/e2e-playthrough.cjs` | `npm run build -- --mode e2e --outDir review/e2e-build`, `npm run preview -- --outDir review/e2e-build --port <port> --strictPort`, then `BASE=http://localhost:<port>/ node scripts/e2e-playthrough.cjs` |
| An untested commit on the live site | Pages pins each branch to one SHA, tests it before building it, and publishes only those builds. | `tests/shell-pages-deploy.test.ts` | `npm test`; after a push, compare `/deployed.json` with the pushed SHA |
| The build calls itself the old version | Title label and lockfile follow `package.json`. | `tests/shell-version.test.ts` | `npm test` |

## What is not automated

- Art readability at phone size, the reference rules (obvious, international, quoted right) and the
  joke-variety caps beyond the tracked gags: judge them by capture and by reading.
- Story-specific copy that names one level (the 1955 "10:10" lines, the L8 ape counts, the 2199 practice fork)
  stays keyed by level id in the allowlist of `tests/shell-level-branches.test.ts`. A new storm, demolition or
  time-trial level falls through to the generic dawn copy, and `tests/ui-copy-continuity.test.ts` fails until it
  has its own words.
