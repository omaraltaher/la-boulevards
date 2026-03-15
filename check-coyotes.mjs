#!/usr/bin/env node
// Fetches coyote (Canis latrans) observations from iNaturalist and writes coyotes.json.
// - 30-day window, LA County bounding box, deduplicated by ~2km grid
//
// Usage:  node check-coyotes.mjs
// Output: coyotes.json

import { writeFileSync } from 'fs';

const TAXON_ID = 42051; // Canis latrans
const PER_PAGE = 200;

const today = new Date();
const d2 = today.toISOString().slice(0, 10);
const d1 = new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;

async function fetchPage(page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${TAXON_ID}` +
    `&quality_grade=research` +
    `&swlat=${SWLAT}&swlng=${SWLNG}&nelat=${NELAT}&nelng=${NELNG}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&d1=${d1}&d2=${d2}&photos=true`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

console.log(`Fetching coyote observations from iNaturalist (${d1} → ${d2})…`);
const first = await fetchPage(1);
const total = first.total_results;
const pages = Math.min(Math.ceil(total / PER_PAGE), 50);
console.log(`Total LA County observations: ${total} — fetching ${pages} pages`);

const all = [...first.results];
for (let p = 2; p <= pages; p++) {
  process.stdout.write(`  page ${p}/${pages}\r`);
  const d = await fetchPage(p);
  all.push(...d.results);
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');

const grid = new Map();
for (const obs of all) {
  if (!obs.location) continue;
  const [lat, lon] = obs.location.split(',').map(Number);
  const gridKey = `${Math.round(lat / 0.02)},${Math.round(lon / 0.02)}`;
  if (!grid.has(gridKey)) {
    const photo = obs.photos?.[0]?.url?.replace('/square.', '/small.') || null;
    grid.set(gridKey, {
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
      date: obs.observed_on || null,
      photo,
      url: obs.uri || `https://www.inaturalist.org/observations/${obs.id}`
    });
  }
}
const coyotes = [...grid.values()];
console.log(`${coyotes.length} unique locations (from ${all.length} observations)`);

writeFileSync('coyotes.json', JSON.stringify({ generated: new Date().toISOString(), coyotes }, null, 2));
console.log('Written to coyotes.json');
