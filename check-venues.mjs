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
  // — original 13 ——————————————————————————————————————————————
  { id: 'KovZpZAEAlaA',  name: 'Hollywood Palladium' },
  { id: 'KovZpZAkJnnA',  name: 'El Rey Theatre' },
  { id: 'KovZpZAFAkIA',  name: 'Henry Fonda Theater' },
  { id: 'KovZ917AI1p',   name: 'Avalon Hollywood' },
  { id: 'KovZ917A25f',   name: 'The Novo' },
  { id: 'KovZ917ARk0',   name: 'Peacock Theater' },
  { id: 'KovZpZAEvnFA',  name: 'Teragram Ballroom' },
  { id: 'KovZpa971e',    name: 'Alex Theatre' },
  { id: 'ZFr9jZA1vF',    name: 'Kirk Douglas Theatre' },
  { id: 'KovZpa3u7e',    name: 'Shrine Auditorium' },
  { id: 'KovZpa3uCe',    name: 'Orpheum Theatre' },
  { id: 'rZ7HnEZ17fOAg', name: 'Pasadena Civic Auditorium' },
  { id: 'KovZpa2Hxe',    name: 'Greek Theatre' },
  // — performing arts ——————————————————————————————————————————
  { id: 'KovZpZAdtaEA',  name: 'Dolby Theatre' },
  { id: 'KovZpZAaEFtA',  name: 'Geffen Playhouse' },
  { id: 'KovZpZAF6E6A',  name: 'Pasadena Playhouse' },
  { id: 'KovZpZA1vaIA',  name: 'Ricardo Montalban Theatre' },
  { id: 'KovZpZAAttIA',  name: 'Ambassador Auditorium' },
  { id: 'KovZpZA7v6tA',  name: 'Wilshire Ebell Theater and Club' },
  { id: 'ZFr9jZk11d',    name: 'La Mirada Theatre For The Performing Arts' },
  { id: 'ZFr9jZakd7',    name: 'Downey Civic Theatre' },
  { id: 'KovZpZA1tvJA',  name: 'Redondo Beach Performing Arts Center' },
  { id: 'ZFr9jZFvdd',    name: 'Haugh Performing Arts Center' },
  { id: 'KovZpZAJdIFA',  name: 'Eli Broad Stage' },
  { id: 'Z7r9jZa7s4',    name: 'Beverly O\'Neill Theater' },
  { id: 'KovZ917AxPH',   name: 'Levitt Pavilion' },
  // — indie / music ————————————————————————————————————————————
  { id: 'KovZpZAEAJAA',  name: 'Bootleg Theater' },
  { id: 'KovZpZA1aJ6A',  name: 'Coronet Theater' },
  { id: 'KovZpa9Tbe',    name: 'Ivar Theatre' },
  { id: 'KovZ917ANZV',   name: 'Dynasty Typewriter At The Hayworth' },
  { id: 'KovZ917ASsc',   name: 'Bob Baker Marionette Theater' },
  { id: 'KovZpZA1tdFA',  name: 'Miracle Theater' },
  { id: 'KovZ917Axzb',   name: 'Barnsdall Gallery Theatre' },
  // — comedy ———————————————————————————————————————————————————
  { id: 'Z7r9jZaA9x',    name: 'The Groundlings' },
  { id: 'KovZ917AmI0',   name: 'Upright Citizens Brigade' },
  { id: 'Z7r9jZa7M2',    name: 'The Comedy Store' },
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
