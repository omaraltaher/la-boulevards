# LA County Boulevards

An interactive map of every boulevard in Los Angeles County.

**[Live map →](https://omaraltaher.github.io/la-boulevards)**

## Features
- ~280 boulevards across LA County
- Click any boulevard for Wikipedia summary, photo strip, and pop culture appearances
- Search by boulevard name or street address
- Live Caltrans traffic cameras
- Public art near each boulevard
- Wild parrot sightings (color-coded by species) 🦜
- LA theatres with The Wiltern as a featured easter egg
- Jonathan Gold tribute on Pico Boulevard

## Embed
```html
<iframe
  src="https://omaraltaher.github.io/la-boulevards?embed=1"
  width="100%" height="600"
  style="border:none;"
  loading="lazy"
  title="LA County Boulevards Map">
</iframe>
```

## Data refresh schedule

| File | Source | Frequency |
|---|---|---|
| `cameras-live.json` | Caltrans D7 CCTV feed | Daily 6am PT |
| `wiltern-events.json` | Ticketmaster Discovery API | Daily 7am PT |
| `theatres.json` | OpenStreetMap Overpass API | Monthly 1st |
| `parrots.json` | iNaturalist (Free-Flying LA Parrot Project) | Monthly 1st |
| `art.json` | LA City Open Data | Monthly 1st |
| `boulevards.json` | OpenStreetMap Overpass API | Manual |

All GitHub Actions commit updated files with `[skip ci]` to avoid re-triggering.

## Regenerate boulevard data
```bash
node fetch-boulevards.mjs   # fetch from Overpass (~30s)
node merge-segments.mjs     # merge fragmented OSM segments
```
Requires Node 18+.

## Sources
- Street geometry: OpenStreetMap via Overpass API
- Map tiles: CARTO dark_nolabels
- Boulevard info: Wikipedia REST API, Wikimedia Commons, Wikidata SPARQL, MusicBrainz
- Cameras: Caltrans District 7 CCTV feed
- Public art: LA City Open Data (dataset ejf8-ekfc)
- Theatres: OpenStreetMap
- Parrots: iNaturalist / Occidental College Moore Lab of Zoology
- Wiltern events: Ticketmaster Discovery API

## License
Map data © OpenStreetMap contributors (ODbL). Code MIT.
