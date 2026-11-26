// Firefox does not always expose cancelAndHoldAtTime. Keep the value of the in-flight
// linear ramp so a second fade starts at the same gain even on that fallback.
export class GainRamp {
  private from: number;
  private to: number;
  private start = 0;
  private end = 0;

  constructor(private readonly gain: AudioParam, initial: number) {
    this.from = this.to = gain.value = initial;
  }

  fadeTo(target: number, now: number, seconds: number): void {
    const progress = now >= this.end ? 1 : Math.max(0, (now - this.start) / (this.end - this.start));
    const value = this.from + (this.to - this.from) * progress;
    if (this.gain.cancelAndHoldAtTime) this.gain.cancelAndHoldAtTime(now);
    else this.gain.cancelScheduledValues(now);
    this.gain.setValueAtTime(value, now);
    this.gain.linearRampToValueAtTime(target, now + seconds);
    this.from = value;
    this.to = target;
    this.start = now;
    this.end = now + seconds;
  }
}
