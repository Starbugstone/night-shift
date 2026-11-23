// Deterministic 60 fps explainer capture for Night Shift.
//
// Virtual time: requestAnimationFrame and performance.now are replaced in the page, so every
// recorded frame is exactly 1/60 s of game time however slow the capture is. Each frame is
// composed in the page onto a 1920x1080 canvas (game on the left, captions and live readouts on
// the right, optional overlays drawn over the game in logical 540x960 units), grabbed with
// toDataURL and piped to ffmpeg (libx264, 60 fps, yuv420p, faststart).
//
// page.screenshot hangs on the WSL box this was written on: never use it here.
//
// Usage (see the clip scripts next to this file):
//   source ~/.local/share/claude-media-tools/env.sh   # $FFMPEG, $PLAYWRIGHT_MODULE
//   BASE=http://127.0.0.1:<port>/ node scripts/capture/clip-01-flight.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

/** Frames to wait after a scene appears before sending input (its transition eats presses). */
const SETTLE = 50;

export const BASE = process.env.BASE || 'http://127.0.0.1:5311/';
export const OUT = process.env.OUT || new URL('../../public/media/', import.meta.url).pathname;

const VIRTUAL_TIME = `(() => {
  let now = 0;
  let queue = [];
  let id = 0;
  const t0 = Date.now();
  performance.now = () => now;
  Date.now = () => t0 + Math.round(now);
  window.requestAnimationFrame = (cb) => { queue.push({ id: ++id, cb }); return id; };
  window.cancelAnimationFrame = (h) => { queue = queue.filter((q) => q.id !== h); };
  window.__vt = {
    frames: 0,
    step(n = 1) {
      for (let i = 0; i < n; i++) {
        now += 1000 / 60;
        this.frames++;
        const q = queue; queue = [];
        for (const { cb } of q) cb(now);
      }
    },
    get now() { return now; },
  };
})();`;

// In-page helpers: overlays, readouts and the autopilot drivers. Installed once per page.
const PAGE_LIB = `(() => {
  const TAU = Math.PI * 2;
  const C = { mint: '#7CFFCB', amber: '#FFC24D', red: '#FF4D6D', white: '#FFFFFF', violet: '#B8A9FF', blue: '#6FC3FF' };
  // Ragdoll collision volumes, copied from src/abduct/ragdoll.ts (RADII, MIDPOINT_RADII, BONES).
  const RADII = [32, 22, 31, 13, 11, 13, 11, 16, 14, 16, 14];
  const MID = [24, 34, 12, 10, 12, 10, 15, 13, 15, 13];
  const BONES = [[1,0],[1,2],[1,3],[3,4],[1,5],[5,6],[2,7],[7,8],[2,9],[9,10]];
  const H = {
    C, RADII, MID, BONES, TAU,
    ns() { return window.__nightShift; },
    act() { return window.__nightShift && window.__nightShift.active; },
    dbg() { const a = H.act(); return a && a.debug; },
    /** Deep flight: world offset (camera). */
    flightCam() { const d = H.dbg(); return d && d.sim ? { x: d.sim.camX, y: d.sim.camY } : { x: 0, y: 0 }; },
    abductCam() { const d = H.dbg(); return d && d.camera ? { x: d.camera.x, y: d.camera.y } : { x: 0, y: 0 }; },
    stroke(g, color, w = 3, dash = null) { g.strokeStyle = color; g.lineWidth = w; g.setLineDash(dash || []); },
    circle(g, x, y, r, color, w = 3, fill = null, dash = null) {
      g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU);
      if (fill) { g.fillStyle = fill; g.fill(); }
      H.stroke(g, color, w, dash); g.stroke(); g.setLineDash([]);
    },
    cone(g, x, y, a, half, range, color, w = 3, fill = null) {
      g.beginPath(); g.moveTo(x, y); g.arc(x, y, range, a - half, a + half); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      H.stroke(g, color, w); g.stroke();
    },
    capsule(g, ax, ay, bx, by, r, color, w = 3, fill = null) {
      const a = Math.atan2(by - ay, bx - ax);
      g.beginPath();
      g.arc(bx, by, r, a - Math.PI / 2, a + Math.PI / 2);
      g.arc(ax, ay, r, a + Math.PI / 2, a + Math.PI * 1.5);
      g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); }
      H.stroke(g, color, w); g.stroke();
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); H.stroke(g, color, 1.5, [6, 6]); g.stroke(); g.setLineDash([]);
    },
    rect(g, r, color, w = 2, fill = null) {
      if (fill) { g.fillStyle = fill; g.fillRect(r.x, r.y, r.w, r.h); }
      H.stroke(g, color, w); g.strokeRect(r.x, r.y, r.w, r.h);
    },
    dot(g, x, y, r, color) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = color; g.fill(); },
    label(g, text, x, y, color = C.white, size = 15, align = 'center') {
      g.font = '700 ' + size + 'px Ubuntu, sans-serif'; g.textAlign = align; g.textBaseline = 'middle';
      const w = g.measureText(text).width;
      const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      g.fillStyle = 'rgba(10,6,24,0.82)'; g.fillRect(bx - 6, y - size * 0.75, w + 12, size * 1.5);
      g.fillStyle = color; g.fillText(text, x, y);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    },
    /** The ragdoll's 21 contact circles (11 joints + 10 bone midpoints), world coords. */
    bodyCircles(body) {
      const out = [];
      for (let i = 0; i < 11; i++) out.push([body.x[i], body.y[i], i === 2 ? body.pelvisRadius : RADII[i]]);
      for (let i = 0; i < 10; i++) { const [a, b] = BONES[i]; out.push([(body.x[a] + body.x[b]) / 2, (body.y[a] + body.y[b]) / 2, MID[i]]); }
      return out;
    },
    /** Draw any abduction solid (rect, circle, blade, swinging rect) in world coords. */
    solid(g, s, color, w = 2, fill = null) {
      if (s.kind === 'rect') { if (s.active === false) return; H.rect(g, s, color, w, fill); }
      else if (s.kind === 'circle') H.circle(g, s.x, s.y, s.r, color, w, fill);
      else if (s.kind === 'blade') {
        const c = Math.cos(s.angle), sn = Math.sin(s.angle);
        H.capsule(g, s.x + c * s.from, s.y + sn * s.from, s.x + c * s.to, s.y + sn * s.to, s.r, color, w, fill);
      } else if (s.kind === 'swingingRect') {
        g.save(); g.translate(s.x, s.y); g.rotate(s.angle);
        if (fill) { g.fillStyle = fill; g.fillRect(-s.w / 2, 0, s.w, s.h); }
        H.stroke(g, color, w); g.strokeRect(-s.w / 2, 0, s.w, s.h); g.restore();
        H.dot(g, s.x, s.y, 4, color);
      }
    },
    fmt(v, d = 2) { return (v < 0 ? '' : ' ') + v.toFixed(d); },
    bar(v, n = 20) { const k = Math.max(0, Math.min(n, Math.round(v * n))); return '█'.repeat(k) + '·'.repeat(n - k); },
  };
  window.__cap = H;
  window.__ann = {};
  window.__ro = {};

  // ---- drivers -----------------------------------------------------------------------------
  // Flight: the scene's own autopilot intent (absolute finger, logical px).
  // Abduct: the in-page per-frame pilot. Its relative drag is integrated into a finger target;
  // the Node side moves the real mouse there before the next frame, so latency is zero.
  window.__drv = {
    fx: 270, fy: 520, on: false,
    flight() {
      const d = H.dbg();
      if (!d || typeof d.autopilot !== 'function' || window.__nightShift.scene !== 'flight') return null;
      const it = d.autopilot();
      return { down: it.down, x: it.x, y: it.y };
    },
    abduct() {
      const ns = window.__nightShift;
      const d = H.dbg();
      if (!d || ns.scene !== 'abduct' || typeof d.autopilot !== 'function') return null;
      const it = d.autopilot();
      this.fx += it.dx; this.fy += it.dy;
      return { x: this.fx, y: this.fy };
    },
  };
})();`;

// Composer. cap = { chapter, title, bullets[], step, note, badge, readout[] | ro, ann, state, progress }
const COMPOSER = `(() => {
  const W = 1920, H = 1080;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const g = out.getContext('2d');
  const GX = 96, GY = 0, GW = 608, GH = 1080;
  const PX = 790, PW = 1060;
  // static background, drawn once
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  { const b = bg.getContext('2d');
    b.fillStyle = '#120d24'; b.fillRect(0, 0, W, H);
    b.strokeStyle = 'rgba(124,255,203,0.05)'; b.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { b.beginPath(); b.moveTo(x + 0.5, 0); b.lineTo(x + 0.5, H); b.stroke(); }
    for (let y = 0; y < H; y += 48) { b.beginPath(); b.moveTo(0, y + 0.5); b.lineTo(W, y + 0.5); b.stroke(); }
  }
  function wrap(text, x, y, maxW, lh, draw = true) {
    const words = String(text).split(' ');
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { if (draw) g.fillText(line, x, y); y += lh; line = w; }
      else line = t;
    }
    if (line) { if (draw) g.fillText(line, x, y); y += lh; }
    return y;
  }
  window.__compose = (cap, type, quality) => {
    const c = document.querySelector('canvas');
    g.drawImage(bg, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(c, GX, GY, GW, GH);
    const S = window.__cap;
    if (cap.ann) {
      const fns = Array.isArray(cap.ann) ? cap.ann : [cap.ann];
      g.save();
      g.beginPath(); g.rect(GX, GY, GW, GH); g.clip();
      g.translate(GX, GY); g.scale(GW / 540, GH / 960);
      for (const name of fns) {
        const f = window.__ann[name];
        if (!f) { window.__annErr = 'no annotator ' + name; continue; }
        g.save();
        try { f(g, S, cap.state || {}); } catch (e) { window.__annErr = name + ': ' + (e && e.stack || e); }
        g.restore();
      }
      g.restore();
    }
    g.strokeStyle = 'rgba(124,255,203,0.35)'; g.lineWidth = 2; g.strokeRect(GX - 1, GY - 1, GW + 2, GH + 2);
    if (cap.badge) {
      g.font = '800 30px Ubuntu, sans-serif';
      const bw = g.measureText(cap.badge).width + 36;
      g.fillStyle = 'rgba(255,194,77,0.95)'; g.fillRect(GX + GW - bw - 16, 150, bw, 50);
      g.fillStyle = '#1b1030'; g.textBaseline = 'middle'; g.fillText(cap.badge, GX + GW - bw - 16 + 18, 176); g.textBaseline = 'alphabetic';
    }
    // right panel
    let y = 104;
    if (cap.chapter) {
      g.fillStyle = '#7CFFCB'; g.font = '700 26px Ubuntu, sans-serif';
      g.fillText(cap.chapter.toUpperCase(), PX, y); y += 66;
    }
    if (cap.title) {
      g.fillStyle = '#fff6e0'; g.font = '700 54px Ubuntu, sans-serif';
      y = wrap(cap.title, PX, y, PW, 64) + 22;
    }
    const bullets = cap.bullets || [];
    let lines = cap.readout;
    if (cap.ro && window.__ro[cap.ro]) { try { lines = window.__ro[cap.ro](S, cap.state || {}); } catch (e) { lines = ['readout error: ' + e]; } }
    const nLines = lines ? lines.length : 0;
    let noteY = H - 70;
    if (cap.note) { g.font = 'italic 400 29px Ubuntu, sans-serif'; const nh = wrap(cap.note, PX, 0, PW, 38, false); noteY = H - 52 - nh; }
    const roH = nLines ? nLines * 36 + 26 : 0;
    const limit = noteY - 24 - (roH ? roH + 18 : 0);
    // fit the lit bullets above the readout: shrink the font until they fit
    let fs = 33;
    const shown = bullets.filter((_, i) => cap.step === undefined || i <= cap.step);
    for (; fs > 20; fs -= 2) {
      g.font = '400 ' + fs + 'px Ubuntu, sans-serif';
      let yy = y;
      for (const b of shown) yy = wrap(b, PX + 40, yy, PW - 40, Math.round(fs * 1.3), false) + Math.round(fs * 0.48);
      if (yy - fs <= limit) break;
    }
    const lh = Math.round(fs * 1.3);
    g.font = '400 ' + fs + 'px Ubuntu, sans-serif';
    for (let i = 0; i < bullets.length; i++) {
      const on = cap.step === undefined || i <= cap.step;
      const now = cap.step === i;
      if (!on) continue;
      if (now) { g.fillStyle = 'rgba(124,255,203,0.09)'; const h = wrap(bullets[i], PX + 40, y, PW - 40, lh, false) - y; g.fillRect(PX - 14, y - fs - 3, PW + 20, h + 12); }
      g.fillStyle = now ? '#7CFFCB' : 'rgba(124,255,203,0.55)';
      g.beginPath(); g.arc(PX + 11, y - fs * 0.33, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = now ? '#ffffff' : 'rgba(233,226,255,0.72)';
      y = wrap(bullets[i], PX + 40, y, PW - 40, lh) + Math.round(fs * 0.48);
    }
    if (lines && lines.length) {
      const top = Math.max(y + 8, noteY - 24 - roH - 18);
      g.fillStyle = 'rgba(184,169,255,0.08)'; g.fillRect(PX - 14, top, PW + 20, roH);
      g.fillStyle = 'rgba(184,169,255,0.6)'; g.fillRect(PX - 14, top, 4, roH);
      g.font = '500 27px "DejaVu Sans Mono", monospace';
      let ry = top + 38;
      for (const line of lines) {
        const s = String(line);
        g.fillStyle = s.startsWith('!') ? '#FF6B85' : s.startsWith('~') ? '#FFC24D' : '#d9d0ff';
        g.fillText(s.replace(/^[!~]/, ''), PX + 6, ry); ry += 36;
      }
    }
    if (cap.note) { g.fillStyle = 'rgba(255,200,90,0.95)'; g.font = 'italic 400 29px Ubuntu, sans-serif'; wrap(cap.note, PX, noteY + 24, PW, 38); }
    g.fillStyle = 'rgba(255,255,255,0.32)'; g.font = '400 20px Ubuntu, sans-serif';
    g.fillText('Night Shift · how it\\'s made · 60 fps, 1 frame = 1/60 s of game time', PX, H - 22);
    if (cap.progress !== undefined) {
      g.fillStyle = 'rgba(124,255,203,0.15)'; g.fillRect(PX, H - 12, PW, 4);
      g.fillStyle = 'rgba(124,255,203,0.7)'; g.fillRect(PX, H - 12, PW * Math.max(0, Math.min(1, cap.progress)), 4);
    }
    return out.toDataURL(type, quality);
  };
})();`;

// Accepts arrow functions, function expressions and method shorthand (`name(g, S) { ... }`).
const DEFINE = ([k, n, src]) => {
  let f;
  try { f = (0, eval)('(' + src + ')'); } catch (e) { f = (0, eval)('({' + src + '})')[n]; }
  window[k === 'ann' ? '__ann' : '__ro'][n] = f;
};

export class Capture {
  /** Open the game at `path` (relative to BASE) with virtual time. */
  static async open(path, { dpr = 608 / 540, out, crf = 23, quality = 0.88, settle = 40, save = null } = {}) {
    const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'] });
    const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: dpr, hasTouch: false });
    await context.addInitScript(VIRTUAL_TIME);
    // optional save fixture (e.g. owned upgrades), written before the game boots
    // (once per tab: later navigations keep whatever the clip did to the save)
    if (save) await context.addInitScript((s) => { try { if (!sessionStorage.getItem('__fixture')) { localStorage.setItem('night-shift-save-v1', s); sessionStorage.setItem('__fixture', '1'); } } catch (e) { /* ignore */ } }, JSON.stringify(save));
    const page = await context.newPage();
    const cap = new Capture(browser, page, out, { crf, quality });
    page.on('pageerror', (e) => cap.errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') cap.errors.push(m.text()); });
    await page.goto(BASE + path);
    await page.evaluate(PAGE_LIB);
    await page.evaluate(COMPOSER);
    // let assets load: step virtual frames while real time passes
    for (let i = 0; i < settle; i++) {
      await page.evaluate(() => window.__vt.step(1));
      await page.waitForTimeout(40);
    }
    // wait out the loading scene (art decodes in real time)
    for (let i = 0; i < 400; i++) {
      const sc = await page.evaluate(() => window.__nightShift && window.__nightShift.scene);
      if (sc && sc !== 'loading') break;
      await page.evaluate(() => window.__vt.step(1));
      await page.waitForTimeout(25);
    }
    return cap;
  }

  constructor(browser, page, out, { crf, quality }) {
    this.browser = browser;
    this.page = page;
    this.out = out;
    this.quality = quality;
    this.crf = crf;
    this.frames = 0;
    this.errors = [];
    this.down = false;
    this.t0 = Date.now();
    this.ff = null;
    this.defs = [];
  }

  /** Navigate to another entry point mid-clip: reinstalls the page helpers and definitions. */
  async nav(path, scene) {
    await this.release();
    await this.page.goto(BASE + path);
    await this.page.evaluate(PAGE_LIB);
    await this.page.evaluate(COMPOSER);
    for (const d of this.defs) await this.page.evaluate(DEFINE, d);
    for (let i = 0; i < 400; i++) {
      const sc = await this.page.evaluate(() => window.__nightShift && window.__nightShift.scene);
      if (sc && sc !== 'loading' && (!scene || sc === scene)) break;
      await this.page.evaluate(() => window.__vt.step(1));
      await this.page.waitForTimeout(25);
    }
    await this.step(SETTLE);
  }

  startVideo() {
    if (!this.out) return;
    mkdirSync(dirname(this.out), { recursive: true });
    this.ff = spawn(process.env.FFMPEG || 'ffmpeg', [
      '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', String(this.crf), '-pix_fmt', 'yuv420p', '-r', '60',
      '-movflags', '+faststart', this.out,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    this.done = new Promise((res, rej) => this.ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  }

  /** Register in-page overlay (`ann`) or readout (`ro`) functions by name. */
  async define(kind, fns) {
    for (const [name, fn] of Object.entries(fns)) {
      this.defs.push([kind, name, fn.toString()]);
      await this.page.evaluate(DEFINE, [kind, name, fn.toString()]);
    }
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }

  /** Advance n frames without recording. */
  async step(n = 1) {
    await this.page.evaluate((k) => window.__vt.step(k), n);
  }

  /**
   * Advance n frames that will not be recorded, skipping the active scene's render (the
   * simulation still runs every frame). Used for time-lapse frames.
   */
  async fastStep(n = 1) {
    await this.page.evaluate((k) => {
      for (let i = 0; i < k; i++) {
        const a = window.__nightShift && window.__nightShift.active;
        if (!a) { window.__vt.step(1); continue; }
        const own = Object.prototype.hasOwnProperty.call(a, 'render');
        const r = a.render;
        a.render = () => {};
        try { window.__vt.step(1); } finally { if (own) a.render = r; else delete a.render; }
      }
    }, n);
  }

  /** Advance `adv` frames (default 1) and record one composed frame. */
  async frame(cap, adv = 1) {
    if (!this.ff && this.out) this.startVideo();
    if (!this.out) {
      // dry run: same work, nothing written
      await this.page.evaluate(([c, q, k]) => { window.__vt.step(k); return window.__compose(c, 'image/jpeg', q).length; }, [cap, this.quality, adv]);
      this.frames++;
      return;
    }
    const data = await this.page.evaluate(([c, q, k]) => { window.__vt.step(k); return window.__compose(c, 'image/jpeg', q); }, [cap, this.quality, adv]);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!this.ff.stdin.write(buf)) await new Promise((r) => this.ff.stdin.once('drain', r));
    this.frames++;
    if (this.frames % 300 === 0) this.log(`${this.frames} frames`);
  }

  /** Write the current composition (no time advance) as a PNG still. */
  async still(file, cap) {
    const data = await this.page.evaluate(([c]) => window.__compose(c, 'image/png', 1), [cap]);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
    this.log('still ' + file);
  }

  // ---- real pointer input, logical 540x960 px (the viewport is exactly the logical canvas)
  async move(x, y) { await this.page.mouse.move(Math.max(1, Math.min(539, x)), Math.max(1, Math.min(959, y))); }
  async press(x, y) { if (x !== undefined) await this.move(x, y); if (!this.down) { await this.page.mouse.down(); this.down = true; } }
  async release() { if (this.down) { await this.page.mouse.up(); this.down = false; } }
  async tap(x, y) { await this.press(x, y); await this.step(2); await this.release(); await this.step(2); }

  /** One frame of the flight autopilot: replay its finger with the real mouse. */
  async flightPilot() {
    const it = await this.page.evaluate(() => window.__drv.flight());
    if (!it) return null;
    if (!it.down) await this.release();
    else { await this.move(it.x, it.y); await this.press(); }
    return it;
  }

  /**
   * One frame of the abduction pilot. Holds a drag from the anchor; when the integrated finger
   * nears the screen edge it lifts this frame and presses again at the anchor next frame
   * (a release and a press in the same frame would end the drag).
   */
  async abductPilot() {
    const A = [270, 520];
    if (this.regrip) {
      this.regrip = false;
      await this.page.evaluate(([x, y]) => { const d = window.__drv; d.fx = x; d.fy = y; }, A);
      await this.press(A[0], A[1]);
      return;
    }
    if (!this.down) {
      await this.page.evaluate(([x, y]) => { const d = window.__drv; d.fx = x; d.fy = y; }, A);
      await this.press(A[0], A[1]);
      return;
    }
    const t = await this.page.evaluate(() => window.__drv.abduct());
    if (!t) return;
    if (t.x < 30 || t.x > 510 || t.y < 170 || t.y > 900) { await this.release(); this.regrip = true; return; }
    await this.move(t.x, t.y);
  }

  /** Step frames (with a little real time for asset loads) until the scene is `name`. */
  async waitScene(name, maxFrames = 600) {
    for (let i = 0; i < maxFrames; i++) {
      // once there, let the scene transition finish: a press during it is dropped
      if ((await this.scene()) === name) { await this.step(SETTLE); return true; }
      await this.step(1);
      await this.page.waitForTimeout(15);
    }
    throw new Error('timeout waiting for scene ' + name + ', at ' + (await this.scene()));
  }

  scene() { return this.page.evaluate(() => window.__nightShift.scene); }

  log(s) { console.error(`[${(this.out || '').split('/').pop()}] ${((Date.now() - this.t0) / 1000).toFixed(0)}s ${s}`); }

  async close() {
    const annErr = await this.page.evaluate(() => window.__annErr || null).catch(() => null);
    if (annErr) this.errors.push('annotate: ' + annErr);
    if (this.ff) { this.ff.stdin.end(); await this.done; }
    await this.browser.close();
    this.log(`done: ${this.frames} frames (${(this.frames / 60).toFixed(1)} s), ${((Date.now() - this.t0) / Math.max(1, this.frames)).toFixed(0)} ms/frame, errors: ${JSON.stringify(this.errors)}`);
  }
}

/** Caption helper: which bullet is lit at clip time t (seconds), from bullet start times. */
export function stepAt(t, starts) {
  let s = -1;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) s = i;
  return s;
}
