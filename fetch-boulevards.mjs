// Run once: node fetch-boulevards.mjs
// Fetches LA County boulevard data from Overpass, processes it,
// and writes a compact boulevards.json for the map to load locally.

import { writeFileSync } from 'fs';

const query = `[out:json][timeout:120];
area["name"="Los Angeles County"]["admin_level"="6"]->.la;
way["name"~"Boulevard$",i](area.la);
out geom;`;

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

// Group ways by name, simplify geometry
const byName = {};
const ways = data.elements.filter(e => e.type === 'way' && e.geometry?.length >= 2);

ways.forEach(w => {
  const name = w.tags?.name || 'Unknown Boulevard';
  if (!byName[name]) byName[name] = { name, totalKm: 0, segments: [] };
  const km = segmentLength(w.geometry);
  byName[name].totalKm += km;
  // simplify: epsilon ~0.0001 degrees ≈ 10m — reduces nodes by ~70%
  const pts = w.geometry.map(n => [n.lat, n.lon]);
  const simplified = simplify(pts, 0.0001);
  byName[name].segments.push(simplified);
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
