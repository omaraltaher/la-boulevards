#!/usr/bin/env node
// Fetches research-grade parrot observations from the Free-Flying Los Angeles
// Parrot Project on iNaturalist, deduplicates by ~500m grid, and writes parrots.json.
//
// Usage:  node check-parrots.mjs
// Output: parrots.json

import { writeFileSync } from 'fs';

const PROJECT_SLUG = 'free-flying-los-angeles-parrot-project';
const PER_PAGE = 200;

// Date range: past 30 days as of now
const today = new Date();
const d2 = today.toISOString().slice(0, 10);
const d1 = new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Species → display name + color
const SPECIES = {
  'Amazona viridigenalis': { name: 'Red-crowned Parrot',        color: '#ef4444' },
  'Amazona finschi':       { name: 'Lilac-crowned Parrot',      color: '#a855f7' },
  'Brotogeris chiriri':    { name: 'Yellow-chevroned Parakeet', color: '#eab308' },
  'Psittacara mitratus':   { name: 'Mitred Parakeet',           color: '#f97316' },
  'Nandayus nenday':       { name: 'Nanday Parakeet',           color: '#14b8a6' },
  'Aratinga nenday':       { name: 'Nanday Parakeet',           color: '#14b8a6' },
  'Myiopsitta monachus':   { name: 'Monk Parakeet',             color: '#84cc16' },
};
const DEFAULT = { name: 'Wild Parrot', color: '#22c55e' };

async function fetchPage(page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?project_id=${PROJECT_SLUG}&quality_grade=research` +
    `&d1=${d1}&d2=${d2}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&photos=true`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

console.log(`Fetching parrot observations from iNaturalist (${d1} → ${d2})…`);
const first = await fetchPage(1);
const total = first.total_results;
const pages = Math.min(Math.ceil(total / PER_PAGE), 50); // cap at 10,000 obs
console.log(`Total research-grade observations: ${total} — fetching ${pages} pages`);

const all = [...first.results];
for (let p = 2; p <= pages; p++) {
  process.stdout.write(`  page ${p}/${pages}\r`);
  const d = await fetchPage(p);
  all.push(...d.results);
  await new Promise(r => setTimeout(r, 300)); // be polite to the API
}
process.stdout.write('\n');

// Deduplicate by 0.005° grid (~500m) — keep most recent per cell
const grid = new Map();
for (const obs of all) {
  if (!obs.location) continue;
  const [lat, lon] = obs.location.split(',').map(Number);
  const gridKey = `${Math.round(lat / 0.02)},${Math.round(lon / 0.02)}`;
  if (!grid.has(gridKey)) {
    const sciName = obs.taxon?.name || '';
    const sp = SPECIES[sciName] || DEFAULT;
    const photo = obs.photos?.[0]?.url?.replace('/square.', '/small.') || null;
    grid.set(gridKey, {
      species: sp.name,
      lat: Math.round(lat * 1e4) / 1e4,
      lon: Math.round(lon * 1e4) / 1e4,
      date: obs.observed_on || null,
      photo,
      url: obs.uri || `https://www.inaturalist.org/observations/${obs.id}`
    });
  }
}

const parrots = [...grid.values()];
writeFileSync('parrots.json', JSON.stringify({ generated: new Date().toISOString(), parrots }, null, 2));
console.log(`${parrots.length} unique locations written to parrots.json (from ${all.length} observations)`);
