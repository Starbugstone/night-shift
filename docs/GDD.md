# Night Shift — game design (demo scope)

A mobile-first, portrait, one-thumb physics comedy. You are **Zib**, a junior
abduction intern on your first night shift for the **Galactic Census Bureau,
Abductions Dept.** Every level is a *work order*: fly the saucer through a
little slice of a sleeping town, pick where to hover, then use the tractor beam
to float one floppy, sleeping human out of their building without waking them.

The comedy comes from power used badly: the beam can lift a house, but
lifting a snoring man past a ceiling fan without bonking him is hard.

## Tone and humour

- **Supervisor Vrell** (a tired, passive-aggressive manager blob with a clipboard)
  sends memos before and after each work order. Corporate HR language applied to
  abductions: *"Reminder: specimens must arrive undamaged, unbruised and ideally
  unaware. Last quarter's intern returned a man still holding his toaster."*
- Humans never wake gracefully. Bumps make them mumble in their sleep
  (*"five more minutes…"*, *"not the geese, Linda"*). If the **Wake meter**
  fills they jolt awake, flail, and grab the nearest object for a few seconds;
  shake them loose.
- After every attempt a **Specimen Report** card stamps out with deadpan stats:
  *Times bonked: 3 · Dignity remaining: 41% · Snores recorded: 12 ·
  Items stolen from Earth: 1 slipper*. Plus one rotating joke line from Vrell.
- Failure is funny, never punishing: restart is one tap and instant.
- Short dream bubbles above sleeping humans (sheep, a sandwich, a tax form)
  change when they get bumped.

## Core loop (per level, about 60–90 s)

1. **Memo** — Vrell's work order: who, where, one joke, the star goals.
2. **Flight phase (top-down)** — drag anywhere to steer (saucer accelerates
   toward the finger with inertia); release to brake into a hover. The map
   shows 2 **entry points** (glowing landing rings) on the target building.
   Hazards: sweeping headlight cones of a car / a dog's bark radius / a
   streetlight that flickers. Being caught in a cone or bark radius raises
   **Suspicion**; full suspicion = "Spotted!" and restart the flight. Hover
   inside an entry ring for 1 s to lock on and start the abduction.
3. **Abduction phase (side-on cutaway of the room)** — the beam is a glowing
   cursor; drag to move it, the sleeping human (a verlet ragdoll) is pulled
   toward the beam with lag, so fast moves swing the limbs. Lift your thumb and
   the beam holds position. Guide the human to the **exit** (skylight, window,
   chimney, loading door…) which depends on the chosen entry point. Obstacles:
   furniture (solid), rotating ceiling fan (bonk!), shelves, a cat, fragile
   things. Every hit raises the Wake meter in proportion to impact speed.
   Wake meter decays slowly over time.
4. **Specimen Report** — stars and pay, then back to the Work Orders screen.

## Stars (per level, saved)

- ⭐ **Delivered** — human through the hatch.
- ⭐ **Still asleep** — never woke up.
- ⭐ **Night owl** — finish both phases under the par time.

## Progression

- **Work Orders screen** = a vertical list of cards (levels). Demo ships
  **2 playable levels**; 3 more locked teaser cards with funny names
  (*"The Gym Bro (requires: Beam Strength II)"*, *"Grandma's Bingo Night"*,
  *"A Whole Cruise Ship"*).
- Stars earn **Glorbs** (pay). Total stars set your **rank**:
  Intern (0) → Probationary Abductor (3) → Abductor (5) → Senior Abductor (6).
- **Upgrades** bought with Glorbs (demo: 2 upgrades, simple):
  - *Beam Dampener* — less limb swing (higher ragdoll damping).
  - *Hush Drive* — Suspicion and Wake meter fill 25% slower.
- Level 2 unlocks when Level 1 is delivered (any stars).
- Save in `localStorage` (`night-shift-save-v1`), tolerant of missing/bad data.

## Level 1 — "Farmer Doyle Sleeps Like a Log"

- **Flight map:** a farm at night. Barn, farmhouse, fields, a tractor, a dirt
  road with a pickup truck whose headlights sweep slowly across the yard, a
  sleeping-but-light-sleeper dog near the porch (bark radius pulses).
- **Entry A — Bedroom window** (easier, short): the room is small; route is
  bed → over a nightstand lamp → window. Obstacle: a hanging plant and a
  framed portrait of a prize cow.
- **Entry B — Chimney** (harder, faster par bonus): route goes up through the
  fireplace flue, past a hanging pot rack and a sleeping cat on a shelf (hitting
  the cat yowls: big Wake spike).
- Tutorial prompts on Level 1 only: "Drag to fly", "Let go to hover",
  "Drag to move the beam — gently!".
- Human: **Farmer Doyle**, big, in long johns, snores loudly.

## Level 2 — "Laundromat Larry, Night Attendant"

- **Flight map:** a small town street corner. Laundromat, a 24h diner with a
  flickering neon sign (inside its glow: steering scrambles slightly), a
  delivery van whose headlight cone patrols the road, rooftops, power lines
  (solid in flight: bumping into them stops you briefly).
- **Entry A — Skylight** (short, risky): a slowly turning ceiling fan sits
  right under the skylight; time the gap between blades.
- **Entry B — Loading door** (long, safer): route over rows of washers,
  a rolling towel cart that drifts back and forth, and a hanging
  "NO SLEEPING ON DUTY" sign.
- Human: **Larry**, asleep in a rolling office chair, holding a coffee mug.
  The chair stays behind; the mug might come along (Specimen Report:
  *Items stolen from Earth: 1 mug*).

## Feel targets

- Portrait 9:16 logical canvas 540×960, letterboxed; tuned for a
  375×690 CSS px phone viewport.
- 60 fps on a mid-range phone. No allocations in the physics hot path.
- One gesture everywhere: drag. Buttons are big (≥ 56 logical px).
- Restart is instant. A level attempt fits in under 2 minutes.
