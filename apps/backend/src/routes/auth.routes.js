import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  logout,
  refresh,
  me,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", requireAuth, asyncHandler(logout));
router.post("/refresh", requireAuth, asyncHandler(refresh));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
