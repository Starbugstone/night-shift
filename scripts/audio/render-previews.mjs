// From the repository root: node scripts/audio/render-previews.mjs [before-ref]
// Playwright can also be supplied through PLAYWRIGHT_MODULE, as in the game's e2e scripts.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const before = process.argv[2] ?? '800c04ca84357c4475378954888d591ccbab7070';
const out = join(root, 'review/sound');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const mp3 = spawnSync(ffmpeg, ['-version'], { stdio: 'ignore' }).status === 0;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const tmp = mkdtempSync(join(tmpdir(), 'night-shift-audio-'));
let browser;

function oldSource(path) {
  return execFileSync('git', ['show', `${before}:${path}`], { cwd: root, encoding: 'utf8' });
}

try {
  mkdirSync(out, { recursive: true });
  mkdirSync(join(tmp, 'src/audio'), { recursive: true });
  for (const path of ['src/contracts.ts', 'src/audio/sfx.ts', 'src/audio/voice.ts', 'src/audio/voice-plan.ts']) {
    writeFileSync(join(tmp, path), oldSource(path));
  }
  const entry = join(tmp, 'preview.js');
  writeFileSync(entry, `
    import { SynthAudio as Before } from './src/audio/sfx.ts';
    import { SynthAudio as After } from ${JSON.stringify(join(root, 'src/audio/sfx.ts'))};
    import { en } from ${JSON.stringify(join(root, 'src/i18n/en.ts'))};
    window.memoLine = en.levels.level1.body;
    window.renderPreview = ${renderInChromium.toString()};
  `);
  const builds = await build({
    root, configFile: false, logLevel: 'error',
    build: { write: false, minify: false, lib: { entry, name: 'NightShiftPreview', formats: ['iife'] } },
  });
  browser = await chromium.launch();
  const page = await browser.newPage();
  const bundle = (Array.isArray(builds) ? builds[0] : builds).output.find((item) => item.type === 'chunk');
  await page.addScriptTag({ content: bundle.code });
  const headings = ['| File | Duration (s) | RMS (dBFS) | Peak (dBFS) |', '| --- | ---: | ---: | ---: |'];
  const table = [...headings];
  const links = [...headings];
  const runs = [];
  const beds = [...readFileSync(join(root, 'src/contracts.ts'), 'utf8')
    .match(/export type AmbientBed = ([^;]+);/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const bed of beds) {
    runs.push({ name: `ambient-${bed}`, seconds: 20, events: [[0, 'after', 'ambient', bed], [18.5, 'after', 'ambient', null]] });
  }

  const cases = (source) => [...source.matchAll(/case '([^']+)':/g)].map((m) => m[1]);
  const oldCues = cases(oldSource('src/audio/sfx.ts'));
  const newCues = cases(readFileSync(join(root, 'src/audio/sfx.ts'), 'utf8'));
  const cues = [...new Set([...oldCues, ...newCues])];
  const reelIndex = ['| Cue | Before (s) | After (s) |', '| --- | ---: | ---: |'];
  const events = [];
  let at = 0.25;
  for (const cue of cues) {
    const gap = ({ fail: 1.8, lullaby: 1.72, sunrise: 1.4, spotted: 1.14, snore: 1.1, monolith_hum: 1.06 })[cue] ?? 0.95;
    const hasOld = oldCues.includes(cue);
    const hasNew = newCues.includes(cue);
    if (hasOld) events.push([at, 'before', 'sfx', cue]);
    if (hasNew) events.push([at + gap, 'after', 'sfx', cue]);
    reelIndex.push(`| ${cue} | ${hasOld ? at.toFixed(2) : 'silent'} | ${hasNew ? (at + gap).toFixed(2) : 'silent'} |`);
    at += gap * 2;
  }
  runs.push({ name: 'sfx-before-after', seconds: at, events });
  const memo = await page.evaluate(() => window.memoLine);
  for (const version of ['before', 'after']) {
    runs.push({ name: `vrell-${version}`, seconds: 4, events: [[0.25, version, 'speak', memo, 'vrell', { within: memo.length / 70 }]] });
  }

  for (const { name, seconds, events } of runs) {
    const { base64, rms, peak } = await page.evaluate((args) => window.renderPreview(args), { seconds, events });
    const wav = join(out, name + '.wav');
    writeFileSync(wav, Buffer.from(base64, 'base64'));
    addRow(name + '.wav', seconds, rms, peak);
    if (mp3) {
      const path = join(out, name + '.mp3');
      execFileSync(ffmpeg, ['-loglevel', 'error', '-y', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '2', path]);
      const decoded = execFileSync(ffmpeg, ['-loglevel', 'error', '-i', path, '-f', 'f32le', 'pipe:1'], { maxBuffer: 32 * 1024 * 1024 });
      let peak = 0;
      let squares = 0;
      for (let i = 0; i < decoded.length; i += 4) {
        const sample = decoded.readFloatLE(i);
        peak = Math.max(peak, Math.abs(sample));
        squares += sample * sample;
      }
      addRow(name + '.mp3', seconds, 10 * Math.log10(squares / (decoded.length / 4)), 20 * Math.log10(peak));
    }
  }
  function addRow(file, seconds, rms, peak) {
    if (!Number.isFinite(rms) || peak >= -1) throw new Error(`${file} has invalid audio or peaks at ${peak.toFixed(1)} dBFS (limit −1)`);
    const values = `| ${seconds.toFixed(2)} | ${rms.toFixed(1)} | ${peak.toFixed(1)} |`;
    table.push(`| ${file} ${values}`);
    links.push(`| [${file}](${file}) ${values}`);
  }
  const index = [
    '# Night Shift sound previews', '',
    `Before audio is from Git ref \`${before}\`. Each clip is available as ${mp3 ? 'WAV and MP3' : 'WAV'}.`, '',
    'Metering uses full clips including fades and gaps. MP3 levels are measured after decoding. All peaks are below −1 dBFS.', '',
    ...links, '', '## SFX reel cue positions', '', ...reelIndex, '', '## Vrell memo line', '', `> ${memo}`, '',
  ].join('\n');
  writeFileSync(join(out, 'index.md'), index);
  console.log(table.join('\n'));
} finally {
  await browser?.close();
  rmSync(tmp, { recursive: true, force: true });
}

async function renderInChromium({ seconds, events }) {
  const rate = 48000;
  const offline = new OfflineAudioContext(1, Math.ceil(seconds * rate), rate);
  const originalContext = window.AudioContext;
  const originalRandom = Math.random;
  let now = 0;
  let randomState = 0x4e534846;
  const players = {};
  // The games schedule on a realtime clock. Give the real Web Audio graph an offline clock
  // we can advance between events, then render its scheduled automation in one pass.
  window.AudioContext = function () {
    return new Proxy(offline, {
      get(target, key) {
        if (key === 'currentTime') return now;
        if (key === 'state') return 'running';
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };
  Math.random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 2 ** 32;
  };
  try {
    for (const [at, version, method, ...args] of events) {
      now = at;
      if (!players[version]) {
        players[version] = version === 'before' ? new Before() : new After();
        players[version].unlock();
      }
      players[version][method](...args);
    }
  } finally {
    window.AudioContext = originalContext;
    Math.random = originalRandom;
  }

  const samples = (await offline.startRendering()).getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const wav = new DataView(buffer);
  for (const [offset, label] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']]) {
    for (let i = 0; i < label.length; i++) wav.setUint8(offset + i, label.charCodeAt(i));
  }
  wav.setUint32(4, buffer.byteLength - 8, true);
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, rate, true);
  wav.setUint32(28, rate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  wav.setUint32(40, samples.length * 2, true);
  let square = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    square += x * x;
    peak = Math.max(peak, Math.abs(x));
    wav.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, x)) * 32767), true);
  }
  if (!Number.isFinite(square) || peak === 0) throw new Error('Audio render was empty or invalid');
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 32768) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  return { base64: btoa(chunks.join('')), rms: 10 * Math.log10(square / samples.length), peak: 20 * Math.log10(peak) };
}
