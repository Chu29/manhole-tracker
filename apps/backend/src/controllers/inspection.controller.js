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
    technician: log.technician ? {
      id: log.technician.id,
      name: log.technician.name,
      email: log.technician.email,
      role: log.technician.role,
    } : null,
    manhole: log.manhole ? {
      id: log.manhole.id,
      code: log.manhole.code,
      utilityType: log.manhole.utilityType,
      status: log.manhole.status,
    } : null,
  };
}

// GET /inspections (global list across all manholes)
export async function listAllInspections(req, res) {
  const { technicianId, manholeId } = req.query;
  const where = {};
  if (technicianId) where.technicianId = String(technicianId);
  if (manholeId) where.manholeId = String(manholeId);

  const logs = await prisma.inspectionLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      technician: {
        select: { id: true, name: true, email: true, role: true },
      },
      manhole: {
        select: { id: true, code: true, utilityType: true, status: true },
      },
    },
  });

  res.json(logs.map(toInspectionDTO));
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
      include: {
        technician: {
          select: { id: true, name: true, email: true, role: true },
        },
        manhole: {
          select: { id: true, code: true, utilityType: true, status: true },
        },
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
    include: {
      technician: {
        select: { id: true, name: true, email: true, role: true },
      },
      manhole: {
        select: { id: true, code: true, utilityType: true, status: true },
      },
    },
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
