import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/certificates/:registrationId — generate/download certificate
router.get("/:registrationId", authenticate, async (req, res) => {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: req.params.registrationId },
      include: {
        user: { select: { name: true } },
        category: {
          include: {
            event: { select: { title: true, city: true, eventDate: true, status: true } },
          },
        },
        result: true,
      },
    });

    if (!registration) return res.status(404).json({ error: "Registration not found" });
    if (registration.userId !== req.user!.userId && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    if (!registration.result) {
      return res.status(400).json({ error: "Results not yet published for this event" });
    }
    if (registration.category.event.status !== "completed") {
      return res.status(400).json({ error: "Event not yet completed" });
    }

    // Generate certificate data (in production, use Puppeteer/html-pdf to generate PDF)
    const certificate = {
      runnerName: registration.user.name,
      bibNumber: registration.bibNumber,
      eventName: registration.category.event.title,
      eventCity: registration.category.event.city,
      eventDate: registration.category.event.eventDate,
      category: registration.category.name,
      finishTime: registration.result.finishTime,
      overallRank: registration.result.overallRank,
      categoryRank: registration.result.categoryRank,
      certificateId: `CERT-${registration.id.substring(0, 8).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
    };

    // Stub: Return certificate data as JSON
    // In production, generate PDF and return as file download
    res.json({
      message: "Certificate generated (stub — PDF generation requires Puppeteer)",
      certificate,
      downloadUrl: `/api/certificates/${req.params.registrationId}/pdf`,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// GET /api/certificates/:registrationId/pdf — PDF download stub
router.get("/:registrationId/pdf", authenticate, async (req, res) => {
  // Stub: In production, generate and stream PDF
  res.status(501).json({
    error: "PDF generation is stubbed. Install puppeteer and configure for production use.",
  });
});

export default router;
