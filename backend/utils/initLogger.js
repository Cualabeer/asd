import mongoose from "mongoose";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

export const logInitialization = async () => {
  console.log("\n🔹 Backend Full Initialization Report 🔹");

  // 1️⃣ Environment variables
  console.log("\n🌱 Environment Variables Loaded:");
  console.log(`- MONGO_URI: ${process.env.MONGO_URI ? "✅ loaded" : "❌ missing"}`);
  console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? "✅ loaded" : "❌ missing"}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || "not set (default: development)"}`);
  console.log(`- PORT: ${process.env.PORT || 5000}`);

  // 2️⃣ MongoDB Connection Status
  const dbState = mongoose.connection.readyState;
  const stateText = ["Disconnected", "Connected", "Connecting", "Disconnecting"][dbState];
  console.log(`\n🗄️ MongoDB Status: ${stateText}`);

  // 3️⃣ Routes overview with security
  console.log("\n🛣️ Registered Routes (Security Overview):");
  const routes = [
    { path: "/api/auth/register", type: "Public" },
    { path: "/api/auth/login", type: "Public" },
    { path: "/api/users", type: "JWT + Admin Only" },
    { path: "/api/users/:id", type: "JWT + Admin Only" },
    { path: "/api/bookings", type: "JWT Protected" },
    { path: "/api/bookings/:id", type: "JWT Protected" },
  ];
  routes.forEach((r) => console.log(` - ${r.path} → ${r.type}`));

  // 4️⃣ Collections and counts
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log("\n📂 MongoDB Collections: None (will be created on first insert)");
    } else {
      console.log("\n📂 MongoDB Collections and Document Counts:");
      for (const col of collections) {
        let count = 0;
        try {
          count = await mongoose.connection.db.collection(col.name).countDocuments();
        } catch {}
        console.log(`   - ${col.name}: ${count} document(s)`);
      }
    }
  } catch (err) {
    console.log("📂 MongoDB Collections: Unable to list (maybe not connected yet)");
  }

  // 5️⃣ Users breakdown by role
  try {
    const roles = ["customer", "mechanic", "garage", "admin"];
    console.log("\n👤 Users Breakdown by Role:");
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      console.log(` - ${role}: ${count}`);
    }
    const totalUsers = await User.countDocuments();
    console.log(`Total Users: ${totalUsers}`);
  } catch (err) {
    console.log("⚠️ Unable to fetch users breakdown:", err.message);
  }

  // 6️⃣ Bookings summary
  try {
    const totalBookings = await Booking.countDocuments();
    console.log(`\n📅 Bookings Summary:`);
    console.log(` - Total Bookings: ${totalBookings}`);
    if (totalBookings > 0) {
      const recentBooking = await Booking.findOne().sort({ createdAt: -1 }).populate("customer", "name email");
      console.log(` - Most Recent Booking: ${recentBooking.vehicleDetails} by ${recentBooking.customer.name} on ${recentBooking.date}`);
    }
  } catch (err) {
    console.log("⚠️ Unable to fetch bookings summary:", err.message);
  }

  // 7️⃣ First-time initialization message
  console.log("\n🚀 Server is ready for first requests!\n");
};