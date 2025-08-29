import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import connectDB from "./config/db.js"; // Mongo connection
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"; // error middleware
import { logInitialization } from "./utils/initLogger.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";
import dashboardRoutes from "./routes/dashboard.js";

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
app.use("/api/dashboard", dashboardRoutes);

// --------------------
// Serve static frontend
// --------------------
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => 
  res.sendFile(path.join(process.cwd(), "public/index.html"))
);

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
      try {
        await logInitialization(true); // 'true' = periodic report
        console.log("🕒 Periodic initialization report completed");
      } catch (err) {
        console.error("❌ Periodic report failed:", err.message);
      }
    }, intervalMs);

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);

    // Send critical alerts asynchronously
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