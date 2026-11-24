# Night Shift — agent guide

Read `docs/GDD.md` (what to build), `src/contracts.ts` (shared types) and
`src/art-manifest.ts` + `docs/ART_BRIEF.md` (art keys and sizes) first.

## Stack

Vite + TypeScript (strict), plain Canvas 2D, no game framework, no runtime
dependencies. Custom verlet ragdoll physics. Vitest for logic tests
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

Edit only your area. Tests go in `tests/<area>-*.test.ts`. Do **not** run
`git commit`, `git add`, `git stash`, `git checkout` or anything that changes
the index or other agents' files — the coordinator commits. Do not run
`npm install` of new packages without saying why in your report.

## Shared rendering helpers (use these before drawing your own)

- `src/core/fx.ts` — `Particles` (one fixed-size pool per scene: stars, puffs, sparks, rings,
  twinkles), `drawGlow` / `lightSprite` / `radialSprite` (cached light blobs; never fill a big
  radial gradient per frame), `drawShadow` (soft sprite silhouette), `CachedLayer` (static
  full-screen art painted once), `drawVignette` / `drawEdgeTint`, easing.
- `src/core/fx.ts` also has `drawSprite` / `bitmapOf` (an SVG sprite rasterised once per draw size at the
  backing store's own scale, then blitted; use it for anything drawn every frame on a big map),
  `drawWash` (a cached screen-wide directional tint, e.g. dawn) and `rgbOf`.
- `src/ui/hud.ts` — the one in-game HUD kit (`hudPanel`, `hudMeter`, `hudTimer`, `hudButton`,
  `hudPrompt`) on the shared `HUD_ROW`. Both phases use it; don't hand-draw HUD boxes.
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
being made). Draw sprites into a rect of the manifest size.

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
