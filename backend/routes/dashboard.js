import express from 'express';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Mechanic from '../models/Mechanic.js'; // if exists
import mongoose from 'mongoose';

const router = express.Router();

// Middleware for token access
router.use((req, res, next) => {
  if (req.query.token !== process.env.REPORT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// GET /api/dashboard/status
router.get('/status', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const bookings = await Booking.countDocuments();
    const mechanics = Mechanic ? await Mechanic.countDocuments() : 0;

    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const backendStatus = 'Running';

    res.json({ backend: backendStatus, mongo: mongoStatus, users, bookings, mechanics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/stats-trend
router.get('/stats-trend', async (req, res) => {
  try {
    const labels = [];
    const users = [];
    const bookings = [];
    const mechanicsData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().slice(0,10);
      labels.push(day);

      users.push(await User.countDocuments({ createdAt: { $gte: new Date(day) } }));
      bookings.push(await Booking.countDocuments({ createdAt: { $gte: new Date(day) } }));
      mechanicsData.push(Mechanic ? await Mechanic.countDocuments({ createdAt: { $gte: new Date(day) } }) : 0);
    }

    res.json({ labels, users, bookings, mechanics: mechanicsData });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = './logs/alerts.log';
    if (!fs.existsSync(path)) return res.send('No alerts logged.');
    const content = fs.readFileSync(path, 'utf8');
    res.send(content);
  } catch(err) { res.status(500).send(err.message); }
});

export default router;