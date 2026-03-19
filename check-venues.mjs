#!/usr/bin/env node
// Fetches upcoming events for multiple LA venues from Ticketmaster Discovery API
// and writes venue-events.json for the map to load at startup.
//
// Usage:  TICKETMASTER_KEY=<key> node check-venues.mjs
// Output: venue-events.json

import { writeFileSync } from 'fs';

const key = process.env.TICKETMASTER_KEY;
if (!key) { console.error('Missing TICKETMASTER_KEY env var'); process.exit(1); }

const ebToken = process.env.EVENTBRITE_TOKEN || null;
if (!ebToken) console.warn('No EVENTBRITE_TOKEN — skipping Eventbrite fallback');

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

// ── Eventbrite fallback (venue_id / org_id — search API was deprecated 2020) ─
// IDs sourced manually from eventbrite.com venue/organizer pages.
const EB_VENUES = [
  { name: 'El Rey Theatre',                         type: 'venue', id: '295552078' },
  { name: 'Kirk Douglas Theatre',                   type: 'venue', id: '240699653' },
  { name: 'Pasadena Civic Auditorium',              type: 'venue', id: '62750627'  },
  { name: 'Ambassador Auditorium',                  type: 'venue', id: '209847889' },
  { name: 'Downey Civic Theatre',                   type: 'venue', id: '285106603' },
  { name: 'Haugh Performing Arts Center',           type: 'venue', id: '294859443' },
  { name: 'The Comedy Store',                       type: 'venue', id: '250415463' },
  { name: 'Barnsdall Gallery Theatre',              type: 'venue', id: '160868339' },
  { name: 'Levitt Pavilion',                        type: 'org',   id: '29531385721' },
  { name: 'Bob Baker Marionette Theater',           type: 'org',   id: '31080469933' },
  // Beverly O'Neill, Bootleg, Ivar, Groundlings — not on Eventbrite
];

if (ebToken) {
  console.log(`\nEventbrite pass for ${EB_VENUES.length} venues…`);
  for (const venue of EB_VENUES) {
    await sleep(500);
    try {
      const base = venue.type === 'org'
        ? `https://www.eventbriteapi.com/v3/organizations/${venue.id}/events/`
        : `https://www.eventbriteapi.com/v3/venues/${venue.id}/events/`;
      const url = `${base}?status=live&order_by=start_asc&expand=venue`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${ebToken}` } });
      if (!res.ok) { console.warn(`  EB error for ${venue.name}: ${res.status}`); continue; }
      const data = await res.json();
      const events = (data.events || []).slice(0, 8).map(ev => ({
        name:  ev.name?.text || ev.name,
        date:  ev.start?.local?.slice(0, 10) || null,
        time:  ev.start?.local?.slice(11, 16) || null,
        url:   ev.url,
        image: ev.logo?.url || null,
      }));
      venues[venue.name] = events;
      totalEvents += events.length;
      console.log(`  ${events.length ? `✓ ${events.length} events` : '— no events'}: ${venue.name}`);
    } catch (e) {
      console.warn(`  EB fetch failed for ${venue.name}:`, e.message);
    }
  }
}

writeFileSync('venue-events.json', JSON.stringify({ generated: new Date().toISOString(), venues }, null, 2));
console.log(`\nDone! ${totalEvents} total events across ${VENUES.length} venues written to venue-events.json`);
