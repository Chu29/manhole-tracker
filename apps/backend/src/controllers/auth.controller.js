import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db/pool.js";
import { HttpError } from "../middleware/error-handler.js";

const SALT_ROUNDS = 12;

function signToken(technician) {
  return jwt.sign(
    { sub: technician.id, email: technician.email, role: technician.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function toPublicTechnician(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    orgId: row.org_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

// POST /auth/register   { name, email, password, orgId? }
export async function register(req, res) {
  const { name, email, password, orgId } = req.body;

  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }
  if (password.length < 8) {
    throw new HttpError(400, "password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await query(
    `INSERT INTO technicians (name, email, password_hash, org_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, org_id, role, created_at`,
    [name, email.toLowerCase().trim(), passwordHash, orgId || null],
  );

  const technician = toPublicTechnician(rows[0]);
  const token = signToken(technician);

  res.status(201).json({ token, technician });
}

// POST /auth/login   { email, password } → { token, technician }
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const { rows } = await query(
    `SELECT id, name, email, password_hash, org_id, role, created_at
     FROM technicians WHERE email = $1`,
    [email.toLowerCase().trim()],
  );

  const row = rows[0];
  const passwordMatches = row
    ? await bcrypt.compare(password, row.password_hash)
    : false;

  if (!row || !passwordMatches) {
    // Same message for both cases — don't reveal whether the email exists.
    throw new HttpError(401, "Invalid email or password");
  }

  const technician = toPublicTechnician(row);
  const token = signToken(technician);

  res.json({ token, technician });
}

// POST /auth/logout
export function logout(req, res) {
  res.status(200).json({ message: "Logout successful" });
}

// POST /auth/refresh
export function refresh(req, res) {
  const token = signToken(req.technician);
  res.json({ token });
}

// POST /auth/me
export function me(req, res) {
  res.json(req.technician);
}
