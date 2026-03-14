// Run once: node fetch-boulevards.mjs
// Fetches LA County boulevard data from Overpass, processes it,
// and writes a compact boulevards.json for the map to load locally.
//
// Length accuracy:
//   - "West X Blvd" / "East X Blvd" are grouped under "X Blvd" (same street, different sections)
//   - oneway=yes ways within each group are deduplicated at 40m midpoint proximity
//     to avoid double-counting both carriageways of divided roads
//   - index.html overrides the 8 most prominent boulevards with Wikipedia lengths

import { writeFileSync } from 'fs';

const query = `[out:json][timeout:120];
area["name"="Los Angeles County"]["admin_level"="6"]->.la;
way["name"~"Boulevard$",i](area.la);
out geom tags;`;

console.log('Fetching from Overpass API (this takes ~30s)...');

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(query)
});

if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
const data = await res.json();

console.log(`Got ${data.elements.length} OSM way segments. Processing...`);

// Haversine for length computation
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function segmentLength(geom) {
  let len = 0;
  for (let i = 1; i < geom.length; i++)
    len += haversine(geom[i-1].lat, geom[i-1].lon, geom[i].lat, geom[i].lon);
  return len;
}

// Midpoint of a way's geometry
function midpoint(geom) {
  return {
    lat: geom.reduce((s, n) => s + n.lat, 0) / geom.length,
    lon: geom.reduce((s, n) => s + n.lon, 0) / geom.length
  };
}

// Flat distance in metres (accurate enough at ~100m scale)
function flatDist(a, b) {
  const dlat = (b.lat - a.lat) * 111000;
  const dlon = (b.lon - a.lon) * 111000 * Math.cos(a.lat * Math.PI / 180);
  return Math.sqrt(dlat*dlat + dlon*dlon);
}

// Douglas-Peucker simplification to reduce node count
function perpendicularDist(pt, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(pt[0]-start[0], pt[1]-start[1]);
  const t = ((pt[0]-start[0])*dx + (pt[1]-start[1])*dy) / (dx*dx + dy*dy);
  return Math.hypot(pt[0]-(start[0]+t*dx), pt[1]-(start[1]+t*dy));
}

function simplify(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDist(pts[i], pts[0], pts[pts.length-1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const l = simplify(pts.slice(0, idx+1), eps);
    const r = simplify(pts.slice(idx), eps);
    return [...l.slice(0, -1), ...r];
  }
  return [pts[0], pts[pts.length-1]];
}

// Strip leading directional prefix ("West X Blvd" → "X Blvd").
// Guard: only strip when the next word is ≥4 chars, so "West End Blvd" stays intact.
function canonical(name) {
  return name.replace(/^(?:West|East|North|South) (?=\w{4})/, '');
}

// Group all ways under their canonical boulevard name
const byName = {};
const ways = data.elements.filter(e => e.type === 'way' && e.geometry?.length >= 2);

ways.forEach(w => {
  const name = canonical(w.tags?.name || 'Unknown Boulevard');
  if (!byName[name]) byName[name] = { name, ways: [] };
  byName[name].ways.push(w);
});

console.log(`Grouped into ${Object.keys(byName).length} canonical boulevards. Deduplicating...`);

// For each boulevard: compute length, deduplicating parallel oneway carriageways.
// Strategy: for oneway=yes ways, skip any whose midpoint falls within 40m of an
// already-counted oneway way in the same group (parallel carriageway of a divided road).
// Non-oneway ways are always counted. All ways' geometry is kept for rendering.
Object.values(byName).forEach(group => {
  const oneways    = group.ways.filter(w => w.tags?.oneway === 'yes' || w.tags?.oneway === '1');
  const nonOneways = group.ways.filter(w => !w.tags?.oneway || w.tags?.oneway === 'no');

  const skip = new Set();
  for (let i = 0; i < oneways.length; i++) {
    if (skip.has(i)) continue;
    const mi = midpoint(oneways[i].geometry);
    for (let j = i + 1; j < oneways.length; j++) {
      if (skip.has(j)) continue;
      if (flatDist(mi, midpoint(oneways[j].geometry)) < 40) skip.add(j);
    }
  }

  group.totalKm =
    oneways.filter((_, i) => !skip.has(i)).reduce((s, w) => s + segmentLength(w.geometry), 0) +
    nonOneways.reduce((s, w) => s + segmentLength(w.geometry), 0);

  // simplify: epsilon ~0.0001 degrees ≈ 10m — reduces nodes by ~70%
  group.segments = group.ways.map(w =>
    simplify(w.geometry.map(n => [n.lat, n.lon]), 0.0001)
  );
});

// Percentile rank by total length
const boulevards = Object.values(byName).sort((a, b) => a.totalKm - b.totalKm);
boulevards.forEach((b, i) => { b.pct = i / (boulevards.length - 1); });

// Write compact output — drop totalKm, keep only what the map needs
const out = boulevards.map(b => ({
  name: b.name,
  pct:  Math.round(b.pct * 1000) / 1000,
  km:   Math.round(b.totalKm * 100) / 100,
  segs: b.segments.map(seg =>
    seg.map(([lat, lon]) => [Math.round(lat*100000)/100000, Math.round(lon*100000)/100000])
  )
}));

writeFileSync('boulevards.json', JSON.stringify(out));

const sizeMB = (JSON.stringify(out).length / 1024 / 1024).toFixed(2);
console.log(`Done. Wrote boulevards.json — ${out.length} boulevards, ${sizeMB} MB`);
