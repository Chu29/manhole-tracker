import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import manholeRoutes from "./routes/manholes.routes.js";
import uploadRoutes from "./routes/uploads.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  console.error("Copy .env.example to .env and fill in real values.");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/manholes", manholeRoutes);
app.use("/api/uploads", uploadRoutes);

// 404 for unmatched API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Must be registered last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Manhole Tracker backend listening on port ${PORT}`);
});

export default app;
