# Night Shift · Town pickups

Each town map can have one optional, hand-placed pickup. It can be an object or a cameo character, and it gives Vrell something extra to write about. Spin City is the first map with one. The existing room souvenirs and L8's roaming ape quotas keep their own rules and report entries.

## Finding and collecting

- Fly close enough to spot the prop and its four-point mint glint. Its silhouette should read at phone size against the ground. The glint stays lit under reduced motion. L1 and L2 use this world marker. Maps with a minimap also show one mint diamond, separate from the round specimen marks, with no bearing arrow or additional HUD chip.
- Slow to **110 logical px/s or less** and hover within **48 logical px** of the prop for **one second**. This uses the same `LockOn` thresholds and drain as a roaming ape. A segmented mint arc fills around the pickup and drains at twice the fill speed when the hover breaks. The active specimen ring takes priority anywhere the two catchments overlap.
- The prop and its marker disappear when the lock completes. A mint pulse, the existing pickup chime and a short confirmation toast acknowledge the pickup. The toast stays visible without animation in reduced-motion mode. Control stays live throughout, so you can move off immediately.
- The detour costs travel time and the hover itself. Detectors, scrutiny and wire/obstacle stun still apply. A sighting interrupts an unfinished pickup, and a stunned saucer cannot build hover progress. A finished pickup stays aboard through a sighting or a return from a room during the same shift. It gives no spawn point, shield, fuse reset, Glorbs or star.

## Time, stars and placement

Tutorial Night owl uses the normal scored flight and abduction time, including the detour on that flight. Deep shifts keep their shared sunrise clock running during the detour and hover, including the L8 countdown. Ghost uses the ordinary spotting and failed-abduction rules for the shift. If the optional detour costs time or makes the player get spotted, the usual consequences apply. A pickup never unlocks a route or gets counted toward a delivery or troop quota.

Place the pickup off the main approach and outside entry rings, their labels and L8's moving trails. Let the player see the prop from a place where they can back out. Start with roughly 160 logical px between entry and pickup centres, then check the actual pills and moving hazard geometry. On deep maps, keep the diamond about 12 minimap px from neighbouring objective markers. A van cone or lighthouse sweep can make the detour interesting if there's a readable safe approach and a full second to hover. Where sweeps overlap, check a safe wait point, the hover window and an exit with the actual fuse rules. Keep the whole hover pocket clear of wires, bump areas and the edge of the map.

At 375×690 CSS px, verify the sparkle against each ground type, the lock arc against the hull and the report with long French names and room items. Avoid roof edges and other decorative glints that can obscure the prop. Test a clean detour and the normal skip route with no upgrades. Run the difficulty evaluator for the relevant map and keep the naive beeline caught at every tested start time. For L8, also confirm there is a plausible detour with 25 seconds left at delivery before adding the pickup.

## Spin City

A portable SETI dish stands on the south verge of the east–west street at **(744, 1534)**. It's east of Main Street, in view from spawn, and before the wires and delivery-van crossing. Players can swing east to try the hover, then come back to the usual gap. The dish is clear of both laundromat routes and of the parked time car, which still sits in the back lot.

| Copy | English | Français |
| --- | --- | --- |
| Pickup toast | Collected: SETI dish | Parabole SETI récupérée ! |
| Report label | Town pickup | Trouvaille en ville |
| Collected | SETI dish · collected | Parabole SETI · récupérée |
| Missed | SETI dish · left behind | Parabole SETI · laissée sur place |
| Vrell, collected on a repeat delivery | The dish picked up three prime numbers and a request to move our van. | La parabole a capté trois nombres premiers et une demande de déplacer notre camionnette. |

The row appears on every filed report for a map with a pickup. It describes this run, even if a prior report recorded the find. A collected pickup can supply Vrell's line on a successful repeat delivery. First-clear sign-offs, failure comments and the sunrise memo keep priority. Missed pickups still give the usual room souvenir or shift comment.

## Filing and replay

Keep one optional pickup ID on each level's progress in `night-shift-save-v2`. A report that logs a new pickup records it even on a failed delivery or at sunrise. Quitting before filing clears the current shift's cargo. Older saves load with no pickup recorded, and a later missed pickup leaves the earlier record intact. A new shift has the pickup available again. A future Bureau cabinet could use the recorded IDs to show finds by level. The report is the only collection screen in this release.

## Pickup proposals by map

| Map | Pickup | Candidate placement and Vrell's note |
| --- | --- | --- |
| **L1 · Doyle Farm** | Mashed-potato mountain mould, a *Close Encounters* nod | On the inside edge of the west starting field, between the spawn and the west approach. Move it clear of the warm house light and the dog. Add it after L2's cue proves readable so the opening drag lesson can stay simple. “One mountain, instant. First contact takes longer.” |
| **L2 · Spin City** | Portable SETI dish, a *Contact* nod | On the south verge as described above. A safe early stop with the delivery-van crossing still ahead. |
| **L3 · Maple Court** | Night-bus astronomer who volunteered for first contact with a thermos and a folding sign | At a pullout on the south side of Birch Lane, east of the crop-circle field. Keep the stop outside the porch triggers and away from Gary's CCTV. The character volunteers, and the Bureau supplies the joke. “They asked for a lift. Finance has asked me how far.” |
| **L4 · Grimsby city centre** | Municipal ghost meter, a *Ghostbusters* nod | At the inside edge of the south park. Approach from within the park, away from tram wires and the ring road. Check the roaming helicopter's safe window and leave room to back away from the searchlight. “It says we have three ghosts and an overdue parking ticket.” |
| **L5 · Barnacle Bay** | Inflatable shark fin on a mooring lead, a *Jaws* nod | In the sheltered fish-market slip, with the tether on dry decking. Use a verified lighthouse shadow or repeatable dark window and stay clear of the patrol lane and bunting. “Harbour patrol confirms the fin is a rental.” |
| **L6 · St. Mildred's** | An unbranded defibrillator marked `FOR THE MACHINE`, a *Frankenstein* nod | On a service-side trolley off the southern drop-off lane, across from the Endoscopy Wing. Keep its full hover pocket outside the ambulance bay triggers, CCTV and approach to the doors. “The machine is alive. Its service contract expired last Tuesday.” |
| **L7 · SS Buffet Royale** | Gold-plated serving tray, an *Ocean's Eleven* nod | On the aft port promenade, off the main deck line. Put the glint against clear planks and check the photographer, the steward patrol and the gull path for a repeatable hover window. Keep it away from the waterline iceberg cameo. “Three specialists. One tray. I want the receipt.” |
| **L8 · Patent Valley** | Stone stamp marked with an open palm, a *Planet of the Apes* nod | On the east shelf north of Reed's bandstand, initially around (1290, 570). Check the nearest slab belt, all patrol positions and the minimap. It's a short side trip for a player passing Reed on the way to Echo. “They invented the form before the desk. We respect the order of operations.” |

Give cameo characters original silhouettes and fictional names. Film nods can come from the prop or its premise. Use original dialogue, graphics and sound. The [science fiction reference notes](research/scifi-references.md) and [film reference notes](research/film-references.md) carry more examples.
