#!/usr/bin/env node
// Fetches iconic CA native plant observations from iNaturalist near LA boulevards.
// Species: California Poppy, Toyon, Ceanothus (blue blossom).
// No quality_grade filter — planted/ornamental specimens are valid.
// LA County bounding box. 0.02° grid dedup per species.
//
// Usage:  node check-nativeplants.mjs
// Output: nativeplants.json → { generated, plants: [{ lat, lon, species, date, photo, url }] }

import { writeFileSync } from 'fs';

const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;
const PER_PAGE = 200;

const SPECIES = [
  { taxonId: 48225,  name: 'California Poppy' },
  { taxonId: 53405,  name: 'Toyon'             },
  { taxonId: 49674,  name: 'Ceanothus'         },
];

async function fetchPage(taxonId, page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${taxonId}` +
    `&swlat=${SWLAT}&swlng=${SWLNG}&nelat=${NELAT}&nelng=${NELNG}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&photos=true`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

const plants = [];
for (const sp of SPECIES) {
  console.log(`Fetching ${sp.name} (taxon ${sp.taxonId})…`);
  let first;
  try {
    first = await fetchPage(sp.taxonId, 1);
  } catch (e) {
    console.warn(`  Failed: ${e.message}`);
    continue;
  }
  const total = first.total_results;
  const pages = Math.min(Math.ceil(total / PER_PAGE), 30);
  console.log(`  ${total} observations — fetching ${pages} pages`);

  const all = [...first.results];
  for (let p = 2; p <= pages; p++) {
    process.stdout.write(`  page ${p}/${pages}\r`);
    const d = await fetchPage(sp.taxonId, p);
    all.push(...d.results);
    await new Promise(r => setTimeout(r, 300));
  }
  if (pages > 1) process.stdout.write('\n');

  const grid = new Map();
  for (const obs of all) {
    if (!obs.location) continue;
    const [lat, lon] = obs.location.split(',').map(Number);
    const gridKey = `${Math.round(lat / 0.02)},${Math.round(lon / 0.02)}`;
    if (!grid.has(gridKey)) {
      const photo = obs.photos?.[0]?.url?.replace('/square.', '/small.') || null;
      grid.set(gridKey, {
        lat:     Math.round(lat * 1e4) / 1e4,
        lon:     Math.round(lon * 1e4) / 1e4,
        species: sp.name,
        date:    obs.observed_on || null,
        photo,
        url:     obs.uri || `https://www.inaturalist.org/observations/${obs.id}`,
      });
    }
  }
  const pts = [...grid.values()];
  console.log(`  → ${pts.length} unique ${sp.name} locations`);
  plants.push(...pts);
}

console.log(`Total: ${plants.length} native plant locations`);
writeFileSync('nativeplants.json', JSON.stringify({ generated: new Date().toISOString(), plants }, null, 2));
console.log('Written to nativeplants.json');
