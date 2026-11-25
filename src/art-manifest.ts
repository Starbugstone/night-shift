// Every art key the game may request, with its native size in logical px.
// Files live at public/art/<key>.svg. Code draws each sprite stretched into a
// rect of this size (or a size derived from it), so the art's viewBox MUST be
// exactly `0 0 w h`. Missing files are allowed: code falls back to primitives.

export interface ArtSpec {
  w: number;
  h: number;
}

export const ART: Record<string, ArtSpec> = {
  // ---- flight (top-down, seen from directly above; "up" in the image = north)
  'flight/saucer_top': { w: 160, h: 160 },
  'flight/entry_ring': { w: 120, h: 120 },
  'flight/ground_farm': { w: 540, h: 540 }, // seamless tile
  'flight/ground_town': { w: 540, h: 540 }, // seamless tile
  'flight/road_v': { w: 120, h: 540 }, // tiles vertically
  'flight/road_h': { w: 540, h: 120 }, // tiles horizontally
  'flight/dirt_road_v': { w: 120, h: 540 }, // farm track, tiles vertically (edges transparent)
  'flight/dirt_road_h': { w: 540, h: 120 }, // farm track, tiles horizontally
  'flight/farmhouse_top': { w: 260, h: 220 },
  'flight/barn_top': { w: 240, h: 260 },
  'flight/field_rows': { w: 300, h: 300 },
  'flight/tractor_top': { w: 90, h: 130 },
  'flight/tree_top': { w: 140, h: 140 },
  'flight/haybale_top': { w: 60, h: 60 },
  'flight/pickup_top': { w: 80, h: 150 }, // nose points up (north)
  'flight/dog_top': { w: 70, h: 70 }, // curled up asleep
  'flight/laundromat_top': { w: 300, h: 240 },
  'flight/diner_top': { w: 260, h: 220 },
  'flight/house_top': { w: 200, h: 180 },
  'flight/van_top': { w: 90, h: 170 }, // nose points up (north)
  'flight/streetlight_top': { w: 40, h: 40 },

  // ---- abduction rooms (side-on cutaway)
  'room/bg_bedroom': { w: 540, h: 960 },
  'room/bg_chimney': { w: 540, h: 960 },
  'room/bg_laundry': { w: 540, h: 960 },
  'room/exit_window': { w: 160, h: 200 },
  'room/exit_chimney_top': { w: 140, h: 120 },
  'room/exit_skylight': { w: 200, h: 80 },
  'room/exit_loading_door': { w: 180, h: 240 },
  'room/bed': { w: 300, h: 140 },
  'room/nightstand': { w: 90, h: 110 },
  'room/lamp': { w: 60, h: 90 },
  'room/hanging_plant': { w: 80, h: 140 },
  'room/portrait_cow': { w: 120, h: 100 },
  'room/fireplace': { w: 260, h: 220 },
  'room/pot_rack': { w: 220, h: 80 },
  'room/shelf': { w: 160, h: 24 },
  'room/cat_sleeping': { w: 90, h: 50 },
  'room/cat_awake': { w: 90, h: 70 },
  'room/fan_blade': { w: 220, h: 28 }, // one blade, hub end at left-middle
  'room/fan_hub': { w: 50, h: 50 },
  'room/washer': { w: 120, h: 130 },
  'room/towel_cart': { w: 140, h: 130 },
  'room/sign_no_sleeping': { w: 200, h: 70 },
  'room/office_chair': { w: 110, h: 150 },
  'room/coffee_mug': { w: 30, h: 30 },
  'room/slipper': { w: 40, h: 20 },

  // ---- humans: ragdoll parts (side view). Limb parts are vertical, the joint
  // (shoulder / elbow / hip / knee) at top-centre, extending down. Torso: neck
  // at top-centre, hips at bottom-centre. Head: neck at bottom-centre.
  'human/doyle_head': { w: 70, h: 80 },
  'human/doyle_head_awake': { w: 70, h: 80 },
  'human/doyle_torso': { w: 80, h: 120 },
  'human/doyle_upper_arm': { w: 26, h: 60 },
  'human/doyle_lower_arm': { w: 24, h: 60 },
  'human/doyle_upper_leg': { w: 32, h: 70 },
  'human/doyle_lower_leg': { w: 30, h: 72 },
  'human/larry_head': { w: 70, h: 80 },
  'human/larry_head_awake': { w: 70, h: 80 },
  'human/larry_torso': { w: 80, h: 120 },
  'human/larry_upper_arm': { w: 26, h: 60 },
  'human/larry_lower_arm': { w: 24, h: 60 },
  'human/larry_upper_leg': { w: 32, h: 70 },
  'human/larry_lower_leg': { w: 30, h: 72 },

  // ---- UI
  'ui/logo': { w: 480, h: 200 },
  'ui/vrell_portrait': { w: 200, h: 200 },
  'ui/zib_portrait': { w: 200, h: 200 },
  'ui/stamp_delivered': { w: 240, h: 120 },
  'ui/stamp_failed': { w: 240, h: 120 },
  'ui/star_full': { w: 64, h: 64 },
  'ui/star_empty': { w: 64, h: 64 },
  'ui/glorb': { w: 48, h: 48 },
  'ui/dream_sheep': { w: 60, h: 50 },
  'ui/dream_sandwich': { w: 60, h: 50 },
  'ui/dream_taxform': { w: 60, h: 50 },
  'ui/zzz': { w: 40, h: 40 },
  'ui/upgrade_dampener': { w: 96, h: 96 },
  'ui/upgrade_hush': { w: 96, h: 96 },

  // =====================================================================
  // v2 "Deeper Shift" (docs/GDD-2-deeper.md). Sections below were listed up
  // front by the coordinator. Code owners may APPEND keys in their own marked
  // section at the end; never rename existing keys.
  // =====================================================================

  // ---- v2 flight: suburbia (L3) and downtown (L4)
  'flight/ground_suburb': { w: 540, h: 540 }, // seamless lawn/garden tile, low contrast
  'flight/ground_city': { w: 540, h: 540 }, // seamless pavement/plaza tile, low contrast
  'flight/sidewalk_v': { w: 40, h: 540 }, // kerb strip, tiles vertically
  'flight/sidewalk_h': { w: 540, h: 40 },
  'flight/house_suburb_a': { w: 200, h: 180 },
  'flight/house_suburb_b': { w: 220, h: 170 },
  'flight/house_suburb_c': { w: 180, h: 200 },
  'flight/dave_house_top': { w: 260, h: 220 }, // 2-storey; roof hatch + patio door (south) visible
  'flight/barb_house_top': { w: 260, h: 200 }, // bungalow; chimney + back door/dog flap (north) visible
  'flight/gary_house_top': { w: 300, h: 220 }, // house + big attached garage (skylight on garage roof, garage door south); CCTV signs
  'flight/pruitt_house_top': { w: 220, h: 190 }, // Mrs Pruitt's: one lit upstairs window (watcher sits here)
  'flight/pool_top': { w: 160, h: 100 },
  'flight/trampoline_top': { w: 90, h: 90 },
  'flight/sprinkler_top': { w: 40, h: 40 },
  'flight/porch_light_top': { w: 30, h: 30 }, // small wall lamp, seen from above (unlit)
  'flight/hedge_h': { w: 200, h: 40 },
  'flight/police_top': { w: 80, h: 150 }, // police cruiser, nose north, light bar on roof
  'flight/sedan_top': { w: 80, h: 150 },
  'flight/taxi_top': { w: 80, h: 150 },
  'flight/helicopter_top': { w: 200, h: 200 }, // body, nose north; rotor drawn separately
  'flight/helicopter_rotor': { w: 220, h: 220 }, // 2 blades, centred, semi-transparent blur
  'flight/museum_top': { w: 360, h: 280 }, // columns/pediment south; big glass skylight; loading bay east
  'flight/club_top': { w: 280, h: 240 }, // flat roof with vent fan; fire escape on west wall
  'flight/cityhall_top': { w: 340, h: 300 }, // dome or clock tower (round, north-east), elevator housing on roof
  'flight/highrise_a': { w: 240, h: 240 }, // flat roof: AC units, water tank
  'flight/highrise_b': { w: 200, h: 280 },
  'flight/highrise_c': { w: 280, h: 200 },
  'flight/office_window_lit': { w: 40, h: 24 }, // overlay drawn on highrise roofs' south edge when an insomniac is in
  'flight/crane_base': { w: 120, h: 120 }, // tower top seen from above
  'flight/crane_boom': { w: 520, h: 50 }, // lattice jib; pivot at x=60,y=25, extends right
  'flight/billboard_top': { w: 220, h: 50 },
  'flight/security_cam_top': { w: 40, h: 40 }, // rooftop camera, lens points north (rotated by code)
  'flight/pigeon_flock': { w: 120, h: 90 }, // 6-8 pigeons, wings out
  'flight/bat_flock': { w: 120, h: 90 },
  'flight/park_top': { w: 400, h: 300 }, // little plaza park: paths, fountain, benches
  'flight/tram_wire_h': { w: 540, h: 20 }, // overhead wires, tiles horizontally

  // ---- v2 humans: same rig and conventions as doyle/larry.
  // dave: thin dentist, striped pyjamas with tooth print, teeth-whitening tray, comb-over.
  // barb: stocky sports coach, tracksuit, whistle on lanyard, short grey perm.
  // gary: neighbourhood-watch guy, hi-vis vest over dressing gown, binoculars round neck, moustache.
  // nigel: old museum night guard, navy uniform, peaked cap, big ears.
  // kev: DJ, headphones round neck, sunglasses on forehead, oversized hoodie.
  // mayor: mayor Whitlock, three-piece suit, ceremonial gold chain, impressive eyebrows.
  'human/dave_head': { w: 70, h: 80 },
  'human/dave_head_awake': { w: 70, h: 80 },
  'human/dave_torso': { w: 80, h: 120 },
  'human/dave_upper_arm': { w: 26, h: 60 },
  'human/dave_lower_arm': { w: 24, h: 60 },
  'human/dave_upper_leg': { w: 32, h: 70 },
  'human/dave_lower_leg': { w: 30, h: 72 },
  'human/barb_head': { w: 70, h: 80 },
  'human/barb_head_awake': { w: 70, h: 80 },
  'human/barb_torso': { w: 80, h: 120 },
  'human/barb_upper_arm': { w: 26, h: 60 },
  'human/barb_lower_arm': { w: 24, h: 60 },
  'human/barb_upper_leg': { w: 32, h: 70 },
  'human/barb_lower_leg': { w: 30, h: 72 },
  'human/gary_head': { w: 70, h: 80 },
  'human/gary_head_awake': { w: 70, h: 80 },
  'human/gary_torso': { w: 80, h: 120 },
  'human/gary_upper_arm': { w: 26, h: 60 },
  'human/gary_lower_arm': { w: 24, h: 60 },
  'human/gary_upper_leg': { w: 32, h: 70 },
  'human/gary_lower_leg': { w: 30, h: 72 },
  'human/nigel_head': { w: 70, h: 80 },
  'human/nigel_head_awake': { w: 70, h: 80 },
  'human/nigel_torso': { w: 80, h: 120 },
  'human/nigel_upper_arm': { w: 26, h: 60 },
  'human/nigel_lower_arm': { w: 24, h: 60 },
  'human/nigel_upper_leg': { w: 32, h: 70 },
  'human/nigel_lower_leg': { w: 30, h: 72 },
  'human/kev_head': { w: 70, h: 80 },
  'human/kev_head_awake': { w: 70, h: 80 },
  'human/kev_torso': { w: 80, h: 120 },
  'human/kev_upper_arm': { w: 26, h: 60 },
  'human/kev_lower_arm': { w: 24, h: 60 },
  'human/kev_upper_leg': { w: 32, h: 70 },
  'human/kev_lower_leg': { w: 30, h: 72 },
  'human/mayor_head': { w: 70, h: 80 },
  'human/mayor_head_awake': { w: 70, h: 80 },
  'human/mayor_torso': { w: 80, h: 120 },
  'human/mayor_upper_arm': { w: 26, h: 60 },
  'human/mayor_lower_arm': { w: 24, h: 60 },
  'human/mayor_upper_leg': { w: 32, h: 70 },
  'human/mayor_lower_leg': { w: 30, h: 72 },

  // ---- v2 second sleepers (single sprites, not ragdolls)
  'room/brenda_asleep': { w: 140, h: 70 }, // lying in bed, head on pillow, curlers, eye mask; drawn on top of bed
  'room/brenda_awake': { w: 140, h: 90 }, // bolt upright, mask pushed up, furious
  'room/biscuit_asleep': { w: 100, h: 60 }, // fat basset hound curled in a dog bed
  'room/biscuit_awake': { w: 100, h: 80 }, // head up, ears flying, barking
  'room/tiny_asleep': { w: 120, h: 190 }, // huge bouncer slumped on a stool, arms folded
  'room/tiny_awake': { w: 120, h: 200 }, // standing up, cracking knuckles

  // ---- v2 room backdrops: atmosphere only (wall, floor, light), no furniture or exits.
  // Drawn "cover"-fit and clipped into each room rect, so keep detail evenly spread.
  'room/bg_suburb_bedroom': { w: 540, h: 720 },
  'room/bg_hallway': { w: 540, h: 720 },
  'room/bg_stairwell': { w: 540, h: 720 },
  'room/bg_attic': { w: 540, h: 720 },
  'room/bg_living_room': { w: 540, h: 720 },
  'room/bg_kitchen': { w: 540, h: 720 },
  'room/bg_utility': { w: 540, h: 720 },
  'room/bg_garage': { w: 540, h: 720 },
  'room/bg_museum': { w: 540, h: 720 },
  'room/bg_vault': { w: 540, h: 720 },
  'room/bg_club': { w: 540, h: 720 },
  'room/bg_duct': { w: 540, h: 720 }, // metal duct/flue interior
  'room/bg_office': { w: 540, h: 720 },
  'room/bg_corridor': { w: 540, h: 720 },
  'room/bg_clocktower': { w: 540, h: 720 },
  'room/bg_shaft': { w: 540, h: 720 }, // elevator shaft: concrete, rails, cables

  // ---- v2 room props (generic library; code places them)
  'room/double_bed': { w: 320, h: 140 },
  'room/couch': { w: 280, h: 120 },
  'room/tv_static': { w: 120, h: 100 }, // old TV, screen shows static
  'room/fish_tank': { w: 140, h: 100 }, // fragile
  'room/vase': { w: 40, h: 70 }, // fragile
  'room/trophy': { w: 40, h: 60 }, // fragile
  'room/plate_stack': { w: 60, h: 60 }, // fragile
  'room/snow_globe': { w: 36, h: 40 }, // fragile
  'room/champagne_tower': { w: 100, h: 120 }, // fragile
  'room/shards': { w: 60, h: 20 }, // broken remains of any fragile prop
  'room/grandfather_clock': { w: 90, h: 260 }, // case only; pendulum separate
  'room/pendulum': { w: 40, h: 140 }, // pivot at top-centre
  'room/hanging_bulb': { w: 30, h: 120 }, // cord + bulb, pivot at top-centre
  'room/chandelier': { w: 160, h: 120 }, // pivot at top-centre
  'room/robot_vacuum': { w: 70, h: 24 }, // side view
  'room/stairs': { w: 300, h: 300 }, // staircase rising left→right, open underneath
  'room/ladder': { w: 60, h: 240 },
  'room/door_frame': { w: 120, h: 220 }, // open doorway trim
  'room/bookcase': { w: 120, h: 220 },
  'room/wardrobe': { w: 140, h: 240 },
  'room/boxes': { w: 140, h: 110 }, // stacked cardboard boxes
  'room/fridge': { w: 100, h: 200 },
  'room/counter': { w: 260, h: 110 }, // kitchen counter with cupboards
  'room/hanging_pans': { w: 200, h: 90 },
  'room/dryer': { w: 120, h: 130 }, // drum drawn separately
  'room/dryer_drum': { w: 80, h: 80 }, // spins
  'room/dog_bed': { w: 120, h: 40 },
  'room/laser_emitter': { w: 24, h: 36 }, // wall-mounted, beam drawn by code
  'room/security_camera': { w: 70, h: 40 }, // side view, wall bracket at left, lens right
  'room/monitor_bank': { w: 200, h: 140 }, // Gary's CCTV monitors on a desk
  'room/camping_chair': { w: 120, h: 130 },
  'room/workbench': { w: 260, h: 110 },
  'room/power_tools': { w: 200, h: 80 }, // pegboard with tools
  'room/work_lamp': { w: 60, h: 100 }, // swinging, pivot at top-centre
  'room/garage_door': { w: 200, h: 240 }, // closed panel; code slides it up
  'room/swing_door': { w: 30, h: 200 }, // a door seen edge-on, pivot at top
  'room/dino_skull': { w: 200, h: 140 },
  'room/dino_ribs': { w: 260, h: 200 },
  'room/dino_legs': { w: 160, h: 260 },
  'room/pterodactyl': { w: 220, h: 100 }, // hanging, pivot at top-centre
  'room/display_case': { w: 140, h: 160 }, // gem on a plinth under glass
  'room/postcard_rack': { w: 70, h: 180 }, // spins
  'room/security_desk': { w: 260, h: 120 },
  'room/cargo_shutter': { w: 200, h: 240 },
  'room/disco_ball': { w: 80, h: 80 },
  'room/speaker_stack': { w: 110, h: 220 },
  'room/dj_booth': { w: 240, h: 130 },
  'room/coat_rack': { w: 70, h: 200 },
  'room/duct_fan': { w: 140, h: 140 }, // round fan face, spins
  'room/mayor_desk': { w: 280, h: 130 },
  'room/flag_stand': { w: 60, h: 220 },
  'room/mayor_portrait': { w: 120, h: 150 }, // the mayor, but heroic
  'room/water_cooler': { w: 60, h: 150 },
  'room/gear_big': { w: 240, h: 240 }, // clock-tower gear, spins about centre
  'room/gear_small': { w: 120, h: 120 },
  'room/clock_face_back': { w: 260, h: 260 }, // tower clock from inside (backwards numerals): the exit window
  'room/elevator_car': { w: 200, h: 200 },
  'room/counterweight': { w: 60, h: 140 },
  'room/exit_roof_hatch': { w: 160, h: 70 },
  'room/exit_patio_door': { w: 160, h: 240 },
  'room/exit_back_door': { w: 120, h: 220 },
  'room/exit_fire_escape': { w: 160, h: 200 },
  'room/exit_vent': { w: 160, h: 80 },

  // ---- v2 UI
  'ui/sunrise_clock': { w: 120, h: 120 }, // clock face, hands drawn by code
  'ui/sun': { w: 80, h: 80 },
  'ui/target_marker': { w: 48, h: 48 }, // off-screen arrow pointing up (rotated by code)
  'ui/eye_closed': { w: 64, h: 40 }, // suspicion "eye" fuse: closed
  'ui/eye_open': { w: 64, h: 40 }, // fully open, alarmed
  'ui/upgrade_snooze': { w: 96, h: 96 },
  'ui/vrell_furious': { w: 200, h: 200 },
  'ui/vrell_pleased': { w: 200, h: 200 }, // as pleased as Vrell gets
  'ui/zib_panic': { w: 200, h: 200 },
  'ui/stamp_sunrise': { w: 240, h: 120 }, // text "SUNRISE"
  'ui/stamp_spotted': { w: 240, h: 120 }, // text "SPOTTED"
  // French lettering, generated by scripts/art-fr.mjs from the English art
  'ui/logo_fr': { w: 480, h: 200 },
  'ui/stamp_delivered_fr': { w: 240, h: 120 },
  'ui/stamp_failed_fr': { w: 240, h: 120 },
  'ui/stamp_sunrise_fr': { w: 240, h: 120 },
  'ui/stamp_spotted_fr': { w: 240, h: 120 },

  // ---- APPEND: abduction code (Sol) — extra keys you need, with a one-line art note each
  'room/watch_dog': { w: 89, h: 62 }, // Gary's/Nigel's patrolling guard dog: standing side view, mid-trot, facing right (the renderer flips it), sleepy eye, red collar
  'room/cuckoo_bird': { w: 86, h: 44 }, // Mayor's clock tower pop-out: furious cuckoo facing left, beak at the left edge, scissor arm running off the right edge

  'room/potato_butte': { w: 86, h: 64 }, // Dave's fork-carved midnight snack
  'room/roswell_pennant': { w: 186, h: 88 }, // Barb's felt basketball pennant
  'room/saucer_poster': { w: 144, h: 122 }, // Gary's taped photograph of a flying bin lid
  'room/saucer_poster_fr': { w: 144, h: 122 }, // French slogan pasted over the print
  'room/towel_42': { w: 84, h: 108 }, // Nigel's embroidered emergency towel
  'room/tripod_single': { w: 132, h: 102 }, // Kev's seven-inch with a roller-skating Martian
  'room/pilot_bobblehead': { w: 54, h: 74 }, // the Mayor's spring-necked desk pilot

  // ---- APPEND: shell/flight/UI code (Opus) — extra keys you need, with a one-line art note each
  'flight/garden_gnome_top': { w: 30, h: 30 }, // L3 joke: Gary's tripwire posts; a garden gnome seen from above (red hat), drawn at both ends of a red laser line
  'flight/crop_field_top': { w: 480, h: 340 }, // L3 outskirts: fenced wheat field with a crop circle (scripts/art-crop-field.mjs)

  // =====================================================================
  // v3 "New Shifts" (docs/GDD-3-new-shifts.md), L5–L7. Listed by the coordinator.
  // Same style rules as v2 (docs/ART_BRIEF.md). Humans use the doyle/larry rig and sizes.
  // Lettered art (signs) also gets a `_fr` variant. Code owners may APPEND per level below.
  // =====================================================================

  // ---- v3 L5 "Pier Pressure" (Barnacle Bay) — flight. Sea is dark Pine, never cyan.
  'flight/ground_sea': { w: 540, h: 540 }, // seamless dark Pine sea, faint Ice wave dashes; shared by L5 and L7
  'flight/ground_sand': { w: 540, h: 540 }, // seamless desaturated Ochre sand, a few pebbles
  'flight/boardwalk_v': { w: 90, h: 540 }, // wooden boardwalk planks running north–south, tiles vertically
  'flight/boardwalk_h': { w: 540, h: 90 }, // same, east–west
  'flight/marine_park_top': { w: 360, h: 300 }, // Bubbles: round open show pool (dark water, ripple rings), striped bleachers south, flat service roof north with a roof panel
  'flight/lighthouse_top': { w: 220, h: 220 }, // Pete: round white tower top on a rock, lamp housing in the centre (lamp unlit; code draws the beam), gallery rail
  'flight/fish_market_top': { w: 300, h: 220 }, // Sal: corrugated market roof with a loft hatch, dock door on the east side, crates stacked outside
  'flight/beach_hut_top': { w: 90, h: 80 }, // filler: striped little beach hut roof
  'flight/boat_moored_top': { w: 70, h: 160 }, // moored sailing boat, bow north, mast dot + furled sail (a tall prop: casts a beam shadow)
  'flight/patrol_boat_top': { w: 80, h: 150 }, // harbour patrol boat, bow north, searchlight on the bow
  'flight/gull_flock': { w: 120, h: 90 }, // 6–8 gulls from above, wings out
  'flight/chip_kiosk_top': { w: 100, h: 80 }, // chip kiosk roof with a warm amber lamp spot
  'flight/harbour_crane_top': { w: 140, h: 140 }, // dockside crane from above (tall prop: casts a beam shadow)

  // ---- v3 L5 — the dolphin rig (custom body plan; side view, nose pointing right, belly down)
  'human/bubbles_head': { w: 90, h: 60 }, // snout + melon; asleep: one eye shut, one half-lidded, fixed smile, tiny "z" from the blowhole
  'human/bubbles_head_awake': { w: 90, h: 60 }, // both eyes wide, mouth open (squeaking)
  'human/bubbles_torso': { w: 100, h: 84 }, // chest + belly, dorsal fin baked in; Slate/Denim back, Mist belly, one Ice highlight
  'human/bubbles_tail': { w: 40, h: 76 }, // tail stock, joint at top-centre
  'human/bubbles_fluke': { w: 76, h: 40 }, // tail fluke, joint at top-centre
  'human/bubbles_flipper': { w: 26, h: 50 }, // one flipper (used for near and far), joint at top-centre

  // ---- v3 L5 — humans
  // pete: harbourmaster/lighthouse keeper, cable-knit jumper, oilskin hat, white beard, rubber boots.
  // sal: fish-market accountant, cardigan, visor, pencil behind ear, half-moon glasses on a chain.
  'human/pete_head': { w: 70, h: 80 },
  'human/pete_head_awake': { w: 70, h: 80 },
  'human/pete_torso': { w: 80, h: 120 },
  'human/pete_upper_arm': { w: 26, h: 60 },
  'human/pete_lower_arm': { w: 24, h: 60 },
  'human/pete_upper_leg': { w: 32, h: 70 },
  'human/pete_lower_leg': { w: 30, h: 72 },
  'human/sal_head': { w: 70, h: 80 },
  'human/sal_head_awake': { w: 70, h: 80 },
  'human/sal_torso': { w: 80, h: 120 },
  'human/sal_upper_arm': { w: 26, h: 60 },
  'human/sal_lower_arm': { w: 24, h: 60 },
  'human/sal_upper_leg': { w: 32, h: 70 },
  'human/sal_lower_leg': { w: 30, h: 72 },

  // ---- v3 L5 — second sleepers, backdrops, props
  'room/barnacle_asleep': { w: 160, h: 90 }, // sea lion asleep on its side on a wet rock, whiskers drooping
  'room/barnacle_awake': { w: 160, h: 120 }, // sea lion up on its flippers, barking
  'room/kipper_asleep': { w: 90, h: 50 }, // scruffy harbour cat curled on a fish crate lid
  'room/kipper_awake': { w: 90, h: 70 }, // cat arched, hissing
  'room/bg_show_pool': { w: 540, h: 720 }, // show-pool hall: tiled wall, bleacher shadows, dim lilac light
  'room/bg_aquarium_tunnel': { w: 540, h: 720 }, // glass viewing tunnel, dark Pine water outside, kelp silhouettes
  'room/bg_jelly_hall': { w: 540, h: 720 }, // dark hall with UV-lilac glowing tanks (no jellies: those are props)
  'room/bg_lamp_room': { w: 540, h: 720 }, // lighthouse lamp room: whitewash, brass, round windows
  'room/bg_lighthouse_stairs': { w: 540, h: 720 }, // inside the tower: curved whitewashed wall, iron rail
  'room/bg_boat_shed': { w: 540, h: 720 }, // wooden boat shed, slipway, nets on the walls
  'room/bg_fish_market': { w: 540, h: 720 }, // market hall: tiled wall, price boards (no text), ice trays
  'room/bg_cold_store': { w: 540, h: 720 }, // frosty cold store: steel walls, frost, a cold blue tint
  'room/show_pool': { w: 540, h: 160 }, // pool front: tiled rim and dark Pine water (code draws the wavy surface line)
  'room/hoop': { w: 120, h: 140 }, // show hoop on a rope, pivot at top-centre
  'room/beach_ball': { w: 60, h: 60 }, // floating striped beach ball
  'room/jellyfish': { w: 70, h: 100 }, // UV-lilac jellyfish, bell up, trailing tendrils
  'room/mop_bucket': { w: 80, h: 90 }, // janitor's mop bucket with water (a refill point)
  'room/sprinkler_head': { w: 40, h: 30 }, // ceiling fire sprinkler (refill point when it sprays)
  'room/rocking_chair': { w: 140, h: 150 }, // Pete's rocking chair, side view
  'room/fresnel_lens': { w: 160, h: 200 }, // the big lighthouse lens on its stand
  'room/counterweight_lighthouse': { w: 60, h: 140 }, // clockwork weight on a chain
  'room/crab_pots': { w: 120, h: 140 }, // stacked hanging crab pots, pivot at top-centre
  'room/hanging_scales': { w: 100, h: 140 }, // market bucket scales, pivot at top-centre
  'room/fish_crates': { w: 140, h: 110 }, // tower of fish crates (fragile: topples)
  'room/freezer_hook': { w: 60, h: 120 }, // hook on a rail trolley with a frozen fish
  'room/ledger_desk': { w: 260, h: 130 }, // Sal's desk with the open ledger, adding machine, lamp
  'room/sardine_tin': { w: 50, h: 30 }, // souvenir: an empty sardine tin
  'room/penguin': { w: 50, h: 70 }, // sleepy penguin (decor)
  'room/porthole_tank': { w: 180, h: 180 }, // delivery picture: round Bureau porthole tank, dolphin fin over the rim

  // ---- v3 L6 "Probe Compliance" (St. Mildred's General) — flight. No red cross anywhere.
  'flight/ground_campus': { w: 540, h: 540 }, // seamless hospital-campus lawn with pine needles, low contrast
  'flight/endoscopy_wing_top': { w: 320, h: 240 }, // Hank: low wing, glass entrance canopy south (crescent-moon sign), service door north
  'flight/oncall_block_top': { w: 260, h: 220 }, // Osei: block with a rooftop helipad H-circle (no cross) and a pharmacy hatch east
  'flight/recovery_ward_top': { w: 300, h: 220 }, // Pemberton: ward roof with skylight strip, laundry chute vent on the west side
  'flight/ambulance_top': { w: 80, h: 160 }, // ambulance from above, nose north, beacon on the roof (no cross: a crescent moon)
  'flight/ambulance_bay_top': { w: 200, h: 120 }, // two-bay garage roof, roll doors on the south edge
  'flight/pine_top': { w: 80, h: 80 }, // pine tree crown from above
  'flight/clinic_annex_top': { w: 220, h: 180 }, // filler hospital building roof with AC units

  // ---- v3 L6 — humans
  // hank: waiting-room patient, hospital wristband, cardigan over pyjamas, clutching ticket 347.
  // osei: gastroenterologist, scrubs, stethoscope, surgical cap, deep under-eye bags.
  // pemberton: post-procedure patient, hospital gown (closed, tied), fluffy socks, sleep mask on forehead.
  'human/hank_head': { w: 70, h: 80 },
  'human/hank_head_awake': { w: 70, h: 80 },
  'human/hank_torso': { w: 80, h: 120 },
  'human/hank_upper_arm': { w: 26, h: 60 },
  'human/hank_lower_arm': { w: 24, h: 60 },
  'human/hank_upper_leg': { w: 32, h: 70 },
  'human/hank_lower_leg': { w: 30, h: 72 },
  'human/osei_head': { w: 70, h: 80 },
  'human/osei_head_awake': { w: 70, h: 80 },
  'human/osei_torso': { w: 80, h: 120 },
  'human/osei_upper_arm': { w: 26, h: 60 },
  'human/osei_lower_arm': { w: 24, h: 60 },
  'human/osei_upper_leg': { w: 32, h: 70 },
  'human/osei_lower_leg': { w: 30, h: 72 },
  'human/pemberton_head': { w: 70, h: 80 },
  'human/pemberton_head_awake': { w: 70, h: 80 },
  'human/pemberton_torso': { w: 80, h: 120 },
  'human/pemberton_upper_arm': { w: 26, h: 60 },
  'human/pemberton_lower_arm': { w: 24, h: 60 },
  'human/pemberton_upper_leg': { w: 32, h: 70 },
  'human/pemberton_lower_leg': { w: 30, h: 72 },

  // ---- v3 L6 — second sleepers, backdrops, props
  'room/gladys_asleep': { w: 120, h: 150 }, // night nurse slumped at the nurses' station, cardigan, reading glasses
  'room/gladys_awake': { w: 120, h: 170 }, // nurse bolt upright, finger to lips "SHH"
  'room/roland_asleep': { w: 160, h: 80 }, // auditor asleep in a hospital bed clutching a rubber stamp
  'room/roland_awake': { w: 160, h: 110 }, // sitting up, stamp raised, outraged
  'room/bg_waiting_room': { w: 540, h: 720 }, // Mist walls, Teal dado stripe, dim strip lights
  'room/bg_ward': { w: 540, h: 720 }, // hospital ward, curtain rails, night lights
  'room/bg_on_call': { w: 540, h: 720 }, // on-call room: small, a corkboard, a tired lamp
  'room/bg_pharmacy': { w: 540, h: 720 }, // pharmacy back room, pale shelving
  'room/bg_recovery_bay': { w: 540, h: 720 }, // recovery bay: monitors, Lav shadows
  'room/bg_linen_room': { w: 540, h: 720 }, // linen room: folded sheets, a chute opening
  'room/probe_drone_thermo': { w: 70, h: 70 }, // mint Bureau drone holding a brass thermometer, little propeller
  'room/probe_drone_hammer': { w: 70, h: 70 }, // same drone holding a rubber reflex hammer
  'room/probe_drone_feather': { w: 70, h: 70 }, // same drone holding a goose-down tickle feather
  'room/waiting_chairs': { w: 300, h: 110 }, // row of three joined plastic waiting chairs
  'room/ticket_sign': { w: 160, h: 80 }, // red LED-style "NOW SERVING 12" ticket display (lettered)
  'room/ticket_sign_fr': { w: 160, h: 80 }, // « NUMÉRO 12 »
  'room/internal_affairs_sign': { w: 240, h: 60 }, // hanging corridor sign "DEPT. OF INTERNAL AFFAIRS" with an arrow (lettered)
  'room/internal_affairs_sign_fr': { w: 240, h: 60 }, // « SERVICE DES AFFAIRES INTERNES »
  'room/prep_jug': { w: 40, h: 60 }, // souvenir: a big jug of prep drink labelled with a frowny face
  'room/bunk_bed': { w: 300, h: 220 }, // on-call bunk bed
  'room/hospital_bed': { w: 320, h: 150 }, // recovery bed with rails
  'room/privacy_curtain': { w: 160, h: 260 }, // curtain on a ceiling rail, pale lilac
  'room/iv_stand': { w: 50, h: 200 }, // wheeled IV stand
  'room/heart_monitor': { w: 70, h: 150 }, // wheeled heart monitor (code draws the trace)
  'room/pill_shelf': { w: 140, h: 200 }, // pharmacy shelf of pill bottles (fragile)
  'room/revolving_door': { w: 200, h: 240 }, // revolving door frame (code draws the turning leaves)
  'room/laundry_cart': { w: 140, h: 110 }, // wheeled laundry cart
  'room/vending_machine': { w: 110, h: 220 }, // snack machine with warm amber glow
  'room/xray_lightbox': { w: 120, h: 90 }, // wall lightbox (code draws the bones of whatever passes)

  // ---- v3 L7 "A Whole Cruise Ship" (SS Buffet Royale) — flight. Ship bow-north, sea is ground_sea.
  'flight/ship_bow_top': { w: 900, h: 720 }, // cream bow section, tapering to the point at the top, anchor chains, deck planking
  'flight/ship_mid_top': { w: 900, h: 540 }, // midship deck section (repeatable): planking, rails both sides, lifeboat davits
  'flight/ship_stern_top': { w: 900, h: 600 }, // rounded stern with a little flag; wake drawn by code
  'flight/ship_bridge_top': { w: 320, h: 200 }, // Captain: bridge roof with radar dish and wing doors
  'flight/ship_galley_top': { w: 280, h: 200 }, // Marco: galley roof with a ribbed skylight and hood vents
  'flight/ship_lido_top': { w: 320, h: 240 }, // Greg: lido deck with a Teal pool, loungers, striped awning
  'flight/funnel_top': { w: 140, h: 140 }, // plum funnel from above, dark mouth
  'flight/lifeboat_top': { w: 60, h: 130 }, // orange lifeboat under a cover
  'flight/photographer_top': { w: 50, h: 50 }, // ship photographer from above: hat, big camera with flash
  'flight/radar_mast_top': { w: 60, h: 60 }, // radar mast top (code draws the two cones)
  'flight/deck_lights_h': { w: 540, h: 20 }, // string of deck bulbs, tiles horizontally (decor, no light pools)

  // ---- v3 L7 — humans
  // sterling: ship's captain, white uniform jacket, peaked cap, magnificent beard (no real insignia).
  // marco: chef, whites, tall toque, extravagant moustache, ladle in his belt.
  // greg: tourist, Hawaiian-print shirt, sunglasses on at night, three white towels draped over him.
  'human/sterling_head': { w: 70, h: 80 },
  'human/sterling_head_awake': { w: 70, h: 80 },
  'human/sterling_torso': { w: 80, h: 120 },
  'human/sterling_upper_arm': { w: 26, h: 60 },
  'human/sterling_lower_arm': { w: 24, h: 60 },
  'human/sterling_upper_leg': { w: 32, h: 70 },
  'human/sterling_lower_leg': { w: 30, h: 72 },
  'human/marco_head': { w: 70, h: 80 },
  'human/marco_head_awake': { w: 70, h: 80 },
  'human/marco_torso': { w: 80, h: 120 },
  'human/marco_upper_arm': { w: 26, h: 60 },
  'human/marco_lower_arm': { w: 24, h: 60 },
  'human/marco_upper_leg': { w: 32, h: 70 },
  'human/marco_lower_leg': { w: 30, h: 72 },
  'human/greg_head': { w: 70, h: 80 },
  'human/greg_head_awake': { w: 70, h: 80 },
  'human/greg_torso': { w: 80, h: 120 },
  'human/greg_upper_arm': { w: 26, h: 60 },
  'human/greg_lower_arm': { w: 24, h: 60 },
  'human/greg_upper_leg': { w: 32, h: 70 },
  'human/greg_lower_leg': { w: 30, h: 72 },

  // ---- v3 L7 — second sleeper, backdrops, props
  'room/anchovy_asleep': { w: 80, h: 45 }, // small ship's cat curled on a console, tiny sailor collar
  'room/anchovy_awake': { w: 80, h: 65 }, // cat up, ears back, yowling
  'room/bg_bridge': { w: 540, h: 720 }, // ship's bridge at night: wide dark windows, brass, instrument glow
  'room/bg_galley': { w: 540, h: 720 }, // steel galley: tiles, extractor hoods
  'room/bg_dining_room': { w: 540, h: 720 }, // ballroom/dining room: Brick and Gold, brass rails
  'room/bg_lido_bar': { w: 540, h: 720 }, // lido bar under an awning, deck boards, night sea beyond the rail
  'room/bg_cabin_corridor': { w: 540, h: 720 }, // narrow cabin corridor, numbered doors (no text), portholes
  'room/bg_engine_casing': { w: 540, h: 720 }, // engine casing: pipes, gauges, warm dim light
  'room/captains_chair': { w: 120, h: 150 }, // captain's high chair at the wheel
  'room/ships_wheel': { w: 120, h: 120 }, // brass-and-wood wheel
  'room/brass_compass': { w: 60, h: 60 }, // binnacle compass
  'room/chart_lamp': { w: 50, h: 110 }, // swinging chart lamp, pivot at top-centre
  'room/dessert_trolley': { w: 140, h: 120 }, // trolley piled with desserts and a wobbling jelly, castors (slides)
  'room/deckchair_stack': { w: 120, h: 140 }, // stacked deckchairs on a dolly (slides)
  'room/hanging_ladles': { w: 200, h: 90 }, // rack of copper ladles, pivot at top-centre
  'room/chocolate_fountain': { w: 100, h: 130 }, // tiered chocolate fountain (fragile)
  'room/busboy_bot': { w: 70, h: 90 }, // little dish-collecting robot with a tray
  'room/lounger': { w: 280, h: 100 }, // lido sun lounger
  'room/lifebuoy': { w: 70, h: 70 }, // ring lifebuoy on a rope, pivot at top-centre
  'room/porthole': { w: 80, h: 80 }, // brass porthole, night sea outside (decor)
  'room/plumb_dial': { w: 80, h: 100 }, // brass inclinometer (code draws the needle and the amber bead)
  'room/soup_pot': { w: 120, h: 110 }, // big stock pot (code draws the tilting soup surface)
  'room/complimentary_towel': { w: 60, h: 40 }, // souvenir: a folded towel swan
  'room/exit_porthole': { w: 120, h: 120 }, // large porthole exit, glass swung open

  // ---- v3 UI (report additions and HUD bits)
  'ui/id_photo_frame': { w: 220, h: 260 }, // Bureau ID card frame: empty photo window, fake barcode, no text
  'ui/stamp_approved': { w: 240, h: 120 }, // text "APPROVED" (crooked rubber stamp)
  'ui/stamp_approved_fr': { w: 240, h: 120 }, // « APPROUVÉ »
  'ui/tabloid_masthead': { w: 300, h: 60 }, // tabloid masthead "THE GRIMSBY GAZETTE" in a red banner
  'ui/tabloid_masthead_fr': { w: 300, h: 60 }, // « LA GAZETTE DE GRIMSBY »
  'ui/clipboard_7b': { w: 120, h: 150 }, // small clipboard (code writes the Form 7-B lines and ticks)
  'ui/droplet': { w: 40, h: 48 }, // mint water droplet icon (moisture meter)

  // ---- v4 L8 Prior Contact
  'flight/ape_roaming': { w: 54, h: 54 }, // Knuckle-walking ape from above, nose north; warm muzzle and big hands.
  'flight/ape_beamed': { w: 54, h: 54 }, // Same ape lifted belly-up, limbs splayed; same centre, transparent ground.
  'flight/ground_badlands': { w: 540, h: 540 }, // Seamless weathered dry riverbed with subdued gravel and sediment bands.
  'flight/quarry_top': { w: 320, h: 220 }, // Ochre terrace, split ledge at (76,66) and square chimney at (247,149).
  'flight/bandstand_top': { w: 320, h: 220 }, // Reedy circular amphitheatre, stage awning to the west and organ loft to the east.
  'flight/archive_top': { w: 320, h: 220 }, // Slates filed upright like books, west records door and east appeals hatch.
  'flight/hum_slab_top': { w: 76, h: 100 }, // Oblique black monolith from above, one thin cool bevel, empty ground around it.
  'room/exit_stone_hatch': { w: 160, h: 70 }, // An open shaft framed in hand-cut shale, overhead exit.
  'room/bg_patent_cave': { w: 540, h: 720 }, // Blue shale, ancient thumbprints filed in rows, low contrast.
  'room/stone_plinth': { w: 260, h: 110 }, // Flat-topped weathered stone bench, fills its rectangular collider.
  'room/practice_bone': { w: 84, h: 34 }, // Horizontal ivory bone with two pronounced double-knuckle ends, broad centre.
  'room/patent_bone': { w: 50, h: 24 }, // Pocket-sized ivory bone, stamped with an ochre thumbprint.
  'room/uplift_slab': { w: 100, h: 210 }, // Black upright slab, lavender bevel, chipped corner and pale stone foot.
  'room/stone_chime': { w: 60, h: 100 }, // Two flints on a full-width bound frame, pivot at top centre.
  'human/flint_head': { w: 70, h: 80 }, // Sleeping ape with chestnut fur and knapped-stone visor.
  'human/reed_head': { w: 70, h: 80 }, // Sleeping ape with tawny fur and a reed behind the ear.
  'human/echo_head': { w: 70, h: 80 }, // Sleeping ape with slate fur and stone spectacles.
  'human/echo_head_awake': { w: 70, h: 80 }, // Same pivot, wide panicked eyes and pursed lips.
  'human/echo_torso': { w: 80, h: 120 }, // Barrel chest with a lighter fur bib and stooped shoulders.
  'human/echo_upper_arm': { w: 26, h: 60 }, // Tufted upper arm, joint top centre.
  'human/echo_lower_arm': { w: 24, h: 60 }, // Long wrist ending in a broad knuckled hand.
  'human/echo_upper_leg': { w: 32, h: 70 }, // Compact furred thigh, overlapping the knee.
  'human/echo_lower_leg': { w: 30, h: 72 }, // Shaggy shin ending in a gripping bare foot.

  // ---- v4 items & recap humour: souvenirs (src/abduct/souvenir-items.ts). Small loose props, side
  // view, resting on their bottom edge; code draws a primitive fallback (src/abduct/souvenir-art.ts).
  'room/prize_marrow': { w: 56, h: 24 }, // L1 farm: a fat striped green marrow with a red-and-gold prize rosette
  'room/heart_boxers': { w: 40, h: 30 }, // L2 laundry: white boxer shorts with red hearts, blue waistband, laid flat
  'room/odd_sock': { w: 36, h: 24 }, // L2 laundry: one lonely cream sock with coloured stripes, lying on its side
  'room/demo_dentures': { w: 40, h: 26 }, // L3 Dave: a dentist's demo denture set, pink gums, slightly open in a grin
  'room/coach_whistle': { w: 40, h: 22 }, // L3 Barb: chrome coach's whistle on a red lanyard
  'room/tinfoil_hat': { w: 40, h: 30 }, // L3 Gary: a crumpled, pointy tinfoil hat
  'room/ufo_snow_globe': { w: 30, h: 34 }, // L4 Nigel: gift-shop snow globe with a tiny flying saucer inside, wooden base
  'room/vinyl_12inch': { w: 36, h: 36 }, // L4 Kev: a 12-inch record sliding out of a loud orange sleeve marked 12"
  'room/toupee': { w: 46, h: 20 }, // L4 Mayor: a glossy auburn toupee, swept to one side
  'room/rubber_duck': { w: 32, h: 30 }, // L5 Bubbles: classic yellow rubber duck, orange beak
  'room/ship_bottle': { w: 54, h: 24 }, // L5 Pete: a ship in a bottle lying on its side, cork, tiny white sail
  'room/cash_tin': { w: 44, h: 26 }, // L5 Sal: a dented green petty-cash tin with a little brass lock
  'room/silver_plug': { w: 24, h: 38 }, // L6 Hank: a polished silver butt plug standing on its flared base (shiny, cartoon, not anatomical)
  'room/glove_balloon': { w: 38, h: 34 }, // L6 Osei: a blue latex glove blown up like a balloon, a smiley face drawn on it
  'room/bedpan': { w: 52, h: 20 }, // L6 Pemberton: a steel hospital bedpan with a handle, side view
  'room/captains_log': { w: 50, h: 22 }, // L7 Captain: a literal wooden log with a brass plaque reading LOG
  'room/pepper_mill': { w: 58, h: 20 }, // L7 Marco: a giant wooden restaurant pepper mill lying on its side
  'room/mankini': { w: 44, h: 26 }, // L7 Greg: a lime-green mankini laid flat (a V of straps), comic not revealing
  // ---- APPEND: L5 pier code — extra keys, one-line art note each
  'flight/lifeguard_tower_top': { w: 90, h: 90 }, // lifeguard tower on stilts from above: little hut roof, ladder (a tall prop: casts a beam shadow)
  'room/sea_lion_rocks': { w: 400, h: 100 }, // wet, rounded rocks for Barnacle to sleep on, a rock pool on one side
  'room/tunnel_divider': { w: 70, h: 380 }, // thick glass divider panel in the flooded viewing tunnel, steel frame, faint Ice glints
  // ---- APPEND: L6 clinic code — extra keys, one-line art note each
  'room/pager': { w: 44, h: 30 }, // Dr. Osei's pager on the nightstand, side view: chunky black pager, tiny amber screen (code draws the buzz rings)
  // ---- APPEND: L7 cruise code — extra keys, one-line art note each
  'room/eclair': { w: 50, h: 24 }, // souvenir: one chocolate éclair from Marco's 24-hour dessert trolley, side view
  'flight/steward_top': { w: 44, h: 44 }, // deck steward from above: white cap, epaulettes, a torch held out in front (code draws the beam)
  // ---- APPEND: report code — extra keys, one-line art note each
  // (no new keys) ui/id_photo_frame: keep the photo window transparent at x/y 22–198; src/ui/report-photo.ts WINDOW draws the pose there.

  // ---- v4 easter eggs (docs/research/film-references.md "Easter eggs for existing levels"). Decor
  // only: no detector, no collider. Code draws a primitive fallback (src/flight/props.ts,
  // src/abduct/souvenir-art.ts); src/flight/easter-eggs.ts places the glow and the tyre streaks.
  'flight/gullwing_car': { w: 144, h: 80 }, // L2 back lot: unbadged stainless two-seater from above at map-car scale, nose east (right), one gull-wing door raised, round rear lamps, no logo/plate/grille; car only, transparent bg (code draws the scorch streaks behind and the soft cockpit glow at 52% across)
  'flight/iceberg': { w: 120, h: 90 }, // L7 off the port bow: a small, chunky iceberg from above, pale cyan facets on dark sea, a paper napkin frozen to one edge; no wreck, no flags, soft foam ring baked in
  'room/blue_heart_pendant': { w: 40, h: 40 }, // L7 Captain (mast route) souvenir, side view resting on its bottom edge: squat blue enamel heart on a gold chain coiled behind it, tiny PREMIUM DECK PASS stamp; no diamond facets or halo
};

/**
 * Art used only by the retired L8 routes (flint_split, flint_summit, reed_stage, reed_loft and the
 * echo_records side door; the layouts stay unregistered in src/abduct/rooms/deep-monolith.ts for
 * reuse). Flint and Reed are outdoor pickups now, so only their head keys stay in ART (HUD, Work
 * Orders). The SVGs stay in public/art, but these keys are not preloaded: move one back into ART to
 * use it again.
 */
export const RETIRED_ART: Record<string, ArtSpec> = {
  'human/flint_head_awake': { w: 70, h: 80 }, // Same pivot, wide panicked eyes and pursed lips.
  'human/flint_torso': { w: 80, h: 120 }, // Barrel chest with a lighter fur bib and stooped shoulders.
  'human/flint_upper_arm': { w: 26, h: 60 }, // Tufted upper arm, joint top centre.
  'human/flint_lower_arm': { w: 24, h: 60 }, // Long wrist ending in a broad knuckled hand.
  'human/flint_upper_leg': { w: 32, h: 70 }, // Compact furred thigh, overlapping the knee.
  'human/flint_lower_leg': { w: 30, h: 72 }, // Shaggy shin ending in a gripping bare foot.
  'human/reed_head_awake': { w: 70, h: 80 }, // Same pivot, wide panicked eyes and pursed lips.
  'human/reed_torso': { w: 80, h: 120 }, // Barrel chest with a lighter fur bib and stooped shoulders.
  'human/reed_upper_arm': { w: 26, h: 60 }, // Tufted upper arm, joint top centre.
  'human/reed_lower_arm': { w: 24, h: 60 }, // Long wrist ending in a broad knuckled hand.
  'human/reed_upper_leg': { w: 32, h: 70 }, // Compact furred thigh, overlapping the knee.
  'human/reed_lower_leg': { w: 30, h: 72 }, // Shaggy shin ending in a gripping bare foot.
  'room/exit_stone_door': { w: 160, h: 240 }, // An open cave mouth with two rough jambs and a stone lintel.
  'room/bg_quarry_cave': { w: 540, h: 720 }, // Ochre strata with a charcoal drawing of a hand and one experimental thumb.
  'room/bg_reed_cave': { w: 540, h: 720 }, // Plum cavern with fine reed impressions in the clay, a few score-like tally marks.
  'room/understudy_asleep': { w: 110, h: 84 }, // Young ape asleep on her drum.
  'room/understudy_awake': { w: 110, h: 112 }, // Same drummer awake, sticks raised.
};

export type ArtKey = keyof typeof ART;
