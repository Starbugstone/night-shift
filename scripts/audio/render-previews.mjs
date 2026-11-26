// From the repository root: source ~/.local/share/claude-media-tools/env.sh
// node scripts/audio/render-previews.mjs [before-ref]
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const before = process.argv[2] ?? '07bc4efd7010337065b35ac40d8b686ebfbcdd9f';
const out = join(root, 'review/sound-v2');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const rate = 48000;
const gap = Buffer.alloc(rate * 0.6 * 4);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const tmp = mkdtempSync(join(tmpdir(), 'night-shift-audio-'));
let browser;

function oldSource(path) {
  return execFileSync('git', ['show', `${before}:${path}`], { cwd: root, encoding: 'utf8' });
}

try {
  // Bundle the historical synth with its own dependencies so the comparison survives edits to today's synth.
  const oldAudio = execFileSync('git', ['ls-tree', '-r', '--name-only', before, 'src/audio'], { cwd: root, encoding: 'utf8' });
  mkdirSync(join(tmp, 'src/audio'), { recursive: true });
  for (const path of oldAudio.trim().split('\n')) writeFileSync(join(tmp, path), oldSource(path));
  const entry = join(tmp, 'preview.js');
  writeFileSync(entry, `
    import { SynthAudio as Before } from './src/audio/sfx.ts';
    import { SynthAudio as After } from ${JSON.stringify(join(root, 'src/audio/sfx.ts'))};
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

  const cases = (source) => [...source.matchAll(/case '([^']+)':/g)].map((m) => m[1]);
  const oldCues = cases(oldSource('src/audio/sfx.ts'));
  const newCues = cases(readFileSync(join(root, 'src/audio/sfx.ts'), 'utf8'));
  const cues = [...new Set([...newCues, ...oldCues])];
  const rows = [];
  const reel = [];
  const comparison = [];
  let reelFrames = 0;
  let comparisonFrames = 0;
  mkdirSync(out, { recursive: true });

  for (const cue of cues) {
    const file = `sfx-${cue}.mp3`;
    const oldClip = oldCues.includes(cue) ? await render('before', cue) : null;
    const newClip = newCues.includes(cue) ? await render('after', cue) : null;
    const oldAt = oldClip ? seconds(comparisonFrames) : '—';
    if (oldClip) {
      comparison.push(oldClip, gap);
      comparisonFrames += (oldClip.length + gap.length) / 4;
    }
    const newAt = newClip ? seconds(comparisonFrames) : '—';
    if (newClip) {
      comparison.push(newClip, gap);
      comparisonFrames += (newClip.length + gap.length) / 4;
      const stats = encode(file, newClip);
      rows.push({ file, at: seconds(reelFrames), oldAt, newAt, ...stats });
      reel.push(newClip, gap);
      reelFrames += (newClip.length + gap.length) / 4;
    } else {
      rows.push({ file, at: '—', oldAt, newAt });
    }
  }
  reel.pop();
  comparison.pop();
  encode('sfx-reel.mp3', Buffer.concat(reel));
  encode('sfx-before-after.mp3', Buffer.concat(comparison));

  const levels = rows.flatMap((row) => row.rms === undefined ? [] : [row.rms]);
  const span = Math.max(...levels) - Math.min(...levels);
  const headings = [
    '| Cue | Reel (s) | RMS (dBFS) | Peak (dBFS) | Before (s) | After (s) |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];
  const table = rows.map(({ file, at, rms, peak, oldAt, newAt }) =>
    `| ${rms === undefined ? file : `[${file}](${file})`} | ${at} | ${rms?.toFixed(1) ?? '—'} | ${peak?.toFixed(1) ?? '—'} | ${oldAt} | ${newAt} |`);
  const index = [
    '# Night Shift game sound previews', '',
    '[Full reel](sfx-reel.mp3) · [Before and after](sfx-before-after.mp3)', '',
    `Before audio comes from Git ref \`${before}\`. Both versions play through the game's Web Audio graph at the default volume. The clips keep their envelopes and receive no gain adjustment during export.`, '',
    `The reel has a 0.600-second gap between clips. RMS and peak are measured on the decoded individual MP3s. Cue RMS spans ${span.toFixed(1)} dB.`, '',
    ...headings, ...table, '',
  ].join('\n');
  writeFileSync(join(out, 'index.md'), index);
  console.log(index);
  if (span > 6) throw new Error(`Cue RMS spread is ${span.toFixed(1)} dB (limit 6)`);

  async function render(version, cue) {
    const base64 = await page.evaluate((args) => window.renderPreview(args), { version, cue, rate });
    const pcm = Buffer.from(base64, 'base64');
    // Drop the offline render's silent padding, leaving 20 ms after the last sample above −80 dBFS.
    let end = pcm.length;
    while (end > 0 && Math.abs(pcm.readFloatLE(end - 4)) < 0.0001) end -= 4;
    if (end === 0 || end > pcm.length - rate * 0.020 * 4) throw new Error(`${version} ${cue} is silent or exceeds its render window`);
    return pcm.subarray(0, end + rate * 0.020 * 4);
  }
} finally {
  await browser?.close();
  rmSync(tmp, { recursive: true, force: true });
}

function seconds(frames) {
  return (frames / rate).toFixed(3);
}

function encode(file, pcm) {
  const path = join(out, file);
  execFileSync(ffmpeg, [
    '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(rate), '-ac', '1', '-i', 'pipe:0',
    '-codec:a', 'libmp3lame', '-q:a', '2', path,
  ], { input: pcm });
  const decoded = execFileSync(ffmpeg, ['-loglevel', 'error', '-i', path, '-f', 'f32le', 'pipe:1'], { maxBuffer: 32 * 1024 * 1024 });
  let peak = 0;
  let squares = 0;
  for (let i = 0; i < decoded.length; i += 4) {
    const sample = decoded.readFloatLE(i);
    peak = Math.max(peak, Math.abs(sample));
    squares += sample * sample;
  }
  const rms = 10 * Math.log10(squares / (decoded.length / 4));
  const peakDb = 20 * Math.log10(peak);
  if (!Number.isFinite(rms) || peakDb >= -1) throw new Error(`${file} has invalid audio or peaks at ${peakDb.toFixed(1)} dBFS (limit −1)`);
  return { rms, peak: peakDb };
}

async function renderInChromium({ version, cue, rate }) {
  const offline = new OfflineAudioContext(1, rate * 3, rate);
  const originalContext = window.AudioContext;
  const originalRandom = Math.random;
  let randomState = 0x4e534846;
  // The synth only schedules during playback. Expose the offline clock as running during that step.
  window.AudioContext = function () {
    return new Proxy(offline, {
      get(target, key) {
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
    const audio = version === 'before' ? new Before() : new After();
    audio.unlock();
    audio.sfx(cue);
  } finally {
    window.AudioContext = originalContext;
    Math.random = originalRandom;
  }

  const samples = (await offline.startRendering()).getChannelData(0);
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 32768) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  return btoa(chunks.join(''));
}
