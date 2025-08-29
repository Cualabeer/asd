import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import connectDB from "./config/db.js"; // MongoDB connection
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
app.use(express.static("public")); // Serve dashboard HTML

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// API key protection middleware
// --------------------
const requireApiKey = (req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.REPORT_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
};

// --------------------
// Dashboard API Endpoints
// --------------------
app.get("/api/mongo/collections", requireApiKey, async (req, res) => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();
    await mongoose.disconnect();
    res.json({ collections: collections.map(c => c.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/alerts/test-email", requireApiKey, async (req, res) => {
  try {
    await sendEmailAlert("Dashboard Test Email", "This is a test email from dashboard.");
    res.send("Success");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/alerts/test-slack", requireApiKey, async (req, res) => {
  try {
    await sendSlackAlert("Dashboard Test Slack Message");
    res.send("Success");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --------------------
// Root endpoint
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
const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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