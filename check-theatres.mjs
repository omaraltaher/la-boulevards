#!/usr/bin/env node
// Fetches named theatres near LA boulevards from OpenStreetMap (Overpass API),
// filters to within 0.3km of any boulevard, and writes theatres.json.
//
// Usage:  node check-theatres.mjs
// Output: theatres.json

import { writeFileSync, readFileSync } from 'fs';

const boulevards = JSON.parse(readFileSync('boulevards.json', 'utf8'));

function hav(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function nearestBlvd(lat, lon) {
  let best = null, bestDist = Infinity;
  for (const b of boulevards) {
    for (const seg of b.segs) {
      for (const [slat, slon] of seg) {
        const d = hav(lat, lon, slat, slon);
        if (d < bestDist) { bestDist = d; best = b; }
      }
    }
  }
  return { blvd: best, dist: bestDist };
}

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

const theatres = [];
for (const el of data.elements) {
  if (!el.tags?.name) continue;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) continue;

  const { blvd, dist } = nearestBlvd(lat, lon);
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
}

writeFileSync('theatres.json', JSON.stringify({ generated: new Date().toISOString(), theatres }, null, 2));
console.log(`${theatres.length} theatres written to theatres.json`);
