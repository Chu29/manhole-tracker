import { prisma } from "../db/prisma.js";
import { HttpError } from "../middleware/error-handler.js";

function toPublicTechnician(tech) {
  return {
    id: tech.id,
    name: tech.name,
    email: tech.email,
    orgId: tech.orgId,
    role: tech.role,
    createdAt: tech.createdAt,
    inspectionCount: tech._count ? tech._count.inspectionLogs : (tech.inspectionLogs ? tech.inspectionLogs.length : 0),
  };
}

// GET /technicians
export async function listTechnicians(req, res) {
  const technicians = await prisma.technician.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      orgId: true,
      role: true,
      createdAt: true,
      _count: {
        select: { inspectionLogs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(technicians.map(toPublicTechnician));
}

// GET /technicians/:id
export async function getTechnicianById(req, res) {
  const tech = await prisma.technician.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: { inspectionLogs: true },
      },
      inspectionLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          manhole: {
            select: {
              id: true,
              code: true,
              utilityType: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!tech) {
    throw new HttpError(404, "Technician not found");
  }

  const dto = {
    ...toPublicTechnician(tech),
    inspectionLogs: tech.inspectionLogs.map((log) => ({
      id: log.id,
      manholeId: log.manholeId,
      technicianId: log.technicianId,
      notes: log.notes,
      photoUrl: log.photoUrl,
      createdAt: log.createdAt,
      manhole: log.manhole ? {
        id: log.manhole.id,
        code: log.manhole.code,
        utilityType: log.manhole.utilityType,
        status: log.manhole.status,
      } : null,
    })),
  };

  res.json(dto);
}

// PATCH /technicians/:id
export async function updateTechnician(req, res) {
  const { role, orgId } = req.body;

  const existing = await prisma.technician.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    throw new HttpError(404, "Technician not found");
  }

  let parsedOrgId = undefined;
  if (orgId !== undefined) {
    if (orgId === null || orgId === "") {
      parsedOrgId = null;
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      if (!isUuid) {
        throw new HttpError(400, "Organization ID must be a valid UUID format (or left blank)");
      }
      parsedOrgId = orgId;
    }
  }

  const updated = await prisma.technician.update({
    where: { id: req.params.id },
    data: {
      role: role !== undefined ? role : existing.role,
      orgId: parsedOrgId !== undefined ? parsedOrgId : existing.orgId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      orgId: true,
      role: true,
      createdAt: true,
      _count: {
        select: { inspectionLogs: true },
      },
    },
  });

  res.json(toPublicTechnician(updated));
}
