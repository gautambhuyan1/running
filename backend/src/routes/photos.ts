import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate, requireRole } from "../middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/photos/" });

// GET /api/events/:eventId/photos
router.get("/:eventId/photos", async (req, res) => {
  try {
    const { bib } = req.query as { bib?: string };

    const where: any = { eventId: req.params.eventId };
    if (bib) where.bibTag = { contains: bib };

    const photos = await prisma.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// POST /api/events/:eventId/photos — upload photos (organiser only, stubbed)
router.post(
  "/:eventId/photos",
  authenticate,
  requireRole("organiser", "admin"),
  upload.array("photos", 50),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { bibTags } = req.body; // JSON array of bib tags corresponding to each photo

      // Stub: In production, upload to S3/Cloudinary and run AI face matching
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No photos uploaded" });
      }

      const tags = bibTags ? JSON.parse(bibTags) : [];

      const photos = await prisma.photo.createMany({
        data: files.map((f, i) => ({
          eventId,
          url: `/uploads/photos/${f.filename}`, // stub URL
          bibTag: tags[i] || null,
          caption: null,
        })),
      });

      res.status(201).json({ message: `${files.length} photos uploaded`, count: photos.count });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload photos" });
    }
  }
);

export default router;
