// Shared driving loops for the abduction clips: the in-page pilot through the real mouse,
// recording every frame (real time) or every Nth frame (a labelled time-lapse).

export const abductInfo = (cap) => cap.eval(() => {
  const ns = window.__nightShift;
  const d = ns.active && ns.active.debug;
  if (!d || !d.body) return { scene: ns.scene };
  const I = d.interior;
  return {
    scene: ns.scene, t: d.elapsed, x: d.body.chestX, y: d.body.chestY, bx: d.body.beamX, by: d.body.beamY,
    idx: d.pilot ? d.pilot.index : 0, delivered: d.delivered, failure: d.failure || null, complete: d.complete,
    exposure: I ? I.exposure : 0, watching: I ? !!I.watching : false,
    sleepers: I ? I.sleepers.map((s) => s.wake) : [], wake: d.wake.value, bonks: d.wake.bonks,
  };
});

/**
 * Run the pilot until `until(info)` is true. `speed(info)` returns 1 for real time or N for an
 * N x time-lapse (one frame recorded in N, badge shown). `caption(info)` builds the caption.
 * `onFrame(info, recorded)` may take stills. Returns the last info.
 */
export async function pilot(cap, { until, speed = () => 1, caption, onFrame, maxFrames = 60 * 150, pilotOn = () => true }) {
  let n = 0;
  let skipped = 0;
  let skipLabel = '';
  let skipShown = 0;
  let s = await abductInfo(cap);
  for (let i = 0; i < maxFrames; i++) {
    if (s.scene !== 'abduct' || until(s)) break;
    if (pilotOn(s)) await cap.abductPilot();
    const sp = speed(s);
    if (sp === 0) {
      // skip ahead: simulated every frame, nothing recorded; labelled on the next frames
      await cap.fastStep(1);
      skipped++;
      s = await abductInfo(cap);
      continue;
    }
    if (skipped > 0) { skipLabel = `skipped ${Math.round(skipped / 60)} s`; skipShown = 0; skipped = 0; }
    const k = Math.max(1, sp);
    const c = caption(s);
    if (k > 1) c.badge = `${k}× time-lapse`;
    else if (skipLabel && skipShown < 60) c.badge = skipLabel;
    if (k === 1 || n % k === k - 1) { await cap.frame(c, 1); skipShown++; if (onFrame) await onFrame(s, c); }
    else await cap.fastStep(1);
    n++;
    s = await abductInfo(cap);
  }
  return s;
}
