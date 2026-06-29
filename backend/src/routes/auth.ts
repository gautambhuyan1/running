import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { config } from "../config";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["runner", "organiser"]).default("runner"),
  city: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

// POST /api/auth/register
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone, role, city } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        city,
        isVerified: role === "runner", // organisers need admin approval
      },
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/google — stub for Google OAuth
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    // In production, verify idToken with Google API
    // For now, this is a stub
    res.status(501).json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  } catch (error) {
    res.status(500).json({ error: "Google auth failed" });
  }
});

// POST /api/auth/otp/send — stub for OTP
router.post("/otp/send", async (req, res) => {
  const { phone } = req.body;
  // Stub: In production, send OTP via MSG91/Twilio
  console.log(`[STUB] OTP sent to ${phone}: 123456`);
  res.json({ message: "OTP sent successfully", stub: true, otp: "123456" });
});

// POST /api/auth/otp/verify — stub for OTP verification
router.post("/otp/verify", async (req, res) => {
  const { phone, otp } = req.body;
  // Stub: accept 123456 as valid OTP
  if (otp === "123456") {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (user) {
      const token = generateToken(user.id, user.role);
      return res.json({ user, token });
    }
    return res.status(404).json({ error: "No user found with this phone number" });
  }
  res.status(400).json({ error: "Invalid OTP" });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
