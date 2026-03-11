#!/usr/bin/env node
// Fetches mountain lion (Puma concolor) observations from iNaturalist and writes lions.json.
// - lions: past 90 days, LA County bounding box (general sightings layer)
// - p22:   all-time, Griffith Park bounding box (P-22 tribute sightings)
//
// Usage:  node check-lions.mjs
// Output: lions.json

import { writeFileSync } from 'fs';

const TAXON_ID = 42007; // Puma concolor
const PER_PAGE = 200;

// Date range: past 90 days
const today = new Date();
const d2 = today.toISOString().slice(0, 10);
const d1 = new Date(today - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// LA County bounding box
const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;

// Griffith Park bounding box (P-22 territory)
const GP_SWLAT = 34.085, GP_SWLNG = -118.325, GP_NELAT = 34.145, GP_NELNG = -118.265;

async function fetchPage(swlat, swlng, nelat, nelng, page, extraParams = '') {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${TAXON_ID}` +
    `&quality_grade=research,needs_id` +
    `&swlat=${swlat}&swlng=${swlng}&nelat=${nelat}&nelng=${nelng}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    extraParams;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

// ── LA County 90-day sightings ─────────────────────────────────
console.log(`Fetching mountain lion observations from iNaturalist (${d1} → ${d2})…`);
const first = await fetchPage(SWLAT, SWLNG, NELAT, NELNG, 1, `&d1=${d1}&d2=${d2}&photos=true`);
const total = first.total_results;
const pages = Math.min(Math.ceil(total / PER_PAGE), 50);
console.log(`Total LA County observations: ${total} — fetching ${pages} pages`);

const all = [...first.results];
for (let p = 2; p <= pages; p++) {
  process.stdout.write(`  page ${p}/${pages}\r`);
  const d = await fetchPage(SWLAT, SWLNG, NELAT, NELNG, p, `&d1=${d1}&d2=${d2}&photos=true`);
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
console.log(`${lions.length} unique locations (from ${all.length} observations)`);

// ── P-22 all-time Griffith Park sightings ──────────────────────
console.log('Fetching P-22 all-time Griffith Park observations…');
const gpFirst = await fetchPage(GP_SWLAT, GP_SWLNG, GP_NELAT, GP_NELNG, 1);
const gpTotal = gpFirst.total_results;
const gpPages = Math.min(Math.ceil(gpTotal / PER_PAGE), 10);
console.log(`Total Griffith Park observations: ${gpTotal} — fetching ${gpPages} pages`);

const gpAll = [...gpFirst.results];
for (let p = 2; p <= gpPages; p++) {
  const d = await fetchPage(GP_SWLAT, GP_SWLNG, GP_NELAT, GP_NELNG, p);
  gpAll.push(...d.results);
  await new Promise(r => setTimeout(r, 300));
}

// Keep all individual sightings (no deduplication) sorted by date ascending
const p22 = gpAll
  .filter(obs => obs.location)
  .map(obs => {
    const [lat, lon] = obs.location.split(',').map(Number);
    const photo = obs.photos?.[0]?.url?.replace('/square.', '/small.') || null;
    return {
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
      date: obs.observed_on || null,
      photo,
      url: obs.uri || `https://www.inaturalist.org/observations/${obs.id}`
    };
  })
  .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

console.log(`${p22.length} P-22 Griffith Park sightings`);

writeFileSync('lions.json', JSON.stringify({ generated: new Date().toISOString(), lions, p22 }, null, 2));
console.log('Written to lions.json');
