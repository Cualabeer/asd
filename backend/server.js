import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js"; // Mongo connection
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"; // error middleware
import { logInitialization, getLastInitReport } from "./utils/initLogger.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

dotenv.config();

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
// Root Route (with summary)
// --------------------
app.get("/", async (req, res) => {
  const report = getLastInitReport(); // grab last recorded report
  const memoryUsage = process.memoryUsage();

  const summary = {
    db: report?.db?.status || "Unknown",
    uptime: `${Math.floor(process.uptime())}s`,
    memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    timestamp: report?.timestamp || new Date().toISOString(),
  };

  res.send(`
    <h1>Backend API is running ✅</h1>
    <h3>System Summary</h3>
    <ul>
      <li>Database: ${summary.db}</li>
      <li>Uptime: ${summary.uptime}</li>
      <li>Memory: ${summary.memory}</li>
      <li>Last Report: ${summary.timestamp}</li>
    </ul>
    <p>For full details visit <a href="/report">/report</a></p>
  `);
});

// --------------------
// Debug Report Route
// --------------------
app.get("/report", (req, res) => {
  const report = getLastInitReport();
  if (!report) {
    return res.status(404).json({ message: "No report available yet" });
  }
  res.json(report);
});

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

    // First-time initialization report
    await logInitialization();

    // Start server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic reporting every 5 minutes
    const intervalMs = 5 * 60 * 1000;
    setInterval(async () => {
      await logInitialization(true); // 'true' = periodic report
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