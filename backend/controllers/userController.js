import User from "../models/User.js";

// Get all users — admin only
export const getUsers = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const users = await User.find().select("-password");
  res.json(users);
};

// Get a single user by ID
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};