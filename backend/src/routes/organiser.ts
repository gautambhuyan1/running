import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/organiser/events — my events
router.get("/events", authenticate, requireRole("organiser", "admin"), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organiserId: req.user!.userId },
      include: {
        categories: {
          include: { _count: { select: { registrations: true } } },
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { eventDate: "desc" },
    });

    const eventsWithStats = events.map((e) => ({
      ...e,
      registrationCount: e.categories.reduce((sum, c) => sum + c._count.registrations, 0),
      reviewCount: e._count.reviews,
    }));

    res.json(eventsWithStats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch organiser events" });
  }
});

// GET /api/organiser/events/:eventId/stats
router.get("/events/:eventId/stats", authenticate, requireRole("organiser", "admin"), async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { categories: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.organiserId !== req.user!.userId && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not your event" });
    }

    const registrations = await prisma.registration.findMany({
      where: { category: { eventId }, status: "confirmed" },
      include: {
        user: { select: { name: true, email: true, phone: true, city: true } },
        category: { select: { name: true, price: true } },
      },
    });

    const totalRevenue = registrations.reduce((sum, r) => sum + r.amountPaid, 0);

    const categoryStats = event.categories.map((cat) => {
      const catRegs = registrations.filter((r) => r.categoryId === cat.id);
      return {
        name: cat.name,
        price: cat.price,
        maxParticipants: cat.maxParticipants,
        slotsRemaining: cat.slotsRemaining,
        registered: catRegs.length,
        revenue: catRegs.reduce((sum, r) => sum + r.amountPaid, 0),
      };
    });

    res.json({
      event: { id: event.id, title: event.title, status: event.status, eventDate: event.eventDate },
      totalRegistrations: registrations.length,
      totalRevenue,
      categoryStats,
      participants: registrations.map((r) => ({
        id: r.id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
        city: r.user.city,
        category: r.category.name,
        bibNumber: r.bibNumber,
        amountPaid: r.amountPaid,
        registeredAt: r.registeredAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event stats" });
  }
});

// GET /api/organiser/dashboard — aggregate stats
router.get("/dashboard", authenticate, requireRole("organiser", "admin"), async (req, res) => {
  try {
    const userId = req.user!.userId;

    const events = await prisma.event.findMany({
      where: { organiserId: userId },
      include: {
        categories: {
          include: { _count: { select: { registrations: true } } },
        },
        campaign: {
          select: { id: true, goalAmount: true, description: true, isActive: true },
        },
      },
    });

    const totalEvents = events.length;
    const liveEvents = events.filter((e) => e.status === "live").length;
    const completedEvents = events.filter((e) => e.status === "completed").length;

    const allRegistrations = await prisma.registration.findMany({
      where: { category: { event: { organiserId: userId } }, status: "confirmed" },
    });

    const totalRegistrations = allRegistrations.length;
    const totalRevenue = allRegistrations.reduce((sum, r) => sum + r.amountPaid, 0);

    // Compute totalRaised for each campaign
    const campaignIds = events.map((e) => e.campaign?.id).filter(Boolean) as string[];
    const raisedByCampaign: Record<string, number> = {};
    if (campaignIds.length > 0) {
      const fundraisers = await prisma.fundraiser.findMany({
        where: { campaignId: { in: campaignIds } },
        select: { id: true, campaignId: true },
      });
      const raisedAggs = await prisma.donation.groupBy({
        by: ["fundraiserId"],
        _sum: { amount: true },
        where: { status: "confirmed", fundraiserId: { in: fundraisers.map((f) => f.id) } },
      });
      for (const f of fundraisers) {
        const agg = raisedAggs.find((r) => r.fundraiserId === f.id);
        raisedByCampaign[f.campaignId] = (raisedByCampaign[f.campaignId] ?? 0) + (agg?._sum.amount ?? 0);
      }
    }

    res.json({
      totalEvents,
      liveEvents,
      completedEvents,
      totalRegistrations,
      totalRevenue,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        eventDate: e.eventDate,
        registrations: e.categories.reduce((sum, cat) => sum + cat._count.registrations, 0),
        campaign: e.campaign ? { ...e.campaign, totalRaised: raisedByCampaign[e.campaign.id] ?? 0 } : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
