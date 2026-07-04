import express from "express";
import cors from "cors";
import { config } from "./config";

import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import registrationRoutes from "./routes/registrations";
import resultRoutes from "./routes/results";
import reviewRoutes from "./routes/reviews";
import photoRoutes from "./routes/photos";
import certificateRoutes from "./routes/certificates";
import notificationRoutes from "./routes/notifications";
import organiserRoutes from "./routes/organiser";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";
import fundraisingRoutes from "./routes/fundraising";

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api", resultRoutes); // /api/events/:id/results
app.use("/api/events", reviewRoutes); // /api/events/:id/reviews
app.use("/api/events", photoRoutes); // /api/events/:id/photos
app.use("/api/certificates", certificateRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/organiser", organiserRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", profileRoutes);
app.use("/api", fundraisingRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "MYMove API", version: "1.0.0" });
});

// Start server
app.listen(config.port, () => {
  console.log(`\n  MYMove API running at http://localhost:${config.port}`);
  console.log(`  Health check: http://localhost:${config.port}/api/health\n`);
});

export default app;
