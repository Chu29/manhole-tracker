import { prisma } from "../db/prisma.js";
import { HttpError } from "../middleware/error-handler.js";

function toInspectionDTO(log) {
  return {
    id: log.id,
    manholeId: log.manholeId,
    technicianId: log.technicianId,
    notes: log.notes,
    photoUrl: log.photoUrl,
    createdAt: log.createdAt,
  };
}

// POST /manholes/:id/inspections   { notes, photoUrl }
export async function createInspection(req, res) {
  const { id: manholeId } = req.params;
  const { notes, photoUrl } = req.body;
  const technicianId = req.technician.id;

  const inspection = await prisma.$transaction(async (tx) => {
    const manhole = await tx.manhole.findUnique({
      where: { id: manholeId },
      select: { id: true },
    });
    if (!manhole) throw new HttpError(404, "Manhole not found");

    const newLog = await tx.inspectionLog.create({
      data: {
        manholeId,
        technicianId,
        notes: notes || null,
        photoUrl: photoUrl || null,
      },
    });

    await tx.manhole.update({
      where: { id: manholeId },
      data: {
        lastInspectedAt: new Date(),
        lastInspectedBy: technicianId,
      },
    });

    return newLog;
  });

  res.status(201).json(toInspectionDTO(inspection));
}

// GET /manholes/:id/inspections
export async function listInspections(req, res) {
  const logs = await prisma.inspectionLog.findMany({
    where: { manholeId: req.params.id },
    orderBy: { createdAt: "desc" },
  });

  res.json(logs.map(toInspectionDTO));
}

// GET /manholes/:id/inspections/:inspectionId
export async function getInspection(req, res) {
  const log = await prisma.inspectionLog.findUnique({
    where: { id: req.params.inspectionId },
  });

  if (!log) throw new HttpError(404, "Inspection not found");
  res.json(toInspectionDTO(log));
}

// DELETE /manholes/:id/inspections/:inspectionId
export async function deleteInspection(req, res) {
  await prisma.inspectionLog.delete({
    where: { id: req.params.inspectionId },
  });
  res.sendStatus(204);
}

// PATCH /manholes/:id/inspections/:inspectionId   { notes, photoUrl }
export async function updateInspection(req, res) {
  const { notes, photoUrl } = req.body;
  await prisma.inspectionLog.update({
    where: { id: req.params.inspectionId },
    data: {
      notes: notes || null,
      photoUrl: photoUrl || null,
    },
  });
  res.sendStatus(204);
}
