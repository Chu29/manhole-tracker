import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { 
  getAllManholes, createManhole, updateManhole, deleteManhole,
  getAllTechnicians, updateTechnicianRole 
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

// Manhole CRUD
router.get("/manholes", asyncHandler(getAllManholes));
router.post("/manholes", asyncHandler(createManhole));
router.patch("/manholes/:id", asyncHandler(updateManhole));
router.delete("/manholes/:id", asyncHandler(deleteManhole));

// Technician Management
router.get("/technicians", asyncHandler(getAllTechnicians));
router.patch("/technicians/:id", asyncHandler(updateTechnicianRole));

export default router;
