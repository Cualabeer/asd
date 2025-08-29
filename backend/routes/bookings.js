import express from "express";
import protect from "../middleware/authMiddleware.js";
import { createBooking, getBookings, getBookingById } from "../controllers/bookingController.js";

const router = express.Router();

// All routes require login
router.use(protect);

router.post("/", createBooking);      // Create booking
router.get("/", getBookings);         // List all bookings
router.get("/:id", getBookingById);  // Get one booking

export default router;