#!/usr/bin/env node
// Geocodes LA Taco editorial picks, fetches OG images, assigns nearest boulevard.
// Usage:  node check-tacos.mjs
// Output: tacos.json

import { writeFileSync, readFileSync } from 'fs';

const SPOTS = [
  { name: 'Taquería Frontera',          taco: 'Tacos de canasta',             address: '700 Cypress Ave, Los Angeles, CA',           url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Carnitas Los Gabrieles',     taco: 'Carnitas de costilla',          address: '1235 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Sonoratown',                 taco: 'Taco de carne asada',           address: '208 E 8th St, Los Angeles, CA',               url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'La Flor de Yucatán',         taco: 'Cochinita pibil',               address: '1800 S Hoover St, Los Angeles, CA',           url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Taco Nazo',                  taco: 'Taco de camarón',               address: '10326 Alondra Blvd, Bellflower, CA',          url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Birriería El Jalisciense',   taco: 'Birria de chivo tatemada',      address: '3442 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Komal',                      taco: 'Taco de barbacoa',              address: '3655 S Grand Ave, Los Angeles, CA',           url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Burritos La Palma',          taco: 'Taco de carnitas',              address: '2811 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Yxta',                       taco: 'Taco de pollo en mole',         address: '601 S Central Ave, Los Angeles, CA',          url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Tacos 1986 (DTLA)',          taco: 'Taco de carne asada',           address: '609 S Spring St, Los Angeles, CA',            url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Guatemalan Night Market',    taco: 'Tacos guatemaltecos',           address: '1870 W 6th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'Tacos de Canasta',           taco: 'Tacos de canasta',              address: '2325 W 6th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'Birriería Estilo Chinaloa',  taco: 'Birria de res',                 address: '3680 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'La Purépecha',              taco: 'Tacos de carnitas',              address: '725 Broadway, Santa Monica, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: "Jonah's Kitchen",            taco: 'Tacos de pollo',                address: '2518 Wilshire Blvd, Santa Monica, CA',        url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'Otro Dia Tacos',             taco: 'Taco de pollo',                 address: '9911 S Santa Monica Blvd, Beverly Hills, CA', url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'El Cartel',                  taco: 'Taco gobernador',               address: '5515 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'El Tauro Taco Truck',        taco: 'Taco al pastor',                address: '3108 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: "Chuy's Tacos Dorados",       taco: 'Tacos dorados',                 address: '1335 Willow St, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Loqui',                      taco: 'Taco de papa',                  address: '803 Traction Ave, Los Angeles, CA',           url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Corteza',                    taco: 'Taco de suadero',               address: '900 W Olympic Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'La Salsa Tacos de Canasta',  taco: 'Tacos de canasta',              address: '1285 Maple Ave, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Villa Moreliana',            taco: 'Carnitas michoacanas',          address: '317 S Broadway, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Ditroit',                    taco: 'Taco de lengua',                address: '2117 Violet St, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Guerrilla Tacos',            taco: 'Seasonal market taco',          address: '2000 E 7th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Mexicali Taco & Co',         taco: 'Taco vampiro',                  address: '702 N Figueroa St, Los Angeles, CA',          url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Madre (Fairfax)',            taco: 'Memelita',                      address: '801 N Fairfax Ave, Los Angeles, CA',          url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Tacos 1986 (WeHo)',          taco: 'Taco de carne asada',           address: '7235 Beverly Blvd, Los Angeles, CA',          url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'MXO by Wes Avila',           taco: 'Chef-driven seasonal taco',     address: '826 N La Cienega Blvd, Los Angeles, CA',      url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Guisados',                   taco: 'Taco de guisado del día',       address: '8935 Santa Monica Blvd, West Hollywood, CA',  url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Escuela Taquería',          taco: 'Taco de birria',                 address: '7450 Beverly Blvd, Los Angeles, CA',          url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Gracias Madre',             taco: 'Taco de coliflor',               address: '8905 Melrose Ave, West Hollywood, CA',        url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Tacos Guelaguetza',         taco: 'Taco de tasajo',                 address: '5848 W Melrose Ave, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Tu Madre',                  taco: 'Taco al pastor',                 address: '1111 Hayworth Ave, West Hollywood, CA',       url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Zarape Cocina & Cantina',   taco: 'Taco de pescado',                address: '8351 Santa Monica Blvd, West Hollywood, CA',  url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Walking Spanish',           taco: 'Taco de carnitas',               address: '7511 Santa Monica Blvd, West Hollywood, CA',  url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'El Carmen',                 taco: 'Taco de carne asada',            address: '8138 W 3rd St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-west-hollywood/' },
  { name: 'Madre (National)',           taco: 'Tlayuda',                       address: '10426 National Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
];

// Load boulevard segment points from boulevards.json (top-level array)
const blvdData = JSON.parse(readFileSync('boulevards.json', 'utf8'));

// Build flat list of { name, lat, lon } from all segment points
const blvdPoints = [];
for (const b of blvdData) {
  for (const seg of b.segs) {
    for (const [lat, lon] of seg) blvdPoints.push({ name: b.name, lat, lon });
  }
}
console.log(`Loaded ${blvdPoints.length} boulevard points from ${blvdData.length} boulevards`);

function hav(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestBoulevard(lat, lon, maxKm = 0.6) {
  let best = null, bestDist = Infinity;
  for (const pt of blvdPoints) {
    const d = hav(lat, lon, pt.lat, pt.lon);
    if (d < bestDist) { bestDist = d; best = pt.name; }
  }
  return bestDist <= maxKm ? best : null;
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'la-boulevards-map/1.0 (github.com/omaraltaher/la-boulevards)' } });
  const data = await res.json();
  return data[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
}

async function fetchOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; la-boulevards-map/1.0)' } });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1] : null;
  } catch { return null; }
}

// Group spots by URL so we only fetch each article page once
const urlToPhoto = {};
const uniqueUrls = [...new Set(SPOTS.map(s => s.url))];
console.log(`\nFetching OG images from ${uniqueUrls.length} article pages...`);
for (const url of uniqueUrls) {
  urlToPhoto[url] = await fetchOgImage(url);
  console.log(`  ${urlToPhoto[url] ? '✓' : '✗'} ${url}`);
}

const tacos = [];
console.log(`\nGeocoding ${SPOTS.length} spots...`);
for (const spot of SPOTS) {
  await new Promise(r => setTimeout(r, 1100)); // Nominatim 1 req/sec
  const coords = await geocode(spot.address);
  if (!coords) { console.warn(`  ⚠ Could not geocode: ${spot.name}`); continue; }
  const boulevard = nearestBoulevard(coords.lat, coords.lon);
  if (!boulevard) { console.warn(`  ⚠ No boulevard within 600m: ${spot.name} (${coords.lat}, ${coords.lon})`); continue; }
  const photo = urlToPhoto[spot.url] || null;
  tacos.push({ name: spot.name, taco: spot.taco, address: spot.address, url: spot.url, lat: coords.lat, lon: coords.lon, boulevard, photo });
  console.log(`  ✓ ${spot.name} → ${boulevard}`);
}

writeFileSync('tacos.json', JSON.stringify({ generated: new Date().toISOString(), tacos }, null, 2));
console.log(`\nWritten tacos.json (${tacos.length} spots)`);
