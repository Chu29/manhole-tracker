# Manhole Tracker — System Specification

## 1. Project Overview

**Problem Statement:** Field technicians struggle to locate manholes that have become hidden due to dirt accumulation, road resurfacing, or construction. This makes routine maintenance and inspection difficult and time-consuming.

**Solution:** A mobile application that registers manhole locations via GPS at install/survey time, then helps technicians relocate them in the field through a proximity-ranked list and (stretch goal) AR-guided navigation.

**Project Type:** Final Year B.Tech Software Engineering Project

**Core Differentiator ("automated filtering"):** As a technician physically moves through a site, nearby manholes automatically re-sort in a list — the closest manhole always bubbles to the top — without manual searching or filtering.

---

## 2. Scope

### MVP (must work end-to-end for grading/demo)
- Technician authentication (login/register)
- Manhole registration: GPS coordinates, photo, metadata
- Geospatial "nearby manholes" query from backend
- Proximity-ranked list that auto-updates as technician moves
- Manhole detail view
- Inspection logging
- Offline caching of nearby manholes + offline write queue with sync-on-reconnect

### Stretch Goals (attempt after MVP is stable)
- AR camera overlay pointing toward a selected manhole's GPS location
- ML-based image classification of manhole condition (cracked/damaged/corroded) from registration/inspection photos
- Admin web dashboard for bulk management

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Repo layout | npm workspaces monorepo | `apps/mobile`, `apps/backend`, `packages/shared`. All packages are ESM (`"type": "module"`). |
| Language | TypeScript (mobile, `strict`); JS/ESM (backend, shared) | Mobile source files are `.tsx`/`.ts` with kebab-case names (Expo template convention). |
| Frontend | React Native via Expo (SDK 54) | Uses **Expo Router** (file-based routing). Expo Router manages React Navigation internally — see constraint below. ✅ installed |
| State Management | Zustand | Lightweight, no boilerplate. ✅ installed |
| HTTP client | axios | `api/client.ts` instance + interceptors. ✅ installed |
| Backend | Node.js + Express 5 | REST API. ✅ installed |
| Database | PostgreSQL + PostGIS extension | Geospatial queries via `ST_DWithin` / `ST_Distance`, GiST index on location column. |
| DB driver / queries | `pg` with **raw SQL** | ✅ `pg` installed. Sequelize/Prisma intentionally not used — Prisma's PostGIS support is limited; raw SQL keeps the geo query explicit. |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` | Email/password login. ✅ installed |
| File upload | `multer` (multipart) → S3 / Cloudinary / Firebase Storage | Do NOT store images in Postgres; persist only `photo_url`. ✅ multer installed; storage provider TBD |
| Local Storage | AsyncStorage | Caching nearby manholes + offline write queue. ✅ installed |
| Network status | `@react-native-community/netinfo` | Detect connectivity for offline handling. ✅ installed |
| Maps | react-native-maps | Map view screen. ⏳ not yet installed |
| AR (stretch) | ViroReact | Geolocation-anchored AR overlays. ⏳ not yet installed |

**Important constraint:** `expo-router` is intended to be the sole navigation layer — Expo Router manages React Navigation internally, so `@react-navigation/*` should NOT be added as direct dependencies. ⚠️ **Current reality:** the Expo template scaffold already ships `@react-navigation/{native,bottom-tabs,elements}` as direct deps and `app/_layout.tsx` imports `ThemeProvider` from `@react-navigation/native`. Treat removal as a cleanup goal; do not add new `@react-navigation/*` deps. Navigation is defined via the file structure in `apps/mobile/app/`.

---

## 4. Data Model

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  org_id UUID,
  role TEXT DEFAULT 'technician',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE manholes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  utility_type TEXT CHECK (utility_type IN ('sewer','electrical','telecom','water')),
  depth_meters NUMERIC,
  status TEXT DEFAULT 'active',
  photo_url TEXT,
  install_date DATE,
  last_inspected_at TIMESTAMPTZ,
  last_inspected_by UUID REFERENCES technicians(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX manholes_location_idx ON manholes USING GIST (location);

CREATE TABLE inspection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manhole_id UUID REFERENCES manholes(id),
  technician_id UUID REFERENCES technicians(id),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Backend API Specification

Base URL: `/api`

### Auth
```
POST   /auth/register      { name, email, password, orgId? }
POST   /auth/login         { email, password } → { token, technician }
```

### Manholes
```
POST   /manholes                              (auth required)
  body: { code, lat, lng, utilityType, depthMeters, photoUrl, installDate }

GET    /manholes/nearby?lat=&lng=&radius=     (auth required)
  → returns array sorted by distance, including distance_meters per item

GET    /manholes/:id                          (auth required)

PATCH  /manholes/:id                          (auth required)
```

### Inspections
```
POST   /manholes/:id/inspections              (auth required)
  body: { notes, photoUrl }

GET    /manholes/:id/inspections               (auth required)
```

### Core Geospatial Query (used by `/manholes/nearby`)
```sql
SELECT
  id, code, utility_type, status, photo_url,
  ST_Y(location::geometry) AS lat,
  ST_X(location::geometry) AS lng,
  ST_Distance(location, ST_MakePoint($1, $2)::geography) AS distance_meters
FROM manholes
WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
ORDER BY distance_meters ASC;
```
`$1` = lng, `$2` = lat, `$3` = radius in meters.

---

## 6. Frontend Architecture

### 6.1 Project Structure

The repo is an **npm-workspaces monorepo**. Top level:

```
manhole-tracker/
├── package.json                      # workspaces: apps/*, packages/*
├── manhole-tracker-spec.md
├── apps/
│   ├── mobile/                       # Expo SDK 54 app (see tree below)
│   └── backend/                      # Express + PostGIS REST API
└── packages/
    └── shared/                       # @manhole-tracker/shared — cross-package constants/types
        └── constants.js              # REFETCH_THRESHOLD_METERS, LOCAL_RESORT_INTERVAL_METERS,
                                      #   DEFAULT_RADIUS_METERS, UTILITY_TYPES  ✅ exists
```

**`apps/mobile`** — Expo Router routes live under `app/` (NOT `src/app/`). Files are TypeScript with
kebab-case names. ✅ = scaffolded today, ⏳ = planned per this spec:

```
apps/mobile/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # ✅ root layout (add auth gate ⏳)
│   ├── (tabs)/                       # ✅ template tabs — to be replaced by app screens below
│   ├── (auth)/                       # ⏳ login.tsx, register.tsx
│   ├── nearby/                       # ⏳ index.tsx (proximity list), [id].tsx (detail), ar-locator.tsx
│   ├── map/                          # ⏳ index.tsx
│   ├── register-manhole/             # ⏳ index.tsx
│   └── profile/                      # ⏳ index.tsx
├── components/                       # ✅ themed-* template comps; ⏳ manhole-list-item, distance-badge,
│                                     #     offline-banner, photo-capture
├── hooks/                            # ✅ use-color-scheme, use-theme-color
├── constants/theme.ts                # ✅ colors/theme (spec's old src/theme/colors.js)
├── api/                              # ⏳ client.ts (axios + interceptors), auth.ts, manholes.ts
├── store/                            # ⏳ use-auth-store, use-manhole-store, use-location-store
├── services/                         # ⏳ location-service, offline-queue, geo (haversine, bearing)
└── utils/                            # ⏳ storage.ts (AsyncStorage helpers)
```

> Shared numeric thresholds (`REFETCH_THRESHOLD_METERS`, `DEFAULT_RADIUS_METERS`, …) are **not**
> redefined in the mobile app — import them from `@manhole-tracker/shared` so client and server agree.

**`apps/backend`** — `src/index.js` (⏳ currently empty; build per §5). Suggested: `routes/`, `db/`
(pg pool + the §5 geo query), `middleware/` (JWT auth), `controllers/`.

### 6.2 Location & Proximity-List Logic (core feature)

**Two-tier update system:**
1. **Local re-sort tier** — `watchPositionAsync` with `distanceInterval: 5` (meters) triggers a client-side re-sort of the already-cached manhole list using Haversine distance. This is instant, cheap, and gives smooth real-time UX.
2. **Server re-fetch tier** — Only re-call `GET /manholes/nearby` when the technician has moved ≥15 meters from the location of the last successful fetch. This avoids unnecessary network calls while keeping data fresh.

```js
// These live in packages/shared/constants.js — import, don't redefine:
//   import { REFETCH_THRESHOLD_METERS, LOCAL_RESORT_INTERVAL_METERS, DEFAULT_RADIUS_METERS }
//     from '@manhole-tracker/shared';

function handleLocationUpdate(coords) {
  resortCachedList(coords);  // tier 1: always

  const distanceMoved = lastFetchLocation
    ? haversineDistance(lastFetchLocation, coords)
    : Infinity;

  if (distanceMoved >= REFETCH_THRESHOLD_METERS) {
    fetchNearbyManholes(coords);  // tier 2: gated
  }
}
```

### 6.3 Offline Strategy
- On app launch, hydrate cached manhole list from `AsyncStorage` immediately (before GPS lock or network response) so UI is never empty.
- Use `NetInfo` to detect connectivity; skip server calls gracefully when offline, fall back to cache + local re-sort.
- Queue offline **writes** (new manhole registrations, inspection logs) in `AsyncStorage`; flush to server when connectivity returns. Use client-generated UUIDs for idempotency.

### 6.4 State Management (Zustand stores)
- `useAuthStore` — token, current technician, login/logout actions
- `useLocationStore` — currentLocation, watch subscription lifecycle
- `useManholeStore` — cachedManholes, sortedList, fetchNearbyManholes(), resortCachedList()

---

## 7. Non-Functional Requirements
- **Offline-first:** App must remain usable (read-only on cached data) without connectivity.
- **Battery efficiency:** Location accuracy/update intervals must be justified and benchmarked (`Accuracy.High` vs `Balanced` tradeoff) — document in final report.
- **Performance:** Geospatial queries must use GiST index; avoid client-side filtering of full manhole datasets.
- **Security:** Passwords hashed (bcrypt), JWT-protected endpoints, no secrets committed to repo.

---

## 8. Known Environment Constraints
- Project pinned to **Expo SDK 54** for Expo Go compatibility (SDK 56 caused `Incompatible SDK version` errors with current Expo Go release).
- `@react-navigation/*` packages should NOT be added as direct dependencies — Expo Router (file-based routing in `apps/mobile/app/`) handles navigation internally. Note: the current template scaffold still ships these as direct deps (see §3) — treat removal as a cleanup goal, not an invariant that already holds.
- Development/testing primarily on physical Android device via Expo Go (emulator GPS is simulated and less representative of field conditions).

---

## 9. Suggested Build Order
1. Backend: schema + migrations + auth endpoints (testable via Postman)
2. Backend: `/manholes` CRUD + `/manholes/nearby` geospatial query
3. Frontend: auth flow (`(auth)` route group) wired to backend
4. Frontend: manhole registration screen (GPS capture + photo upload)
5. Frontend: `useLocationStore` + `locationService` (two-tier update logic)
6. Frontend: `useManholeStore` + proximity-ranked list screen
7. Frontend: offline caching + write queue
8. Frontend: manhole detail + inspection logging
9. Frontend: map view screen
10. Stretch: AR locator screen
11. Stretch: ML condition classification