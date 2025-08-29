import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { sendEmailAlert } from "./alertMailer.js";
import { sendSlackAlert } from "./alertSlack.js";
import mongoose from "mongoose";

dotenv.config();

export async function logInitialization(periodic = false) {
  try {
    // Ensure logs folder exists
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    // MongoDB health check
    let collectionsMsg = "";
    try {
      const db = await mongoose.connect(process.env.MONGO_URI);
      const collections = await db.connection.db.listCollections().toArray();
      collectionsMsg = collections.map(c => c.name).join(", ") || "No collections";
      await mongoose.disconnect();
    } catch (err) {
      collectionsMsg = "MongoDB health check failed";
    }

    const message = `[${new Date().toISOString()}] Backend initialization ${
      periodic ? "(periodic)" : "(startup)"
    } ✅ | Collections: ${collectionsMsg}`;

    fs.appendFileSync(path.join(logDir, "startup.log"), message + "\n");
    console.log(message);

    // Optional: Send alert only on startup
    if (!periodic) {
      try { await sendEmailAlert("Backend Init", message); } catch {}
      try { await sendSlackAlert(`Backend Init: ${message}`); } catch {}
    }
  } catch (err) {
    console.error("❌ Initialization report failed:", err.message);
    try { await sendEmailAlert("Backend Init Failed", err.message); } catch {}
    try { await sendSlackAlert(`Backend Init Failed: ${err.message}`); } catch {}
  }
}