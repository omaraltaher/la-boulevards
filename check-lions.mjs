#!/usr/bin/env node
// Fetches mountain lion (Puma concolor) observations from iNaturalist
// in the LA County area (all-time, research + needs_id) and writes lions.json.
//
// Usage:  node check-lions.mjs
// Output: lions.json

import { writeFileSync } from 'fs';

const TAXON_ID = 42007; // Puma concolor
const PER_PAGE = 200;

// LA County bounding box
const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;

async function fetchPage(page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${TAXON_ID}` +
    `&quality_grade=research,needs_id` +
    `&swlat=${SWLAT}&swlng=${SWLNG}&nelat=${NELAT}&nelng=${NELNG}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&photos=true`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

console.log('Fetching mountain lion observations from iNaturalist…');
const first = await fetchPage(1);
const total = first.total_results;
const pages = Math.min(Math.ceil(total / PER_PAGE), 50);
console.log(`Total observations: ${total} — fetching ${pages} pages`);

const all = [...first.results];
for (let p = 2; p <= pages; p++) {
  process.stdout.write(`  page ${p}/${pages}\r`);
  const d = await fetchPage(p);
  all.push(...d.results);
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');

// Deduplicate by ~2km grid — keep most recent per cell
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

const lions = [...grid.values()];
writeFileSync('lions.json', JSON.stringify({ generated: new Date().toISOString(), lions }, null, 2));
console.log(`${lions.length} unique locations written to lions.json (from ${all.length} observations)`);
