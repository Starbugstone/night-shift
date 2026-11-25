# Level ideas: outdoor abductions and tall buildings

A brainstorm for levels after L8, written on 2026-11-24. Nothing here is decided. The brief was:
*"outdoor abductions to vary gameplay and levels a bit; we could also have some skyscrapers where we
have to go up multiple levels."*

Read with [the reference research](scifi-references.md) (Sol). Where one of Sol's six work orders
fits an idea below, the idea says so, and Sol's two pairings for this brief (*Nope* for outdoors,
*The Fifth Element* for the tower) are placed in O9 and T1. The questions I have for Sol are in
[For Sol](#for-sol).

[The progression note](../GDD-5-progression.md), written while this brainstorm ran, keeps the game
at eight work orders for now and asks that every new signature is first shown on the approach or
in the specimen's starting room. So these are candidates for later, and the [top 5](#top-5) says
where each new part would first be shown.

Contents: [what the engine does today](#what-the-engine-does-today) ·
[the outdoor rule](#the-outdoor-rule) · [mechanics toolbox](#mechanics-toolbox) ·
[outdoor ideas](#outdoor-ideas) · [tall-building ideas](#tall-building-ideas) ·
[wildcards](#wildcards) · [top 5](#top-5) · [mini design: the tower](#mini-design-overtime-the-tower) ·
[For Sol](#for-sol)

## What the engine does today

Checked in the code on 2026-11-24, so the costs below are grounded.

- **Interiors already scroll.** Only the two training levels are single screens. A deep-level
  building is a set of rectangular rooms joined by openings (`src/abduct/rooms/interior.ts`), the
  camera follows the specimen's chest, and rooms can be tall: the L7 funnel is 1700 px high. A
  tower of four or five floors is content, not a new camera.
- **Every room is a closed box.** `building()` puts a wall on all four edges of each room and
  leaves gaps only at `Opening`s. There is no open sky, and the saucer is never drawn in a deep
  interior: the exit is a hatch, door or window.
- **Hazards** (`Hazard` union): `swing`, `fan`, `gear`, `laser`, `gate`, `pop`, `patrol`, `camera`,
  `fragile`, `creak`, `speaker`, `draft` (a constant push inside an area), `swell` (a building-wide
  sideways pull that reverses on a clock) and `castor`. Plus second sleepers with a noise radius,
  water zones and moisture (L5), probe drones (L6), and turning the specimen with a second finger
  or the rotate buttons.
- **Camera cones are clipped by walls only**, not by furniture (`src/abduct/camera-cone.ts`).
- **Solids** are `rect`, `circle`, `blade` and `swingingRect`. There are no slopes, but a
  `swingingRect` held at a fixed angle is a pitched roof and big circles are hills.
- **A body resting on a moving solid is carried along**, less the body plan's `slip`. `patrol` is
  sinusoidal, so nothing stops and waits at a floor yet.
- **A failed abduction restarts the route from its first room** (`src/levels/run.ts`). There is no
  checkpoint inside a building. A long tower needs one.
- **Body plans** exist (human, dolphin), so a new shape of specimen is a table of joints plus art.
- **Gravity and beam stiffness are constants** (`GRAVITY`, `FOLLOW` in `src/abduct/ragdoll.ts`).
- **Flight** is top-down with fixed entry rings. Hazard types: `car`, `traffic`, `porch`, `watcher`,
  `dog`, `flock`, `wire`, `heli`, `camera`, `neon`, `crane`, `window`, plus the lighthouse and its
  shadow wedges, triggered ambulances and the photographer (which already reads the saucer's
  speed). Nothing pushes the saucer; `neon` only rotates the thrust.
- Every new hazard also costs an autopilot crossing rule (`canCross`) and a difficulty band. I
  counted that in the costs.

Cost words used below: **cheap** = data, art and a few hook lines in an existing module;
**medium** = one new module with its own autopilot rule and tests; **big** = changes the ragdoll,
the scene flow or the flight model.

## The outdoor rule

Indoors, walls make the puzzle. Outdoors there are none, and with no ceiling the obvious move is
to lift straight up. So an outdoor scene needs its own constraints, and they should be different
ones, or it is just a room with a sky texture:

1. **Sight lines.** Somebody awake can see anything that rises above cover. Trees, vehicles, a
   cinema screen and a hedge are what you hide behind. Cones stay hard-edged and honest.
2. **Neighbours.** Outdoor sleepers come in crowds (tents, cars, towels). Noise is the wall.
3. **Wind.** Gusts push the body, with a flag or windsock as the tell.
4. **Things overhead.** Branches, wires, bunting, stage rigging.
5. **The world moves.** A tide, a tractor, a film reel: something in the scene is on a clock, so
   waiting is never the answer (GDD-2 pillar 1).

**The exit is the saucer.** Outdoors the saucer hangs at the top of the scene and its hatch is the
exit. The existing rule carries over unchanged: the entry ring you locked onto in flight decides
where the saucer is parked, so it decides the route. One ring parks it behind cover and far away,
the other parks it close and exposed.

**Flight hazards can be seen from the ground.** The lamp room in L5 already runs the lighthouse
lens on the flight clock. Outdoors this becomes the norm: the patrol car you dodged from above
drives past in the background and its headlights sweep the field.

## Mechanics toolbox

Most ideas share a small set of new parts. Building a part once pays for several levels.

| # | Mechanic | What the player sees | Tell | Built on | Cost |
| --- | --- | --- | --- | --- | --- |
| M1 | **Open-air scene** | No ceiling; the saucer and its hatch at the top | The mint beam column from the hatch | A room with a full-width top opening, a new `none` trim, a sky backdrop | cheap |
| M2 | **Cover** | Free-standing things that block a cone | The cone is drawn clipped, as today | Extra cover slabs fed to `CameraCone` beside the walls | cheap |
| M3 | **Light pool** | A hard-edged patch of light on a cycle: a lit window, a projector beam | 0.35 s flicker, amber outline | `laser` timing with the `camera` fuse | cheap |
| M4 | **Gust** | A sideways push in one area, on then off | Flag or windsock; amber streaks 0.5 s before | `swell` shape gated to an area | cheap to medium |
| M5 | **Crowd of sleepers** | Six to twelve sleepers; only the one nearest waking shows a meter | Rings, as today | `Sleeper` as is; a compact HUD row | cheap to medium |
| M6 | **Seers and hearers** | Awake people in headphones: a cone, no ring. Sleepers: a ring, no cone | Cone or ring, never both | `camera` with a person sprite | cheap |
| M7 | **Carrier** | A lift, a cradle or a vehicle that moves, stops and moves again, carrying whatever rests on it | Amber lamp before it leaves | `patrol` with a dwell profile | medium |
| M8 | **Beam repeater** | A checkpoint inside a building; fail and you restart from it | Zib clamps a mint beacon to the ceiling | Restore the body and wake meter; hazards are already pure functions of time | medium |
| M9 | **Beam signal** | The beam is weaker through floors or inside a zone; the body sags and swings more | Signal bars on the HUD, an amber beam | A scale on `FOLLOW.k` by zone | medium |
| M10 | **Façade flight** | The flight map is drawn as the side of a tower; north is up | The same tells | No sim change: art, a theme and a rect variant of `window` | cheap code, new art |
| M11 | **Weather in flight** | Wind pushes the saucer; clouds are cover; lightning lights the whole map | Windsocks; thunder, then an amber sky | A push field in `stepFlight`; cover like the lighthouse wedges | medium |
| M12 | **Speed-sensitive watcher** | Detects a slow or hovering saucer, ignores a fast straight one | The cone edge goes amber as you slow | The photographer already reads speed | cheap |
| M13 | **Rising clock** | A tide, a pursuer or a reel that advances through the scene | A waterline or a floor indicator | A water zone or cone whose edge moves with time | cheap to medium |
| M14 | **Slopes** | Pitched roofs, dunes | None needed | Fixed-angle `swingingRect`, big `circle`s | cheap |
| M15 | **Body plan: the bag** | A specimen zipped in a sleeping bag: one fat sausage, no arms | None needed | A third `BodyPlanSpec` | medium |
| M16 | **Moving entry ring** | The ring rides a train or a tractor; match its speed to lock on | The ring trails a mint wake | `rings` are fixed points today | medium |
| M17 | **Zero-g** | Nothing falls; the body keeps drifting | None needed | Gravity per building; retune follow and autopilot | medium |
| M18 | **Rigid container** | You lift a box with the sleeper inside; keep it level | A tilt dial | A new rigid body; the turn controls exist | big |
| M19 | **Roped pair** | Two bodies on one rope | The rope goes amber when taut | A second ragdoll and a constraint | big |

M1 to M6 are cheap and together make every simple outdoor level. M7 to M9 make every tower.

## Outdoor ideas

Difficulty is relative to what ships: *training* (L1, L2), *medium* (L3), *hard* (L4 to L7).

### O1. Double Feature (drive-in cinema)

- **Situation and specimen.** A drive-in showing a 1950s saucer B-movie. **Walt**, asleep at the
  wheel of a convertible with the roof down, popcorn in his lap. Others: the projectionist in the
  booth, the snack-bar attendant face down on the counter.
- **Twist.** The projector beam crosses the whole lot above the cars. Lift the specimen into it and
  his shadow lands on the screen, twenty metres tall, and the audience looks up (1 s fuse). The
  shadow is drawn live on the screen, so the tell is the joke. Two ways out: stay low along the car
  roofs, pass under the screen and rise behind it; or wait for the film's own abduction scene, when
  a floppy silhouette is what the audience paid for, and go straight up through the beam. On a
  phone it reads at a glance: one bright wedge, one dark gap, your own shadow as the warning.
- **Joke and nods.** Vrell: *"They are watching a film about us. The saucers are on strings. Do not
  give notes."* Steamed-up cars: *"Occupants are awake and will not be looking up. Do not knock."*
  Report: *"Unlicensed shadow puppetry: 4 seconds. Audience verdict: the floppy one was the best
  actor in it."* Nods: *Plan 9 from Outer Space*, the row of silhouettes from *Mystery Science
  Theater 3000*, the cinema scene in *The Blob*.
- **Engine.** Cheap. M1, M2, M3 (the projector beam is a light pool with a film-reel cycle), M5.
  Car alarms are `fragile` with a different sound. The screen shadow is a view-only redraw of the
  joints.
- **Difficulty.** Medium. A good first outdoor level: it teaches the outdoor rule in one picture.

```
                                      [saucer B]                        [saucer A]
   booth                          (above the beam)                  (behind the screen)
  +-----+ ::::::::.........                                          +-------------+
  |  o=======  projector beam, hard edges, widening  ==============> |   SCREEN    |
  +-----+ ::::::::'''''''''                                          | your shadow |
  snack                 speaker posts  |      |      |               +--+-------+--+
  bar z     [car z] [car <3] [WALT's convertible] [car z] [pickup z]    |  gap  |
  ======================= gravel (creaks if you hurry) ================================
```

### O2. The Morning After (music festival)

- **Situation and specimen.** 5 a.m. at a festival: a field of tents packed like sardines.
  Specimens: a sound engineer asleep on the mixing desk, a stilt walker asleep upright against the
  beer tent, and somebody in the last blue cabin of the toilet row who has been in there since the
  headliner.
- **Twist.** Two kinds of people (M6). Campers are asleep and hear everything. The silent disco is
  still going: thirty people in headphones who hear nothing and see fine. So one half of the scene
  is about noise and the other about cones, and the player swaps habits halfway. Guy ropes are
  tripwires that shake a tent. Flight signature: stage lights are the first detectors that point
  *up*, crossing on the beat. This is where Sol's **Soundcheck for Earth** belongs; its
  five-lamp strip sequence is the flight map of this level.
- **Joke and nods.** Vrell: *"Forty thousand humans paid to sleep in a field. We would have
  arranged that for free."* The cabin: *"It is a blue box and it is occupied. Do. Not. Tilt. It."*
  Report: *"Specimen delivered still inside the facility. Decontamination asks who authorised this.
  Nobody did."* Nods: *This Is Spinal Tap* (a very small stone circle on stage), Woodstock.
- **Engine.** Medium without the cabin (M1, M2, M4, M5, M6). The cabin as a rigid box you keep
  level is M18, big. A cheap version keeps the joke: a normal ragdoll, and the cabin door is a
  hinged `gate`.
- **Difficulty.** Hard. The crowd makes every bonk expensive.

### O3. Tractor Beam (the farmer asleep on a moving tractor)

- **Situation and specimen.** Harvest night. **Old Fernand** fell asleep at the wheel with the
  tractor in gear. It is crossing the field at walking pace and nobody is steering.
- **Twist.** The start moves (M7) and there is a clock in the scene (M13): the tractor is heading
  for the duck pond. Lift him off the seat past the roll bar and the exhaust flap while everything
  slides by underneath: a scarecrow with swinging arms, an irrigation boom, low wires, cows asleep
  standing up (a bonked cow tips over, which is the loudest noise in the game). Flight signature:
  the ring rides the tractor (M16), so you match speed to lock on. The wobbly line the driverless
  tractor leaves in the crop is printed on the report.
- **Joke and nods.** The title. Vrell: *"Yes, it is called a tractor beam. No, that is not what it
  is for. Lift the man, leave the tractor."* Report: *"Unauthorised signage in a cereal crop: one
  wobbly spiral. The Tuesday crew deny everything"* (the crop-circle gag is already in L1 and L3).
  If the tractor reaches the pond: *"One tractor, filed under water feature."* Nods: *Signs*, the
  runaway harvesters in *Interstellar*. It fits Sol's **Cabbage Cup** village and its frost-rig
  sprinkler arms; Fernand could be the fourth villager or replace the groundskeeper.
- **Engine.** Medium: M1, M7, M13, M16.
- **Difficulty.** Medium to hard. The first seconds are the hard part, which is unusual and good.

### O4. Leave No Trace (campsite)

- **Situation and specimen.** A forest campsite. A scout leader in a mummy sleeping bag, six scouts
  in tents round him, a hiker in a hammock between two pines, a ranger asleep in the fire tower.
- **Twist.** The bag (M15): a specimen with no arms to snag and no legs to flail, who rolls and
  slides like a fat sausage. It is the dolphin's opposite: stiff, heavy, hard to stop. Above the
  tents is a maze of branches with food bags hung out of a bear's reach (`swing`). An owl turns its
  head in snaps like Mrs. Pruitt (`camera`). The bear is working through the coolers (`patrol`);
  bump it and it roars. The hammock is a snag: an arm through the netting strains the beam until
  you ease off.
- **Joke and nods.** Vrell: *"Leave No Trace is their policy too. They are worse at it."* Report:
  *"Specimen arrives pre-wrapped. Unwrapping is another department."* A parrot or a scout with a
  walkie-talkie repeats every mumble, louder. Nods: the men with torches at the start of *E.T.*,
  *The Blair Witch Project* (stick figures as `swing`), *Fire in the Sky*; in French, *Camping*.
- **Engine.** Medium: M1, M2, M5, M15.
- **Difficulty.** Medium.

### O5. High Camp (mountain)

- **Situation and specimen.** A ski resort after closing. A man forgotten on the stopped chairlift,
  asleep with his skis on. A climber in a portaledge tent hung on a cliff. The piste-basher driver
  asleep in his cab at the top station.
- **Twist.** Outdoors and vertical at once: the cliff is the building. **The mountain is the second
  sleeper** (a sleeper with unlimited radius and a meter drawn as a crack in the snow shelf): too
  much noise anywhere and it avalanches. Gusts (M4) come round the ridge. The chairlift specimen
  has skis on, which makes him two metres wide when he turns sideways, so you use the turn
  controls to thread him through the pylon.
- **Joke and nods.** Vrell: *"The mountain is a light sleeper. It has buried better interns than
  you."* The yeti in the cave: *"Field Agent 7, undercover since 1951. Do not wake him. He has
  thirty years of leave owing."* Nods: the chairlift scene in *Les Bronzés font du ski* (very strong
  in France), the snow creature's cave in *The Empire Strikes Back*, *Tintin in Tibet*.
- **Engine.** Medium: M1, M4, M15 for the climber, a global sleeper (cheap), skis as two long
  extra bones on the feet (cheap in the body plan).
- **Difficulty.** Hard.

### O6. Water Hazard (golf course at night)

- **Situation and specimen.** A links course. The greenkeeper asleep on a ride-on mower, a golfer
  asleep in a bunker with a hip flask, the club captain in a golf buggy on a slope.
- **Twist.** Rolling ground made of big circles (M14), and the sprinklers come on in sequence:
  heads pop up (the tell), then a jet sweeps an arc. For a human a jet is a splash, which is noise.
  The buggy rolls downhill once its sleeper's weight is off the brake, so the lift starts a
  countdown to the crash. A night golfer hits glowing balls across the scene on a visible arc.
- **Joke and nods.** Vrell: *"Humans have played this game on exactly one other world. They left
  the balls there. The littering file is still open."* A gopher pops out of a hole (`pop`). Nods:
  Alan Shepard's Apollo 14 golf shots, *Caddyshack*. The sprinklers are the same part as the frost
  rig in Sol's **Cabbage Cup**.
- **Engine.** Cheap to medium: M1, M14, a wet jet (a `fan` blade that makes noise, not a bonk).
- **Difficulty.** Medium.

### O7. Low Tide (beach)

- **Situation and specimen.** A resort beach at 4 a.m. A tourist adrift on an inflatable flamingo, a
  dad his children buried in sand up to the neck, a lifeguard asleep on top of the tower.
- **Twist.** The tide is coming in (M13): the waterline climbs the screen through the attempt, and
  a splash is noise for humans. The lilo bobs on the swell (`swell` plus a floating carrier). The
  buried dad is an extraction: pull too fast and the sand caves in loudly, so the first move is slow
  while the tide makes you hurry. Coconuts fall when you bump a trunk.
- **Joke and nods.** The dad: *"The children have pre-packed him."* Report: *"Specimen is 80% sand
  by volume. Billing by weight is suspended."* Nods: *Jaws* (a fin on patrol in the shallows),
  *Cast Away* (a volleyball with a face as the souvenir), the white balloon from *The Prisoner*;
  in French, *Le Gendarme et les Extra-terrestres*, which already put saucers on that coast.
- **Engine.** Medium: M1, M13, a carrier that floats (M7).
- **Difficulty.** Medium.

### O8. Wish Upon a Saucer (stargazers on a hill)

- **Situation and specimen.** The night of a meteor shower. A hilltop covered in people on blankets
  looking straight up, on purpose. The specimen is the amateur astronomer who organised it and
  fell asleep at the eyepiece.
- **Twist.** A flight inversion (M12). Stargazers ignore anything fast and straight (they make a
  wish) and spot anything slow. So you streak across the hill and can only hover for the lock-on
  when a cloud covers the ring. In the abduction, everybody awake is looking up, so the specimen
  travels low and sideways under the eyelines to the tree the saucer hides behind. This is the
  natural home of Sol's **Please Hold for Vega** radio array: the same people, professionally.
- **Joke and nods.** Vrell: *"Move like a meteor: fast, straight, no hovering. Do not grant
  wishes."* Report: *"Wishes logged: 14. Wishes granted: 0."* Zib: *"A million to one, he said."*
  Nods: the meteor shower in *The Day of the Triffids*, Asimov's *Nightfall*, the opening of *The
  War of the Worlds*. Art note: astronomers use red torches, and red is our "it has you" colour.
  Either paint the torches amber-brown or make them real detectors.
- **Engine.** Cheap to medium: M12 in flight, M1, M2, M5.
- **Difficulty.** Medium flight, easy abduction.

### O9. They Can't Stop All of Us (outside the secret base)

- **Situation and specimen.** The desert gate of a base that does not exist. Forty meme campers
  asleep in lawn chairs, a night guard asleep in a white pickup, a gift-shop owner asleep among
  inflatable aliens.
- **Twist.** Bouncy solids: inflatable aliens do not bonk, they bounce you into the thing next to
  them. The guard's pickup has its engine running and the headlights are a fixed cone you pass
  behind. This fills the existing **Area 51 Gift Shop** card and is the same place as Sol's
  **Department of Missing Things** fair; the tethered balloon cable is its flight signature.
  Sol's *Nope* pairing goes here too: the campers came to film the sky, so their tripods are
  sweeping sight lines (M2) and a row of fabric windbreaks is the cover you steer behind. One
  crew member is asleep beside his tripod and is a good third specimen.
- **Joke and nods.** Sign: *"USE OF DEADLY PAPERWORK AUTHORISED."* Vrell: *"They sell plush Vrells.
  Take one. For Legal."* Report: *"It was a weather balloon. It is always a weather balloon."*
  Sol's line fits as written: *"They set up five cameras. The one pointed at the sky was recording
  its own lens cap."* Nods: Roswell 1947, the 2019 "Storm Area 51" event, *The X-Files*, *Nope*.
- **Engine.** Cheap: M1, M2, M5, a restitution value on a solid.
- **Difficulty.** Medium.

### O10. Tilting at Windmills (wind farm or offshore rig)

- **Situation and specimen.** A turbine technician asleep in the nacelle at the top of the tower,
  in a storm.
- **Twist.** The exit is past three blades the size of the screen (a giant `fan`), in gusts (M4).
  The tower is a five-floor ladder climb inside, so it is outdoor, vertical and weather in one
  building. Flight signature: a field of turning blades as rotating solids (`crane`), wind on the
  saucer and lightning with cloud cover (M11).
- **Joke and nods.** Vrell: *"The last pilot to complain about these was Spanish and rode a horse."*
  Rig variant: *"It would have been cheaper to train astronauts to drill. We checked."* Nods:
  *Don Quixote*, *Armageddon*, *The Abyss* (*"a competitor: deep-water division"*).
- **Engine.** Medium to big: M4 and M11.
- **Difficulty.** Hard.

### O11. Plan 10 (graveyard in fog)

- **Situation and specimen.** A gravedigger asleep at the bottom of the grave he was digging, a
  night watchman in the chapel, a goth asleep on a tomb.
- **Twist.** Fog: you see a circle round the beam and amber tells glow through the rest, so the
  scene is played from tells. The exit from an open grave is straight up, between two rows of
  leaning headstones. Underneath is a crypt, so the level also goes down.
- **Joke and nods.** Vrell: *"Plan 9 was cancelled after the reviews. This is Plan 10: paperwork."*
  Report: *"Specimen found in a pre-dug hole. We thank the humans for the storage."* Nods: *Plan 9
  from Outer Space* (aliens and a graveyard, played straight), *Night of the Living Dead* (we
  already have a Barb).
- **Engine.** Cheap: a view-only fog mask (`ScreenTint`), M1.
- **Difficulty.** Medium. Fog needs care: every gameplay tell must stay visible.

### O12. Silent Night Shift (rooftops on Christmas Eve)

- **Situation and specimen.** A snowy street of pitched roofs. A dad in a Santa suit stuck in his
  own chimney, a mall Santa asleep in the sleigh display, a carol singer on a bench.
- **Twist.** The roof slide: on a pitched roof (M14) under the fairy-light wires the beam drops to
  one bar (M9), so gravity wins and you steer a slide down the tiles to the gutter and catch him at
  the edge. The chimney dad is an extraction: turn him to free the shoulders. A reindeer on the
  roof has a red nose, and red is a detector edge in our tell language, so it is one.
- **Joke and nods.** Vrell: *"Tonight every radar operator on Earth expects one unidentified flying
  object and waves it through. Best cover story of the fiscal year."* *"Head Office tried to take
  the real one in 1964. The reviews were unkind."* Nods: NORAD's Santa tracker, *Santa Claus
  Conquers the Martians*, *Home Alone* (a house booby-trapped by a child: paint tins on ropes are
  `swing`s we already have); in French, *Le Père Noël est une ordure*.
- **Engine.** Medium: M9, M14. A seasonal level is also something to announce.
- **Difficulty.** Medium.

## Tall-building ideas

The lighthouse (Pete, L5) and the hospital wing (L6) from the brief are already shipped, so they
are not repeated here.

### T1. Overtime (the skyscraper)

- **Situation and specimen.** A 40-storey insurance tower at quarter-end. Three specimens at three
  heights: a lobby guard on 2, **Derek from Compliance** on 31, a window cleaner asleep in his own
  cradle near the top.
- **Twist.** One tower is the whole level. The flight is a climb up the façade (M10): lit windows
  are the detectors, cradles and flagpoles the solids, a glass lift with a passenger looking out
  is the patrol car. Each abduction climbs three or four floors, each floor is one screen with one
  signature hazard, and each cleared floor gets a beam repeater (M8). The beam loses a bar per
  concrete floor between specimen and saucer (M9): at the bottom he is a wet noodle in wide rooms,
  at the top he is crisp in tight ones. The other way up is outside, on the cleaners' cradle (M7),
  with full signal, gusts (M4) and lit windows (M3).
- **Joke and nods.** Zib: *"One bar. I am lifting a grown man through four floors on one bar."*
  Vrell: *"He is in Compliance. So are we. Professional courtesy: no bonks above the neck."* Lift
  muzak calms the wake meter: *"the only human invention that works on us too."* Nods: *Die Hard*
  (ducts, a lift shaft, a roof), *King Kong* (*"Head Office last climbed one of these in 1933.
  Large operative. Poor exit strategy."*), *Brazil* (whose Form 27B/6 our Form 7-B already echoes),
  *Office Space*; in French, *La Tour Montparnasse infernale*, whose heroes are window cleaners.
  Sol's *The Fifth Element* pairing gives the façade its entry rings, numbered pickup bays, and
  a report line: *"Surcharge for the 39th floor. The driver never left the ground."*
- **Engine.** Medium: M3, M4, M7, M8, M9, and M10 for the flight. The biggest single item is M8.
- **Difficulty.** Hard, but the repeaters make it the fairest hard level.
- Sketched in full [below](#mini-design-overtime-the-tower).

### T2. Heatwave (apartment block, the outside of it)

- **Situation and specimen.** The hottest night of the year. Everyone sleeps with the windows
  open, on balconies and fire escapes. The specimen is on a mattress on the fourth-floor fire
  escape; the saucer is above the roof.
- **Twist.** A building climbed on the outside: balconies are shelves, washing lines between the
  blocks are wires hung with swinging laundry, air-conditioning units drip, every open window is a
  sleeper's ring. Across the courtyard a photographer with his leg in plaster and a long lens
  cannot sleep: he is the L7 photographer in side view (frame, iris, exposure). One level answers
  both halves of the brief.
- **Joke and nods.** Vrell: *"The man opposite photographs his neighbours all night. The humans
  call this a hobby. We need a licence."* Report: *"Items stolen from Earth: 1 sock, and the peg."*
  Nod: *Rear Window*.
- **Engine.** Cheap to medium: M1, M2, M5, the photographer ported to the side view.
- **Difficulty.** Hard.

### T3. Checkout, 900 Years Late (the keep hotel) and a Vegas variant

- **Situation and specimen.** Sol's medieval keep run as a budget hotel is a tower already: five
  round floors on a spiral stair, the saucer over the battlements.
- **Twist.** A hotel means a sleeper behind every door (M5), so the corridor floors are noise
  discipline and the stair is an echo chamber: noise made in it reaches every floor. Routes: the
  dumbwaiter (a carrier, M7), the stair, and the garderobe chute, the medieval toilet shaft, which
  is the *rear entrance* joke's ancestor. A vibrating coin bed kicks the specimen on a cycle.
- **Vegas variant.** A casino hotel in the week of an impersonators' convention. Three specimens
  on three floors, all registered under the same name, all in white jumpsuits. Report on the third
  delivery: *"All three have left the building."* A tiger asleep in a bathroom is the second
  sleeper. The fountain show is the flight signature: columns of water on a visible beat.
- **Nods.** *Les Visiteurs* (Sol's), *The Shining* (a corridor carpet, a door numbered one higher
  than the famous one), *The Hangover*.
- **Engine.** Medium: M5, M7, M8.
- **Difficulty.** Hard.

### T4. Run Silent, Snore Deep (submarine)

- **Situation and specimen.** A submarine on the surface at night for air. The sonar operator
  asleep in headphones, the cook, the captain in the only private bunk. The crew sleeps in bunks
  three high along the corridor.
- **Twist.** A building that is one long tube with one way up, the conning tower. The sonar pings
  on a beat (`speaker`), and everything travels through a steel hull, so sleeper radii are huge.
  The boat pitches bow-down then stern-down (the `swell` turned to run along the corridor), so the
  specimen slides towards the bulkhead doors (`gate`). The periscope is a `camera` that looks into
  the control room. The second exit is a torpedo tube: a body-width pipe taken at speed.
- **Joke and nods.** Vrell: *"A hundred and thirty humans in a pipe, taking turns in the same
  beds. And they call our methods invasive."* Zib, at the tube: *"I am not signing for what that
  is usually for."* Nods: *Run Silent, Run Deep*, the single ping in *The Hunt for Red October*,
  *Twenty Thousand Leagues Under the Sea* (strong in France).
- **Engine.** Cheap: every part exists.
- **Difficulty.** Hard.

### T5. Sleeper Service (night train)

- **Situation and specimen.** A sleeper train crossing the country. Twelve compartments, a
  conductor asleep in the guard's van, a snack trolley on the loose.
- **Twist.** The building moves, so the flight ring moves (M16). Inside it is a row of small
  rooms. The way out is the roof hatch, and then along the roof to the saucer while signal
  gantries and tunnel mouths arrive from the right with an amber warning (`pop`, `gate`), in a
  permanent headwind (`draft`). A tunnel is the rising clock (M13): in it the beam is cut, so you
  must be flat in a doorway before it arrives.
- **Joke and nods.** Vrell: *"Twelve passengers in this carriage. All twelve have a motive to be
  asleep."* The trolley: *"Anything from the trolley? No. Especially not him."* Nods: *Murder on
  the Orient Express*; the title is also a ship's name in Iain M. Banks's *Excession*.
- **Engine.** Medium: M16, M13.
- **Difficulty.** Hard.

### T6. Red-Eye (airliner at 35,000 feet)

- **Situation and specimen.** The saucer paces a night flight. The specimen is in 34B, the middle
  seat, between two other sleepers.
- **Twist.** A crowd in rows (M5) and one aisle. Turbulence is a vertical `swell` with the
  seat-belt chime as its tell. Overhead lockers pop open. One passenger is awake at a window and
  has reported a thing on the wing three times tonight; nobody believes him, so the first sighting
  in this level is free and the second is not. Flight signature: clouds are cover and lightning
  lights everything (M11).
- **Joke and nods.** Vrell: *"The one human awake on board has cried saucer three times. Keep his
  record perfect."* Report: *"Seat 34B is now free. Both neighbours have taken the armrest."*
  Nods: *The Twilight Zone*'s "Nightmare at 20,000 Feet" (Sol's list has the series already),
  Stephen King's *The Langoliers* (only the sleepers are left); in French, Tintin's *Vol 714 pour
  Sydney*, which is a saucer abduction with the memories wiped.
- **Engine.** Cheap to medium inside; M11 for the flight.
- **Difficulty.** Medium.

### T7. Cargo Held for Snoring, stacked (container port)

- **Situation.** Sol's freight depot, built upwards: container stacks five high are an outdoor
  building with no walls, and the gantry crane's spreader is the lift (M7). A specimen asleep in
  the crane cab, 40 m up, is the tower climb in the open air, in wind (M4).
- **Engine.** Medium: M1, M4, M7. **Difficulty.** Hard.

## Wildcards

- **W1. In Space No One Can Hear You Snore (space station).** Zero-g (M17): an astronaut in a
  sleeping bag strapped to a wall. Nothing falls, nothing stops; you push off and drift. Outside on
  a spacewalk bonks are silent; inside the module everybody hears them. The most different a level
  could feel for a medium cost. Nods: *Alien*'s tagline, *Gravity*, *Red Dwarf*; French players
  know *Cosmos 1999* and *Ulysse 31*. L8 already covers *2001*.
- **W2. Trust No One (Antarctic station).** A blizzard (gusts, fog), three researchers in three
  huts joined by rope lines. The report reveals that one of the three was already one of ours,
  undercover: *"Returned to sender with an apology and his paperwork."* Nods: *The Thing*; the
  stiff little finger from *The Invaders*, which France knows as *Les Envahisseurs*.
- **W3. The Claw (funfair).** A ride operator asleep in the top gondola of a turning Ferris wheel
  (gondolas are carriers on a circle, M7) and a child's uncle asleep inside a claw machine full of
  plush toys. Zib: *"The beam decides who goes and who stays."* Vrell: *"Stop quoting the plush
  toys."* Nods: the claw in *Toy Story*, *Killer Klowns from Outer Space* (*"a rival firm.
  Tacky."*).
- **W4. Totality (solar eclipse).** A daylight abduction with a clock of two minutes forty. A whole
  town is awake and looking at the sun through paper glasses. Cones run from every watcher to the
  sun; stay off those lines. One short, frantic level. Nods: Asimov's *Nightfall*, *Little Shop of
  Horrors*, Tintin's *Le Temple du Soleil*.
- **W5. The classic cow.** The oldest picture in the business: a cow in a beam. A four-legged body
  plan, heavy, so the beam sags (M9 as weight). Vrell: *"The Bureau stopped taking cows in 1997.
  Storage."* A short bonus order, not a full level.
- **W6. The Gym Bro** (existing card). He will not let go of the dumbbells: two heavy weights on
  the wrists turn every move into a wrecking ball. A body-plan mass change, cheap.

## Top 5

Picked so that each one adds a different new verb, and so that the cheap parts come first.

| # | Level | New verb | Parts | Cost | Why this one |
| --- | --- | --- | --- | --- | --- |
| 1 | **O1 Double Feature** (drive-in) | Hide from a sight line; your shadow is the tell | M1 M2 M3 M5 | cheap | Teaches the outdoor rule in one picture; the best joke for the least code |
| 2 | **T1 Overtime** (skyscraper) | Climb floor by floor with checkpoints; ride a carrier; weak beam low down | M3 M4 M7 M8 M9 M10 | medium | The brief asked for it; the façade flight is free; M8 unlocks every later tower |
| 3 | **O3 Tractor Beam** (moving tractor) | Lift from a moving start against a clock in the scene | M1 M7 M13 M16 | medium | The title sells itself; French countryside; joins Sol's Cabbage Cup |
| 4 | **O2 The Morning After** (festival) | Swap between noise and sight halfway | M1 M2 M4 M5 M6 | medium | Joins Sol's Soundcheck flight to an abduction that fits it |
| 5 | **O5 High Camp** (mountain) | Outdoor and vertical; a new body; the mountain listens | M1 M4 M15 | medium | Strong French nod; wind and the bag are reusable |

Where each new part is first shown, as the progression note asks:

- **Double Feature.** Walt's car is parked under the thin end of the projector beam. A moth flies
  through it and its shadow crosses the screen before the player has moved.
- **Overtime.** The signal bars are on screen from the first lift on floor 31, where the room is
  wide and empty. The cradle leaves once, visibly, before the player can reach the window.
- **Tractor Beam.** In flight the ring is already moving when it scrolls into view, on a long empty
  straight with no detector near it.
- **The Morning After.** The flight passes over the silent disco: dancers who do not react to a
  bump on the stage rigging right beside them, and one who looks up.
- **High Camp.** The chairlift specimen's first metre is in still air; the flag on the pylon above
  him is already showing the gust he will meet.

Close behind: **T2 Heatwave** (it answers both halves of the brief and is cheap; it could be the
residential target inside T1's level), **T4** the submarine (all existing parts) and **W1** zero-g.

Suggested order of work if any of this goes ahead: M1 + M2 + M3 with the drive-in as the proof,
then M8 + M7 with one tower building, then the rest.

## Mini design: Overtime, the tower

One building of the tower level: floors 31 to 34 and the outside wall beside them. Specimen:
**Derek from Compliance**, asleep at his desk on 31 under a kitten poster, quarter-end reports for
a pillow. Second sleepers: three interns on 32, the chairman **Sir Roger** in a massage chair on 34.
Souvenir: a stapler with his name on it in three places.

World units as in the shipped rooms: a floor plate is 1100 × 700, openings are about 164 wide, a
human is about 275 long. Up is negative y.

```
                      [saucer, ring B]                        [saucer, ring A]
                             ||                                      ||
 y -2800  +--------+==[ B: roof hatch ]===============+         [ A: hatch ]
          | lift   | BOARDROOM        ~chandelier~    |              flag >
 F34      |   ^    D                                  |       ~ ~ ~ ~ ~ ~ ~ ~ ~
 4 bars   | [car]  | Sir Roger (z)   <model>   pop    |       ~   GUST BAND   ~
          | [car]  |                             (R4) |       ~ 3 s on, 4 off ~
 y -2100  |   v    +----------------------------------+       ~  pushes left  ~
          |        | SERVER FLOOR                     |       ~ ~ ~ ~ ~ ~ ~ ~ ~
 F33      | weight D                                  |
 3 bars   |        | :laser:    (fan)    :laser: (R3) |     +------+  cradle, top stop (R-A)
          +--------+                                  |     |      |
 y -1400           +------[hatch]---------------------+     |      |
                   | CUBICLE FARM                (R2) |     |      |
 F32               |                                  |#####|      |###  lit window on 32:
 2 bars            | z      z      z   mail cart <->  |#####|      |###  hard-edged, on a cycle
 y -700            +----------------------[stairs]----+     |  /\  |
                   | COMPLIANCE                       |     |  \/  |
 F31               |                                  |     |      |
 1 bar             | DEREK=desk    plant    cooler    W --> +------+  cradle, bottom stop
 y 0               +----------------------------------+--------------------------
                   x 0                             1100                 1520
```

`(R2)`, `(R3)`, `(R4)` and `(R-A)` are beam repeaters (M8). `z` is a second sleeper, `D` a door into
the lift shaft, `W` the open window. The outside column is open air (M1) from the street to the roof.

### Flight (façade, M10)

The map is the south face of the tower, about 1080 wide and 4300 tall, sky on both sides. No sim
change: north is drawn as up.

- **Lit windows** (`window`, rectangular): offices switch on and off with the usual flicker tell.
  The lit rectangle is the hit area.
- **The glass lift** (`car` on a vertical path): one passenger looking out, a cone in front.
- **Cradles** on their cables (`flock`-style solid on a line, cables as `wire`).
- **A film premiere in the street**: two searchlights from the bottom edge (`camera`, long range)
  that cross on a fixed beat. This is the timing commit for the lower third.
- **A news helicopter** (`heli`) circling the crown, and a gust band in the top third (M11) with
  flags as the tell. Optional; the level works without it.
- Rings: A is a spot in the open beside the roof corner, above the cradle rail. B is over the
  helipad, behind the plant room, which hides it from the helicopter.

### Abduction hazards

| Where | Hazard | Kind | Tell |
| --- | --- | --- | --- |
| All floors | Beam signal: 1 bar on 31 up to 4 on 34 (route B only; outside is always 4) | M9 | HUD bars; the beam tints amber at 1 bar |
| F31 | Water cooler by the stairs | `fragile` | None needed |
| F32 | Three sleeping interns, rings overlapping across the aisle | sleepers (M5) | Rings |
| F32 | Mail cart rolling the aisle | `patrol` | Visible |
| F33 | Two laser rows on offset cycles, a safe bay between them | `laser` | 0.35 s flicker |
| F33 | Cooling fan beside the safe bay | `fan` | Visible |
| Shaft | Lift car: 2 s stopped at 33, 2 s travelling, 2 s stopped at 34, 2 s back | carrier (M7) | Amber call lamp 0.5 s before it moves; a soft *ding* (small noise near Sir Roger) |
| Shaft | Counterweight, opposite phase | `patrol` | Visible |
| F34 | Chandelier | `swing` | Visible |
| F34 | Scale model of this tower (someone has stuck a tiny saucer on it) | `fragile` | None needed |
| F34 | Putting machine that fires the ball back | `pop` | Amber blink |
| F34 | Roof hatch | `gate`, 7 s cycle | Amber before closing |
| Outside | Cradle: stops at the 31 sill and at 33; 12 s loop | carrier (M7) | Winch lamp amber before it moves |
| Outside | Lit window on 32. The cradle's body blocks it (M2) | light pool (M3) | Flicker, hard edge |
| Outside | Gust band from 33 to the roof, pushing towards the glass | gust (M4) | Roof flag; amber streaks 0.5 s before |

### Route A, "Window cradle" (short, exposed, about 45 s)

1. Lift Derek off the desk, over the plant, to the open window on the right. One bar: he sags and
   swings, so go round the water cooler wide.
2. Out of the window the signal jumps to four bars and he stiffens. The cradle is at the sill for
   2 s in every 12. Put him in the basket before the winch lamp turns amber. *Commit 1.*
3. Ride up. Keep him inside the basket's outline while it passes the lit window on 32: the basket
   is the cover. Lead the beam at the cradle's speed; lag and his feet hang out into the light.
4. The cradle stops at 33. Repeater R-A.
5. From 33 to the hatch is 700 px of open air in the gust band. Leave as a gust dies, keep to the
   outer side away from the glass, and arrive before the next one. About 3 s of travel in a 4 s
   gap. *Commit 2.*

Fails: spotted at the window (alarm, by "the intern on 32"), bonked awake on the glass.

### Route B, "Express lift" (long, noisy, about 80 s)

1. Derek over the desk and up the stairs at the right of 31. Repeater R2 on arrival, two bars.
2. Cubicle farm, right to left. Stay high over the partitions and slow: three rings overlap
   across the aisle. The mail cart is underneath and only matters to dangling feet. The ceiling
   hatch to 33 is at the left. Leave when the cart has just passed under it. *Commit 1.*
3. Server floor, R3, three bars. Cross the first laser row in its dark window, stop in the safe
   bay beside the fan, cross the second row. *Commit 2.* Door to the shaft at the left.
4. The lift. Wait is at most 6 s and the lamp shows it. Lay him on the roof of the car while it is
   stopped, ride up one floor (the muzak takes a little off the wake meter), step off through the
   door to 34 before the car leaves again. *Commit 3.* Miss it and he rides back down: funny, slow,
   not fatal.
5. Boardroom, R4, four bars: crisp at last, and now it is tight. Under the chandelier's swing,
   over the model tower, past the putting machine, up through the roof hatch on its cycle.
   *Commit 4.*

Fails: an intern or Sir Roger wakes, a laser, Derek wakes.

### Why two routes feel different

A is two hard commits with a perfect beam. B is four easier ones with a bad beam that gets better.
A player who failed A's gust three times can take B and trade nerve for patience and time on the
sunrise clock.

### Proof and tuning notes

- The carrier, the gust and the light pool each need a `canCross` rule. All three are pure
  functions of the abduction clock, like `swell` and `castor`, so the autopilot can predict them.
- The repeater must restore the body, the wake meters and the probe-style per-route state, and
  leave the hazard clock running (the sunrise clock does not stop for a retry).
- Target bands as for L5 to L7: skilled ≥ 75 %, casual ≥ 40 % per route. With repeaters the band
  should be measured per segment, or route B will look easier than it plays.
- Signal bars change how far the body hangs below the reticle. Rooms on the one-bar and two-bar
  floors must be laid out for that sag, and the mouse `hold` spring needs the same scale.

## For Sol

Your six work orders fit mine like this. I would rather merge than compete:

| Your work order | Fits my | How |
| --- | --- | --- |
| Soundcheck for Earth | O2 The Morning After | Your lamp-strip sequence is the flight; my tent field and silent disco are the abductions |
| The Cabbage Cup | O3 Tractor Beam, O6 sprinklers | The farmer on the moving tractor is a villager; your frost rig is the same part as my sprinklers |
| Department of Missing Things | O9 outside the base | Same desert; my campers and inflatables go round your fair |
| Cargo Held for Snoring | T7 | Stack the containers and the depot is an open-air tower |
| Checkout, 900 Years Late | T3 | A keep is a five-floor tower with a stair and a garderobe chute |
| Please Hold for Vega | O8 Wish Upon a Saucer | Your array and my hilltop are the same crowd: people paid to look up |

Please check or find the following. For each: is the detail right, how well is it known in English
and in French, and how risky is the draft line under your rights notes? I wrote fresh lines and
kept titles out of them, but a few lean on a catchphrase and I have marked those.

**For the top 5**

1. **Drive-in (O1).** *Plan 9 from Outer Space*: release year, and that it has saucers on strings
   over a graveyard. *Mystery Science Theater 3000*: is a row of silhouettes along the bottom of a
   screen protected trade dress, or generic enough to draw with car roofs? The cinema scene in
   *The Blob* (1958). A French-first equivalent: drive-ins are rare in France, so is there a known
   open-air screening or a French film scene that carries the same joke?
2. **Skyscraper (T1).** *Die Hard*: I would like a line for Zib in a duct, such as *"Come to Earth,
   they said. See the sights. Crawl through a duct."* It paraphrases the film's vent line. Too
   close? *King Kong* (1933): the biplanes and the year. *Brazil*: confirm Form 27B/6 and tell me
   whether our existing Form 7-B needs to keep its
   distance. *Office Space*: is a plain stapler safe if it is not red? *La Tour Montparnasse
   infernale* (2001): confirm the heroes are window cleaners and rate French recognition.
   Your *The Fifth Element* pairing is in; is *Playtime* (Tati's glass office blocks) worth a
   second French nod? Any classic science fiction set in one tall building that I missed (Ballard's *High-Rise*, Silverberg's
   *The World Inside*, *The Towering Inferno*)?
3. **Tractor (O3).** *Signs* and the crop-circle history (Doug and Dave, 1991) for the report
   line. The driverless harvesters in *Interstellar*. Anything in *La Soupe aux choux* about a
   tractor or a field that would let this level sit in your Cabbage Cup village? A French rural
   UFO case famous enough for one line (Valensole, 1965: a lavender farmer; Trans-en-Provence,
   1981).
4. **Festival (O2).** My toilet-cabin line calls it a blue box. Your item 10 says a blue box plus
   other cues gets close to *Doctor Who*. Is "a blue box, and it is occupied" safe with no other
   cue? *This Is Spinal Tap*'s undersized stone circle. A French festival nod.
5. **Mountain (O5).** The chairlift scene in *Les Bronzés font du ski* (1979): what exactly
   happens, and how much can a man asleep on a stopped chairlift evoke it without the song? The
   ice cave in *The Empire Strikes Back* and the sleeping-bag joke that goes with it. *Tintin au
   Tibet* and the yeti. Classic yeti or bigfoot lore usable for "Field Agent 7" (the 1951 Shipton
   footprint photograph, the 1967 Patterson film).

**For the other ideas**

6. **Stargazers (O8).** *The Day of the Triffids* (the meteor shower), Asimov's *Nightfall* (1941),
   the opening of *The War of the Worlds*: who says the million-to-one line, Wells or the 1978
   musical, and is *"A million to one, he said"* too close? The 1977 "Wow!" signal as a printout
   souvenir.
7. **Heatwave (T2).** *Rear Window* (1954): the heatwave, the plaster cast, the couple on the fire
   escape. Risk of a photographer with a leg in plaster.
8. **Beach (O7).** *Le Gendarme et les Extra-terrestres* (1979): what the aliens do, and one safe
   detail to nod at. The white balloon in *The Prisoner*. *Jaws*: is a fin plus a two-note cue too
   much?
9. **Submarine (T4).** *Run Silent, Run Deep* as the model for my title. The single ping in *The
   Hunt for Red October*. Verne's Nautilus for the French line.
10. **Night train (T5).** *Excession*: confirm *Sleeper Service* is a ship name, and whether using
    it as a level title is a problem. *Murder on the Orient Express*: the count of twelve.
11. **Red-eye (T6).** "Nightmare at 20,000 Feet" (1963) and the 1983 remake; *The Langoliers*;
    Tintin's *Vol 714 pour Sydney* (1968): is it right that it ends with a saucer abduction and
    wiped memories? That would be the best French nod in the whole list.
12. **Christmas (O12).** *Santa Claus Conquers the Martians* (1964) and whether it is public
    domain. NORAD's Santa tracker: the year it began and the origin story. *Le Père Noël est une
    ordure* for France.
13. **Golf (O6).** Apollo 14: did the golf balls stay on the Moon? How many?
14. **Space station (W1).** The *Alien* tagline: is *"In space no one can hear you snore"* an
    acceptable parody as a level title, given your note that titles carry trademark risk? French
    nods: *Cosmos 1999*, *Ulysse 31*, *Capitaine Flam*.
15. **Antarctic (W2).** *The Thing* (1982) and its source story, "Who Goes There?" (1938). *The
    Invaders* / *Les Envahisseurs*: the stiff little finger, and how well France remembers it.
16. **Funfair (W3).** My line *"The beam decides who goes and who stays"* paraphrases the claw
    line in *Toy Story*. Too close? *Killer Klowns from Outer Space* (1988).
17. **Outside the base (O9).** The 2019 "Storm Area 51" event and the festival that followed: the
    facts, and whether its slogan is safe as a level title.

**Open requests**

- Classic abduction lore set outdoors that I have not used: the Hills (1961, a car on a country
  road), Pascagoula (1973, two men fishing), Travis Walton (1975, a logging crew), the Allagash
  canoe trip (1976). A real case is "nobody real mocked" territory: tell me which are safe to
  nod at and which to leave alone.
- One French-first nod for each of the top 5. I have *La Tour Montparnasse infernale* and *Les
  Bronzés font du ski*; the drive-in, the tractor and the festival need one.
- Night workers in classic science fiction, for specimens: the lamplighter in *Le Petit Prince*,
  night watchmen, lighthouse keepers, radio operators. Each level needs three.
