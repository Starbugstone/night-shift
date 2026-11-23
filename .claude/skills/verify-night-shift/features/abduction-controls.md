# Abduction controls

In every room the player holds a finger or the mouse button where the specimen should go; the beam heads for that point, faster the further away it is, and stops when the pointer rests on it or is lifted. The specimen can be turned. Swinging the body past the room's loose item takes it home as a souvenir. With the Snooze Ray, a double-tap calms every sleeper once per room.

## Sub-features

- `steer-hold` the beam heads for the held pointer's world point (14 px dead zone, 30–260 px/s, `src/abduct/point.ts`). In the houses the camera follows the body, so a pointer held to one side keeps it travelling.
- `steer-release` lifting the pointer stops the beam; the next press anywhere (except RESTART or a TURN button) is a new target.
- `turn` rotates the specimen: TURN buttons, mouse wheel, Q/E or A/D (by key position, so AZERTY works), right-button drag, two-finger twist. A turn hint names the controls for the input type.
- `souvenir-grab` grabbing the loose item pops a mint "+1 slipper" label with a pickup sound, in every room.
- `souvenir-hint` levels 1 and 2 only: 0.6 s after the first lift the item glints under a mint chevron and the prompt reads "Souvenir! Swing past the glinting item." for up to 8 s or until grabbed.
- `snooze` with the Snooze Ray owned, a double-tap knocks 40 off every wake meter, once per room.

## How to get to it (user POV)

- Any abduction: a tutorial ring, a deep-shift ring, or `?room=<id>`.
- TURN buttons: top left of tutorial rooms (centres (45,117) and (115,117)); bottom corners of deep rooms (centres (45,912) and (495,912)).

## Driving it with Playwright

Preconditions: a room in an empty context. Real pointer input in the runner is a mouse, which steers by pointing; headless Vitest input without a pointer kind keeps the old 1:1 drag.

- **Hold still.** In `farm_window` (fixed camera), read the beam, then `game.down(beamX + 10, beamY - 70)` and step without moving. The beam travels while the pointer is still and settles within ~15 px of it, then holds. `game.up()` and step: the beam does not move.
- **Hold still in a house.** In `dave_patio`, press 120 px right of the specimen's screen position and step 240 frames without moving: the chest keeps travelling (about 170 px per 2 s), and lifting stops the beam. For the touch path, open a CDP session on `game.page`, enable `Emulation.setTouchEmulationEnabled`, and send `Input.dispatchTouchEvent` points mapped through the canvas letterbox (`#game` bounding box, scale `min(w/540, h/960)`).
- **Turn.** Hold the TURN button `(115,117)` for 20 frames: `active.debug.body.tilt` increases and the beam does not move. `game.page.keyboard.down('KeyQ')` for 20 frames turns the other way. Capture the mint turn arc.
- **Souvenir.** Pilot `farm_window` or `laundry_loading` with `autopilotFinger`. Capture the hint ~0.8 s after the first lift (`active.debug.moved`), then the pop when `active.debug.itemSeq` becomes 1. The report's items row lists the item.
- **Souvenir pop in a house.** In `dave_patio`, hold just above `active.debug.item` until `item.captured`: "+1 orthodontic slipper" pops and no souvenir hint is shown.
- **Snooze.** Buy the Snooze Ray, open a deep room, tap twice within 0.32 s near the beam: `snoozeUsed` becomes true and `snoozePulse > 0`.

## Gotchas

- Keep pointer targets clear of RESTART (422–526 × 16–78) and the TURN buttons, or the press does something else.
- `body.turn` is clamped to 1.4 rad ahead of the current tilt; compare tilt differences, not absolute angles.
- The hint and pop labels are canvas text; check them by eye in the PNGs.
- Headless coverage: `tests/abduct-touch.test.ts` (every room delivered by pointing), `abduct-precision.test.ts` (mouse follow, every room), `abduct-turn.test.ts`, `abduct-input.test.ts`, `abduct-souvenir.test.ts`.
