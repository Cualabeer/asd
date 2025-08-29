import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { logInitialization } from "./utils/initLogger.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookingRoutes from "./routes/bookings.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// Health check & dashboard route
app.get("/", (req, res) => res.sendFile(`${process.cwd()}/index.html`));
app.get("/api/health", (req, res) => res.json({ status: "✅ Backend running" }));

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    await logInitialization();
    app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server failed to start:", err.message);
    process.exit(1);
  }
};

startServer();