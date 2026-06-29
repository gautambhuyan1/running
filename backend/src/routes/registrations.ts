import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const registerSchema = z.object({
  categoryId: z.string().uuid(),
  participants: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
      })
    )
    .optional(), // for group registration
});

function generateBibNumber(city: string, categoryName: string, count: number): string {
  const cityCode = city.substring(0, 3).toUpperCase();
  return `${cityCode}-${categoryName}-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/registrations — register for an event
router.post("/", authenticate, validate(registerSchema), async (req, res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user!.userId;

    const category = await prisma.eventCategory.findUnique({
      where: { id: categoryId },
      include: { event: true },
    });

    if (!category) return res.status(404).json({ error: "Category not found" });
    if (category.event.status !== "live") return res.status(400).json({ error: "Event is not open for registration" });
    if (new Date() > category.event.regDeadline) return res.status(400).json({ error: "Registration deadline passed" });
    if (category.slotsRemaining <= 0) return res.status(400).json({ error: "No slots remaining" });

    // Check if already registered for this category
    const existing = await prisma.registration.findFirst({
      where: { userId, categoryId, status: { not: "cancelled" } },
    });
    if (existing) return res.status(409).json({ error: "Already registered for this category" });

    // Count existing registrations for bib numbering
    const regCount = await prisma.registration.count({
      where: { categoryId },
    });

    const bibNumber = generateBibNumber(category.event.city, category.name, regCount);

    // Create registration (payment is stubbed — auto-confirm)
    const registration = await prisma.registration.create({
      data: {
        userId,
        categoryId,
        bibNumber,
        status: "confirmed",
        amountPaid: category.price,
        paymentRef: `pay_stub_${Date.now().toString(36)}`,
      },
      include: {
        category: { include: { event: true } },
      },
    });

    // Decrement slots
    await prisma.eventCategory.update({
      where: { id: categoryId },
      data: { slotsRemaining: { decrement: 1 } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: "registration_confirmation",
        title: "Registration Confirmed!",
        body: `You're registered for ${registration.category.event.title} - ${registration.category.name}. Your bib: ${bibNumber}`,
      },
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// GET /api/registrations — my registrations
router.get("/", authenticate, async (req, res) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.userId },
      include: {
        category: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                city: true,
                eventDate: true,
                coverImageUrl: true,
                status: true,
              },
            },
          },
        },
        result: true,
      },
      orderBy: { registeredAt: "desc" },
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// GET /api/registrations/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: {
        category: { include: { event: true } },
        result: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!registration) return res.status(404).json({ error: "Registration not found" });
    if (registration.userId !== req.user!.userId && req.user!.role !== "admin" && req.user!.role !== "organiser") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registration" });
  }
});

// POST /api/registrations/:id/cancel
router.post("/:id/cancel", authenticate, async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.id },
      include: { category: { include: { event: true } } },
    });

    if (!registration) return res.status(404).json({ error: "Registration not found" });
    if (registration.userId !== req.user!.userId) return res.status(403).json({ error: "Not your registration" });
    if (registration.status === "cancelled") return res.status(400).json({ error: "Already cancelled" });

    const updated = await prisma.registration.update({
      where: { id: req.params.id },
      data: { status: "cancelled" },
    });

    // Restore slot
    await prisma.eventCategory.update({
      where: { id: registration.categoryId },
      data: { slotsRemaining: { increment: 1 } },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Cancellation failed" });
  }
});

// POST /api/payments/webhook — Razorpay webhook stub
router.post("/payments/webhook", async (req, res) => {
  // Stub: In production, verify Razorpay signature
  console.log("[STUB] Payment webhook received:", req.body);
  res.json({ status: "ok", stub: true });
});

export default router;
