import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createManhole,
  getNearbyManholes,
  getManholeById,
  updateManhole,
  deleteManhole,
  inspectManhole,
} from "../controllers/manhole.controller.js";
import {
  createInspection,
  listInspections,
} from "../controllers/inspection.controller.js";

const router = Router();

router.use(requireAuth); // every route below requires auth, per spec §5

router.post("/", asyncHandler(createManhole));

// IMPORTANT: /nearby must be declared before /:id or Express will treat
// "nearby" as an :id param value.
router.get("/nearby", asyncHandler(getNearbyManholes));

router.get("/:id", asyncHandler(getManholeById));
router.patch("/:id", asyncHandler(updateManhole));
router.delete("/:id", asyncHandler(deleteManhole));
router.post("/:id/inspect", asyncHandler(inspectManhole));

router.post("/:id/inspections", asyncHandler(createInspection));
router.get("/:id/inspections", asyncHandler(listInspections));

export default router;
