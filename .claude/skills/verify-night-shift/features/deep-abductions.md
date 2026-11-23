# Deep abduction interiors

Deep interiors move the camera with the specimen across connected rooms. Each L3/L4 specimen has two routes with distinct exits. Swinging props, fans, gears, timed gates and doors, patrols, fragile props, creaky stairs, speakers, drafts, lasers and sweeping cameras make the route and timing matter. Rules are hard: the specimen waking, a second sleeper waking (Brenda, Biscuit, Tiny), touching an active laser or one second in a camera cone fails the attempt. Each house has one pop-culture prop whose sleep-talk line plays once after the lift.

## Sub-features

- `deep-suburb` covers Dave's roof and patio, Barb's chimney and back door, and Gary's skylight and garage door (L3).
- `deep-downtown` covers Nigel's skylight and loading bay, Kev's vent and fire escape, and the Mayor's clock tower and elevator (L4).
- `deep-hazards` covers timed crossings, camera and laser alarms (`alarm`), specimen wakes (`woke`) and second-sleeper wakes (`sleeper`).
- `deep-outcome` delivery returns to flight at the ring's checkpoint; a failure or RESTART opens the choice screen (Retry / Back to flight / Abandon shift).
- `deep-props` the prop cue (poster, potato butte, pennant, 42 towel, tripod single, pilot bobblehead) and the souvenir pop.

## How to get to it (user POV)

- In a deep shift ([deep shifts](deep-shifts.md)), hover a target's ring to lock on; the iris dives into that house.
- For isolated checks, `?room=<id>` (or `goto('abduct', id)`) starts that route as the first leg of its level's shift, with the deep rules.

| Specimen | Level | Route IDs |
| --- | --- | --- |
| Dentist Dave | L3 | `dave_roof`, `dave_patio` |
| Coach Barb | L3 | `barb_chimney`, `barb_backdoor` |
| Gary | L3 | `gary_skylight`, `gary_garagedoor` |
| Night Guard Nigel | L4 | `nigel_skylight`, `nigel_loading` |
| DJ Kev | L4 | `kev_vent`, `kev_fireescape` |
| Mayor Whitlock | L4 | `mayor_clocktower`, `mayor_elevator` |

## Driving it with Playwright

Preconditions: an empty context per route.

- **Deliver a route.** Run `.claude/skills/verify-night-shift/scripts/verify.mjs 5297 dave-roof-01 dave_roof`. The helper checks the room identity and `deep`, records `rules` (`{wakeFails:true, hard:true}`), pilots the route with `autopilotFinger`, requires delivery asleep, then expects `flight` with `run.delivered` tallying one and the save unchanged. Captures: room start, mid-route, the exit, back to flight. Proven at `7d2bd29` (57 s, `delivered: [true,false,false]`, checkpoint at the roof ring).
- **Fail on a laser.** Custom journey: `await game.open('/?room=gary_skylight', 'abduct')`, pilot with `autopilotFinger`, and when the chest passes x 340 with `interior.hazards.find(h => h.spec.name === "Gary's laser").level === 1`, point 190 px right of the beam. Expect `result().failReason === 'alarm'` and `failBy === "Gary's laser"`, then `expectScene('choice', 90)` titled **ALARM!**. Tap **Back to flight** at `(270,714)` and expect `flight`. Proven at `7d2bd29`.
- **Camera failure.** `?room=gary_garagedoor`, point the beam right into the cone near world x 1226: `failBy === "Gary's camera"` after one second of exposure.
- **Prop cue.** Lift the specimen in any route and step ~1.5 s while still in the start room: `active.debug.mumble` equals the prop's line (e.g. Gary: "The truth is out there. Lock the back door."; in French « La vérité est ailleurs. Pense à fermer à clé. »).
- **Headless coverage.** `npm test -- tests/abduct-deep.test.ts` (all twelve routes plus training rooms under hard rules), `abduct-touch.test.ts`, `abduct-precision.test.ts`, `abduct-prop-cues.test.ts`, and `npm run difficulty` (L3 band for human-model players).

## Gotchas

- A deep room opened by `?room=` is one leg of a shift: no report and no save until three deliveries or sunrise. Use [deep shifts](deep-shifts.md) for reports, stars and persistence.
- Keep pointer targets out of RESTART (top right) and the bottom-corner TURN buttons (y 881–943); the helper clamps y to 90–870.
- RESTART in a deep room opens the choice screen, not the tutorial abort screen.
- The sunrise clock keeps running inside the room (slot at (202,86)); a sunrise mid-room ends the shift on the report.
