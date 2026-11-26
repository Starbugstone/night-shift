# Build brief: five new levels (shared by every build agent)

You build one level, or the two Birch Lane shifts, from its design doc, which the council scored 10/10. The doc is the spec: build what
it says, with its exact EN and FR copy. If something in it can't be built as written, keep the joke and the tell, adapt the geometry,
and say so in your report.

| Agent | Level(s) | Design doc |
| --- | --- | --- |
| A | #0003 Baker Mabel's First Batch + #0004 While the Hendersons Are Away (inserted between Spin City and Maple Court, plus the Maple Court copy changes) | docs/GDD-11-onramp.md |
| B | 1122 · Ni! | docs/GDD-12-1122-grail.md |
| C | 1953 · The War of the Colds | docs/GDD-13-1953-tripods.md |
| D | 2199 · Your Town Is in the Way (season finale, plus its three ending panels) | docs/GDD-14-2199-hitchhiker.md |

## Read first
- AGENTS.md: the hard rules and the shared-file rules.
- docs/PIXI-MIGRATION.md.
- docs/story/decisions.md.
- docs/GDD-10-1955.md, with L9's code as the closest model: `src/levels/deep-1955.ts`, `src/abduct/rooms/deep-1955.ts`, `src/flight/time-car.ts`, `scripts/art-l9/`.
- The groundwork already in place: explicit prerequisites (`requires`), play-order work-order numbers and the v3 save (see `tests/levels-dispatch.test.ts`). D7: 1122 and 1953 each require level9; 2199 requires both.

## Every level must ship with
- **The flight map, hazards and rooms** from the doc, on existing systems wherever the doc says so. Every hazard has honest mint, amber and red tells, and new mechanics live in their own module with small hook lines in shared files.
- **The hard rules, enforced by the existing tests that walk LEVELS and ROOMS:**
  - no straight-line win (`npm run difficulty`: the naive beeline fails at every tested start time);
  - no bump on start (`tests/abduct-spawn.test.ts`);
  - the town pickup is hinted in the memo, EN and FR;
  - every souvenir and town pickup has a trophy slot with EN and FR text;
  - every sleeper has a Specimen Archive entry (name, age, height, weight, desc, at3, at10, EN and FR);
  - roads and bubbles pass (`tests/flight-roads.test.ts`, `scripts/pixi/check-bubbles.mjs`).
- **Headless autopilot proofs** for every room route and the flight map, plus the human-model difficulty bands from the doc, in `tests/difficulty/`.
- **Real SVG art** via `src/art-manifest.ts`, with an APPEND section per level, and always a primitive fallback.
  - Sleepers get the standard rig (head, torso, limbs; L9's art script is the model).
  - Pickups and props must read at **1× phone size (375×690 CSS px)**, at about 96–130 logical px for pickups. A person pickup is animated (blink, glance, idle beat).
  - No brand lettering. Nod names, as in L9.
- **Copy:** every string from the doc, in en.ts and fr.ts, under a `// v4 <level>` anchor. French uses *vous*, natural phrasing, and the dub wording where the doc gives it. Watch quoting: a line with an apostrophe needs double quotes.
- **Story beats:** the memo, the first-clear line, the Gazette headlines and cover stories, the loading tips if the doc lists any, and the trophy and archive texts. D (2199) also builds the three ending panels and the gnome's postcard logic if the doc puts them in the finale.

## Process
- **Your checkout.** You work in your own git worktree on your own branch. Commit there freely; never push, and never touch preprod or the main checkout. The coordinator merges the four branches in order: A, then B, C and D.
- **Shared files** (en.ts, fr.ts, the art manifest, `src/levels/levels.ts`, contracts, save `LEVEL_IDS`, the trophy data, the shared tests): append under your own anchor, keep edits small, and never reformat. That keeps the merge clean. A owns the insertion before `level3`. B, C and D append after `level9`, in that order: `level10`, `level11` and `level12` are reserved for B, C and D respectively, so use those ids.
- **Checks:** `npm run typecheck`, `npm test` (including `npm run difficulty`) and `npm run build` must all pass on your branch.

## Evidence
Real-GPU captures at 375×690 CSS px, using .claude/skills/verify-night-shift/SKILL.md:
- build with `npx vite build --mode e2e --outDir <dir>`;
- run `source ~/.local/share/claude-media-tools/env.sh` first;
- set `GALLIUM_DRIVER=d3d12` and `LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH`;
- pass Chromium `--use-angle=gl --ignore-gpu-blocklist --enable-gpu`;
- run scripts from inside the repo so `playwright` resolves.

Capture:
- the Work Order card and the memo;
- the flight map with each signature hazard in its amber, then red, state;
- each room at spawn;
- the pickup on the map;
- the report with the first-clear line;
- the trophy entries;
- a short mp4 of the signature moment.

Save them under review/<level>/ and list their absolute paths.

## Report
Your branch name and head SHA, the files changed, the test, typecheck, build and difficulty results (casual and skilled bands, beeline results), the capture paths, and anything you had to adapt from the doc.
