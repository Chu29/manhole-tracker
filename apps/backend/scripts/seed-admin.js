import { pool } from "../src/db/pool.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function seedAdmin() {
  try {
    const adminEmail = process.argv[2] || "admin@example.com";
    const rawPassword = process.argv[3] || "admin123";

    console.log(`Seeding admin user: ${adminEmail}`);

    const existing = await pool.query("SELECT id FROM technicians WHERE email = $1", [adminEmail]);
    if (existing.rows.length > 0) {
      console.log(`Admin user ${adminEmail} already exists. Updating role...`);
      await pool.query("UPDATE technicians SET role = 'admin' WHERE email = $1", [adminEmail]);
      console.log("Role updated successfully.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);
    const id = crypto.randomUUID();

    await pool.query(
      "INSERT INTO technicians (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
      [id, "System Admin", adminEmail, passwordHash, "admin"]
    );

    console.log(`Successfully created admin user: ${adminEmail}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
}

seedAdmin();
