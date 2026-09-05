# Plan 01 — Person location visible on the map (LANDSIGHT AI)

**Goal:** The map should show (1) the viewer's own live GPS location and (2) citizen-reporter positions, both rendered as *person* markers. Forked for execution in new chat contexts; each phase is self-contained.

**Requirements (from user):**
- Source = the **viewer's own location** (browser geolocation) *and* **citizen report reporter positions**.
- Precision = **live GPS accuracy** (`enableHighAccuracy`, accuracy circle, updates while moving).

**Files touched:** exactly one — `frontend/src/components/map/LandslideMap.tsx` (per memory: *prefer existing files*; MapWrapper.tsx stays as-is because it already disables SSR). No backend, no type, no data changes: `CitizenReport` already has `reporter_name` + `latitude`/`longitude` (`frontend/src/types/index.ts:52-70`).

---

## Phase 0 — Documentation discovery (consolidated findings)

### Stack facts (verified this session)
- Map = vanilla **Leaflet 1.9.4**, no react-leaflet. Single map component: `frontend/src/components/map/LandslideMap.tsx` (`import L from 'leaflet'` at line 4). SSR-safe wrapper `MapWrapper.tsx:15` (`dynamic(..., { ssr: false })`) — **all Leaflet + geolocation code must live in LandslideMap.tsx**.
- Map init + 5 layer groups: `LandslideMap.tsx:82-105`. Main feature effect clears them every render: `:156-166`. Rendering patterns: polygons `:169-233`, pulse divIcon markers `:236-266`, citizen report divIcon markers `:269-323` (marker icon `:276-288`, popup `:292-319`), corridors polylines `:327-343`, rain-gauge divIcon tags `:347-364`. Theme glyph constants (inline SVG strings) at `:29-30` (`CAMERA_GLYPH`, `DROPLET_GLYPH`). `Navigation` lucide icon already imported at line 8.
- Data flow: map receives hardcoded `INITIAL_MONITORING_ZONES` / `INITIAL_CITIZEN_REPORTS` (from `frontend/src/lib/ner-data.ts`) via Dashboard → MapWrapper → props (`citizenReports: CitizenReport[]`) — NOT the backend. So this plan needs **no backend work**; reporter identity already exists in the data.

### Allowed APIs (doc-grounded)
- **`map.locate(options)`** / **`map.stopLocate()`** — Leaflet 1.9.4 Reference § Map.LocateMethods. Options: `watch` (W3C `watchPosition`, continuous), `setView`, `maxZoom`, `timeout` (default 10000), `maximumAge` (default 0), `enableHighAccuracy` (W3C high accuracy). **Requires HTTPS or localhost** (modern Chrome 50+; dev `localhost:3000` is fine).
- Events fired by `map.locate()`: **`locationfound`** → `e.latlng`, `e.accuracy` (meters), `e.altitude`, `e.altitudeAccuracy`, `e.heading`, `e.speed`, `e.timestamp`; **`locationerror`** → `e.code` (1=`PERMISSION_DENIED`, 2=`POSITION_UNAVAILABLE`, 3=`TIMEOUT`), `e.message`.
- **`L.circle(latlng, { radius, color, weight, fillColor, fillOpacity })`** — path-options pattern already used for polygons in the file.
- **`L.divIcon({ className, html, iconSize, iconAnchor })`** — proven at `:242-256` and `:276-288`.
- **`L.marker(latlng, { icon })`**, **`layer.addLayer(marker)`**, **`layerGroup()`**, **`marker.bindPopup(html, { maxWidth })`** — proven at `:258`, `:290`, `:321`.

### Anti-patterns to avoid (grep-able guards)
- ❌ Import `react-leaflet` or any new dependency.
- ❌ Put geolocation/Leaflet code in a server-rendered component (SSR window crash) — keep it inside LandslideMap.
- ❌ `setView: true` unless recenter-on-every-fix is explicitly wanted (overrides user pans). Plan uses `setView:false` + one recenter on first fix.
- ❌ Clear the live-location marker in the main feature effect's `clearLayers()` (`:162-166`) — it would vanish on every zone/report re-render. Keep the viewer marker in its own `people` layer group **outside** that clear block.
- ❌ Add a *second* overlapping marker at a report's lat/lng — change the existing report glyph in place instead.
- ❌ Leave `map.locate({watch:true})` unbounded — must call `map.stopLocate()` + `map.off(...)` on disable/unmount, or the watcher leaks.
- ❌ Interpolate raw user strings (`reporter_name`, `description`) into popup HTML without escaping — escape before templating.

---

## Phase 1 — Viewer live location: "You are here" marker

**What to implement (copy, don't rewrite):**
1. **Add a 6th layer group.** Copy the pattern at `LandslideMap.tsx:92-97` (`const people = L.layerGroup().addTo(map);`) and add `people` to `layerGroupsRef` (`:99-105`) and the `layerGroupsRef` type (`:42-48`). **Do NOT** add `people` to the `clearLayers()` list at `:162-166`.
2. **Add `PERSON_GLYPH` / `CURRENT_LOCATION_GLYPH`** SVG const beside `CAMERA_GLYPH` (`:29`) — a simple head-and-shoulders person path, stroke-width 1.8, matching the existing glyph idiom.
3. **Add state** (`useState`, mirroring `activeLayers` at `:51-57`): `locate: 'off' | 'locating' | 'active' | 'error'`, `locAccuracy: number | null`, `locError: string | null`. Add refs `userMarkerRef`, `userCircleRef` (mirroring `tileLayerRef` at line 49).
4. **Add a "My location" control button.** Overlay `<button>` (absolute, bottom-right above the `L.control.zoom({ position: 'bottomright' })` at `:90`), styled like the existing `topo-panel` buttons (`:493-513` basemap buttons pattern), using the already-imported `Navigation` lucide icon (`:8`). Toggling it starts/stops the geolocation watch and shows active state styling.
5. **Add the geolocation `useEffect`** (keyed on the `locate` state):
   - **Start:** reference `mapInstanceRef.current`; call `map.locate({ watch: true, setView: false, enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 })`.
   - **`locationfound` handler:** on first fix, build a `L.divIcon` person marker (copy `:276-288` shape → severity-free teal/white "you are here" dot with a subtle ring) and `L.circle(e.latlng, { radius: e.accuracy, color:'#58bca0', weight:1.5, fillColor:'#58bca0', fillOpacity:0.08 })`, both `layers.people.addLayer(...)`, store in refs, and `map.flyTo(e.latlng, 13, { duration: 1.2 })` **once**. On every later fix: `userMarkerRef.current.setLatLng(e.latlng)` and `userCircleRef.current.setRadius(e.accuracy)`; set `locAccuracy = e.accuracy`; set `locate='active'`. This is the "live GPS accuracy" behavior — the marker tracks movement and the accuracy halo resizes.
   - **`locationerror` handler:** map `e.code` (1/2/3) to a human message (permission denied / unavailable / timeout), `setLocError`, `setLocate('error')`; call `map.stopLocate()`, `layers.people.clearLayers()`, reset refs. Never crash.
   - **Cleanup (return):** `map.off('locationfound'...)`, `map.off('locationerror'...)`, `map.stopLocate()`, `layers.people.clearLayers()`.
6. **Add a status chip** near the layer switcher (`:420-517`) showing `GPS ±{locAccuracy}m` while active, presented dimensions while locating, and `locError` on error — reuse the `topo-panel` chip style (`:402-416`).

**Verification checklist (Phase 1):**
- `npm run build` type-checks clean.
- `npm run dev` → click "My location" → browser permission prompt → allow → teal person marker + accuracy circle appear; map recenters once.
- DevTools → Sensors → override geolocation to a nearby point → marker moves and `±m` accuracy label updates.
- Deny permission → readable error chip, no console exception.
- Toggle risk layers on/off → the "you are here" marker persists (proves the `people` group is outside `clearLayers()`).

**Anti-pattern guards for Phase 1:**
- No `setView: true` in the `locate` options.
- `people` group absent from the `clearLayers()` block at `:162-166`.
- `map.stopLocate()` + `map.off` in effect cleanup; verify with a grep.
- `enableHighAccuracy: true` present (this is the "live GPS accuracy" requirement).

---

## Phase 2 — Citizen reporter positions as person markers

**What to implement (copy, don't rewrite):**
1. **Swap the report marker glyph camera → person.** Inside the existing citizen-report render block (`LandslideMap.tsx:269-323`), keep the severity color logic (`:271-273` pinHex) and the severity-tinted circle sizing, but replace the inline `<svg ...camera path...>` at `:281` with the `PERSON_GLYPH` const (head + shoulders silhouette). Keep `CAMERA_GLYPH` — it stays in the popup header at `:296`.
   - This is a literal in-place edit — **no second marker**, no new layer. The `reports` layer group and `_citizenReports` toggle (`activeLayers` at `:56`) are unchanged.
2. **Expose the reporter in the popup.** In the popup template (`:292-319`), add identity under the header row (`:294-302`), e.g. `Reported by <reporter_name>` using the existing `text-paper-dim` styling (`:305` pattern). Escape `reporter_name` before interpolation.
3. *(Optional copy tweak, low churn)* Re-label the layer-switcher checkbox `Citizen Ground Pins` (`:453`) → `Field Reporter Locations` to match the new person meaning (keep the `Camera` lucide icon there).

**Why no data/backend work:** `CitizenReport` already carries `reporter_name`, `reporter_phone`, `latitude`, `longitude` (`frontend/src/types/index.ts:52-70`), and `INITIAL_CITIZEN_REPORTS` in `ner-data.ts` populates that shape. The render loop at `:269-323` draws **any** report with lat/lng, so future live-submitted reports show person markers automatically.

**Verification checklist (Phase 2):**
- `npm run build` type-checks clean.
- Map shows severity-tinted **person** markers at each report coordinate (compare with `INITIAL_CITIZEN_REPORTS` lat/lng in `ner-data.ts`).
- Click a marker → popup header shows `Reported by <reporter_name>`.
- Severity colors (Critical/High/Moderate) still differ; marker hover scale (`:280`) still works.
- Grep: exactly one marker created per report (`layers.reports.addLayer` at `:322` unchanged).

**Anti-pattern guards for Phase 2:**
- No duplicated marker at the same lat/lng in a new layer.
- No changes to `CitizenReport` type, backend, or `ner-data.ts`.
- `reporter_name` is escaped before entering the raw-HTML popup string.

---

## Phase 3 — Final verification

1. **Build & type-check:** `npm run build` from `frontend/` — must pass with zero errors.
2. **Lint:** `npm run lint` — clean (fix any introduced issues).
3. **Manual run:** `npm run dev` → map loads; walk the checklist from both phases: person reports render with reporter names; "My location" button → live teal marker + accuracy halo; override geolocation → marker moves & radius resizes; deny permission → graceful error chip; basemap Street/Dark toggle keeps the viewer marker; region fly-to keeps it too.
4. **Anti-pattern grep (each must return nothing):**
   - `react-leaflet` imports anywhere new in `LandslideMap.tsx`
   - `setView: true` inside `map.locate(` options
   - `clearLayers()` referencing the `people` group
   - any `map.locate(` call with no matching `map.stopLocate(`/cleanup
5. **Copy-ready snippets referenced (for the executor):** layer-group set `LandslideMap.tsx:92-105`, filter-ey clearLayers `:162-166`, pulse/report divIcon recipes `:236-288`, popup build `:292-319`, basemap-tab button styling `:493-513`, status chip styling `:402-416`, glyph const idiom `:29-30`.

---

### Session-boundary notes for the implementing context
- All work is in one file: `frontend/src/components/map/LandslideMap.tsx`.
- The map is data-hardcoded (offline-first); do **not** wire the backend `/api/v1/reports` GET — out of scope for "person visible" unless asked.
- If the user later adds "follow me" (continuous recenter), extend Phase 1 with a `follow` state + `map.setView(e.latlng)` inside the `locationfound` handler — do not add it now.