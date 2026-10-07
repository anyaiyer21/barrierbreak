# Real map with real walking routes

Replace the drawn schematic city with an actual map of Sammamish, place every barrier, home
area and destination at a real street location, and draw unlocked trips along real walking
paths instead of straight lines.

## What changes on screen

- **Planner** (`/`) and **Unlock a Journey** (`/journey`) sit on a real, deliberately quiet
  map: muted streets, no business pins, no clickable points of interest. Our own markers,
  barriers and routes sit on top.
- **Unlocked trips follow real sidewalks and streets** — the animated green line traces the
  actual walking path a resident would take, corner by corner.
- **Comparison** (`/compare`) keeps its small map thumbnails, on the real map.
- **The complementarity diagram stays a diagram.** The A / B / A+B panel in the inspector is
  an argument, not a place; a real map would only add noise there.
- **The synthetic-data warning gets louder.** A realistic map makes invented barriers look
  like a real city inventory, so the "illustrative data" badge moves onto the map itself, not
  just the page header, and every inspector panel keeps its evidence label.

## Placing the real locations

Every point in the scenario gets a real latitude and longitude, hand-placed against actual
Sammamish geography:

- Intersections along 212th, 218th, 228th, 240th and 244th Ave SE crossed with SE 4th, 8th,
  20th and 24th St.
- Destinations: Sammamish Library, City Hall, Pine Lake Park, the transit stops on 228th,
  Discovery Elementary and the schools in the scenario.
- Home areas: the five neighbourhood clusters, positioned on real residential streets.

The barrier list, costs, household counts and unlocked-trip numbers stay exactly as they are —
only the geography becomes real. The flagship moment (two repairs on 228th Ave SE that unlock
0 alone and 418 together) keeps its numbers and lands on the actual 228th corridor.

## Real walking paths, without a live bill

Walking directions are requested once, during the build, and frozen into the project as
saved route shapes. Nothing calls the mapping service while someone is using the app.

Why: it keeps the demo identical in every meeting (same lines, same timing, no network
hiccup on stage), it costs nothing to run, and it can't fail in front of an audience. If a
route can't be resolved, it falls back to a clean line between points and the app still works.

## Technical notes

- Add the Google Maps connector (no account setup needed). Map rendering uses the browser
  key; Routes API calls go through the server-side gateway, never the browser.
- `PlanNode`, `OriginArea` and `Destination` gain `lat`/`lng`. Existing `x`/`y` stay so the
  schematic diagram keeps working.
- New `src/components/map/GeoMap.tsx` renders Google Maps JS API with `clickableIcons: false`,
  no `mapId`, `loading=async` + callback, and a muted style array. It loads lazily behind
  `<ClientOnly>` so SSR is untouched.
- Overlays (barriers, repairs, origins, destinations, routes) draw in an SVG layer positioned
  by the map's projection, so the current animation and dash/shape language carry over
  unchanged. `NetworkMap`'s phase API (`before | evaluating | selecting | unlocking | after`),
  focus behaviour and screen-reader status text are preserved as the same props.
- Camera work uses `fitBounds` / `panTo` in place of the hand-rolled viewBox maths.
- A one-off script calls `routes/directions/v2:computeRoutes` in `WALK` mode through the
  gateway for each witness route, decodes the polyline, and writes
  `src/data/walkPaths.ts`. The map reads only that file at runtime.
- `NetworkMap.tsx` is kept for the compact comparison thumbnails and as the fallback if the
  map fails to load.

## Build order

1. Connect Google Maps.
2. Add real coordinates to the scenario data; verify each one against the real street.
3. Build `GeoMap` with the overlay layer and camera control.
4. Generate and freeze the walking paths.
5. Port the planner, then journey, then comparison thumbnails.
6. Re-tune the disclaimer placement, then browser-check all four screens.

## What I'd flag

Real streets make the map busier than the current schematic. I'll keep the basemap desaturated
and the labels sparse so the barriers and the unlocked route stay the loudest things on screen —
but if it ends up competing with the flagship moment, the schematic is still there to fall back to.
