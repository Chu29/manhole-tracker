-- Manhole Tracker — schema (spec §4)
-- Run via `npm run migrate --workspace=apps/backend`

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  org_id UUID,
  role TEXT DEFAULT 'technician',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manholes (
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

CREATE INDEX IF NOT EXISTS manholes_location_idx ON manholes USING GIST (location);

CREATE TABLE IF NOT EXISTS inspection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manhole_id UUID REFERENCES manholes(id),
  technician_id UUID REFERENCES technicians(id),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);