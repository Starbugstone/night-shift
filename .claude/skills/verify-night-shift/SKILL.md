---
name: verify-night-shift
description: Drive the Night Shift mobile web game (PixiJS / WebGL canvas) with real browser pointer input and verify Work Orders, flight, abduction, reports, saves, and purchases. Use to prove gameplay and progression changes in a local checkout.
---

# Verify Night Shift

Read the [feature map](features/README.md) before choosing a journey. This build is a Vite + TypeScript game rendered with PixiJS 8 (WebGL) on one browser surface, `canvas#game`: fourteen shifts (two tutorials, the Birch Lane calls, Maple Court to Patent Valley, 1955, 1122, 1953 and the 2199 finale), the Beam Shop, a three-wing trophy room and the Dispatch finale. It needs no account, backend, or seed data. Each run creates a fresh Chromium context for its origin and starts a Vite instance on its own loopback port.

## Launch

From the repository root, install the lockfile's dependencies if they are absent (in a `.t3/worktrees` checkout, link them: `ln -s /home/stone/dev/night-shift/node_modules node_modules`). The runner uses the same Vite configuration as `npm run dev`. It uses the media tooling's Playwright module if configured and otherwise resolves `playwright` from the checkout. Chromium must already be installed for the module in use.

```bash
source ~/.local/share/claude-media-tools/env.sh
ss -ltnp
.claude/skills/verify-night-shift/scripts/verify.mjs 5297 doctor-01 doctor
```

Use a free port from `ss` and a fresh run ID each time. The command binds that exact port with Vite's strict-port option. The runner opens the base URL and advances frames until the title has loaded and its transition has settled. `Doctor passed` means the title is ready for input.

## Doctor

Use the `doctor` command above for a read-only check. The runner checks that its own Vite server owns the selected loopback address, records the checkout and Git revision, and requires HTTP 200, a visible game canvas, the Night Shift title scene, an empty save, and no browser errors. It reads the save key from `SAVE_KEY` in `src/levels/save.ts` (`night-shift-save-v3` today; the game imports `-v2` and `-v1` once and never writes them), so a save migration cannot leave the runner reading a dead key. Every drive runs the same check against its own server and context first. If it fails, read `trace.json` and the command output from that run.

The context runs at 375×690 CSS px and DPR 1 (`DSF=2` for crisp captures; at 2, software GL stalls on every pointer move on this host). Rendering is off between evidence frames: `open()` sets `window.__nightShift.drawing = false` and `capture()` redraws the frame it reads. `DRAW=1` draws every stepped frame, for timing-sensitive visual checks.

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
- `await game.goto(scene, arg, expected)` navigates inside the loaded page through `__nightShift.goto`, for example `goto('flight', 12)` or `goto('abduct', 'nora_side')`. Prefer it to a second `open()` on a busy host, where `page.goto` can time out.
- `await game.observe(() => …)` reads browser state through `window.__nightShift.scene`, `active`, and `save`. `game.save()` reads the live save and `game.stored()` reads the browser's localStorage. Use debug data for observation and pilot suggestions. Exercise navigation, movement, and purchases with pointer input.
- `?level=N` opens order N's memo and `?flight=N` its flight (N is the play-order number, 1–14: `window.__nightShift.workOrders` lists them); `?room=<id>` opens any registered room. Use the UI to verify normal progression. `?reset=1` clears this origin's progress and `?unlock=1` grants 999 Glorbs and opens every work order. Use those only when the feature recipe calls for disposable reset or shopping setup.

## Evidence

Artifacts go to `review/night-shift-verify/<run-id>/`, ignored by Git. Use `await game.capture('step-name')` for a PNG from `window.__nightShift.capture()`, which renders the frame and reads the WebGL canvas in one step. Never read `canvas#game` with `toDataURL` or `drawImage` on its own: a WebGL canvas is blank outside the frame that drew it. If you must read it directly, call `window.__nightShift.redraw()` first in the same `evaluate`. Playwright's compositor screenshot hangs on this WSL host. The PNG includes the visible game canvas and letterbox. Capture the entry, the meaningful in-progress action and the end state. For mutations, pair the visible result with the stored value and a fresh view after reload in the same context.

The helper keeps the checkout revision, URL entry point, virtual-time pointer actions, selected state and browser errors in `trace.json`. Use `game.record('observation', { … })` to add a feature-specific assertion payload. Expected navigation that lands on a different scene automatically produces `unexpected-entry.png` and fails. Report the entry point used and each unmet precondition. For a room opened directly, report that flight has zero simulated time and zero sightings.

## Cleanup

The runner closes its own browser and Vite instance, deletes its temporary profile and Vite cache, and writes the trace even if a check fails. It leaves the run's PNGs and trace in the evidence directory. After exit, check that `ss -ltnp "sport = :5297"` shows no listener for the chosen port and that `review/night-shift-verify/<run-id>/trace.json` and the captures still exist. If a process was forcibly terminated, remove only the matching runtime directory once its process is gone. Keep the evidence directory.

## Rendering checks

Use these when a change touches how something looks or how fast it draws. Rendering rules are in `docs/PIXI-MIGRATION.md`. Software GL (SwiftShader) is fine for the journeys above because the runner drives a virtual clock. For looks and frame times, use the real GPU on this WSL host: `GALLIUM_DRIVER=d3d12 LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH GPUARGS='--use-angle=gl --ignore-gpu-blocklist --enable-gpu'`. The GL line printed by the bench shows which one you got.

Build the optimized test version with `npm run build -- --mode e2e --outDir review/e2e-build`. Serve it with `npm run preview -- --outDir review/e2e-build --port 5311 --strictPort`. Use that URL for the frame-time bench and full playthrough. The verification runner starts a dev server and already has access to fixtures.

- **Before/after looks.** Serve the base commit and the change on two ports, then run `node scripts/pixi/shots.mjs <url> <out-dir> name=/?room=dave_roof@1500 ...` against each. Open both PNGs. `/?room=<id>`, `/?unlock=1&flight=<n>` and `/?level=<n>` reach most screens; `__nightShift.goto(...)` reaches the rest.
- **Frame time.** `THROTTLE=1,6 PAGES=flight=3,room=dave_roof node scripts/pixi/bench-frames.mjs <url>` reports fps and `workP95`, the main-thread milliseconds per frame from the game's own `__nightShift.frameMs` ring. Run it on a quiet machine: parallel browsers and test runs share the GPU and skew both numbers. At throttle 6, expect about 60 fps with `workP95` well under 16 ms.
- **Full playthrough.** `BASE=<url> node scripts/e2e-playthrough.cjs` plays the four tutorial routes, then every deep order in `workOrders`, through real pointer input. `ONLY=` takes a comma list of `tutorial`, `deep`, level ids or short names (`ONLY=birch_bakery,L10,L11,L12`); `PICKUP=1` takes each town pickup first where the runner has a driver (Birch Lane, the 1955 time car, the 1953 tripod leg) and then requires all four stars. A SPOTTED card is closed with a real tap (`FORCE_SPOT=1` raises one sighting per deep flight to prove that path). Each shift passes only with a report stamped *delivered* whose own Delivered star is lit, one more report and attempt in the save, and the same level record after a reload; a full run must play every registered order. Any failure, page error or console error exits 1 and is listed under `failures` in the JSON on stdout. Rendering is off between captures (`DRAW=1` to keep it), which keeps software GL near real time. Give a whole run the real GPU through `GPUARGS` where you can.
- **Guard.** `tests/shell-pixi-only.test.ts` fails if code makes its own canvas or draws on one per frame.

## Helpers

[`scripts/verify.mjs`](scripts/verify.mjs) is executable. The commands above cover doctor, room entry, flight-to-room entry, and custom journey modules. `scripts/e2e-playthrough.cjs` supplies the tutorial flight approaches and plays whole deep shifts; use it (against an e2e preview build) when a check needs a complete shift, and `verify.mjs` for menus, single rooms and virtual-clock evidence.

## Under load

When other agents share the host (load average 15–35), a second `page.goto` can pass Playwright's 30 s limit and the first load can pass the runner's 15 s loading deadline. Navigate in-page with `game.goto(...)`, keep rendering off between captures (the default), and retry a run whose doctor timed out. Never `pkill -f` a pattern that also appears in your own command line; kill by PID.

Use `/maintain-verification-skill` to update the map and rerun the affected paths when the game changes.
