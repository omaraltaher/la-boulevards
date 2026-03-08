#!/usr/bin/env node
// Applies Douglas-Peucker simplification to boulevards.json segments
// and rounds coordinates to 5 decimal places (~1m precision).
// Run once; re-run fetch-boulevards.mjs to regenerate from scratch.
//
// Usage: node simplify-boulevards.mjs [tolerance]
// Default tolerance: 0.0001 degrees (~11m) — invisible at map zoom levels

import { readFileSync, writeFileSync } from 'fs';

const TOLERANCE = parseFloat(process.argv[2] ?? '0.0001');

function perpDist([px, py], [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}

function simplify(pts, tol) {
  if (pts.length <= 2) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > tol) {
    const L = simplify(pts.slice(0, idx + 1), tol);
    const R = simplify(pts.slice(idx), tol);
    return [...L.slice(0, -1), ...R];
  }
  return [pts[0], pts[pts.length - 1]];
}

const data = JSON.parse(readFileSync('boulevards.json', 'utf8'));
let before = 0, after = 0;

const out = data.map(b => ({
  ...b,
  segs: b.segs.map(seg => {
    before += seg.length;
    const s = simplify(seg, TOLERANCE).map(([a, b]) => [
      Math.round(a * 1e5) / 1e5,
      Math.round(b * 1e5) / 1e5
    ]);
    after += s.length;
    return s;
  })
}));

writeFileSync('boulevards.json', JSON.stringify(out));
console.log(`Tolerance: ${TOLERANCE}°  |  Points: ${before.toLocaleString()} → ${after.toLocaleString()} (${Math.round((1 - after/before)*100)}% reduction)`);
