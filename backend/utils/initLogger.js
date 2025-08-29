import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

dotenv.config();

const LOG_FILE = path.join(process.cwd(), "logs/backend.log");

/**
 * Logs initialization info to console, file, and dashboard.
 * @param {boolean} periodic - true if this is a periodic report
 */
export async function logInitialization(periodic = false) {
  try {
    // 1️⃣ Log to console
    console.log(
      periodic
        ? "🕒 Periodic initialization report running..."
        : "🚀 First-time initialization report running..."
    );

    // 2️⃣ Log to file
    const logMessage = `${new Date().toISOString()} - ${
      periodic ? "Periodic" : "Initial"
    } report\n`;
    fs.appendFileSync(LOG_FILE, logMessage);

    // 3️⃣ Fetch MongoDB collections
    const db = await mongoose.connect(process.env.MONGO_URI);
    const collections = await db.connection.db.listCollections().toArray();
    await mongoose.disconnect();

    const collectionNames = collections.map((c) => c.name);
    const collectionLog = `${new Date().toISOString()} - Collections: ${collectionNames.join(
      ", "
    )}\n`;
    fs.appendFileSync(LOG_FILE, collectionLog);

    console.log("✅ Collections:", collectionNames.join(", "));

    // 4️⃣ Report to dashboard API (secured by REPORT_TOKEN)
    if (process.env.REPORT_TOKEN) {
      try {
        await fetch(`http://localhost:${process.env.PORT}/api/mongo/collections`, {
          headers: { "x-api-key": process.env.REPORT_TOKEN },
        });
        console.log("✅ Dashboard notified successfully");
      } catch (err) {
        console.error("❌ Failed to notify dashboard:", err.message);
      }
    }

  } catch (err) {
    console.error("❌ Initialization report failed:", err.message);
  }
}