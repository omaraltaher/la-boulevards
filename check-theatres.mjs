#!/usr/bin/env node
// Fetches named theatres near LA boulevards from OpenStreetMap (Overpass API),
// filters to within 0.3km of any boulevard, and writes theatres.json.
//
// Usage:  node check-theatres.mjs
// Output: theatres.json

import { writeFileSync } from 'fs';
import { loadBoulevards, nearestBlvd } from './geo-utils.mjs';

const boulevards = loadBoulevards();
const THRESHOLD_KM = 0.3;
const query =
  '[out:json][timeout:30];' +
  '(node["amenity"="theatre"](33.6,-118.9,34.8,-117.6);' +
  'way["amenity"="theatre"](33.6,-118.9,34.8,-117.6););' +
  'out center;';

console.log('Fetching theatres from Overpass API…');
const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
if (!res.ok) { console.error('Overpass error:', res.status); process.exit(1); }
const data = await res.json();

// Comedy clubs not yet in OSM — ensure they're always included
const COMEDY_CLUBS = [
  { name: 'Laugh Factory',    lat: 34.09819, lon: -118.36445, address: '8001 Sunset Blvd' },
  { name: 'Hollywood Improv', lat: 34.08342, lon: -118.36728, address: '8162 Melrose Ave' },
];

const theatres = [];
const seen = new Set();

for (const el of data.elements) {
  if (!el.tags?.name) continue;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) continue;

  const { blvd, dist } = nearestBlvd(boulevards, lat, lon);
  if (dist > THRESHOLD_KM) continue;

  theatres.push({
    name: el.tags.name,
    lat, lon,
    blvd: blvd.name,
    wikipedia: el.tags.wikipedia || null,
    website: el.tags.website || el.tags['contact:website'] || null,
    address: [el.tags['addr:housenumber'], el.tags['addr:street']].filter(Boolean).join(' ')
             || el.tags['addr:full'] || null
  });
  seen.add(el.tags.name);
}

for (const club of COMEDY_CLUBS) {
  if (seen.has(club.name)) continue; // already found in OSM
  const { blvd, dist } = nearestBlvd(boulevards, club.lat, club.lon);
  if (dist > THRESHOLD_KM) { console.warn(`${club.name} too far from any boulevard (${dist.toFixed(2)}km)`); continue; }
  theatres.push({ name: club.name, lat: club.lat, lon: club.lon, blvd: blvd.name,
                  wikipedia: null, website: null, address: club.address });
  console.log(`Added hardcoded comedy club: ${club.name} → ${blvd.name}`);
}

writeFileSync('theatres.json', JSON.stringify({ generated: new Date().toISOString(), theatres }, null, 2));
console.log(`${theatres.length} theatres written to theatres.json`);
