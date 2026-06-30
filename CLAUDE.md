# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Manhole Tracker

Monorepo (npm workspaces): `apps/mobile` (React Native / Expo SDK 54, Expo Router) + `apps/backend` (Node/Express/PostGIS) + `packages/shared` (constants/types). Everything is ESM (`"type": "module"`).

Full system specification: see `manhole-tracker-spec.md` at repo root — read this before making architectural decisions. It defines the data model, REST API surface, the two-tier proximity-list logic, and the offline strategy.

## Current state vs. spec

The spec is the target design; the repo is still scaffolding. Be aware:
- `apps/backend/src/index.js` is **empty** — no server, routes, or DB code exist yet despite the deps being installed. Build the API per spec §5.
- `apps/mobile` is still the **default Expo template** (`app/(tabs)/index.tsx`, `explore.tsx`, `modal.tsx`, themed components). None of the spec's screens (`(auth)`, `nearby`, `register-manhole`, etc.), Zustand stores, or services exist yet. The spec's `src/app/` layout is aspirational — the actual router root is `apps/mobile/app/`.

## Commands

From repo root:
- `npm run mobile` — start Expo dev server (`expo start` in apps/mobile)
- `npm run backend` — start backend in watch mode (`nodemon` on apps/backend)

In `apps/mobile`:
- `npm run lint` — `expo lint` (ESLint, `eslint-config-expo`)
- `npm run android` / `npm run ios` / `npm run web` — platform-targeted starts

In `apps/backend`:
- `npm run dev` (nodemon, hot reload) / `npm start` (plain node)

No test runner is configured in any workspace yet — there is no working `npm test`.

## Architecture notes

- **Shared package:** `packages/shared` is linked in the workspace under the scoped name `@manhole-tracker/shared` (not a relative path). Import as `import { DEFAULT_RADIUS_METERS } from '@manhole-tracker/shared'`. Both apps declare it as a `"*"` dependency. Constants that must agree between client and server (proximity thresholds, `UTILITY_TYPES`) live here — keep them single-sourced, don't redefine locally.
- **Mobile routing:** Expo Router, file-based, rooted at `apps/mobile/app/`. Path alias `@/*` maps to the app root (see `tsconfig.json`). New screen files use **kebab-case** (e.g. `themed-text.tsx`), matching the existing Expo template convention.
- **Backend geospatial:** PostgreSQL + PostGIS. The `/manholes/nearby` query uses `ST_DWithin` / `ST_Distance` against a `GEOGRAPHY(POINT,4326)` column with a GiST index — see spec §5 for the exact query and param order (`$1`=lng, `$2`=lat, `$3`=radius m). Avoid Prisma for geo queries (spec); use raw SQL via `pg`.

## Constraints & gotchas

- **`@react-navigation/*` as direct deps:** the spec and intent say these must NOT be direct deps in `apps/mobile` (Expo Router manages navigation internally). However, the current Expo template already ships `@react-navigation/{native,bottom-tabs,elements}` in `apps/mobile/package.json`, and `app/_layout.tsx` imports `ThemeProvider` from `@react-navigation/native`. Treat removing/avoiding these as the goal; do not add new ones, and prefer Expo Router APIs.
- **Expo SDK 54 is pinned** for Expo Go compatibility — do not upgrade. Before writing mobile code, consult the versioned docs at https://docs.expo.dev/versions/v54.0.0/ (per `apps/mobile/AGENTS.md`).
- **Images** are stored in object storage (S3/Cloudinary/Firebase), never in Postgres — store only `photo_url`.
- Secrets via `.env` (gitignored); JWT-protected endpoints; bcrypt password hashing.
