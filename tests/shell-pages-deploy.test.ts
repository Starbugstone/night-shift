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
//
// Round 3 (Sol P1, P2): freshness is per branch. When the other branch's new tip is superseded while the run
// assembles, the deploy publishes a fallback bundle (the pushed build with the other branch's live build), so a
// preprod push mid-main-deploy can no longer cancel main. Build artifacts and Pages bundles are named by run and
// attempt, and the site is assembled only from the builds this attempt's successful legs name.
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
    if (!/name:\s*dist-\$\{\{\s*matrix\.branch\s*\}\}-\$\{\{\s*matrix\.sha\s*\}\}-\$\{\{\s*github\.run_id\s*\}\}-\$\{\{\s*github\.run_attempt\s*\}\}/.test(s)) bad.push(`${name} does not name its build by branch, commit, run and attempt`);
    for (const branch of ['main', 'preprod']) {
      if (!new RegExp(`outputs:[\\s\\S]*\\n\\s+${branch}:\\s*\\$\\{\\{\\s*steps\\.built\\.outputs\\.${branch}\\s*\\}\\}`).test(s)) bad.push(`${name} does not output the ${branch} artifact it uploaded`);
    }
    const upload = s.indexOf('actions/upload-artifact');
    const named = s.indexOf('id: built');
    if (named < 0 || named < upload) bad.push(`${name} names its artifact before uploading it`);
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
    // an earlier attempt's upload of a build that failed this time must not be fetched (Sol P2, round 3)
    if (/^\s+pattern:/m.test(s)) bad.push(`${name} fetches builds by pattern, not by this attempt's artifact names`);
    for (const branch of ['main', 'preprod']) {
      if (!new RegExp(`name:\\s*\\$\\{\\{\\s*needs\\.build\\.outputs\\.${branch}\\s*\\}\\}`).test(s)) bad.push(`${name} does not fetch the ${branch} build by this attempt's name`);
    }
    if (!/BUILT:\s*\$\{\{\s*toJSON\(needs\.build\.outputs\)\s*\}\}/.test(s)) bad.push(`${name} does not tell the choose step which builds this attempt made`);
    const bundles = [...s.matchAll(/uses: actions\/upload-pages-artifact@[^\n]*\n(?:\s+if:[^\n]*\n)?\s+with:\s*\n((?:\s{10}[^\n]*\n)+)/g)].map((m) => /name:\s*([^\n]+)/.exec(m[1]!)?.[1]?.trim() ?? '');
    if (bundles.some((n) => !/^\$\{\{\s*steps\.choose\.outputs\.(bundle|fallback_bundle)\s*\}\}$/.test(n))) bad.push(`${name} uploads a Pages bundle without a per-attempt name`);
    if (new Set(bundles).size !== bundles.length) bad.push(`${name} uploads two Pages bundles with one name`);
  }
  const deploy = [...j].find(([, s]) => /actions\/deploy-pages/.test(s));
  if (!deploy || (assemble && !new RegExp(`needs:[^\\n]*\\b${assemble[0]}\\b`).test(deploy[1]))) bad.push('deploy does not wait for the assembled site');
  else {
    const s = deploy[1];
    const fresh = s.indexOf('id: fresh');
    if (fresh < 0 || fresh > s.indexOf('actions/deploy-pages')) bad.push('deploy does not check the SHAs are still current before publishing');
    if (!/if:\s*\$\{\{\s*steps\.fresh\.outputs\.publish == 'true'\s*\}\}\s*\n\s*uses: actions\/deploy-pages/.test(s)) bad.push('deploy publishes without the freshness check');
    if (!/uses: actions\/deploy-pages@[^\n]*\n\s+with:\s*\n\s+artifact_name:\s*\$\{\{\s*steps\.fresh\.outputs\.artifact\s*\}\}/.test(s)) bad.push('deploy does not publish the bundle the freshness check picked');
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
    // round 3 (Sol P2): attempt-blind names, pattern downloads and duplicate bundle names
    const attemptBlind = workflow.replaceAll('-${{ github.run_id }}-${{ github.run_attempt }}', '');
    expect(attemptBlind).not.toBe(workflow);
    expect(problems(attemptBlind)).toContain('build does not name its build by branch, commit, run and attempt');
    const pattern = workflow.replace(/(\n {6}- name: Fetch this attempt's main build\n)/, '\n      - uses: actions/download-artifact@v4\n        with:\n          pattern: dist-*\n          path: dists$1');
    expect(pattern).not.toBe(workflow);
    expect(problems(pattern)).toContain('assemble fetches builds by pattern, not by this attempt\'s artifact names');
    const sameName = workflow.replace('name: ${{ steps.choose.outputs.fallback_bundle }}', 'name: ${{ steps.choose.outputs.bundle }}');
    expect(sameName).not.toBe(workflow);
    expect(problems(sameName)).toContain('assemble uploads two Pages bundles with one name');
    const defaultName = workflow.replace('          name: ${{ steps.choose.outputs.bundle }}\n', '');
    expect(defaultName).not.toBe(workflow);
    expect(problems(defaultName)).toContain('assemble uploads a Pages bundle without a per-attempt name');
    const anyBundle = workflow.replace('          artifact_name: ${{ steps.fresh.outputs.artifact }}\n', '');
    expect(anyBundle).not.toBe(workflow);
    expect(problems(anyBundle)).toContain('deploy does not publish the bundle the freshness check picked');
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
  live: { branch: string; sha: string; run?: number; artifact?: string }[];
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
          return { data: { artifacts: run ? [{ name, expired: false, workflow_run: { id: run } }] : [] } };
        },
      },
    },
  };
  const context = { repo: { owner: 'owner', repo: 'night-shift' }, ref: world.ref ?? 'refs/heads/main', sha: world.sha ?? '', runId: RUN };
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
const RUN = 7;
/** The artifact a build leg of this run uploads, by attempt. */
const art = (branch: string, sha: string, attempt = 1) => `dist-${branch}-${sha}-${RUN}-${attempt}`;
const index = (name: string) => `dists/${name}/index.html`;
/** The assemble job's view of the build legs: the artifact each successful leg of this attempt named. */
const builtBy = (legs: Record<string, string>) => JSON.stringify({ main: '', preprod: '', ...legs });
/** Run choose, then fresh, as the assemble and deploy jobs do. */
async function chooseThenFresh(world: World & { attempt?: number }, later: Pick<World, 'tips' | 'live'>) {
  const choose = await runStep('choose', { ...world, env: { RUN_ATTEMPT: String(world.attempt ?? 1), ...world.env } });
  const fresh = await runStep('fresh', {
    ...later,
    env: { PUBLISHED: choose.outputs.published!, BUNDLE: choose.outputs.bundle!, FALLBACK: choose.outputs.fallback!, FALLBACK_BUNDLE: choose.outputs.fallback_bundle! },
  });
  return { choose, fresh };
}

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
      files: [index(art('main', M2)), `dists/dist-preprod-${P1}/index.html`],
      env: { BUILD: pin.outputs.build!, BUILT: builtBy({ main: art('main', M2) }), PUSHED: 'main', KEEP: pin.outputs.keep!, RUN_ATTEMPT: '1' },
    });
    expect(choose.failed).toBeUndefined();
    expect(JSON.parse(choose.outputs.published!)).toEqual([
      { branch: 'main', sha: M2, dir: `dists/${art('main', M2)}`, run: RUN, artifact: art('main', M2) },
      { branch: 'preprod', sha: P1, dir: `dists/dist-preprod-${P1}`, run: 41, artifact: `dist-preprod-${P1}` },
    ]);
    expect(choose.outputs.fallback).toBe('');
  });

  it('with no earlier build to keep, the other branch has to pass', async () => {
    const pin = await runStep('pin', { ref: 'refs/heads/preprod', sha: P2, tips: { main: M1, preprod: P2 }, live: [] });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P2, gate: true }]);
    const choose = await runStep('choose', {
      tips: { main: M1, preprod: P2 }, live: [], files: [index(art('preprod', P2))],
      env: { BUILD: pin.outputs.build!, BUILT: builtBy({ preprod: art('preprod', P2) }), PUSHED: 'preprod', KEEP: '', RUN_ATTEMPT: '1' },
    });
    expect(choose.failed).toMatch(/main .* no earlier good build/);
  });

  it('the pushed branch failing publishes nothing', async () => {
    const build = JSON.stringify([{ branch: 'preprod', sha: P2, gate: true }]);
    const choose = await runStep('choose', {
      tips: { main: M1, preprod: P2 }, live: [], files: [`dists/dist-main-${M1}/index.html`],
      env: { BUILD: build, BUILT: builtBy({}), PUSHED: 'preprod', KEEP: JSON.stringify({ branch: 'main', sha: M1, run: 3, name: `dist-main-${M1}` }), RUN_ATTEMPT: '1' },
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
      files: [index(art('main', M1)), `dists/dist-preprod-${P1}/index.html`],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }]), BUILT: builtBy({ main: art('main', M1) }), PUSHED: 'main', KEEP: JSON.stringify({ branch: 'preprod', sha: P1, run: 41, name: `dist-preprod-${P1}` }), RUN_ATTEMPT: '2' },
    });
    expect(choose.failed).toBeUndefined();
    expect(choose.outputs.published).toBe('');
    // "Re-run failed jobs" of the deploy alone reuses the old assembled site: the deploy check stops it
    const fresh = await runStep('fresh', {
      tips: { main: M3, preprod: P1 }, live: [{ branch: 'main', sha: M3 }, { branch: 'preprod', sha: P1 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }]), BUNDLE: 'pages-7-1' },
    });
    expect(fresh.outputs.publish).toBe('false');
    expect(fresh.warnings.join()).toMatch(/Superseded/);
  });

  it('an old kept build is stale once the other branch deployed a newer one', async () => {
    const fresh = await runStep('fresh', {
      tips: { main: M2, preprod: P2 }, live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P2 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M2 }, { branch: 'preprod', sha: P1 }]), BUNDLE: 'pages-7-1' },
    });
    expect(fresh.outputs.publish).toBe('false');
  });

  it('current tips, or the build the site already serves, publish', async () => {
    const fresh = await runStep('fresh', {
      tips: { main: M2, preprod: P2 }, live: [{ branch: 'main', sha: M1 }, { branch: 'preprod', sha: P1 }],
      env: { PUBLISHED: JSON.stringify([{ branch: 'main', sha: M2 }, { branch: 'preprod', sha: P1 }]), BUNDLE: 'pages-7-1' },
    });
    expect(fresh.outputs.publish).toBe('true');
    expect(fresh.outputs.artifact).toBe('pages-7-1');
  });
});

const M0 = '0'.repeat(40);
const P0 = 'f'.repeat(40);

describe('a branch superseded mid-run falls back to its live build (Sol P1, round 3)', () => {
  it('main push, preprod advances before the deploy: main publishes with the live preprod', async () => {
    // main M1 is pushed; preprod's tip P1 is newer than the live P0, so it is built too
    const pin = await runStep('pin', {
      ref: 'refs/heads/main', sha: M1, tips: { main: M1, preprod: P1 },
      live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }], kept: { [`dist-preprod-${P0}`]: 11, [`dist-main-${M0}`]: 12 },
    });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P1, gate: false }]);
    // both pass; preprod is pushed to P2 while this run assembles (its own run waits in the pages queue)
    const { choose, fresh } = await chooseThenFresh({
      tips: { main: M1, preprod: P1 }, live: [],
      files: [index(art('main', M1)), index(art('preprod', P1)), `dists/dist-preprod-${P0}/index.html`],
      env: { BUILD: pin.outputs.build!, BUILT: builtBy({ main: art('main', M1), preprod: art('preprod', P1) }), PUSHED: 'main', KEEP: pin.outputs.keep! },
    }, { tips: { main: M1, preprod: P2 }, live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }] });
    expect(JSON.parse(choose.outputs.published!).map((b: { sha: string }) => b.sha)).toEqual([M1, P1]);
    expect(JSON.parse(choose.outputs.fallback!).map((b: { sha: string }) => b.sha)).toEqual([M1, P0]);
    expect(fresh.outputs.publish).toBe('true');
    expect(fresh.outputs.artifact).toBe(choose.outputs.fallback_bundle);
    expect(fresh.outputs.artifact).toBe('pages-7-1-fallback');
  });

  it('preprod push, main advances before the deploy: preprod publishes with the live main', async () => {
    const pin = await runStep('pin', {
      ref: 'refs/heads/preprod', sha: P1, tips: { main: M1, preprod: P1 },
      live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }], kept: { [`dist-preprod-${P0}`]: 11, [`dist-main-${M0}`]: 12 },
    });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M1, gate: false }, { branch: 'preprod', sha: P1, gate: true }]);
    const { choose, fresh } = await chooseThenFresh({
      tips: { main: M1, preprod: P1 }, live: [],
      files: [index(art('main', M1)), index(art('preprod', P1)), `dists/dist-main-${M0}/index.html`],
      env: { BUILD: pin.outputs.build!, BUILT: builtBy({ main: art('main', M1), preprod: art('preprod', P1) }), PUSHED: 'preprod', KEEP: pin.outputs.keep! },
    }, { tips: { main: M2, preprod: P1 }, live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }] });
    expect(JSON.parse(choose.outputs.fallback!).map((b: { sha: string }) => b.sha)).toEqual([M0, P1]);
    expect(fresh.outputs.publish).toBe('true');
    expect(fresh.outputs.artifact).toBe('pages-7-1-fallback');
  });

  it('nothing advanced: the run publishes both new builds', async () => {
    const world = { tips: { main: M1, preprod: P1 }, live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }] };
    const { fresh } = await chooseThenFresh({
      ...world, files: [index(art('main', M1)), index(art('preprod', P1)), `dists/dist-preprod-${P0}/index.html`],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P1, gate: false }]), BUILT: builtBy({ main: art('main', M1), preprod: art('preprod', P1) }), PUSHED: 'main', KEEP: JSON.stringify({ branch: 'preprod', sha: P0, run: 11, name: `dist-preprod-${P0}` }) },
    }, world);
    expect(fresh.outputs.publish).toBe('true');
    expect(fresh.outputs.artifact).toBe('pages-7-1');
  });

  it('the pushed commit superseded: no bundle publishes', async () => {
    const { fresh } = await chooseThenFresh({
      tips: { main: M1, preprod: P1 }, live: [],
      files: [index(art('main', M1)), index(art('preprod', P1)), `dists/dist-preprod-${P0}/index.html`],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P1, gate: false }]), BUILT: builtBy({ main: art('main', M1), preprod: art('preprod', P1) }), PUSHED: 'main', KEEP: JSON.stringify({ branch: 'preprod', sha: P0, run: 11, name: `dist-preprod-${P0}` }) },
    }, { tips: { main: M2, preprod: P2 }, live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P0 }] });
    expect(fresh.outputs.publish).toBe('false');
  });

  it('the fallback is stale too (a newer build of that branch went live): no bundle publishes', async () => {
    const { fresh } = await chooseThenFresh({
      tips: { main: M1, preprod: P1 }, live: [],
      files: [index(art('main', M1)), index(art('preprod', P1)), `dists/dist-preprod-${P0}/index.html`],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P1, gate: false }]), BUILT: builtBy({ main: art('main', M1), preprod: art('preprod', P1) }), PUSHED: 'main', KEEP: JSON.stringify({ branch: 'preprod', sha: P0, run: 11, name: `dist-preprod-${P0}` }) },
    }, { tips: { main: M1, preprod: P2 }, live: [{ branch: 'main', sha: M0 }, { branch: 'preprod', sha: P2 }] });
    expect(fresh.outputs.publish).toBe('false');
  });

  it('a site published with run and artifact names is kept by that exact artifact', async () => {
    const name = `dist-preprod-${P0}-5-2`;
    const pin = await runStep('pin', {
      ref: 'refs/heads/main', sha: M1, tips: { main: M1, preprod: P0 },
      live: [{ branch: 'main', sha: M0, run: 5, artifact: `dist-main-${M0}-5-2` }, { branch: 'preprod', sha: P0, run: 5, artifact: name }],
      kept: { [name]: 5 },
    });
    expect(JSON.parse(pin.outputs.build!)).toEqual([{ branch: 'main', sha: M1, gate: true }]);
    expect(JSON.parse(pin.outputs.keep!)).toEqual({ branch: 'preprod', sha: P0, run: 5, name });
    // an artifact of that name from another run is not the live build
    const other = await runStep('pin', {
      ref: 'refs/heads/main', sha: M1, tips: { main: M1, preprod: P0 },
      live: [{ branch: 'preprod', sha: P0, run: 5, artifact: name }], kept: { [name]: 6 },
    });
    expect(other.outputs.keep).toBe('');
  });
});

describe('a rerun uses only its own attempt\'s builds (Sol P2, round 3)', () => {
  it('an earlier attempt\'s artifact never stands in for a build that failed this attempt', async () => {
    // attempt 1 built preprod P2 and failed later; attempt 2 reran the preprod leg and it failed its tests.
    // Attempt 1's upload is still on the run, so the downloaded files hold it, but no leg of attempt 2 names it.
    const choose = await runStep('choose', {
      tips: { main: M1, preprod: P2 }, live: [],
      files: [index(art('main', M1, 2)), index(art('preprod', P2, 1)), `dists/dist-preprod-${P0}/index.html`],
      env: {
        BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P2, gate: false }]),
        BUILT: builtBy({ main: art('main', M1, 2) }), PUSHED: 'main', RUN_ATTEMPT: '2',
        KEEP: JSON.stringify({ branch: 'preprod', sha: P0, run: 11, name: `dist-preprod-${P0}` }),
      },
    });
    expect(choose.failed).toBeUndefined();
    expect(JSON.parse(choose.outputs.published!).map((b: { sha: string }) => b.sha)).toEqual([M1, P0]);
    expect(choose.warnings.join()).toMatch(/failed; the site keeps/);
    // the pushed branch's leg failed this attempt: an earlier attempt's upload does not rescue it
    const pushedFailed = await runStep('choose', {
      tips: { main: M1, preprod: P0 }, live: [], files: [index(art('main', M1, 1))],
      env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }]), BUILT: builtBy({}), PUSHED: 'main', RUN_ATTEMPT: '2', KEEP: '' },
    });
    expect(pushedFailed.failed).toMatch(/main .* failed/);
  });

  it('a build named by another run or commit is not accepted', async () => {
    for (const wrong of [`dist-main-${M1}-6-1`, `dist-main-${M2}-${RUN}-1`, `dist-preprod-${M1}-${RUN}-1`]) {
      const choose = await runStep('choose', {
        tips: { main: M1 }, live: [], files: [index(wrong)],
        env: { BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }]), BUILT: builtBy({ main: wrong }), PUSHED: 'main', RUN_ATTEMPT: '1', KEEP: '' },
      });
      expect(choose.failed, wrong).toMatch(/main .* failed/);
    }
  });

  it('each attempt uploads its Pages bundles under its own names', async () => {
    const names = [];
    for (const attempt of [1, 2, 3]) {
      const choose = await runStep('choose', {
        tips: { main: M1, preprod: P1 }, live: [],
        files: [index(art('main', M1, attempt)), index(art('preprod', P1, attempt)), `dists/dist-preprod-${P0}/index.html`],
        env: {
          BUILD: JSON.stringify([{ branch: 'main', sha: M1, gate: true }, { branch: 'preprod', sha: P1, gate: false }]),
          BUILT: builtBy({ main: art('main', M1, attempt), preprod: art('preprod', P1, attempt) }), PUSHED: 'main', RUN_ATTEMPT: String(attempt),
          KEEP: JSON.stringify({ branch: 'preprod', sha: P0, run: 11, name: `dist-preprod-${P0}` }),
        },
      });
      expect(choose.outputs.bundle).toBe(`pages-${RUN}-${attempt}`);
      names.push(choose.outputs.bundle, choose.outputs.fallback_bundle);
    }
    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });
});
