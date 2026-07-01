import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // Unexpected error on an idle client — log and let the process supervisor
  // (nodemon / node --watch / pm2) restart if needed.
  console.error("Unexpected PostgreSQL pool error", err);
});

/**
 * Convenience query wrapper. Always prefer parameterized queries ($1, $2, ...)
 * over string interpolation.
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a callback inside a single client transaction (BEGIN/COMMIT/ROLLBACK).
 * Use for multi-statement writes that must be atomic (e.g. registering a
 * manhole + writing its first inspection log in one request).
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
