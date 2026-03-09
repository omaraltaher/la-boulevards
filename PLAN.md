# Boulevard Love — Implementation Plan
*Target domain: BlvdLove.LA*

## Project Context

**Repo:** https://github.com/omaraltaher/la-boulevards/ → rename to `boulevard-love`
**Live:** https://omaraltaher.github.io/la-boulevards/ → becomes `omaraltaher.github.io/boulevard-love`
**Rename:** GitHub Settings → Repository name → `boulevard-love`. GitHub auto-redirects the old URL. Update the `<h1>` to "Boulevard Love" at the same time.
**Design philosophy:** 99% Invisible-inspired. Hidden systems, overlooked layers, urban storytelling.

### What's Already Built
- Map of every boulevard in LA County
- Sunset Strip highlight
- Layer toggles: Boulevard, Traffic camera, Public art, Theatre
- Wild Parrots 🦜 layer (live)
- Hidden Oil Wells 🛢️ layer (live)
- Jonathan Gold editorial sidebar with "Year I Ate Pico Boulevard" link
- "Featured in films, music & more" section
- Boulevard search

### What's Next
The remaining work builds outward from what exists. Each phase adds a capability that the next phase depends on.

---

## How the Phases Build on Each Other

```
Phase 1: Polish & Framing
  Sharpen first impressions, add boulevard story cards
        │
        ▼
Phase 2: New Data Layers (ghost railway, storm drains, urban wildlife, L.A. Taco)
  Adds to existing layer system — same toggle/popup patterns already working
  Ghost railway + storm drains = new polyline rendering (oil wells/parrots are points)
  L.A. Taco = new editorial sidebar (extends Jonathan Gold pattern)
  Layer counts feed into boulevard story cards from Phase 1
        │
        ▼
Phase 3: Drive the Boulevard
  Requires layers to exist — stitches them into a sequential experience
  "Drive this Boulevard" button gets added to the story card from Phase 1
  One prototype boulevard proves the engine
        │
        ▼
Phase 4: Narrative Routes (P-22 tribute + future routes)
  Requires Drive engine from Phase 3
  Curated editorial storytelling on top of the spatial engine
        │
        ▼
Phase 5: Community Layer (loved places, printable boulevards)
  User-generated hearts on boulevards
  Aggregates into "most loved places in LA" over time
  Print/download your boulevard as a poster
```

---

# PHASE 1: POLISH & FRAMING

**Goal:** Sharpen first impressions on the existing site. No new data, no new layers — just make what's already live land harder.

**Dependency:** None. Ships immediately.

---

## 1.1 — Reframe the Hero Message

**Current:** "Every boulevard in Los Angeles County" — accurate but not compelling. Most users don't know why boulevards are interesting.

**Change to something like:**

```
Boulevard Love

Explore Los Angeles through its boulevards

150+ historic boulevards
Hidden landmarks, art, parrots, oil wells
Cultural stories from LA history
```

"Boulevard Love" as the title sets the emotional tone immediately. The subtitle does the explanatory work. Together they communicate both what the project *is* and how it *feels* in under 5 seconds.

**Implementation:**
- Replace the current `<h1>` text with "Boulevard Love"
- Add subtitle: "Explore Los Angeles through its boulevards"
- Add 2–3 bullet lines below (short, punchy, no paragraph text)
- Keep it minimal — doorway into the map, not a landing page
- Update the subtitle as new layers ship (add "ghost railways" once that layer is live)
- Future: once BlvdLove.LA domain is secured, update all references

## 1.2 — Show the Map Immediately

**Current:** Users see loading state + minimal UI before the map appears.

**Above the fold on load:**
- Map (full viewport or near-full)
- Boulevard search bar (overlaid on map or pinned to top)
- Layer category toggles (compact, visible without scrolling)

**Implementation:**
- Minimize or eliminate any splash/loading screen that blocks the map
- If data is still loading, show the base map first with a subtle per-layer loading indicator
- Hero message from 1.1 can be a brief overlay that fades, or a collapsible banner — should NOT block the map

## 1.3 — Layer Grouping

Current toggles are a flat list. As more layers ship, group them:

```
Explore
  ├── Boulevard
  ├── Sunset Strip
  ├── Traffic camera
  ├── Public art
  └── Theatre

Hidden Infrastructure
  ├── 🛢️ Hidden Oil Wells        ← already live
  ├── 🚋 Ghost Railway           ← Phase 2
  └── ⚫ Storm Drains             ← Phase 2

Living City
  ├── 🦜 Wild Parrots            ← already live
  ├── 🐾 Urban Wildlife          ← Phase 2
  └── 🌮 L.A. Taco Picks         ← Phase 2
```

Groups should be collapsible. Move oil wells and parrots into their groups now so the structure is ready when new layers arrive. Don't show empty groups until their first layer ships.

## 1.4 — Boulevard Story Card

**Current:** Clicking a boulevard shows its name and basic info. The Jonathan Gold / Pico Boulevard editorial sidebar exists but is separate from the boulevard popup itself.

**Change:** When a user clicks a boulevard, show a richer card that combines stats with editorial context. Turn each boulevard popup into a reason to explore further.

**Example card:**
```
Pico Boulevard

📍 Length: 23 miles
🎭 Theatres: 8
🎨 Public art: 14
🛢️ Oil wells: 3
🦜 Parrot sightings: 47

Featured Story
→ "The Year I Ate Pico Boulevard" – Jonathan Gold, LA Weekly

Featured in
→ Training Day (2001)
→ Pico Blvd by NWA
```

**Implementation:**
- Enrich the existing boulevard popup with aggregated layer counts (how many public art pieces, theatres, oil wells, parrot sightings, etc. are near this boulevard)
- Add a "Featured Story" section that links to editorial content when available (Jonathan Gold essays, L.A. Taco guides, notable articles)
- Add a "Featured in" section for film/music references (already partially built with the "Featured in films, music & more" section)
- Not every boulevard needs a featured story — only show that section when editorial content exists
- Layer counts are computed from existing data (spatial query: how many points from each layer fall within a buffer of this boulevard geometry)

**Why this matters:**
- Turns every boulevard click into a moment of discovery
- The stats make the hidden layers tangible ("wait, there are 3 oil wells on this street?")
- The editorial links give a reason to go deeper
- This card becomes the natural entry point for "Drive this Boulevard" in Phase 3 — the button gets added here later

**Editorial content to seed:**
- Pico Boulevard → Jonathan Gold's "Year I Ate Pico Boulevard"
- Wilshire Boulevard → L.A. Taco's 720 bus line taco guide
- Olympic Boulevard → L.A. Taco's "Taco Row" coverage
- Sunset Boulevard → film/music references (Sunset Blvd the film, etc.)
- Victory Boulevard → L.A. Taco suadero stand feature
- Add more as editorial content is curated in Phase 2

## 1.5 — Shareability

**Current:** No way to share a specific boulevard or link someone directly to it.

**Add to the boulevard story card:**
```
Share this boulevard →
  🐦 Twitter    👽 Reddit    🔗 Copy link
```

**Implementation:**

**Deep links:**
- Each boulevard gets a URL: `omaraltaher.github.io/la-boulevards/#/boulevard/pico` or `?boulevard=pico`
- On load, if URL contains a boulevard param, zoom to that boulevard and open its story card automatically
- This is the foundation — sharing only works if the link actually goes somewhere

**Share buttons:**
- Twitter: pre-filled tweet with boulevard name + stat + link. Example: `"Pico Boulevard: 23 miles, 14 public art pieces, 3 hidden oil wells. Explore LA's hidden layers → [link]"`
- Reddit: link post to r/LosAngeles or r/MapPorn with title and URL
- Copy link: copies the deep link to clipboard with a brief "Copied!" confirmation

**Where it appears:**
- Bottom of the boulevard story card (Phase 1.4)
- Later, also at the end of a Drive the Boulevard session (Phase 3) — "Share this drive"
- Later, also on narrative routes (Phase 4) — "Share the P-22 story"

**Why this matters:**
- The project is inherently shareable — "did you know there are oil wells on your street?" is the kind of thing people send to friends
- Deep links make the map discoverable via social media, text, Slack, etc.
- Without deep links, every share just dumps someone on the homepage with no context

## 1.6 — Base Map Options

**Current:** Dark theme (already a strong default — makes data layers pop).

**Add a base map switcher with 2–3 options:**

- **Dark LA Night** — current default. Keep it.
- **Retro LA** — warm, muted tones evoking mid-century maps or Pacific Electric-era cartography. Pairs well with the ghost railway layer and the nostalgic storytelling angle.
- **Satellite** — aerial imagery toggle for users who want to see the actual physical landscape. Especially powerful for oil wells (you can see the derricks) and storm drains (you can trace the concrete channels).

**Implementation:**
- If using Mapbox: use Mapbox Studio styles or built-in style URLs. Create a custom retro style in Studio. Satellite via `mapbox://styles/mapbox/satellite-v9`.
- If using Leaflet: retro feel via Stamen Watercolor or a custom warm-toned tile set. Satellite via Esri World Imagery or Mapbox tiles.
- Add a small base map toggle in the corner of the map (standard map control pattern — thumbnail previews of each style)
- Persist the user's choice in localStorage so it sticks between sessions

**Why this matters:**
- Different base maps tell different stories — satellite makes oil wells visceral, retro makes ghost railways feel like time travel
- Low-effort, high-impact addition that gives users a sense of control

## 1.7 — Mobile Experience

**This will likely be used on phones.** Someone shares a boulevard link, the recipient opens it on their phone. That experience needs to work.

**Requirements:**

- **Map takes full screen.** On mobile, the map should fill the entire viewport. No chrome, no wasted space. All UI overlays sit on top of the map, not beside it.

- **Filters collapse.** Layer toggles should be behind a hamburger or filter icon — tap to expand, tap to collapse. They should not be visible by default on mobile. The map is the product.

- **Boulevard story cards swipe up.** When a user taps a boulevard, the story card (Phase 1.4) should appear as a bottom sheet that slides up from the bottom of the screen. The user can:
  - See the card summary (name, stats) with the map still visible above
  - Swipe up to expand the full card (featured story, share buttons, layer counts)
  - Swipe down to dismiss
  - This is the standard mobile map pattern (Google Maps, Apple Maps, Citymapper all do this)

**Implementation notes:**
- Use a bottom sheet component (CSS `transform: translateY()` with touch gesture handling, or a library like `react-spring` / `framer-motion` if using React)
- Three states: collapsed (just boulevard name visible), half-expanded (stats + featured story), fully expanded (everything including share buttons)
- The bottom sheet pattern carries forward into Phase 3 (Drive mode stop cards) and Phase 4 (narrative route cards) — build it once, reuse everywhere
- Test touch targets: layer toggle icons and share buttons need to be at least 44x44px
- Search bar should be a single-line input at the top of the screen, not a full search panel

## 1.8 — Data Sources Panel

**Add a collapsible "Data Sources" section in the UI.** Urban/open data people will appreciate knowing where everything comes from. Builds credibility and invites contributions.

**Location:** Small "ℹ️ Data Sources" link in the map footer or sidebar. Expands inline — not a separate page.

**Content (updates as layers ship):**

```
Data Sources

▸ Boulevards
  LA County GIS

▸ Traffic Cameras
  City of Los Angeles GeoHub

▸ Public Art
  City of Los Angeles GeoHub

▸ Theatres
  City of Los Angeles GeoHub

▸ Wild Parrots 🦜
  iNaturalist — Free-Flying Los Angeles Parrot Project
  Occidental College, Moore Lab of Zoology
  → inaturalist.org/projects/free-flying-los-angeles-parrot-project

▸ Hidden Oil Wells 🛢️
  CalGEM Well Finder — CA Dept. of Conservation
  → conservation.ca.gov/calgem

▸ Ghost Railway 🚋                          (Phase 2)
  OpenStreetMap contributors
  Militant Angeleno PE Archaeology Map
  1981 Caltrans Inventory of Pacific Electric Routes

▸ Storm Drains ⚫                            (Phase 2)
  LA County GIS — Stormwater data
  OpenStreetMap contributors

▸ Urban Wildlife 🐾                          (Phase 2)
  iNaturalist
  CA Dept. of Fish & Wildlife

▸ L.A. Taco Picks 🌮                        (Phase 2)
  L.A. Taco — lataco.com
  Curated from published guides

▸ Editorial
  Jonathan Gold, "The Year I Ate Pico Boulevard," LA Weekly
  L.A. Taco — James Beard Award-winning publication

Boulevard Love · BlvdLove.LA · Open source on GitHub
```

**Implementation:**
- Each source row is collapsible (tap to expand for links and details)
- Only show sources for layers that are currently live — add new rows as layers ship
- Include direct links to the data source where possible
- Add a link to the GitHub repo at the bottom
- On mobile: this panel should be accessible from a footer icon, not cluttering the main UI

---

# PHASE 2: NEW DATA LAYERS

**Goal:** Four new layers. Two extend the "Hidden Infrastructure" group (ghost railway, storm drains). Two extend the "Living City" group (urban wildlife, L.A. Taco editorial picks). Reuses the same toggle/popup patterns already working for oil wells and parrots.

**Dependency:** Phase 1 (layer grouping). Existing layer system already handles point data (oil wells, parrots) — this phase adds polyline layers (ghost railway, storm drains) and a second editorial sidebar (L.A. Taco alongside Jonathan Gold).

---

## 2.1 — Ghost Railway (Pacific Electric) 🚋
**Highest wow factor. First polyline layer — oil wells and parrots are both point data.**

### Data Source
OpenStreetMap via Overpass API — abandoned/dismantled railway lines in the LA metro area

### How to Get the Data

**Overpass API query:**
```
[out:json][timeout:60];
(
  way["railway"="abandoned"](33.7,-118.7,34.4,-117.7);
  way["railway"="dismantled"](33.7,-118.7,34.4,-117.7);
  way["railway"="razed"](33.7,-118.7,34.4,-117.7);
);
out body;
>;
out skel qt;
```
Run at https://overpass-turbo.eu/ and export as GeoJSON.

Captures ALL abandoned rail in LA County, not just Pacific Electric — but PE was the dominant system so most results are PE routes.

**Supplementary sources:**
- **Militant Angeleno's PE Archaeology Map** — Google My Maps with hand-traced PE routes, surviving remnants, stations, murals, remaining Red Cars. Most historically accurate and editorially rich source.
  - URL: http://militantangeleno.blogspot.com/2015/11/pacific-electric-week-militants-pacific.html
  - Export KML from Google My Maps → convert to GeoJSON
- **1981 Caltrans Inventory of PE Routes (PDF):** https://libraryarchives.metro.net/dpgtl/pacificelectric/1981-caltrans-inventory-of-routes.pdf
  - Authoritative route list with descriptions — useful for labeling, not geometry

### Processing
- Overpass data includes non-PE abandoned rail (freight spurs) — manual filtering optional, or accept all ghost rail as interesting
- Lines will be fragmented ways — merge connected segments for cleaner rendering
- Style as dashed or semi-transparent lines to convey "ghost" feel
- Many PE routes ran along boulevards (Huntington, Long Beach, Whittier, San Fernando) — highlight overlap with boulevard geometries
- PE had 700+ route miles at peak — largest interurban system in the US

### UI Spec
- Toggle label: "Ghost Railway 🚋" (under Hidden Infrastructure)
- Style: dashed red lines (evoking "Red Car" branding), semi-transparent
- Popup on click:
  ```
  Former Pacific Electric Route
  Line: San Bernardino Corridor (if available from OSM tags)
  Era: 1902–1961
  Notes: LA once had the largest electric railway
  network in the world. Today these corridors survive
  as bike paths, diagonal streets, and empty green strips.
  ```

### What this proves
First polyline layer. Validates rendering of line geometries. Sets up the visual pattern for storm drains.

---

## 2.2 — Storm Drains ⚫
**Complements oil wells — both hidden infrastructure, one water, one oil. Second polyline layer — reuses ghost railway rendering pattern.**

### Data Source
- LA County GIS Stormwater data
- OpenStreetMap (tagged storm drain infrastructure)
- LA County Public Works flood control data

### How to Get the Data

**LA County GIS Hub:**
- Search for stormwater/flood control layers at https://data.lacounty.gov/ or LA County Enterprise GIS
- Look for: storm drain paths, flood control channels, catch basins

**Overpass API (supplementary):**
```
[out:json][timeout:60];
(
  way["waterway"="drain"](33.7,-118.7,34.4,-117.7);
  way["waterway"="canal"]["usage"="stormwater"](33.7,-118.7,34.4,-117.7);
  way["man_made"="storm_drain"](33.7,-118.7,34.4,-117.7);
);
out body;
>;
out skel qt;
```

### Processing
- Filter to major storm channels and flood control infrastructure (not every small catch basin)
- LA's flood control system was built after devastating floods in the 1930s
- The LA River is essentially a storm drain — include or exclude based on scope
- Pair with boulevard crossings to show where hidden water infrastructure intersects the street grid

### UI Spec
- Toggle label: "Storm Drains ⚫" (under Hidden Infrastructure)
- Style: blue/grey polylines, slightly transparent
- Popup:
  ```
  Storm Drain
  Built: 1937 (if available)
  Function: Flood control & runoff channel
  Notes: LA's vast storm drain network was built
  after catastrophic floods in the 1930s. Most of
  it is invisible from street level.
  ```

---

## 2.3 — Urban Wildlife 🐾
**Consolidates wildlife corridors + individual sightings. Point layer — same pattern as existing parrots/oil wells.**

### Data Sources

**Coyotes, mountain lions, bobcats:**
- iNaturalist observations for LA County (filter by taxon: Canis latrans, Puma concolor, Lynx rufus)
  ```
  GET https://api.inaturalist.org/v1/observations?taxon_name=Puma+concolor&lat=34.05&lng=-118.25&radius=50&per_page=200
  ```
- California Department of Fish & Wildlife
- Natural History Museum of LA County community science data
- Griffith Park wildlife reports

**Wildlife corridors:**
- California Essential Habitat Connectivity data
- South Coast Missing Linkages project
- National Wildlife Federation corridor maps

### Processing
- Individual sightings as point markers (color/icon by species)
- Wildlife corridors as semi-transparent polylines (thickness indicates frequency)
- Include notable individuals with narrative context (P-22 gets full treatment in Phase 4)
- Focus on sightings near boulevards

### UI Spec
- Toggle label: "Urban Wildlife 🐾" (under Living City)
- Sub-filter options (if UI supports): Coyotes, Mountain Lions, Bobcats, Corridors
- Icons: species-specific silhouettes
- Corridor polylines: green, semi-transparent, varying thickness
- Popup (individual sighting):
  ```
  Coyote Sighting
  Location: Near Griffith Park
  Date: November 2024
  Notes: LA's coyotes navigate the city using
  river channels, rail corridors, and green strips
  between boulevards.
  ```
- Popup (corridor):
  ```
  Wildlife Corridor — Griffith Park to Downtown
  Species: Coyote, Bobcat, Parrot
  Notes: These corridors are invisible transit systems
  for the city's non-human residents.
  ```

---

## 2.4 — L.A. Taco Editorial Picks 🌮
**Manual curation, small dataset. Extends the Jonathan Gold editorial pattern with a second sidebar.**

### Data Source
Manual curation from L.A. Taco's publicly available guides.

### Source Articles

1. **"The 69 Best Tacos in Los Angeles, Ranked" (2025)**
   - https://lataco.com/69-best-tacos-in-la
   - Members-only full list, but many spots named publicly with addresses
   - Boulevard picks: Victory Blvd (suadero stand), Grand Ave (Komal Molino, Holbox)

2. **"Twelve Iconic Tacos to Try When Visiting Los Angeles" (FT collab)**
   - https://lataco.com/12-best-tacos-to-try
   - Fully public with addresses
   - Olympic Blvd "Taco Row" in Boyle Heights, Taquería Frontera, Taco Nazo on Alondra Blvd

3. **"Best Tacos Along Metro's 720 Rapid Bus Line"**
   - https://lataco.com/best-tacos-720-metro
   - Follows Wilshire Boulevard from DTLA to Santa Monica

4. **Neighborhood guides** (Hollywood, DTLA, West Hollywood, Silver Lake, Pasadena)
   - URL pattern: https://lataco.com/best-tacos-{neighborhood}
   - Each has addresses and nearest Metro stops

### GeoJSON Schema
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-118.2437, 34.0522] },
      "properties": {
        "name": "Komal Molino",
        "taco": "Taco de costilla",
        "style": "Mexico City street style",
        "neighborhood": "South LA / Mercado La Paloma",
        "address": "3655 S. Grand Ave #C9, Los Angeles, CA 90007",
        "boulevard": "Grand Avenue",
        "source": "L.A. Taco 69 Best Tacos 2025",
        "url": "https://lataco.com/69-best-tacos-in-la",
        "rank": 1
      }
    }
  ]
}
```

### Processing
- Geocode addresses using Nominatim, Google, or Mapbox geocoding API
- Match each spot to nearest boulevard geometry where applicable
- Curate ~20–30 picks (quality over quantity)
- Credit L.A. Taco prominently — James Beard Award-winning indie publication

### UI Spec
- Toggle label: "L.A. Taco Picks 🌮" (under Living City)
- Icon: taco marker
- Popup:
  ```
  Komal Molino 🌮
  Taco: Taco de costilla
  Style: Mexico City street style
  "L.A. Taco #1 Pick, 2025"
  [Read on L.A. Taco →]
  ```
- **Sidebar panel** similar to Jonathan Gold, with L.A. Taco branding and link to https://lataco.com
- Update annually when their new list drops (typically October–December)

### What this proves
Second editorial sidebar (after Jonathan Gold). Establishes the pattern of curated cultural content alongside data layers — the storytelling voice that Drive the Boulevard will use in Phase 3.

---

# PHASE 3: DRIVE THE BOULEVARD

**Goal:** Sequential storytelling mode. Transforms the map from a data viewer into an exploration tool. Users "drive" a boulevard stop by stop, with hidden layers revealed at each stop.

**Dependency:** Phase 2 (layers must exist to populate stops). Existing layers (oil wells, parrots, public art, theatres) also feed into stops.

---

## User Flow
1. User clicks a boulevard on the map
2. Boulevard popup shows existing info + new button: **"Drive this Boulevard →"**
3. Map enters Drive mode:
   - Zooms to the start of the boulevard
   - Shows a navigation bar at the bottom:
     ```
     Stop 3 of 12
     ◀ Previous    Next ▶
     ```
   - Each stop shows a card with:
     - Name
     - Category icon (oil well, parrot, taco, storm drain, etc.)
     - Short description / hidden story
     - Optional external link
     - Nearby layers indicator (e.g., "Nearby: Storm Drain, Wildlife Corridor")

## Stop Generation

**Option A: Precomputed (recommended for v1)**
- For each boulevard, query all layer data within a buffer distance (e.g., 100m) of the boulevard geometry
- Sort spatially from one end of the boulevard to the other
- Store as static JSON per boulevard, or compute on the fly from existing layer data

**Option B: Dynamic**
- At runtime, spatial query all visible layers near the selected boulevard
- Sort by distance along the boulevard line
- More flexible but requires spatial indexing in the browser

## Map Animation
- Use `map.flyTo()` or `map.easeTo()` to pan/zoom between stops
- Camera should follow the boulevard direction
- Highlight the current stop marker, dim others

## Stop Card Design
```
┌─────────────────────────────────┐
│ 🛢️ Beverly Hills Oil Well       │
│ Hidden Infrastructure            │
│                                  │
│ Hidden Story: This active oil    │
│ well sits inside a building      │
│ designed to blend in with the    │
│ surrounding neighborhood.        │
│                                  │
│ Nearby: 🚋 Ghost Railway          │
│         🦜 Parrot Roost           │
│                                  │
│ [Learn More →]                   │
│                                  │
│ ◀ Stop 5 of 14 ▶                │
└─────────────────────────────────┘
```

## Prototype Boulevard
Start with ONE boulevard to prove the engine:
- **Wilshire** — dense with all layer types, L.A. Taco already has a 720 bus line guide for it
- **Sunset** — iconic, long, diverse neighborhoods
- **Olympic** — Taco Row in Boyle Heights, strong L.A. Taco editorial coverage

The stop card pulls data from whichever layer the stop belongs to — same popup content, reframed in sequential context.

## Implementation Notes
- Include an "Exit Drive Mode" button to return to normal map view
- Mobile-first: card at bottom, map fills screen above
- Drive mode should work even if some layers are toggled off — only show stops from visible layers

---

# PHASE 4: NARRATIVE ROUTES

**Goal:** Curated editorial storytelling using the Drive engine from Phase 3. Instead of driving a boulevard, users follow a narrative path. P-22 is the first. The engine then powers future editorial routes.

**Dependency:** Phase 3 (Drive engine). Phases 1–2 (layers referenced by the narrative).

---

## 4.1 — P-22 Tribute: The Lion of Los Angeles 🦁

### Overview
Dedicated narrative experience celebrating P-22, LA's famous mountain lion. Uses the Drive engine from Phase 3 but with a curated editorial route instead of a boulevard geometry.

### Route
P-22's historic journey from the Santa Monica Mountains to Griffith Park, crossing the 405 and 101 freeways. The route passes through/near several boulevards.

### Stops (curated editorial sequence)

1. **Santa Monica Mountains** — P-22's origin. Context: wildlife corridor fragmentation, why mountain lions need to cross freeways.
2. **405 Freeway Crossing** — The first impossible crossing. Context: urban barriers, wildlife mortality on LA freeways.
3. **Sepulveda Pass** — Transition zone. Context: hidden green corridors in the pass.
4. **101 Freeway Crossing** — The second crossing that made him famous. Context: the proposed wildlife overpass at Liberty Canyon.
5. **Griffith Park** — His home for a decade. Context: how a 4,310-acre park sustains a mountain lion. What he ate (deer, raccoons, a koala from the LA Zoo).
6. **Hollywood Sign area** — His most iconic territory. The "Hollywood Cat" nickname, camera trap photos.
7. **Boulevard intersections** — Where P-22's territory met LA's street grid. Why wildlife corridors matter where they intersect with boulevards.

### Data Sources
- California Department of Fish & Wildlife tracking data (if available as open data)
- Griffith Park wildlife reports
- LA Times coverage
- 99% Invisible episode references
- National Wildlife Federation P-22 documentation

### UI Spec
- Entry point: "Narrative Routes" section in toggle panel, or a prominent card in the UI
- Animated path showing historic movement (polyline that draws itself)
- Uses same Drive mode navigation from Phase 3
- Each stop has richer narrative content than standard Drive stops — more text, context, links
- Popup at final stop:
  ```
  P-22 — Mountain Lion (2012–2022)
  Location: Griffith Park
  Notable: Crossed two LA freeways to reach
  Griffith Park, where he lived for 10 years
  as LA's most famous wild resident.

  His story changed how LA thinks about
  wildlife, infrastructure, and the hidden
  natural systems that exist alongside
  our boulevards.

  [Learn More →]
  ```
- Social sharing option: "Share the P-22 story"

---

## 4.2 — Future Narrative Routes (same engine)

Once P-22 works, the same Drive engine can power:

- **Jonathan Gold's Pico Boulevard** — his famous "Year I Ate Pico Boulevard" essay as a guided drive. Each stop is a restaurant he wrote about. Connects to L.A. Taco picks and existing public art layer. The sidebar already references this essay — the narrative route brings it to life.

- **L.A. Taco's Olympic Blvd Taco Row** — the 4-block taco crawl in Boyle Heights as a guided experience. Short, dense, high impact. Good test of the engine at small scale.

- **Pacific Electric Ghost Ride** — drive a former Red Car route, seeing what's there now vs. what was there in the 1940s. Uses ghost railway layer data from Phase 2. Could overlay historical photos at stops.

- **The Hidden Wilshire** — oil wells, storm drains, and parrots along LA's most iconic boulevard. The ultimate cross-layer narrative — one boulevard, every hidden system revealed.

Each narrative route is a JSON file with a sequence of stops, narrative text, and layer references. The Drive engine renders them all identically.

---

# PHASE 5: COMMUNITY LAYER

**Goal:** Let users mark places they love on boulevards. Over time, this becomes a crowdsourced "most loved places in LA" dataset — something that doesn't exist anywhere else.

**Dependency:** Phase 1 (boulevard story cards, deep links). The community layer enriches everything that came before — hearts show up in story cards, Drive mode, and narrative routes.

---

## 5.1 — "Love This Place" ❤️

### User Flow
1. User taps **any spot on the map** — a boulevard, an address, an existing marker (oil well, parrot sighting, taco spot, public art, anything)
2. Taps the **❤️** button
3. A heart drops at that location
4. A **customizable popup editor** appears:
   - Pre-filled with location name if tapped on an existing marker (e.g., "Komal Molino" or "Beverly Hills Oil Well")
   - Or the nearest address if tapped on an empty spot
   - User can edit the title
   - Add a personal note ("where I proposed", "best sunset in LA", "my dad's favorite spot")
   - Pick a color or emoji for their heart (default red ❤️, options: 💛💜🧡💚)
5. User taps **"Save & Share"**

### What a Heart Contains
```json
{
  "coordinates": [-118.2437, 34.0522],
  "title": "Komal Molino",
  "note": "My dad's favorite taco stand",
  "emoji": "❤️",
  "nearestBoulevard": "Grand Avenue",
  "sourceLayer": "la-taco-picks",
  "sourceMarker": "komal-molino",
  "timestamp": "2026-03-08T19:30:00Z"
}
```

No accounts, no login. Frictionless. If spam becomes a problem, add light moderation later.

### Hearting Existing Markers
When a user hearts an existing marker (oil well, parrot sighting, taco pick, public art, etc.):
- The popup pre-fills with that marker's name and info
- The heart links back to the source layer — so heart data knows "42 people loved this oil well"
- This creates per-marker love counts over time

### Display
- Heart markers on the map (small, doesn't overwhelm other layers)
- Hearts cluster when zoomed out — denser clusters = more loved areas
- Toggle label: "❤️ Loved Places" (under a new "Community" group)
- Popup on click shows the user's custom content:
  ```
  ❤️ Komal Molino
  "My dad's favorite taco stand"
  On Grand Avenue
  March 2026
  ```

### Boulevard Story Card Integration
Add a heart count to the story card (Phase 1.4):
```
Pico Boulevard

📍 Length: 23 miles
🎭 Theatres: 8
🎨 Public art: 14
❤️ Loved by: 142 people
```

---

## 5.2 — Downloadable Heart Image

### User Flow
1. After placing a heart, or when viewing any heart on the map, user taps **"Get Image →"**
2. Gets a shareable image with:
   - The dark map zoomed to the heart location
   - The heart marker prominently displayed
   - The user's custom popup content rendered as a card overlay
   - The boulevard highlighted if the heart is on one
   - Clean typography, ready for Instagram/sharing/printing

### Customizable Popup in the Image
The popup card in the generated image mirrors what the user wrote:
```
┌─────────────────────────────────┐
│          ❤️                      │
│  Komal Molino                   │
│  "My dad's favorite taco stand" │
│                                  │
│  Grand Avenue · Los Angeles     │
│  Boulevard Love · BlvdLove.LA   │
└─────────────────────────────────┘
```

User can customize before downloading:
- Edit title and note text
- Choose popup style (minimal, card, full-bleed)
- Choose background (dark map default, satellite, or boulevard-only with no surrounding context)

### Output Formats
- Instagram story (9:16)
- Square post (1:1)
- Poster / print (2:3)
- Desktop wallpaper (16:9)

### Implementation
- Client-side rendering with HTML canvas / `html2canvas` or Mapbox static image API + overlay
- User customizations are just DOM changes before the canvas capture
- Share directly to Twitter/Reddit/Instagram or download as PNG

---

## 5.3 — Print Your Boulevard

**Separate from individual hearts** — this is the full boulevard poster.

### User Flow
1. User is viewing a boulevard story card, or has just finished a Drive (Phase 3)
2. Taps **"Print this boulevard →"**
3. Gets a printable poster:
   - The full boulevard highlighted on the dark map
   - All heart markers from the community layer along that boulevard
   - Stats (length, layer counts, heart count)
   - Clean typography, frameable

### Why This Matters
- Physical artifact people hang on a wall or share on Instagram
- The hearts make each print unique — your boulevard with the places people love on it
- Over time, a boulevard poster with 500 hearts tells a story that no other map can

### Implementation
- Same rendering pipeline as 5.2 but zoomed out to the full boulevard extent
- Preset aspect ratios: Instagram story (9:16), poster (2:3), desktop wallpaper (16:9)
- Minimal design — dark background, boulevard in white/gold, hearts in red, stats in small type at the bottom

---

## 5.3 — Aggregate: Most Loved Places in LA

Over time, the heart data becomes its own dataset.

**Possible views:**
- Heatmap layer: where do hearts cluster? Which blocks, which boulevards, which neighborhoods?
- Leaderboard: "Most loved boulevards" ranked by heart count
- Time-lapse: how the love map grows over weeks and months
- Stats in the hero message: "12,847 places loved by 3,200 people across 150+ boulevards"

**Data storage:**
- Simple backend: hearts are just coordinates + optional text + timestamp
- Could start with a lightweight service (Firebase, Supabase, or even a Google Sheet as a backend for v1)
- Export as open data — let others build on the community dataset

**Moderation:**
- Start without moderation, add it if needed
- Flag notes with profanity filter
- Rate limit submissions by IP or session to prevent spam floods

---

# REFERENCE

## Layer Toggle Structure (final state)
```
Explore
  ├── Boulevard
  ├── Sunset Strip
  ├── Traffic camera
  ├── Public art
  └── Theatre

Hidden Infrastructure
  ├── 🛢️ Hidden Oil Wells        ✅ live
  ├── 🚋 Ghost Railway           Phase 2
  └── ⚫ Storm Drains             Phase 2

Living City
  ├── 🦜 Wild Parrots            ✅ live
  ├── 🐾 Urban Wildlife          Phase 2
  └── 🌮 L.A. Taco Picks         Phase 2

Narrative Routes                 Phase 4
  └── 🦁 P-22: The Lion of Los Angeles

Community                        Phase 5
  └── ❤️ Loved Places
```

## Attribution
- CalGEM / California Department of Conservation (oil wells)
- iNaturalist / Occidental College Moore Lab of Zoology (parrots)
- OpenStreetMap contributors (ghost railway, storm drains)
- LA County GIS (storm drains)
- California Department of Fish & Wildlife (wildlife)
- L.A. Taco — https://lataco.com (editorial taco picks)
- The Militant Angeleno (PE archaeology map reference)

## Data Refresh Cadence
- Oil wells: quarterly (CalGEM updates regularly)
- Parrots: quarterly (iNaturalist grows continuously)
- Storm drains: static (infrastructure doesn't change often)
- Ghost railway: static (historical routes don't change)
- Urban wildlife: quarterly (new sightings)
- L.A. Taco: annually (new list drops Oct–Dec)
- P-22 + narrative routes: static (memorial/editorial content)

## Design Principles
- All layers toggleable independently
- Popups and tooltips are story-driven, concise, curiosity-focused
- Mobile-first: layers and Drive mode fully usable on small screens
- Hidden systems + narrative storytelling = 99% Invisible urban atlas
- Each layer should make the user say "I had no idea that was there"
