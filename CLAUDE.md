# Manhole Tracker

Monorepo: `apps/mobile` (React Native/Expo SDK 54, Expo Router) + `apps/backend` (Node/Express/PostGIS).

Full system specification: see `manhole-tracker-spec.md` at repo root — read this before making architectural decisions.

Key constraints:
- Do not add @react-navigation/* as direct deps in apps/mobile — Expo Router manages navigation.
- Shared constants/types live in packages/shared.