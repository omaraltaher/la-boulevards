#!/usr/bin/env node
// Fetches Pacific Electric ghost railway data from OpenStreetMap Overpass API.
// Queries named abandoned/razed railway ways in the LA County bounding box,
// plus any way tagged with the Pacific Electric Railway as the former operator.
//
// Usage:  node check-railway.mjs
// Output: railway.json

import { writeFileSync } from 'fs';

const QUERY = `[out:json][timeout:60];
(
  way["railway"="abandoned"]["old_railway_operator"="Pacific Electric Railway"](33.70,-118.95,34.82,-117.65);
  way["railway"="abandoned"]["name"~"."](33.70,-118.95,34.82,-117.65);
  way["railway"="razed"]["name"~"."](33.70,-118.95,34.82,-117.65);
);
out body;
>;
out skel qt;`;

console.log('Fetching ghost railway data from Overpass…');
const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: 'data=' + encodeURIComponent(QUERY),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
const data = await res.json();

// Build node coordinate map
const nodes = new Map();
data.elements.filter(e => e.type === 'node').forEach(n => nodes.set(n.id, [n.lat, n.lon]));

// Assemble way geometries — keep only named ways with valid coords
const routes = data.elements
  .filter(e => e.type === 'way' && e.nodes && e.tags)
  .map(way => {
    const coords = way.nodes.map(id => nodes.get(id)).filter(Boolean);
    return {
      name:     way.tags.name || way.tags.old_name || null,
      operator: way.tags.old_railway_operator || way.tags.operator || null,
      coords
    };
  })
  .filter(r => r.coords.length >= 2 && r.name);

const uniqueNames = [...new Set(routes.map(r => r.name))];
console.log(`${routes.length} segments across ${uniqueNames.length} named lines`);
writeFileSync('railway.json', JSON.stringify({ generated: new Date().toISOString(), routes }, null, 2));
console.log('Written to railway.json');
