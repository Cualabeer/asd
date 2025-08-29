import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
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
// Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// --------------------
// Root Route
// --------------------
app.get("/", (req, res) => res.send("Backend API is running ✅"));

// --------------------
// Error handling
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

    // Bind to 0.0.0.0 for Render
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Run initialization report asynchronously
    import("./utils/initLogger.js").then(({ logInitialization }) => logInitialization());

  } catch (err) {
    console.error("❌ Server failed to start:", err.message);

    // Send alerts asynchronously
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