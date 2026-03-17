# Boulevard Love

An interactive map of every boulevard in Los Angeles County — the streets, the history, the hidden layers.

**[omaraltaher.github.io/la-boulevards →](https://omaraltaher.github.io/la-boulevards)**

---

## What's on the map

**~300 boulevards** drawn from OpenStreetMap. Click any one for a Wikipedia extract, Wikimedia Commons photo strip, and a panel of films, albums, and songs named after it. Info panel has a white outline on desktop; slides up as a bottom sheet on mobile.

### Special streets

**Pico Boulevard** — gold. Jonathan Gold ate his way down the whole thing and wrote about it. Click any gold restaurant dot for his exact words.

**Sunset Boulevard** — pink-to-purple gradient, east to west. Three layers appear when selected:
- **Famous spots** — 15 landmarks from the Whisky a Go Go to Chateau Marmont
- **Ed Ruscha photos** — ~500 locations where Ruscha pointed his camera between 1965 and 2010, sourced from the Getty's Arches archive

### Overlay layers

| Layer | Icon | Visibility |
|---|---|---|
| Caltrans traffic cameras | cyan dot | always |
| The Wiltern | pulsing purple dot + crown | always |
| Wallis Annenberg Wildlife Crossing | green arch bridge SVG | with mountain lions toggle |
| Public art | magenta dot | when boulevard selected |
| Theatres | purple dot | when boulevard selected |
| Jonathan Gold restaurants | gold dot | when Pico selected |
| Sunset Strip landmarks | gradient star | when Sunset selected |
| Wild parrots | green parrot SVG | toggleable |
| Hidden oil wells | brown derrick SVG | toggleable |
| Mountain lions | amber cat SVG | toggleable |
| Coyotes | brown coyote SVG | toggleable |
| Pacific Electric Ghost Railway | dashed yellow line | toggleable |
| Pacific Electric Active Railway | solid yellow line | toggleable |

### P-22: The Lion of Los Angeles

The amber cat icon in the Santa Monica Mountains is P-22. Click it to watch his journey to Griffith Park unfold — the route draws itself in real time, stopping at each verified iNaturalist sighting along the way. When the journey ends, the info panel opens with his story, a 99% Invisible audio episode, and the full sighting record. Click any observation marker for its photo and iNaturalist link. Click the route line to reopen the story panel.

### Pacific Electric Railway

Yellow dashed lines trace the ghost of LA's former Red Car network — the 1,100-mile interurban system that connected 56 cities before shutting down in 1961. Solid yellow lines show the corridors that survived as Metro light rail (E Line, A Line, West Santa Ana Branch). Click any line to open a full info panel: ghost lines show the history, conspiracy theory (GM/National City Lines conviction), and a 99% Invisible audio episode; active lines show how each specific PE corridor was revived.

The Wallis Annenberg Wildlife Crossing — the world's largest wildlife crossing, opened April 2025 over US-101 at Liberty Canyon — appears as a green bridge icon near Agoura Hills. It shows and hides with the mountain lions toggle, connecting P-22's legacy to its physical outcome.

---

## Data refresh schedule

| File | Source | Updated |
|---|---|---|
| `cameras-live.json` | Caltrans D7 CCTV | Daily 6am PT |
| `wiltern-events.json` | Ticketmaster Discovery API | Daily 7am PT |
| `theatres.json` | OpenStreetMap Overpass | Monthly |
| `parrots.json` | iNaturalist / Free-Flying LA Parrot Project | Monthly |
| `lions.json` | iNaturalist (taxon 42007) | Monthly |
| `coyotes.json` | iNaturalist (taxon 42051) | Monthly |
| `railway.json` | OpenStreetMap Overpass + Wikipedia image API | Yearly (Jan 1) |
| `art.json` | LA City Open Data | Monthly |
| `wells.json` | CalGEM ArcGIS REST API | Manual |
| `boulevards.json` | OpenStreetMap Overpass | Manual |

GitHub Actions commit updated files with `[skip ci]`.

---

## Regenerate data

```bash
# Boulevard geometry
node fetch-boulevards.mjs    # fetch from Overpass (~30s)
node merge-segments.mjs      # merge fragmented OSM segments
```

`fetch-boulevards.mjs` groups directional OSM variants together ("West X Boulevard" + "East X Boulevard" → "X Boulevard") and deduplicates parallel `oneway=yes` carriageways within each group by 40m midpoint proximity, so divided roads aren't double-counted. The 8 most prominent boulevards (Sunset, Pico, Wilshire, Olympic, Venice, Sepulveda, Santa Monica, Ventura) have their lengths overridden in `index.html` with Wikipedia values; all others use the corrected OSM estimate.

```bash

# Ruscha photo locations (~5 min, samples Getty Arches API)
node check-ruscha.mjs

# Mountain lion sightings
node check-lions.mjs
```

Requires Node 18+.

---

## Embed

```html
<iframe
  src="https://omaraltaher.github.io/la-boulevards?embed=1"
  width="100%" height="600"
  style="border:none;"
  loading="lazy"
  title="Boulevard Love — LA County Boulevards Map">
</iframe>
```

`?embed=1` hides the title panel.

---

## Deep links

`?blvd=Pico+Boulevard` — selects and zooms to a specific boulevard on load.

---

## Sources

- Street geometry & lengths: OpenStreetMap (ODbL) via Overpass API; major boulevard lengths from Wikipedia / Wikimedia Foundation
- Map tiles: CARTO dark_nolabels / Esri satellite
- Boulevard info: Wikipedia REST API, Wikimedia Commons, Wikidata SPARQL, MusicBrainz
- Cameras: Caltrans District 7 CCTV feed
- Public art: LA City Open Data (dataset ejf8-ekfc)
- Theatres: OpenStreetMap
- Parrots: iNaturalist / Occidental College Moore Lab of Zoology
- Mountain lions: iNaturalist (Puma concolor, taxon 42007)
- Coyotes: iNaturalist (Canis latrans, taxon 42051)
- Ghost railway: OpenStreetMap contributors (`railway=abandoned/razed`, `old_railway_operator=Pacific Electric Railway`)
- Active PE corridors: OpenStreetMap (Metro E Line, A Line, West Santa Ana Branch)
- Railway images: Wikimedia Commons via Wikipedia imageinfo API (pre-baked at build time)
- Wallis Annenberg Wildlife Crossing: Wikipedia + NPS
- Wiltern events: Ticketmaster Discovery API
- Oil wells: CalGEM (California Geologic Energy Management Division)
- P-22 photo: NPS public domain via Wikimedia Commons

## License

Map data © OpenStreetMap contributors (ODbL). Code MIT.
