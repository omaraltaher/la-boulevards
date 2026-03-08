#!/usr/bin/env node
// Enriches wells.json with nearest Mapillary street-level photo per well.
//
// Usage:  MAPILLARY_TOKEN=xxx node check-well-photos.mjs
// Output: updates wells.json in place (adds/updates "photo" field per well)

import { readFileSync, writeFileSync } from 'fs';

const TOKEN = process.env.MAPILLARY_TOKEN;
if (!TOKEN) {
  console.error('Set MAPILLARY_TOKEN env var (get one free at mapillary.com → Dashboard → Access Tokens)');
  process.exit(1);
}

const RADIUS_M  = 150;  // search radius in metres
const DELAY_MS  = 120;  // polite delay between requests

const { generated, wells } = JSON.parse(readFileSync('wells.json', 'utf8'));
console.log(`Looking up Mapillary photos for ${wells.length} wells…`);

let found = 0;
for (let i = 0; i < wells.length; i++) {
  const w = wells[i];
  process.stdout.write(`  ${i + 1}/${wells.length}  (${found} photos found so far)\r`);

  try {
    const d = 0.0015; // ~150m in degrees
    const bbox = `${w.lon-d},${w.lat-d},${w.lon+d},${w.lat+d}`;
    const url = `https://graph.mapillary.com/images` +
      `?access_token=${TOKEN}` +
      `&fields=id,thumb_256_url` +
      `&bbox=${bbox}` +
      `&limit=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) { w.photo = w.photo ?? null; continue; }
    const { data } = await res.json();
    if (data && data.length > 0) {
      w.photo = data[0].id;   // store ID only; CDN URLs are IP-signed and expire
      found++;
    } else {
      w.photo = null;
    }
  } catch {
    w.photo = w.photo ?? null;
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

process.stdout.write('\n');
console.log(`${found}/${wells.length} wells have a nearby Mapillary photo`);
writeFileSync('wells.json', JSON.stringify({ generated, wells }, null, 2));
console.log('wells.json updated');
