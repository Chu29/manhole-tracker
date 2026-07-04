import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { HttpError } from "../middleware/error-handler.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new HttpError(400, "Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

router.use(requireAuth);

// POST /api/uploads/photo   multipart/form-data, field name "photo"
// Returns { photoUrl } to be passed into POST /manholes or POST /inspections.
router.post(
  "/photo",
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    if (!req.file)
      throw new HttpError(400, 'No file uploaded under field "photo"');

    // Default to local storage for dev / testing / fallback
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filepath, req.file.buffer);

    const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
    res.status(200).json({ photoUrl });
  }),
);

export default router;
