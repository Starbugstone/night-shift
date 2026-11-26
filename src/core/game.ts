import { Container } from 'pixi.js';
import type { AbductResult, AbductRules, FlightResult, PointerState, RoomId } from '../contracts';
import { createAbductScene, emitterPoint } from '../abduct';
import { SynthAudio } from '../audio/sfx';
import { DeepFlightScene } from '../flight/deep-scene';
import { FlightScene } from '../flight/scene';
import { FIELD_CHECK, FIELD_CHECK_INDEX, FIELD_CHECK_ROOM, FIELD_CHECK_RULES } from '../levels/field-check';
import { LEVELS, deepSlot, isDeep, isRoomId, levelIndexForRoom, levelRooms } from '../levels/levels';
import { applyDeepRun, applyRun, backfillSpecimens, isLevelUnlocked, setUnlockEverything } from '../levels/progress';
import { DeepRun } from '../levels/run';
import type { DeepLevelDef } from '../levels/types';
import { clearSave, loadSave, writeSave, type KeyValueStore, type SaveData } from '../levels/save';
import { getLang, resolveLang, setLang, tr, type Lang } from '../i18n';
import { AbortScene } from '../ui/abort';
import { DeepAbductScene } from '../ui/deep-abduct';
import { DeepChoiceScene } from '../ui/deep-choice';
import { FieldCheckAbduction, FieldCheckCard } from '../ui/field-check';
import { LoadingScene } from '../ui/loading';
import { DispatchFinale, FINALE_BEAT } from '../ui/dispatch-finale';
import { MemoScene } from '../ui/memo';
import { ReportScene, deepReport, tutorialReport } from '../ui/report';
import { TitleScene } from '../ui/title';
import { TrophiesScene, type TrophyReturnTarget } from '../ui/trophies';
import type { TrophyRoomTab } from '../ui/trophy-data';
import { UpgradesScene } from '../ui/upgrades';
import { WorkOrdersScene } from '../ui/workorders';
import { AssetLoader } from './assets';
import { captureFrame, type RenderHost } from './gfx/host';
import type { Viewport } from './viewport';
import { PointerInput } from './input';
import { startLoop } from './loop';
import { SceneManager, type Transition } from './scenes';
import type { MutableContext, Shell } from './shell';
import { resetSave } from './reset';
import { browserStorage, isPreprodPath, preprodStorage, watchReducedMotion } from './storage';
import { viewUploader } from './gfx/prepare';

export type SceneName =
  | 'loading'
  | 'title'
  | 'workorders'
  | 'upgrades'
  | 'trophies'
  | 'dispatch-finale'
  | 'memo'
  | 'field-check'
  | 'flight'
  | 'abduct'
  | 'report'
  | 'abort'
  | 'choice';

export interface DebugHook {
  readonly workOrders: readonly { id: string; kind: string; num: number }[];
  readonly scene: string;
  /** A scene transition is running: taps are swallowed until it ends (bots must wait for false). */
  readonly transitioning: boolean;
  /** The deep shift in progress, if any. */
  readonly run: DeepRun | null;
  /** Live pointer state in logical px (test scripts). */
  readonly pointer: PointerState;
  readonly save: SaveData;
  /** The live scene object, for automated test scripts only. */
  readonly active: unknown;
  /** Display language in use ('en' | 'fr'). */
  readonly lang: Lang;
  goto(name: string, arg?: unknown): void;
  /** PNG data URL of the frame on screen (renders it first, so the WebGL buffer is fresh). */
  capture(): string;
  /**
   * Render the current frame again without advancing the game. The WebGL canvas keeps its pixels
   * only until the browser composites, so a script that reads `canvas#game` (drawImage,
   * toDataURL) must call this first, in the same task.
   */
  redraw(): void;
  /** False skips the scene sync and the Pixi render each frame (video time-lapse fast path); the game still updates. */
  drawing: boolean;
  /** Milliseconds of main-thread work (update + sync + Pixi render) for the last 240 frames, a ring. */
  readonly frameMs: Float32Array;
  /** Next write index into `frameMs`. */
  readonly frameAt: number;
  /** Frames so far whose Pixi render rebuilt the whole display list (see `RenderHost.rebuilds`). */
  readonly rebuilds: number;
  /** The Pixi stage (draw-call and batching diagnostics, `scripts/pixi/batches.mjs`). */
  readonly stage: unknown;
}

declare global {
  interface Window {
    __nightShift?: DebugHook;
  }
}

const TUTORIAL_RULES: AbductRules = { wakeFails: false, hard: false };
const DEEP_RULES: AbductRules = { wakeFails: true, hard: true };
const TEST_FIXTURES = import.meta.env.DEV || import.meta.env.MODE === 'e2e';

function firstRoom(li: number): RoomId {
  const l = LEVELS[li]!;
  return levelRooms(l)[0]!;
}

function clampLevel(i: number): number {
  return Math.max(0, Math.min(LEVELS.length - 1, Math.floor(i)));
}

export class Game implements Shell {
  readonly ctx: MutableContext;
  readonly audio = new SynthAudio();
  readonly input: PointerInput;
  readonly assets = new AssetLoader();
  readonly scenes: SceneManager;
  private storage: KeyValueStore | null;
  readonly preprod: boolean;
  private _save: SaveData;
  /** Live flight scene (for debug/tests). */
  flight: FlightScene | DeepFlightScene | null = null;
  /** The deep shift in progress (L3+), if any. */
  run: DeepRun | null = null;

  /**
   * @param gfx The Pixi renderer (its canvas also takes the pointer input).
   * @param viewport The shared letterbox mapping, kept current by `watchViewport`.
   */
  constructor(
    private readonly gfx: RenderHost,
    viewport: Viewport,
  ) {
    this.input = new PointerInput(gfx.canvas, viewport);
    // Preprod: its own save and every level open; production keeps the player's save and unlocks.
    this.preprod = isPreprodPath(window.location.pathname);
    setUnlockEverything(this.preprod);
    this.storage = this.preprod ? preprodStorage(browserStorage()) : browserStorage();
    this._save = loadSave(this.storage);
    backfillSpecimens(this._save); // v4 specimens: older saves get their archive from past deliveries
    this.audio.setMuted(this._save.muted);
    this.ctx = {
      pointer: this.input.state,
      assets: this.assets,
      audio: this.audio,
      upgrades: new Set(this._save.upgrades),
      tutorial: false,
      time: 0,
      reducedMotion: watchReducedMotion((r) => (this.ctx.reducedMotion = r)),
    };
    const layer = new Container();
    const cover = new Container();
    gfx.root.addChild(layer, cover);
    this.scenes = new SceneManager(this.input.state, () => this.ctx.reducedMotion, layer, cover, gfx.renderer.prepare ? viewUploader(gfx.renderer.prepare) : null);
    this.input.onAnyDown(() => this.audio.unlock());
  }

  get save(): SaveData {
    return this._save;
  }

  setSave(s: SaveData): void {
    this._save = s;
    this.ctx.upgrades = new Set(s.upgrades);
    this.audio.setMuted(s.muted);
    writeSave(this.storage, s);
  }

  toggleMute(): void {
    this.setSave({ ...this._save, muted: !this._save.muted });
  }

  resetProgress(): void {
    // v4 reset: through setSave, so preprod's store writes only its own key
    this.run = null;
    this.setSave(resetSave(this._save));
  }

  /** `?lang=fr|en` for testing: beats the saved choice until the player picks one. */
  private langOverride: string | null = null;

  setLanguage(lang: Lang): void {
    this.langOverride = null;
    this.setSave({ ...this._save, lang });
    this.applyLanguage();
  }

  private applyLanguage(): void {
    const nav = typeof navigator !== 'undefined' ? navigator.language : undefined;
    setLang(resolveLang(this._save.lang, nav, this.langOverride));
    document.title = tr().meta.docTitle;
    document.documentElement.lang = getLang();
  }

  // ---------------------------------------------------------------- boot

  boot(): void {
    const params = new URLSearchParams(window.location.search);
    if (TEST_FIXTURES) {
      if (params.get('reset') === '1') {
        clearSave(this.storage);
        this.setSave(loadSave(this.storage));
      }
      if (params.get('unlock') === '1') {
        this.setSave({ ...this._save, allUnlocked: true, glorbs: Math.max(this._save.glorbs, 999) });
      }
      this.installDebugHook();
    }
    this.langOverride = params.get('lang');
    this.applyLanguage();
    this.scenes.go(
      'loading',
      () => new LoadingScene(this.assets, () => {
        if (TEST_FIXTURES) this.routeFromParams(params);
        else this.toTitle();
      }, () => this.ctx.reducedMotion, this._save), // v4 story
      true,
    );
    startLoop(
      (dt) => this.frame(dt),
      (visible) => {
        if (visible) this.audio.resume();
        else {
          this.audio.suspend();
          this.input.forceRelease();
        }
      },
    );
  }

  private routeFromParams(params: URLSearchParams): void {
    const room = params.get('room');
    const flight = params.get('flight');
    const level = params.get('level');
    if (room && isRoomId(room)) {
      this.startRoom(room);
    } else if (flight && Number(flight) >= 1) {
      this.toFlight(clampLevel(Number(flight) - 1));
    } else if (level && Number(level) >= 1) {
      this.toMemo(clampLevel(Number(level) - 1));
    } else this.toTitle();
  }

  /** Debug hook switch: false skips drawing (scripts/capture fast-forward). */
  private drawing = true;

  /** Main-thread cost of the last 240 frames (debug hook / scripts/pixi/bench-frames.mjs). */
  private readonly frameMs = new Float32Array(240);
  private frameAt = 0;

  private frame(dt: number): void {
    const t0 = TEST_FIXTURES ? performance.now() : 0;
    this.input.beginFrame();
    this.ctx.time += dt;
    this.scenes.update(dt);
    if (this.drawing) {
      this.scenes.render();
      this.gfx.render();
    }
    if (TEST_FIXTURES) {
      this.frameMs[this.frameAt] = performance.now() - t0;
      this.frameAt = (this.frameAt + 1) % this.frameMs.length;
    }
  }

  // ---------------------------------------------------------------- navigation

  toTitle(): void {
    this.flight = null;
    this.scenes.go('title', () => new TitleScene(this));
  }

  toWorkOrders(): void {
    this.flight = null;
    this.scenes.go('workorders', () => new WorkOrdersScene(this));
  }

  toUpgrades(): void {
    this.scenes.go('upgrades', () => new UpgradesScene(this));
  }

  toTrophies(from: TrophyReturnTarget = 'title', view?: { preview: boolean; room: TrophyRoomTab }): void {
    this.scenes.go('trophies', () => new TrophiesScene(this, from, view), view !== undefined);
  }

  toMemo(levelIndex: number): void {
    const i = clampLevel(levelIndex);
    const finale = LEVELS[i]!.id === 'level12';
    const practice = finale ? () => this.practiceRecital(i) : i === FIELD_CHECK_INDEX ? () => this.toFieldCheck() : undefined;
    const replay = finale && this.save.levels.level12.delivered ? () => this.showDispatchFinale(() => this.toMemo(i)) : undefined;
    this.scenes.go('memo', () => new MemoScene(this, i, practice, replay));
  }

  private practiceRecital(i: number): void {
    const level = LEVELS[i]!;
    if (!isDeep(level)) return;
    const run = new DeepRun(level, i);
    const finish = () => this.toMemo(i);
    this.scenes.go('flight', () => new DeepFlightScene({ ctx: this.ctx, level, run, practice: true,
      onLocked: finish, onSunrise: finish, onQuit: finish }));
  }

  private showDispatchFinale(finish: () => void): void {
    this.scenes.go('dispatch-finale', () => {
      if (!this.save[FINALE_BEAT]) this.setSave({ ...this.save, [FINALE_BEAT]: true });
      return new DispatchFinale(this, finish);
    });
  }

  private toFieldCheck(): void {
    this.flight = null;
    this.run = null;
    this.scenes.go('field-check', () => new FieldCheckCard(this.ctx, 'memo', () => this.startFieldCheck(), () => this.leaveFieldCheck()));
  }

  private startFieldCheck(): void {
    const practice = new DeepRun(FIELD_CHECK, FIELD_CHECK_INDEX);
    this.scenes.go('flight', () => {
      this.ctx.tutorial = false;
      this.flight = new DeepFlightScene({
        ctx: this.ctx, level: FIELD_CHECK, run: practice, practice: true,
        onLocked: (target, entry) => {
          practice.startAbduct(target, entry);
          this.fieldCheckRoom(practice);
        },
        onSunrise: () => this.leaveFieldCheck(),
        onQuit: () => this.leaveFieldCheck(),
      });
      return this.flight;
    });
  }

  private fieldCheckRoom(practice: DeepRun): void {
    const { roomId } = practice.current!;
    this.scenes.go('abduct', () => {
      this.flight = null;
      const inner = createAbductScene(this.ctx, { levelId: 'level3', roomId, rules: FIELD_CHECK_RULES }, (result) => {
        if (practice.finishAbduct(result) === 'done') {
          this.markFieldCheckSeen();
          this.audio.sfx('checkpoint');
          this.scenes.go('field-check', () => new FieldCheckCard(this.ctx, 'done', () => this.leaveFieldCheck(), () => this.leaveFieldCheck()), false, { style: 'flash' });
        } else {
          this.scenes.go('field-check', () => new FieldCheckCard(this.ctx, 'retry', () => {
            practice.retry();
            this.fieldCheckRoom(practice);
          }, () => this.leaveFieldCheck()));
        }
      }, FIELD_CHECK_ROOM);
      return new FieldCheckAbduction(inner, this.ctx);
    });
  }

  private leaveFieldCheck(): void {
    this.flight = null;
    this.markFieldCheckSeen();
    this.toMemo(FIELD_CHECK_INDEX);
  }

  private markFieldCheckSeen(): void {
    if (!this.save.fieldCheckSeen) this.setSave({ ...this.save, fieldCheckSeen: true });
  }

  toFlight(levelIndex: number, spotted = 0): void {
    const i = clampLevel(levelIndex);
    const level = LEVELS[i]!;
    if (isDeep(level)) {
      // a deep level always starts a fresh shift
      this.run = new DeepRun(level, i);
      this.toDeepFlight(this.run);
      return;
    }
    this.run = null;
    this.scenes.go('flight', () => {
      this.ctx.tutorial = i === 0 && !this._save.levels.level1.delivered;
      let done = false;
      const scene = new FlightScene({
        ctx: this.ctx,
        level,
        spotted,
        onLocked: (r) => {
          if (done) return;
          done = true;
          // dive in: the iris closes on the saucer and opens from the beam emitter in the room
          const from = scene.screenFocus();
          const to = emitterPoint(r.roomId);
          this.toAbduct(i, r.roomId, r, { style: 'iris', x: from.x, y: from.y, toX: to.x, toY: to.y });
        },
        onQuit: () => {
          if (done) return;
          done = true;
          this.toWorkOrders();
        },
      });
      this.flight = scene;
      return scene;
    });
  }

  toAbduct(levelIndex: number, room: RoomId, flight: FlightResult, transition?: Transition): void {
    const i = clampLevel(levelIndex);
    const level = LEVELS[i]!;
    if (isDeep(level)) {
      // abort screen's "Retry room" on a deep route, or a debug jump: run it as a deep shift
      this.startRoom(room);
      return;
    }
    this.scenes.go(
      'abduct',
      () => {
        this.flight = null;
        this.ctx.tutorial = i === 0 && !this._save.levels.level1.delivered;
        let done = false;
        return createAbductScene(this.ctx, { levelId: level.id, roomId: room, rules: TUTORIAL_RULES }, (res) => {
          if (done) return;
          done = true;
          if (res.aborted) this.toAbortChoice(i, room, flight);
          // the specimen leaves in a flash of beam light, which carries over into the report
          else this.toReport(i, res, flight, true, res.delivered ? { style: 'flash' } : undefined);
        });
      },
      false,
      transition,
    );
  }

  toReport(levelIndex: number, abduct: AbductResult, flight: FlightResult, persist = true, transition?: Transition): void {
    const i = clampLevel(levelIndex);
    const outcome = applyRun(this._save, LEVELS[i]!.id, abduct, flight);
    if (persist) this.setSave(outcome.save);
    const practiceNext = persist && LEVELS[i]?.id === 'level2' && outcome.stars[0] && !outcome.save.fieldCheckSeen;
    this.scenes.go('report', () => new ReportScene(this, i, tutorialReport(i, abduct, flight, outcome), outcome,
      practiceNext ? () => this.toFieldCheck() : undefined), false, transition);
  }

  toAbortChoice(levelIndex: number, room: RoomId, flight: FlightResult): void {
    this.scenes.go('abort', () => new AbortScene(this, clampLevel(levelIndex), room, flight));
  }

  // ---------------------------------------------------------------- deep shifts (L3+)

  /** Jump straight into a room (?room=, debug). Deep routes get a fresh shift around them. */
  startRoom(room: RoomId): void {
    const li = levelIndexForRoom(room);
    const level = LEVELS[li]!;
    if (!isDeep(level)) {
      this.run = null;
      this.toAbduct(li, room, { roomId: room, timeSec: 0, spotted: 0 });
      return;
    }
    const slot = deepSlot(level, room)!;
    const run = new DeepRun(level, li);
    this.run = run;
    run.startAbduct(slot.target, slot.entry);
    this.toDeepAbduct(run);
  }

  toDeepFlight(run: DeepRun, transition?: Transition): void {
    const level = run.level;
    this.scenes.go(
      'flight',
      () => {
        this.ctx.tutorial = false;
        let done = false;
        const scene = new DeepFlightScene({
          ctx: this.ctx,
          level,
          run,
          onLocked: (target, entry) => {
            if (done) return;
            done = true;
            const room = run.startAbduct(target, entry);
            const from = scene.screenFocus();
            const to = emitterPoint(room);
            this.toDeepAbduct(run, { style: 'iris', x: from.x, y: from.y, toX: to.x, toY: to.y });
          },
          onQuotaMet: () => {
            if (done) return;
            done = true;
            this.toDeepReport(run, { style: 'flash' });
          },
          onSunrise: () => {
            if (done) return;
            done = true;
            // the sun comes up over everything
            this.toDeepReport(run, { style: level.id === 'level12' ? 'demolition' : level.id === 'level9' ? 'fade' : 'sunrise' });
          },
          onQuit: () => {
            if (done) return;
            done = true;
            this.run = null;
            this.toWorkOrders();
          },
        });
        this.flight = scene;
        return scene;
      },
      false,
      transition,
    );
  }

  toDeepAbduct(run: DeepRun, transition?: Transition): void {
    const cur = run.current!;
    const level: DeepLevelDef = run.level;
    this.scenes.go(
      'abduct',
      () => {
        this.flight = null;
        this.ctx.tutorial = false;
        let done = false;
        const inner = createAbductScene(this.ctx, { levelId: level.id, roomId: cur.roomId, rules: DEEP_RULES }, (res) => {
          if (done) return;
          done = true;
          const next = run.finishAbduct(res);
          if (next === 'done') this.toDeepReport(run, { style: 'flash' });
          else if (next === 'flight') {
            this.audio.sfx('checkpoint');
            this.toDeepFlight(run, { style: 'flash' });
          } else if (next === 'choice') this.toDeepChoice(run);
        });
        return new DeepAbductScene(inner, run, this.assets, () => this.ctx.reducedMotion, () => {
          if (done) return;
          done = true;
          this.toDeepReport(run, { style: level.id === 'level12' ? 'demolition' : level.id === 'level9' ? 'fade' : 'sunrise' });
        });
      },
      false,
      transition,
    );
  }

  toDeepChoice(run: DeepRun): void {
    this.scenes.go('choice', () =>
      new DeepChoiceScene(this, run, {
        retry: () => {
          run.retry();
          this.toDeepAbduct(run);
        },
        backToFlight: () => {
          run.backToFlight();
          this.toDeepFlight(run);
        },
        quit: () => {
          this.run = null;
          this.toWorkOrders();
        },
      }),
    );
  }

  toDeepReport(run: DeepRun, transition?: Transition): void {
    const outcome = applyDeepRun(this._save, run.level.id, run.summary());
    this.setSave(outcome.save);
    this.run = null;
    const finale = run.level.id === 'level12' && run.phase === 'done' && !this.save[FINALE_BEAT]
      ? () => this.showDispatchFinale(() => this.toWorkOrders()) : undefined;
    this.scenes.go('report', () => new ReportScene(this, run.levelIndex, deepReport(run, outcome), outcome, undefined, finale), false, transition);
  }

  // ---------------------------------------------------------------- debug

  private installDebugHook(): void {
    const game = this;
    const demoAbduct = (delivered: boolean): AbductResult => ({
      delivered,
      woke: !delivered,
      timeSec: 27.4,
      bonks: delivered ? 3 : 7,
      dignity: delivered ? 41 : 12,
      snores: 12,
      itemsStolen: delivered ? ['slipper'] : [],
      aborted: false,
    });
    window.__nightShift = {
      workOrders: LEVELS.map(({ id, kind }, i) => ({ id, kind, num: i + 1 })),
      get scene() {
        return game.scenes.name;
      },
      get transitioning() {
        return game.scenes.transitioning;
      },
      get save() {
        return game._save;
      },
      get lang() {
        return getLang();
      },
      get active() {
        return game.scenes.active;
      },
      get run() {
        return game.run;
      },
      get pointer() {
        return game.input.state;
      },
      capture() {
        return captureFrame() ?? '';
      },
      redraw() {
        game.scenes.render();
        game.gfx.render();
      },
      get drawing() {
        return game.drawing;
      },
      set drawing(on: boolean) {
        game.drawing = on;
      },
      get frameMs() {
        return game.frameMs;
      },
      get frameAt() {
        return game.frameAt;
      },
      get rebuilds() {
        return game.gfx.rebuilds;
      },
      get stage() {
        return game.gfx.stage;
      },
      goto(name: string, arg?: unknown) {
        const n = typeof arg === 'number' ? arg : Number(arg);
        const lvl = Number.isFinite(n) && n >= 1 ? clampLevel(n - 1) : 0;
        switch (name as SceneName) {
          case 'title':
            return game.toTitle();
          case 'workorders':
            return game.toWorkOrders();
          case 'upgrades':
            return game.toUpgrades();
          case 'trophies':
            return game.toTrophies(arg === 'workorders' ? 'workorders' : 'title');
          case 'memo':
            return game.toMemo(lvl);
          case 'flight':
            return game.toFlight(lvl);
          case 'abduct': {
            const room = typeof arg === 'string' && isRoomId(arg) ? arg : 'farm_window';
            return game.startRoom(room);
          }
          case 'report': {
            // arg: level number, or { level, abduct, flight, persist }
            if (arg && typeof arg === 'object') {
              const o = arg as { level?: number; abduct?: Partial<AbductResult>; flight?: Partial<FlightResult>; persist?: boolean };
              const li = clampLevel((o.level ?? 1) - 1);
              const room = firstRoom(li);
              const a = { ...demoAbduct(true), ...o.abduct };
              const f: FlightResult = { roomId: room, timeSec: 14.2, spotted: 1, ...o.flight };
              return game.toReport(li, a, f, o.persist ?? false);
            }
            const room = firstRoom(lvl);
            return game.toReport(lvl, demoAbduct(true), { roomId: room, timeSec: 14.2, spotted: 1 }, false);
          }
          case 'abort': {
            const room = firstRoom(lvl);
            return game.toAbortChoice(lvl, room, { roomId: room, timeSec: 10, spotted: 0 });
          }
          default:
            console.warn(`[night-shift] unknown scene "${name}"`);
        }
      },
    };
  }

  /** Exposed for the debug panel / tests. */
  levelUnlocked(i: number): boolean {
    return isLevelUnlocked(this._save, i);
  }
}
