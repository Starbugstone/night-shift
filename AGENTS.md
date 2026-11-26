# Night Shift — agent guide

Read `docs/GDD.md` (what to build), `src/contracts.ts` (shared types) and
`src/art-manifest.ts` + `docs/ART_BRIEF.md` (art keys and sizes) first.

## Stack

Vite + TypeScript (strict), rendered with PixiJS 8 (`pixi.js`, pinned; WebGL) driven by our own
loop, input and scene manager; no other runtime dependencies. How rendering works and the rules
for views: `docs/PIXI-MIGRATION.md`. Custom verlet ragdoll physics. Vitest for logic tests
(`tests/**/*.test.ts`, node environment — keep physics/logic free of DOM so it
is testable). Commands: `npm run dev`, `npm test`, `npm run typecheck`,
`npm run build`.

## Player experience priorities

Mobile first: portrait, one thumb, 540×960 logical canvas letterboxed into the
viewport; tune for a 375×690 CSS px phone. 60 fps, no per-frame allocations in
physics/render hot paths, devicePixelRatio-aware backing store (cap DPR at 2).
Comedy and feel beat realism. Instant restart.

## Code ownership (parallel agents share one checkout)

| Area | Owner |
| --- | --- |
| `src/main.ts`, `src/core/**`, `src/flight/**`, `src/ui/**`, `src/levels/**`, `src/audio/**` | shell & flight implementer |
| `src/abduct/**` (ragdoll, beam, rooms, wake meter, abduction HUD) | abduction implementer |
| `public/art/**` | art |
| `src/contracts.ts`, `src/art-manifest.ts`, `docs/**`, `AGENTS.md`, config | coordinator (additive edits allowed, report them) |

Edit only your area. Tests go in `tests/<area>-*.test.ts`. Commit only as
"Git and committing" at the end of this file says. Do not run `npm install`
of new packages without saying why in your report.

## Shared rendering helpers (use these before drawing your own)

Read `docs/PIXI-MIGRATION.md` first: a scene keeps its logic and draws through a view class built
lazily with `ViewSlot`; views build display objects once and `sync()` only properties.
Rebuilding Pixi geometry every frame is several times dearer than Canvas 2D was.

- `src/core/gfx/` — the kit: `textures.ts` (`artTexture`, `paintedTexture` for static drawing painted
  once with Canvas 2D, `ownedTexture` for big per-scene bitmaps you free yourself, `silhouetteTexture`),
  `glow.ts` (`Glow`, `ScreenTint.vignette/edge/wash`, light textures), `text.ts` (`Label`, `Paragraph`,
  `wrapLines`, `measure`), `shapes.ts` (`Shape` + `keyOf`: geometry rebuilt only when its key
  changes; `roundRect`, `panelPath`, `ellipseArc`), `particles.ts` (`ParticleView` for a `Particles` pool),
  `scene.ts` (`ViewSlot`, `SceneView`), `host.ts` (renderer, letterbox, `captureFrame`).
- `src/core/fx.ts` — `Particles` (one fixed-size pool per scene: stars, puffs, sparks, rings,
  twinkles; simulation only), `GLOW` colours, `rgbOf`, easing.
- `src/ui/views/` — `artSprite` / `artTex` / `artShadow` (manifest art, null when missing),
  `ButtonView`, `NightSky`, `Skyline`, icons, portraits, and the one in-game HUD kit in `hud.ts`
  (`HudPanel`, `HudMeter`, `HudTimer`, `HudButton`, `HudPrompt`, `HudFuse`, `HudSunClock`) on the
  shared `HUD_ROW` from `src/ui/hud.ts`. Both phases use it; don't hand-draw HUD boxes.
- Flight speech (house quips, barks, pills over the map) goes in the world's `FLIGHT_BUBBLES` layer
  (`src/flight/views/overlays.ts`): above every map object, under the saucer (`abovePlayer`).
  `node scripts/pixi/check-bubbles.mjs <e2e build URL>` checks every flight level. Speech timers use
  `readSeconds()` (`src/core/read-time.ts`), never a fixed duration. Road junctions get their kerbs from
  `drawJunctions`; `tests/flight-roads.test.ts` checks every level's road corners.
- Canvas 2D only runs inside texture painters; `tests/shell-pixi-only.test.ts` enforces that no code
  makes its own canvas or draws on one per frame.
- `SceneManager.go(name, make, instant, transition)` — `fade` (default), `iris`, `flash`.
- Every animated effect checks `ctx.reducedMotion`. Gameplay tells (cone edge, bark ring, neon
  on/off) must stay honest: decorate them, don't move them.
- Tell language (v2): **mint** = you and your goals, **amber** = about to happen (ghost cones, arming
  arcs, charging lasers), **red** = it has you right now (the fuse ring round the saucer or the
  specimen, the edge of the detector that sees you). A detector always has a hard edge; decor
  (`src/flight/ambient.ts`, room light pools) never draws an edged pool of light.

## Art

Load art by manifest key through `ctx.assets.get(key)`; files are at
`public/art/<key>.svg`, served from `import.meta.env.BASE_URL + 'art/'`.
Every draw must have a primitive fallback (art may be missing or still
being made): `artSprite` returns null for missing art, so build the fallback then. Draw sprites
into a rect of the manifest size.

## v2 "Deeper Shift" (2026-11-23)

Design: `docs/GDD-2-deeper.md` (it overrides `docs/GDD.md` where they differ).
New shared types in `src/contracts.ts`: the extended `RoomId`, `AbductRules`,
`AbductFailReason`, the v2 `SfxName`s, the `snooze_ray` upgrade (the `afterburner` was withdrawn), and
the autopilot intents. The art keys for v2 are in `src/art-manifest.ts` under the
v2 banner. Code owners may append keys in their own marked APPEND section and must
always draw a primitive fallback.

Proof of solvability: every abduction route and every deep-level flight map must
have a headless vitest autopilot run that completes it without failing. Each scene
also exposes `debug.autopilot()` (see contracts) so that `scripts/e2e-playthrough.cjs`
can play the game through real pointer input.

**Hard rule: no straight-line win.** On every level, a naive beeline must be caught or fail at
every start time the difficulty evaluator tests. The challenge sits on the obvious path. Ghost may
be hard but must stay reachable for the casual (average human) model, more generously in early
levels. `npm run difficulty` enforces both.

**Hard rule: no spawn gate, and vary the openings (2026-11-26).** Meet the beeline rule on the way:
a patrol crossing the route, traffic, a guard at the door, a timed burst mid-map. Don't do it by
parking a fixed detector across every straight line out of the spawn. At most two levels may keep a
spawn gate, each with a written story reason. Each spawn sits in a zone (an edge third, or the
centre). Neighbouring levels in `LEVELS` order use different zones, and the game uses at least four.
Tie the arrival to the level's story. `tests/levels-spawn-variety.test.ts` enforces both rules. Its
`PENDING_*` lists name the levels still waiting for their rework and may only shrink.

**Hard rule: every town pickup is hinted in the shift memo.** Each level after L1 has exactly one
optional map collectible (docs/GDD-8-map-collectibles.md), and that level's shift memo mentions it in
English and French. If a memo already names an object or person, that thing is the collectible. L1 has
none. `tests/flight-collectible*.test.ts` checks every level in `LEVELS`, so a new level fails until it
has its pickup and its memo hint.

**Hard rule: every souvenir has a place in the trophy room.** Each item any room can yield (room items
and `SOUVENIR_SWAPS`, Field Check included) has a trophy-room slot, a name in `tr().items` and a catchy
description in EN and FR. When you add a level or a room, add its souvenirs to the trophy room.
`tests/ui-trophies*.test.ts` walks every room, so a new souvenir fails until it is on the shelf. When the
shelves outgrow a room, the design (docs/GDD-9-trophy-room.md) opens another wing. Town pickups have
their own room in the trophy room: a level's map collectible needs a slot there too, with an EN and FR
name and description (the same test walks `LEVELS`). Abducted specimens have a third room (the Specimen
Archive): every room's `human` needs an entry with an EN and FR name, age, height, weight and funny
description (`tests/ui-trophies-specimens.test.ts`). The "probed" stamp is rolled once at first delivery
and is cosmetic only: it never touches stars, Glorbs or unlocks.

**Hard rule: no bump on start.** Every room spawn must sit 10 s without input with zero bonks and
zero wake (`tests/abduct-spawn.test.ts`); fix the spawn pose or position, never the wake rules.

Solvable is not the same as fair: the autopilot plays perfectly. Every deep level also has a
difficulty band for human-model players (reaction delay, wobble, human drag speed), checked by
`npm run difficulty` (part of `npm test`). Use
[.claude/skills/evaluate-difficulty/SKILL.md](.claude/skills/evaluate-difficulty/SKILL.md) when
tuning a level or adding one.

Use [.claude/skills/verify-night-shift/SKILL.md](.claude/skills/verify-night-shift/SKILL.md)
for browser verification recipes, the feature map, and evidence capture.

## v3 "New Shifts" (2026-11-23)

Design: `docs/GDD-3-new-shifts.md` (L5 Pier Pressure, L6 Probe Compliance, L7 A Whole Cruise Ship,
plus report additions). Art keys are in `src/art-manifest.ts` under the v3 banner.

Ownership while the v3 agents run (one checkout, several agents):

| Area | Owner |
| --- | --- |
| `src/levels/deep-pier.ts`, `src/abduct/rooms/deep-pier.ts`, dolphin body plan + moisture (`src/abduct/body-plan.ts`, `src/abduct/moisture.ts`), `src/flight/lighthouse.ts`, `tests/*-pier*.test.ts` | pier code |
| `src/levels/deep-clinic.ts`, `src/abduct/rooms/deep-clinic.ts`, `src/abduct/probe.ts`, `src/flight/ambulance.ts`, `tests/*-clinic*.test.ts` | clinic code |
| `src/levels/deep-ship.ts`, `src/abduct/rooms/deep-ship.ts`, `src/abduct/swell.ts`, `src/flight/photographer.ts`, `tests/*-ship*.test.ts` | cruise code |
| `src/ui/report.ts`, `src/ui/report-*.ts`, `tests/ui-report*.test.ts` | report code |
| `public/art/**` for L5 + L7 keys | art (Fable) |
| `public/art/**` for L6 + v3 UI keys | art (Astra) |

Shared engine files (`src/abduct/interior.ts`, `src/abduct/rooms/interior.ts`, `src/abduct/deep-view.ts`,
`src/abduct/draw.ts`, `src/abduct/simulation.ts`, `src/abduct/autopilot.ts`, `src/abduct/ragdoll.ts`,
`src/flight/hazards.ts`, `src/flight/deep-sim.ts`, `src/flight/deep-scene.ts`, `src/flight/autopilot.ts`,
`src/levels/humor.ts`, `tests/difficulty/*`, the shared test files, `src/i18n/en.ts` + `fr.ts`): put new
mechanics in your own module and add only small hook lines here. Re-read a shared file right before
each edit, keep edits small, never reformat it, never undo another agent's lines. Registries carry
`// L5 pier code` style anchor comments: add your lines directly under your own anchor.

## v4 "Deeper Jokes" (2026-11-24)

Work now lands on the `preprod` branch first (published at /night-shift/preprod/), then merges into
`main`. The tone goes up to **PG-13, leaning 16**: innuendo, butt and probe jokes, mild swearing,
pop-culture and sci-fi references. Nothing sexually explicit, no slurs, nobody real mocked.
References must be internationally known (any film or genre, not only sci-fi): English is the
main audience and French a small part. French text may adapt a pun or use the French dub's wording
of the same international reference, but levels, characters and jokes aren't built on French-only
references.

Ownership while the v4 agents run (one checkout, several agents):

| Area | Owner |
| --- | --- |
| `src/abduct/souvenir.ts`, `src/levels/humor.ts`, `src/ui/report*.ts`, new souvenir items in the existing rooms (small hook lines), `tests/*-souvenir*.test.ts`, `tests/ui-report*.test.ts` | items & recap humour |
| existing lines of `src/i18n/en.ts` + `fr.ts` (wording, references, French readability) | translation review (Neon) |
| L8 primates & monolith: `src/levels/deep-monolith.ts`, `src/abduct/rooms/deep-monolith.ts`, new L8 modules, `docs/GDD-4-monolith.md`, `tests/*-monolith*.test.ts` | L8 level (Astra; art Fable; spatial review Neon) |
| the saucer and its pilot: `src/flight/views/craft.ts`, new `src/flight/pilot*.ts`, saucer/pilot art keys, `tests/flight-pilot*.test.ts` | UFO pilot |
| `docs/research/**` | sci-fi research (Sol) |
| `.claude/skills/evaluate-difficulty/**`, `tests/difficulty/**`, star tuning values and placements in `src/levels/deep-*.ts` + `src/flight/*` (listed in its report) | star difficulty (Sol) |
| `docs/GDD-5-progression.md`, `tests/difficulty/progression*` (design pass; no level edits) | difficulty progression (Sol) |
| L8 time-trial rework: the L8 files above plus new `src/flight/roam*.ts` (roaming targets) | L8 time trial (Astra) |
| `docs/GDD-6-story.md` tiers 1–2: level memo/headline/tagline strings, memo sign-offs (`src/ui/memo.ts`), Zib shift openers, Vrell first-clear lines, loading tips (small hooks in `src/ui/report.ts`, `src/levels/humor.ts`, `src/ui/loading.ts`, `src/flight/deep-scene.ts`) | story build (Neon) |
| `docs/GDD-5-progression.md` build, plus Ghost softening on L4/L5: level tuning and first encounters in `src/levels/*.ts`, `src/abduct/rooms/*.ts` (not L8), unlocks and save migration in `src/levels/save.ts` / `progress.ts`, `src/ui/workorders.ts` | progression build (Sol) |
| `docs/GDD-7-eras.md`, `docs/research/film-references.md` | eras and film references (Sol) |
| alien voices: `src/audio/voice.ts` (WebAudio engine), `src/audio/voice-plan.ts` (text → syllables, `VOICES`), `tests/audio-voice*.test.ts`; `speak`/`hush` hooks marked `// v4 voices` in `src/audio/sfx.ts`, `src/contracts.ts` (`VoiceId`, `SpeakOptions`), the memo, report, abort, deep-choice and both flight scenes | alien voices |

New strings: add them to both `en.ts` and `fr.ts` under a `// v4 <area>` anchor comment; the
translation review only rewrites existing lines and will do a second pass on the new ones. The v3
rules for shared files still apply: re-read right before each edit, keep edits small, never reformat,
never undo another agent's lines. Commit only as "Git and committing" says.

## Regression guards (2026-11-26)

`docs/REGRESSIONS.md` lists every bug class the player or a review has reported, its rule and the test that
guards it. Read the rows your change touches before you finish, and run their guards.

- **A reported bug gets a guard.** When the user reports a new kind of bug, add a row to `docs/REGRESSIONS.md`
  and a test that walks every level in `LEVELS` and every room in `ROOMS`, never a fixed list.
- **Never narrow a guard to pass.** If a test fails, fix the level or the code, not the assertion. Covering
  fewer levels, rings, start delays, seeds or rooms needs the user's OK, and your report gives the before
  and after numbers.
- **PENDING lists only shrink.** Never add an entry for content you are adding; fix the content. When a pending
  entry starts passing, take it off the list.
- **A new mechanic is taught.** A new room field or hazard kind fails `tests/abduct-mechanic-taught.test.ts`
  until it is registered with the level that introduces it and the EN+FR memo line or prompt that teaches it,
  with a reason the story gives.
- **Copy follows the story.** A new lore term, payoff or deadline word gets a token in
  `tests/ui-copy-continuity.test.ts`. Repeated phrases and France-only references fail
  `tests/ui-copy-repeats.test.ts`.
- **Prove failures are not yours.** Name every failing file. Before calling a failure another agent's, show it
  fails without your change, for example on your staged snapshot.
- **Evidence shows the change.** Capture on a fresh build after the change, at 1× phone size, in EN and FR for
  text, after the memo typewriter has finished. The final report lists the tests run and what is still pending.

## Git and committing (shared checkout)

Several sessions edit this checkout at once, with uncommitted hunks in the same files (`en.ts`, `fr.ts`,
`deep-view.ts`...), and some keep local commits they have not pushed yet. (2026-11-26, advised by Neon and Sol.)

- **Who commits.** Delegated children never run `git add`, `git commit`, `git stash`, `git checkout` or
  `git reset`: they report their files and hunks, and the parent commits. A top-level thread commits only
  when the user asks ("commit and push").
- **Never in the shared checkout:** `git stash` (it takes other sessions' edits off the disk), `git checkout`,
  `git switch`, `git restore` or `git reset` on files that aren't yours, `git add -A`, `git add .`,
  `git commit -a`, and force-pushing.
- **Stage only your own hunks.** Add new files by name, and use `git add -p` in shared files. Read the whole
  `git diff --cached` and run `git diff --cached --check`: no hunk from another session.
- **Check the commit, not the working tree.** After committing, build a scratch checkout of that exact commit
  (`git worktree add <scratchpad>/check HEAD`, then link `node_modules` into it) and run `npm run typecheck` and
  the guards your change touches there. If something fails, fix it with a new commit before pushing.
- **Push only what is yours.** `git fetch origin`, then read `git log --oneline origin/preprod..HEAD`. Push
  when every outgoing commit is yours, or the user asked to ship it. Otherwise, or if the push is rejected,
  don't rebase the shared checkout: cherry-pick your commits onto `origin/preprod` in a scratch worktree, run
  the checks there, `git push origin HEAD:preprod`, and tell the user the shared branch needs reconciling.
- **Branches.** Work ships to `preprod`. Merge or push to `main` only when the user says so.
- **Report** the pushed SHA, what it contains and the checks you ran.
