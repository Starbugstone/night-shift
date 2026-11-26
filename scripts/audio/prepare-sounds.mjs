// Rebuilds the recorded sound effects in public/sound/ from their CC0 sources (credits: public/sound/CREDITS.md).
// From the repository root: source ~/.local/share/claude-media-tools/env.sh; node scripts/audio/prepare-sounds.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

const SOUNDS = [
  {
    // "Male Snore 1" by mattyharm, https://freesound.org/people/mattyharm/sounds/432997/ (CC0)
    file: 'snore.mp3',
    source: 'https://cdn.freesound.org/previews/432/432997_897016-hq.mp3',
    // the first breath: a snoring inhale (0.5–2.5 s) and its soft exhale (3.1–4.3 s)
    filters: 'atrim=0.45:4.5,asetpts=PTS-STARTPTS,highpass=f=70,lowpass=f=7000,loudnorm=I=-24:TP=-3:LRA=11,afade=t=in:d=0.04,afade=t=out:st=3.85:d=0.2',
  },
];

const tmp = mkdtempSync(join(tmpdir(), 'night-shift-sounds-'));
try {
  mkdirSync(join(root, 'public/sound'), { recursive: true });
  for (const { file, source, filters } of SOUNDS) {
    const res = await fetch(source, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`);
    const raw = join(tmp, 'source.mp3');
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    execFileSync(ffmpeg, ['-loglevel', 'error', '-y', '-i', raw, '-af', filters, '-ac', '1', '-ar', '44100',
      '-codec:a', 'libmp3lame', '-b:a', '96k', join(root, 'public/sound', file)]);
    console.log('wrote public/sound/' + file);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
