# Deep abduction interiors

Deep interiors move the camera with the specimen across interconnected rooms. Each specimen has two routes with distinct exits. Moving furniture, timed doors, secondary sleepers, lasers and security cameras make the route and timing matter.

## Sub-features

- `deep-suburb` covers Dave's roof and patio, Barb's chimney and back door, and Gary's skylight and garage door.
- `deep-downtown` covers Nigel's skylight and loading bay, Kev's vent and fire escape, and the Mayor's clock tower and elevator.
- `deep-hazards` covers timed crossings, camera and laser alarms and secondary sleeper wakes.

## How to get to it (user POV)

The standalone game has no player entry to the deep rooms at `c50157a`. The proposed isolated browser entry is `?room=<id>`. The implemented route catalog is below.

| Specimen | Route IDs |
| --- | --- |
| Dentist Dave | `dave_roof`, `dave_patio` |
| Coach Barb | `barb_chimney`, `barb_backdoor` |
| Gary | `gary_skylight`, `gary_garagedoor` |
| Night Guard Nigel | `nigel_skylight`, `nigel_loading` |
| DJ Kev | `kev_vent`, `kev_fireescape` |
| Mayor Whitlock | `mayor_clocktower`, `mayor_elevator` |

## Driving it with Playwright

Preconditions:

- A Vite instance with the requested deep room wired into its `?room=` entry. For wake-failure and report cases, the game must also start the deep rules and file the run to the appropriate level. The baseline checkout lacks these prerequisites.

- **Check entry.** Run `.claude/skills/verify-night-shift/scripts/verify.mjs 5297 dave-roof-01 dave_roof`. The command expects scene `abduct` and the requested room with a scrolling interior. At `c50157a` it reaches `title`, returns failure, and captures `unexpected-entry.png` plus the trace. Repeat using a fresh run ID for each room when checking a routing change.
- **Verify traversal once entry works.** The same command drives the room through mouse drags, recenters the finger as needed, and requires the sleeper to reach the requested exit asleep. Capture entry, the camera moving into the next room, the exit, and the stored result. Check `active.debug.interior`, camera movement and the delivered result while the scene is live.
- **Check a failure once entry works.** Use a custom journey and open `await game.open('/?room=gary_skylight', 'abduct')`. Drag into an active laser and capture the alarm and resulting failure. For a separate sleeper case, use `dave_roof` and agitate the beam close to Brenda. Check the named cause through `active.debug.result()` before the scene changes and compare it with the visible warning. Log unmet prerequisites if entry or the expected hazard rules are unavailable.
- **Check the existing headless coverage.** Run `npm test -- tests/abduct-deep.test.ts` to exercise all twelve deep paths, the hard rules, and hazard failure assertions in Vitest.

## Gotchas

- The 16 IDs in `src/contracts.ts` describe the catalog. `isRoomId` in `src/levels/levels.ts` accepts only the four tutorial IDs at this revision. The fallback is the title. The same guard also applies to the room argument of `window.__nightShift.goto`.
- The standalone abduction dev mount and headless tests exercise the room code. Track their results independently of the game's browser routing, report and save.
- Keep the browser-entry check failing until routing exists. Once it lands, verify the level assignment and hard rules as well as the room identity.
