import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";
import { sendEmailAlert } from "./utils/alertMailer.js";
import { sendSlackAlert } from "./utils/alertSlack.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard APIs
// --------------------

// List MongoDB collections
app.get("/api/collections", async (req, res) => {
  const token = req.query.token;
  if (token !== process.env.REPORT_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    const mongoose = (await import("mongoose")).default;
    await connectDB();
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections.map(c => c.name));
    await mongoose.disconnect();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test alerts (email + Slack)
app.post("/api/test-alert", async (req, res) => {
  const token = req.query.token;
  if (token !== process.env.REPORT_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sendEmailAlert("Backend Test Alert", "This is a test email from the dashboard.");
    await sendSlackAlert("Backend Test Alert: Slack message sent from dashboard.");
    res.json({ success: true, message: "Alerts sent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve dashboard HTML
app.get("/dashboard", (req, res) => {
  const token = req.query.token;
  if (token !== process.env.REPORT_TOKEN) return res.status(401).send("Unauthorized");
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// --------------------
// Root Route
// --------------------
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// --------------------
// Error handling middleware
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// MongoDB connection & server start
// --------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic initialization reporting every 5 minutes
    setInterval(async () => {
      await logInitialization(true);
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    await sendEmailAlert("Backend Alert: Startup Failure", err.message).catch(() => {});
    await sendSlackAlert(`Backend failed to start:\n${err.message}`).catch(() => {});
    process.exit(1);
  }
};

startServer();