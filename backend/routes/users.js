import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getUsers, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('admin'), getUsers);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

export default router;