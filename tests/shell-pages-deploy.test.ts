// The site publishes only tested, pinned commits (council v0.2 item 9, docs/REGRESSIONS.md E7): Pages used to
// run the tests on the event checkout, then `git clone` the current tips of main and preprod and publish those
// builds, so the live site could hold a commit no test had seen.
//
// Rule (.github/workflows/pages.yml): a `pin` job resolves each branch to one exact SHA (the pushed commit, or
// the other branch's tip or last good build); each build job checks out exactly that SHA, proves it, runs
// `npm test` before `npm run build` and uploads that build; the site is assembled only from those uploads, with
// no checkout, clone or build of its own, and /deployed.json names the pinned SHAs. Between the tests and the
// build, each pinned commit runs the 20-seed difficulty release sweep (`npm run difficulty:release`, user decision
// 2026-11-27: `npm test` holds only the 6-seed sanity check, the exact bands are judged here).
//
// Round 2 (Opus F3, Sol P1): a push gates only its own branch, and the other branch keeps its last good build
// (a failing preprod tip used to block every main deploy); right before publishing, every SHA must still be its
// branch's tip or what the site serves now, so a rerun (which keeps its old event SHA) never republishes an older
// commit over a newer deployment. The second half of this file runs the workflow's own github-script steps
// against stubbed GitHub APIs for those cases.
import { describe, expect, it } from 'vitest';
import workflow from '../.github/workflows/pages.yml?raw';

/** Top-level jobs of a workflow file: name → its lines (no YAML parser needed for this layout). */
function jobs(yml: string): Map<string, string> {
  const body = yml.slice(yml.indexOf('\njobs:\n') + 7);
  const out = new Map<string, string>();
  let name = '';
  for (const line of body.split('\n')) {
    const m = /^ {2}([a-z][\w-]*):\s*$/.exec(line);
    if (m) out.set((name = m[1]!), '');
    else if (name && !/^\S/.test(line)) out.set(name, `${out.get(name)!}${line}\n`);
    else if (/^\S/.test(line)) name = '';
  }
  return out;
}

/** Everything that would let an untested or unpinned commit reach the site. */
function problems(yml: string): string[] {
  const bad: string[] = [];
  const j = jobs(yml);
  const code = yml.replace(/^\s*#.*$/gm, '');
  if (/\bgit\s+(clone|worktree|pull)\b/.test(code)) bad.push('a run step clones or pulls a branch');
  if (/ref:\s*['"]?(main|preprod|refs\/heads)/.test(code)) bad.push('a checkout names a branch instead of a pinned SHA');
  if (/continue-on-error:\s*true/.test(code)) bad.push('a step may fail without failing the run');

  const pin = j.get('pin');
  if (!pin) bad.push('no pin job');
  else {
    if (!/outputs:\s*\n\s+targets:/.test(pin)) bad.push('pin does not output its targets');
    if (!/context\.sha/.test(pin)) bad.push('pin does not use the pushed commit (context.sha)');
    if (!/repos\.getBranch/.test(pin)) bad.push('pin does not resolve the other branch to a SHA');
  }

  const build = [...j].find(([, s]) => /npm run build/.test(s));
  if (!build) bad.push('no job builds the site');
  else {
    const [name, s] = build;
    if (!/needs:\s*\[?\s*pin\b/.test(s)) bad.push(`${name} does not wait for pin`);
    if (!/fromJSON\(needs\.pin\.outputs\.build\)/.test(s)) bad.push(`${name} does not build the pinned builds`);
    if (!/fail-fast:\s*false/.test(s)) bad.push(`${name} lets one branch's failure cancel the other's build`);
    if (!/name:\s*dist-\$\{\{\s*matrix\.branch\s*\}\}-\$\{\{\s*matrix\.sha\s*\}\}/.test(s)) bad.push(`${name} does not name its build by branch and commit`);
    const checkouts = [...s.matchAll(/uses: actions\/checkout@[^\n]*\n(?:\s+with:\s*\n\s+ref:\s*([^\n]+))?/g)];
    if (checkouts.length !== 1) bad.push(`${name} has ${checkouts.length} checkouts, not one`);
    else if (!/\$\{\{\s*matrix\.sha\s*\}\}/.test(checkouts[0]![1] ?? '')) bad.push(`${name} does not check out the pinned SHA`);
    if (!/git rev-parse HEAD/.test(s)) bad.push(`${name} does not prove the checkout is the pinned commit`);
    const order = ['actions/checkout', 'npm ci', 'npm test', 'npm run difficulty:release', 'npm run build', 'actions/upload-artifact'].map((step) => s.indexOf(step));
    if (order.some((i) => i < 0) || order.some((i, k) => k > 0 && i < order[k - 1]!)) {
      bad.push(`${name} must run checkout → npm ci → npm test → npm run difficulty:release → npm run build → upload, in that order`);
    }
    const sweep = /\n {6}- name: Difficulty release sweep[^\n]*\n((?: {8}[^\n]*\n)+)/.exec(s)?.[1] ?? '';
    if (!sweep) bad.push(`${name} has no "Difficulty release sweep" step`);
    else {
      if (/^ {8}if:/m.test(sweep)) bad.push(`${name} runs the difficulty sweep only under a condition`);
      if (!/\bexit "\$status"/.test(sweep) || /npm run difficulty:release\s*(\|\|\s*true|;)/.test(sweep)) bad.push(`${name} ignores the difficulty sweep's exit status`);
    }
  }
  for (const [name, s] of j) {
    if (build && name === build[0]) continue;
    if (/actions\/checkout|npm (ci|test|run build)|vite build/.test(s)) bad.push(`${name} checks out or builds outside the pinned build job`);
  }

  const assemble = [...j].find(([, s]) => /upload-pages-artifact/.test(s));
  if (!assemble) bad.push('no job uploads the Pages artifact');
  else {
    const [name, s] = assemble;
    if (build && !new RegExp(`needs:[^\\n]*\\b${build[0]}\\b`).test(s)) bad.push(`${name} does not wait for the builds`);
    if (!/actions\/download-artifact/.test(s)) bad.push(`${name} does not publish the uploaded builds`);
    if (!/deployed\.json/.test(s) || !/PUBLISHED/.test(s)) bad.push(`${name} does not write the published SHAs to /deployed.json`);
    if (!/id: choose/.test(s)) bad.push(`${name} has no step choosing each branch's build`);
  }
  const deploy = [...j].find(([, s]) => /actions\/deploy-pages/.test(s));
  if (!deploy || (assemble && !new RegExp(`needs:[^\\n]*\\b${assemble[0]}\\b`).test(deploy[1]))) bad.push('deploy does not wait for the assembled site');
  else {
    const s = deploy[1];
    const fresh = s.indexOf('id: fresh');
    if (fresh < 0 || fresh > s.indexOf('actions/deploy-pages')) bad.push('deploy does not check the SHAs are still current before publishing');
    if (!/if:\s*\$\{\{\s*steps\.fresh\.outputs\.publish == 'true'\s*\}\}\s*\n\s*uses: actions\/deploy-pages/.test(s)) bad.push('deploy publishes without the freshness check');
  }
  return bad;
}

describe('Pages publishes only pinned, tested commits', () => {
  it('the workflow pins, tests, builds and publishes each exact commit', () => {
    expect(jobs(workflow).size).toBeGreaterThanOrEqual(4);
    expect(problems(workflow)).toEqual([]);
  });

  it('catches the old clone-the-tips layout and other shortcuts (mutation check)', () => {
    const cloneTips = workflow.replace('      - run: npm test\n', '      - run: npm test\n      - run: git clone --branch preprod "$REPO" preprod && (cd preprod && npm ci && npm run build)\n');
    expect(problems(cloneTips)).toContain('a run step clones or pulls a branch');
    const buildFirst = workflow.replace('      - run: npm run build\n', '').replace('      - run: npm test\n', '      - run: npm run build\n      - run: npm test\n');
    expect(buildFirst).not.toBe(workflow);
    expect(problems(buildFirst).some((p) => p.includes('in that order'))).toBe(true);
    const branchRef = workflow.replace('ref: ${{ matrix.sha }}', 'ref: preprod');
    expect(problems(branchRef)).toContain('a checkout names a branch instead of a pinned SHA');
    const noPin = workflow.replace(/\n {2}pin:\n/, '\n  resolve:\n');
    expect(problems(noPin)).toContain('no pin job');
    const noSweep = workflow.replace(/\n {6}- name: Difficulty release sweep[^\n]*\n(?: {8}[^\n]*\n)+/, '\n');
    expect(noSweep).not.toBe(workflow);
    expect(problems(noSweep).some((p) => p.includes('in that order'))).toBe(true);
    const ignored = workflow.replace('exit "$status"', 'exit 0');
    expect(ignored).not.toBe(workflow);
    expect(problems(ignored)).toContain('build ignores the difficulty sweep\'s exit status');
    const skipped = workflow.replace('      - name: Difficulty release sweep (20 seeds, exact bands)\n', '      - name: Difficulty release sweep (20 seeds, exact bands)\n        if: github.ref == \'refs/heads/main\'\n');
    expect(problems(skipped)).toContain('build runs the difficulty sweep only under a condition');
    const failFast = workflow.replace('fail-fast: false', 'fail-fast: true');
    expect(failFast).not.toBe(workflow);
    expect(problems(failFast)).toContain('build lets one branch\'s failure cancel the other\'s build');
    const unchecked = workflow.replace("        if: ${{ steps.fresh.outputs.publish == 'true' }}\n", '');
    expect(unchecked).not.toBe(workflow);
    expect(problems(unchecked)).toContain('deploy publishes without the freshness check');
  });
});

// ------------------------------------------------------------------ the workflow's own scripts

/** The `script: |` block of the github-script step with this id, dedented. */
function stepScript(yml: string, id: string): string {
  const lines = yml.split('\n');
  const at = lines.findIndex(line => line.trim() === `- id: ${id}` || line.trim() === `id: ${id}`);
  if (at < 0) throw new Error(`no step ${id}`);
  const start = lines.findIndex((line, i) => i > at && /^\s+script: \|\s*$/.test(line));
  const body: string[] = [];
  let indent = -1;
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') { body.push(''); continue; }
    const lead = line.length - line.trimStart().length;
    if (indent < 0) indent = lead;
    if (lead < indent) break;
    body.push(line.slice(indent));
  }
  return body.join('\n');
}

interface World {
  /** Branch tips on GitHub now. */
  tips: Record<string, string>;
  /** What /deployed.json on the site says. */
  live: { branch: string; sha: string }[];
  /** Kept build artifacts (`dist-<branch>-<sha>`) and the run that made each. */
  kept?: Record<string, number>;
  /** Files in the assemble job's working directory. */
  files?: string[];
  ref?: string;
  sha?: string;
  env?: Record<string, string>;
}

interface Outcome { outputs: Record<string, string>; failed?: string; warnings: string[] }

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

async function runStep(id: string, world: World): Promise<Outcome> {
  const out: Outcome = { outputs: {}, warnings: [] };
  const github = {
    rest: {
      repos: {
        async getBranch({ branch }: { branch: string }) {
          const sha = world.tips[branch];
          if (!sha) throw Object.assign(new Error('Branch not found'), { status: 404 });
          return { data: { commit: { sha } } };
        },
        async getPages() { return { data: { html_url: 'https://owner.github.io/night-shift/' } }; },
      },
      actions: {
        async listArtifactsForRepo({ name }: { name: string }) {
          const run = world.kept?.[name];
          return { data: { artifacts: run ? [{ expired: false, workflow_run: { id: run } }] : [] } };
        },
      },
    },
  };
  const context = { repo: { owner: 'owner', repo: 'night-shift' }, ref: world.ref ?? 'refs/heads/main', sha: world.sha ?? '', runId: 7 };
  const core = {
    setOutput(name: string, value: string) { out.outputs[name] = value; },
    setFailed(message: string) { out.failed = message; },
    warning(message: string) { out.warnings.push(message); },
    summary: { addRaw() { return this; }, async write() {} },
  };
  const fetch = async (url: string) => {
    expect(url).toMatch(/^https:\/\/owner\.github\.io\/night-shift\/deployed\.json\?run=/);
    return { ok: true, json: async () => world.live };
  };
  const files = new Set(world.files ?? []);
  const require = (name: string) => {
    if (name !== 'fs') throw new Error(`unexpected require(${name})`);
    return { existsSync: (path: string) => files.has(path) };
  };
  const process = { env: world.env ?? {} };
  await new AsyncFunction('github', 'context', 'core', 'fetch', 'require', 'process', stepScript(workflow, id))(github, context, core, fetch, require, process);
  return out;
}

const M1 = 'a'.repeat(40);
const M2 = 'b'.repeat(40);
const M3 = 'c'.repeat(40);
const P1 = '1'.repeat(40);
const P2 = '2'.repeat(40);
const index = (branch: string, sha: string) => `dists/dist-${branch}-${sha}/index.html`;

describe('a push gates only its own branch (Opus F3)', () => {
  it('a main push builds only main and keeps the live preprod build', async () => {
    const pin = await runStep('pin', {
      ref: 'refs/heads/main', sha: M2, tips: { main: M2, preprod: P1 },
      live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }], kept: { [`dist-preprod-${P1}`]: 41 },
    });
    expect(pin.failed).toBeUndefined();
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M2, gate: true }]);
    expect(JSON.parse(pin.outputs.keep!)).toEqual({ branch: 'preprod', sha: P1, run: 41, name: `dist-preprod-${P1}` });
  });

  it('a newer preprod tip is built too, without gating main', async () => {
    const pin = await runStep('pin', {
      ref: 'refs/heads/main', sha: M2, tips: { main: M2, preprod: P2 },
      live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }], kept: { [`dist-preprod-${P1}`]: 41 },
    });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M2, gate: true }, { branch: 'preprod', sha: P2, gate: false }]);
    // the preprod tip fails its tests: main still publishes, preprod keeps its last good build
    const choose = await runStep('choose', {
      tips: { main: M2, preprod: P2 }, live: [],
      files: [index('main', M2), `dists/dist-preprod-${P1}/index.html`],
      env: { BUILD: pin.outputs.build!, PUSHED: 'main', KEEP: pin.outputs.keep! },
    });
    expect(choose.failed).toBeUndefined();
    expect(JSON.parse(choose.outputs.published!)).toEqual([
      { branch: 'main', sha: M2, dir: `dists/dist-main-${M2}` },
      { branch: 'preprod', sha: P1, dir: `dists/dist-preprod-${P1}` },
    ]);
  });

  it('with no earlier build to keep, the other branch has to pass', async () => {
    const pin = await runStep('pin', { ref: 'refs/heads/preprod', sha: P2, tips: { main: M1, preprod: P2 }, live: [] });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P2, gate: true }]);
    const choose = await runStep('choose', {
      tips: { main: M1, preprod: P2 }, live: [], files: [index('preprod', P2)],
      env: { BUILD: pin.outputs.build!, PUSHED: 'preprod', KEEP: '' },
    });
    expect(choose.failed).toMatch(/main .* no earlier good build/);
  });

  it('the pushed branch failing publishes nothing', async () => {
    const build = JSON.stringify([{ branch: 'preprod', sha: P2, gate: true }]);
    const choose = await runStep('choose', {
      tips: { main: M1, preprod: P2 }, live: [], files: [`dists/dist-main-${M1}/index.html`],
      env: { BUILD: build, PUSHED: 'preprod', KEEP: JSON.stringify({ branch: 'main', sha: M1, run: 3, name: `dist-main-${M1}` }) },
    });
    expect(choose.failed).toMatch(/preprod .* failed/);
    expect(choose.outputs.published).toBeUndefined();
  });

  it('runs only from main or preprod', async () => {
    const pin = await runStep('pin', { ref: 'refs/heads/feature', sha: M1, tips: { main: M1 }, live: [] });
    expect(pin.failed).toMatch(/main or preprod/);
  });
});

describe('a rerun never republishes an older commit (Sol P1)', () => {
  it('old event SHA, new branch tip: the rerun publishes nothing', async () => {
    // the run was for main M1; main has moved on to M3 since
    const choose = await runStep('choose', {
      tips: { main: M3, preprod: P1 }, live: [{ branch: 'main', sha: M3 }, { branch: 'preprod', sha: P1 }],
      files: [index('main', M1), `dists/dist-preprod-${P1}/index.html`],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }]), PUSHED: 'main', KEEP: JSON.stringify({ branch: 'preprod', sha: P1, run: 41, name: `dist-preprod-${P1}` }) },
    });
    expect(choose.failed).toBeUndefined();
    expect(choose.outputs.published).toBe('');
    // "Re-run failed jobs" of the deploy alone reuses the old assembled site: the deploy check stops it
    const fresh = await runStep('fresh', {
      tips: { main: M3, preprod: P1 }, live: [{ branch: 'main', sha: M3 }, { branch: 'preprod', sha: P1 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }]) },
    });
    expect(fresh.outputs.publish).toBe('false');
    expect(fresh.warnings.join()).toMatch(/Superseded/);
  });

  it('an old kept build is stale once the other branch deployed a newer one', async () => {
    const fresh = await runStep('fresh', {
      tips: { main: M2, preprod: P2 }, live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P2 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M2 }, { branch: 'preprod', sha: P1 }]) },
    });
    expect(fresh.outputs.publish).toBe('false');
  });

  it('current tips, or the build the site already serves, publish', async () => {
    const fresh = await runStep('fresh', {
      tips: { main: M2, preprod: P2 }, live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M2 }, { branch: 'preprod', sha: P1 }]) },
    });
    expect(fresh.outputs.publish).toBe('true');
  });
});
