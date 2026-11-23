# Night Shift v2 ("Deeper Shift") — Graphics Review

**Scope:** art-direction and player-eye review of v2 at `375×690` CSS px (DPR 2, `540×960`
logical canvas): the L3 and L4 flights, all 12 deep abduction routes, the deep HUD, the choice
screen, the SPOTTED and SUNRISE moments, the Work Orders "Training" labels and the four-card
upgrade shop. Reviewed at `8dc0e71`, before any change was made. The second half of this file
("What shipped") records what was then done about it.

**Evidence:** 196 before-frames in `review/v2-fable/before/` (git-ignored): `flight-L3-*`,
`flight-L4-*`, `abduct-<route>-NN` (one every 5 s of an autopilot run of each route),
`moment-*` (failures, fuses, dawn) and `ui-*`. They were captured through `canvas.toDataURL()`
with a virtual clock (`review/v2-fable/capture.mjs`: every frame is exactly 1/60 s, hazards are
set to chosen times), so the same script gives the matching after-frames. No page errors.

## Verdict

v2 is a different game from the demo: it is hard, and what you fail on is timing. The picture
had not caught up with that. The tells that the whole design rests on were drawn the way v1 drew
decoration: thin, faint, and mostly in the HUD rather than where the thumb and the eyes are.
Several of the best jokes were hidden (the SPOTTED witness stands behind the caption card).
And the deep abduction view had lost the polish the tutorial rooms got in v1: no beam, no light,
no reactions, a specimen floating in a flat room over a field of stars.

The sprites are good and there are a lot more of them. None of this needed new mechanics. It
needed one colour language for tells, the fuse where the player is looking, a payoff for each
way of failing, and the room view brought up to the tutorial's standard.

## P1 — hazard tells that do not read at phone size

### 1. The 1-second fuse is only in the HUD, and it does not say who sees you
`hudFuse` is a 6 px cord in the top row. The saucer sits at 58 % of the screen height, under
the thumb. In `flight-L3-09-fuse-70` the only thing near the saucer that says "0.3 s left" is
the red edge tint, which says "danger" but not how much or from where. With a cruiser cone, a
porch pool and Mrs. Pruitt overlapping (`flight-L3-21-collected-sunrise`), you cannot tell which
shape to leave. **Fix:** burn the same value as a ring round the saucer; run a line from the
saucer to whatever is detecting it; turn that detector's edge red; put the seconds left in
digits on the HUD chip.

### 2. Mrs. Pruitt's pre-snap ghost cone is close to invisible
`flight-L3-03-pruitt-tell`: the ghost is a 2 px dashed outline at 55 % alpha on a 640 px cone,
for 0.45 s, over lit ground. The glint on her window is the only thing that reads, and it does
not say where she will look. This is the tell for the hazard that covers the most ground on L3.
**Fix:** fill the ghost cone, thicken and march the dashes, grow it over the 0.45 s, and draw
the swing from the current angle to the next one.

### 3. Porch lights: you learn the size of the pool by being caught in it
`flight-L3-04-porch-arming`: the amber arming arc is good. But the pool that is about to switch
on (r = 200) is not shown until it is lit, the lit pool has no clock on it (it stays 3 s), and
idle sensors are a 28 % dotted circle that reads as a scuff on the lawn. **Fix:** ghost the
pool in while the sensor arms; a countdown arc on the lit pool; a standby blink on the fixture.

### 4. The helicopter's spot is a white-out
`flight-L4-02-heli-spot`: an 85 % additive glow at r = 168 burns the ground to white, so you
cannot see the rings or roads under the most dangerous thing on L4. The beam from the
helicopter is a 26 px bar. Nothing says which way the spot is travelling, which is the only
thing you need to know. **Fix:** thin glow, a hard double edge, ticks, an arc on the leading
side taken from the spot's own motion, and a beam that widens from the helicopter to the spot.

### 5. Office-window flicker: the tell is on a 40×24 px window
`flight-L4-05-window-tell`: for 0.6 s a small window sprite flickers and a 2 px dashed ring at
50 % marks the pool. The window is often off screen while the pool is on it. **Fix:** flicker
the pool itself inside a heavy amber ring, draw the shaft from window to pool, and outline the
pool faintly while it is off so its place can be learned.

### 6. One colour for "goal" and for "camera"
Rooftop and CCTV cones are `190,255,220`: the mint of the entry rings, the beam and the
checkpoint (`flight-L4-07-plaza-cameras`). On L4 a ring and a camera cone regularly overlap.
**Fix:** a colour language, used everywhere: **mint** = you and your goals; **amber** = about
to happen; **red** = it has you now. Cameras move to a red-pink cone with a REC light.

### 7. Room lasers and gates give you no way to read the rhythm
`abduct-gary_skylight-03`, `-05`: an off laser is a 29 % teal sliver, the 0.35 s tell is a
colour blink, and "on" is a thin red bar with no glow. Nothing shows where a laser or a gate is
in its cycle, so the first three attempts at each one are spent counting. Gates and the cuckoo
are the same. **Fix:** off = a dotted sight line; tell = emitters charge and the line fattens;
on = a bar with a core and a glow; and a small dial beside every timed hazard showing how long
the gap stays open (mint, amber at the end) or shut (red).

### 8. Room cameras: the fuse is in the top-right corner
`moment-camera-watching`: the cone is 17 % amber with a 1.7 px edge until it has you; then the
only countdown is a HUD meter 400 px from the specimen. **Fix:** stronger idle cone with the
sweeping edge marked; while watching, the fuse burns round the specimen with a line to the lens.

### 9. Second sleepers do not look like people who might wake up
`moment-sleeper-noise`, `moment-fail-sleeper`: the hearing ring is 2 px at 34 %; hearing a
noise changes its alpha; waking is a sprite swap and a 19 px "!". Brenda is the reason half of
Dave's attempts fail and she does not react until it is over. **Fix:** see P2 #13.

## P2 — juice and comedy that is missing or hidden

### 10. SPOTTED hides its own joke
`flight-L3-11-spotted-mid`: the "polaroid" is an empty frame over the live scene, the witness's
head is behind the caption card (an arm and a bubble stick out), and the same pyjama neighbour
shouts "UNIT 4, UFO!" for a police car, a dog and a helicopter. **Fix:** take the actual frame
as a flash photo; show it through the lens of whatever saw you; a witness per cause.

### 11. The checkpoint respawn is a blink
`flight-L3-13-respawn`: the saucer reappears flashing at 12 Hz, which reads as a glitch. The
1.6 s of safety is not shown. **Fix:** beam in, a shield bubble with a countdown arc, a tag.

### 12. Sunrise is a flat orange fill
`flight-L3-21-collected-sunrise`: 22 % orange over everything. It works as a warning and has no
direction, no sky and no life. In a room nothing changes but the edge tint. **Fix:** low light
from one side, longer shadows, bedroom lights coming on, birds; in rooms the sky outside and the
light at the exit warm up.

### 13. Nobody reacts
Deep specimens wake with a head swap. Second sleepers are covered in #9. Bonks have stars but
no puff, ring or squash (the tutorial view has all three). The failure card is a rounded box
with the name of a laser on it (`moment-fail-laser`). **Fix:** stir / start / bolt-upright
stages for sleepers with a line each; the tutorial's bonk and wake moments in the deep view; a
failure card that slams down with the culprit on it, and a beacon for alarms.

### 14. Delivered specimens are three hollow circles
The target chips (`flight-L3-01-start-banner`) are a circle and a name. Coming back from an
abduction, nothing celebrates; in a room there is no count at all. **Fix:** mugshots that get
stamped, a "2 of 3" banner on return, pips in the room HUD, the count on the choice screen.

### 15. The deep room view lost the v1 polish
`abduct-dave_roof-00`…`-11`: no beam (a dashed line and an oval), no light sources, no vignette,
the sleep-talk bubble has no tail, and below the ground floor
there is a field of stars (`moment-laser-off`): the house floats in space. **Fix:** a beam
column with motes, light pools from everything that glows (and swinging pools from swinging
lamps), a night wash so hazards and people are the brightest things in the room, ground and a
skyline outside.

## P3 — atmosphere

16. **The big maps are empty.** `flight-L3-18-quiet-street`: four houses, two trees, nothing
    moving. L4 between hazards is tiles and roofs. Town life is in the brief and it is where the
    game can be funny for free.
17. **Work Orders:** the "TRAINING" tag is 12 px mint on 14 % mint; a deep shift card looks the
    same as a training card apart from a small red tag (`ui-workorders`). **Shop:** nothing says
    which phase an upgrade works in (`ui-upgrades`); buying has no payoff. **Choice screen:** the
    lower half of the card is empty and "Sunrise in 4:58 of shift time · 0/3 collected" is a
    sentence where a bar and three faces would do (`ui-choice-sleeper`).
18. **The sunrise report** arrives through a 160 ms fade to navy. The sun should come up.
19. **Fallback art:** the watch dog is a code-drawn silhouette, the cuckoo is two ellipses and a
    triangle in an amber box, and `bg_stairwell` has a painted bannister the renderer crops
    around (so the stairwell wall is a 150 px slice stretched to 650).

## What is already good (leave it)

- The v2 sprite set: houses, civic roofs, the six new specimens, Brenda, Tiny and Biscuit.
  One outline weight and palette with v1.
- The amber arming arc on porch lights, the bark ring, the cruiser's light-bar disc.
- The memo, the report card and its stamps; the deep report rows.
- Zib's lines and the per-cause captions. The writing is ahead of the picture.
- Spatial placement after the Neon fixes: nothing in this review moves anything.

## Frame cost of the build as reviewed

A section profile shows a frame is nearly all fill and vector replay: the flight scene draws
the ground tile, roads, every visible house and car as SVG images each frame (the browser
replays an SVG image as vectors on every `drawImage`), plus two full-screen passes (night wash,
vignette). Per-frame allocations in the render path: `setLineDash([..])` literals, `rgba()`
strings built with `toFixed`, array literals in the gag and wire loops, `measureText` for the
three target chips and both ring labels, a template string for the fuse caption.

## Plan

1. One tell language (mint / amber / red) and the fuse on the saucer and on the specimen.
2. Each flight detector's tell rebuilt on its honest shape (cones, porch, Pruitt, helicopter,
   windows, cameras). Detectors are read from the sampled `HazardField`; nothing moves.
3. SPOTTED as "Exhibit A"; respawn; sunrise; counters.
4. The deep room view: beam, light, tells with dials, sleepers, reactions, failure card, ground.
5. Town life; menus; the three art requests.
6. Performance: sprite bitmaps, cached HUD layers, no per-frame allocation; measure before/after.

---

# What shipped

No gameplay number, collider, detector shape, route or timing was changed. `src/abduct/simulation.ts`,
`autopilot.ts`, `interior.ts`, `rooms/**`, `src/flight/hazards.ts`, `deep-sim.ts` and the level
data are untouched. Every animated effect checks `ctx.reducedMotion`. The 207 after-frames are in
`review/v2-fable/after/` (the same names as the before-frames, plus the new moments: a SPOTTED
per witness, the delivered banner, the helicopter fuse); 57 more with reduced motion are in
`review/v2-fable/after-reduced-motion/`. No page errors in any capture run.

## Tells (review #1–#9)

**One language** (also written into `AGENTS.md`): mint = you and your goals; amber = about to
happen; red = it has you now. A detector always has a hard edge; decor never draws an edged pool.

**The fuse, where you are looking** — `src/flight/deep-scene.ts` `drawFuseRing`, `src/ui/hud.ts`
- A ring round the saucer burns down with the suspicion value (red while exposed, amber while
  it cools), with a spark at the burning end. Same value as the HUD fuse; it replaces nothing.
- A red dashed line runs from the saucer to whoever is looking, with a ring on the source. The
  detector that has you draws its edge red and thick (cones also get a red wash), so with three
  shapes overlapping you can see which one to leave.
- A red snap ring the instant you are first seen.
- HUD fuse: a thicker cord with an ember trail, a crackling spark, the chip floods red, and the
  seconds left in digits ("0.3 s"; table lookup, no string per frame). It reads SEEN! / COOLING… /
  SUSPICION.

**Flight detectors** — `src/flight/deep-scene.ts`, `src/flight/draw-common.ts`
- *Cones* (`ConeSprites.draw`): heavier edge, the edge it is sweeping towards drawn thicker
  (direction taken from the last two sampled angles, so it follows whatever the hazard does),
  red when hot. The tutorial flights get the same edge.
- *Mrs. Pruitt:* the next cone is filled amber and grows over the 0.45 s, with marching 4 px
  dashes, an arc with an arrowhead from where she is looking to where she will look, a "!" and a
  pupil that turns to the new direction.
- *Porch lights:* the pool about to light is ghosted in as the sensor arms; the lit pool carries
  an arc that runs down its 3 s; the fixture blinks in standby; a ring snaps out to the pool's
  edge on the click.
- *Helicopter:* thin glow so the ground still reads, a dark-and-white double edge on the hit
  circle, four ticks, two amber arcs on the side it is moving towards (from its measured
  motion), a beam that widens from the helicopter down to the spot, a blurred rotor disc.
- *Office windows:* off = faint dotted outline of the pool; tell = the pool itself flickers
  inside a marching amber ring with the shaft of light from the window; on = hard-edged pool,
  shaft, and a figure at the window.
- *Cameras:* red-pink cones (no longer goal mint), a scan line running out along the cone, a
  REC light.
- *Dogs:* the bark's full reach is outlined, so the pulse can be timed; red when it has you.

**Room hazards** — `src/abduct/deep-view.ts`
- *Dials:* every laser, gate, shutter, door and the cuckoo has a small dial beside it: how long
  the gap stays open (mint, amber for the last moments) or how long until it opens (red). It is
  computed from the hazard's own cycle, the same arithmetic the simulation uses.
- *Lasers:* off = a dotted mint sight line; tell = the emitters charge and the line flickers
  amber and fattens over the 0.35 s; on = a red bar with a white core, a glow and beads of
  light. The bar drawn is the bar that trips the alarm.
- *Cameras:* a stronger cone with the sweeping edge marked, lens glint and REC light; red and
  thick once it has the specimen. While it does, the 1 s fuse burns as a ring round the specimen
  with a line to the lens (the HUD meter stays, now labelled ON CAMERA!).
- *Gates:* hazard stripes on the closing edge, the doorway flashes amber before it moves.
- *Fans:* the disc the blades sweep is tinted, so their reach reads at any angle.
- *Second sleepers:* the hearing ring is a visible dashed ring with a faint fill that turns
  amber, then red; a small gauge over the sleeper's head mirrors their HUD meter.

## Juice and comedy (review #10–#14)

**SPOTTED = Exhibit A** — `src/flight/spotted.ts`
- The frame that got you is copied off the canvas (once, into a reused 720×480 canvas), zoomed
  on the saucer, washed out and burnt in the middle like a flash photo, and dropped on screen as
  a polaroid. A red marker circles the saucer as you watch, then "?!".
- It is seen through the witness's own lens: police and patrol dashcams (REC, dashboard, wheel),
  a taxi dashcam (air freshener, fare meter), Mrs. Pruitt's binoculars (two overlapping
  circles), a doorbell camera (fisheye, "MOTION AT YOUR DOOR"), CCTV (scan lines, brackets,
  CAM 03), the helicopter's gun camera (crosshair, "TARGET: UNCLEAR"), a phone held upright at
  an office window (pillarbox, LIVE, hearts), and a dog ("photo taken by a dog": mostly nose).
- A witness for each: a police officer, a taxi driver, Mrs. Pruitt in curlers behind her
  binoculars, a pilot, an office worker on the fourth coffee, a camera on its bracket, a dog,
  and the pyjama neighbour for porch lights. They pop up over the caption card, where they can
  be seen, with the shout in a bubble. The existing captions and Zib lines are used as they were.
- The flash goes off over everything; a bar under Zib's line shows the time to the respawn.

**Checkpoint respawn** — a column of beam light, two rings, sparkles falling in on the saucer,
a CHECKPOINT tag, and a shield bubble whose arc runs down the 1.6 s of safety (it replaces the
12 Hz blink). The checkpoint itself has a small flag on the map.

**Sunrise** — flight: the night wash thins, warm light comes in low from one side (a cached
wash), shadows lengthen, street lamps fade, bedroom lights come on house by house, the first
birds cross the screen; the clock chip floods warm with sun rays. Rooms: the sky outside, the
light at the exit and a wash over the room warm up. When the sun does come up, the scene whites
out to daylight into the report (`SceneManager` `sunrise` transition).

**Delivered-specimen counters** — the three target chips are mugshots that get a tick; back
from an abduction a "SPECIMEN SECURED · 2 of 3" banner lands with the new pip; the collected
building occasionally says something worried ("Dave? DAVE?"); the room HUD's divider is three
pips; the choice screen shows the three faces and the night as a bar running out towards a sun.

**Wake reactions** — second sleepers stir with a "?" and a hop when a noise reaches them, toss
and show "?!" once their meter is high, and bolt upright with a squash, a red burst and a line
when it fills ("DAVE?! Who is THAT?", "NOT ON THE LIST!", "WOOF! WOOF! WOOF!"). Specimens get the
tutorial's "!" burst, sweat and red ring, and a twitching ". . ." when one more knock will do it.

**A failure moment per cause** — the failure card slams down like a stamp with the culprit on
it (the sleeper's awake sprite, the specimen's awake head, a camera, a klaxon); alarms sweep a
red beacon round the room. Bonks in deep rooms get the tutorial's stars, ring, dust and squash.
Dogs say WOOF!, plates say CRASH!, stairs say creeeak.

## Atmosphere (review #15, #16)

**Rooms** — a beam column with rising motes; light pools from televisions (flickering), fires,
monitor banks, the DJ booth, desks, fish tanks and the exit's moonlight; every swinging lamp
carries its pool with it; the disco ball throws six spots of colour round the dance floor. A
night wash goes under the hazards and people, so they are the brightest things in the room.
Outside there is sky above the ground line and earth below it, with far rooftops. Small things
move: TV static, the "motion" frame hopping between Gary's monitors, the booth's level meters,
a fish, the water cooler's glug, the vacuum's light, the cuckoo's little house rattling.

**Town life** — `src/flight/ambient.ts`, laid out once from the map, culled to the view:
cats that walk round houses and stop to stare at the saucer ("?"), moths at every lamp,
fireflies in the gardens, televisions flickering in windows, chimney smoke, pool glints,
yesterday's paper blowing down the main road, steam off the city's grates, red beacons on the
tall roofs.

## Menus (review #17, #18)

- **Work Orders:** TRAINING is a pill with a learner plate; deep shifts get a hot spine, three
  mugshots (one per specimen) and a small sun by "Sunrise in 5:00".
- **Shop:** each card says where it works (IN FLIGHT / IN THE ROOM / FLIGHT + ROOM); what you
  can afford bobs; buying throws stars off the button, slams the INSTALLED stamp and counts the
  purse down.
- **Choice screen:** the three faces (collected ones ticked, the one that just failed ringed in
  red), the night as a bar, a red flash on arrival.

## Art (requests from Sol)

- `public/art/room/watch_dog.svg` (89×62): a guard dog mid-trot, facing right (the renderer
  flips it), sleepy eye, red collar. It now also bobs as it trots.
- `public/art/room/cuckoo_bird.svg` (86×44): a furious cuckoo facing left on a scissor arm; the
  beak leads at the collider's left edge and the arm is revealed as it extends.
- `public/art/room/bg_stairwell.svg`: the bannister is gone, replaced by a plain wainscot and
  dado rail; the renderer's 150 px crop for this backdrop is removed.
- Keys added to the "APPEND: abduction code (Sol)" section of `src/art-manifest.ts`; contact
  sheet regenerated (`node scripts/contact-sheet.mjs`: 252 sprites, 0 missing).

## Performance work

- `src/core/fx.ts` `bitmapOf` / `drawSprite`: an SVG sprite is rasterised once per draw size and
  blitted after that, at the backing store's own scale (`setBitmapScale`, set by the canvas host
  on resize), so an unrotated sprite copies pixel for pixel. Used for the ground and road tiles,
  every prop, car, hazard sprite and the saucer in flight, and for room backdrops (one bitmap
  per backdrop, tiles cut from it) and furniture.
- The flight camera sits on whole device pixels; ground and road tiles are drawn unsmoothed.
- Cached layers: the minimap's panel and roads; the three specimen chips (repainted only when
  one is collected).
- No allocation per frame in the paths touched: dash patterns and colours are constants, the
  `toFixed` colour strings became `globalAlpha`, array-literal loops are unrolled, ring labels,
  chip widths, the banner and the fuse caption are measured or built once, sweep direction and
  spot velocity live in typed arrays. The SPOTTED photo is one canvas, allocated the first time.
- Culling: target shadows and the new per-hazard draws are culled to the view; the ambient
  layer culls every item.

## Frame cost

Measured with `review/v2-fable/perf.mjs` in headless Chromium at 375×690 CSS px, DPR 2, on this
dev box, against a static build of `8dc0e71` ("before") and of the working tree ("after"),
alternating before / after / before / after. Each scene is put in a fixed state with the game
loop on a virtual clock; a sample is one whole game frame (input, update, render) plus a forced
raster flush, 120 frames per run. **Headless Chromium rasterises on the CPU here**, so the
absolute numbers are far worse than a phone GPU and only the ratio means anything. One thing
this found: for the first hundred or so readbacks Chromium keeps the canvas on its emulated-GPU
path and every frame costs about 3x more, in both builds; the script now burns that in before
it measures, which is why these baselines are lower than a naive first run.

Median frame, ms (mean of two runs; p95 in brackets):

| Scene | before | after | change | after, sprite cache off |
|---|---|---|---|---|
| L3 flight: Dave's, Mrs. Pruitt, dog | 35.9 (40.0) | 42.5 (47.9) | **+18 %** | 39.8 |
| L3 flight: Gary's (camera, yard lights) | 33.7 (37.9) | 40.8 (45.0) | **+21 %** | 38.4 |
| L3 flight: junction, seen by the cruiser | 33.9 (36.7) | 38.6 (43.5) | **+14 %** | 37.4 |
| L4 flight: plaza cameras | 27.0 (29.0) | 18.4 (21.4) | **−32 %** | 30.0 |
| L4 flight: Market St traffic, helicopter | 27.8 (29.6) | 19.7 (22.4) | **−29 %** | 31.4 |
| L4 flight: museum, ring road | 28.1 (32.3) | 17.8 (20.4) | **−37 %** | 30.0 |
| Room `dave_roof`, bedroom | 17.7 (20.3) | 19.7 (20.9) | +11 % | 27.3 |
| Room `gary_garagedoor`, workshop (camera) | 17.1 (19.5) | 22.2 (24.6) | **+30 %** | 27.9 |
| Room `mayor_clocktower`, tower | 17.7 (18.9) | 17.9 (20.0) | +1 % | 26.3 |
| Room `kev_vent`, dance floor | 14.7 (16.1) | 17.1 (18.8) | +16 % | 24.4 |
| Room `nigel_skylight`, dinosaur hall | 15.3 (16.5) | 15.7 (17.1) | +3 % | 23.9 |

Mean frame under 4x CPU throttle (one run each, 60 frames), ms:

| Scene | before | after | change |
|---|---|---|---|
| L3 flight: Dave's / Gary's / junction | 134 / 129 / 127 | 127 / 127 / 120 | −5 % / −1 % / −6 % |
| L4 flight: plaza / Market St / museum | 108 / 115 / 110 | 68 / 71 / 65 | −37 % / −38 % / −41 % |
| Rooms: dave_roof / gary_garagedoor / mayor_clocktower / kev_vent / nigel_skylight | 74 / 72 / 73 / 64 / 63 | 78 / 86 / 68 / 69 / 63 | +6 % / +20 % / −6 % / +8 % / 0 % |

What this says:

- **L4, the biggest map, is about a third cheaper** than it was, with everything above added.
  The city ground tile, the highrises and the cars are the dearest art to replay as vectors, and
  they are bitmaps now.
- **L3 is 14–21 % dearer unthrottled** (and level under throttle). A section profile
  (`review/v2-fable/profile.mjs`) puts the extra in fill: the town-life lights (about 2.5 ms),
  the porch pools and rings, the bigger HUD fuse and the fuse ring. The suburb's art is simple,
  so the sprite cache gains nothing there in this renderer (cache off: 38–40 ms). Two of the
  three L3 scenes are also measured inside the checkpoint shield bubble, which is on screen for
  1.6 s after a respawn and not otherwise.
- **Rooms are 1–30 % dearer** (mean +12 %). The new lighting, beam column, tells and night wash
  cost about 10 ms in this renderer; the backdrop and furniture bitmaps give back 7–8 ms of it
  (cache off: 24–28 ms). The dearest room is the one with a camera cone and three light pools on
  screen at once.
- A CPU rasteriser charges by the pixel filled; a phone GPU mostly does not, and charges instead
  for the vector paths that the sprite cache removes. These ratios will not carry over to a
  phone, and **none of this has been measured on a real device**.
- No steady per-frame allocation was added. Two things allocate once per event: the SPOTTED
  photo grab (one `getTransform`) and the failure card (one corner-radius array per frame for
  its 0.85 s). Script time was not measured separately in this pass.

## Proof

- `npm run typecheck`, `npm test` (12 files, 177 tests) and `npm run build` are green.
- **e2e bot** (`scripts/e2e-playthrough.cjs`, real pointer input, static preview build of the
  final tree, 375×690, DSF 1), run twice; second run:
  - *Tutorials:* all four routes (L1 window and chimney, L2 skylight and loading door) flown,
    abducted and delivered to the report; L1 and L2 at three stars. No page errors.
  - *L3 deep shift:* Gary, Barb and Dave all delivered (never spotted), the shift ends on the
    report with `level3.delivered = true`, 291 s of the 300 s night used. No page errors.
    Screenshots in `review/v2-fable/e2e-final/`.
  - In both runs the bot's **first attempt at Dave's roof-hatch route woke Dave** (one failed
    abduction), and its retry from the choice screen delivered him. To see whether the new
    rendering was the cause, the same route was run on its own (`ONLY=probe ROOM=dave_roof`)
    against an untouched build of `HEAD` (`2be36f6`, from `git archive`) and against the final
    tree, twice each: `HEAD` failed one run in two, and so did the final tree. So it is a flake of that
    route under real-mouse latency that was already there, not something this pass added. It is
    the abduction owner's to tune (the attic bulb and trophy shelf leave little margin).
- Capture runs (`review/v2-fable/capture.mjs`: 207 frames, and 57 with reduced motion) drive
  every screen in this review, every route to delivery and each failure; none logged a page
  error.

## Housekeeping

- `AGENTS.md`: two additive notes under "Shared rendering helpers" (`drawSprite` / `drawWash`,
  and the tell colour language).
- New files: `src/flight/ambient.ts`, `src/flight/spotted.ts`. `src/abduct/deep-view.ts` exports
  `deepShift` (dawn level and specimens aboard, set by `src/ui/deep-abduct.ts`) and
  `drawFailure` takes an optional `assets`.
- `review/v2-fable/`: `capture.mjs` (before/after frames), `perf.mjs`, `profile.mjs`,
  `series.mjs`.

## Remaining ideas (not done)

- **Measure on a real phone.** Everything above is a software rasteriser. If L3 needs the fill
  back, the cheapest cuts are the town-life lights (`Ambient.drawLights`), the idle dotted sensor
  rings and the room light-pool radii. (A bitmap for the dotted rings was tried and was 4x dearer
  than the dashed stroke here, so it was taken out.)
- **A cached static world layer for flight** (ground, roads, props and their shadows painted once
  into chunks, blitted after that) is the next big lever on a GPU: it would replace the per-frame
  tile, road, shadow and prop draws with about six blits. In this renderer a full-screen blit costs as much as the vector ground,
  so it could not be shown to pay here and was left out.
- **Exhibit A on the tutorial levels.** L1 and L2 still use the old SPOTTED screen with the
  pyjama witness; the photo and the per-cause witnesses are only on the deep shifts.
- **Witnesses and cats are code-drawn.** They match the outline and palette, but sprites from
  Astra would be better, as would a third "stirring" pose for Brenda, Tiny and Biscuit (they
  currently hop and toss in their asleep pose).
- **Sound for the new moments:** a shutter click on Exhibit A, a tick on the dials in their last
  second, a rooster at sunrise. `src/audio` was not touched in this pass.
- Gates are still code-drawn slats although `room/cargo_shutter`, `room/garage_door` and
  `room/swing_door` sprites exist; laser emitters on horizontal lasers are the vertical sprite
  rotated. Draft and creak zones are still plain dashed boxes.
- Chimney smoke only rises from house sprites `a` and `c` (the chimney position is estimated
  from the art); `docs/ART_ANCHORS.md` could carry chimney anchors for all houses.
- The deep report could show the three mugshots in the "Specimens delivered" row, and the
  sunrise report could keep the warm sky behind the card.
- Reduced motion was checked from captures of the L3 flight and one route, not played through.
- The 60 fps explainer clips of the new tells (fuse ring, ghost cone, dials, Exhibit A) have not
  been made; `review/v2-fable/capture.mjs` already steps the game on a virtual clock, which is
  the method those need.
- Still no rendering test in CI. `capture.mjs` renders every screen and reports page errors; a
  cut-down version of it would catch draw-time exceptions.
