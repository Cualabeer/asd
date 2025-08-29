import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

import connectDB from "./config/db.js"; // Mongo connection
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";
import { User } from "./models/User.js";
import { Booking } from "./models/Booking.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard / Admin API
// --------------------
const LOG_FILE = path.join(process.cwd(), "logs/backend.log");

function checkApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key !== process.env.REPORT_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/mongo/collections", checkApiKey, async (req, res) => {
  const collections = await (await mongoose.connection.db.listCollections().toArray()).map(c => c.name);
  res.json({ collections });
});

app.get("/logs", checkApiKey, (req, res) => {
  if (!fs.existsSync(LOG_FILE)) return res.json({ logs: "No log file yet" });
  const logs = fs.readFileSync(LOG_FILE, "utf-8");
  res.type("text/plain").send(logs);
});

app.get("/api/stats/users", checkApiKey, async (req, res) => {
  const total = await User.countDocuments();
  const active = await User.countDocuments({ isActive: true });
  res.json({ total, active });
});

app.get("/api/stats/bookings", checkApiKey, async (req, res) => {
  const total = await Booking.countDocuments();
  const upcoming = await Booking.countDocuments({ date: { $gte: new Date() } });
  res.json({ total, upcoming });
});

app.post("/api/alerts/test-email", checkApiKey, async (req, res) => {
  const { sendEmailAlert } = await import("./utils/alertMailer.js");
  await sendEmailAlert("Test Alert", "This is a test email from dashboard.");
  res.json({ message: "Email sent" });
});

app.post("/api/alerts/test-slack", checkApiKey, async (req, res) => {
  const { sendSlackAlert } = await import("./utils/alertSlack.js");
  await sendSlackAlert("Test Slack message from dashboard.");
  res.json({ message: "Slack sent" });
});

// --------------------
// Root Route
// --------------------
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// --------------------
// Error handling
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Server start
// --------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // First-time initialization report
    await logInitialization();

    // Start server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic reporting every 5 minutes
    const intervalMs = 5 * 60 * 1000;
    setInterval(async () => {
      await logInitialization(true);
    }, intervalMs);
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);

    // Send critical alerts
    import("./utils/alertMailer.js").then(({ sendEmailAlert }) =>
      sendEmailAlert("Backend Alert: Startup Failure", err.message)
    );
    import("./utils/alertSlack.js").then(({ sendSlackAlert }) =>
      sendSlackAlert(`Backend failed to start:\n${err.message}`)
    );

    process.exit(1);
  }
};

startServer();