#!/usr/bin/env node
// Fetches Active/Idle oil & gas wells in LA County from CalGEM WellSTAR,
// filters to within 0.3km of a boulevard, and writes wells.json.
//
// Usage:  node check-wells.mjs
// Output: wells.json

import { writeFileSync } from 'fs';
import { loadBoulevards, nearestBlvd } from './geo-utils.mjs';

const boulevards = loadBoulevards();
const THRESHOLD_KM = 0.3;
const BASE = 'https://gis.conservation.ca.gov/server/rest/services/WellSTAR/Wells/MapServer/0/query';
const FIELDS = 'WellStatus,OperatorName,FieldName,WellType,WellTypeLabel,API,Latitude,Longitude';
const WHERE = encodeURIComponent("CountyName='LOS ANGELES' AND WellStatus='Active' AND WellType='OG'");

async function fetchPage(offset) {
  const url = `${BASE}?where=${WHERE}&outFields=${FIELDS}&resultRecordCount=5000&resultOffset=${offset}&f=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CalGEM API error: ${res.status}`);
  return res.json();
}

console.log('Fetching LA County oil & gas wells from CalGEM…');
const all = [];
for (let offset = 0; ; offset += 5000) {
  process.stdout.write(`  fetched ${all.length} wells…\r`);
  const data = await fetchPage(offset);
  const features = data.features || [];
  all.push(...features);
  if (!data.exceededTransferLimit) break;
}
console.log(`\nTotal wells fetched: ${all.length}`);

// Filter to boulevard-adjacent wells
const wells = [];
for (const f of all) {
  const { Latitude: lat, Longitude: lon, WellStatus, OperatorName, FieldName, WellTypeLabel, API } = f.attributes;
  if (!lat || !lon) continue;
  const { blvd, dist } = nearestBlvd(boulevards, lat, lon);
  if (dist > THRESHOLD_KM) continue;
  wells.push({
    lat: Math.round(lat * 1e5) / 1e5,
    lon: Math.round(lon * 1e5) / 1e5,
    status: WellStatus,
    operator: OperatorName || '',
    field: FieldName || '',
    type: WellTypeLabel || '',
    api: API || '',
    blvd: blvd.name,
  });
}

console.log(`${wells.length} wells within ${THRESHOLD_KM}km of a boulevard`);
writeFileSync('wells.json', JSON.stringify({ generated: new Date().toISOString(), wells }, null, 2));
console.log('Done — wells.json written');
