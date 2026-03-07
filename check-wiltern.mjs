#!/usr/bin/env node
// Fetches upcoming events at The Wiltern from Ticketmaster Discovery API
// and writes wiltern-events.json for the map to load at startup.
//
// Usage:  TICKETMASTER_KEY=<key> node check-wiltern.mjs
// Output: wiltern-events.json

import { writeFileSync } from 'fs';

const key = process.env.TICKETMASTER_KEY;
if (!key) { console.error('Missing TICKETMASTER_KEY env var'); process.exit(1); }

const VENUE_ID = 'KovZpZAEAl6A'; // The Wiltern, Los Angeles

const url = `https://app.ticketmaster.com/discovery/v2/events.json` +
  `?venueId=${VENUE_ID}&size=8&sort=date%2Casc&apikey=${key}`;

console.log('Fetching Wiltern events from Ticketmaster…');
const res = await fetch(url);
if (!res.ok) { console.error('Ticketmaster API error:', res.status); process.exit(1); }
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

writeFileSync('wiltern-events.json', JSON.stringify({ generated: new Date().toISOString(), events }, null, 2));
console.log(`${events.length} events written to wiltern-events.json`);
