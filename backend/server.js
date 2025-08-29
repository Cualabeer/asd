import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import connectDB from "./config/db.js"; // Mongo connection
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";
import { sendEmailAlert } from "./utils/alertMailer.js";
import { sendSlackAlert } from "./utils/alertSlack.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

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
// Serve Pro Dashboard
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/dashboard", (req, res) => {
  const token = req.query.token;
  if (!token || token !== process.env.REPORT_TOKEN) {
    return res.status(401).send("Unauthorized: Invalid token");
  }
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
// Utility function to log to alerts.log
// --------------------
const logAlert = (msg) => {
  const logPath = path.join(__dirname, "logs/alerts.log");
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
};

// --------------------
// Start server
// --------------------
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    // First-time initialization report
    await logInitialization();

    // Start server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic reporting every 5 minutes
    const intervalMs = 5 * 60 * 1000;
    setInterval(async () => {
      try {
        await logInitialization(true); // 'true' = periodic
      } catch (err) {
        logAlert(`Initialization report failed: ${err.message}`);
      }
    }, intervalMs);

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    logAlert(`Startup Failure: ${err.message}`);

    // Send critical alerts
    import("./utils/alertMailer.js").then(({ sendEmailAlert }) =>
      sendEmailAlert("Backend Alert: Startup Failure", err.message)
        .catch(e => logAlert(`Email alert failed: ${e.message}`))
    );
    import("./utils/alertSlack.js").then(({ sendSlackAlert }) =>
      sendSlackAlert(`Backend failed to start:\n${err.message}`)
        .catch(e => logAlert(`Slack alert failed: ${e.message}`))
    );

    process.exit(1);
  }
};

startServer();