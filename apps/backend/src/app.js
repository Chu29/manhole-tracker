import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import manholeRoutes from "./routes/manholes.routes.js";
import uploadRoutes from "./routes/uploads.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/manholes", manholeRoutes);
app.use("/api/uploads", uploadRoutes);

// 404 for unmatched API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Must be registered last
app.use(errorHandler);

export default app;
