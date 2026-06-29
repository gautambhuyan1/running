import { Router } from "express";
import { prisma } from "../config/db";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/notifications — my notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

export default router;
