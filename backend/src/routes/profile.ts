import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// GET /api/users/me — full profile with stats
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

    // Get registration stats
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id, status: "confirmed" },
      include: {
        category: {
          include: {
            event: { select: { id: true, title: true, slug: true, city: true, eventDate: true, status: true, coverImageUrl: true } },
          },
        },
        result: true,
      },
      orderBy: { registeredAt: "desc" },
    });

    const totalEvents = registrations.length;
    const completedEvents = registrations.filter((r) => r.category.event.status === "completed").length;
    const upcomingEvents = registrations.filter(
      (r) => r.category.event.status === "live" && new Date(r.category.event.eventDate) > new Date()
    );

    // Calculate personal bests per distance
    const personalBests: Record<string, { time: string; event: string; date: Date }> = {};
    for (const reg of registrations) {
      if (reg.result) {
        const cat = reg.category.name;
        if (!personalBests[cat] || reg.result.finishTime < personalBests[cat].time) {
          personalBests[cat] = {
            time: reg.result.finishTime,
            event: reg.category.event.title,
            date: reg.category.event.eventDate,
          };
        }
      }
    }

    res.json({
      ...user,
      stats: {
        totalEvents,
        completedEvents,
        upcomingCount: upcomingEvents.length,
      },
      personalBests,
      registrations: registrations.map((r) => ({
        id: r.id,
        bibNumber: r.bibNumber,
        status: r.status,
        category: r.category.name,
        event: r.category.event,
        result: r.result
          ? {
              finishTime: r.result.finishTime,
              overallRank: r.result.overallRank,
              categoryRank: r.result.categoryRank,
            }
          : null,
      })),
      upcomingEvents: upcomingEvents.map((r) => ({
        registrationId: r.id,
        bibNumber: r.bibNumber,
        category: r.category.name,
        event: r.category.event,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/users/me — update profile
router.put("/me", authenticate, validate(updateProfileSchema), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: req.body,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        bio: true,
        avatarUrl: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
