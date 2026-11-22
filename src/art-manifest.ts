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
};

export type ArtKey = keyof typeof ART;
