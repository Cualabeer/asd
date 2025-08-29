import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";

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
// Static Dashboard Setup
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/dashboard", (req, res) => {
  const token = req.query.token;
  if (token !== process.env.REPORT_TOKEN) {
    return res.status(401).send("Unauthorized: Invalid token");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
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

    // First-time initialization report
    await logInitialization();

    // Start server
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

    // Periodic logging every 5 minutes
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