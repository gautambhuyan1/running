import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate, requireRole } from "../middleware/auth";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

// GET /api/events/:eventId/results — public leaderboard
router.get("/events/:eventId/results", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { category } = req.query as { category?: string };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, slug: true, city: true, eventDate: true, status: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const where: any = {
      registration: {
        category: { eventId },
      },
    };

    if (category) {
      where.registration.category.name = category;
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        registration: {
          include: {
            user: { select: { id: true, name: true, city: true, avatarUrl: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { overallRank: "asc" },
    });

    const leaderboard = results.map((r) => ({
      id: r.id,
      overallRank: r.overallRank,
      categoryRank: r.categoryRank,
      finishTime: r.finishTime,
      gunTime: r.gunTime,
      bibNumber: r.registration.bibNumber,
      runnerName: r.registration.user.name,
      runnerCity: r.registration.user.city,
      category: r.registration.category.name,
    }));

    // Get categories that have results
    const categories = await prisma.eventCategory.findMany({
      where: { eventId },
      select: { name: true },
    });

    res.json({
      event,
      categories: categories.map((c) => c.name),
      leaderboard,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// POST /api/events/:eventId/results/upload — upload CSV
router.post(
  "/events/:eventId/results/upload",
  authenticate,
  requireRole("organiser", "admin"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { eventId } = req.params;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.organiserId !== req.user!.userId && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not your event" });
      }

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const csvContent = fs.readFileSync(req.file.path, "utf-8");
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Expected columns: bib, name, finish_time, category
      let created = 0;
      for (const record of records) {
        const registration = await prisma.registration.findUnique({
          where: { bibNumber: record.bib },
        });

        if (registration) {
          await prisma.result.upsert({
            where: { registrationId: registration.id },
            create: {
              registrationId: registration.id,
              finishTime: record.finish_time,
              gunTime: record.gun_time || null,
              overallRank: parseInt(record.overall_rank) || 0,
              categoryRank: parseInt(record.category_rank) || 0,
            },
            update: {
              finishTime: record.finish_time,
              gunTime: record.gun_time || null,
              overallRank: parseInt(record.overall_rank) || 0,
              categoryRank: parseInt(record.category_rank) || 0,
            },
          });
          created++;
        }
      }

      // Mark event as completed
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "completed" },
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Notify participants
      const registrations = await prisma.registration.findMany({
        where: { category: { eventId }, status: "confirmed" },
        select: { userId: true },
      });

      await prisma.notification.createMany({
        data: registrations.map((r) => ({
          userId: r.userId,
          type: "results_published",
          title: "Results are live!",
          body: `${event.title} results have been published. Check your timing!`,
        })),
      });

      res.json({ message: `${created} results imported successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to upload results" });
    }
  }
);

export default router;
