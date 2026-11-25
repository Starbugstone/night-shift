// Batching diagnostics (docs/PIXI-MIGRATION.md): why a page takes the draw calls it does.
//   PAGES=title,flight=3 node scripts/pixi/batches.mjs BASE_URL   (an e2e or dev build: needs __nightShift.stage)
// For each page: the root render group's instructions (batches with their blend mode and size, solo
// Graphics, masks, filters), and the renderables at alpha 0, which Pixi still batches and draws,
// so one with another blend mode than its neighbours splits a batch in two for nothing.
const base = process.argv[2];
if (!base) {
  console.error('usage: batches.mjs BASE_URL');
  process.exit(2);
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pages = (process.env.PAGES ?? 'title,room=farm_window,flight=3,flight=7,flight=8').split(',');
const browser = await chromium.launch({ args: (process.env.GPUARGS ?? '').split(' ').filter(Boolean) });
const ctx = await browser.newContext({ viewport: { width: 375, height: 690 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
for (const p of pages) {
  await page.goto(base + '/?unlock=1&' + p);
  await page.waitForFunction(() => window.__nightShift && window.__nightShift.scene !== 'loading', null, { timeout: 30000 });
  await page.waitForTimeout(Number(process.env.WAIT ?? 3000));
  const r = await page.evaluate(() => {
    const stage = window.__nightShift.stage;
    const ins = stage.renderGroup?.instructionSet?.instructions ?? [];
    const n = stage.renderGroup?.instructionSet?.instructionSize ?? ins.length;
    const list = [];
    for (let i = 0; i < n; i++) {
      const it = ins[i];
      if (!it) continue;
      if (it.renderPipeId === 'batch') list.push(`batch(${it.blendMode},${it.size / 6 | 0}q,${it.textures?.count ?? '?'}t)`);
      else list.push(it.renderPipeId + (it.action ? ':' + it.action : ''));
    }
    // renderables in build order, to find what sits between two batches
    const order = [];
    const walk = (c, path) => {
      if (c.globalDisplayStatus < 7 || c.localDisplayStatus < 7) return;
      const name = c.label || c.constructor?.name || '?';
      const here = path + '/' + name;
      if (c.renderPipeId) {
        const b = c.getBounds?.();
        const gd = c.context ? Object.values(c.context._gpuData ?? {})[0] : null;
        order.push({ pipe: c.renderPipeId, blend: c.groupBlendMode ?? c.blendMode, alpha: +(c.groupAlpha ?? c.worldAlpha ?? 1).toFixed(2), path: here.slice(-60), box: b ? [b.x | 0, b.y | 0, b.width | 0, b.height | 0] : null, solo: c.context ? c.context.batchMode : undefined, unbatched: gd && !gd.isBatchable ? (gd.geometryData?.vertices?.length ?? 0) / 2 : 0 });
      }
      if (c.mask || (c.filters && c.filters.length)) order.push({ pipe: c.mask ? 'MASK' : 'FILTER', path: here.slice(-60) });
      for (const ch of c.children ?? []) walk(ch, here);
    };
    walk(stage, '');
    // run-length of blend modes in build order: each change splits a batch
    const runs = [];
    for (const o of order) {
      const key = o.pipe === 'MASK' || o.pipe === 'FILTER' ? o.pipe : o.blend === 'add' ? 'add' : 'normal';
      const last = runs[runs.length - 1];
      if (last && last.key === key) { last.n++; last.alpha0 += o.alpha === 0 ? 1 : 0; } else runs.push({ key, n: 1, alpha0: o.alpha === 0 ? 1 : 0, first: `${o.pipe} ${o.path} ${JSON.stringify(o.box)}` });
    }
    const zero = order.filter((o) => o.alpha === 0);
    return { runs: runs.filter((r) => r.key !== 'normal').map((r) => `${r.key}x${r.n}${r.alpha0 ? ` (${r.alpha0} at alpha 0)` : ''} first: ${r.first}`), list, renderables: order.length, zero: zero.length, zeroAdd: zero.filter((o) => o.blend && o.blend !== 'normal' && o.blend !== 'inherit').map((o) => `${o.pipe} ${o.blend} ${o.path} ${JSON.stringify(o.box)}`), solo: order.filter((o) => o.unbatched).map((o) => `${o.solo === 'no-batch' ? 'solo' : o.unbatched + ' vertices'} ${o.path} ${JSON.stringify(o.box)}`), breaks: order.filter((o) => o.pipe === 'MASK' || o.pipe === 'FILTER').map((o) => `${o.pipe} ${o.path}`) };
  });
  console.log(`== ${p}: ${r.list.length} instructions, ${r.renderables} renderables, ${r.zero} at alpha 0`);
  console.log('  ' + r.list.join(' '));
  if (process.env.RUNS) console.log('  non-normal runs:\n    ' + r.runs.join('\n    '));
  if (r.zeroAdd.length) console.log('  alpha 0, non-normal blend:\n    ' + r.zeroAdd.join('\n    '));
  if (r.solo.length) console.log('  unbatched Graphics:\n    ' + r.solo.join('\n    '));
  if (r.breaks.length) console.log('  masks/filters:\n    ' + r.breaks.join('\n    '));
}
await browser.close();
