import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2];
if (!base) throw new Error('Usage: node scripts/pixi/capture-birch.mjs BASE_URL');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'] });
const viewport = { width: 375, height: 690 };
const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const output = process.env.OUT || 'review';
const setup = [
  { id: 'birch_bakery', rooms: ['mabel_stockroom', 'mabel_vent'], find: 'cherry_pie', specimens: ['mabel'] },
  { id: 'birch_neighbours', rooms: ['nora_side', 'nora_loft', 'len_workshop', 'len_skylight'], find: 'garden_gnome', specimens: ['nora', 'len'] },
];
const fromUrl = new URL(base);
fromUrl.searchParams.set('unlock', '1');

function coords(x, y) {
  const scale = viewport.width / 540;
  return [x * scale, (viewport.height - 960 * scale) / 2 + y * scale];
}

async function waitForScene(scene) {
  await page.waitForFunction(expected => {
    const ns = window.__nightShift;
    return ns?.scene === expected && !ns.transitioning;
  }, scene, { timeout: 90000, polling: 100 });
}

async function go(scene, arg) {
  await page.evaluate(([scene, arg]) => window.__nightShift.goto(scene, arg), [scene, arg]);
  await waitForScene(scene);
}

async function shot(folder, name, data) {
  const png = data ?? await page.evaluate(() => { window.__nightShift.redraw(); return window.__nightShift.capture(); });
  writeFileSync(join(folder, name + '.png'), Buffer.from(png.split(',')[1], 'base64'));
}

async function pointer(x, y) {
  await page.mouse.click(...coords(x, y), { delay: 70 });
}

try {
  await page.goto(fromUrl.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForScene('title');
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('#game').getContext('webgl2');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
  });
  console.log('WebGL renderer', gpu);
  const orders = await page.evaluate(() => window.__nightShift.workOrders);
  for (const { id, rooms, find, specimens } of setup) {
    const folder = join(output, id);
    mkdirSync(folder, { recursive: true });
    const { num } = orders.find(order => order.id === id);
    await go('workorders');
    await page.evaluate(num => { window.__nightShift.active.scroll = (num - 2) * 224; }, num);
    await shot(folder, 'work-order');
    await go('memo', num);
    await pointer(272, 251);
    await shot(folder, 'memo');

    await go('flight', num);
    await page.evaluate(() => { window.__nightShift.active.bannerT = 0; });
    // Capture frames with exactly the hazard geometry shown by the play view.
    const tells = await page.evaluate(async id => {
      const ns = window.__nightShift;
      const frames = [];
      const captureAt = (x, y, hazardTime, arm = 0, lit = 0, hot = false) => {
        const { sim } = ns.active;
        sim.place(x, y, 0);
        sim.st.t = hazardTime;
        sim.field.sample(hazardTime);
        if (sim.st.porchArm.length) {
          sim.st.porchArm[0] = arm;
          sim.st.porchLit[0] = lit;
        }
        sim.st.cause = hot ? 0 : -1;
        sim.st.sus = hot ? 0.56 : 0;
        ns.redraw(); return ns.capture();
      };
      if (id === 'birch_bakery') {
        for (let i = 0; i < 16; i++) {
          const hot = i >= 6;
          frames.push(captureAt(550, 1182 - i * 7, i / 8, hot ? 0.4 : 0.11 + i * 0.053, hot ? 2.9 : 0, hot));
        }
      } else {
        for (let i = 0; i < 16; i++) {
          const hot = i >= 6;
          frames.push(captureAt(425 + i * 8, 1270 - i * 3, 2.59 + i * 0.064, 0, 0, hot));
        }
      }
      const { def } = ns.run.collectible;
      return { frames, pickup: captureAt(def.x + 55, def.y + 112, 1) };
    }, id);
    await shot(folder, 'hazard-amber', tells.frames[3]);
    await shot(folder, 'hazard-red', tells.frames[10]);
    await shot(folder, 'pickup', tells.pickup);
    const clip = join(folder, 'frames');
    mkdirSync(clip, { recursive: true });
    for (const [i, img] of tells.frames.entries()) await shot(clip, String(i).padStart(3, '0'), img);

    for (const room of rooms) {
      await go('abduct', room);
      await shot(folder, room + '-spawn');
    }

    // The catalogue fixture fills these exhibits without writing the browser save.
    await page.evaluate(({ id, find, rooms, specimens }) => {
      const ns = window.__nightShift;
      ns.save.levels[id].mapCollectible = find;
      for (const [i, item] of (id === 'birch_bakery' ? ['sourdough starter', 'kitchen timer']
        : ['house-sitting checklist', 'magnetic parts dish', 'bicycle bell', 'biscuit tin']).entries()) {
        ns.save.trophies[item] = { count: 1, room: rooms[i], first: 1 };
      }
      for (const [i, name] of specimens.entries()) ns.save.specimens[name] = { count: 3, room: rooms[i * 2], first: 1, probed: false, probes: 0 };
      if (find === 'garden_gnome') {
        for (const era of ['level11', 'level10', 'level12']) ns.save.levels[era] = { delivered: true, stars: [true, false, false, false], attempts: 1, bestTimeSec: 150 };
      }
    }, { id, find, rooms, specimens });

    await go('trophies');
    const exhibit = async (tab, key) => {
      await page.evaluate(([tab, key]) => {
        const scene = window.__nightShift.active;
        scene.switchRoom(tab);
        const index = scene.nav[tab].findIndex(({ sel: { item } }) => (item.slot.id ?? item.slot.itemId) === key);
        if (index < 0) throw new Error('Missing exhibit ' + key);
        scene.openStop(index, true);
      }, [tab, key]);
      await shot(folder, 'trophy-' + key.replaceAll(' ', '-'));
    };
    await exhibit('town', find);
    for (const name of specimens) await exhibit('specimens', name);
    const souvenirs = id === 'birch_bakery' ? ['sourdough starter', 'kitchen timer'] : ['house-sitting checklist', 'magnetic parts dish', 'bicycle bell', 'biscuit tin'];
    for (const name of souvenirs) await exhibit('souvenirs', name);
    console.log(id, 'captured');
  }

  const bakery = join(output, 'birch_bakery');
  await go('report', { level: 2, persist: true });
  await pointer(270, 250);
  await page.waitForFunction(() => window.__nightShift.active.next.enabled);
  await pointer(394, 890);
  await waitForScene('field-check');
  await shot(bakery, 'field-check-offer');
  await pointer(270, 875);
  await waitForScene('memo');
  const landed = await page.evaluate(() => {
    const ns = window.__nightShift;
    return { id: ns.active.level.id, seen: ns.save.fieldCheckSeen };
  });
  if (landed.id !== 'birch_bakery' || !landed.seen) throw new Error('Field Check skip missed the bakery memo');
  await pointer(270, 250);
  await shot(bakery, 'field-check-replay-button');
  await pointer(142, 891);
  await waitForScene('field-check');
  console.log('Field Check skipped, opened Birch Lane and replayed');

  fromUrl.searchParams.set('lang', 'fr');
  await page.goto(fromUrl.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForScene('title');
  for (const { id } of setup) {
    const { num } = orders.find(order => order.id === id);
    await go('memo', num);
    await pointer(272, 251);
    await shot(join(output, id), 'memo-fr');
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
