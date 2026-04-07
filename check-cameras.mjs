#!/usr/bin/env node
// Checks which Caltrans D7 cameras are actually live (not "Temporarily Unavailable")
// and writes cameras-live.json for the map to load at startup.
//
// Usage:  node check-cameras.mjs
// Output: cameras-live.json  (commit and push to update the map)

import { writeFileSync } from 'fs';

const TU_THRESHOLD   = 18_000; // bytes — TU placeholders cluster at ~16,554–16,579 bytes
const HEAD_TIMEOUT   = 6_000;  // ms per image probe
const CONCURRENCY    = 25;     // parallel HEAD requests

// ── Fetch camera list ──────────────────────────────────────────
console.log('Fetching Caltrans D7 camera list…');
const listCtrl = new AbortController();
setTimeout(() => listCtrl.abort(), 15_000);
const res  = await fetch('https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json', { signal: listCtrl.signal });
const data = await res.json();
const cams = (data.data || []).map(i => i.cctv || i);

const candidates = cams
  .filter(c => c.inService === 'true' && c.imageData?.static?.currentImageURL)
  .map(c => c.imageData.static.currentImageURL);

console.log(`${candidates.length} in-service cameras to probe…`);

// ── Parallel HEAD probing with concurrency limit ───────────────
async function probeUrl(url) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), HEAD_TIMEOUT);
  try {
    const r    = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    const size = parseInt(r.headers.get('content-length') || '0');
    return size > TU_THRESHOLD ? url : null;
  } catch {
    return null;
  }
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

process.stdout.write('Probing');
let done = 0;
const probeResults = await mapConcurrent(candidates, CONCURRENCY, async url => {
  const result = await probeUrl(url);
  if (++done % 20 === 0) process.stdout.write('.');
  return result;
});
process.stdout.write('\n');

const liveUrls = probeResults.filter(Boolean);

writeFileSync('cameras-live.json', JSON.stringify({
  generated: new Date().toISOString(),
  urls: liveUrls
}));

console.log(`${liveUrls.length} live / ${candidates.length} in-service cameras. Written to cameras-live.json`);
