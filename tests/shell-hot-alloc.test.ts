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
// Round 3 (Fable F6, Opus O3): it also follows `this.<field>.<method>()` into the field's class (its declared type,
// `new X()` initializer or constructor parameter property) and bare calls into any src module, not only view files,
// and flags a default parameter that allocates (`out = { … }`) when a hot caller leaves that argument out: dropping
// `, this.tag` from `exitTagBox(…)` in deep-view.ts and `RoomLessons.tip`'s `.some(h => …)` used to pass.
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const HOT = new Set(['sync', 'update', 'tick']);
const COPIES = new Set(['map', 'filter', 'slice', 'concat', 'split', 'flatMap', 'join', 'toFixed', 'toString']);

const inScope = (file: string): boolean =>
  /^src\/(flight\/views|abduct\/views|ui\/views)\//.test(file) || /-view\.ts$/.test(file);

/**
 * Round 4 (Fable F4): a view class outside the view files (src/ui/title.ts SaveNoticeView, src/abduct/draw.ts
 * AbductView and HumanArt...): one that implements SceneView, or whose name ends in View or Art.
 */
const isViewClass = (cls: ts.ClassLikeDeclaration): boolean =>
  /(View|Art)$/.test(cls.name?.text ?? '') ||
  !!cls.heritageClauses?.some(h => h.token === ts.SyntaxKind.ImplementsKeyword && h.types.some(t => t.expression.getText() === 'SceneView'));

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
  /** Classes by name. */
  classes: Map<string, ts.ClassLikeDeclaration>;
  /** Local name → [module file, exported name] for relative named imports. */
  imports: Map<string, [string, string]>;
  /** Interface name → the classes here that implement it (round 4, Fable F4: fields typed by an interface). */
  implementers: Map<string, ts.ClassLikeDeclaration[]>;
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
    const classes = new Map<string, ts.ClassLikeDeclaration>();
    const implementers = new Map<string, ts.ClassLikeDeclaration[]>();
    const find = (n: ts.Node): void => {
      if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && n.name) {
        classes.set(n.name.text, n);
        for (const h of n.heritageClauses ?? []) {
          if (h.token !== ts.SyntaxKind.ImplementsKeyword) continue;
          for (const t of h.types) if (ts.isIdentifier(t.expression)) implementers.set(t.expression.text, [...implementers.get(t.expression.text) ?? [], n]);
        }
      }
      ts.forEachChild(n, find);
    };
    find(src);
    mods.set(file, { src, fns: topFunctions(src), classes, imports: relativeImports(file, src, files), implementers });
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

/** The class a name in `file` refers to (declared there or imported by name), with its file. */
function resolveClass(mods: Map<string, Module>, file: string, name: string): [string, ts.ClassLikeDeclaration] | null {
  const mod = mods.get(file)!;
  const local = mod.classes.get(name);
  if (local) return [file, local];
  const imp = mod.imports.get(name);
  const cls = imp && mods.get(imp[0])?.classes.get(imp[1]);
  return imp && cls ? [imp[0], cls] : null;
}

/** The classes a field's type name stands for: the class itself, or every class in src that implements the interface. */
function resolveClasses(mods: Map<string, Module>, file: string, name: string): [string, ts.ClassLikeDeclaration][] {
  const cls = resolveClass(mods, file, name);
  if (cls) return [cls];
  const imp = mods.get(file)!.imports.get(name);
  const iface = imp ? imp[1] : name;
  const out: [string, ts.ClassLikeDeclaration][] = [];
  for (const [f, mod] of mods) for (const c of mod.implementers.get(iface) ?? []) out.push([f, c]);
  return out;
}

/** The class name a type annotation names (`X`, `X | null`, `readonly X`), or null. */
function typeName(t: ts.TypeNode | undefined): string | null {
  if (!t) return null;
  if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) return t.typeName.text;
  if (ts.isUnionTypeNode(t)) for (const m of t.types) { const n = typeName(m); if (n) return n; }
  if (ts.isTypeOperatorNode(t) || ts.isParenthesizedTypeNode(t)) return typeName(t.type);
  return null;
}

/** Field name → the class name of its value, from `field: X`, `field = new X(…)` or a constructor parameter property. */
function fieldClasses(cls: ts.ClassLikeDeclaration): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of cls.members) {
    if (ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name)) {
      const init = m.initializer && unwrap(m.initializer);
      const name = typeName(m.type) ?? (init && ts.isNewExpression(init) && ts.isIdentifier(init.expression) ? init.expression.text : null);
      if (name) out.set(m.name.text, name);
    }
    if (ts.isConstructorDeclaration(m)) {
      for (const p of m.parameters) {
        const name = typeName(p.type);
        if (name && ts.isIdentifier(p.name) && p.modifiers?.some(x => x.kind === ts.SyntaxKind.PrivateKeyword || x.kind === ts.SyntaxKind.PublicKeyword || x.kind === ts.SyntaxKind.ProtectedKeyword || x.kind === ts.SyntaxKind.ReadonlyKeyword)) out.set(p.name.text, name);
      }
    }
  }
  return out;
}

function methodsOf(cls: ts.ClassLikeDeclaration): Map<string, ts.MethodDeclaration | ts.GetAccessorDeclaration> {
  const methods = new Map<string, ts.MethodDeclaration | ts.GetAccessorDeclaration>();
  for (const m of cls.members) {
    if ((ts.isMethodDeclaration(m) || ts.isGetAccessorDeclaration(m)) && m.body && ts.isIdentifier(m.name)) methods.set(m.name.text, m);
  }
  return methods;
}

/**
 * Local names a function body gives to fields of `this` (`const rl = this.roomLessons`, `const { help } = this`),
 * mapped to the field's class (round 4, Opus O5). Nested functions keep their own names out.
 */
function fieldAliases(body: ts.Node, fields: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  const visit = (n: ts.Node): void => {
    if (isFunction(n) && n !== body.parent) return;
    if (ts.isVariableDeclaration(n) && n.initializer) {
      const init = unwrap(n.initializer);
      if (ts.isIdentifier(n.name) && ts.isPropertyAccessExpression(init) && init.expression.kind === ts.SyntaxKind.ThisKeyword) {
        const cls = fields.get(init.name.text);
        if (cls) out.set(n.name.text, cls);
      }
      if (ts.isObjectBindingPattern(n.name) && init.kind === ts.SyntaxKind.ThisKeyword) {
        for (const el of n.name.elements) {
          const field = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : ts.isIdentifier(el.name) ? el.name.text : null;
          const cls = field ? fields.get(field) : undefined;
          if (cls && ts.isIdentifier(el.name)) out.set(el.name.text, cls);
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return out;
}

/** A default parameter the call leaves out that allocates (`out = { x: 0 }`), or null. */
function defaultAllocation(fn: ts.FunctionLikeDeclaration, call: ts.CallExpression): string | null {
  for (let i = call.arguments.length; i < fn.parameters.length; i++) {
    const init = fn.parameters[i]!.initializer;
    if (init && (isLiteral(init) || ts.isNewExpression(unwrap(init)))) return `default parameter ${fn.parameters[i]!.name.getText()} allocates`;
  }
  return null;
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

/** `if (x === this.last) return;`: the rest of the block runs only when something changed (an early-return cache). */
function isSameReturn(n: ts.Statement): boolean {
  if (!ts.isIfStatement(n) || n.elseStatement) return false;
  const then = ts.isBlock(n.thenStatement) && n.thenStatement.statements.length === 1 ? n.thenStatement.statements[0]! : n.thenStatement;
  if (!ts.isReturnStatement(then)) return false;
  const c = unwrap(n.expression);
  return ts.isBinaryExpression(c) && c.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken && (isThisField(c.left) || isThisField(c.right));
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
  type Job = { file: string; body: ts.Node; owner: string; methods: Map<string, ts.MethodDeclaration | ts.GetAccessorDeclaration> | null; fields: Map<string, string> | null };
  const queue: Job[] = [];
  for (const [file, mod] of mods) {
    const classes: ts.ClassLikeDeclaration[] = [];
    const find = (n: ts.Node): void => {
      if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && (inScope(file) || isViewClass(n))) classes.push(n);
      ts.forEachChild(n, find);
    };
    find(mod.src);
    for (const cls of classes) {
      const methods = methodsOf(cls);
      const fields = fieldClasses(cls);
      for (const [name, m] of methods) {
        if (!HOT.has(name)) continue;
        hotMethods++;
        doneFns.add(m);
        queue.push({ file, body: m.body!, owner: `${cls.name?.text ?? 'class'}.${name}`, methods, fields });
      }
    }
  }
  while (queue.length) {
    const { file, body, owner, methods, fields } = queue.pop()!;
    const { src } = mods.get(file)!;
    const follow = (m: ts.FunctionLikeDeclaration | undefined, jobFile: string, jobOwner: string, jobMethods: Job['methods'], jobFields: Job['fields'] = null): void => {
      if (!m?.body || doneFns.has(m)) return;
      doneFns.add(m);
      queue.push({ file: jobFile, body: m.body, owner: jobOwner, methods: jobMethods, fields: jobFields });
    };
    const report = (n: ts.Node, what: string): void => {
      const { line } = src.getLineAndCharacterOfPosition(n.getStart(src));
      found.push(`${file}:${line + 1} ${owner}: ${what} (${n.getText(src).replace(/\s+/g, ' ').slice(0, 60)})`);
    };
    const visit = (n: ts.Node, guarded: boolean): void => {
      if (ts.isIfStatement(n) && isChangeCheck(n.expression)) {
        visit(n.expression, guarded);
        visit(n.thenStatement, true);
        if (n.elseStatement) visit(n.elseStatement, guarded);
        return;
      }
      if (ts.isThrowStatement(n)) return;
      if (ts.isBlock(n)) {
        let g = guarded;
        for (const st of n.statements) {
          visit(st, g);
          if (isSameReturn(st)) g = true;
        }
        return;
      }
      const what = guarded ? null : allocation(n, src, name => isFresh(file, name));
      if (what) report(n, what);
      if (ts.isArrowFunction(n) || ts.isFunctionExpression(n)) return;
      // a call made only when something changed runs only then: don't follow it
      if (!guarded && methods && ts.isPropertyAccessExpression(n) && n.expression.kind === ts.SyntaxKind.ThisKeyword) {
        const m = methods.get(n.name.text);
        const called = ts.isCallExpression(n.parent) && n.parent.expression === n;
        if (m && called) { const d = defaultAllocation(m, n.parent as ts.CallExpression); if (d) report(n.parent, d); }
        if (m && (called || ts.isGetAccessorDeclaration(m))) follow(m, file, `${owner.split('.')[0]}.${n.name.text}`, methods, fields);
      }
      // this.<field>.<method>(): into the field's class, wherever it is declared (Fable F6); also through a local
      // alias of the field, `const rl = this.roomLessons; rl.tip(…)` (round 4, Opus O5)
      if (!guarded && fields && ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
        const target = unwrap(n.expression.expression);
        const clsName = ts.isPropertyAccessExpression(target) && target.expression.kind === ts.SyntaxKind.ThisKeyword
          ? fields.get(target.name.text)
          : ts.isIdentifier(target) ? aliases.get(target.text) : undefined;
        for (const hit of clsName ? resolveClasses(mods, file, clsName) : []) {
          {
            const ms = methodsOf(hit[1]);
            const m = ms.get(n.expression.name.text);
            if (m) {
              const d = defaultAllocation(m, n);
              if (d) report(n, d);
              follow(m, hit[0], `${hit[1].name?.text ?? 'class'}.${n.expression.name.text}`, ms, fieldClasses(hit[1]));
            }
          }
        }
      }
      // a bare call: into any src module (Opus O3), not only view files
      if (!guarded && ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const hit = resolve(mods, file, n.expression.text);
        if (hit) {
          const d = defaultAllocation(hit[1], n);
          if (d) report(n, d);
          follow(hit[1], hit[0], `${path.basename(hit[0])}#${n.expression.text}`, null);
        }
      }
      ts.forEachChild(n, c => visit(c, guarded));
    };
    const aliases = fields ? fieldAliases(body, fields) : new Map<string, string>();
    if (ts.isBlock(body)) visit(body, false);
    else ts.forEachChild(body, c => visit(c, false));
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
      'src/abduct/exit-tag.ts:1 exit-tag.ts#exitTagBox: object literal',
    ]);
    const fixed = loadModules({
      'src/flight/views/x.ts': 'class V { sync(k: number): void { if (this.bar.stale(k)) this.bar.draw(k, (g) => g.rect(0, 0, k, 4)); if (k !== this.k) this.o = { k }; } }\n',
    });
    expect(hotAllocations(fixed).found).toEqual([]);
  });

  // round 3 (Opus O3, Fable F6): the two misses, on the real sources
  const mutate = (file: string, from: string, to: string): Record<string, string> => {
    const text = SOURCES[file]!;
    expect(text, file).toContain(from);
    return { ...SOURCES, [file]: text.replace(from, to) };
  };

  it('catches a dropped `, this.tag` with a defaulted exitTagBox box (mutation check)', () => {
    const dropped = mutate('src/abduct/deep-view.ts', 'this.tagTextW, cx, cy, this.tag)', 'this.tagTextW, cx, cy)');
    dropped['src/abduct/exit-tag.ts'] = SOURCES['src/abduct/exit-tag.ts']!.replace(/ {2}out: TagBox,[^\n]*\n/, '  out: TagBox = { x: 0, y: 0, w: 0, h: 0 },\n');
    expect(dropped['src/abduct/exit-tag.ts']).not.toBe(SOURCES['src/abduct/exit-tag.ts']);
    expect(hotAllocations(loadModules(dropped)).found.some(f => /deep-view\.ts:\d+ DeepExit\.placeTag: default parameter out allocates/.test(f))).toBe(true);
  });

  it('catches a per-frame closure in a class a view holds in a field, outside the view files (mutation check)', () => {
    const closure = mutate('src/abduct/room-lessons.ts',
      'if (h.kind === kind && hazardReach(h, x, y) < lessonNear(kind) + pad) return true;',
      'if ([h].some(k => k.kind === kind && hazardReach(k, x, y) < lessonNear(kind) + pad)) return true;');
    expect(hotAllocations(loadModules(closure)).found.some(f => /room-lessons\.ts:\d+ RoomLessons\.inZone: closure/.test(f))).toBe(true);
    // this.<field>.<method>() into a class declared outside every view file, typed by a constructor parameter property
    const field = hotAllocations(loadModules({
      'src/flight/views/v.ts': "import { Helper } from '../helper';\nclass V { constructor(private readonly help: Helper) {} sync(): void { this.help.step(1); } }\n",
      'src/flight/helper.ts': 'export class Helper { step(k: number): number { return [k].length; } }\n',
    })).found.map(f => f.replace(/ \(.*$/, ''));
    expect(field).toEqual(['src/flight/helper.ts:1 Helper.step: array literal']);
  });

  // round 4 (Opus O5): a call through a local alias of the field used to pass
  it('follows a local alias of a field (`const rl = this.roomLessons; rl.tip()`) (mutation check)', () => {
    const helper = 'export class Helper { step(k: number): number { return [k].length; } }\n';
    for (const body of ['const h = this.help; h.step(1);', 'const h = this.help!; return void h.step(1);', 'const { help } = this; help.step(1);', 'const { help: h } = this; h.step(1);']) {
      const aliased = hotAllocations(loadModules({
        'src/flight/views/v.ts': `import { Helper } from '../helper';\nclass V { constructor(private readonly help: Helper) {} sync(): void { ${body} } }\n`,
        'src/flight/helper.ts': helper,
      })).found.map(f => f.replace(/ \(.*$/, ''));
      expect(aliased, body).toEqual(['src/flight/helper.ts:1 Helper.step: array literal']);
    }
    // on the real sources (Opus's probe): deep-view.ts reaches RoomLessons through an alias, and RoomLessons gets a closure
    const closure = mutate('src/abduct/deep-view.ts',
      '    let tip = \'\';\n',
      '    let tip = \'\';\n    const rl = this.roomLessons;\n');
    closure['src/abduct/deep-view.ts'] = closure['src/abduct/deep-view.ts']!.replace('else tip = this.roomLessons.tip(chestX, chestY, pad);', 'else tip = rl.tip(chestX, chestY, pad);');
    expect(closure['src/abduct/deep-view.ts']).toContain('rl.tip(chestX, chestY, pad)');
    closure['src/abduct/room-lessons.ts'] = SOURCES['src/abduct/room-lessons.ts']!.replace(
      'if (h.kind === kind && hazardReach(h, x, y) < lessonNear(kind) + pad) return true;',
      'if ([h].some(k => k.kind === kind && hazardReach(k, x, y) < lessonNear(kind) + pad)) return true;');
    expect(closure['src/abduct/room-lessons.ts']).not.toBe(SOURCES['src/abduct/room-lessons.ts']);
    expect(hotAllocations(loadModules(closure)).found.some(f => /room-lessons\.ts:\d+ RoomLessons\.inZone: closure/.test(f))).toBe(true);
    // this.<field>.<method>() into a class declared outside every view file, typed by a constructor parameter property
    const field = hotAllocations(loadModules({
      'src/flight/views/v.ts': "import { Helper } from '../helper';\nclass V { constructor(private readonly help: Helper) {} sync(): void { this.help.step(1); } }\n",
      'src/flight/helper.ts': 'export class Helper { step(k: number): number { return [k].length; } }\n',
    })).found.map(f => f.replace(/ \(.*$/, ''));
    expect(field).toEqual(['src/flight/helper.ts:1 Helper.step: array literal']);
  });

  it('an early-return change check (`if (x === this.last) return;`) guards the rest of the method', () => {
    const cached = loadModules({
      'src/flight/views/w.ts': 'class W { sync(f: object): void { this.a.x = 1; if (f === this.last) return; this.last = f; this.o = { f }; } }\n',
    });
    expect(hotAllocations(cached).found).toEqual([]);
    const unguarded = loadModules({
      'src/flight/views/w.ts': 'class W { sync(f: object): void { if (f === this.last) this.n++; this.o = { f }; } }\n',
    });
    expect(hotAllocations(unguarded).found.length).toBe(1);
  });

  // round 4 (Fable F4): view classes outside the view files and a field typed by an interface were never scanned
  it('scans view classes outside the view files and fields typed by an interface (mutation check)', () => {
    const hit = (sources: Record<string, string>, re: RegExp) => hotAllocations(loadModules(sources)).found.some(f => re.test(f));
    // a per-frame template string in the title's damaged-save notice
    const notice = mutate('src/ui/title.ts', '    this.press.visible = s.notice.pressedDown;\n', '    this.press.visible = s.notice.pressedDown;\n    this.press.label = `${fade}`;\n');
    expect(hit(notice, /title\.ts:\d+ SaveNoticeView\.sync: template string/)).toBe(true);
    // a per-frame array in HumanArt, reached from DeepAbductView through its SpecimenArt-typed field
    const human = mutate('src/abduct/draw.ts', '    this.awake.visible = awake;\n', '    this.awake.visible = [awake].length > 0;\n');
    expect(hit(human, /draw\.ts:\d+ HumanArt\.sync: array literal/)).toBe(true);
    // a per-frame object in the tutorial abduction's scene view
    const abduct = mutate('src/abduct/draw.ts', '    this.lastTime = ctx.time;\n    this.moments(dt);\n', '    this.lastTime = ctx.time;\n    this.moments({ dt }.dt);\n');
    expect(hit(abduct, /draw\.ts:\d+ AbductView\.sync: object literal/)).toBe(true);
    // and the menu allocations the wider scope found, put back
    const loading = mutate('src/ui/loading.ts', 'if (this.fill.stale(Math.round(fw * 2))) this.fill.redraw(', 'this.fill.draw(Math.round(fw * 2), ');
    expect(hit(loading, /loading\.ts:\d+ LoadingView\.sync: closure/)).toBe(true);
    const shelf = mutate('src/ui/trophies.ts', '    const id = selected.kind', '    void `${selected.kind}`;\n    const id = selected.kind');
    expect(hit(shelf, /trophies\.ts:\d+ DetailModalView\.sync: template string/)).toBe(true);
  }, 60_000);
});
