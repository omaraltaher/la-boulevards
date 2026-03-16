#!/usr/bin/env node
// Fetches USGS Quaternary fault lines for the LA area and writes faults.json.
// Uses haz/Qfaults MapServer Layer 4. Paginates and groups segments by fault name
// so the map renders one multi-polyline per named fault (~150 faults vs 6,459 segments).
// Filters to faults intersecting LA County using Census TIGER boundary.
//
// Usage:  node check-faults.mjs
// Output: faults.json

import { writeFileSync } from 'fs';

const BASE =
  'https://earthquake.usgs.gov/arcgis/rest/services/haz/Qfaults/MapServer/4/query';
const BBOX   = '-119.2,33.60,-117.40,34.90';  // wider initial fetch, then LA County filter
const FIELDS = 'fault_name,class,slip_rate,slip_sense,age';
const PER_PAGE = 2000;

// ── Fetch LA County polygon from Census TIGER ──────────────────────
console.log('Fetching LA County boundary…');
const tigerRes = await fetch(
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/11/query' +
  '?where=COUNTY%3D%27037%27+AND+STATE%3D%2706%27&outFields=NAME&outSR=4326&f=geojson'
);
if (!tigerRes.ok) throw new Error(`Census TIGER error: ${tigerRes.status}`);
const tigerData = await tigerRes.json();
const laFeature = tigerData.features[0];
if (!laFeature) throw new Error('LA County boundary not found');

// Collect all rings from the (possibly multi-)polygon
const rings = [];
if (laFeature.geometry.type === 'Polygon') {
  rings.push(...laFeature.geometry.coordinates);
} else {
  // MultiPolygon
  for (const poly of laFeature.geometry.coordinates) rings.push(...poly);
}

// Ray-casting point-in-polygon (lon, lat)
function pointInPolygon(lon, lat) {
  for (const ring of rings) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

// ── Fetch USGS fault segments ──────────────────────────────────────
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

// ── Group by fault name, filter to LA County ───────────────────────
const map = new Map();
for (const f of allFeatures) {
  if (!f.geometry) continue;
  const p = f.properties;
  const name = p.fault_name || 'Unnamed fault';
  // Swap GeoJSON [lon, lat] → [lat, lon] for Leaflet
  const coords = f.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  // Keep only segments with at least one point inside LA County
  const inLA = f.geometry.coordinates.some(([lon, lat]) => pointInPolygon(lon, lat));
  if (!inLA) continue;

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
console.log(`${faults.length} named faults in LA County (grouped from ${allFeatures.length} raw segments)`);

writeFileSync('faults.json', JSON.stringify({ generated: new Date().toISOString(), faults }, null, 2));
console.log('Written to faults.json');
