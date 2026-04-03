#!/usr/bin/env node
// Fetches butterfly (Papilionoidea) observations from iNaturalist near LA boulevards.
// 90-day window, LA County bounding box, research-grade, deduped by ~2km grid per species.
//
// Usage:  node check-butterflies.mjs
// Output: butterflies.json → { generated, butterflies: [{ lat, lon, species, date, photo, url }] }

import { writeFileSync } from 'fs';

const TAXON_ID = 47157;   // Papilionoidea — true butterflies
const PER_PAGE = 200;
const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;

const today = new Date();
const d2 = today.toISOString().slice(0, 10);
const d1 = new Date(today - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function fetchPage(page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${TAXON_ID}` +
    `&quality_grade=research` +
    `&swlat=${SWLAT}&swlng=${SWLNG}&nelat=${NELAT}&nelng=${NELNG}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&d1=${d1}&d2=${d2}&photos=true`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

console.log(`Fetching butterfly observations (${d1} → ${d2})…`);
const first = await fetchPage(1);
const total = first.total_results;
const pages = Math.min(Math.ceil(total / PER_PAGE), 50);
console.log(`Total: ${total} — fetching ${pages} pages`);

const all = [...first.results];
for (let p = 2; p <= pages; p++) {
  process.stdout.write(`  page ${p}/${pages}\r`);
  const d = await fetchPage(p);
  all.push(...d.results);
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');

// Deduplicate by ~2km grid, keeping best photo per cell (prefer named species)
const grid = new Map();
for (const obs of all) {
  if (!obs.location) continue;
  const [lat, lon] = obs.location.split(',').map(Number);
  const species = obs.taxon?.preferred_common_name || obs.taxon?.name || 'Butterfly';
  const gridKey = `${Math.round(lat / 0.02)},${Math.round(lon / 0.02)}`;
  if (!grid.has(gridKey)) {
    const photo = obs.photos?.[0]?.url?.replace('/square.', '/small.') || null;
    grid.set(gridKey, {
      lat:     Math.round(lat * 1e4) / 1e4,
      lon:     Math.round(lon * 1e4) / 1e4,
      species,
      date:    obs.observed_on || null,
      photo,
      url:     obs.uri || `https://www.inaturalist.org/observations/${obs.id}`,
    });
  }
}

const butterflies = [...grid.values()];
console.log(`${butterflies.length} unique locations (from ${all.length} observations)`);
writeFileSync('butterflies.json', JSON.stringify({ generated: new Date().toISOString(), butterflies }, null, 2));
console.log('Written to butterflies.json');
