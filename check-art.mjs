#!/usr/bin/env node
// Fetches public art from LA City Open Data, filters to within 0.3km of a
// boulevard, pre-fetches Wikimedia Commons links, and writes art.json.
//
// Usage:  node check-art.mjs
// Output: art.json

import { writeFileSync, readFileSync } from 'fs';

const boulevards = JSON.parse(readFileSync('boulevards.json', 'utf8'));
const THRESHOLD_KM = 0.3;

function hav(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function nearestBlvd(lat, lon) {
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

async function fetchCommonsUrl(title, artist) {
  const q = encodeURIComponent(`${title} ${artist} Los Angeles`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${q}&format=json&origin=*&srlimit=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const hit = data.query?.search?.[0];
    if (!hit) return null;
    const pageTitle = encodeURIComponent(hit.title.replace(/ /g, '_'));
    return `https://commons.wikimedia.org/wiki/${pageTitle}`;
  } catch { return null; }
}

// Paginate lacity.org — dataset has ~800+ items
console.log('Fetching public art from LA City Open Data…');
const allItems = [];
const LIMIT = 500;
for (let offset = 0; ; offset += LIMIT) {
  const url = `https://data.lacity.org/resource/ejf8-ekfc.json?$limit=${LIMIT}&$offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) { console.error('lacity.org error:', res.status); break; }
  const batch = await res.json();
  allItems.push(...batch);
  if (batch.length < LIMIT) break;
  process.stdout.write(`  fetched ${allItems.length} items…\r`);
}
console.log(`\nTotal items: ${allItems.length}`);

// Filter to boulevard-adjacent art
const nearby = [];
for (const item of allItems) {
  const lat = parseFloat(item.latitude);
  const lon = parseFloat(item.longitude);
  if (!lat || !lon) continue;
  const { blvd, dist } = nearestBlvd(lat, lon);
  if (dist > THRESHOLD_KM) continue;
  nearby.push({
    title:   item.location_name  || 'Untitled',
    artist:  item.artist_s       || '',
    desc:    item.art_description|| '',
    address: item.project_address|| '',
    lat, lon,
    blvd: blvd.name
  });
}
console.log(`${nearby.length} items within ${THRESHOLD_KM}km of a boulevard`);

// Pre-fetch Wikimedia Commons URLs
console.log('Fetching Wikimedia Commons links…');
const items = [];
for (let i = 0; i < nearby.length; i++) {
  const a = nearby[i];
  if (i % 10 === 0) process.stdout.write(`  ${i}/${nearby.length}\r`);
  const commonsUrl = await fetchCommonsUrl(a.title, a.artist);
  items.push({ ...a, commonsUrl });
  await new Promise(r => setTimeout(r, 100)); // be polite
}
process.stdout.write('\n');

writeFileSync('art.json', JSON.stringify({ generated: new Date().toISOString(), items }, null, 2));
console.log(`Done — ${items.length} art items written to art.json`);
