import { query } from "../db/pool.js";
import { HttpError } from "../middleware/error-handler.js";

// Re-use manhole CRUD from manhole.controller
export { 
  createManhole, 
  updateManhole, 
  deleteManhole 
} from "./manhole.controller.js";

export async function getAllManholes(req, res) {
  const { rows } = await query(
    `SELECT 
       id, code, utility_type, status, photo_url,
       ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
       depth_meters, install_date, created_at,
       last_inspected_at, last_inspected_by
     FROM manholes 
     ORDER BY created_at DESC`
  );

  // Map to DTO format similar to what's done in manhole.controller.js
  const manholes = rows.map(row => ({
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
    createdAt: row.created_at,
  }));

  res.json(manholes);
}

export async function getAllTechnicians(req, res) {
  const { rows } = await query(
    `SELECT id, name, email, role, created_at, org_id 
     FROM technicians 
     ORDER BY created_at DESC`
  );
  res.json(rows);
}

export async function updateTechnicianRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "technician") {
    throw new HttpError(400, "Role must be 'admin' or 'technician'");
  }

  const { rows } = await query(
    `UPDATE technicians SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at`,
    [role, id]
  );

  if (!rows[0]) throw new HttpError(404, "Technician not found");

  res.json(rows[0]);
}
