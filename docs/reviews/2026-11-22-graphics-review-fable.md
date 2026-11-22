# Night Shift — Graphics Review

**Scope:** art-direction and player-eye review of every screen at `375×690` CSS px
(DPR 2, `540×960` logical canvas): the 72 SVG sprites, the code-drawn parts (UI
panels, beam, HUD, flight hazards, fallbacks), readability, palette, character
appeal, motion/juice and frame cost. Written before any change was made.

**Evidence:** 57 before-screenshots in `review/fable/before/` (git-ignored) —
`ui-*`, `flight-L1-*`, `flight-L2-*`, `room-<id>-*`. Captured through
`canvas.toDataURL()` with no console errors.

## Verdict

The sprite set is good: one outline weight, one palette, readable silhouettes,
real charm in the humans, the cat and the two portraits. What lets the game down
is everything drawn **around** the sprites. The code-drawn layer is flat and
comes in three unrelated styles, light sources do not light anything, and almost
no event in the game has a visual response. It reads as a well-illustrated
prototype rather than a finished game. Nothing here needs new gameplay; it needs
lighting, feedback and one consistent UI skin.

## P1 — clearly hurts the look or the read

### 1. The tractor beam, the star of the game, is the weakest thing on screen
`src/abduct/draw.ts` `beam()` fills one flat 14 %-alpha wedge with a 1.5 px
outline and scatters 2 px squares in it. It is dimmer than the wallpaper, has no
core, no glow at the emitter and no pool where it lands, and it does not react
to being dragged. The emitter is a grey ellipse. See `room-farm_window-01-start`,
`room-laundry_loading-02-lift`. **Fix:** additive gradient beam (bright core,
soft edge, cached gradients), a glow pool on the specimen, a brighter beam while
dragging, round rising motes, and a proper saucer underside for the emitter.

### 2. Light sources are decoration — rooms are evenly lit and flat
The bedside lamp, the moonlit window, the skylight and the fireplace emit
nothing. The backdrops carry a faint moonlight shaft and that is all. No
vignette, no contact shadow under the specimen, so the ragdoll looks pasted on.
Flight has warm lamp pools but buildings, trees and vehicles cast no shadow, so
the map reads as stickers on a table. See `room-farm_window-03-mid`,
`room-laundry_skylight-01-start`, `flight-L1-03-target`. **Fix:** per-room light
pools (lamp amber, window/skylight moonlight, ember glow) as additive cached
gradients; a cached vignette on both phases; a soft ground shadow under the
specimen and under flight props; a mint under-glow from the saucer.

### 3. Entry rings point at art that is not there (carried over from the spatial review)
The Window ring sits on a blank west wall of `farmhouse_top`; the Skylight ring
sits on the laundromat's washer logo and the Loading-door ring floats off its
north wall. `exit_window` paints a closed four-pane sash and code paints a hole
over it. See `flight-L1-04-locking-progress`, `flight-L2-04-locking-progress`,
`room-farm_window-01-start`. **Fix:** add the lit west window, the skylight and
the loading dock to the roof art; redraw the window with its lower sash raised;
drop the code overlay.

### 4. Three UI skins in one game
Menus use rounded indigo panels with an ink outline and a drop shadow. The
flight HUD uses translucent rounded pills. The abduction HUD is a flat
full-width strip with square-cornered monospace digits, a different ink, a
different mint (`#8effce` vs `#7CFFCB`) and unshadowed buttons. The tutorial
prompt is a solid mint pill in flight and a hollow dark box in the room. See
`flight-L1-01-start` next to `room-farm_window-01-start`. **Fix:** one HUD kit
(pill panels, same fonts, same mint, icon + label + meter) used by both phases.

### 5. Nothing happens when something happens
Bonks, the wake-up, the cat, lock-on, delivery, stars and the stamp have sound
and (sometimes) a shake but no picture: no impact stars, no "!" on waking, no
flash or sparkle as the specimen leaves, no burst when a star lands, no ink puff
under the stamp. The lock-on is a circle that changes alpha. The delivery slurp
is a shrink. See `room-farm_window-06-bonk-mumble`, `-07-awake`, `-05-slurp`,
`flight-L1-05-locked`, `ui-07a-report-stars`. **Fix:** one pooled particle system
(fixed arrays, capped) and a handful of authored moments: bonk stars, wake "!"
and red pulse, lock-on ring burst, delivery flash + sparkles, star bursts, stamp
slam with ink puff, glorb count tick.

## P2 — noticeable

### 6. The reticle and the exit marker are too small to steer by
The beam cursor is a 13 px ring in near-transparent mint; under a thumb and
over a red long-john it disappears (`room-farm_window-02-lift`). The exit is a
2 px dotted box with a small chevron. **Fix:** a larger animated reticle with
ticks that grows while dragging, and a breathing mint glow plus bouncing
chevrons at the exit that intensify when the specimen is close.

### 7. Sleeping humans are static
Doyle "snores like a chainsaw" but his chest never moves; the dream bubble and
the Zzz pop in with no easing; the mumble bubble has no tail and floats
unattached. The awake head swap is the only expression. **Fix:** breathing
(torso scale on the snore clock), bubble pop-in with squash, a tail on speech,
Zzz that drift and scale, sweat drops and a "!" while awake.

### 8. The room below the floor line is dead space
Roughly 115 px (12 % of the screen) under the floor is an empty dark band in all
four rooms, and the top 106 px is a flat slab. The play space feels boxed in.
**Fix:** let the HUD float as pills over the room, use the bottom band for the
prompt/hint line and a subtle floor fade.

### 9. Flight ground is uniform and the farm road is rectangles
`ground_farm` is low-contrast by design, but with no shadows or vignette the
farm is a dark-green void with brick-coloured field blocks. The dirt road is
five `fillRect`s with hard edges and a visible grid at the junction. Headlight
cones are a hard-edged triangle. **Fix:** dirt-road sprites, prop shadows,
vignette, softer cone edge with a bright source, moonlight tint.

### 10. Title and report leave their best real estate empty
The title's middle third is a small code-drawn saucer over a featureless
skyline; the report card has a 150 px blank band between the stars and Vrell
until the last 0.5 s. Work-order cards are text only although two charming head
sprites exist. **Fix:** title: moon glow, drifting cloud bands, a beam with
depth and a dangling specimen silhouette; cards: specimen mugshot; report:
tighter stagger and bursts so the card always has something landing.

### 11. Scene changes are a 160 ms fade to navy
Fine for menus, flat for the two moments that matter: locking on (top-down →
room) and delivery (room → report). **Fix:** a mint iris/beam wipe for
flight → room and a white-mint flash out of the room.

## P3 — polish

12. The dog only scales 3 %; no ear twitch, no tail. The cat never moves until it
    yowls. Laundromat washers never spin; the fireplace has no flicker.
13. Vrell's portrait is one expression for memo, report, abort and success. A
    blink and a per-context eyebrow/mood mark would sell the deadpan.
14. The neon "EAT" sign is a code-drawn label with a flat pink disc; it should
    buzz (per-letter flicker) when it is on.
15. Button highlight strip is the only depth cue in menus; panels would benefit
    from a 1 px inner top highlight. Timer uses `monospace` in the room and the
    system stack in flight.
16. Power-line wires are near-black on dark asphalt: correct but hard to see
    before the first bonk. A thin moonlit highlight would help.
17. `field_rows` reads as brick red next to the red barn; acceptable, left alone.

## What is already good (leave it)

- Sprite cohesion: outline, palette and highlight direction are consistent
  across all 72 files; no file exceeds its size budget.
- Doyle, Larry, the cat, Zib and Vrell have real appeal; the awake heads are
  funny. The pyjama witness on SPOTTED! lands.
- The saucer's squash while flying and its speed streaks.
- Text fit and touch targets (verified by the spatial review, still true).

## Frame cost of the current build

Nothing heavy: SVG sprites are rasterised by the browser once per size, flight
gradients are cached, the room draws ~20 sprites and 32 `fillRect` particles.
One avoidable cost: `workorders.ts` builds a `createLinearGradient` every frame,
and `flight` builds a dash array and several `rgba()` strings per frame.

## Upgrade plan

Budget rule for everything below: gradients and vignettes are built once and
cached; particles live in one fixed pool (no allocation per spawn); every
animated effect checks `ctx.reducedMotion`; no gameplay geometry moves.

1. **Art (must-do):** `farmhouse_top` west bedroom window; `laundromat_top`
   skylight + north loading dock (washer logo and HVAC moved out of the way);
   `flight/dirt_road_h|v` + manifest; `exit_window` with the sash raised and the
   code overlay removed.
2. **Shared FX module** (`src/core/fx.ts`): pooled particles, cached radial
   glows, cached vignette, easing helpers.
3. **Abduction rendering:** glowing beam and emitter, room light pools, vignette,
   specimen shadow, exit glow, bigger reticle, breathing/snore animation, bubble
   pop-ins with tails, bonk stars, wake "!" pulse, cat/fire/washer idle motion,
   delivery flash and sparkles.
4. **One HUD kit** shared by flight and abduction (pill panels, icons, same type).
5. **Flight rendering:** prop/vehicle shadows, vignette, softer headlights,
   saucer under-glow, ring lock-on burst, dog ear twitch, neon buzz, moonlit
   wire highlight.
6. **Menus:** title scene depth, work-order mugshots, report bursts and stamp
   slam, Vrell blink, panel highlights, cached header gradient.
7. **Transitions:** iris wipe into the room, flash out of it.

---

# What shipped

Two passes. Pass 1 is commit `2d9b6aa`; pass 2 is the working tree that followed it. No
gameplay geometry moved in either (ring positions, colliders, routes, par times and manifest
sprite sizes are untouched), there are no new runtime dependencies, and every animated effect
checks `ctx.reducedMotion`.

After-screenshots for pass 2 are in `review/fable/after2/` (git-ignored): `ui-*`,
`flight-L1-*`, `flight-L2-*`, `room-<id>-*`, and three `reduced-motion-*` captures.

## Pass 1 (review items 1–3, 6, 9)

- **Art:** lit west bedroom window on `farmhouse_top`; skylight and north loading dock on
  `laundromat_top`; `exit_window` redrawn with the sash raised (code overlay removed);
  `flight/dirt_road_h|v` sprites for farm roads.
- **Beam:** additive two-pass beam with a bright core, a glow pool on the specimen and at the
  emitter, rising motes, brighter while dragging.
- **Room lighting:** lamp, fireplace (flickering) and exit-moonlight pools; soft floor shadow
  under the specimen; cached vignette on both phases.
- **Readability:** larger spinning reticle with ticks; pulsing exit zone with a chevron.

## Pass 2 (review items 4, 5, 7, 8, 10–16)

### One FX module — `src/core/fx.ts`
- `Particles`: one fixed pool per scene (typed arrays, oldest slot recycled, zero allocation
  per spawn or per frame). Five kinds: star, puff, spark, ring, twinkle; optional homing.
- `radialSprite` / `lightSprite` / `drawGlow`: radial gradients baked once into small canvases.
  All big per-frame radial-gradient fills (room light pools, beam glow, street lamps, neon
  glow) are now bitmap blits.
- `drawShadow`: soft drop shadow from a sprite's own silhouette (tinted quarter-res copy).
- `CachedLayer`: static full-screen art painted once and blitted 1:1 (used for room backdrops).
- `drawEdgeTint`, easing helpers (`easeOutBack` with overshoot, `easeInCubic`, `bump`).

### One HUD kit — `src/ui/hud.ts` (review #4)
- `hudPanel`, `hudMeter` (icon badge + label + bar with warn/danger ticks, gloss, flash,
  jitter and red outline when hot), `hudTimer` (digits in fixed cells), `hudButton` (vector
  icon + caps label), `hudPrompt` (mint tutorial pill with a finger glyph).
- Flight (`QUIT · SUSPICION · TIME`) and abduction (`WAKE · TIME · RESTART`) sit on the same
  row (`HUD_ROW`), same indigo panels, ink outline, drop shadow and top highlight as the menu
  panels, same mint (`#7CFFCB`), same type. Hit areas: quit 64×62 at (14,16); restart 104×62
  at (422,16).
- The flat HUD slab over the room is gone: the top band now shows the night sky, the roof slab
  and the **saucer parked over the roof** (hull, chasing rim lights, beam nozzle) with the HUD
  floating on it (review #8, top half).

### Authored moments (review #5)
- **Bonk:** amber stars, dust puffs, sparks and an impact ring *at the contact point* (the
  ragdoll now records where each solid was hit), a tiny squash on the specimen, a flash on the
  Wake bar. Power-line bumps in flight get stars and sparks too.
- **Wake-up:** a red "!" burst pops over the head, red ring and sparks, sweat drops while awake,
  the Wake meter flashes white then goes red with a jittering outline, a red pulse round the
  screen edge. The cat's yowl gets its own red stars.
- **Lock-on:** two expanding rings, sixteen mint sparks and white twinkles; the entry ring
  **snaps** tight round the saucer (overshoot) and spins up; the progress arc gets a track and a
  glowing head; the rim lights race; the view dives in (24 % zoom) with a mint edge glow.
- **Delivery:** rings at the exit, a swarm of twinkles that home into it, a bloom of beam light,
  then a pale-mint flash that carries into the report.
- **Specimen Report:** the stamp falls from 2.6×, lands at 0.88× and overshoots back, throwing
  an ink ring, ink sparks and paper dust from under it, with a short shake; each earned star
  spins in with a ring, star burst and twinkles; "NEW!" is a red badge that pops; Glorbs count
  up in their own pill with a click and a coin hop per tick and a twinkle burst at the total.
- Reduced motion: no shake, squash, zoom or sparks — rings and a couple of stars only.

### Flight details (review #9, #12, #14, #16)
- Soft silhouette shadows under buildings, trees, bales, the tractor and vehicles, thrown
  down-right from the top-left moon; the saucer's own shadow is a soft blob that drifts as it bobs.
- Headlight cones are feathered sprites (full strength inside ~80 % of the real cone, fading
  out just past its edge, so what looks lit is what gets you spotted) with a bright lamp glow.
- Dog: breathing, and an ear that twitches every few seconds (flaps while barking).
- Neon sign: tube-style letters with a glow each, one letter buzzing; the whole sign still
  drops out exactly with the hazard (`neonOn`).
- Saucer: hover bob (lift + scale), light chase round the ten rim pads, mint glow on the ground.
- Power lines: a thin moonlit edge so wires read before the first bonk.

### Abduction details (review #7)
- Snore breathing: the torso sprite swells with each snore; quick panting once awake. The cat
  breathes too.
- Sleep-talk bubble pops in with a tail aimed at the head; the dream bubble has a thought
  trail to the head, bobs, and pops when the dream changes; Zzz swells as it drifts.
- The exit glows and its chevrons climb faster as the specimen gets close.

### Screens (review #10, #13, #15)
- **Title:** moon halo, drifting cloud bands, a shooting star, an additive beam with a pool on
  the rooftops, rising motes and a sleeper in a nightcap dangling in it; logo drops in, the
  button pops and breathes; Zib blinks in the dome.
- **Work Orders:** specimen mugshots (asleep, rocking, with a drifting "z") and an "open" badge;
  locked orders show a redacted mugshot with the padlock; cards deal in; panel highlights; the
  header gradient is cached; Glorb purse set into the rank panel.
- **Specimen Report:** tighter timeline so something is always landing; Vrell is at his desk
  from the start, scribbling ("…") until the numbers are in.
- **Memo:** the page slaps down slightly crooked and straightens; "new mail" dot.
- **Vrell and Zib blink** on every portrait (memo, report, abort, flight bubble) — painted over
  the sprite from the SVG's own eye shapes, no extra art.

### Transitions (review #11)
- `SceneManager.go(..., transition)`: `fade` (menus), `iris` and `flash`.
- Flight → room: a mint-rimmed iris closes on the saucer and opens from the beam emitter of the
  room. Room → report on delivery: mint flash. Reduced motion: plain fade for all.

### Housekeeping
- Contact sheet lists `flight/dirt_road_h` and `flight/dirt_road_v`.
- `AGENTS.md` has a short "Shared rendering helpers" section.

## Frame cost

Measured in headless Chromium at 375×690 CSS px, DPR 2, on this dev box. **Headless Chromium
rasterises on the CPU**, so absolute numbers are far worse than a phone GPU and only the
before/after ratio means anything. Two samples per scene: 300 `requestAnimationFrame` deltas,
and 120 × (`render()` + forced flush). Before = commit `2d9b6aa`.

| Scene | render + flush, mean / p95 (ms) — before | after | rAF delta, mean / p95 (ms) — before | after | 4× CPU throttle, render + flush mean (ms) — before | after |
|---|---|---|---|---|---|---|
| Room `farm_window` (beam dragging) | 16.6 / 18.2 | **12.5 / 14.1** | 17.8 / 33.3 | 16.7 / 16.8 | 66.3 | **54.7** |
| Room `laundry_skylight` (fan, beam dragging) | 13.8 / 19.8 | **11.6 / 13.1** | 16.9 / 16.8 | 16.7 / 16.7 | 52.9 | **51.0** |
| Flight 2, town (van cones, neon, lamps) | 11.9 / 13.2 | 12.4 / 15.6 | 16.7 / 16.7 | 16.7 / 16.7 | 49.9 | 56.9 |
| Flight 1, farm (pickup cone, trees) | 14.2 / 16.2 | 14.9 / 17.1 | 16.8 / 16.8 | 16.7 / 16.8 | 52.8 | 60.6 |

Rooms got 16–25 % cheaper despite the extra effects, because the SVG backdrop is now a cached
bitmap and the light pools are sprites. Flight got 4–5 % dearer unthrottled (about +0.6 ms) and
about 14 % dearer under 4× CPU throttle: the new prop shadows, glows and HUD panels cost more
fill than the lamp/neon gradient-to-sprite change saved. A CPU profile of 300 flight frames
puts 93 % of the time in the software rasteriser and about 1 ms per frame in script, so the
extra is pixel fill (GPU work on a phone), not JavaScript. Unthrottled, all four scenes hold
16.7 ms frames. This has not been measured on a real phone.

## Remaining ideas (not done)

- **Pre-rasterise all SVG sprites at load.** The room test showed ~20 % off the frame when art
  is bitmap rather than re-painted vectors; flight would want a cached ground layer. It changes
  the `Assets` contract (canvas instead of `HTMLImageElement`) and costs memory, so it is its
  own change. Worth measuring on a real phone first.
- Bottom band under the floor (review #8, bottom half) is still only used for the prompt pill.
- Washers that spin, a cat tail flick, fireplace flame sprites (review #12).
- Per-context Vrell expressions (eyebrow / mood mark) beyond the blink (review #13).
- Ring label pills and Zib's bubble still use the menu `panel()` rather than the HUD kit.
- A dog tail wag and a bark "pop" on the dog itself.
- Upgrades screen got only panel highlights; a purchase burst would be cheap with `Particles`.
- If flight needs the fill back on a slow phone, the cheapest cuts are the tree shadows
  (`SHADOW_OFF.tree = 0`) and the saucer ground glow.
- L1 has no power lines, so the power-line bonk stars only show on L2.
- No test covers rendering; a headless smoke test that renders each scene once would catch
  draw-time exceptions in CI.
