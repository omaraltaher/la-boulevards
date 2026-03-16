#!/usr/bin/env node
// Fetches Pacific Electric railway data from OpenStreetMap Overpass API.
// Queries both ghost (abandoned/razed) and surviving (active) PE corridors.
// Routes include a `status` field: "ghost" or "active".
//
// Usage:  node check-railway.mjs
// Output: railway.json

import { writeFileSync } from 'fs';

const QUERY = `[out:json][timeout:60];
(
  way["railway"="abandoned"]["old_railway_operator"="Pacific Electric Railway"](33.70,-118.95,34.82,-117.65);
  way["railway"="abandoned"]["name"~"."](33.70,-118.95,34.82,-117.65);
  way["railway"="razed"]["name"~"."](33.70,-118.95,34.82,-117.65);
  way["railway"]["old_railway_operator"="Pacific Electric Railway"](33.70,-118.95,34.82,-117.65);
  way["railway"="light_rail"]["name"="Metro E Line"](33.70,-118.95,34.82,-117.65);
  way["railway"="light_rail"]["name"="Metro A Line"](33.70,-118.95,34.82,-117.65);
);
out body;
>;
out skel qt;`;

console.log('Fetching Pacific Electric railway data from Overpass…');
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
    const railwayTag = way.tags.railway;
    const status = (railwayTag === 'abandoned' || railwayTag === 'razed') ? 'ghost' : 'active';
    // Map Metro line names to their PE predecessor
    const PE_SUCCESSORS = {
      'Metro E Line': 'Metro E Line (former Santa Monica Air Line)',
      'Metro A Line': 'Metro A Line (former Long Beach Line)',
    };
    const rawName = way.tags.name || way.tags.old_name || null;
    return {
      name:     PE_SUCCESSORS[rawName] || rawName,
      operator: way.tags.old_railway_operator || way.tags.operator || null,
      status,
      coords
    };
  })
  .filter(r => r.coords.length >= 2 && r.name);

const ghost  = routes.filter(r => r.status === 'ghost');
const active = routes.filter(r => r.status === 'active');
const ghostNames  = [...new Set(ghost.map(r => r.name))];
const activeNames = [...new Set(active.map(r => r.name))];
console.log(`${ghost.length} ghost segments across ${ghostNames.length} named lines`);
console.log(`${active.length} active segments across ${activeNames.length} named surviving corridors`);
console.log('Active lines:', activeNames.join(', '));

writeFileSync('railway.json', JSON.stringify({ generated: new Date().toISOString(), routes }, null, 2));
console.log('Written to railway.json');
