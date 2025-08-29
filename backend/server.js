import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization, getLastReports } from "./utils/initLogger.js";
import User from "./models/userModel.js";
import Booking from "./models/bookingModel.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// Existing API routes
// --------------------
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard API routes
// --------------------
const DASHBOARD_TOKEN = process.env.REPORT_TOKEN;

function verifyToken(req, res, next) {
  const token = req.query.token;
  if (token !== DASHBOARD_TOKEN) return res.status(403).json({ error: "Forbidden" });
  next();
}

app.get("/api/dashboard/users", verifyToken, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(10);
  const count = await User.countDocuments();
  res.json({ count, recent: users });
});

app.get("/api/dashboard/bookings", verifyToken, async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(10);
  const count = await Booking.countDocuments();
  res.json({ count, recent: bookings });
});

app.get("/api/dashboard/mongo", verifyToken, async (req, res) => {
  const db = await connectDB();
  const stats = await db.connection.db.stats();
  res.json(stats);
});

app.get("/api/dashboard/logs", verifyToken, (req, res) => {
  const logPath = path.join("./logs/startup.log");
  if (!fs.existsSync(logPath)) return res.send("No logs yet");
  const logs = fs.readFileSync(logPath, "utf-8").split("\n").slice(-50).join("\n");
  res.send(logs);
});

app.get("/api/dashboard/init", verifyToken, async (req, res) => {
  const reports = await getLastReports(10);
  res.json(reports);
});

// Optional: Add email/slack alert logs if you store them
app.get("/api/dashboard/alerts/email", verifyToken, (req, res) => {
  // Implement reading last email alerts
  res.json([]);
});
app.get("/api/dashboard/alerts/slack", verifyToken, (req, res) => {
  // Implement reading last slack alerts
  res.json([]);
});

app.get("/api/dashboard/health", verifyToken, (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// --------------------
// Root route
// --------------------
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// --------------------
// Error handling
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

startServer();