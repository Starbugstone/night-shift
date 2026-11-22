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
- `src/ui/hud.ts` — the one in-game HUD kit (`hudPanel`, `hudMeter`, `hudTimer`, `hudButton`,
  `hudPrompt`) on the shared `HUD_ROW`. Both phases use it; don't hand-draw HUD boxes.
- `SceneManager.go(name, make, instant, transition)` — `fade` (default), `iris`, `flash`.
- Every animated effect checks `ctx.reducedMotion`. Gameplay tells (cone edge, bark ring, neon
  on/off) must stay honest: decorate them, don't move them.

## Art

Load art by manifest key through `ctx.assets.get(key)`; files are at
`public/art/<key>.svg`, served from `import.meta.env.BASE_URL + 'art/'`.
Every draw must have a primitive fallback (art may be missing or still
being made). Draw sprites into a rect of the manifest size.

## v2 "Deeper Shift" (2026-11-23)

Design: `docs/GDD-2-deeper.md` (it overrides `docs/GDD.md` where they differ).
New shared types in `src/contracts.ts`: the extended `RoomId`, `AbductRules`,
`AbductFailReason`, the v2 `SfxName`s, the `afterburner` and `snooze_ray` upgrades, and
the autopilot intents. The art keys for v2 are in `src/art-manifest.ts` under the
v2 banner. Code owners may append keys in their own marked APPEND section and must
always draw a primitive fallback.

Proof of solvability: every abduction route and every deep-level flight map must
have a headless vitest autopilot run that completes it without failing. Each scene
also exposes `debug.autopilot()` (see contracts) so that `scripts/e2e-playthrough.cjs`
can play the game through real pointer input.
