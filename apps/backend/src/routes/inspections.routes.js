import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { listAllInspections } from "../controllers/inspection.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listAllInspections));

export default router;
