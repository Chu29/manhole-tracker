import { query, withTransaction } from "../db/pool.js";
import { HttpError } from "../middleware/error-handler.js";

function toInspectionDTO(row) {
  return {
    id: row.id,
    manholeId: row.manhole_id,
    technicianId: row.technician_id,
    notes: row.notes,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
  };
}

// POST /manholes/:id/inspections   { notes, photoUrl }
export async function createInspection(req, res) {
  const { id: manholeId } = req.params;
  const { notes, photoUrl } = req.body;
  const technicianId = req.technician.id;

  const inspection = await withTransaction(async (client) => {
    const manholeCheck = await client.query(
      "SELECT id FROM manholes WHERE id = $1",
      [manholeId],
    );
    if (!manholeCheck.rows[0]) throw new HttpError(404, "Manhole not found");

    const { rows } = await client.query(
      `INSERT INTO inspection_logs (manhole_id, technician_id, notes, photo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, manhole_id, technician_id, notes, photo_url, created_at`,
      [manholeId, technicianId, notes || null, photoUrl || null],
    );

    await client.query(
      `UPDATE manholes SET last_inspected_at = now(), last_inspected_by = $1 WHERE id = $2`,
      [technicianId, manholeId],
    );

    return rows[0];
  });

  res.status(201).json(toInspectionDTO(inspection));
}

// GET /manholes/:id/inspections
export async function listInspections(req, res) {
  const { rows } = await query(
    `SELECT id, manhole_id, technician_id, notes, photo_url, created_at
     FROM inspection_logs WHERE manhole_id = $1
     ORDER BY created_at DESC`,
    [req.params.id],
  );

  res.json(rows.map(toInspectionDTO));
}

// GET /manholes/:id/inspections/:inspectionId
export async function getInspection(req, res) {
  const { rows } = await query(
    `SELECT id, manhole_id, technician_id, notes, photo_url, created_at
     FROM inspection_logs WHERE id = $1`,
    [req.params.inspectionId],
  );

  if (!rows[0]) throw new HttpError(404, "Inspection not found");
  res.json(toInspectionDTO(rows[0]));
}

// DELETE /manholes/:id/inspections/:inspectionId
export async function deleteInspection(req, res) {
  await query("DELETE FROM inspection_logs WHERE id = $1", [
    req.params.inspectionId,
  ]);
  res.sendStatus(204);
}

// PATCH /manholes/:id/inspections/:inspectionId   { notes, photoUrl }
export async function updateInspection(req, res) {
  const { notes, photoUrl } = req.body;
  await query(
    `UPDATE inspection_logs SET notes = $1, photo_url = $2
     WHERE id = $3`,
    [notes || null, photoUrl || null, req.params.inspectionId],
  );
  res.sendStatus(204);
}
