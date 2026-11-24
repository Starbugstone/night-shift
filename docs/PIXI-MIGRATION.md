# Pixi rendering (migrated 2026-11-24)

**Status: done.** Every scene draws with Pixi; the Canvas 2D overlay and the old draw helpers are
gone. This file is the guide for writing views. The "While the migration ran" and "Who ported
what" notes are kept for history.

Night Shift moved its rendering from hand-written Canvas 2D to [PixiJS 8](https://pixijs.com/8.x/guides)
(`pixi.js` 8.22.0, pinned). The game logic, physics, autopilots, input and tests do not change.

## Why, and what it costs

The goal is code that is easier to extend without bugs: a display tree of small view components
instead of 12,000 lines of immediate-mode draw calls. Speed is not the goal. Measured on this
machine (real Intel UHD GPU, Chromium, CPU throttled 6× to stand in for a cheap phone):

| Same ~520 shapes per frame | Main-thread work per frame |
| --- | --- |
| Canvas 2D, redrawn every frame | 4.0 ms |
| Pixi, every shape rebuilt every frame (`Graphics.clear()` + redraw) | 14.7 ms |
| Pixi, shapes built once, only moved / faded / tinted each frame | 6.7 ms |

So **Pixi must be used retained**: build display objects once and change their properties. Rebuilding
geometry every frame is several times dearer than Canvas 2D was. The budget is 16.7 ms a frame.

## Architecture

- `src/core/gfx/host.ts` owns the WebGL canvas (`#gfx`). Our own loop calls `renderer.render()` once
  per frame. There is no Pixi ticker, no Pixi pointer events and no Pixi `Assets` loader. Input stays
  in `src/core/input.ts` and the `Button` logic, so the tests and e2e scripts keep working.
- `host.root` is the logical 540×960 space, scaled and clipped into the letterbox. The
  `SceneManager` mounts the live scene's `view` in it.
- A scene keeps its logic and hands drawing to a **view class**. The view is built lazily through
  `ViewSlot` (`src/core/gfx/scene.ts`), so headless tests that only call `update()` never touch Pixi:

```ts
export class TitleScene implements Scene {
  private readonly look = new ViewSlot(() => new TitleView(this));
  get view(): Container { return this.look.get().root; }
  update(dt: number): void { /* logic, unchanged */ }
  render(): void { this.look.peek()?.sync(); }
  dispose(): void { this.look.destroy(); }
}

class TitleView implements SceneView {
  readonly root = new Container();
  // every display object is built here, once
  constructor(private readonly s: TitleScene) { /* addChild(...) */ }
  sync(): void { /* set positions, alpha, tint, visible, text: nothing else */ }
}
```

- **While the migration ran** (history), an unported scene still implements `render(g)` and draws on the
  transparent Canvas 2D overlay `#game` that sits on top of `#gfx` (`isPixiScene` tells them apart).
  The scene transitions also stay on that overlay until the end. A ported scene's `render(g)` may draw
  leftover bits on `g` temporarily (for example a HUD that is not ported yet). The overlay is cleared
  every frame and is on top. Nothing may draw on `g` when the migration ends.

## The kit (use these before writing your own)

| Need | Use |
| --- | --- |
| Manifest art | `artSprite(assets, key, w?, h?)` / `artTex(...)` / `artShadow(...)` in `src/ui/views/art.ts`. They return `null` when the art is missing: build the primitive fallback instead (at construction). |
| Static complex drawing (icons, painted fallbacks, gradients, anything that never changes) | `paintedTexture(id, w, h, painter, resolution?)` in `src/core/gfx/textures.ts`. The painter is Canvas 2D code that runs **once**. This is the only place Canvas 2D is allowed after the migration, which makes porting old static draw code cheap. |
| Shapes whose geometry changes | `Shape.draw(keyOf(...inputs), (g) => ...)` in `src/core/gfx/shapes.ts`. It rebuilds only when the key changes. Key on rounded geometry inputs, never on time. A handful of small shapes rebuilt every frame (an arc that fills, an iris) is fine. Dozens are not. |
| Path helpers | `roundRect` (clamped radius), `panelPath`, `panelHighlightPath`, `starPath`, `ellipseArc` (Pixi has no partial ellipse) in `shapes.ts`. |
| Text | `Label` (one line, anchored like `fillText` with a middle baseline; `set(text, x, y, maxW)` squeezes like `maxWidth`), `Paragraph` (`setBlock` wraps with the same breaks as before), `wrapLines`, `measure` in `src/core/gfx/text.ts`. Keep `LabelStyle` objects in constants or fields. `restyle` with the same object is free. |
| Glows and tints | `Glow` (centre + radii + alpha via `place`), `ScreenTint.vignette()/edge(rgb)/wash(...)` with `.strength`, and `glowTexture`, `lightTexture`, `radialTexture` in `src/core/gfx/glow.ts`. Canvas `lighter` = `blendMode = 'add'`. |
| Particles | Keep the `Particles` pool (simulation, `src/core/fx.ts`); draw it with `new ParticleView(pool)` and call `sync()` each frame. |
| In-game HUD | `HudPanel`, `HudMeter`, `HudTimer`, `HudButton`, `HudPrompt`, `HudFuse`, `HudSunClock` and `tintOf` in `src/ui/views/hud.ts` (same looks and layout as `src/ui/hud.ts`; each is a Container placed at its top-left, built once, `sync(...)` per frame). |
| Menu widgets | `ButtonView(button)`, `NightSky`, `Skyline`, `SpeakerIcon`, `starTexture`, `glorbTexture`, `iconSprite` in `src/ui/views/`. |
| Reference ports | `src/ui/loading.ts` and `src/ui/title.ts`. |

## Rules

1. **Views never change game state.** They read the scene or sim and set display properties.
   Physics, sims and autopilots stay DOM-free and Pixi-free.
2. **Build once, sync properties.** Make every display object in the view constructor. `sync()` only
   sets `position`, `rotation`, `scale`, `alpha`, `tint`, `visible`, `texture` and text. Create no
   objects in `sync()`: no `new`, no object or array literals, and no string building you can avoid
   (cache strings, as the old code did). The one accepted exception is the small build callback
   passed to `Shape.draw` (it only runs when the key changes).
3. **Toggle, don't rebuild.** Use `visible` for things that come and go, and pools for repeated
   things (one sprite per slot, made up front).
4. **Draw order is child order.** `addChild` order replaces the old call order. When the old code
   drew something conditionally in between, keep the slot and toggle `visible`.
5. **Camera.** Put the world in a container whose position is `-cam` (+ shake), and the HUD in a
   sibling that the camera does not move. Cull far-off objects with `visible` if a map is big.
6. **Clips** become masks (`container.mask = graphics`). Axis-aligned rectangles are cheap (scissor).
7. **Honest tells.** Detection cones, fuse rings, bark rings and neon on/off must keep the exact
   geometry and timing the sim uses. Decorate them, don't move them. Keep the colour language:
   mint = you and your goals, amber = about to happen, red = it has you now.
8. **Reduced motion.** Keep every `reducedMotion` branch.
9. **Missing art.** Every art sprite has a primitive fallback.
10. **Composition over inheritance.** Views own a `root` container. If you do subclass a Pixi
    class, don't name fields `label`, `name`, `on`, `off`, `children`, `mask`, `filters`,
    `position`, `scale`, `width`, `height`, `alpha`, `tint`, `texture` or `visible`: they collide
    with Pixi members.
11. **Destroying.** `ViewSlot.destroy()` destroys the view's display tree. Never destroy shared
    textures (art, painted, glow). Destroy any `RenderTexture` you create in the view's `dispose()`.
12. **French.** Text that used `maxWidth` keeps a `maxW` squeeze. Check every ported screen with
    `?lang=fr`.

## Pixi 8 notes

- `g.rect(x, y, w, h).fill(color)` / `.fill({ color, alpha })` / `.stroke({ color, width, cap, join })`.
  CSS strings work, including `rgba(...)`. A `fill` followed by a `stroke` uses the same path.
- Shapes: `rect`, `roundRect`, `circle`, `ellipse` (whole only), `arc(x, y, r, a0, a1, ccw)`,
  `poly([x0, y0, ...])`, `moveTo`/`lineTo`/`quadraticCurveTo`/`bezierCurveTo`/`closePath`, and `cut()`
  for holes (Canvas `evenodd`).
- Gradients: paint them into a `paintedTexture` and stretch a sprite (cheapest), or use `FillGradient`.
- A `Sprite`'s size is `width`/`height` (or `scale`), and `anchor` sets its origin. Set
  `Sprite.anchor.set(0.5)` for centred art.
- `GraphicsContext` can be shared by many `Graphics` (`new Graphics(ctx)`) for repeated identical shapes.

## Checking a ported scene

Run the dev server (`npm run dev -- --port <free port>`) and, for a before/after comparison, a
second server on a checkout of the base commit.

The dev server enables the browser fixtures. For the frame-time bench and full playthrough, serve
an optimized test build from a separate output directory:

```bash
npm run build -- --mode e2e --outDir review/e2e-build
npm run preview -- --outDir review/e2e-build --port 5311 --strictPort
```

`PLAYWRIGHT_MODULE` can point these tools at an existing Playwright module. The media tooling
below sets it on this machine. The default production build opens at the title and ignores fixture
URLs. Only dev and `e2e` mode expose the debug hook.

```bash
source ~/.local/share/claude-media-tools/env.sh
export GALLIUM_DRIVER=d3d12 LD_LIBRARY_PATH=/usr/lib/wsl/lib:$LD_LIBRARY_PATH   # real GPU on WSL
node scripts/pixi/shots.mjs http://127.0.0.1:<base port> review/pixi/before title=/ deep=/?room=dave_roof
node scripts/pixi/shots.mjs http://127.0.0.1:<port> review/pixi/after  title=/ deep=/?room=dave_roof
THROTTLE=1,6 PAGES=room=dave_roof node scripts/pixi/bench-frames.mjs http://127.0.0.1:<port>
```

Screenshots of the WebGL canvas must go through `window.__nightShift.capture()` (or call
`window.__nightShift.redraw()` and read `canvas#game` in the same task): the canvas is blank to
`toDataURL` outside the frame that drew it.

Useful entry points: `/?room=<roomId>` (abduction), `/?unlock=1&flight=<n>` (flight),
`/?level=<n>` (memo), and `window.__nightShift.goto('report' | 'workorders' | 'upgrades' | 'abort' | ...)`.
`review/` is git-ignored. Look at before and after side by side (open both PNGs). Then:

1. `npm run typecheck` and `npm test` pass.
2. Before and after look the same (small anti-aliasing differences are fine). Check English and
   `?lang=fr`, and the reduced-motion look if the scene has one.
3. `bench-frames.mjs` shows 60 fps at throttle 6, with `workP95` well under 16 ms.
4. No page errors in `shots.mjs` output.

## Who ported what (history)

| Area | Owner |
| --- | --- |
| `src/core/**` (host, kit, scene manager, transitions), `src/ui/views/hud.ts` (HUD kit), `src/main.ts`, `index.html`, final removal of the Canvas 2D overlay | coordinator (Claude) |
| `src/flight/**` views (tutorial and deep flight scenes, map, props, hazards, spotted photo) | flight port (Sol) |
| `src/abduct/**` views (`draw.ts`, `deep-view.ts`, `probe-draw.ts`, `dolphin-art.ts`, `swell-draw.ts`, `wet-view.ts`, `turn-draw.ts`, `souvenir.ts`, the scene in `index.ts`), `src/ui/deep-abduct.ts` | abduction port (Sol) |
| `src/ui/workorders.ts`, `upgrades.ts`, `memo.ts`, `report*.ts`, `abort.ts`, `deep-choice.ts`, `src/ui/draw.ts` helpers they need (portraits...), `tests/ui-report*.test.ts` | menus & report port (Sol) |

Shared kit files (`src/core/gfx/**`, `src/ui/views/{art,button,backdrop,icons}.ts`): the coordinator
owns them. Others may append a small helper (say so in your report) and must not change existing
signatures. The rules in `AGENTS.md` still apply: no git commands that change the index, no new npm
packages, only edit your own area.
