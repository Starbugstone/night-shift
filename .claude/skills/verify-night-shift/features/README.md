# Night Shift verification map

Read the [skill](../SKILL.md) for launch, doctor, pointer coordinates, and evidence. The map follows the game at `7d2bd29` (v2 "Deeper Shift": deep L3/L4 shifts, EN/FR, hold-to-steer abductions, rotation, souvenirs).

## Baseline preconditions

- Start the skill's isolated Vite and Chromium run on a free loopback port.
- Require `Doctor passed` with a fresh, empty save and the expected checkout revision.
- Use a fresh run ID and an empty context for each independent case. Use the same context across navigation and reload within a persistence case.

## Driving conventions

- Aim at visible labels on `#game` using logical 540×960 coordinates. The helper handles letterboxing and separate pointer frames.
- Use title, Work Orders, reports and memos to prove player progression. Use URL fixtures to target a room or provide a shopping balance when the recipe calls for one.
- In the driving bullets, `game` is the argument of the journey module described in the skill. Commands using `verify.mjs` run from the repository root. Replace the sample port and run ID as needed.
- The runner's pointer is a mouse, so abductions steer by pointing: hold the button where the beam should go. Drive rooms with `debug.autopilotFinger()` (or `pilotRoom`).

## Proof and skip reporting

- Keep a canvas PNG of the action and the result, plus the input and observed state in the run's trace. Confirm save changes after a same-context reload.
- When a URL or an unlock blocks a path, record the exact entry and observed scene. A headless test covers its own assertion and leaves browser entry unverified.
- Mark which routes and cases were driven. Run each affected entry point when verifying a change shared among them.

## Feature entry contract

Each feature has a player-facing description, sub-feature IDs, entry points, harness actions with expected results, and gotchas.

## Features

- [Title, Work Orders and memos](title-work-orders.md) covers Clock in, mute, the four work orders and three teasers, lock notices, scroll, and memo navigation.
- [Language](language.md) covers the EN/FR toggle, `?lang=`, persistence, and the French art.
- [Tutorial flight and abduction](tutorial-shifts.md) covers L1 and L2 steering, ring handoff, four room exits, and restart choices.
- [Abduction controls](abduction-controls.md) covers hold-to-steer, rotation, souvenirs, and the Snooze Ray, in tutorial and deep rooms.
- [Deep abduction interiors](deep-abductions.md) covers the twelve L3/L4 routes, their hazards and failures, prop cues, and `?room=` entry.
- [Deep shifts](deep-shifts.md) covers the L3/L4 flight runner: sunrise clock, fuse, spotted respawn, checkpoints, ring locks, the choice screen, and the deep report.
- [Specimen Report and save](specimen-report.md) covers stars, pay, run statistics, retry, and saved progression.
- [Upgrades](upgrades.md) covers the Beam Shop's four purchases, persistence, and their effects.
