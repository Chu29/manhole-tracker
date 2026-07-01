# Manhole Tracker — Backend

Express 5 + PostgreSQL/PostGIS REST API, per `manhole-tracker-spec.md` §5.

## Setup

```bash
# from the monorepo root
npm install
cp apps/backend/.env.example apps/backend/.env
# edit apps/backend/.env — set DATABASE_URL and JWT_SECRET at minimum

# DATABASE_URL must point at a Postgres instance where you can create the
# postgis extension (CREATE EXTENSION IF NOT EXISTS postgis;) — most managed
# Postgres providers support this, but check yours allows extensions.

npm run backend:migrate   # creates tables + GiST index
npm run backend:dev       # starts on PORT (default 3000), auto-restarts on change
```

## Note on bcrypt

The spec listed `bcrypt` (native binding) for password hashing. This implementation
uses native **`bcrypt`** for password hashing via `hash` and `compare` in
`src/controllers/auth.controller.js`.

## Endpoints implemented

All routes from spec §5: `/auth/register`, `/auth/login`, `/manholes` (POST),
`/manholes/nearby` (GET), `/manholes/:id` (GET/PATCH), `/manholes/:id/inspections`
(POST/GET). Plus `/api/health` and a stub `/api/uploads/photo` (multer wired up,
storage provider intentionally left as TODO since spec marks it "TBD" — see
comments in `src/routes/uploads.routes.js`).

## Project layout

```
src/
├── index.js                 # app entry, route mounting, error handler
├── db/
│   ├── pool.js               # pg Pool + query()/withTransaction() helpers
│   ├── schema.sql             # spec §4 schema (idempotent, IF NOT EXISTS)
│   └── migrate.js            # runs schema.sql against DATABASE_URL
├── middleware/
│   ├── auth.js                # requireAuth — verifies JWT, sets req.technician
│   ├── async-handler.js       # wraps async route handlers
│   └── error-handler.js       # central error handler + HttpError class
├── controllers/
│   ├── auth.controller.js
│   ├── manhole.controller.js  # includes the ST_DWithin/ST_Distance query
│   └── inspection.controller.js
└── routes/
    ├── auth.routes.js
    ├── manholes.routes.js
    └── uploads.routes.js
```

## Things still open (intentionally, per spec)

- **Storage provider** for photos (S3 / Cloudinary / Firebase) — not picked yet.
  `/api/uploads/photo` validates and buffers the file then 501s with a clear
  TODO; wire in whichever SDK once decided.
- **org-scoping / role checks** beyond "must be logged in" — spec doesn't define
  authorization rules between technicians/orgs yet, so every authenticated
  technician can currently read/write every manhole. Tighten this once the
  spec defines org boundaries.
