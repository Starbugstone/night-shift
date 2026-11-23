---
name: verify-night-shift
description: Drive the Night Shift mobile Canvas game with real browser pointer input and verify Work Orders, flight, abduction, reports, saves, and purchases. Use to prove gameplay and progression changes in a local checkout.
---

# Verify Night Shift

Read the [feature map](features/README.md) before choosing a journey. This build is a Vite + TypeScript game with one browser surface, `canvas#game`. It needs no account, backend, or seed data. Each run creates a fresh Chromium context for its origin and starts a Vite instance on its own loopback port.

## Launch

From the repository root, install the lockfile's dependencies if they are absent. The runner uses the same Vite configuration as `npm run dev`. It uses the media tooling's Playwright module if configured and otherwise resolves `playwright` from the checkout. Chromium must already be installed for the module in use.

```bash
source ~/.local/share/claude-media-tools/env.sh
ss -ltnp
.claude/skills/verify-night-shift/scripts/verify.mjs 5297 doctor-01 doctor
```

Use a free port from `ss` and a fresh run ID each time. The command binds that exact port with Vite's strict-port option. The runner opens the base URL and advances frames until the title has loaded and its transition has settled. `Doctor passed` means the title is ready for input.

## Doctor

Use the `doctor` command above for a read-only check. The runner checks that its own Vite server owns the selected loopback address, records the checkout and Git revision, and requires HTTP 200, a visible game canvas, the Night Shift title scene, an empty `night-shift-save-v1` key, and no browser errors. Every drive runs the same check against its own server and context first. If it fails, read `trace.json` and the command output from that run.

## Drive

Run Farmer Doyle's chimney from the actual title → Work Orders → memo → flight entry. The runner steers to the chimney ring, releases to hover, and drags Doyle out through the flue.

```bash
.claude/skills/verify-night-shift/scripts/verify.mjs 5297 chimney-01 farm_chimney --from-orders
```

An isolated room command uses the app's `?room=` entry point. The runner checks the requested room, drives it through pointer events, and verifies its report and saved result. For example, run the laundry skylight in a fresh context.

```bash
.claude/skills/verify-night-shift/scripts/verify.mjs 5297 skylight-01 laundry_skylight
```

For other features, save an ES module with a default `async (game) => { … }` export in `review/night-shift-verify/`. Run the relevant feature recipe in that function with Node's `node:assert/strict`.

```bash
.claude/skills/verify-night-shift/scripts/verify.mjs 5297 orders-01 ./review/night-shift-verify/orders.mjs
```

- `await game.open(path, scene)` opens a relative URL, waits for loading and transitions, then checks the scene. The defaults are `'/'` and `'title'`. Each journey begins at the usable title following doctor.
- `await game.tap(x, y)` sends a mouse press and release with a game frame for each event. `await game.drag(x1, y1, x2, y2, frames)` moves a held pointer over the specified frames and releases it. `down(x, y)`, `move(x, y, frames)`, and `up()` let you control the gesture directly. Values are logical pixels in the 540×960 canvas. The helper maps them through the canvas's 375×690 viewport and its letterbox.
- `await game.step(frames)` advances 1/60 s per frame. `await game.expectScene(name, settleFrames)` checks a transition and allows it to settle. Use the canvas's visible labels and geometry to pick input coordinates.
- `await game.flyRing(roomId)` drives from the current tutorial flight scene to the chosen ring using the waypoints in `scripts/e2e-playthrough.cjs`. `await game.pilotRoom(roomId)` holds the mouse button down where `debug.autopilotFinger()` says (the beam heads for a held pointer) and moves it each step through Playwright's mouse. It requires delivery with the specimen still asleep, captures the report, checks the write and reload, and ends at the reloaded Work Orders. Pass `{ keepReport: true }` as the second argument when you need to drive a report button before reloading.
- `await game.observe(() => …)` reads browser state through `window.__nightShift.scene`, `active`, and `save`. `game.save()` reads the live save and `game.stored()` reads the browser's localStorage. Use debug data for observation and pilot suggestions. Exercise navigation, movement, and purchases with pointer input.
- `?level=1|2` opens a memo and `?flight=1|2` opens flight for isolated checks. Use the UI to verify normal progression. `?reset=1` clears this origin's progress and `?unlock=1` grants 999 Glorbs and unlocks both tutorial work orders. Use those only when the feature recipe calls for disposable reset or shopping setup.

## Evidence

Artifacts go to `review/night-shift-verify/<run-id>/`, ignored by Git. Use `await game.capture('step-name')` for a PNG from `canvas#game.toDataURL()`. Playwright's compositor screenshot hangs on this WSL host. The PNG includes the visible game canvas and letterbox. Capture the entry, the meaningful in-progress action and the end state. For mutations, pair the visible result with the stored value and a fresh view after reload in the same context.

The helper keeps the checkout revision, URL entry point, virtual-time pointer actions, selected state and browser errors in `trace.json`. Use `game.record('observation', { … })` to add a feature-specific assertion payload. Expected navigation that lands on a different scene automatically produces `unexpected-entry.png` and fails. Report the entry point used and each unmet precondition. For a room opened directly, report that flight has zero simulated time and zero sightings.

## Cleanup

The runner closes its own browser and Vite instance, deletes its temporary profile and Vite cache, and writes the trace even if a check fails. It leaves the run's PNGs and trace in the evidence directory. After exit, check that `ss -ltnp "sport = :5297"` shows no listener for the chosen port and that `review/night-shift-verify/<run-id>/trace.json` and the captures still exist. If a process was forcibly terminated, remove only the matching runtime directory once its process is gone. Keep the evidence directory.

## Helpers

[`scripts/verify.mjs`](scripts/verify.mjs) is executable. The commands above cover doctor, room entry, flight-to-room entry, and custom journey modules. The older `scripts/e2e-playthrough.cjs` supplies the tutorial flight approaches. This runner uses them with its own isolated context, port and evidence path.

Use `/maintain-verification-skill` to update the map and rerun the affected paths when the game changes.
