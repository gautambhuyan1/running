import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { authenticate, requireRole, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  city: z.string().min(2).max(80),
  venue: z.string().min(3),
  eventDate: z.string().transform((s) => new Date(s)),
  regDeadline: z.string().transform((s) => new Date(s)),
  description: z.string().min(10),
  coverImageUrl: z.string().url().optional(),
  routeMapUrl: z.string().url().optional(),
  categories: z.array(
    z.object({
      name: z.enum(["3K", "5K", "10K", "HM", "FM", "50K", "Ultra"]),
      price: z.number().min(0),
      maxParticipants: z.number().int().optional(),
    })
  ).min(1),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).optional(),
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/events — list with filters
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      city,
      category,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      sort = "date",
      page = "1",
      limit = "12",
      search,
      status = "live",
    } = req.query as Record<string, string>;

    const where: any = {};

    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (dateFrom || dateTo) {
      where.eventDate = {};
      if (dateFrom) where.eventDate.gte = new Date(dateFrom);
      if (dateTo) where.eventDate.lte = new Date(dateTo);
    }

    if (category) {
      where.categories = { some: { name: category } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let orderBy: any = { eventDate: "asc" };
    if (sort === "price") orderBy = { categories: { _count: "asc" } };
    if (sort === "popularity") orderBy = { registrations: { _count: "desc" } };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { eventDate: "asc" },
        include: {
          categories: {
            select: { id: true, name: true, price: true, slotsRemaining: true, maxParticipants: true },
          },
          organiser: {
            select: { id: true, name: true, avatarUrl: true },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true, categories: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const eventsWithStats = events.map((e) => {
      const ratings = e.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const minPrice = e.categories.length ? Math.min(...e.categories.map((c) => c.price)) : 0;
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        city: e.city,
        venue: e.venue,
        eventDate: e.eventDate,
        regDeadline: e.regDeadline,
        status: e.status,
        coverImageUrl: e.coverImageUrl,
        description: e.description,
        isFeatured: e.isFeatured,
        categories: e.categories,
        organiser: e.organiser,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: e.reviews.length,
        minPrice,
      };
    });

    // Apply price filter after aggregation
    let filtered = eventsWithStats;
    if (priceMin) filtered = filtered.filter((e) => e.minPrice >= parseFloat(priceMin));
    if (priceMax) filtered = filtered.filter((e) => e.minPrice <= parseFloat(priceMax));

    res.json({
      events: filtered,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events/featured
router.get("/featured", async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isFeatured: true, status: "live" },
      take: 6,
      orderBy: { eventDate: "asc" },
      include: {
        categories: { select: { name: true, price: true } },
        reviews: { select: { rating: true } },
      },
    });

    const result = events.map((e) => {
      const ratings = e.reviews.map((r) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const minPrice = e.categories.length ? Math.min(...e.categories.map((c) => c.price)) : 0;
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        city: e.city,
        eventDate: e.eventDate,
        coverImageUrl: e.coverImageUrl,
        categories: e.categories.map((c) => c.name),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: e.reviews.length,
        minPrice,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch featured events" });
  }
});

// GET /api/events/cities — unique cities for filter
router.get("/cities", async (_req, res) => {
  try {
    const cities = await prisma.event.findMany({
      where: { status: "live" },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    res.json(cities.map((c) => c.city));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

// GET /api/events/:slug
router.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        categories: true,
        organiser: {
          select: { id: true, name: true, bio: true, avatarUrl: true },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        faqs: { orderBy: { sortOrder: "asc" } },
        _count: { select: { reviews: true, photos: true } },
      },
    });

    if (!event) return res.status(404).json({ error: "Event not found" });

    const ratings = event.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    res.json({
      ...event,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: event.reviews.length,
      photoCount: event._count.photos,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// POST /api/events — create event (organiser only)
router.post("/", authenticate, requireRole("organiser", "admin"), validate(createEventSchema), async (req, res) => {
  try {
    const { categories, faqs, ...eventData } = req.body;
    const slug = slugify(eventData.title) + "-" + Date.now().toString(36);

    const event = await prisma.event.create({
      data: {
        ...eventData,
        slug,
        organiserId: req.user!.userId,
        status: "pending", // needs admin approval
        categories: {
          create: categories.map((c: any) => ({
            name: c.name,
            price: c.price,
            maxParticipants: c.maxParticipants || null,
            slotsRemaining: c.maxParticipants || 9999,
          })),
        },
        faqs: faqs
          ? {
              create: faqs.map((f: any, i: number) => ({
                question: f.question,
                answer: f.answer,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { categories: true, faqs: true },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT /api/events/:id — update event (organiser only)
router.put("/:id", authenticate, requireRole("organiser", "admin"), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.organiserId !== req.user!.userId && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not your event" });
    }

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body,
      include: { categories: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

export default router;
