// server.js
import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { logInitialization } from "./utils/initLogger.js";
import { sendEmailAlert } from "./utils/alertMailer.js";
import { sendSlackAlert } from "./utils/alertSlack.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "/")));

// --------------------
// API Routes
// --------------------
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard & Root
// --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dashboard.html"));
});

// --------------------
// Health check endpoint
// --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --------------------
// MongoDB connection & server start
// --------------------
const startServer = async () => {
  try {
    await connectDB();
    await logInitialization(); // startup log

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // periodic logging every 5 mins
    setInterval(async () => {
      await logInitialization(true);
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);

    // send critical alerts
    try { await sendEmailAlert("Backend Alert: Startup Failure", err.message); } catch {}
    try { await sendSlackAlert(`Backend failed to start:\n${err.message}`); } catch {}

    process.exit(1);
  }
};

startServer();