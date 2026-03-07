#!/usr/bin/env node
// Checks which Caltrans D7 cameras are actually live (not "Temporarily Unavailable")
// and writes cameras-live.json for the map to load at startup.
//
// Usage:  node check-cameras.mjs
// Output: cameras-live.json  (commit and push to update the map)

import { writeFileSync } from 'fs';

const TU_THRESHOLD = 18_000; // bytes — TU placeholders cluster at ~16,554–16,579 bytes

console.log('Fetching Caltrans D7 camera list…');
const res = await fetch('https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json');
const data = await res.json();
const cams = (data.data || []).map(i => i.cctv || i);

const liveUrls = [];
let checked = 0;

process.stdout.write('Probing images');
for (const cam of cams) {
  if (cam.inService !== 'true') continue;
  const url = cam.imageData?.static?.currentImageURL;
  if (!url) continue;
  try {
    const r = await fetch(url, { method: 'HEAD' });
    const size = parseInt(r.headers.get('content-length') || '0');
    if (size > TU_THRESHOLD) liveUrls.push(url);
  } catch (e) { /* unreachable — skip */ }
  if (++checked % 10 === 0) process.stdout.write('.');
}
process.stdout.write('\n');

writeFileSync('cameras-live.json', JSON.stringify({
  generated: new Date().toISOString(),
  urls: liveUrls
}));

console.log(`${liveUrls.length} live / ${checked} inService cameras. Written to cameras-live.json`);
