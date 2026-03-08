// Shared geospatial utilities for pre-bake scripts.

import { readFileSync } from 'fs';

export function hav(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function loadBoulevards() {
  return JSON.parse(readFileSync('boulevards.json', 'utf8'));
}

export function nearestBlvd(boulevards, lat, lon) {
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
