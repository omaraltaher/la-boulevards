#!/usr/bin/env node
// Counts trees within 80m of each boulevard from multiple sources:
//   1. StreetsLA tree inventory (ArcGIS, LA City)
//   2. Beverly Hills tree inventory (ArcGIS, BH GeoHub)
//   3. Santa Monica tree inventory (Socrata)
//   4. OSM fallback (Overpass, for corridors with 0 trees from above)
//
// Usage:  node check-canopy.mjs
// Output: canopy.json → { generated, canopy: { "Wilshire Boulevard": { count, topSpecies }, ... } }

import { writeFileSync } from 'fs';
import { loadBoulevards, hav } from './geo-utils.mjs';

const boulevards = loadBoulevards();
const THRESHOLD_KM = 0.08; // 80m

// ── Data source endpoints ────────────────────────────────────────────────────

// StreetsLA: discovered at runtime from ArcGIS item API
const ITEM_ID = '266c6255b1fc4ae8b8f100d8696e1fa4';

// Beverly Hills Open Data — tree inventory layer (MapServer/1)
const BH_BASE = 'https://gis.beverlyhills.org/arcgis/rest/services/OD/OpenData_BeverlyHillsGeoHub/MapServer/1/query';

// Santa Monica — Socrata tree inventory
const SM_RESOURCE = 'https://data.smgov.net/resource/w8ue-6cnd.json';

// OSM Overpass
const OVERPASS = 'https://overpass-api.de/api/interpreter';

// ── Discover StreetsLA service URL ───────────────────────────────────────────

console.log('Discovering tree inventory service URL from ArcGIS…');
const itemRes = await fetch(
  `https://www.arcgis.com/sharing/rest/content/items/${ITEM_ID}?f=json`,
  { headers: { Accept: 'application/json' } }
);
if (!itemRes.ok) throw new Error(`ArcGIS item API error: ${itemRes.status}`);
const itemData = await itemRes.json();
const serviceUrl = itemData.url;
if (!serviceUrl) throw new Error(`No service URL in item response: ${JSON.stringify(itemData).slice(0, 300)}`);
console.log(`Service URL: ${serviceUrl}`);

// ArcGIS FeatureServer query endpoint — always use layer 0
const BASE = serviceUrl.replace(/\/$/, '').replace(/\/\d+$/, '') + '/0/query';

// ── Shared skip list for junk species values ─────────────────────────────────
const SKIP = new Set(['NOT SPECIFIED', 'DEAD TREE', 'PALM (DEAD)', 'STUMP', 'VACANT SITE', 'REMOVED', 'UNKNOWN']);

function titleCase(s) {
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// ── Helper: query any ArcGIS FeatureServer ────────────────────────────────────
// speciesField: 'TOOLTIP' (StreetsLA, parse with regex) or 'COMMON' (BH, use directly)
async function queryArcGIS(base, geom, blvdPts, speciesField) {
  const outFields = speciesField === 'TOOLTIP' ? 'TOOLTIP' : 'COMMON,BOTANICAL';
  const url = `${base}?where=1%3D1` +
    `&geometry=${encodeURIComponent(JSON.stringify(geom))}` +
    `&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects` +
    `&outFields=${outFields}&returnGeometry=true&outSR=4326&resultRecordCount=5000&f=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const features = data.features || [];

    const near = features.filter(f => {
      const { x: lon, y: lat } = f.geometry || {};
      if (!lat || !lon) return false;
      return blvdPts.some(([slat, slon]) => hav(lat, lon, slat, slon) <= THRESHOLD_KM);
    });

    const specCounts = {};
    for (const f of near) {
      let sp = 'UNKNOWN';
      if (speciesField === 'TOOLTIP') {
        const tooltip = f.attributes?.TOOLTIP || '';
        const match = tooltip.match(/Species:\s*([^\n\\]+)/);
        sp = match ? match[1].trim().toUpperCase() : 'UNKNOWN';
      } else {
        // BH: COMMON field (may be null, fall back to BOTANICAL)
        const raw = f.attributes?.COMMON || f.attributes?.BOTANICAL || '';
        sp = raw.trim().toUpperCase() || 'UNKNOWN';
      }
      if (SKIP.has(sp) || sp === 'UNKNOWN') continue;
      const spTitled = titleCase(sp);
      specCounts[spTitled] = (specCounts[spTitled] || 0) + 1;
    }

    return { near, specCounts };
  } catch (e) {
    // Graceful degradation — return empty result so other sources can contribute
    return { near: [], specCounts: {} };
  }
}

// ── Helper: query Santa Monica Socrata tree inventory ────────────────────────
async function querySmTrees(bbox, blvdPts) {
  const { s: minLat, n: maxLat, w: minLon, e: maxLon } = bbox;
  const where = `latitude between ${minLat} and ${maxLat} AND longitude between ${minLon} and ${maxLon}`;
  const url = `${SM_RESOURCE}?$where=${encodeURIComponent(where)}&$limit=5000`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    const near = [];
    const specCounts = {};
    for (const row of rows) {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);
      if (isNaN(lat) || isNaN(lon)) continue;
      if (!blvdPts.some(([slat, slon]) => hav(lat, lon, slat, slon) <= THRESHOLD_KM)) continue;
      near.push(row);
      const raw = (row.common_name || row.species || '').trim().toUpperCase() || 'UNKNOWN';
      const sp = raw || 'UNKNOWN';
      if (SKIP.has(sp)) continue;
      const spTitled = titleCase(sp);
      specCounts[spTitled] = (specCounts[spTitled] || 0) + 1;
    }
    return { near, specCounts };
  } catch (e) {
    return { near: [], specCounts: {} };
  }
}

// ── Helper: OSM Overpass fallback ─────────────────────────────────────────────
async function queryOsmTrees(bbox, blvdPts) {
  const { s, w, n, e } = bbox;
  const query = `[out:json][timeout:30];\nnode["natural"="tree"](${s},${w},${n},${e});\nout body;`;
  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const elements = data.elements || [];

    const near = [];
    const specCounts = {};
    for (const el of elements) {
      const lat = el.lat, lon = el.lon;
      if (!lat || !lon) continue;
      if (!blvdPts.some(([slat, slon]) => hav(lat, lon, slat, slon) <= THRESHOLD_KM)) continue;
      near.push(el);
      const tags = el.tags || {};
      const raw = (tags['species:en'] || tags.species || tags.name || '').trim().toUpperCase() || 'UNKNOWN';
      if (SKIP.has(raw) || raw === 'UNKNOWN') continue;
      const spTitled = titleCase(raw);
      specCounts[spTitled] = (specCounts[spTitled] || 0) + 1;
    }
    return { near, specCounts };
  } catch (e) {
    return { near: [], specCounts: {} };
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

const canopy = {};
let totalTrees = 0;

for (let i = 0; i < boulevards.length; i++) {
  const blvd = boulevards[i];
  process.stdout.write(`  ${i + 1}/${boulevards.length}: ${blvd.name}                    \r`);

  // Compute bounding box for this boulevard
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const seg of blvd.segs) {
    for (const [lat, lon] of seg) {
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
    }
  }
  const bufDeg = 0.001;
  const bbox = { s: minLat - bufDeg, n: maxLat + bufDeg, w: minLon - bufDeg, e: maxLon + bufDeg };
  const geom = {
    xmin: bbox.w, ymin: bbox.s,
    xmax: bbox.e, ymax: bbox.n,
    spatialReference: { wkid: 4326 }
  };

  // Pre-flatten boulevard points for distance checks
  const blvdPts = blvd.segs.flatMap(seg => seg);

  // Run StreetsLA + Beverly Hills in parallel, then Santa Monica
  const [laResult, bhResult] = await Promise.all([
    queryArcGIS(BASE, geom, blvdPts, 'TOOLTIP'),
    queryArcGIS(BH_BASE, geom, blvdPts, 'COMMON'),
  ]);
  const smResult = await querySmTrees(bbox, blvdPts);

  // Merge species counts from all three sources
  const specCounts = {};
  for (const r of [laResult, bhResult, smResult]) {
    for (const [sp, n] of Object.entries(r.specCounts)) {
      specCounts[sp] = (specCounts[sp] || 0) + n;
    }
  }
  let totalNear = laResult.near.length + bhResult.near.length + smResult.near.length;

  // OSM fallback only if still empty after all three sources
  if (totalNear === 0) {
    const osmResult = await queryOsmTrees(bbox, blvdPts);
    for (const [sp, n] of Object.entries(osmResult.specCounts)) {
      specCounts[sp] = (specCounts[sp] || 0) + n;
    }
    totalNear += osmResult.near.length;
    if (osmResult.near.length > 0) {
      await new Promise(r => setTimeout(r, 200)); // extra Overpass courtesy delay
    }
  }

  if (!totalNear) {
    await new Promise(r => setTimeout(r, 150));
    continue;
  }

  const topSpecies = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  canopy[blvd.name] = { count: totalNear, topSpecies };
  totalTrees += totalNear;
  await new Promise(r => setTimeout(r, 150));
}
process.stdout.write('\n');

const blvdsWithTrees = Object.keys(canopy).length;
console.log(`${totalTrees} trees across ${blvdsWithTrees} boulevards`);
writeFileSync('canopy.json', JSON.stringify({ generated: new Date().toISOString(), canopy }, null, 2));
console.log('Written to canopy.json');
