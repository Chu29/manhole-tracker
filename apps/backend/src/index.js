import "dotenv/config";
import app from "./app.js";

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  console.error("Copy .env.example to .env and fill in real values.");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Manhole Tracker backend listening on port ${PORT}`);
});
