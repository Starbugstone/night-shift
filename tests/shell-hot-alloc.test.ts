// No per-frame allocations in view sync paths (AGENTS.md: "no per-frame allocations in physics/render hot
// paths"; v0.2 council round 2, Fable item 6: `exitTagBox` returned a new box every frame).
//
// Static check over every view file (src/flight/views/**, src/abduct/views/**, src/ui/views/**, src/**/*-view.ts,
// src/abduct/deep-view.ts): starting from each class's `sync`, `update` and `tick` methods, it follows `this.method()`
// calls, getters and calls to functions declared in a view file, and flags every allocation it meets: `new`, a
// closure, an object or array literal, a template string with a value, a spread, `.map`-style copies, and a call to
// any function in src/ that returns a fresh object or array literal. Work a view does only when something changed is
// allowed: inside `if (shape.stale(key))`, an `if` that compares a field of `this` with `!==` (the label cache) or
// `if (!cached)` (a cache filled on first use).
// A `Shape.draw(key, (g) => …)` closure therefore goes behind `if (shape.stale(key))`.
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const HOT = new Set(['sync', 'update', 'tick']);
const COPIES = new Set(['map', 'filter', 'slice', 'concat', 'split', 'flatMap', 'join', 'toFixed', 'toString']);

const inScope = (file: string): boolean =>
  /^src\/(flight\/views|abduct\/views|ui\/views)\//.test(file) || /-view\.ts$/.test(file);

/** Minimal posix path helpers (the tests have no node typings). */
const path = {
  dirname: (p: string): string => p.slice(0, p.lastIndexOf('/')),
  basename: (p: string): string => p.slice(p.lastIndexOf('/') + 1),
  normalize: (p: string): string => {
    const out: string[] = [];
    for (const part of p.split('/')) {
      if (part === '..') out.pop();
      else if (part !== '.' && part !== '') out.push(part);
    }
    return out.join('/');
  },
  join: (...parts: string[]): string => parts.join('/'),
};

const isFunction = (n: ts.Node): n is ts.FunctionLikeDeclaration =>
  ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n) || ts.isGetAccessorDeclaration(n);

function unwrap(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
  return e;
}

const isLiteral = (e: ts.Expression): boolean => ts.isObjectLiteralExpression(unwrap(e)) || ts.isArrayLiteralExpression(unwrap(e));

/** A function whose own body returns a fresh object or array literal. */
function returnsFresh(fn: ts.FunctionLikeDeclaration): boolean {
  const body = fn.body;
  if (!body) return false;
  if (!ts.isBlock(body)) return isLiteral(body);
  let fresh = false;
  const visit = (n: ts.Node): void => {
    if (isFunction(n)) return;
    if (ts.isReturnStatement(n) && n.expression && isLiteral(n.expression)) fresh = true;
    ts.forEachChild(n, visit);
  };
  ts.forEachChild(body, visit);
  return fresh;
}

interface Module {
  src: ts.SourceFile;
  /** Top-level functions by name. */
  fns: Map<string, ts.FunctionLikeDeclaration>;
  /** Local name → [module file, exported name] for relative named imports. */
  imports: Map<string, [string, string]>;
}

function topFunctions(src: ts.SourceFile): Map<string, ts.FunctionLikeDeclaration> {
  const fns = new Map<string, ts.FunctionLikeDeclaration>();
  for (const n of src.statements) {
    if (ts.isFunctionDeclaration(n) && n.name && n.body) fns.set(n.name.text, n);
    if (ts.isVariableStatement(n)) {
      for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) fns.set(d.name.text, d.initializer);
      }
    }
  }
  return fns;
}

function relativeImports(file: string, src: ts.SourceFile, files: ReadonlySet<string>): Map<string, [string, string]> {
  const out = new Map<string, [string, string]>();
  for (const n of src.statements) {
    if (!ts.isImportDeclaration(n) || !ts.isStringLiteral(n.moduleSpecifier)) continue;
    const bindings = n.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings) || !n.moduleSpecifier.text.startsWith('.')) continue;
    const base = path.normalize(path.join(path.dirname(file), n.moduleSpecifier.text));
    const target = [`${base}.ts`, `${base}/index.ts`].find(f => files.has(f));
    if (!target) continue;
    for (const el of bindings.elements) out.set(el.name.text, [target, (el.propertyName ?? el.name).text]);
  }
  return out;
}

export function loadModules(sources: Record<string, string>): Map<string, Module> {
  const files = new Set(Object.keys(sources));
  const mods = new Map<string, Module>();
  for (const [file, text] of Object.entries(sources)) {
    const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    mods.set(file, { src, fns: topFunctions(src), imports: relativeImports(file, src, files) });
  }
  return mods;
}

/** The function a bare call `name(…)` in `file` resolves to, with its file. */
function resolve(mods: Map<string, Module>, file: string, name: string): [string, ts.FunctionLikeDeclaration] | null {
  const mod = mods.get(file)!;
  const local = mod.fns.get(name);
  if (local) return [file, local];
  const imp = mod.imports.get(name);
  const fn = imp && mods.get(imp[0])?.fns.get(imp[1]);
  return imp && fn ? [imp[0], fn] : null;
}

const isThisField = (e: ts.Expression): boolean => {
  const x = unwrap(e);
  return ts.isPropertyAccessExpression(x) && x.expression.kind === ts.SyntaxKind.ThisKeyword;
};

/**
 * `if (shape.stale(key))`, `if (… this.field !== x …)` (work done only when something changed) or `if (!cached)`
 * (a cache filled on first use).
 */
function isChangeCheck(cond: ts.Expression): boolean {
  const c = unwrap(cond);
  if (ts.isPrefixUnaryExpression(c) && c.operator === ts.SyntaxKind.ExclamationToken && (ts.isIdentifier(unwrap(c.operand)) || isThisField(c.operand))) return true;
  let found = false;
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'stale') found = true;
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken && (isThisField(n.left) || isThisField(n.right))) found = true;
    ts.forEachChild(n, visit);
  };
  visit(cond);
  return found;
}

function allocation(n: ts.Node, src: ts.SourceFile, fresh: (name: string) => boolean): string | null {
  if (ts.isNewExpression(n)) return `new ${n.expression.getText(src)}`;
  if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) return 'closure';
  if (ts.isObjectLiteralExpression(n)) {
    const p = n.parent;
    if (ts.isBinaryExpression(p) && p.left === n) return null; // destructuring assignment
    return 'object literal';
  }
  if (ts.isArrayLiteralExpression(n)) {
    const p = n.parent;
    if (ts.isBinaryExpression(p) && p.left === n) return null;
    return 'array literal';
  }
  if (ts.isTemplateExpression(n)) return 'template string';
  if (ts.isSpreadElement(n) || ts.isSpreadAssignment(n)) return 'spread';
  if (ts.isCallExpression(n)) {
    const callee = n.expression;
    if (ts.isPropertyAccessExpression(callee) && COPIES.has(callee.name.text)) return `.${callee.name.text}()`;
    if (ts.isIdentifier(callee) && fresh(callee.text)) return `${callee.text}() returns a new object`;
  }
  return null;
}

/** Every allocation on a per-frame path of a view, as `file:line owner: what`. */
export function hotAllocations(mods: Map<string, Module>): { found: string[]; hotMethods: number } {
  const freshCache = new Map<ts.Node, boolean>();
  const isFresh = (file: string, name: string): boolean => {
    const hit = resolve(mods, file, name);
    if (!hit) return false;
    if (!freshCache.has(hit[1])) freshCache.set(hit[1], returnsFresh(hit[1]));
    return freshCache.get(hit[1])!;
  };
  const found: string[] = [];
  const doneFns = new Set<ts.Node>();
  let hotMethods = 0;
  type Job = { file: string; body: ts.Node; owner: string; methods: Map<string, ts.MethodDeclaration | ts.GetAccessorDeclaration> | null };
  const queue: Job[] = [];
  for (const [file, mod] of mods) {
    if (!inScope(file)) continue;
    const classes: ts.ClassLikeDeclaration[] = [];
    const find = (n: ts.Node): void => {
      if (ts.isClassDeclaration(n) || ts.isClassExpression(n)) classes.push(n);
      ts.forEachChild(n, find);
    };
    find(mod.src);
    for (const cls of classes) {
      const methods = new Map<string, ts.MethodDeclaration | ts.GetAccessorDeclaration>();
      for (const m of cls.members) {
        if ((ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m)) && m.body && ts.isIdentifier(m.name)) methods.set(m.name.text, m);
      }
      for (const [name, m] of methods) {
        if (!HOT.has(name)) continue;
        hotMethods++;
        doneFns.add(m);
        queue.push({ file, body: m.body!, owner: `${cls.name?.text ?? 'class'}.${name}`, methods });
      }
    }
  }
  while (queue.length) {
    const { file, body, owner, methods } = queue.pop()!;
    const { src } = mods.get(file)!;
    const follow = (m: ts.FunctionLikeDeclaration | undefined, jobFile: string, jobOwner: string, jobMethods: Job['methods']): void => {
      if (!m?.body || doneFns.has(m)) return;
      doneFns.add(m);
      queue.push({ file: jobFile, body: m.body, owner: jobOwner, methods: jobMethods });
    };
    const visit = (n: ts.Node, guarded: boolean): void => {
      if (ts.isIfStatement(n) && isChangeCheck(n.expression)) {
        visit(n.expression, guarded);
        visit(n.thenStatement, true);
        if (n.elseStatement) visit(n.elseStatement, guarded);
        return;
      }
      if (ts.isThrowStatement(n)) return;
      const what = guarded ? null : allocation(n, src, name => isFresh(file, name));
      if (what) {
        const { line } = src.getLineAndCharacterOfPosition(n.getStart(src));
        found.push(`${file}:${line + 1} ${owner}: ${what} (${n.getText(src).replace(/\s+/g, ' ').slice(0, 60)})`);
      }
      if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) return;
      // a call made only when something changed runs only then: don't follow it
      if (!guarded && methods && ts.isPropertyAccessExpression(n) && n.expression.kind === ts.SyntaxKind.ThisKeyword) {
        const m = methods.get(n.name.text);
        const called = ts.isCallExpression(n.parent) && n.parent.expression === n;
        if (m && (called || ts.isGetAccessorDeclaration(m))) follow(m, file, `${owner.split('.')[0]}.${n.name.text}`, methods);
      }
      if (!guarded && ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const hit = resolve(mods, file, n.expression.text);
        if (hit && inScope(hit[0])) follow(hit[1], hit[0], `${path.basename(hit[0])}#${n.expression.text}`, null);
      }
      ts.forEachChild(n, c => visit(c, guarded));
    };
    ts.forEachChild(body, c => visit(c, false));
  }
  return { found: found.sort(), hotMethods };
}

const RAW = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const SOURCES = Object.fromEntries(Object.entries(RAW).map(([f, text]) => [f.replace(/^\.\.\//, ''), text]));

describe('view sync paths allocate nothing per frame', () => {
  const mods = loadModules(SOURCES);
  const { found, hotMethods } = hotAllocations(mods);

  it('scans every view', () => {
    expect(Object.keys(SOURCES).filter(inScope).length).toBeGreaterThan(40);
    expect(hotMethods).toBeGreaterThan(120);
  });

  it('no allocation on a per-frame path', () => {
    expect(found).toEqual([]);
  });

  it('catches the old exit-tag box and a Shape closure outside stale() (mutation check)', () => {
    const old = loadModules({
      'src/abduct/exit-tag.ts': 'export function exitTagBox(a: number) { return { x: a, y: 0 }; }\n',
      'src/abduct/deep-view.ts': [
        "import { exitTagBox } from './exit-tag';",
        'class DeepExit {',
        '  sync(cx: number): void { this.placeTag(cx); this.bar.draw(cx, (g) => g.rect(0, 0, cx, 4)); }',
        '  private placeTag(cx: number): void { const tag = exitTagBox(cx); this.p.position.set(tag.x, tag.y); }',
        '  label(t: string): void { if (t !== this.last) this.l.text = `${t}!`; }',
        '}',
      ].join('\n'),
    });
    const hits = hotAllocations(old).found.map(s => s.replace(/ \(.*$/, ''));
    expect(hits).toEqual([
      'src/abduct/deep-view.ts:3 DeepExit.sync: closure',
      'src/abduct/deep-view.ts:4 DeepExit.placeTag: exitTagBox() returns a new object',
    ]);
    const fixed = loadModules({
      'src/flight/views/x.ts': 'class V { sync(k: number): void { if (this.bar.stale(k)) this.bar.draw(k, (g) => g.rect(0, 0, k, 4)); if (k !== this.k) this.o = { k }; } }\n',
    });
    expect(hotAllocations(fixed).found).toEqual([]);
  });
});
