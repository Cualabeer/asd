import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import os from "os";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard Routes
// --------------------
app.get("/api/dashboard/status", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN)
    return res.status(403).json({ message: "Forbidden" });

  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuLoad = os.loadavg();

  res.json({
    backend: "✅ Running",
    nodeVersion: process.version,
    uptime: `${Math.floor(uptime / 60)} min`,
    memory: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    cpuLoad: cpuLoad.map((x) => x.toFixed(2)),
  });
});

app.get("/api/dashboard/logs", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN)
    return res.status(403).send("Forbidden");

  const logPath = path.join(process.cwd(), "logs/startup.log");
  fs.readFile(logPath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Failed to read logs");
    res.send(data);
  });
});

// Serve HTML dashboard
app.get("/dashboard", (req, res) => {
  if (req.query.token !== process.env.REPORT_TOKEN) return res.status(403).send("Access Denied");
  res.sendFile(path.join(process.cwd(), "dashboard.html"));
});

// Root
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic initialization
    setInterval(async () => {
      await logInitialization(true);
    }, 5 * 60 * 1000);
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
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