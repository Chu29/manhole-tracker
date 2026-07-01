import { query } from "../db/pool.js";
import { HttpError } from "../middleware/error-handler.js";
import {
  UTILITY_TYPES,
  MANHOLE_STATUSES,
  DEFAULT_RADIUS_METERS,
  MAX_RADIUS_METERS,
} from "@manhole-tracker/shared";

function parseFiniteNumber(value, fieldName) {
  const isNumberLike =
    typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "");
  if (value === null || !isNumberLike) {
    throw new HttpError(400, `${fieldName} must be a finite number`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `${fieldName} must be a finite number`);
  }
  return parsed;
}

function validateLatitude(value, fieldName = "lat") {
  const parsed = parseFiniteNumber(value, fieldName);
  if (parsed < -90 || parsed > 90) {
    throw new HttpError(400, `${fieldName} must be between -90 and 90`);
  }
  return parsed;
}

function validateLongitude(value, fieldName = "lng") {
  const parsed = parseFiniteNumber(value, fieldName);
  if (parsed < -180 || parsed > 180) {
    throw new HttpError(400, `${fieldName} must be between -180 and 180`);
  }
  return parsed;
}

function validateUtilityType(utilityType) {
  if (utilityType !== undefined && !UTILITY_TYPES.includes(utilityType)) {
    throw new HttpError(
      400,
      `utilityType must be one of: ${UTILITY_TYPES.join(", ")}`,
    );
  }
}

function validateStatus(status) {
  if (status !== undefined && !MANHOLE_STATUSES.includes(status)) {
    throw new HttpError(
      400,
      `status must be one of: ${MANHOLE_STATUSES.join(", ")}`,
    );
  }
}

function toManholeDTO(row) {
  return {
    id: row.id,
    code: row.code,
    lat: row.lat !== undefined ? Number(row.lat) : undefined,
    lng: row.lng !== undefined ? Number(row.lng) : undefined,
    utilityType: row.utility_type,
    depthMeters: row.depth_meters !== null ? Number(row.depth_meters) : null,
    status: row.status,
    photoUrl: row.photo_url,
    installDate: row.install_date,
    lastInspectedAt: row.last_inspected_at,
    lastInspectedBy: row.last_inspected_by,
    distanceMeters:
      row.distance_meters !== undefined
        ? Number(row.distance_meters)
        : undefined,
    createdAt: row.created_at,
  };
}

// POST /manholes   { code, lat, lng, utilityType, depthMeters, photoUrl, installDate }
export async function createManhole(req, res) {
  const { code, lat, lng, utilityType, depthMeters, photoUrl, installDate } =
    req.body;

  if (lat === undefined || lng === undefined) {
    throw new HttpError(400, "lat and lng are required");
  }
  const parsedLat = validateLatitude(lat);
  const parsedLng = validateLongitude(lng);
  const parsedDepthMeters =
    depthMeters !== undefined && depthMeters !== null
      ? parseFiniteNumber(depthMeters, "depthMeters")
      : null;
  validateUtilityType(utilityType);

  const { rows } = await query(
    `INSERT INTO manholes (code, location, utility_type, depth_meters, photo_url, install_date)
     VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5, $6, $7)
     RETURNING id, code,
       ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
       utility_type, depth_meters, status, photo_url, install_date,
       last_inspected_at, last_inspected_by, created_at`,
    [
      code ?? null,
      parsedLng,
      parsedLat,
      utilityType ?? null,
      parsedDepthMeters,
      photoUrl ?? null,
      installDate ?? null,
    ],
  );

  res.status(201).json(toManholeDTO(rows[0]));
}

// GET /manholes/nearby?lat=&lng=&radius=
export async function getNearbyManholes(req, res) {
  const { lat, lng } = req.query;

  if (lat === undefined || lng === undefined) {
    throw new HttpError(400, "lat and lng query params are required");
  }
  const parsedLat = validateLatitude(lat);
  const parsedLng = validateLongitude(lng);
  const radius =
    req.query.radius !== undefined
      ? parseFiniteNumber(req.query.radius, "radius")
      : DEFAULT_RADIUS_METERS;
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new HttpError(400, "radius must be a positive number");
  }
  const clampedRadius = Math.min(radius, MAX_RADIUS_METERS);

  const { rows } = await query(
    `SELECT
       id, code, utility_type, status, photo_url,
       ST_Y(location::geometry) AS lat,
       ST_X(location::geometry) AS lng,
       ST_Distance(location, ST_MakePoint($1, $2)::geography) AS distance_meters
     FROM manholes
     WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
     ORDER BY distance_meters ASC`,
    [parsedLng, parsedLat, clampedRadius],
  );

  res.json(rows.map(toManholeDTO));
}

// GET /manholes/:id
export async function getManholeById(req, res) {
  const { rows } = await query(
    `SELECT id, code,
       ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
       utility_type, depth_meters, status, photo_url, install_date,
       last_inspected_at, last_inspected_by, created_at
     FROM manholes WHERE id = $1`,
    [req.params.id],
  );

  if (!rows[0]) throw new HttpError(404, "Manhole not found");
  res.json(toManholeDTO(rows[0]));
}

// PATCH /manholes/:id
const PATCHABLE_FIELDS = {
  code: "code",
  utilityType: "utility_type",
  depthMeters: "depth_meters",
  status: "status",
  photoUrl: "photo_url",
  installDate: "install_date",
};

export async function updateManhole(req, res) {
  const updates = [];
  const values = [];
  let i = 1;

  validateUtilityType(req.body.utilityType);
  validateStatus(req.body.status);

  for (const [bodyKey, column] of Object.entries(PATCHABLE_FIELDS)) {
    if (req.body[bodyKey] !== undefined) {
      const value =
        bodyKey === "depthMeters"
          ? req.body[bodyKey] === null
            ? null
            : parseFiniteNumber(req.body[bodyKey], "depthMeters")
          : req.body[bodyKey];
      updates.push(`${column} = $${i++}`);
      values.push(value);
    }
  }

  // Allow moving a manhole's location too, since GPS surveys get corrected.
  const hasLat = req.body.lat !== undefined;
  const hasLng = req.body.lng !== undefined;
  if (hasLat !== hasLng) {
    throw new HttpError(400, "lat and lng must be provided together");
  }
  if (hasLat && hasLng) {
    const parsedLat = validateLatitude(req.body.lat);
    const parsedLng = validateLongitude(req.body.lng);
    updates.push(
      `location = ST_SetSRID(ST_MakePoint($${i++}, $${i++}), 4326)::geography`,
    );
    values.push(parsedLng, parsedLat);
  }

  if (updates.length === 0) {
    throw new HttpError(400, "No updatable fields provided");
  }

  values.push(req.params.id);

  const { rows } = await query(
    `UPDATE manholes SET ${updates.join(", ")}
     WHERE id = $${i}
     RETURNING id, code,
       ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
       utility_type, depth_meters, status, photo_url, install_date,
       last_inspected_at, last_inspected_by, created_at`,
    values,
  );

  if (!rows[0]) throw new HttpError(404, "Manhole not found");
  res.json(toManholeDTO(rows[0]));
}

// DELETE /manholes/:id
export async function deleteManhole(req, res) {
  await query("DELETE FROM manholes WHERE id = $1", [req.params.id]);
  res.status(204).send();
}

// POST /manholes/:id/inspect
export async function inspectManhole(req, res) {
  const { rows } = await query(
    `UPDATE manholes SET last_inspected_at = now(), last_inspected_by = $1
     WHERE id = $2
     RETURNING id`,
    [req.technician.id, req.params.id],
  );
  if (!rows[0]) throw new HttpError(404, "Manhole not found");
  res.status(204).send();
}
