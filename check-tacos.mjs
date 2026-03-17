#!/usr/bin/env node
// Geocodes LA Taco editorial picks, scrapes per-restaurant images, assigns nearest boulevard.
// Usage:  node check-tacos.mjs
// Output: tacos.json

import { writeFileSync, readFileSync } from 'fs';

const SPOTS = [
  { name: 'Carnitas Los Gabrieles',     taco: 'Carnitas de costilla',          address: '1235 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Sonoratown',                 taco: 'Taco de carne asada',           address: '208 E 8th St, Los Angeles, CA',               url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'La Flor de Yucatán',         taco: 'Cochinita pibil',               address: '1800 S Hoover St, Los Angeles, CA',           url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Taco Nazo',                  taco: 'Taco de camarón',               address: '10326 Alondra Blvd, Bellflower, CA',          url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Birriería El Jalisciense',   taco: 'Birria de chivo tatemada',      address: '3442 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Komal',                      taco: 'Taco de barbacoa',              address: '3655 S Grand Ave, Los Angeles, CA',           url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Burritos La Palma',          taco: 'Taco de carnitas',              address: '2811 E Olympic Blvd, Los Angeles, CA',        url: 'https://lataco.com/12-best-tacos-to-try/' },
  { name: 'Guatemalan Night Market',    taco: 'Tacos guatemaltecos',           address: '1870 W 6th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'Tacos de Canasta',           taco: 'Tacos de canasta',              address: '2325 W 6th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'Birriería Estilo Chinaloa',  taco: 'Birria de res',                 address: '3680 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'La Purépecha',              taco: 'Tacos de carnitas',              address: '725 Broadway, Santa Monica, CA',              url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: "Jonah's Kitchen",            taco: 'Tacos de pollo',                address: '2518 Wilshire Blvd, Santa Monica, CA',        url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'El Cartel',                  taco: 'Taco gobernador',               address: '5515 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: 'El Tauro Taco Truck',        taco: 'Taco al pastor',                address: '3108 Wilshire Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-720-metro/' },
  { name: "Chuy's Tacos Dorados",       taco: 'Tacos dorados',                 address: '1335 Willow St, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Corteza',                    taco: 'Taco de suadero',               address: '900 W Olympic Blvd, Los Angeles, CA',         url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'La Salsa Tacos de Canasta',  taco: 'Tacos de canasta',              address: '1285 Maple Ave, Los Angeles, CA',             url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Guerrilla Tacos',            taco: 'Seasonal market taco',          address: '2000 E 7th St, Los Angeles, CA',              url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Mexicali Taco & Co',         taco: 'Taco vampiro',                  address: '702 N Figueroa St, Los Angeles, CA',          url: 'https://lataco.com/best-tacos-dtla/' },
  { name: 'Otro Dia Tacos',             taco: 'Taco de pollo',                 address: '9911 S Santa Monica Blvd, Beverly Hills, CA', url: 'https://lataco.com/best-tacos-west-hollywood/' },
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
  { name: 'Madre (National)',           taco: 'Tlayuda',                       address: '10426 National Blvd, Los Angeles, CA',        url: 'https://lataco.com/best-tacos-west-hollywood/' },
];

const blvdData = JSON.parse(readFileSync('boulevards.json', 'utf8'));
const blvdPoints = [];
for (const b of blvdData) {
  for (const seg of b.segs) {
    for (const [lat, lon] of seg) blvdPoints.push({ name: b.name, lat, lon });
  }
}

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

function norm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/g, '&').replace(/&#\d+;/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function parseSrc(tag) {
  const src = tag.match(/\bsrc=["']([^"']+)["']/)?.[1];
  if (src && !src.startsWith('data:') && src.startsWith('http')) return src;
  const ss = (tag.match(/\bsrcSet=["']([^"']+)["']/) || tag.match(/\bsrcset=["']([^"']+)["']/))?.[1];
  if (ss) {
    let best = null, bestW = 0;
    for (const part of ss.split(',').map(p => p.trim())) {
      const [url, w] = part.split(/\s+/);
      const wNum = parseInt(w ?? '0');
      if (wNum >= 400 && wNum <= 900 && wNum > bestW) { best = url.replace(/&amp;/g, '&'); bestW = wNum; }
    }
    if (best) return best;
    const first = ss.split(',')[0]?.trim().split(/\s+/)[0]?.replace(/&amp;/g, '&');
    if (first?.startsWith('http')) return first;
  }
  return null;
}

async function fetchArticleImages(pageUrl) {
  try {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } });
    if (!res.ok) return {};
    const html = await res.text();

    // Collect content images (filter small icons/avatars by explicit width)
    const images = [];
    const imgRe = /<img\b[^>]*>/gi;
    let m;
    while ((m = imgRe.exec(html)) !== null) {
      const src = parseSrc(m[0]);
      if (!src || /\.(svg|gif)(\?|$)/i.test(src)) continue;
      const w = parseInt(m[0].match(/\bwidth=["']?(\d+)/)?.[1] ?? '9999');
      if (w > 0 && w < 200) continue;
      images.push({ src, pos: m.index });
    }

    // Collect h2/h3 headings
    const headings = [];
    const headRe = /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi;
    while ((m = headRe.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').trim();
      if (text.length > 2 && text.length < 100) headings.push({ text, norm: norm(text), pos: m.index });
    }

    // Filter out navigation/boilerplate headings, keep only restaurant entries
    const boilerRe = /read more|stay in touch|more from|the stop|explore|trump|border|afghan|iran|taquitos|agave|sunday|monday|tuesday|wednesday|thursday|friday|saturday/i;
    const restHeadings = headings.filter(h => !boilerRe.test(h.text));

    // Detect whether restaurant images come AFTER or BEFORE their heading
    let afterCount = 0, beforeCount = 0;
    for (let i = 0; i < restHeadings.length; i++) {
      const pos = restHeadings[i].pos;
      const prevPos = restHeadings[i - 1]?.pos ?? 0;
      const nextPos = restHeadings[i + 1]?.pos ?? html.length;
      if (images.some(img => img.pos > pos && img.pos < nextPos)) afterCount++;
      if (images.some(img => img.pos > prevPos && img.pos < pos)) beforeCount++;
    }
    const useAfter = afterCount >= beforeCount;
    const slug = new URL(pageUrl).pathname.replace(/\//g, '') || pageUrl;
    console.log(`  [${slug}] ${restHeadings.length} restaurant h, ${images.length} img — pattern: ${useAfter ? 'AFTER' : 'BEFORE'} (${afterCount}/${beforeCount})`);

    const result = {};
    if (useAfter) {
      for (let i = 0; i < restHeadings.length; i++) {
        const { norm: n, pos } = restHeadings[i];
        const nextPos = restHeadings[i + 1]?.pos ?? html.length;
        const img = images.find(img => img.pos > pos && img.pos < nextPos);
        if (img) result[n] = img.src;
      }
    } else {
      for (let i = 0; i < restHeadings.length; i++) {
        const { norm: n, pos } = restHeadings[i];
        const prevPos = restHeadings[i - 1]?.pos ?? 0;
        const sectionImgs = images.filter(img => img.pos > prevPos && img.pos < pos);
        const img = sectionImgs[sectionImgs.length - 1];
        if (img) result[n] = img.src;
      }
    }
    return result;
  } catch (e) {
    console.warn('fetchArticleImages failed:', e.message);
    return {};
  }
}

function findImage(spotName, imageMap) {
  const n = norm(spotName.replace(/\s*\(.*?\)$/, ''));
  for (const [h, src] of Object.entries(imageMap)) {
    if (h === n || h.includes(n) || n.includes(h)) return src;
  }
  // Word overlap: at least 2 matching words > 3 chars, or 1 word > 6 chars
  const words = n.split(' ').filter(w => w.length > 3);
  for (const [h, src] of Object.entries(imageMap)) {
    const matches = words.filter(w => h.includes(w));
    if (matches.length >= Math.min(2, words.length)) return src;
    if (matches.some(w => w.length > 6)) return src;
  }
  return null;
}

const uniqueUrls = [...new Set(SPOTS.map(s => s.url))];
const urlToImages = {};
console.log(`Scraping images from ${uniqueUrls.length} articles...`);
for (const url of uniqueUrls) {
  urlToImages[url] = await fetchArticleImages(url);
  await new Promise(r => setTimeout(r, 1000));
}

const tacos = [];
console.log(`\nGeocoding ${SPOTS.length} spots...`);
for (const spot of SPOTS) {
  await new Promise(r => setTimeout(r, 1100));
  const coords = await geocode(spot.address);
  if (!coords) { console.warn(`  ⚠ no geocode: ${spot.name}`); continue; }
  const boulevard = nearestBoulevard(coords.lat, coords.lon);
  if (!boulevard) { console.warn(`  ⚠ no blvd: ${spot.name}`); continue; }
  const photo = findImage(spot.name, urlToImages[spot.url]);
  tacos.push({ name: spot.name, taco: spot.taco, address: spot.address, url: spot.url, lat: coords.lat, lon: coords.lon, boulevard, photo: photo ?? null });
  console.log(`  ${photo ? '✓' : '⚠ no img'} ${spot.name} → ${boulevard}`);
}

writeFileSync('tacos.json', JSON.stringify({ generated: new Date().toISOString(), tacos }, null, 2));
console.log(`\nWritten tacos.json (${tacos.length} spots, ${tacos.filter(t => t.photo).length} with images)`);
