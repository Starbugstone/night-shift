# Night Shift verification map

Read the [skill](../SKILL.md) for launch, doctor, pointer coordinates, and evidence. The map follows the game shell at `c50157a` and records the deep interior entry gap at that revision.

## Baseline preconditions

- Start the skill's isolated Vite and Chromium run on a free loopback port.
- Require `Doctor passed` with a fresh, empty save and the expected checkout revision.
- Use a fresh run ID and an empty context for each independent case. Use the same context across navigation and reload within a persistence case.

## Driving conventions

- Aim at visible labels on `#game` using logical 540×960 coordinates. The helper handles letterboxing and separate pointer frames.
- Use title, Work Orders, reports and memos to prove player progression. Use URL fixtures to target a room or provide a shopping balance when the recipe calls for one.
- In the driving bullets, `game` is the argument of the journey module described in the skill. Commands using `verify.mjs` run from the repository root. Replace the sample port and run ID as needed.

## Proof and skip reporting

- Keep a PNG (`game.capture`) of the action and the result, plus the input and observed state in the run's trace. Confirm save changes after a same-context reload.
- When a URL or an unlock blocks a path, record the exact entry and observed scene. A headless test covers its own assertion and leaves browser entry unverified.
- Mark which routes and cases were driven. Run each affected entry point when verifying a change shared among them.

## Feature entry contract

Each feature has a player-facing description, sub-feature IDs, entry points, harness actions with expected results, and gotchas.

## Features

- [Title, Work Orders and memos](title-work-orders.md) covers Clock in, mute, locked and unlocked cards, scroll, and memo navigation.
- [Tutorial flight and abduction](tutorial-shifts.md) covers L1 and L2 steering, ring handoff, four room exits, and restart choices.
- [Deep abduction interiors](deep-abductions.md) maps twelve implemented routes and the blocked browser entry.
- [Specimen Report and save](specimen-report.md) covers stars, pay, run statistics, retry, and saved progression.
- [Upgrades](upgrades.md) covers the Beam Shop, the two available purchases, and persistence.
- **L3/L4 deep flight runner** (multiple targets, sunrise clock, checkpoints) is **not yet in this build**. Add its journeys through `/maintain-verification-skill` when the runner lands.
