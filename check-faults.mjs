#!/usr/bin/env node
// Fetches USGS Quaternary fault lines for the LA area and writes faults.json.
// Uses haz/Qfaults MapServer Layer 4. Paginates and groups segments by fault name
// so the map renders one multi-polyline per named fault (~150 faults vs 6,459 segments).
//
// Usage:  node check-faults.mjs
// Output: faults.json

import { writeFileSync } from 'fs';

const BASE =
  'https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/4/query';
const BBOX   = '-118.95,33.70,-117.65,34.82';
const FIELDS = 'fault_name,class,slip_rate,slip_sense,age';
const PER_PAGE = 2000;

async function fetchPage(offset) {
  const url = `${BASE}?where=1%3D1` +
    `&geometry=${encodeURIComponent(BBOX)}` +
    `&geometryType=esriGeometryEnvelope` +
    `&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326` +
    `&f=geojson&outFields=${FIELDS}&returnGeometry=true` +
    `&resultRecordCount=${PER_PAGE}&resultOffset=${offset}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
  return res.json();
}

console.log('Fetching USGS fault lines for LA area…');
const allFeatures = [];
let offset = 0;
while (true) {
  process.stdout.write(`  offset ${offset}…\r`);
  const page = await fetchPage(offset);
  allFeatures.push(...page.features);
  if (!page.features.length || allFeatures.length >= page.exceededTransferLimit === false && page.features.length < PER_PAGE) break;
  if (!page.exceededTransferLimit) break;
  offset += PER_PAGE;
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');
console.log(`${allFeatures.length} raw segments fetched`);

// Group segments by fault name, merging all coords into one entry
const map = new Map();
for (const f of allFeatures) {
  if (!f.geometry) continue;
  const p = f.properties;
  const name = p.fault_name || 'Unnamed fault';
  // Swap GeoJSON [lon, lat] → [lat, lon] for Leaflet
  const coords = f.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  if (!map.has(name)) {
    map.set(name, {
      name,
      fclass:    p.class      || null,
      sliprate:  p.slip_rate  || null,
      slipsense: p.slip_sense || null,
      age:       p.age        || null,
      segments:  []
    });
  }
  map.get(name).segments.push(coords);
}

const faults = [...map.values()];
console.log(`${faults.length} named faults (grouped from ${allFeatures.length} segments)`);

writeFileSync('faults.json', JSON.stringify({ generated: new Date().toISOString(), faults }, null, 2));
console.log('Written to faults.json');
