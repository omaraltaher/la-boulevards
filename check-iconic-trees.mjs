#!/usr/bin/env node
// Fetches iconic tree observations from iNaturalist: jacaranda, coral tree, Washington palm.
// Drops quality_grade filter — ornamental/planted trees aren't documented as research-grade.
// LA County bounding box. 0.02° grid dedup per species.
//
// Usage:  node check-iconic-trees.mjs
// Output: iconic-trees.json → { generated, trees: [{ lat, lon, species, date, photo, url }] }

import { writeFileSync } from 'fs';

const SWLAT = 33.70, SWLNG = -118.95, NELAT = 34.82, NELNG = -117.65;
const PER_PAGE = 200;

// taxon IDs verified via iNaturalist taxa API
// Erythrina afra = Coast Coral Tree (iNat synonym for E. caffra, LA's official city tree)
// Washingtonia genus covers both W. robusta (Mexican fan palm) + W. filifera (CA fan palm)
const SPECIES = [
  { key: 'jacaranda', taxonId: 77541,   name: 'Jacaranda'       },
  { key: 'coral',     taxonId: 1588191, name: 'Coral Tree'      },
  { key: 'palm',      taxonId: 50185,   name: 'Washington Palm' },
];

async function fetchPage(taxonId, page) {
  const url = `https://api.inaturalist.org/v1/observations` +
    `?taxon_id=${taxonId}` +
    `&swlat=${SWLAT}&swlng=${SWLNG}&nelat=${NELAT}&nelng=${NELNG}` +
    `&per_page=${PER_PAGE}&page=${page}&order=desc&order_by=observed_on` +
    `&photos=true`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`iNaturalist API error: ${res.status}`);
  return res.json();
}

const trees = [];
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
  const pages = Math.min(Math.ceil(total / PER_PAGE), 50);
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
  console.log(`  → ${pts.length} unique ${sp.name} locations (from ${all.length} observations)`);
  trees.push(...pts);
}

console.log(`Total: ${trees.length} iconic tree locations`);
writeFileSync('iconic-trees.json', JSON.stringify({ generated: new Date().toISOString(), trees }, null, 2));
console.log('Written to iconic-trees.json');
