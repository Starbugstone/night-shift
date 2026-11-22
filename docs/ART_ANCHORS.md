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
