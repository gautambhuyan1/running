import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../config/db";
import { authenticate, requireRole, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { config } from "../config";

const router = Router();

function getBadge(raised: number, goal: number): string {
  const pct = goal > 0 ? raised / goal : 0;
  if (pct >= 1) return "Champion";
  if (pct >= 0.75) return "Trailblazer";
  if (pct >= 0.5) return "Change Maker";
  if (pct >= 0.25) return "Rising Star";
  return "Starter";
}

// GET /api/ngos
router.get("/ngos", async (_req, res) => {
  try {
    const ngos = await prisma.ngo.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    res.json(ngos);
  } catch {
    res.status(500).json({ error: "Failed to fetch NGOs" });
  }
});

// POST /api/events/:eventId/campaign — organiser enables fundraising
const campaignSchema = z.object({
  goalAmount: z.number().min(1000),
  description: z.string().optional(),
});

router.post("/events/:eventId/campaign", authenticate, requireRole("organiser", "admin"), validate(campaignSchema), async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.organiserId !== req.user!.userId && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not your event" });
    }
    const existing = await prisma.fundraisingCampaign.findUnique({ where: { eventId } });
    if (existing) {
      const updated = await prisma.fundraisingCampaign.update({
        where: { eventId },
        data: { goalAmount: req.body.goalAmount, description: req.body.description, isActive: true },
      });
      return res.json(updated);
    }
    const campaign = await prisma.fundraisingCampaign.create({
      data: { eventId, goalAmount: req.body.goalAmount, description: req.body.description },
    });
    res.status(201).json(campaign);
  } catch {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/events/:eventId/campaign
router.get("/events/:eventId/campaign", async (req, res) => {
  try {
    const campaign = await prisma.fundraisingCampaign.findUnique({
      where: { eventId: req.params.eventId },
      include: {
        event: { select: { id: true, title: true, slug: true, city: true, eventDate: true, coverImageUrl: true, status: true } },
        _count: { select: { fundraisers: true } },
      },
    });
    if (!campaign) return res.status(404).json({ error: "No campaign for this event" });

    const totalRaised = await prisma.donation.aggregate({
      _sum: { amount: true },
      where: { fundraiser: { campaignId: campaign.id }, status: "confirmed" },
    });

    res.json({ ...campaign, totalRaised: totalRaised._sum.amount ?? 0 });
  } catch {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// GET /api/campaigns — all active campaigns for the fundraising hub
router.get("/campaigns", async (_req, res) => {
  try {
    const campaigns = await prisma.fundraisingCampaign.findMany({
      where: { isActive: true, event: { status: "live" } },
      include: {
        event: { select: { id: true, title: true, slug: true, city: true, eventDate: true, coverImageUrl: true, status: true } },
        _count: { select: { fundraisers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const raisedAggs = await prisma.donation.groupBy({
      by: ["fundraiserId"],
      _sum: { amount: true },
      where: { status: "confirmed", fundraiser: { campaignId: { in: campaigns.map((c) => c.id) } } },
    });

    const fundraisers = await prisma.fundraiser.findMany({
      where: { campaignId: { in: campaigns.map((c) => c.id) } },
      select: { id: true, campaignId: true },
    });

    const raisedByCampaign: Record<string, number> = {};
    for (const f of fundraisers) {
      const agg = raisedAggs.find((r) => r.fundraiserId === f.id);
      raisedByCampaign[f.campaignId] = (raisedByCampaign[f.campaignId] ?? 0) + (agg?._sum.amount ?? 0);
    }

    res.json(campaigns.map((c) => ({ ...c, totalRaised: raisedByCampaign[c.id] ?? 0 })));
  } catch {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// GET /api/events/:eventId/fundraisers
router.get("/events/:eventId/fundraisers", optionalAuth, async (req, res) => {
  try {
    const campaign = await prisma.fundraisingCampaign.findUnique({ where: { eventId: req.params.eventId } });
    if (!campaign) return res.status(404).json({ error: "No campaign for this event" });

    const fundraisers = await prisma.fundraiser.findMany({
      where: { campaignId: campaign.id, isPublished: true },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true } },
        ngo: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const withStats = await Promise.all(
      fundraisers.map(async (f) => {
        const agg = await prisma.donation.aggregate({
          _sum: { amount: true },
          where: { fundraiserId: f.id, status: "confirmed" },
        });
        const totalRaised = agg._sum.amount ?? 0;
        return { ...f, totalRaised, badge: getBadge(totalRaised, f.goalAmount) };
      })
    );

    withStats.sort((a, b) => b.totalRaised - a.totalRaised);
    res.json(withStats);
  } catch {
    res.status(500).json({ error: "Failed to fetch fundraisers" });
  }
});

// GET /api/events/:eventId/leaderboard
router.get("/events/:eventId/leaderboard", async (req, res) => {
  try {
    const campaign = await prisma.fundraisingCampaign.findUnique({ where: { eventId: req.params.eventId } });
    if (!campaign) return res.status(404).json({ error: "No campaign" });

    const fundraisers = await prisma.fundraiser.findMany({
      where: { campaignId: campaign.id, isPublished: true },
      include: { user: { select: { name: true, avatarUrl: true, city: true } }, ngo: { select: { name: true } } },
    });

    const withStats = await Promise.all(
      fundraisers.map(async (f, i) => {
        const agg = await prisma.donation.aggregate({
          _sum: { amount: true },
          where: { fundraiserId: f.id, status: "confirmed" },
        });
        const totalRaised = agg._sum.amount ?? 0;
        return { id: f.id, title: f.title, user: f.user, ngo: f.ngo, goalAmount: f.goalAmount, totalRaised, badge: getBadge(totalRaised, f.goalAmount), rank: i + 1 };
      })
    );

    withStats.sort((a, b) => b.totalRaised - a.totalRaised);
    withStats.forEach((f, i) => { f.rank = i + 1; });
    res.json(withStats);
  } catch {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// POST /api/events/:eventId/fundraisers — create fundraiser
const fundraiserSchema = z.object({
  ngoId: z.string().uuid(),
  title: z.string().min(5).max(120),
  story: z.string().min(20),
  goalAmount: z.number().min(1000),
  imageUrl: z.string().url().optional(),
});

router.post("/events/:eventId/fundraisers", authenticate, validate(fundraiserSchema), async (req, res) => {
  try {
    const campaign = await prisma.fundraisingCampaign.findUnique({ where: { eventId: req.params.eventId } });
    if (!campaign || !campaign.isActive) return res.status(404).json({ error: "No active campaign for this event" });

    const existing = await prisma.fundraiser.findUnique({ where: { userId_campaignId: { userId: req.user!.userId, campaignId: campaign.id } } });
    if (existing) return res.status(409).json({ error: "You already have a fundraiser for this event" });

    const ngo = await prisma.ngo.findUnique({ where: { id: req.body.ngoId } });
    if (!ngo) return res.status(404).json({ error: "NGO not found" });

    const fundraiser = await prisma.fundraiser.create({
      data: {
        userId: req.user!.userId,
        campaignId: campaign.id,
        ngoId: req.body.ngoId,
        title: req.body.title,
        story: req.body.story,
        goalAmount: req.body.goalAmount,
        imageUrl: req.body.imageUrl,
      },
      include: { user: { select: { name: true, avatarUrl: true } }, ngo: true },
    });
    res.status(201).json(fundraiser);
  } catch {
    res.status(500).json({ error: "Failed to create fundraiser" });
  }
});

// GET /api/fundraisers/:id
router.get("/fundraisers/:id", optionalAuth, async (req, res) => {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, city: true, bio: true } },
        ngo: true,
        campaign: { include: { event: { select: { id: true, title: true, slug: true, city: true, eventDate: true, coverImageUrl: true } } } },
        donations: {
          where: { status: "confirmed" },
          orderBy: { createdAt: "desc" },
          select: { id: true, donorName: true, amount: true, message: true, isAnonymous: true, createdAt: true },
        },
      },
    });
    if (!fundraiser) return res.status(404).json({ error: "Fundraiser not found" });

    const agg = await prisma.donation.aggregate({ _sum: { amount: true }, where: { fundraiserId: fundraiser.id, status: "confirmed" } });
    const totalRaised = agg._sum.amount ?? 0;

    const donations = fundraiser.donations.map((d) => ({
      ...d,
      donorName: d.isAnonymous ? "Anonymous" : d.donorName,
    }));

    res.json({ ...fundraiser, donations, totalRaised, badge: getBadge(totalRaised, fundraiser.goalAmount) });
  } catch {
    res.status(500).json({ error: "Failed to fetch fundraiser" });
  }
});

// POST /api/fundraisers/:id/donate — create Razorpay order
const donateSchema = z.object({
  amount: z.number().min(100),
  donorName: z.string().min(2),
  donorEmail: z.string().email(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});

router.post("/fundraisers/:id/donate", validate(donateSchema), async (req, res) => {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({ where: { id: req.params.id } });
    if (!fundraiser || !fundraiser.isPublished) return res.status(404).json({ error: "Fundraiser not found" });

    const { amount, donorName, donorEmail, message, isAnonymous } = req.body;

    // Create pending donation first
    const donation = await prisma.donation.create({
      data: { fundraiserId: fundraiser.id, donorName, donorEmail, amount, message, isAnonymous: isAnonymous ?? false, status: "pending" },
    });

    // Create Razorpay order
    const amountPaise = Math.round(amount * 100);
    const credentials = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString("base64");

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: donation.id }),
    });

    if (!rzpRes.ok) {
      // Stub fallback for dev: return mock order
      return res.json({
        donationId: donation.id,
        orderId: `stub_order_${donation.id}`,
        amount: amountPaise,
        currency: "INR",
        keyId: config.razorpay.keyId,
        isStub: true,
      });
    }

    const order = await rzpRes.json() as any;
    await prisma.donation.update({ where: { id: donation.id }, data: { orderId: order.id } });

    res.json({ donationId: donation.id, orderId: order.id, amount: amountPaise, currency: "INR", keyId: config.razorpay.keyId, isStub: false });
  } catch {
    res.status(500).json({ error: "Failed to create donation order" });
  }
});

// POST /api/fundraisers/:id/donate/verify — verify Razorpay payment
const verifySchema = z.object({
  donationId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string().optional(),
  isStub: z.boolean().optional(),
});

router.post("/fundraisers/:id/donate/verify", validate(verifySchema), async (req, res) => {
  try {
    const { donationId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isStub } = req.body;

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) return res.status(404).json({ error: "Donation not found" });

    if (!isStub) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expected = crypto.createHmac("sha256", config.razorpay.keySecret).update(body).digest("hex");
      if (expected !== razorpay_signature) {
        await prisma.donation.update({ where: { id: donationId }, data: { status: "failed" } });
        return res.status(400).json({ error: "Invalid payment signature" });
      }
    }

    await prisma.donation.update({ where: { id: donationId }, data: { paymentRef: razorpay_payment_id, status: "confirmed" } });
    res.json({ success: true, message: "Donation confirmed. Thank you!" });
  } catch {
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
