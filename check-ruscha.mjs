#!/usr/bin/env node
/**
 * check-ruscha.mjs
 * Samples Ed Ruscha's Sunset Boulevard photo archive from the Getty Arches API
 * and writes ruscha.json.
 *
 * The archive contains ~121,500 photos across 244 pages (all from Sunset Blvd).
 * This script samples ~40 evenly-spaced pages and fetches a subset of records
 * from each to produce ~600–800 well-distributed map points.
 *
 * Usage:
 *   node check-ruscha.mjs
 *
 * Output:
 *   ruscha.json — { "photos": [ { lat, lon, year, label } ] }
 */

import { writeFileSync } from 'fs';

const BASE = 'https://tools.getty.edu/arches/ruscha';
const TOTAL_PAGES = 244;
const SAMPLE_PAGES = 40;       // evenly-spaced pages to pull from
const RECORDS_PER_PAGE = 15;   // records to fetch from each sampled page
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'la-boulevards-map/1.0' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Parse WKT POINT(lon lat) → { lat, lon } */
function parsePoint(wkt) {
  if (!wkt) return null;
  const m = wkt.match(/POINT\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)/i);
  if (!m) return null;
  const lon = parseFloat(m[1]), lat = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  return { lat, lon };
}

/** Extract year from displayname like "Sunset Boulevard, 1985 : Roll 14 : ..." */
function extractYear(displayname) {
  const m = displayname && displayname.match(/\b(196\d|197\d|198\d|199\d|200\d|201\d)\b/);
  return m ? parseInt(m[1]) : null;
}

/** Extract short label from displayname — cross-street + year, strip the roll/image info */
function shortLabel(displayname, year) {
  if (!displayname) return 'Sunset Blvd';
  // "Sunset Boulevard, 1985 : Roll 14 : N. Camden Dr. headed west : Image 0155"
  const parts = displayname.split(':');
  if (parts.length >= 3) {
    const location = parts[2].trim().replace(/ headed (east|west)$/i, '');
    return year ? `${location} (${year})` : location;
  }
  return displayname.split(':')[0].trim();
}

async function main() {
  console.log(`Sampling ${SAMPLE_PAGES} pages × ${RECORDS_PER_PAGE} records from Getty Arches Ruscha archive…`);
  console.log(`Estimated: ~${SAMPLE_PAGES * RECORDS_PER_PAGE} API requests at ${DELAY_MS}ms delay`);

  const photos = [];
  const seenCoords = new Set(); // deduplicate near-identical points

  // Evenly-spaced page indices across the full range
  const pageStep = Math.floor(TOTAL_PAGES / SAMPLE_PAGES);
  const pagesToFetch = Array.from({ length: SAMPLE_PAGES }, (_, i) => 1 + i * pageStep);

  for (const page of pagesToFetch) {
    let urls;
    try {
      const data = await fetchJson(`${BASE}/resources/?format=json&page=${page}`);
      urls = (data['ldp:contains'] || []).slice(0, RECORDS_PER_PAGE);
    } catch (e) {
      console.warn(`  Page ${page} list failed: ${e.message}`);
      await sleep(DELAY_MS);
      continue;
    }

    let pageHits = 0;
    for (const resourceUrl of urls) {
      await sleep(DELAY_MS);
      let record;
      try {
        record = await fetchJson(resourceUrl + '?format=json');
      } catch (e) {
        continue;
      }

      const displayname = record.displayname || '';
      const year = extractYear(displayname);
      const label = shortLabel(displayname, year);

      // Extract lat/lon from Production → Photography Location → Coordinates (WKT)
      let coords = null;
      try {
        const prod = record.resource?.Production || {};
        for (const [key, val] of Object.entries(prod)) {
          if (key.toLowerCase().includes('location') && val?.Coordinates) {
            coords = parsePoint(val.Coordinates);
            if (coords) break;
          }
        }
      } catch {}

      if (!coords) continue;

      // Deduplicate within ~90m at LA latitude (3 decimal places ≈ 111m longitude, ~90m actual)
      const dedupKey = `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)},${year}`;
      if (seenCoords.has(dedupKey)) continue;
      seenCoords.add(dedupKey);

      // Filter to LA County bounding box (Sunset Blvd area)
      if (coords.lat < 33.9 || coords.lat > 34.2 || coords.lon < -118.6 || coords.lon > -118.0) continue;

      photos.push({ lat: coords.lat, lon: coords.lon, year, label });
      pageHits++;
    }

    console.log(`Page ${page}/${TOTAL_PAGES} — ${pageHits} new points (total: ${photos.length})`);
  }

  // Sort by year then by longitude (west to east)
  photos.sort((a, b) => (a.year || 0) - (b.year || 0) || a.lon - b.lon);

  console.log(`\nDone. ${photos.length} unique Ruscha photo locations.`);

  writeFileSync('ruscha.json', JSON.stringify({ photos }, null, 2));
  console.log('Written to ruscha.json');
}

main().catch(e => { console.error(e); process.exit(1); });
