# Flight art anchors

Coordinates are feature centres in native sprite pixels, measured from the top left. North is up. For a scaled sprite, multiply each coordinate by the corresponding draw-size/native-size ratio before adding its world-space top-left position.

| Sprite in `flight/` | Feature | Centre (x, y) |
| --- | --- | --- |
| `dave_house_top` | `roof_hatch` | (73, 69) |
| `dave_house_top` | `patio_door` | (188, 189) |
| `barb_house_top` | `chimney` | (70, 116) |
| `barb_house_top` | `back_door` | (199, 25) |
| `gary_house_top` | `garage_skylight` | (199, 77) |
| `gary_house_top` | `garage_door` | (225, 183) |
| `pruitt_house_top` | `watcher_window` | (145, 123) |
| `museum_top` | `skylight` | (122, 94) |
| `museum_top` | `loading_bay` | (332, 161) |
| `club_top` | `roof_vent` | (195, 76) |
| `club_top` | `fire_escape` | (27, 162) |
| `cityhall_top` | `clock_tower` | (250, 84) |
| `cityhall_top` | `elevator_housing` | (83, 184) |

The helicopter rotor turns about (110, 110) in its own sprite and mounts at (100, 100) on the body. The crane boom turns about (60, 25).

## v3 hero buildings (L5–L7)

Set by the coordinator before the art was drawn, so art and entry rings agree. Artists: draw each
feature centred on these points. Code: place entry rings with `anchor()` on them.

| Sprite in `flight/` | Feature (route) | Centre (x, y) |
| --- | --- | --- |
| `marine_park_top` | `roof_panel` (bubbles_roof) | (250, 70) |
| `marine_park_top` | `service_tunnel` (bubbles_tunnel) | (60, 250) |
| `lighthouse_top` | `lamp_gallery` (pete_gallery) | (110, 62) |
| `lighthouse_top` | `slipway` (pete_slipway) | (110, 198) |
| `fish_market_top` | `loft_hatch` (sal_loft) | (80, 60) |
| `fish_market_top` | `dock_door` (sal_dock) | (284, 150) |
| `endoscopy_wing_top` | `front_doors` (hank_front) | (160, 224) |
| `endoscopy_wing_top` | `rear_entrance` (hank_rear) | (250, 18) |
| `oncall_block_top` | `helipad` (osei_helipad) | (90, 90) |
| `oncall_block_top` | `pharmacy_hatch` (osei_pharmacy) | (246, 160) |
| `recovery_ward_top` | `recovery_window` (pemberton_window) | (230, 204) |
| `recovery_ward_top` | `laundry_chute` (pemberton_chute) | (16, 110) |
| `ship_bridge_top` | `mast_hatch` (captain_mast) | (90, 60) |
| `ship_bridge_top` | `funnel` (captain_funnel) | (250, 110) |
| `ship_galley_top` | `skylight` (marco_skylight) | (140, 60) |
| `ship_galley_top` | `promenade_door` (marco_promenade) | (268, 160) |
| `ship_lido_top` | `awning` (greg_awning) | (90, 70) |
| `ship_lido_top` | `cabin_porthole` (greg_cabin) | (300, 206) |

## v3 L7 ship sections and room props (added by art)

The three sections stack with no overlap: `ship_bow_top` (900×720), any number of `ship_mid_top`
(900×540), then `ship_stern_top` (900×600), all at the same x. At every join the hull runs from x 6
to 894, the deck from x 32 to 868, the rail sits at x 42 and 858 (posts every 60 px, the first one
30 px from each join) and the painted jogging lane at x 132 and 768.

| Sprite | Feature | Centre (x, y) |
| --- | --- | --- |
| `flight/ship_mid_top` | lifeboat stations, west (draw `lifeboat_top` centred here) | (44, 135), (44, 405) |
| `flight/ship_mid_top` | lifeboat stations, east | (856, 135), (856, 405) |
| `flight/ship_bow_top` | windlass | (450, 268) |
| `flight/ship_bow_top` | bow tip / jackstaff | (450, 8) / (450, 92) |
| `flight/ship_stern_top` | ensign staff (the wake starts below y 594) | (450, 552) |
| `flight/ship_bridge_top` | radar dish (decor) | (166, 60) |
| `flight/funnel_top` | mouth | (72, 70) |
| `room/plumb_dial` | needle pivot; scale arc radius 48, end ticks at ±30° from straight down | (40, 24) |
| `room/soup_pot` | open mouth; inner half-width 41, half-height 10 | (60, 23) |
| `room/ships_wheel` | hub (turns about it) | (60, 60) |
| `room/exit_porthole` | opening, radius 33 | (66, 60) |

`room/lounger` has its raised back on the left (head end), like `room/bed`. `room/chart_lamp`,
`room/hanging_ladles` and `room/lifebuoy` hang from the top-centre of their box.

## v3 L5 pier: dolphin rig, roofs and room props (added by art)

The dolphin parts mix two conventions. Head and torso are drawn lying down (nose right, belly down)
and their bone runs along the sprite's x axis. Tail stock, fluke and flipper hang like human limbs:
bone down the sprite's y axis, joint at top-centre.

| Sprite in `human/` | Joint | Point (x, y) |
| --- | --- | --- |
| `bubbles_head`, `bubbles_head_awake` | chest (neck end) → snout | (8, 32) → (70, 34) |
| `bubbles_torso` | belly → chest | (8, 50) → (92, 50) |
| `bubbles_tail` | belly (top) → fluke joint | (20, 5) → (20, 75) |
| `bubbles_fluke` | tail-stock joint (top); lobes spread sideways | (38, 5) |
| `bubbles_flipper` | chest (top) | (13, 5) |

The belly side of the hanging parts is the sprite's right edge, so with the limb rotation the human
rig uses (`atan2 − π/2`) a nose-right dolphin has its belly down. Draw order: far flipper, fluke,
tail, torso, head, near flipper. The dorsal fin is on the torso's top edge (x 33–74, y 2–26) and
the sleeping "z" sits above the head (x 14–26, y 0–11); both are outside the collision circles.

| Sprite | Feature | Centre (x, y) |
| --- | --- | --- |
| `flight/lighthouse_top` | lamp / beam origin (gallery outer radius 64) | (110, 110) |
| `flight/marine_park_top` | show pool (water radius 57, tiled rim to 66) | (180, 178) |
| `flight/marine_park_top` | sea-lion rocks | (308, 166) |
| `flight/fish_market_top` | roof ridge runs east–west at | y = 99 |
| `flight/chip_kiosk_top` | lamp over the serving hatch | (50, 58) |
| `flight/boat_moored_top` | mast | (35, 60) |
| `flight/patrol_boat_top` | bow searchlight | (40, 30) |
| `flight/harbour_crane_top` | slew ring (jib points north-east, tip at (121, 24)) | (44, 92) |
| `room/show_pool` | still water line (code draws the wavy surface here); pool floor at y 140, rim pillars x 0–28 and 512–540 | y = 18 |
| `room/hoop` | ring centre (clear opening radius 39); rope pivot at (60, 2) | (60, 87) |
| `room/fresnel_lens` | bullseye (the light cone starts here) | (80, 80) |
| `room/freezer_hook` | rail runs through y 3–10; hook tip | (37, 42) |
| `room/mop_bucket` | water surface (x 12–68) | (40, 47) |
| `room/sprinkler_head` | nozzle | (20, 28) |
| `room/ledger_desk` | desk top surface at y 54; open ledger | (132, 50) |
| `room/porthole_tank` | glass centre, radius 64 | (90, 90) |

`room/crab_pots`, `room/hanging_scales` and `room/counterweight_lighthouse` hang from the top-centre
of their box. `room/rocking_chair` faces right (sitter's back on the left, seat at y ≈ 84).
`room/show_pool` water is translucent, so it can be drawn in front of a body. Both Barnacle poses
and both Kipper poses stand on the same base (rock, crate lid) flush with the bottom of the box.
The backdrops follow the deep-room layout (wall above y 602, baseboard and floor below); the jelly
tanks and the lamp-room windows sit at x 135 and 405 so the mirrored tile repeats evenly.
