# Night Shift — art brief

The complete asset list, with exact sizes, is `src/art-manifest.ts`. Each key
`group/name` is a file `public/art/group/name.svg` whose root element has
`viewBox="0 0 w h"` and `width="w" height="h"` matching the manifest exactly.
The game stretches each sprite into a rect of that size, and that rect is also
(roughly) the physics hitbox — so **fill the box**: keep the silhouette within
~4 px of every edge unless the note says otherwise, and don't add drop shadows
that extend outside the box.

## Style

- Original, cosy, flat-vector night comedy. Deep indigo/blue-violet night,
  warm amber window light, saucer and beam in alien mint/teal green
  (`#7CFFCB` family). Humans and props in warm, slightly desaturated tones so
  the green beam reads on top.
- Chunky rounded shapes, soft dark outline (`#1b1433`, 3–4 px), one flat
  highlight and one flat shadow tone per shape. No gradients except for
  glows. No text inside sprites except the sign (`NO SLEEPING ON DUTY`), the
  stamps (`DELIVERED`, `REJECTED`) and the logo (`NIGHT SHIFT`, subtitle
  `Abductions Dept.`).
- Readability at phone size first: a 30 px sprite must still read.
- Humour lives in the details: the prize-cow portrait has a rosette, the tax
  form dream has a frowny face, the cat sleeps belly-up, Vrell wears tiny
  reading glasses and holds a clipboard, Zib is a small nervous green alien
  with one antenna drooping.

## Characters

- **Farmer Doyle** — big, round, bald with a grey moustache, red long johns,
  big bare feet. `_head` asleep (eyes closed, mouth open snoring),
  `_head_awake` (eyes huge, shocked).
- **Larry** — skinny night attendant, messy hair, blue work polo with a
  name-tag, khaki trousers, sneakers. Same head pair.
- Ragdoll parts are drawn **side view**, each limb vertical with its joint at
  top-centre. Draw rounded ends that overlap neighbours slightly so joints
  never show gaps when rotated.

## Flight sprites

Seen from directly above, north up. Buildings show roofs (with a hint of the
wall on the south side for depth). Vehicles point north. The saucer is round
with a dome and a ring of lights. The ground tiles must tile seamlessly in both
directions; keep them low-contrast so sprites pop.

## Rooms

`room/bg_*` are full-screen backdrops (540×960) — **atmosphere only**: wall,
wallpaper, floorboards, dim moonlight. Do not paint furniture, windows,
doors or exits into backdrops; every gameplay object is its own sprite placed
by code. Keep the top ~120 px and bottom ~90 px calm (HUD sits there).

## Delivery

- SVG only, hand-authored or generated, optimised (no editor metadata, no
  embedded rasters, no external refs, no fonts — convert text to paths or use
  a generic font-family with simple shapes). Target < 20 KB per file
  (backdrops < 60 KB).
- Also deliver `public/art/contact-sheet.html` showing every asset on a
  checkerboard at 1× with its key, for review.
