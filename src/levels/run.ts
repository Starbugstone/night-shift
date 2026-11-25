// The deep-level runner (L3+): one shift, three specimens, one sunrise clock.
// DOM-free; src/core/game.ts drives the scenes from it.
//
//   flight ──lock on ring──▶ abduct ──delivered──▶ flight (respawn at that ring = checkpoint)
//     ▲  │                     │ └─delivered #3──▶ done
//     │  └─spotted: freeze,    └─failed/aborted──▶ choice ──retry──▶ abduct (same route)
//     │    respawn at checkpoint                        └─back──▶ flight (at that ring)
//     └─────────────────────────────────────────────────────────────┘
//   any phase with the clock running ──elapsed ≥ budget──▶ sunrise (level failed)
import type { AbductFailReason, AbductResult, RoomId, Vec2 } from '../contracts';
import { ROOMS } from '../abduct/rooms';
import { MapCollectible } from '../flight/collectible';
import { crestValleyClock } from '../flight/time-car';
import { troopTallies, type TroopTally } from '../flight/roam';
import { specimenForTarget, type DeepSummary, type SpecimenFind, type TrophyFind } from './progress';
import type { DeepLevelDef } from './types';


export type RunPhase = 'flight' | 'abduct' | 'choice' | 'done' | 'sunrise';

/** The sky starts warming this many seconds before sunrise. */
export const SUNRISE_WARN = 30;

export interface RunFail {
  target: number;
  entry: number;
  roomId: RoomId;
  /** undefined = the player gave up (aborted). */
  reason?: AbductFailReason;
  by?: string;
}

export interface RunTotals {
  bonks: number;
  snores: number;
  items: string[];
  /** v4 items & recap humour: the route of each delivered specimen, in delivery order. */
  rooms: RoomId[];
  /** Sum of dignity over delivered specimens. */
  dignity: number;
  beamSec: number;
}

export class DeepRun {
  phase: RunPhase = 'flight';
  /** Shift seconds used (flight + abduction). */
  elapsed = 0;
  readonly delivered: boolean[];
  /** Order specimens were delivered in. */
  readonly order: number[] = [];
  /** Where a spotted saucer respawns: last successful ring, or the start. */
  checkpoint: Vec2;
  /** Where the next flight leg starts. */
  spawn: Vec2;
  spotted = 0;
  failedAbductions = 0;
  aborts = 0;
  /** Abduction in progress or just failed. */
  current: { target: number; entry: number; roomId: RoomId } | null = null;
  lastFail: RunFail | null = null;
  /** v4 trophy room: each souvenir taken home this shift, with the route it came from. */
  readonly trophies: TrophyFind[] = [];
  /** v4 specimens: each specimen delivered this shift, with its route (if abducted indoors). */
  readonly specimens: SpecimenFind[] = [];
  readonly totals: RunTotals = { bonks: 0, snores: 0, items: [], rooms: [], dignity: 0, beamSec: 0 };
  /** Flight legs started (for Zib's lines). */
  legs = 0;
  /** v3 report: ID photo of the last delivered specimen (else the first attempt's). */
  photo: AbductResult['photo'];
  /** v3 report (L6): Form 7-B readings of the delivered specimens. */
  readonly probeReadings: string[] = [];

  readonly troops: (TroopTally | undefined)[];
  readonly collectible: MapCollectible | null;

  constructor(
    readonly level: DeepLevelDef,
    readonly levelIndex: number,
  ) {
    this.delivered = level.map.targets.map(() => false);
    this.troops = troopTallies(level.map.targets);
    this.collectible = level.map.collectible ? new MapCollectible(level.map.collectible) : null;
    this.checkpoint = { ...level.map.start };
    this.spawn = { ...level.map.start };
  }

  get budget(): number {
    return this.level.budgetSec;
  }

  get remaining(): number {
    return Math.max(0, this.level.budgetSec - this.elapsed);
  }

  get deliveredCount(): number {
    return this.delivered.filter(Boolean).length;
  }

  /** 0 = night, 1 = sunrise; ramps over the last SUNRISE_WARN seconds. */
  get dawn(): number {
    return this.level.id === 'level9' ? 0 : this.deadlineWarning;
  }

  get deadlineWarning(): number {
    const r = this.remaining;
    return r >= SUNRISE_WARN ? 0 : 1 - r / SUNRISE_WARN;
  }

  /** Clock face time, e.g. { h: 3, m: 17 } on a 2:00 → 6:00 shift. */
  clock(): { h: number; m: number } {
    if (this.level.id === 'level9') {
      const seconds = crestValleyClock(this.elapsed);
      return { h: Math.floor(seconds / 3600) % 12, m: Math.floor(seconds / 60) % 60 };
    }
    const [h0, h1] = this.level.hours;
    const k = Math.min(1, this.elapsed / this.level.budgetSec);
    const mins = Math.floor((h0 + (h1 - h0) * k) * 60);
    return { h: Math.floor(mins / 60), m: mins % 60 };
  }

  clockText(locale = 'en'): string {
    if (this.level.id === 'level9') {
      const seconds = crestValleyClock(this.elapsed);
      const hour = locale === 'fr' ? 22 : 10;
      const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
      return `${hour}:${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
    if (this.level.id === 'level8') {
      const sec = Math.ceil(this.remaining);
      return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }
    const { h, m } = this.clock();
    return `${h}:${m < 10 ? '0' : ''}${m}`;
  }

  /** Advance the sunrise clock (flight and abduction). Returns true when the sun comes up. */
  tick(dt: number): boolean {
    if (this.phase !== 'flight' && this.phase !== 'abduct') return false;
    this.elapsed = Math.min(this.level.budgetSec, this.elapsed + dt);
    this.collectible?.timeCar?.advance(this.elapsed);
    if (this.elapsed >= this.level.budgetSec) {
      this.elapsed = this.level.budgetSec;
      this.phase = 'sunrise';
      return true;
    }
    return false;
  }

  /** Spotted in flight: respawn at the checkpoint. */
  onSpotted(): Vec2 {
    this.spotted++;
    this.spawn = { ...this.checkpoint };
    return this.spawn;
  }

  startAbduct(target: number, entry: number): RoomId {
    const roomId = this.level.map.targets[target]!.entries[entry]!.roomId;
    this.current = { target, entry, roomId };
    this.phase = 'abduct';
    return roomId;
  }

  ringPos(target: number, entry: number): Vec2 {
    const e = this.level.map.targets[target]!.entries[entry]!;
    return { x: e.x, y: e.y };
  }

  /** The flight sim has added this witness to the shared troop tally. */
  finishPickup(target: number, pos: Vec2): void {
    if (this.phase !== 'flight') return;
    this.checkpoint = { ...pos };
    this.spawn = { ...pos };
    if (this.troops[target]?.full && !this.delivered[target]) {
      this.delivered[target] = true;
      this.order.push(target);
      const id = specimenForTarget(this.level.map.targets[target]!);
      if (id) this.specimens.push({ id }); // v4 specimens
      if (this.deliveredCount === this.delivered.length) this.phase = 'done';
    }
  }

  get specimenCount(): number {
    return this.delivered.reduce((n, done, i) => n + (this.troops[i]?.caught.size ?? Number(done)), 0);
  }

  /** The abduction ended. Returns the next phase. */
  finishAbduct(res: AbductResult): RunPhase {
    if (this.phase === 'sunrise') return this.phase;
    const cur = this.current;
    if (!cur) return this.phase;
    this.totals.bonks += res.bonks;
    this.totals.snores += res.snores;
    this.totals.beamSec += res.timeSec;
    if (res.photo && (res.delivered || !this.photo)) this.photo = res.photo;
    if (res.delivered && !res.aborted) {
      this.delivered[cur.target] = true;
      this.order.push(cur.target);
      this.totals.dignity += res.dignity;
      this.totals.items.push(...res.itemsStolen);
      this.totals.rooms.push(cur.roomId);
      for (const item of res.itemsStolen) this.trophies.push({ item, room: cur.roomId }); // v4 trophy room
      const human = ROOMS[cur.roomId]?.human;
      if (human) this.specimens.push({ id: human, room: cur.roomId }); // v4 specimens
      if (res.probeReadings) this.probeReadings.push(...res.probeReadings);
      this.checkpoint = this.ringPos(cur.target, cur.entry);
      this.spawn = { ...this.checkpoint };
      this.lastFail = null;
      this.current = null;
      this.phase = this.deliveredCount >= this.delivered.length ? 'done' : 'flight';
      if (this.phase === 'flight') this.legs++;
      return this.phase;
    }
    if (res.aborted) this.aborts++;
    else this.failedAbductions++;
    this.lastFail = { target: cur.target, entry: cur.entry, roomId: cur.roomId, reason: res.aborted ? undefined : res.failReason ?? 'woke', by: res.failBy };
    this.phase = 'choice';
    return this.phase;
  }

  /** Choice: retry the same route. */
  retry(): RoomId {
    const f = this.lastFail!;
    return this.startAbduct(f.target, f.entry);
  }

  /** Choice: back to flight, hovering over the building you just failed. */
  backToFlight(): Vec2 {
    const f = this.lastFail;
    this.spawn = f ? this.ringPos(f.target, f.entry) : { ...this.checkpoint };
    this.current = null;
    this.phase = 'flight';
    this.legs++;
    return this.spawn;
  }

  summary(): DeepSummary {
    const mapCollectible = this.collectible?.collectedId;
    return {
      trophies: [...this.trophies],
      specimens: [...this.specimens],
      delivered: this.deliveredCount,
      elapsedSec: this.elapsed,
      spotted: this.spotted,
      failedAbductions: this.failedAbductions,
      sunrise: this.phase === 'sunrise',
      ...(mapCollectible ? { mapCollectible } : {}),
    };
  }
}
