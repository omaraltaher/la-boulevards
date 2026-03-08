#!/usr/bin/env node
// Merges the fragmented 2-point OSM segments in boulevards.json into
// continuous polylines, dramatically reducing JSON structural overhead.
//
// Usage: node merge-segments.mjs

import { readFileSync, writeFileSync } from 'fs';

function key(pt) { return pt[0] + ',' + pt[1]; }

function mergeSegs(segs) {
  if (segs.length === 1) return segs;

  // Build adjacency: endpoint → list of segment indices
  const adj = new Map();
  const add = (pt, idx) => {
    const k = key(pt);
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k).push(idx);
  };
  segs.forEach((s, i) => { add(s[0], i); add(s[s.length - 1], i); });

  const used = new Uint8Array(segs.length);
  const chains = [];

  for (let start = 0; start < segs.length; start++) {
    if (used[start]) continue;
    used[start] = 1;

    // Grow a chain forward from the end of this segment
    let chain = [...segs[start]];

    let growing = true;
    while (growing) {
      growing = false;
      const tail = chain[chain.length - 1];
      for (const idx of (adj.get(key(tail)) || [])) {
        if (used[idx]) continue;
        const s = segs[idx];
        if (key(s[0]) === key(tail)) {
          chain.push(...s.slice(1));
        } else if (key(s[s.length - 1]) === key(tail)) {
          chain.push(...[...s].reverse().slice(1));
        } else continue;
        used[idx] = 1;
        growing = true;
        break;
      }
    }

    // Also grow backward from the head
    growing = true;
    while (growing) {
      growing = false;
      const head = chain[0];
      for (const idx of (adj.get(key(head)) || [])) {
        if (used[idx]) continue;
        const s = segs[idx];
        if (key(s[s.length - 1]) === key(head)) {
          chain = [...s.slice(0, -1), ...chain];
        } else if (key(s[0]) === key(head)) {
          chain = [...[...s].reverse().slice(0, -1), ...chain];
        } else continue;
        used[idx] = 1;
        growing = true;
        break;
      }
    }

    chains.push(chain);
  }

  return chains;
}

const data = JSON.parse(readFileSync('boulevards.json', 'utf8'));

let beforeSegs = 0, afterSegs = 0;
const out = data.map(b => {
  beforeSegs += b.segs.length;
  const merged = mergeSegs(b.segs);
  afterSegs += merged.length;
  return { ...b, segs: merged };
});

const json = JSON.stringify(out);
writeFileSync('boulevards.json', json);

console.log(`Segments: ${beforeSegs.toLocaleString()} → ${afterSegs.toLocaleString()} (${Math.round((1 - afterSegs/beforeSegs)*100)}% reduction)`);
console.log(`File size: ${Math.round(json.length / 1024)}KB`);
