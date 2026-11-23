// Writes public/how-its-made.html and public/media/README.md from the clips in public/media/.
// Durations and sizes come from ffprobe, so the page always matches the files.
//   source ~/.local/share/claude-media-tools/env.sh && node scripts/capture/make-page.mjs
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { CLIPS } from './clips.mjs';

const ROOT = new URL('../../public/', import.meta.url).pathname;
const MEDIA = ROOT + 'media/';
const FFPROBE = process.env.FFPROBE || (process.env.FFMPEG ? process.env.FFMPEG.replace(/ffmpeg$/, 'ffprobe') : 'ffprobe');
const files = readdirSync(MEDIA);

function probe(path) {
  try {
    const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', path], { encoding: 'utf8' });
    const j = JSON.parse(out);
    return { duration: Number(j.format.duration), width: j.streams[0].width, height: j.streams[0].height, fps: j.streams[0].r_frame_rate };
  } catch {
    return null;
  }
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const rows = [];
for (const c of CLIPS) {
  const mp4 = c.file + '.mp4';
  if (!files.includes(mp4)) continue;
  const stills = files.filter((f) => f.startsWith(c.file + '-') && f.endsWith('.png')).sort();
  const p = probe(MEDIA + mp4);
  rows.push({ ...c, mp4, stills, size: statSync(MEDIA + mp4).size, probe: p });
}

const cards = rows.map((r, i) => `
    <article class="clip" id="${r.file}">
      <h2><span class="n">${i + 1}</span> ${esc(r.title)}</h2>
      <video controls playsinline preload="metadata" poster="media/${r.stills[0] || ''}" width="1920" height="1080">
        <source src="media/${r.mp4}" type="video/mp4">
      </video>
      <p class="cap">${esc(r.caption)}</p>
      <p class="meta">${r.probe ? `${mmss(r.probe.duration)} · 1920×1080 · 60 fps` : ''} · ${mb(r.size)} · <a href="media/${r.mp4}" download>download</a></p>
      <div class="stills">${r.stills.map((s) => `<a href="media/${s}"><img src="media/${s}" alt="${esc(r.title)}: ${esc(s.replace(r.file + '-', '').replace('.png', '').replace(/^[a-e]-/, '').replace(/-/g, ' '))}" loading="lazy" width="1920" height="1080"></a>`).join('')}</div>
    </article>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#120d2b">
<title>Night Shift: how it's made</title>
<meta name="description" content="60 fps explainer videos and stills showing how Night Shift's flight, detection, ragdoll abductions, hazards, autopilot proofs and progression work.">
<style>
  :root { --bg: #120d2b; --panel: #1b1440; --ink: #ece6ff; --muted: #a9a2d6; --mint: #7cffcb; --amber: #ffc24d; }
  * { box-sizing: border-box; }
  html { background: var(--bg); }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Ubuntu, sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 28px 16px 64px; }
  header h1 { font-size: clamp(28px, 6vw, 44px); line-height: 1.1; margin: 0 0 10px; }
  header p { color: var(--muted); margin: 0 0 8px; max-width: 70ch; }
  a { color: var(--mint); }
  .play { display: inline-block; margin: 10px 0 6px; padding: 10px 18px; border-radius: 999px; background: var(--mint); color: #120d2b; font-weight: 700; text-decoration: none; }
  nav.toc { margin: 18px 0 8px; display: flex; flex-wrap: wrap; gap: 8px; }
  nav.toc a { font-size: 14px; text-decoration: none; padding: 4px 10px; border: 1px solid rgba(124,255,203,0.35); border-radius: 999px; }
  .clip { margin-top: 34px; padding: 16px; background: var(--panel); border-radius: 14px; border: 1px solid rgba(124,255,203,0.12); }
  .clip h2 { font-size: 21px; margin: 0 0 12px; display: flex; gap: 10px; align-items: center; }
  .clip h2 .n { flex: none; width: 30px; height: 30px; border-radius: 50%; background: var(--mint); color: #120d2b; font-size: 15px; display: grid; place-items: center; }
  video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border-radius: 8px; background: #000; }
  .cap { margin: 12px 0 4px; }
  .meta { margin: 0; color: var(--muted); font-size: 14px; }
  .stills { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 12px; }
  .stills img { display: block; width: 100%; height: auto; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); }
  footer { margin-top: 40px; color: var(--muted); font-size: 14px; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Night Shift: how it's made</h1>
    <p>Eight short films about how the game works, captured from the real game at 60 fps. Each frame is exactly 1/60 s of game time: the capture replaces the browser's clock, so a slow machine can't drop or stretch frames.</p>
    <p>The overlays are drawn from the live simulation (hit shapes, colliders, camera cones, wake meters), so what you see outlined is what the code tests. Saucer and specimen are driven with real mouse input, by hand or by the game's own autopilots.</p>
    <a class="play" href="./">Play Night Shift</a>
    <nav class="toc">${rows.map((r, i) => `<a href="#${r.file}">${i + 1}. ${esc(r.title)}</a>`).join('')}</nav>
  </header>
${cards}
  <footer>Captured with <code>scripts/capture/</code> (Playwright, a virtual clock and ffmpeg). Sped-up stretches are labelled “time-lapse” in the video.</footer>
</main>
</body>
</html>
`;
writeFileSync(ROOT + 'how-its-made.html', html);

const md = `# Night Shift explainer media

60 fps, 1920×1080 H.264 clips and PNG stills that explain how the game is built. They are
shown on [how-its-made.html](../how-its-made.html) (served from GitHub Pages) and regenerated
with the scripts in \`scripts/capture/\` (see \`scripts/capture/README.md\`).

| Clip | Length | Size | What it shows |
| --- | --- | --- | --- |
${rows.map((r) => `| [${r.mp4}](${r.mp4}) | ${r.probe ? r.probe.duration.toFixed(1) + ' s' : '?'} | ${mb(r.size)} | ${r.caption} |`).join('\n')}

Stills (1920×1080 PNG, from the same composer at key moments):

${rows.map((r) => `- ${r.title}: ${r.stills.map((s) => `[${s}](${s})`).join(', ')}`).join('\n')}
`;
writeFileSync(MEDIA + 'README.md', md);
console.log(rows.map((r) => `${r.mp4} ${r.probe ? r.probe.duration.toFixed(2) + 's ' + r.probe.width + 'x' + r.probe.height + ' ' + r.probe.fps : 'NO PROBE'} ${mb(r.size)} stills ${r.stills.length}`).join('\n'));
