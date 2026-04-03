#!/usr/bin/env node
// Counts StreetsLA tree inventory trees within 80m of each boulevard.
// Uses ArcGIS REST API via LA GeoHub. Queries per-boulevard bounding box
// to avoid downloading the full ~700k-row dataset.
//
// Usage:  node check-canopy.mjs
// Output: canopy.json → { generated, canopy: { "Wilshire Boulevard": { count, topSpecies }, ... } }

import { writeFileSync } from 'fs';
import { loadBoulevards, hav } from './geo-utils.mjs';

const boulevards = loadBoulevards();
const THRESHOLD_KM = 0.08; // 80m

// Discover the ArcGIS REST service URL from the GeoHub item
// Dataset: StreetsLA Tree Inventory — https://geohub.lacity.org/datasets/266c6255b1fc4ae8b8f100d8696e1fa4_0
const ITEM_ID = '266c6255b1fc4ae8b8f100d8696e1fa4';

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
// serviceUrl typically ends in /FeatureServer (no layer index)
const BASE = serviceUrl.replace(/\/$/, '').replace(/\/\d+$/, '') + '/0/query';

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
  const bufDeg = 0.001; // ~110m buffer — slightly wider than THRESHOLD_KM
  const geom = {
    xmin: minLon - bufDeg, ymin: minLat - bufDeg,
    xmax: maxLon + bufDeg, ymax: maxLat + bufDeg,
    spatialReference: { wkid: 4326 }
  };

  let features = [];
  try {
    const url = `${BASE}?where=1%3D1` +
      `&geometry=${encodeURIComponent(JSON.stringify(geom))}` +
      `&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=TOOLTIP&returnGeometry=true&outSR=4326&resultRecordCount=5000&f=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    features = data.features || [];
  } catch (e) {
    console.warn(`\n  Warning: ${blvd.name} query failed: ${e.message}`);
    await new Promise(r => setTimeout(r, 500));
    continue;
  }

  // Pre-flatten boulevard points for distance checks
  const blvdPts = blvd.segs.flatMap(seg => seg);

  // Filter to within 80m of any segment point
  const near = features.filter(f => {
    const { x: lon, y: lat } = f.geometry || {};
    if (!lat || !lon) return false;
    return blvdPts.some(([slat, slon]) => hav(lat, lon, slat, slon) <= THRESHOLD_KM);
  });

  if (!near.length) {
    await new Promise(r => setTimeout(r, 150));
    continue;
  }

  // Parse species from TOOLTIP field: "Species: FICUS\nBotanical Name: ..."
  const SKIP = new Set(['NOT SPECIFIED', 'DEAD TREE', 'PALM (DEAD)', 'STUMP', 'VACANT SITE', 'REMOVED']);
  const specCounts = {};
  for (const f of near) {
    const tooltip = f.attributes?.TOOLTIP || '';
    const match = tooltip.match(/Species:\s*([^\n\\]+)/);
    const sp = match ? match[1].trim().toUpperCase() : 'UNKNOWN';
    if (SKIP.has(sp) || sp === 'UNKNOWN') continue;
    // Title-case the species name for readability
    const spTitled = sp.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    specCounts[spTitled] = (specCounts[spTitled] || 0) + 1;
  }
  const topSpecies = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  canopy[blvd.name] = { count: near.length, topSpecies };
  totalTrees += near.length;
  await new Promise(r => setTimeout(r, 150));
}
process.stdout.write('\n');

const blvdsWithTrees = Object.keys(canopy).length;
console.log(`${totalTrees} trees across ${blvdsWithTrees} boulevards`);
writeFileSync('canopy.json', JSON.stringify({ generated: new Date().toISOString(), canopy }, null, 2));
console.log('Written to canopy.json');
