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
  'ui/upgrade_afterburner': { w: 96, h: 96 },
  'ui/upgrade_snooze': { w: 96, h: 96 },
  'ui/vrell_furious': { w: 200, h: 200 },
  'ui/vrell_pleased': { w: 200, h: 200 }, // as pleased as Vrell gets
  'ui/zib_panic': { w: 200, h: 200 },
  'ui/stamp_sunrise': { w: 240, h: 120 }, // text "SUNRISE"
  'ui/stamp_spotted': { w: 240, h: 120 }, // text "SPOTTED"

  // ---- APPEND: abduction code (Sol) — extra keys you need, with a one-line art note each

  // ---- APPEND: shell/flight/UI code (Opus) — extra keys you need, with a one-line art note each
  'flight/garden_gnome_top': { w: 30, h: 30 }, // L3 joke: Gary's tripwire posts; a garden gnome seen from above (red hat), drawn at both ends of a red laser line
};

export type ArtKey = keyof typeof ART;
