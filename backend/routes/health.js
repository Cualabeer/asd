import express from "express";
import mongoose from "mongoose";
import { sendEmailAlert } from "../utils/alertMailer.js";
import { sendSlackAlert } from "../utils/alertSlack.js";
import { requireDashboardKey } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(requireDashboardKey);

// MongoDB health
router.get("/mongo", async (req, res) => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();
    await mongoose.disconnect();
    res.json({ ok: true, collections: collections.map(c => c.name), status: "MongoDB OK" });
  } catch (err) {
    res.status(500).json({ ok: false, status: err.message });
  }
});

// Manual test alert
router.post("/test-alert", async (req, res) => {
  try {
    await sendEmailAlert("Manual Test Alert", "This is a manual test alert from dashboard.");
    await sendSlackAlert("Manual Test Alert: Slack message from dashboard.");
    res.json({ ok: true, message: "Test alert sent successfully" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;