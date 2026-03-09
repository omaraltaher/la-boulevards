# LA County Boulevards

An interactive map of every boulevard in Los Angeles County — the streets, the history, the hidden layers.

**[omaraltaher.github.io/la-boulevards →](https://omaraltaher.github.io/la-boulevards)**

---

## What's on the map

**~280 boulevards** drawn from OpenStreetMap. Click any one for a Wikipedia extract, Wikimedia Commons photo strip, and a panel of films, albums, and songs named after it.

### Special streets

**Pico Boulevard** — gold. Jonathan Gold ate his way down the whole thing and wrote about it for years. Click any gold dot for his exact words.

**Sunset Boulevard** — pink to purple gradient, east to west. Three layers appear when you select it:
- **Famous spots** — 15 landmarks from the Whisky a Go Go to Chateau Marmont, each with a story
- **Ed Ruscha photos** — ~500 locations where Ruscha pointed his camera between 1965 and 2010, sourced from the Getty's Arches archive. Popups link to [12sunsets.getty.edu](https://12sunsets.getty.edu/)

### Overlay layers

| Layer | Icon | Visibility |
|---|---|---|
| Caltrans traffic cameras | cyan dot | always |
| The Wiltern | pulsing purple dot + crown | always |
| Public art | magenta dot | when boulevard selected |
| Theatres | purple dot | when boulevard selected |
| Jonathan Gold restaurants | gold dot | when Pico selected |
| Sunset Strip landmarks | gradient star | when Sunset selected |
| Ruscha photo locations | silver camera | when Sunset selected |
| Wild parrots (toggleable) | green parrot | always (toggle off to hide) |
| Hidden oil wells (toggleable) | brown derrick | always (toggle off to hide) |

### Search

Type a boulevard name for autocomplete, or any address for proximity mode — nearby boulevards highlight, everything else dims.

---

## Data refresh schedule

| File | Source | Updated |
|---|---|---|
| `cameras-live.json` | Caltrans D7 CCTV | Daily 6am PT |
| `wiltern-events.json` | Ticketmaster Discovery API | Daily 7am PT |
| `theatres.json` | OpenStreetMap Overpass | Monthly |
| `parrots.json` | iNaturalist / Free-Flying LA Parrot Project | Monthly |
| `art.json` | LA City Open Data | Monthly |
| `wells.json` | CalGEM ArcGIS REST API | Manual |
| `ruscha.json` | Getty Arches API | Manual (`node check-ruscha.mjs`) |
| `boulevards.json` | OpenStreetMap Overpass | Manual |

GitHub Actions commit updated files with `[skip ci]`.

---

## Regenerate data

```bash
# Boulevard geometry
node fetch-boulevards.mjs    # fetch from Overpass (~30s)
node merge-segments.mjs      # merge fragmented OSM segments

# Ruscha photo locations (~5 min, samples Getty Arches API)
node check-ruscha.mjs
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
  title="LA County Boulevards Map">
</iframe>
```

`?embed=1` hides the title panel.

---

## Sources

- Street geometry: OpenStreetMap (ODbL) via Overpass API
- Map tiles: CARTO dark_nolabels
- Boulevard info: Wikipedia REST API, Wikimedia Commons, Wikidata SPARQL, MusicBrainz
- Cameras: Caltrans District 7 CCTV feed
- Public art: LA City Open Data (dataset ejf8-ekfc)
- Theatres: OpenStreetMap
- Parrots: iNaturalist / Occidental College Moore Lab of Zoology
- Wiltern events: Ticketmaster Discovery API
- Oil wells: CalGEM (California Geologic Energy Management Division)
- Ruscha photos: Getty Research Institute via [tools.getty.edu/arches/ruscha](https://tools.getty.edu/arches/ruscha)

## License

Map data © OpenStreetMap contributors (ODbL). Code MIT.
