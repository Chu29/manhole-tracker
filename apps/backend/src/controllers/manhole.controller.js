import { prisma } from "../db/prisma.js";
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
    lat: row.lat !== undefined && row.lat !== null ? Number(row.lat) : undefined,
    lng: row.lng !== undefined && row.lng !== null ? Number(row.lng) : undefined,
    utilityType: row.utility_type ?? row.utilityType,
    depthMeters:
      row.depth_meters !== undefined && row.depth_meters !== null
        ? Number(row.depth_meters)
        : row.depthMeters !== undefined && row.depthMeters !== null
          ? Number(row.depthMeters)
          : null,
    status: row.status,
    photoUrl: row.photo_url ?? row.photoUrl,
    installDate: row.install_date ?? row.installDate,
    lastInspectedAt: row.last_inspected_at ?? row.lastInspectedAt,
    lastInspectedBy: row.last_inspected_by ?? row.lastInspectedBy,
    distanceMeters:
      row.distance_meters !== undefined && row.distance_meters !== null
        ? Number(row.distance_meters)
        : undefined,
    createdAt: row.created_at ?? row.createdAt,
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

  const rows = await prisma.$queryRaw`
    INSERT INTO manholes (code, location, utility_type, depth_meters, photo_url, install_date)
    VALUES (${code ?? null}, ST_SetSRID(ST_MakePoint(${parsedLng}, ${parsedLat}), 4326)::geography, ${utilityType ?? null}, ${parsedDepthMeters}, ${photoUrl ?? null}, ${installDate ? new Date(installDate) : null})
    RETURNING id, code,
      ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
      utility_type, depth_meters, status, photo_url, install_date,
      last_inspected_at, last_inspected_by, created_at
  `;

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

  const rows = await prisma.$queryRaw`
    SELECT
      id, code, utility_type, status, photo_url,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      ST_Distance(location, ST_MakePoint(${parsedLng}, ${parsedLat})::geography) AS distance_meters
    FROM manholes
    WHERE ST_DWithin(location, ST_MakePoint(${parsedLng}, ${parsedLat})::geography, ${clampedRadius})
    ORDER BY distance_meters ASC
  `;

  res.json(rows.map(toManholeDTO));
}

// GET /manholes
export async function getAllManholes(req, res) {
  const rows = await prisma.$queryRaw`
    SELECT id, code,
      ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
      utility_type, depth_meters, status, photo_url, install_date,
      last_inspected_at, last_inspected_by, created_at
    FROM manholes
    ORDER BY created_at DESC
  `;

  res.json(rows.map(toManholeDTO));
}

// GET /manholes/:id
export async function getManholeById(req, res) {
  const rows = await prisma.$queryRaw`
    SELECT id, code,
      ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
      utility_type, depth_meters, status, photo_url, install_date,
      last_inspected_at, last_inspected_by, created_at
    FROM manholes WHERE id = ${req.params.id}::uuid
  `;

  if (!rows[0]) throw new HttpError(404, "Manhole not found");
  res.json(toManholeDTO(rows[0]));
}

// PATCH /manholes/:id
export async function updateManhole(req, res) {
  validateUtilityType(req.body.utilityType);
  validateStatus(req.body.status);

  const hasLat = req.body.lat !== undefined;
  const hasLng = req.body.lng !== undefined;
  if (hasLat !== hasLng) {
    throw new HttpError(400, "lat and lng must be provided together");
  }

  const existing = await prisma.manhole.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new HttpError(404, "Manhole not found");

  const updatesData = {};
  if (req.body.code !== undefined) updatesData.code = req.body.code;
  if (req.body.utilityType !== undefined) updatesData.utilityType = req.body.utilityType;
  if (req.body.depthMeters !== undefined)
    updatesData.depthMeters =
      req.body.depthMeters === null
        ? null
        : parseFiniteNumber(req.body.depthMeters, "depthMeters");
  if (req.body.status !== undefined) updatesData.status = req.body.status;
  if (req.body.photoUrl !== undefined) updatesData.photoUrl = req.body.photoUrl;
  if (req.body.installDate !== undefined)
    updatesData.installDate = req.body.installDate ? new Date(req.body.installDate) : null;

  if (Object.keys(updatesData).length > 0) {
    await prisma.manhole.update({
      where: { id: req.params.id },
      data: updatesData,
    });
  }

  if (hasLat && hasLng) {
    const parsedLat = validateLatitude(req.body.lat);
    const parsedLng = validateLongitude(req.body.lng);
    await prisma.$executeRaw`
      UPDATE manholes
      SET location = ST_SetSRID(ST_MakePoint(${parsedLng}, ${parsedLat}), 4326)::geography
      WHERE id = ${req.params.id}::uuid
    `;
  }

  const rows = await prisma.$queryRaw`
    SELECT id, code,
      ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
      utility_type, depth_meters, status, photo_url, install_date,
      last_inspected_at, last_inspected_by, created_at
    FROM manholes WHERE id = ${req.params.id}::uuid
  `;

  res.json(toManholeDTO(rows[0]));
}

// DELETE /manholes/:id
export async function deleteManhole(req, res) {
  await prisma.inspectionLog.deleteMany({
    where: { manholeId: req.params.id },
  });
  await prisma.manhole.delete({
    where: { id: req.params.id },
  });
  res.status(204).send();
}

// POST /manholes/:id/inspect
export async function inspectManhole(req, res) {
  try {
    await prisma.manhole.update({
      where: { id: req.params.id },
      data: {
        lastInspectedAt: new Date(),
        lastInspectedBy: req.technician.id,
      },
    });
  } catch (err) {
    if (err.code === "P2025") {
      throw new HttpError(404, "Manhole not found");
    }
    throw err;
  }
  res.status(204).send();
}
