#!/usr/bin/env node
// Fetches upcoming events for multiple LA venues from Ticketmaster Discovery API
// and writes venue-events.json for the map to load at startup.
//
// Usage:  TICKETMASTER_KEY=<key> node check-venues.mjs
// Output: venue-events.json

import { writeFileSync } from 'fs';

const key = process.env.TICKETMASTER_KEY;
if (!key) { console.error('Missing TICKETMASTER_KEY env var'); process.exit(1); }

const VENUES = [
  { id: 'KovZpZAEAlaA', name: 'Hollywood Palladium' },
  { id: 'KovZpZAkJnnA', name: 'El Rey Theatre' },
  { id: 'KovZpZAFAkIA', name: 'Henry Fonda Theater' },
  { id: 'KovZ917AI1p',  name: 'Avalon Hollywood' },
  { id: 'KovZ917A25f',  name: 'The Novo' },
  { id: 'KovZ917ARk0',  name: 'Peacock Theater' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchVenueEvents(venue) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json` +
    `?venueId=${venue.id}&size=8&sort=date%2Casc&apikey=${key}`;

  console.log(`Fetching events for ${venue.name}…`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Ticketmaster API error for ${venue.name}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const raw = data._embedded?.events || [];

  const events = raw.map(ev => {
    // Pick smallest non-fallback image for fast loading
    const img = (ev.images || [])
      .filter(i => !i.fallback)
      .sort((a, b) => a.width - b.width)[0]?.url || null;

    return {
      name: ev.name,
      date: ev.dates.start.localDate,
      time: ev.dates.start.localTime || null,
      url:  ev.url,
      image: img
    };
  });

  console.log(`  ${events.length} events found for ${venue.name}`);
  return events;
}

const venues = {};
let totalEvents = 0;

for (let i = 0; i < VENUES.length; i++) {
  const venue = VENUES[i];
  const events = await fetchVenueEvents(venue);
  venues[venue.name] = events;
  totalEvents += events.length;

  // Wait 300ms between fetches to avoid rate limiting (skip after last)
  if (i < VENUES.length - 1) {
    await sleep(300);
  }
}

writeFileSync('venue-events.json', JSON.stringify({ generated: new Date().toISOString(), venues }, null, 2));
console.log(`\nDone! ${totalEvents} total events across ${VENUES.length} venues written to venue-events.json`);
