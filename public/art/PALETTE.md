# Night Shift art palette

Moonlight enters from the upper left. Amber marks inhabited spaces. Mint marks Bureau equipment and the beam. The warmer human silhouettes stay readable against both. All sprites embed their swatches so they can load as independent Canvas images.

| Swatch | Hex | Role |
| --- | --- | --- |
| Ink | `#1b1433` | Soft outer outline, facial marks and deep recesses |
| Night | `#222440` | Midnight sky and windows |
| Blue | `#343756` | Night walls and road surface |
| Slate | `#495374` | Slate roofs, shadows on metal |
| Denim | `#647899` | Work polo, machinery and roof highlights |
| Mist | `#a7b7ce` | Moonlit steel, moustache and reflective glass |
| Paper | `#ffedc9` | Starlight, warm whites, paper and eyes |
| Cream | `#e5cc9f` | Linen, wood glints and light ceramic |
| Ochre | `#bb9161` | Khaki trousers, timber and cart rails |
| Wood | `#895e55` | Furniture and umber midtone |
| Umber | `#594050` | Deep warm wood, hair and firebox |
| Gold | `#ffbd68` | Amber windows, brass and saucer running lights |
| Butter | `#ffe49b` | Lamp cores and bright stars |
| Rust | `#b56b49` | Amber shadows and seams |
| Blush | `#ebaa89` | Larry’s skin and Doyle’s skin shadow |
| Skin | `#ffc9a1` | Doyle’s skin and Larry’s highlights |
| Rose | `#d3827c` | Flushed skin and fabric highlights |
| Brick | `#a64e5e` | Long john seams, calico markings and shadowed brick |
| Red | `#dc6866` | Long johns, red roofs and rejection ink |
| Pine | `#28575c` | Deep teal, cockpit glass and foliage shadow |
| Teal | `#468c89` | Metalwork, foliage and quilt |
| Jade | `#64c5a1` | Zib, reflected mint and fabric accents |
| Mint | `#7CFFCB` | Tractor illumination, navigation and Bureau signals |
| Ice | `#d8ffdf` | Glass, logo and alien catchlights |
| Plum | `#604569` | Vrell’s deepest folds |
| Lilac | `#a387b1` | Vrell’s skin |
| Lav | `#d3b9d1` | Vrell’s moonlit edge |
| Grass | `#2d3d48` | Farm turf base |
| Moss | `#354952` | Low-contrast turf texture |
| Asphalt | `#303448` | Town pavement base |

## Assembly and orientation

- Both humans face screen-right. Place the head’s bottom-centre over the neck at the top-centre of the torso. The hip sits at the bottom-centre of the torso. Give adjacent rounded limb ends 8–12 native pixels of overlap. Rotate each limb around its top-centre. Draw the far limbs first, the near leg next, then the torso, head and near arm.
- Each pair of head sprites shares the same head, hair, ear and neck paths. Only the eyes and mouth change. Doyle’s bare foot and Larry’s sneaker belong to the lower leg. Hands belong to the lower arm.
- The hub end of the fan blade is at the left-middle. Place the hub sprite over the inboard end. The blade extends right.
- Flight sprites face north. South-facing roof edges expose a narrow strip of lit wall. The entry ring has a clear centre.
- Both ground textures repeat on both axes. Each road repeats along its long axis. Match opposing edges without a gutter or filtering between adjacent quads.
- The side-view room backdrops contain the walls, moonlight and floor. All openings, silhouettes and furnishings load independently.
- The logo’s main lettering, stamps, sign and sleep symbol use vector strokes. The logo subtitle uses a generic bold sans-serif.
