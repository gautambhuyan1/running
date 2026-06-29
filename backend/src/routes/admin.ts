import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/admin/events/pending — approval queue
router.get("/events/pending", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: "pending" },
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        categories: true,
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending events" });
  }
});

// PUT /api/admin/events/:id/approve
router.put("/events/:id/approve", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const status = action === "approve" ? "live" : "draft";

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ message: `Event ${action}d`, event });
  } catch (error) {
    res.status(500).json({ error: "Failed to update event status" });
  }
});

// GET /api/admin/users
router.get("/users", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (role) where.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          city: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { registrations: true, events: true, reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, pagination: { page: parseInt(page), limit: take, total } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /api/admin/users/:id/verify — verify organiser account
router.put("/users/:id/verify", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });
    res.json({ message: "User verified", user: { id: user.id, name: user.name, isVerified: user.isVerified } });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// GET /api/admin/reviews/flagged
router.get("/reviews/flagged", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isFlagged: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
      },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch flagged reviews" });
  }
});

// DELETE /api/admin/reviews/:id
router.delete("/reviews/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// GET /api/admin/analytics
router.get("/analytics", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalRegistrations, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.registration.count({ where: { status: "confirmed" } }),
      prisma.registration.aggregate({ where: { status: "confirmed" }, _sum: { amountPaid: true } }),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const eventsByStatus = await prisma.event.groupBy({
      by: ["status"],
      _count: true,
    });

    const topCities = await prisma.event.groupBy({
      by: ["city"],
      _count: true,
      orderBy: { _count: { city: "desc" } },
      take: 10,
    });

    res.json({
      totalUsers,
      totalEvents,
      totalRegistrations,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
      eventsByStatus: Object.fromEntries(eventsByStatus.map((r) => [r.status, r._count])),
      topCities: topCities.map((c) => ({ city: c.city, count: c._count })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/admin/events — all events for admin
router.get("/events", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        include: {
          organiser: { select: { id: true, name: true, email: true } },
          categories: true,
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({ events, pagination: { page: parseInt(page), limit: take, total } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// PUT /api/admin/events/:id — admin update any event
router.put("/events/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { title, city, venue, eventDate, regDeadline, description, coverImageUrl, status, isFeatured } = req.body;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (city !== undefined) data.city = city;
    if (venue !== undefined) data.venue = venue;
    if (eventDate !== undefined) data.eventDate = new Date(eventDate);
    if (regDeadline !== undefined) data.regDeadline = new Date(regDeadline);
    if (description !== undefined) data.description = description;
    if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl;
    if (status !== undefined) data.status = status;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data,
      include: { categories: true },
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/admin/events/:id — admin delete event
router.delete("/events/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    // Delete related data first (cascading)
    const eventId = req.params.id;

    await prisma.notification.deleteMany({
      where: { userId: { in: (await prisma.registration.findMany({ where: { category: { eventId } }, select: { userId: true } })).map(r => r.userId) } }
    }).catch(() => {});
    await prisma.result.deleteMany({ where: { registration: { category: { eventId } } } });
    await prisma.registration.deleteMany({ where: { category: { eventId } } });
    await prisma.review.deleteMany({ where: { eventId } });
    await prisma.photo.deleteMany({ where: { eventId } });
    await prisma.eventFaq.deleteMany({ where: { eventId } });
    await prisma.eventCategory.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// PUT /api/admin/events/:id/feature
router.put("/events/:id/feature", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { isFeatured },
    });
    res.json({ message: `Event ${isFeatured ? "featured" : "unfeatured"}`, event });
  } catch (error) {
    res.status(500).json({ error: "Failed to update featured status" });
  }
});

export default router;
