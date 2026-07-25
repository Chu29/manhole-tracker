# Manhole Tracker — Admin Dashboard

Next.js (App Router) admin console: sign in, view manholes on a map, add/edit
records, and delete them. Built to drop into the existing monorepo as
`apps/admin`.

## Install into the monorepo

```bash
# from the monorepo root
cp -r admin-dashboard apps/admin
npm install   # npm workspaces will pick up apps/admin automatically
```

Add a root-level script if useful:

```json
"scripts": {
  "dev:admin": "npm run dev --workspace=apps/admin"
}
```

## Before running

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to
   your Express backend's base URL.
2. **Reconcile `lib/api.ts` against your actual backend.** The routes and
   `Manhole` fields here (`code`, `status`, `latitude`, `longitude`,
   `description`, `last_inspected_at`) are best-guess names based on the
   PostGIS schema described in project notes — swap in the real column/route
   names, or better, import shared types from `packages/shared` if you
   define the `Manhole` shape there so mobile and admin can't drift apart.
3. Confirm the login route (`POST /auth/login`) returns `{ token }` — if your
   backend's auth response shape differs, adjust `login()` in `lib/api.ts`.

## What's here

- **Auth:** JWT stored in a cookie (`manhole_admin_token`), attached via an
  axios interceptor, `middleware.ts` gates `/manholes/*` behind it.
- **Manholes list (`/manholes`):** toggle between a Leaflet map (colored by
  status) and a data table.
- **Add (`/manholes/new`) / Edit (`/manholes/[id]`):** shared form component,
  edit page also supports delete.
- **Design:** dark "blueprint" surface (ink-blue background, cyan grid,
  amber accent), monospace for IDs/coordinates, and a manhole-cover glyph
  (`StatusPip`) used as the recurring status motif across map, table, and
  form.

## Not yet wired up

- Inspection log view (you mentioned inspection logging exists on the
  backend — this dashboard only covers manhole CRUD for now).
- Photo display (backend photo upload is still stubbed at 501 per project
  notes).
- Pagination/search on the manholes list — fine for a capstone demo dataset,
  will want it if the table grows large.
