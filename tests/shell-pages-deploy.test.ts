// The site publishes only tested, pinned commits (council v0.2 item 9, docs/REGRESSIONS.md E7): Pages used to
// run the tests on the event checkout, then `git clone` the current tips of main and preprod and publish those
// builds, so the live site could hold a commit no test had seen.
//
// Rule (.github/workflows/pages.yml): a `pin` job resolves each branch to one exact SHA (the pushed commit, or
// the other branch's tip by `git ls-remote`); each build job checks out exactly that SHA, proves it, runs
// `npm test` before `npm run build` and uploads that build; the site is assembled only from those uploads, with
// no checkout, clone or build of its own, and /deployed.json names the pinned SHAs.
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
    if (!/github\.sha/.test(pin)) bad.push('pin does not use the pushed commit (github.sha)');
    if (!/git ls-remote/.test(pin)) bad.push('pin does not resolve the other branch to a SHA');
  }

  const build = [...j].find(([, s]) => /npm run build/.test(s));
  if (!build) bad.push('no job builds the site');
  else {
    const [name, s] = build;
    if (!/needs:\s*\[?\s*pin\b/.test(s)) bad.push(`${name} does not wait for pin`);
    if (!/fromJSON\(needs\.pin\.outputs\.targets\)/.test(s)) bad.push(`${name} does not build each pinned target`);
    const checkouts = [...s.matchAll(/uses: actions\/checkout@[^\n]*\n(?:\s+with:\s*\n\s+ref:\s*([^\n]+))?/g)];
    if (checkouts.length !== 1) bad.push(`${name} has ${checkouts.length} checkouts, not one`);
    else if (!/\$\{\{\s*matrix\.sha\s*\}\}/.test(checkouts[0]![1] ?? '')) bad.push(`${name} does not check out the pinned SHA`);
    if (!/git rev-parse HEAD/.test(s)) bad.push(`${name} does not prove the checkout is the pinned commit`);
    const order = ['actions/checkout', 'npm ci', 'npm test', 'npm run build', 'actions/upload-artifact'].map((step) => s.indexOf(step));
    if (order.some((i) => i < 0) || order.some((i, k) => k > 0 && i < order[k - 1]!)) {
      bad.push(`${name} must run checkout → npm ci → npm test → npm run build → upload, in that order`);
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
    if (!/deployed\.json/.test(s) || !/needs\.pin\.outputs\.targets/.test(s)) bad.push(`${name} does not write the pinned SHAs to /deployed.json`);
  }
  const deploy = [...j].find(([, s]) => /actions\/deploy-pages/.test(s));
  if (!deploy || (assemble && !new RegExp(`needs:[^\\n]*\\b${assemble[0]}\\b`).test(deploy[1]))) bad.push('deploy does not wait for the assembled site');
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
    const buildFirst = workflow.replace('      - run: npm test\n      - run: npm run build\n', '      - run: npm run build\n      - run: npm test\n');
    expect(buildFirst).not.toBe(workflow);
    expect(problems(buildFirst).some((p) => p.includes('in that order'))).toBe(true);
    const branchRef = workflow.replace('ref: ${{ matrix.sha }}', 'ref: preprod');
    expect(problems(branchRef)).toContain('a checkout names a branch instead of a pinned SHA');
    const noPin = workflow.replace(/\n {2}pin:\n/, '\n  resolve:\n');
    expect(problems(noPin)).toContain('no pin job');
  });
});
