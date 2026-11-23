# Night Shift: design v2, "Deeper Shift"

This file extends `docs/GDD.md`; read that first. Where they disagree, this file wins.

Player feedback on the demo: *"way too short and simple. The abduction level needs
to be a lot harder and the UFO section needs to be challenging. Detection should be
a 1 second failure. Fun and humoristic but not 5-year-old easy, it should need some
reflexes. Levels need to be longer, more volume and time: a bigger town with
multiple abduction spots, more rooms and obstacles. The first 2 levels are fine
for a tutorial but we need to dig deeper."*

## Design pillars

1. **Reflexes, not patience.** Hazards move fast enough that you react, time
   gaps and commit. Waiting for a hazard to go to sleep is never the answer.
2. **Fail fast, retry instantly, laugh.** Every failure ends in under a second
   with a joke, followed by an instant retry from a nearby checkpoint. Losing
   progress can hurt, but never by more than about 40 s.
3. **Precision under pressure.** The beam is still floppy physics. Hard levels
   tighten the tolerances and add things that punish noise, haste and bad
   timing.
4. **Volume.** A deep level runs 4–6 minutes for a good player, covers 3
   targets in one big map and takes about 10 rooms of abduction.

## Global rule changes (all levels, tutorials included)

- **Detection = 1 second.** The Suspicion meter fills in exactly **1.0 s** of
  continuous exposure to any detector. Detectors are headlights, bark radius,
  window watchers, searchlights, cameras and porch lights. With Hush Drive it
  takes 1.25 s. After a 0.25 s grace, the meter empties at 1.5 s⁻¹, so brief
  clips are survivable but loitering is not. When the meter is full you are
  **SPOTTED**: a short sting, a photo-flash freeze and a Zib line. Then:
  - in tutorials (L1, L2), the flight restarts, as before;
  - in deep levels, you respawn at the last **checkpoint**, which is the ring of
    your last successful abduction, or the start. Delivered specimens stay
    delivered.
- The meter must *look* like a 1-second fuse. The UI shows it as a burning fuse
  or eye that opens, the screen edges flash red while you are exposed, and a
  rising tick plays. Detector shapes are drawn clearly and honestly: the drawn
  cone is the hit cone.

## Deep-level rules (L3, L4 and later)

- **Several targets per map.** Each deep level has **3 specimens** in
  different buildings, collected in any order. Every building has **2 entry
  rings** that lead into the same multi-room interior and set which exit you
  must reach. An off-screen arrow and a compact minimap or target list show what
  is left.
- **Sunrise clock.** The level has a fixed real-time budget, for example
  2:00 AM → 6:00 AM shown as a clock, about 420 s (L3; 480 s on L4). It runs during flight *and*
  abduction. Spotted respawns and failed abductions cost the time they took.
  At sunrise the sky warms over the final 30 s. Reaching sunrise = **level
  failed**, with a Report from Vrell.
- **Waking = failure.** When a specimen's Wake meter fills, they wake up,
  scream, and the attempt fails at once (the Report quip shows over a freeze).
  You retry that building from its start, with one tap. The tutorials keep the
  old forgiving behaviour, where waking only costs a star.
- **Alarms = failure.** In an abduction, touching an active laser, or being
  seen by a security camera for 1 s (the same fuse rule as flight), fails the
  attempt.
- **Second sleepers.** Some rooms hold another sleeper: a spouse, a bouncer or
  a dog. Each has its own small wake meter, which noise fills. A bonk anywhere
  is noise that falls off with distance. Other noise sources: knocking over a
  fragile prop, a bass speaker pulse, a creaky floor zone. If any sleeper wakes,
  the attempt fails.
- **Deep-level stars:** ⭐ *Delivered all 3* · ⭐ *Ghost* (never spotted and
  no failed abductions) · ⭐ *Night owl* (finished with at least the par margin
  left on the sunrise clock). One star needs only the delivery.

## Harder abductions: the multi-room interior

An abduction is no longer one screen. A **building interior** is a sequence of
**rooms** (each a rect in world coords) joined by doorways, stairwells, ladders,
vents, chutes or shafts. The camera follows the specimen smoothly, vertically
and horizontally, and shows a little of the next room through openings. A
building is 3–5 rooms. One route through it takes 40–90 s of careful play.

Tighter tolerances in deep levels:
- the BONK speed threshold is lower and bonks fill Wake ~30% more;
- the Wake meter decays more slowly;
- openings are only ~1.6× the specimen's body width.

Obstacle library (data-driven, reusable; every obstacle has a clear tell):
- **Ceiling fans** (existing), with any speed and either direction.
- **Swinging pendulums**: a grandfather clock, a hanging bulb, a chandelier.
- **Timed hazards**: lasers that pulse on and off with a 0.35 s flicker tell,
  cuckoo-clock birds that pop out, a garage door, an elevator car, crushing
  gears, a printer arm.
- **Patrollers**: a robot vacuum on the floor, a sleepy guard dog on a patrol
  path, a security camera that sweeps a visible cone.
- **Fragile props**: a vase, a fish tank, a stack of plates, a trophy. A knock
  makes them crash, which is big noise.
- **Noise zones**: a creaky-floor strip where moving the beam too fast creaks
  (noise), and a speaker that pulses noise on a beat.
- **Drafts**: a vent or chute that pushes the body; you have to steer against
  it.
- **Second sleepers**: a sprite with a wake meter and Z's, plus a visible
  "light sleeper" ring.

## Levels

L1 and L2 stay as they are as the **tutorial levels**, apart from the 1 s
detection. The Work Orders screen labels them "Training". Deliver Doyle in L1
to open L2. L3 and L4 are deep shifts players can select from the start. Three
non-playable mission concepts follow the playable work orders.

### L3: "Cul-de-Sac Sweep" (Maple Court, suburbia)

Map ~2160×2880. Sunrise budget 420 s (Night owl: done by 260 s).
Flight hazards:
- a **police cruiser** circling the block loop, with a fast headlight cone and a
  rotating light-bar radius;
- **motion-sensor porch lights**, which click on 0.4 s after you come within
  range and stay lit for 3 s;
- **Mrs. Pruitt**, an insomniac at her window, whose binocular cone sweeps the
  street and snaps to a new angle every few seconds;
- two **yard dogs**;
- **bat flocks** that cross the map, solid and bumping;
- **power lines**;
- a **lawn sprinkler**, purely a joke prop.

Specimens:
1. **Dentist Dave**, asleep beside his wife **Brenda**, a light sleeper (second
   sleeper). The house is two storeys.
   - Entry A *Roof hatch*: master bedroom → upstairs hall (a grandfather clock
     pendulum, a robot vacuum on the landing) → attic ladder → attic (a
     swinging bulb, boxes, fragile trophies) → roof hatch.
   - Entry B *Patio door*: bedroom → stairwell down (a creaky stairs zone) →
     living room (a fish tank, a ceiling fan) → patio door.
2. **Coach Barb**, asleep on the couch in front of a static-filled TV, with a
   whistle round her neck. A bungalow, with a sleeping dog **Biscuit** as the
   second sleeper.
   - Entry A *Chimney*: living room → fireplace flue (soot draft pushes down) →
     roof.
   - Entry B *Dog flap → garden*: living room → kitchen (hanging pans, stacked
     plates, a robot vacuum) → utility room (a dryer, Biscuit's bed) → the back
     door, which is a timed swinging door.
3. **Gary, Neighbourhood Watch**, asleep in a camping chair in his garage "HQ",
   surrounded by his own laser tripwires and monitors.
   - Entry A *Garage skylight*: garage (pulsing lasers, hanging power tools, a
     swinging work lamp) → loft storage → skylight.
   - Entry B *Garage door*: garage → side workshop (a security camera sweep) →
     a garage door that cycles open and shut, so you time the exit.

### L4: "Downtown Graveyard Shift" (Grimsby city centre)

Map ~2160×3840. Sunrise budget 480 s (Night owl: done by 310 s).
Flight hazards:
- a **police helicopter**, whose searchlight sweeps a big circle along a loop;
- **two patrol cars**;
- **rooftop security cameras**;
- **traffic lanes** with headlights;
- **billboard neon** (steering scramble);
- a **construction crane** whose boom rotates (solid, it bonks you);
- **pigeon flocks**;
- **insomniac office windows** that switch on and off with a flicker tell.

Specimens:
1. **Night Guard Nigel**, asleep at the museum security desk.
   - Entry A *Skylight*: security office → dinosaur hall (the skeleton is a
     solid maze, plus a swinging pterodactyl) → laser vault (laser grid
     patterns) → skylight.
   - Entry B *Loading bay*: office → gift shop (spinning postcard racks,
     fragile snow globes) → the loading bay, where a cargo shutter cycles.
2. **DJ Kev**, asleep in the DJ booth after closing. The club has a bouncer,
   **Tiny**, asleep on a stool (second sleeper).
   - Entry A *Roof vent*: dance floor (the disco ball, and bass speakers pulsing
     noise on a beat) → vent duct (fans, an updraft) → roof.
   - Entry B *Fire escape*: dance floor → green room (Tiny, a coat rack, a
     fragile champagne tower) → a fire-escape window.
3. **Mayor Whitlock**, "working late" (asleep at the desk) in city hall.
   - Entry A *Clock tower*: office → corridor (sweeping security cameras) →
     clock tower (rotating gears, a swinging pendulum) → tower window.
   - Entry B *Elevator shaft*: office → corridor → elevator shaft (a moving
     car, counterweights) → roof.

## Progression additions

- Ranks: Intern 0 → Probationary 3 → Abductor 5 → Senior Abductor 8 →
  Abduction Lead 11 (of 12 stars).
- Deep-level pay is about 2× per star.
- New upgrades:
  - **Afterburner** (flight): a quick flick, a fast swipe ≥ ~900 px/s, triggers
    a short dash at 2.2× top speed for 0.35 s, with a 2.5 s cooldown shown as a
    ring on the saucer. It is the reflex tool for crossing a sweeping cone.
  - **Snooze Ray** (abduction): once per building, double-tap to knock 40 off
    every wake meter, with a soothing lullaby sting.
  - Beam Dampener and Hush Drive stay.

## Humour

Each new specimen gets a Vrell memo, 4+ mumble lines and Report quips. Each new
hazard gets Zib panic lines, for example *"That's a POLICE helicopter. Mom said
if I get arrested I'm walking home."*, and each fail state gets its own line.
Suspicion barks happen for the patrol, Mrs. Pruitt, the helicopter and so on.
Rotating Vrell sunrise-fail memos. Gary's own tripwires catching his abduction
is the running joke of L3.

## Feel targets

- A good L3 run takes ~4–5 min. A first-timer needs several attempts per
  building.
- No hazard is solvable by waiting at a safe spot forever: every route has at
  least one timing commit.
- Every route must be proven completable by an automated autopilot in tests
  (see the task briefs), so "hard" never means "impossible".
- 60 fps on a mid-range phone. Bigger maps cull off-screen props.
