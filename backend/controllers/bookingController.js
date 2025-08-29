import Booking from "../models/Booking.js";

export const createBooking = async (req, res) => {
  const { vehicleDetails, serviceType, date } = req.body;
  const booking = await Booking.create({
    customer: req.user._id,
    vehicleDetails,
    serviceType,
    date,
  });
  res.status(201).json(booking);
};

export const getBookings = async (req, res) => {
  const bookings = await Booking.find().populate("customer", "name email");
  res.json(bookings);
};

export const getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("customer", "name email");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};