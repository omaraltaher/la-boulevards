# LA County Boulevards

An interactive map of every boulevard in Los Angeles County, color-coded by length.

**[Live map →](https://YOUR_USERNAME.github.io/la-boulevards)**

## Features
- ~350 boulevards color-coded by length (violet = short → teal = long)
- Click any boulevard for Wikipedia summary, photo strip, and pop culture appearances
- Search by boulevard name or street address
- Live Caltrans traffic cameras
- Jonathan Gold tribute on Pico Boulevard

## Embed
```html
<iframe
  src="https://YOUR_USERNAME.github.io/la-boulevards?embed=1"
  width="100%" height="600"
  style="border:none;"
  loading="lazy"
  title="LA County Boulevards Map">
</iframe>
```

## Regenerate data
```bash
node fetch-boulevards.mjs
```
Requires Node 18+. Queries Overpass API (~30s), overwrites `boulevards.json`.

## Sources
- Street geometry: OpenStreetMap via Overpass API
- Map tiles: CARTO dark_nolabels
- Info: Wikipedia REST API, Wikimedia Commons, Wikidata SPARQL, MusicBrainz
- Cameras: Caltrans District 7 CCTV feed

## License
Map data © OpenStreetMap contributors (ODbL). Code MIT.
