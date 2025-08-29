import express from "express";
import Booking from "../models/Booking.js";

const router = express.Router();

// Create a booking
router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("customer", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single booking
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("customer", "name email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;