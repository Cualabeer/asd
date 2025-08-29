import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBooking,
  deleteBooking
} from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('customer'), createBooking);
router.get('/my', protect, authorizeRoles('customer'), getMyBookings);
router.get('/assigned', protect, authorizeRoles('garage'), getAllBookings);
router.get('/all', protect, authorizeRoles('admin'), getAllBookings);
router.put('/:id', protect, authorizeRoles('garage','admin'), updateBooking);
router.delete('/:id', protect, authorizeRoles('admin'), deleteBooking);

export default router;