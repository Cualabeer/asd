import mongoose from "mongoose";

export const logInitialization = async () => {
  console.log("\n🔹 Backend Initialization Summary 🔹");

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

  // 3️⃣ Registered Routes
  console.log("\n🛣️ Registered Routes:");
  console.log(" - /api/auth  (Register/Login)");
  console.log(" - /api/users  (Admin Only)");
  console.log(" - /api/bookings  (Protected)");

  // 4️⃣ Collections
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log("\n📂 MongoDB Collections: None (will be created on first insert)");
    } else {
      console.log("\n📂 MongoDB Collections:");
      collections.forEach((col) => console.log(`   - ${col.name}`));
    }
  } catch (err) {
    console.log("📂 MongoDB Collections: Unable to list (maybe not connected yet)");
  }

  // 5️⃣ First-time initialization message
  console.log("\n🚀 Server is ready for first requests!\n");
};