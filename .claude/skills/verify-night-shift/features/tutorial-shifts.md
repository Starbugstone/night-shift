# Tutorial flight and abduction

The player steers a saucer to one of two rings on the target building, hovers to lock on, then drags the tractor beam through the room's obstacles to the matching exit.

## Sub-features

- `tutorial-flight` steers, brakes on release and locks on at a ring.
- `tutorial-detection` shows suspicion and restarts flight when spotted.
- `tutorial-abduct` floats Doyle or Larry to the chosen exit.
- `tutorial-restart` offers room retry, return to flight, or Work Orders.

## How to get to it (user POV)

- Clock in, select Farmer Doyle or unlocked Laundromat Larry, then choose **Start shift** on the memo.
- Hover the saucer in **Window** or **Chimney** at the farm, or **Skylight** or **Loading door** at the laundromat.
- A report's **Retry** and the abort screen's **Back to flight** return to flight. The abort screen's **Retry room** reopens that room.
- Use `?flight=1` or `?flight=2` for a flight fixture, or a room fixture to drive only the abduction.

## Driving it with Playwright

Preconditions:

- The L1 journey starts with an empty save. For L2's Work Orders entry, first deliver Doyle in that context.
- The four room IDs are `farm_window`, `farm_chimney`, `laundry_skylight`, and `laundry_loading`.

- **Start and enter a ring.** From the title, run `await game.tap(270, 686); await game.expectScene('workorders')`. Tap `(270, 354)` for L1 or `(270, 558)` for unlocked L2. Run `await game.expectScene('memo'); await game.tap(270, 894); await game.expectScene('flight')`. Run `await game.flyRing(id)` for each of the level's two room IDs in separate attempts. The flight lock capture shows the chosen ring and the next scene is `abduct`.
- **Deliver.** Continue with `await game.pilotRoom(id)`. The room identity must match the ring. The beam moves relative to the finger, the specimen leaves asleep through that exit, and a delivered report is saved. The helper captures room start, drag, result, report, and reloaded Work Orders.
- **Standalone commands.** Run `verify.mjs 5297 chimney-01 farm_chimney --from-orders` using the helper path in the skill. For each isolated room run, omit `--from-orders` and give the room ID and a fresh run ID.
- **Steer and get spotted.** Run `await game.open('/?flight=1', 'flight')` or use L2. Use `game.down(x, y)` and `game.move(x, y, frames)` to steer the saucer into the visible pickup or van headlight cone. Read `active.saucer`, `active.camX`, `active.camY`, and `active.suspicion` through `game.observe` to follow the moving cone. Capture the rising meter and the `spotted` state, release with `await game.up()`, and observe the saucer returning to its start and suspicion clearing. For L1, cover the porch dog's bark radius separately. For L2, steer into and out of the diner neon and fly into a power line to observe briefly scrambled steering and the physical stop, respectively.
- **Restart choices.** From an active room, run `await game.tap(474, 47); await game.expectScene('abort')`. Capture the choices. Tap **Retry room** at `(270, 562)` and check the same room restarts. Repeat with **Back to flight** at `(270, 662)` and **Work orders** at `(270, 754)`, checking `flight` and `workorders` respectively.

## Gotchas

- Ring poses are world coordinates. The helper reads the current camera, then translates into screen and pointer coordinates. Releasing near the ring gives the saucer time to brake and hover.
- For the normal L2 journey, build a journey module and deliver L1 first in the same context. The standalone `--from-orders` command assumes an empty save.
- `?room=` starts with zero flight time and sightings. Use memo → flight → room for the combined par and detection statistics.
- An abduction drag starts away from the HUD. You can lift and reposition the pointer while the beam holds its position.
