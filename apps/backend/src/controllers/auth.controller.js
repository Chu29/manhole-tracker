import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../middleware/error-handler.js";

const SALT_ROUNDS = 12;

function signToken(technician) {
  return jwt.sign(
    { sub: technician.id, email: technician.email, role: technician.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function toPublicTechnician(tech) {
  return {
    id: tech.id,
    name: tech.name,
    email: tech.email,
    orgId: tech.orgId,
    role: tech.role,
    createdAt: tech.createdAt,
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

  const newTech = await prisma.technician.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      orgId: orgId || null,
    },
  });

  const technician = toPublicTechnician(newTech);
  const token = signToken(technician);

  res.status(201).json({ token, technician });
}

// POST /auth/login   { email, password } → { token, technician }
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const tech = await prisma.technician.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  const passwordMatches = tech
    ? await bcrypt.compare(password, tech.passwordHash)
    : false;

  if (!tech || !passwordMatches) {
    // Same message for both cases — don't reveal whether the email exists.
    throw new HttpError(401, "Invalid email or password");
  }

  const technician = toPublicTechnician(tech);
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

// GET /auth/me
export async function me(req, res) {
  const tech = await prisma.technician.findUnique({
    where: { id: req.technician.id },
  });

  if (!tech) {
    throw new HttpError(404, "Technician not found");
  }

  res.json(toPublicTechnician(tech));
}
