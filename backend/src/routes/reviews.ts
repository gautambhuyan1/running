import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
});

// POST /api/events/:eventId/reviews
router.post("/:eventId/reviews", authenticate, validate(createReviewSchema), async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.userId;

    // Check event exists and is completed
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.status !== "completed") {
      return res.status(400).json({ error: "Can only review completed events" });
    }

    // Check user was a verified participant
    const registration = await prisma.registration.findFirst({
      where: {
        userId,
        category: { eventId },
        status: "confirmed",
      },
    });
    if (!registration) {
      return res.status(403).json({ error: "Only verified participants can review" });
    }

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { eventId, userId },
    });
    if (existing) return res.status(409).json({ error: "Already reviewed this event" });

    const review = await prisma.review.create({
      data: {
        eventId,
        userId,
        rating: req.body.rating,
        body: req.body.body,
        isVerified: true,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

// GET /api/events/:eventId/reviews
router.get("/:eventId/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { eventId: req.params.eventId, isFlagged: false },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const ratings = reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    res.json({
      reviews,
      stats: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        distribution: {
          5: ratings.filter((r) => r === 5).length,
          4: ratings.filter((r) => r === 4).length,
          3: ratings.filter((r) => r === 3).length,
          2: ratings.filter((r) => r === 2).length,
          1: ratings.filter((r) => r === 1).length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

export default router;
