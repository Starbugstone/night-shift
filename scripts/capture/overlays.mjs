// Overlays and readouts for the abduction clips. Each function runs in the page (registered with
// cap.define) and draws in logical 540x960 screen units; world = screen + sim.camera.
// Everything is read from the live simulation, so what is drawn is what collides this frame.

export const ABDUCT_ANN = {
  /** Walls (generated 14 px slabs) and the openings cut into them. */
  walls(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera; const b = d.interior.building;
    g.translate(-cam.x, -cam.y);
    for (const w of b.walls) S.rect(g, w, 'rgba(184,169,255,0.95)', 1.5, 'rgba(184,169,255,0.35)');
    for (const o of b.openings) {
      g.beginPath();
      if (o.axis === 'vertical') { g.moveTo(o.at + 7, o.from); g.lineTo(o.at + 7, o.to); }
      else { g.moveTo(o.from, o.at + 7); g.lineTo(o.to, o.at + 7); }
      S.stroke(g, S.C.mint, 6, [10, 6]); g.stroke(); g.setLineDash([]);
      const mx = o.axis === 'vertical' ? o.at + 7 : (o.from + o.to) / 2;
      const my = o.axis === 'vertical' ? (o.from + o.to) / 2 : o.at + 7;
      S.label(g, o.trim, mx, my, S.C.mint, 13);
    }
  },
  /** Room rectangles and their names. */
  rooms(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    for (const r of d.interior.building.rooms) {
      S.rect(g, r, 'rgba(255,255,255,0.35)', 1);
      S.label(g, r.name, r.x + r.w / 2, r.y + 40, 'rgba(255,255,255,0.85)', 13);
    }
  },
  /** Backdrop tiles: one 540 px bitmap per tile, every other column mirrored, plus the floor strip. */
  tiles(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    for (const r of d.interior.building.rooms) {
      const floor = r.y + r.h - 14;
      const base = floor - 32;
      for (let x = r.x, col = 0; x < r.x + r.w; x += 540, col++) {
        g.beginPath(); g.moveTo(x, r.y); g.lineTo(x, base); S.stroke(g, S.C.amber, 2, [12, 8]); g.stroke(); g.setLineDash([]);
        S.label(g, col % 2 ? 'tile ↔ mirrored' : 'tile', Math.min(x + 270, (x + r.x + r.w) / 2 + 135), r.y + 70, S.C.amber, 12);
      }
      g.fillStyle = 'rgba(255,194,77,0.18)'; g.fillRect(r.x, base, r.w, 46);
      S.stroke(g, S.C.amber, 1.5); g.strokeRect(r.x, base, r.w, 46);
      S.label(g, 'floor strip', r.x + 90, base + 23, S.C.amber, 11);
    }
  },
  /** Every solid the body collides with this frame (furniture, hazards), skipping walls. */
  solids(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    const nWalls = d.interior.building.walls.length;
    for (let i = nWalls; i < d.solids.length; i++) {
      const s = d.solids[i];
      const hot = d.body.touched && d.body.touched[i];
      S.solid(g, s, hot ? S.C.red : S.C.amber, 2, hot ? 'rgba(255,77,109,0.25)' : 'rgba(255,194,77,0.12)');
    }
  },
  /** The ragdoll's 21 contact circles, its bones, and the beam spring. */
  body(g, S) {
    const d = S.dbg(); if (!d || !d.body) return;
    const cam = d.camera; const b = d.body;
    g.translate(-cam.x, -cam.y);
    for (const [a, c] of S.BONES) { g.beginPath(); g.moveTo(b.x[a], b.y[a]); g.lineTo(b.x[c], b.y[c]); S.stroke(g, S.C.white, 2.5); g.stroke(); }
    for (const [x, y, r] of S.bodyCircles(b)) S.circle(g, x, y, r, 'rgba(124,255,203,0.95)', 1.5, 'rgba(124,255,203,0.10)');
    for (let i = 0; i < 11; i++) S.dot(g, b.x[i], b.y[i], 3.5, S.C.white);
    // beam spring: chest -> beam point
    g.beginPath(); g.moveTo(b.chestX, b.chestY); g.lineTo(b.beamX, b.beamY); S.stroke(g, S.C.blue, 3, [5, 4]); g.stroke(); g.setLineDash([]);
    S.circle(g, b.beamX, b.beamY, 9, S.C.blue, 3, 'rgba(111,195,255,0.35)');
    S.label(g, 'beam', b.beamX + 34, b.beamY - 14, S.C.blue, 12);
    S.dot(g, b.chestX, b.chestY, 5, S.C.mint);
    if (b.gripActive) S.label(g, 'GRIP', b.x[b.gripJoint], b.y[b.gripJoint] - 18, S.C.red, 13);
  },
  /** The finger on screen (pointer), so relative drag is visible. */
  finger(g, S) {
    const p = S.ns().pointer;
    if (!p.down) return;
    S.circle(g, p.x, p.y, 15, S.C.white, 3, 'rgba(255,255,255,0.22)');
    S.label(g, 'finger', p.x, p.y + 30, S.C.white, 12);
  },
  /** Pilot checkpoints and the one it is heading for. */
  route(g, S) {
    const d = S.dbg(); if (!d || !d.room || !d.room.interior) return;
    const cam = d.camera; const cps = d.room.interior.checkpoints; const idx = d.pilot ? d.pilot.index : 0;
    g.translate(-cam.x, -cam.y);
    g.beginPath();
    cps.forEach((c, i) => (i ? g.lineTo(c.x, c.y) : g.moveTo(c.x, c.y)));
    S.stroke(g, 'rgba(124,255,203,0.75)', 2.5, [8, 6]); g.stroke(); g.setLineDash([]);
    cps.forEach((c, i) => {
      S.circle(g, c.x, c.y, i === idx ? 9 : 6, i === idx ? S.C.white : S.C.mint, 2, i < idx ? 'rgba(124,255,203,0.6)' : null);
      if (c.cross) S.label(g, 'wait for: ' + c.cross, c.x, c.y - 22, S.C.amber, 12);
    });
  },
  /** Camera cones: the wall-clipped polygon, and which body circles it touches. */
  cones(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    for (const h of d.interior.hazards) {
      if (!h.cone) continue;
      h.cone.update(h.angle);
      const pts = h.cone.points; const n = h.cone.count;
      g.beginPath();
      for (let i = 0; i < n; i++) (i ? g.lineTo(pts[2 * i], pts[2 * i + 1]) : g.moveTo(pts[0], pts[1]));
      g.closePath();
      const hot = h.detecting;
      g.fillStyle = hot ? 'rgba(255,77,109,0.22)' : 'rgba(255,194,77,0.10)'; g.fill();
      S.stroke(g, hot ? S.C.red : S.C.amber, 2.5); g.stroke();
      for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(pts[0], pts[1]); g.lineTo(pts[2 * i], pts[2 * i + 1]); S.stroke(g, 'rgba(255,194,77,0.18)', 1); g.stroke(); }
      // which of the 21 body circles are inside the polygon this frame
      const inside = (x, y, r) => {
        let ins = false; let ax = pts[2 * n - 2], ay = pts[2 * n - 1];
        for (let i = 0; i < n; i++) {
          const bx = pts[2 * i], by = pts[2 * i + 1]; const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
          if (l2 > 0) { const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); const ox = x - ax - t * dx, oy = y - ay - t * dy; if (ox * ox + oy * oy <= r * r) return true; }
          if ((ay > y) !== (by > y) && x < ax + dx * (y - ay) / dy) ins = !ins;
          ax = bx; ay = by;
        }
        return ins;
      };
      for (const [x, y, r] of S.bodyCircles(d.body)) if (inside(x, y, r)) S.circle(g, x, y, r, S.C.red, 3, 'rgba(255,77,109,0.45)');
    }
  },
  /** Sleepers: hearing radius (noise falls off linearly to zero at its edge). */
  sleepers(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    for (const s of d.interior.sleepers) {
      const k = s.wake / 100;
      S.circle(g, s.x, s.y, s.spec.radius, k > 0.6 ? S.C.red : S.C.amber, 2, `rgba(255,194,77,${0.05 + 0.12 * s.pulse})`, [10, 8]);
      S.circle(g, s.x, s.y, s.spec.radius * 0.5, 'rgba(255,194,77,0.5)', 1, null, [4, 8]);
      S.label(g, `${s.spec.name}: hears ${s.spec.radius} px`, s.x, s.y - s.spec.radius + 22, S.C.amber, 13);
      S.label(g, `${s.spec.name} ${s.wake.toFixed(0)}/100`, s.x, s.y - 70, k > 0.6 ? S.C.red : S.C.white, 14);
      const b = d.body; const dist = Math.hypot(b.chestX - s.x, b.chestY - s.y);
      if (dist < s.spec.radius * 1.4) {
        g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(b.chestX, b.chestY); S.stroke(g, 'rgba(255,255,255,0.5)', 1.5, [4, 6]); g.stroke(); g.setLineDash([]);
        S.label(g, `falloff ${(Math.max(0, 1 - dist / s.spec.radius)).toFixed(2)}`, (s.x + b.chestX) / 2, (s.y + b.chestY) / 2, S.C.white, 12);
      }
    }
  },
  /** Timed hazards: lasers / gates / pops with their phase. */
  timers(g, S) {
    const d = S.dbg(); if (!d || !d.interior) return;
    const cam = d.camera;
    g.translate(-cam.x, -cam.y);
    for (const h of d.interior.hazards) {
      const sp = h.spec;
      if (sp.kind !== 'laser' && sp.kind !== 'gate' && sp.kind !== 'pop') continue;
      const c = sp.cycle; const p = ((d.elapsed + c.phase) % c.period);
      const a = sp.area;
      const live = sp.kind === 'laser' ? h.level === 1 : h.level > 0;
      const col = live ? S.C.red : h.tell ? S.C.amber : S.C.mint;
      S.rect(g, a, col, 2.5, null);
      const left = sp.kind === 'laser' ? (p < c.open ? c.open - p : 0) : (p < c.open ? c.open - p : c.period - p);
      const msg = sp.kind === 'laser'
        ? (live ? `${sp.name}: FIRING ${(c.period - p).toFixed(1)} s` : h.tell ? `${sp.name}: CHARGING` : `${sp.name}: off, fires in ${left.toFixed(1)} s`)
        : (p < c.open ? `${sp.name}: open ${left.toFixed(1)} s` : `${sp.name}: shut ${left.toFixed(1)} s`);
      S.label(g, msg, a.x + a.w / 2, a.y + Math.min(a.h, 400) / 2 + (a.h > a.w ? 0 : 30), col, 13);
    }
  },
};

export const ABDUCT_RO = {
  /** Generic abduction readout. */
  abduct(S, st) {
    const d = S.dbg(); if (!d || !d.body) return [];
    const b = d.body; const I = d.interior;
    const room = I ? (I.building.rooms.find((r) => b.chestX >= r.x && b.chestX <= r.x + r.w && b.chestY >= r.y && b.chestY <= r.y + r.h) || {}).name : '';
    const lines = [
      `t ${d.elapsed.toFixed(2).padStart(6)} s   room: ${room || '—'}`,
      `beam (${b.beamX.toFixed(0)}, ${b.beamY.toFixed(0)})  chest (${b.chestX.toFixed(0)}, ${b.chestY.toFixed(0)})`,
      `camera (${d.camera.x.toFixed(0)}, ${d.camera.y.toFixed(0)})  bonks ${d.wake.bonks}`,
    ];
    if (st.wake !== false) lines.push(`${d.wake.value > 60 ? '!' : ''}${d.subjectName} wake ${S.bar(d.wake.value / 100, 14)} ${d.wake.value.toFixed(0)}`);
    if (I && st.sleepers !== false) for (const s of I.sleepers) lines.push(`${s.wake > 60 ? '!' : s.wake > 0 ? '~' : ''}${s.spec.name.padEnd(d.subjectName.length)} wake ${S.bar(s.wake / 100, 14)} ${s.wake.toFixed(0)}`);
    if (I && st.camera) lines.push(`${I.watching ? '!' : I.exposure > 0 ? '~' : ''}camera fuse ${S.bar(I.exposure, 14)} ${I.exposure.toFixed(2)} s`);
    if (d.failure) lines.push(`!FAILED: ${d.failure.reason} (${d.failure.by})`);
    else if (d.delivered) lines.push('delivered, still asleep');
    return lines;
  },
};
