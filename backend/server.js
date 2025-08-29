import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js"; // MongoDB connection
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"; // error middleware
import { logInitialization } from "./utils/initLogger.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

// Utils for alerts
import { sendEmailAlert } from "./utils/alertMailer.js";
import { sendSlackAlert } from "./utils/alertSlack.js";

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
// Serve Dashboard (root)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html")); // single-file dashboard
});

// Optional: restrict dashboard by REPORT_TOKEN
app.get("/dashboard", (req, res) => {
  const token = req.query.token;
  if (token !== process.env.REPORT_TOKEN) {
    return res.status(403).send("❌ Forbidden: invalid token");
  }
  res.sendFile(path.join(__dirname, "dashboard.html"));
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
    try {
      await sendEmailAlert("Backend Alert: Startup Failure", err.message);
      await sendSlackAlert(`Backend failed to start:\n${err.message}`);
    } catch (alertErr) {
      console.error("❌ Alert sending failed:", alertErr.message);
    }

    process.exit(1);
  }
};

startServer();