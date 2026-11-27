#!/usr/bin/env node
// Release sweep (`npm run difficulty:release`): every level in LEVELS at 20 seeds, judged on the exact
// bands (tests/difficulty/rates.ts: no sample-size tolerance from 20 attempts). Runs one vitest process
// per level, several at once, then prints one table of every rate band and every other violation, and
// exits non-zero if any level is out of band or a run crashed.
// Run it before every preprod push; CI runs it for each pinned commit (.github/workflows/pages.yml).
//   DIFFICULTY_JOBS=4        processes at once (default: the machine's parallelism, at most 8)
//   DIFFICULTY_SEEDS=20      seeds per cell (default 20; fewer is not a release sweep)
//   DIFFICULTY_LEVELS=a,b    a subset, for a retune (default: every level)
//   DIFFICULTY_OUT=dir       keep <level>.md/.json/.log and summary.md there (default: a temp dir)
import { spawn, execFileSync } from 'node:child_process';
import { availableParallelism, tmpdir } from 'node:os';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, createWriteStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vitest = join(root, 'node_modules', '.bin', 'vitest');
const TEST = 'tests/levels-difficulty.test.ts';

const seeds = Number(process.env.DIFFICULTY_SEEDS ?? 20);
if (!Number.isSafeInteger(seeds) || seeds <= 0) fail('DIFFICULTY_SEEDS must be a positive integer');
const jobs = Number(process.env.DIFFICULTY_JOBS ?? Math.min(8, availableParallelism()));
if (!Number.isSafeInteger(jobs) || jobs <= 0) fail('DIFFICULTY_JOBS must be a positive integer');
const out = resolve(process.env.DIFFICULTY_OUT ?? mkdtempSync(join(tmpdir(), 'night-shift-difficulty-')));
mkdirSync(out, { recursive: true });

function fail(message) {
  console.error(`difficulty:release: ${message}`);
  process.exit(2);
}

/** Level ids in LEVELS order, read from the test's own names (`<id> <title> sits in its band`). */
function levelIds() {
  const env = { ...process.env };
  delete env.DIFFICULTY_LEVELS;
  const json = execFileSync(vitest, ['list', TEST, '--json'], { cwd: root, encoding: 'utf8', env });
  const ids = JSON.parse(json).map(t => /> (\S+) .* sits in its band$/.exec(t.name)?.[1]).filter(Boolean);
  if (!ids.length) fail(`no level tests found in ${TEST}`);
  return ids;
}

const all = levelIds();
const wanted = process.env.DIFFICULTY_LEVELS?.split(',').map(id => id.trim()).filter(Boolean);
for (const id of wanted ?? []) if (!all.includes(id)) fail(`unknown level in DIFFICULTY_LEVELS: ${id}`);
const levels = wanted?.length ? all.filter(id => wanted.includes(id)) : all;
// Later levels have more rooms and detours: start them first so the slowest do not finish last alone.
const queue = [...levels].reverse();

const started = Date.now();
const results = new Map();
console.log(`difficulty:release: ${levels.length} levels × ${seeds} seeds, ${jobs} at once, reports in ${out}`);

function runLevel(id) {
  return new Promise(done => {
    const t0 = Date.now();
    rmSync(join(out, `${id}.json`), { force: true }); // never read a report an earlier sweep left behind
    const log = createWriteStream(join(out, `${id}.log`));
    const child = spawn(vitest, ['run', TEST], {
      cwd: root,
      env: { ...process.env, DIFFICULTY_LEVELS: id, DIFFICULTY_SEEDS: String(seeds), DIFFICULTY_OUT: out, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('close', code => {
      log.end();
      const sec = Math.round((Date.now() - t0) / 1000);
      const file = join(out, `${id}.json`);
      const report = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
      const stale = report && report.seeds !== seeds;
      results.set(id, { id, code, sec, report: stale ? undefined : report });
      const bad = !report || stale ? 'no report' : report.violations.length ? `${report.violations.length} out of band` : 'in band';
      console.log(`  ${id.padEnd(17)} ${String(sec).padStart(4)} s  ${bad}`);
      done();
    });
  });
}

async function worker() {
  for (let id = queue.shift(); id; id = queue.shift()) await runLevel(id);
}
await Promise.all(Array.from({ length: Math.min(jobs, levels.length) }, worker));
const wall = Math.round((Date.now() - started) / 1000);

const pct = x => `${Math.round(x * 100)}%`;
const band = c => c.against ? `> ${c.against[0]}/${c.against[1]}`
  : c.min !== undefined && c.max !== undefined ? `${pct(c.min)}–${pct(c.max)}`
    : c.min !== undefined ? `≥ ${pct(c.min)}` : c.max !== undefined ? `≤ ${pct(c.max)}` : '–';

const lines = [`# Difficulty release sweep: ${seeds} seeds, ${levels.length} levels, ${wall} s wall`, ''];
lines.push('| Level | Band | Count | Wants | Exact | |', '| --- | --- | ---: | --- | --- | --- |');
const other = [];
const broken = [];
let outOfBand = 0;
for (const id of levels) {
  const r = results.get(id);
  if (!r?.report) {
    broken.push(`${id}: no ${seeds}-seed report (vitest exit ${r?.code}); see ${join(out, `${id}.log`)}`);
    continue;
  }
  for (const c of r.report.rates ?? []) {
    lines.push(`| ${id} | ${c.label} | ${c.k}/${c.n} | ${band(c)} | ${c.mode === 'exact' ? 'yes' : `no (n < 20, p = ${c.p?.toFixed(2) ?? '–'})`} | ${c.pass ? (c.inBand ? 'in' : 'in (tolerance)') : '**OUT**'} |`);
  }
  const rateText = new Set((r.report.rates ?? []).filter(c => !c.pass).map(c => c.label));
  for (const v of r.report.violations) if (![...rateText].some(label => v.startsWith(label))) other.push(`${id}: ${v}`);
  if (r.report.violations.length) outOfBand++;
  else if (r.code !== 0) broken.push(`${id}: in band but vitest exited ${r.code}; see ${join(out, `${id}.log`)}`);
}
lines.push('');
// v0.2 council round 2 (Opus F1): the perfect-hand autopilot at SLOWEST_HONEST_PACE against each clock
const honest = levels.map(id => [id, results.get(id)?.report?.honestPace]).filter(([, h]) => h);
if (honest.length) {
  lines.push('| Level | Slowest honest hand: delivered | slowest s | must finish by | budget |', '| --- | ---: | ---: | ---: | ---: |');
  for (const [id, h] of honest) {
    const done = h.runs.filter(run => run.delivered).length;
    const worst = Math.max(...h.runs.map(run => run.delivered ? run.seconds : Infinity));
    lines.push(`| ${id} | ${done}/${h.runs.length} | ${Number.isFinite(worst) ? worst : '–'} | ${h.limitSec === null || !Number.isFinite(h.limitSec) ? '–' : Math.round(h.limitSec * 10) / 10} | ${h.budgetSec === null || !Number.isFinite(h.budgetSec) ? '–' : h.budgetSec} |`);
  }
  lines.push('');
  // v0.2 council round 3 (Opus O1): the same pace with a reaction lag, and a slightly slower perfect hand, inside the budget
  const slowNames = [...new Set(honest.flatMap(([, h]) => (h.slow ?? []).map(s => s.hand.name)))];
  if (slowNames.length) {
    lines.push(`| Level | ${slowNames.map(n => `${n}: delivered | slowest s`).join(' | ')} | budget |`, `| --- | ${slowNames.map(() => '---: | ---:').join(' | ')} | ---: |`);
    for (const [id, h] of honest) {
      const cells = slowNames.map(n => {
        const s = (h.slow ?? []).find(x => x.hand.name === n);
        if (!s) return '– | –';
        const w = Math.max(...s.runs.map(run => run.delivered ? run.seconds : Infinity));
        return `${s.runs.filter(run => run.delivered).length}/${s.runs.length} | ${Number.isFinite(w) ? w : '–'}`;
      });
      lines.push(`| ${id} | ${cells.join(' | ')} | ${h.budgetSec === null || !Number.isFinite(h.budgetSec) ? '–' : h.budgetSec} |`);
    }
    lines.push('');
  }
}
if (other.length) lines.push('## Other violations (not rate bands: exact at every seed count)', '', ...other.map(v => `- ${v}`), '');
if (broken.length) lines.push('## Runs that did not report', '', ...broken.map(v => `- ${v}`), '');
const verdict = outOfBand || broken.length
  ? `OUT OF BAND: ${outOfBand} of ${levels.length} levels (${levels.filter(id => results.get(id)?.report?.violations.length).join(', ') || 'none'})${broken.length ? `, ${broken.length} without a report` : ''}.`
  : `All ${levels.length} levels in band at ${seeds} seeds.`;
lines.push(verdict);
const text = lines.join('\n');
writeFileSync(join(out, 'summary.md'), `${text}\n`);
console.log(`\n${text}\n\nSummary and per-level reports: ${out}`);
if (seeds < 20) console.log('Note: fewer than 20 seeds is not a release sweep (sub-20 bands use the sanity tolerance).');
process.exit(outOfBand || broken.length ? 1 : 0);
