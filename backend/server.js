import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { logInitialization } from "./utils/initLogger.js";
import { sendEmailAlert } from "./utils/alertMailer.js";
import { sendSlackAlert } from "./utils/alertSlack.js";

// For __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// Routes (example placeholders)
// --------------------
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Dashboard routes
// --------------------
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "utils/dashboard.html"));
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = (await db.listCollections().toArray()).map(c => c.name);

    // Test alerts
    let email = false, slack = false;
    try { await sendEmailAlert("Dashboard Test", "Testing email alert"); email = true; } catch {}
    try { await sendSlackAlert("Dashboard Test"); slack = true; } catch {}

    res.json({ backend: true, collections, email, slack });
  } catch (err) {
    res.json({ backend: false, collections: [], email: false, slack: false });
  }
});

// --------------------
// Root route
// --------------------
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// --------------------
// Error handling (optional)
// --------------------
app.use((req, res, next) => res.status(404).json({ message: "Not found" }));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

// --------------------
// Connect to MongoDB & start server
// --------------------
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();

    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));

    // Periodic initialization logging
    setInterval(() => logInitialization(true), 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    try { await sendEmailAlert("Backend Startup Failure", err.message); } catch {}
    try { await sendSlackAlert(`Backend failed to start: ${err.message}`); } catch {}
    process.exit(1);
  }
};

startServer();