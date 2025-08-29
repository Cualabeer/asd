import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUsers, getUserById } from "../controllers/userController.js";

const router = express.Router();

// Protect all routes — user must be logged in
router.use(protect);

router.get("/", getUsers);         // Admin-only list
router.get("/:id", getUserById);  // Get a single user

export default router;