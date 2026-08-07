import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  listTechnicians,
  getTechnicianById,
  updateTechnician,
} from "../controllers/technician.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listTechnicians));
router.get("/:id", asyncHandler(getTechnicianById));
router.patch("/:id", asyncHandler(updateTechnician));

export default router;
