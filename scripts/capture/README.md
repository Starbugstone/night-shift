# Explainer capture

Scripts that film the 60 fps explainer clips and stills in `public/media/`, shown on
`public/how-its-made.html`.

## How it works

- `lib.mjs` opens the game in headless Chromium with a **virtual clock**: `requestAnimationFrame`
  and `performance.now` are replaced, so each recorded frame is exactly 1/60 s of game time,
  however slow the capture runs (about 0.5 s of real time per frame on a software rasteriser).
- Each frame is composed in the page onto a 1920×1080 canvas: the game (608×1080) on the left;
  the chapter, title, bullets, live readouts and a note on the right. Overlays are drawn over the
  game in logical 540×960 units from the live simulation (`window.__nightShift.active.debug`).
- Frames go out as JPEG via `toDataURL` and are piped to ffmpeg (libx264, CRF 23, yuv420p,
  faststart). `page.screenshot` is never used: it hangs on the WSL box this was built on.
- Input is real `page.mouse` input. The flight autopilot and the abduction pilot run in the
  page each frame, and the Node side moves the mouse to the finger they ask for.
- Time-lapse frames (`fastStep`) still run every simulation frame but skip the render, and
  are labelled in the video.

## Run

```sh
npm run build -- --mode e2e --outDir review/e2e-build
npm run preview -- --outDir review/e2e-build --port 5311 --strictPort --host 127.0.0.1 &
source ~/.local/share/claude-media-tools/env.sh       # $FFMPEG, $PLAYWRIGHT_MODULE
BASE=http://127.0.0.1:5311/ node scripts/capture/clip-01-flight-detection.mjs
VITEST_LOG=vitest.log BASE=... node scripts/capture/clip-07-beatable.mjs   # quotes a vitest run
node scripts/capture/make-page.mjs                    # FFPROBE=/path/to/ffprobe; writes the page and media README
# stills were then recompressed losslessly: ffmpeg -i x.png -c:v png -pred mixed -compression_level 9 y.png
```

Use an `e2e` preview build to enable the capture hook and avoid reloads during long runs. `DRY=1` runs a
clip without writing video. Each clip is a separate process, so several can run in parallel.

| Script | Clip |
| --- | --- |
| `clip-01-flight-detection.mjs` | Steering and the 1-second fuse (L3 cruiser) |
| `clip-02-flight-hazards.mjs` | L3/L4 flight hazards with their hit shapes |
| `clip-03-deep-shift.mjs` | A whole L3 shift by the autopilots |
| `clip-04-interiors.mjs` | Ragdoll, beam, walls, camera and backdrops (Barb's back door) |
| `clip-05-abduct-hazards.mjs` | Vacuum, laser, camera, gears, elevator |
| `clip-06-sleepers-noise.mjs` | Brenda, Tiny, Biscuit and noise falloff |
| `clip-07-beatable.mjs` | Autopilot plans vs beelines, latency, vitest proofs |
| `clip-08-progression.mjs` | Work Orders, Beam Shop, Vrell's memo, Specimen Report |

`overlays.mjs` holds the shared abduction overlays and readouts, `drive.mjs` the pilot loop,
`probe.mjs` dumps a scene's hazards or room for planning a shot,
`clips.mjs` the captions for the page.
