// Speech bubbles on every flight map stay on top: barks, quips and pills live in the world's
// FLIGHT_BUBBLES layer, and only the player's own layers (saucer, fuse ring, particles: label
// FLIGHT_PLAYER) may be drawn after it. Walks every flight level until the level id repeats,
// so new levels are checked without editing this script.
//   node scripts/pixi/check-bubbles.mjs BASE_URL      (an e2e or dev build: reads __nightShift.stage)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2];
if (!base) { console.error('usage: check-bubbles.mjs BASE_URL'); process.exit(2); }
const browser = await chromium.launch({ args: (process.env.GPUARGS ?? '').split(' ').filter(Boolean) });
const page = await browser.newPage({ viewport: { width: 375, height: 690 } });
const seen = new Set();
let failures = 0;
for (let n = 1; n < 40; n++) {
  await page.goto(`${base}?flight=${n}`);
  await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene === 'flight' && !window.__nightShift.transitioning, null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const ns = window.__nightShift;
    const a = ns.active;
    const id = (a.level && a.level.id) || (a.opts && a.opts.level && a.opts.level.id) || '?';
    const layers = [];
    const walk = (c) => { if (c.label === 'flight-bubbles') layers.push(c); for (const k of c.children ?? []) walk(k); };
    walk(ns.stage);
    if (layers.length !== 1) return { id, problem: `expected one bubble layer, found ${layers.length}` };
    const bubbles = layers[0];
    const problems = [];
    // every container on the path from the bubble layer to the stage: nothing but player layers after it
    for (let c = bubbles, p = c.parent; p && p !== ns.stage; c = p, p = p.parent) {
      const after = p.children.slice(p.children.indexOf(c) + 1);
      const bad = after.filter(k => k.label !== 'flight-player');
      if (p === bubbles.parent && bad.length) problems.push(`${bad.length} map layer(s) drawn above the bubbles: ${bad.map(k => k.label || k.constructor.name).join(', ')}`);
      if (p !== bubbles.parent) break; // above the world container are tints and the HUD, which may cover the world
    }
    // the bubble layer's parent must be the last world layer (nothing else of the map after it)
    const world = bubbles.parent.parent;
    const tail = world.children.slice(world.children.indexOf(bubbles.parent) + 1);
    if (tail.length) problems.push(`${tail.length} world layer(s) after the layer holding the bubbles`);
    return { id, problem: problems.join('; ') || null, count: bubbles.children.length };
  });
  if (seen.has(r.id)) break;
  seen.add(r.id);
  console.log(`${r.problem ? 'FAIL' : 'ok  '} ${r.id}${r.count !== undefined ? ` (${r.count} bubble groups)` : ''}${r.problem ? ': ' + r.problem : ''}`);
  if (r.problem) failures++;
}
await browser.close();
process.exit(failures ? 1 : 0);
