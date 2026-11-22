import type { AbductResult, FlightResult, RoomId } from '../contracts';
import { createAbductScene } from '../abduct';
import { SynthAudio } from '../audio/sfx';
import { FlightScene } from '../flight/scene';
import { LEVELS, isRoomId, levelIndexForRoom } from '../levels/levels';
import { applyRun, isLevelUnlocked } from '../levels/progress';
import { clearSave, loadSave, writeSave, type KeyValueStore, type SaveData } from '../levels/save';
import { AbortScene } from '../ui/abort';
import { LoadingScene } from '../ui/loading';
import { MemoScene } from '../ui/memo';
import { ReportScene } from '../ui/report';
import { TitleScene } from '../ui/title';
import { UpgradesScene } from '../ui/upgrades';
import { WorkOrdersScene } from '../ui/workorders';
import { AssetLoader } from './assets';
import type { CanvasHost } from './canvas';
import { PointerInput } from './input';
import { startLoop } from './loop';
import { SceneManager } from './scenes';
import type { MutableContext, Shell } from './shell';
import { browserStorage, watchReducedMotion } from './storage';

export type SceneName =
  | 'loading'
  | 'title'
  | 'workorders'
  | 'upgrades'
  | 'memo'
  | 'flight'
  | 'abduct'
  | 'report'
  | 'abort';

export interface DebugHook {
  readonly scene: string;
  readonly save: SaveData;
  goto(name: string, arg?: unknown): void;
}

declare global {
  interface Window {
    __nightShift?: DebugHook;
  }
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
  private _save: SaveData;
  /** Live flight scene (for debug/tests). */
  flight: FlightScene | null = null;

  constructor(private readonly host: CanvasHost) {
    this.input = new PointerInput(host.canvas, host.viewport);
    this.storage = browserStorage();
    this._save = loadSave(this.storage);
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
    this.scenes = new SceneManager(this.input.state);
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
    if (!this._save.muted) this.audio.sfx('click');
  }

  // ---------------------------------------------------------------- boot

  boot(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      clearSave(this.storage);
      this._save = loadSave(this.storage);
      this.setSave(this._save);
    }
    if (params.get('unlock') === '1') {
      this.setSave({ ...this._save, allUnlocked: true, glorbs: Math.max(this._save.glorbs, 999) });
    }
    this.installDebugHook();
    this.scenes.go(
      'loading',
      () => new LoadingScene(this.assets, () => this.routeFromParams(params), () => this.ctx.reducedMotion),
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
      this.toAbduct(levelIndexForRoom(room), room, { roomId: room, timeSec: 0, spotted: 0 });
    } else if (flight && Number(flight) >= 1) {
      this.toFlight(clampLevel(Number(flight) - 1));
    } else if (level && Number(level) >= 1) {
      this.toMemo(clampLevel(Number(level) - 1));
    } else this.toTitle();
  }

  private frame(dt: number): void {
    this.input.beginFrame();
    this.ctx.time += dt;
    this.scenes.update(dt);
    const g = this.host.g;
    this.host.begin();
    this.scenes.render(g);
    this.host.end();
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

  toMemo(levelIndex: number): void {
    const i = clampLevel(levelIndex);
    this.scenes.go('memo', () => new MemoScene(this, i));
  }

  toFlight(levelIndex: number, spotted = 0): void {
    const i = clampLevel(levelIndex);
    const level = LEVELS[i]!;
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
          this.toAbduct(i, r.roomId, r);
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

  toAbduct(levelIndex: number, room: RoomId, flight: FlightResult): void {
    const i = clampLevel(levelIndex);
    const level = LEVELS[i]!;
    this.scenes.go('abduct', () => {
      this.flight = null;
      this.ctx.tutorial = i === 0 && !this._save.levels.level1.delivered;
      let done = false;
      return createAbductScene(this.ctx, { levelId: level.id, roomId: room }, (res) => {
        if (done) return;
        done = true;
        if (res.aborted) this.toAbortChoice(i, room, flight);
        else this.toReport(i, res, flight);
      });
    });
  }

  toReport(levelIndex: number, abduct: AbductResult, flight: FlightResult, persist = true): void {
    const i = clampLevel(levelIndex);
    const outcome = applyRun(this._save, LEVELS[i]!.id, abduct, flight);
    if (persist) this.setSave(outcome.save);
    this.scenes.go('report', () => new ReportScene(this, i, abduct, flight, outcome));
  }

  toAbortChoice(levelIndex: number, room: RoomId, flight: FlightResult): void {
    this.scenes.go('abort', () => new AbortScene(this, clampLevel(levelIndex), room, flight));
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
      get scene() {
        return game.scenes.name;
      },
      get save() {
        return game._save;
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
          case 'memo':
            return game.toMemo(lvl);
          case 'flight':
            return game.toFlight(lvl);
          case 'abduct': {
            const room = typeof arg === 'string' && isRoomId(arg) ? arg : 'farm_window';
            return game.toAbduct(levelIndexForRoom(room), room, { roomId: room, timeSec: 0, spotted: 0 });
          }
          case 'report': {
            // arg: level number, or { level, abduct, flight, persist }
            if (arg && typeof arg === 'object') {
              const o = arg as { level?: number; abduct?: Partial<AbductResult>; flight?: Partial<FlightResult>; persist?: boolean };
              const li = clampLevel((o.level ?? 1) - 1);
              const room = LEVELS[li]!.map.entries[0].roomId;
              const a = { ...demoAbduct(true), ...o.abduct };
              const f: FlightResult = { roomId: room, timeSec: 14.2, spotted: 1, ...o.flight };
              return game.toReport(li, a, f, o.persist ?? false);
            }
            const room = LEVELS[lvl]!.map.entries[0].roomId;
            return game.toReport(lvl, demoAbduct(true), { roomId: room, timeSec: 14.2, spotted: 1 }, false);
          }
          case 'abort': {
            const room = LEVELS[lvl]!.map.entries[0].roomId;
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
