import { Router } from "express";
import multer from "multer";
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
//
// NOTE: storage provider is TBD per spec §3 (S3 / Cloudinary / Firebase).
// This handler validates and buffers the upload; wire in the chosen SDK's
// putObject/upload call where indicated below. Never persist raw image
// bytes to Postgres — only the resulting URL.
router.post(
  "/photo",
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    if (!req.file)
      throw new HttpError(400, 'No file uploaded under field "photo"');

    // --- TODO: replace with real upload once STORAGE_PROVIDER is decided ---
    // Example (S3 via @aws-sdk/client-s3):
    //   const key = `manholes/${randomUUID()}-${req.file.originalname}`;
    //   await s3Client.send(new PutObjectCommand({
    //     Bucket: process.env.S3_BUCKET, Key: key, Body: req.file.buffer,
    //     ContentType: req.file.mimetype,
    //   }));
    //   const photoUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    //
    // Example (Cloudinary): use cloudinary.uploader.upload_stream(...).
    throw new HttpError(
      501,
      "Photo storage provider not yet configured. Set STORAGE_PROVIDER and implement the upload in src/routes/uploads.routes.js",
    );
  }),
);

export default router;
