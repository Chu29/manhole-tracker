import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const sql = readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  console.log("Running database seed...");
  await pool.query(sql);
  console.log("✅ Database seeded successfully.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
